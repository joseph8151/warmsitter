import { handleError, json } from "@/lib/api";
import { runExpiryNotifications } from "@/lib/notifications";

// Daily cron target (e.g. Vercel Cron). Protect with a shared secret header.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const secret = process.env.CRON_SECRET;
    if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
      return json({ error: "UNAUTHORIZED" }, 401);
    }
    const sent = await runExpiryNotifications();
    return json({ ok: true, count: sent.length, sent });
  } catch (err) {
    return handleError(err);
  }
}
