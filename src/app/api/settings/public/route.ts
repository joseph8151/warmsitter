import { handleError, json } from "@/lib/api";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

// Public pricing info for the purchase modal / pricing page.
export async function GET() {
  try {
    const s = await getSettings();
    return json({
      ticketPrice: s.ticketPrice,
      ticketDurationDays: s.ticketDurationDays,
      creditPackages: s.creditPackages,
      actionCosts: s.actionCosts,
      premiumMonthlyPrice: s.premiumMonthlyPrice,
      feeRatePercent: s.feeRateBps / 100,
      clientKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "",
    });
  } catch (err) {
    return handleError(err);
  }
}
