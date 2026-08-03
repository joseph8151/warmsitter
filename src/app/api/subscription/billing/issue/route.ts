import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";

// Prepare a recurring-billing registration: ensure a Subscription row exists
// with a customerKey, then return the params for the Toss billing-auth widget.
export async function POST() {
  try {
    const user = await requireUser();
    const now = new Date();

    const sub = await prisma.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        plan: "PREMIUM_MONTHLY",
        status: "PAST_DUE", // becomes ACTIVE after the first charge
        customerKey: user.id,
        currentPeriodStart: now,
        currentPeriodEnd: now, // charged immediately on confirm
      },
      update: { customerKey: user.id, cancelAtPeriodEnd: false },
    });

    return json({
      customerKey: sub.customerKey,
      clientKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "",
    });
  } catch (err) {
    return handleError(err);
  }
}
