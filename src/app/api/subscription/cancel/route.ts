import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";

// Cancel at period end: the user keeps premium until currentPeriodEnd, then the
// renewal cron expires it and drops the premium flag.
export async function POST() {
  try {
    const user = await requireUser();
    const sub = await prisma.subscription.findUnique({ where: { userId: user.id } });
    if (!sub) return json({ error: "NO_SUBSCRIPTION" }, 404);

    const updated = await prisma.subscription.update({
      where: { id: sub.id },
      data: { cancelAtPeriodEnd: true },
    });
    return json({
      status: updated.status,
      cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
      currentPeriodEnd: updated.currentPeriodEnd,
    });
  } catch (err) {
    return handleError(err);
  }
}
