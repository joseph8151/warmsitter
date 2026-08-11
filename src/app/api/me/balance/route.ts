import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { hasActiveTicket } from "@/lib/billing";
import { getExpiryStatus } from "@/lib/notifications";

export const dynamic = "force-dynamic";

// Everything the balance widget / expiry banner needs in one call.
export async function GET() {
  try {
    const user = await requireUser();
    const expiry = await getExpiryStatus(user.id);
    return json({
      creditBalance: user.creditBalance,
      ticketExpiresAt: user.ticketExpiresAt,
      hasActiveTicket: hasActiveTicket(user),
      isPremium: user.isPremium,
      expiry,
    });
  } catch (err) {
    return handleError(err);
  }
}
