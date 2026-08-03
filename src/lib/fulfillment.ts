import { Prisma, type Payment } from "@prisma/client";
import { prisma } from "./prisma";
import { addCredits, grantTicket } from "./billing";
import { getSettings } from "./settings";
import { notify } from "./notify";
import type { CreditPackage } from "./types";

// -----------------------------------------------------------------------------
// Fulfillment: apply the side effects of a *successful* payment exactly once.
//
// Called from both the confirm endpoint and the webhook, so it MUST be
// idempotent — we guard on Payment.status transitioning PENDING -> PAID inside
// a transaction.
// -----------------------------------------------------------------------------

export async function fulfillPayment(paymentId: string): Promise<Payment> {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } });

    // Idempotency guard: only fulfill a PENDING payment once.
    if (payment.status !== "PENDING") return payment;

    const paid = await tx.payment.update({
      where: { id: paymentId },
      data: { status: "PAID" },
    });

    switch (payment.purpose) {
      case "CREDIT_PACK": {
        const settings = await getSettings();
        const pkg = (settings.creditPackages as CreditPackage[]).find(
          (p) => p.price === payment.amount
        );
        const credits = pkg?.credits ?? Math.floor(payment.amount / 2000);
        await addCredits({
          userId: payment.userId,
          amount: credits,
          type: "PURCHASE",
          reason: `Credit pack (${payment.orderId})`,
          paymentId: payment.id,
          tx,
        });
        break;
      }

      case "TICKET": {
        const settings = await getSettings();
        await grantTicket({
          userId: payment.userId,
          durationDays: settings.ticketDurationDays,
          pricePaid: payment.amount,
          paymentId: payment.id,
          tx,
        });
        break;
      }

      case "SUBSCRIPTION": {
        if (payment.subscriptionId) {
          await tx.subscription.update({
            where: { id: payment.subscriptionId },
            data: { status: "ACTIVE" },
          });
          await tx.user.update({
            where: { id: payment.userId },
            data: { isPremium: true },
          });
        }
        break;
      }

      case "CARE_FEE": {
        // Create the sitter settlement (pending) from the fee split we stored
        // when the payment was created.
        if (payment.jobId && payment.sitterPayout != null && payment.platformFee != null) {
          const job = await tx.jobPost.findUnique({ where: { id: payment.jobId } });
          const sitterId = job?.matchedSitterId;
          if (sitterId) {
            await tx.settlement.upsert({
              where: { paymentId: payment.id },
              create: {
                paymentId: payment.id,
                sitterId,
                jobId: payment.jobId,
                grossAmount: payment.careFee ?? payment.amount,
                platformFee: payment.platformFee,
                netAmount: payment.sitterPayout,
                status: "PENDING",
              },
              update: {},
            });
            await tx.jobPost.update({
              where: { id: payment.jobId },
              data: { status: "COMPLETED" },
            });
            await notify(
              {
                userId: sitterId,
                type: "SETTLEMENT_PAID",
                title: "정산이 등록되었어요 💰",
                body: `돌봄비 결제가 완료되어 ${(payment.sitterPayout ?? 0).toLocaleString("ko-KR")}원 정산이 대기 중입니다.`,
                link: "/dashboard",
              },
              tx
            );
          }
        }
        break;
      }
    }

    return paid;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

// Mark a payment failed/canceled (from webhook).
export async function markPaymentStatus(
  paymentId: string,
  status: "CANCELED" | "FAILED" | "REFUNDED"
): Promise<void> {
  await prisma.payment.update({ where: { id: paymentId }, data: { status } });
}
