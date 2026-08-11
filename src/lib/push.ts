import webpush from "web-push";
import { prisma } from "./prisma";

// -----------------------------------------------------------------------------
// Web Push (VAPID). Best-effort: never throws to the caller. Feature-flagged on
// the presence of VAPID keys, so the app runs fine without push configured.
// -----------------------------------------------------------------------------

export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:admin@warmsitter.test";

export const isPushEnabled = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

let configured = false;
function ensureConfigured() {
  if (!configured && isPushEnabled) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    configured = true;
  }
}

export interface PushPayload {
  title: string;
  body?: string;
  link?: string;
}

// Send a push to every subscription a user has. Prunes dead subscriptions
// (410 Gone / 404) so the table stays clean.
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!isPushEnabled) return;
  ensureConfigured();

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return;

  const body = JSON.stringify(payload);
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) {
          await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        } else {
          // eslint-disable-next-line no-console
          console.error("[push] send failed", status);
        }
      }
    })
  );
}
