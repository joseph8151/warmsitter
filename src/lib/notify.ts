import type { NotificationType, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";
import { isPushEnabled, sendPushToUser } from "./push";
import { isEmailEnabled, notificationEmailHtml, sendEmail, shouldEmail } from "./email";

type Tx = Prisma.TransactionClient | PrismaClient;

// Create an in-app notification. Best-effort: never let a notification failure
// break the primary action, so callers can `void notify(...)` or await + ignore.
export async function notify(
  params: {
    userId: string;
    type: NotificationType;
    title: string;
    body?: string;
    link?: string;
  },
  client: Tx = prisma
): Promise<void> {
  try {
    await client.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        link: params.link,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[notify] failed", err);
  }

  // Fan out to push + email, honoring the user's channel preferences. Skip the
  // extra lookup entirely when neither channel is configured globally.
  if (!isPushEnabled && !isEmailEnabled) return;

  try {
    const recipient = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { email: true, emailNotifications: true, pushNotifications: true },
    });
    if (!recipient) return;

    // Web push (best-effort; no-op when unconfigured or opted out).
    if (recipient.pushNotifications) {
      await sendPushToUser(params.userId, {
        title: params.title,
        body: params.body,
        link: params.link,
      }).catch(() => {});
    }

    // Email for important types (best-effort; skip synthetic demo addresses).
    if (
      recipient.emailNotifications &&
      shouldEmail(params.type) &&
      recipient.email &&
      !recipient.email.endsWith("@users.warmsitter")
    ) {
      await sendEmail({
        to: recipient.email,
        subject: params.title,
        html: notificationEmailHtml({ title: params.title, body: params.body, link: params.link }),
        text: params.body ?? params.title,
      }).catch(() => {});
    }
  } catch {
    /* best-effort — never break the primary action */
  }
}
