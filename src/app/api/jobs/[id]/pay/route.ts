import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSettings, computeFeeSplit } from "@/lib/settings";
import { newOrderId } from "@/lib/toss";
import { payCareSchema } from "@/lib/schemas";

// -----------------------------------------------------------------------------
// Step 5 of the flow: parent pays for the completed care.
//
// careFee     = hourlyRate * hours (agreed in chat, or approved work log)
// platformFee = careFee * feeRateBps  (transaction fee, default 10%)
// sitterPayout = careFee - platformFee
//
// We create a PENDING CARE_FEE payment with the split stored, and return Toss
// checkout params. When the payment succeeds, fulfillment creates the
// Settlement (status PENDING) for the sitter payout.
// -----------------------------------------------------------------------------

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const body = payCareSchema.parse({ ...(await req.json()), jobId: params.id });

    const job = await prisma.jobPost.findUnique({ where: { id: params.id } });
    if (!job) return json({ error: "JOB_NOT_FOUND" }, 404);
    if (job.parentId !== user.id) return json({ error: "FORBIDDEN" }, 403);
    if (!job.matchedSitterId) return json({ error: "NO_MATCHED_SITTER" }, 400);

    // Resolve rate & hours: explicit override -> job agreement -> approved work logs.
    const hourlyRate =
      body.hourlyRate ??
      job.agreedRate ??
      (await sitterRate(job.matchedSitterId));
    const hours =
      body.hours ??
      job.agreedHours ??
      (await approvedHours(job.id)) ??
      job.hoursPerSession;

    if (!hourlyRate || !hours) {
      return json({ error: "MISSING_RATE_OR_HOURS", message: "Agree a rate and hours first" }, 400);
    }

    const careFee = Math.round(hourlyRate * hours);
    const settings = await getSettings();
    const { platformFee, sitterPayout, feeRateBps } = computeFeeSplit(careFee, settings.feeRateBps);

    const orderId = newOrderId("care");
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        purpose: "CARE_FEE",
        status: "PENDING",
        orderId,
        amount: careFee,
        careFee,
        platformFee,
        feeRateBps,
        sitterPayout,
        jobId: job.id,
      },
    });

    return json({
      paymentId: payment.id,
      orderId,
      amount: careFee,
      breakdown: {
        hourlyRate,
        hours,
        careFee,
        platformFee,
        feeRatePercent: feeRateBps / 100,
        sitterPayout,
      },
      orderName: `warm sitter · 돌봄비 결제`,
      customerName: user.name,
      clientKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "",
    });
  } catch (err) {
    return handleError(err);
  }
}

async function sitterRate(sitterId: string): Promise<number | null> {
  const p = await prisma.sitterProfile.findUnique({ where: { userId: sitterId } });
  return p?.hourlyRate ?? null;
}

async function approvedHours(jobId: string): Promise<number | null> {
  const logs = await prisma.workLog.findMany({
    where: { jobId, status: { in: ["SUBMITTED", "APPROVED"] } },
  });
  if (logs.length === 0) return null;
  return logs.reduce((sum, l) => sum + l.hours, 0);
}
