import { handleError, json } from "@/lib/api";
import { runBookingReminders } from "@/lib/bookings";

// Daily cron: remind parties before confirmed bookings and auto-complete past
// ones. Secured by CRON_SECRET (sent by Vercel Cron as a Bearer token).
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  try {
    const secret = process.env.CRON_SECRET;
    if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
      return json({ error: "UNAUTHORIZED" }, 401);
    }
    const result = await runBookingReminders();
    return json({ ok: true, ...result });
  } catch (err) {
    return handleError(err);
  }
}
