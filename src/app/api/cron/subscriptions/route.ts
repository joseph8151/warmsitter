import { handleError, json } from "@/lib/api";
import { runSubscriptionRenewals } from "@/lib/subscriptions";

// Daily cron: charge due premium subscriptions and expire canceled ones.
// Secured by CRON_SECRET (Vercel Cron sends it as a Bearer token).
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  try {
    const secret = process.env.CRON_SECRET;
    if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
      return json({ error: "UNAUTHORIZED" }, 401);
    }
    const result = await runSubscriptionRenewals();
    return json({ ok: true, ...result });
  } catch (err) {
    return handleError(err);
  }
}
