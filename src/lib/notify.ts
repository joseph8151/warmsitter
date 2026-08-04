import type { NotificationType, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";
import { sendPushToUser } from "./push";
import { notificationEmailHtml, sendEmail, shouldEmail } from "./email";

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

  // Also deliver as a web push (best-effort; no-op when push isn't configured).
  await sendPushToUser(params.userId, {
    title: params.title,
    body: params.body,
    link: params.link,
  }).catch(() => {});

  // And, for important types, as an email (best-effort; no-op when unconfigured).
  if (shouldEmail(params.type)) {
    try {
      const recipient = await prisma.user.findUnique({
        where: { id: params.userId },
        select: { email: true },
      });
      if (recipient?.email && !recipient.email.endsWith("@users.warmsitter")) {
        await sendEmail({
          to: recipient.email,
          subject: params.title,
          html: notificationEmailHtml({ title: params.title, body: params.body, link: params.link }),
          text: params.body ?? params.title,
        });
      }
    } catch {
      /* best-effort */
    }
  }
}
