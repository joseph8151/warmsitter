import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Current subscription status for the logged-in user.
export async function GET() {
  try {
    const user = await requireUser();
    const sub = await prisma.subscription.findUnique({ where: { userId: user.id } });
    return json({
      isPremium: user.isPremium,
      subscription: sub
        ? {
            status: sub.status,
            currentPeriodEnd: sub.currentPeriodEnd,
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
            hasBillingKey: Boolean(sub.billingKey),
          }
        : null,
    });
  } catch (err) {
    return handleError(err);
  }
}
