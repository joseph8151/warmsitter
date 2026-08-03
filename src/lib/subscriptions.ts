import type { Subscription } from "@prisma/client";
import { prisma } from "./prisma";
import { getSettings } from "./settings";
import { chargeBillingKey, newOrderId, TossError } from "./toss";

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Charge a subscription's stored billing key for one month and extend the
 * period. Records a PAID Payment (purpose SUBSCRIPTION) and marks the user
 * premium. On a Toss failure, marks the subscription PAST_DUE and returns ok:false.
 *
 * Used for both the first charge (after billing-key issuance) and monthly
 * renewals from the cron.
 */
export async function chargeAndExtend(
  sub: Subscription,
  opts: { first?: boolean } = {}
): Promise<{ ok: boolean; error?: string }> {
  if (!sub.billingKey || !sub.customerKey) {
    return { ok: false, error: "NO_BILLING_KEY" };
  }
  const settings = await getSettings();
  const amount = settings.premiumMonthlyPrice;
  const orderId = newOrderId("sub");

  // Create the pending payment first so the charge is traceable.
  const payment = await prisma.payment.create({
    data: {
      userId: sub.userId,
      purpose: "SUBSCRIPTION",
      status: "PENDING",
      orderId,
      amount,
      subscriptionId: sub.id,
    },
  });

  try {
    const result = await chargeBillingKey({
      billingKey: sub.billingKey,
      customerKey: sub.customerKey,
      amount,
      orderId,
      orderName: opts.first
        ? "warm sitter · 프리미엄 멤버십 (첫 결제)"
        : "warm sitter · 프리미엄 멤버십 (정기결제)",
    });

    const now = new Date();
    // Extend from the later of now / current period end (no lost days).
    const base = sub.currentPeriodEnd > now ? sub.currentPeriodEnd : now;
    const periodStart = opts.first ? now : sub.currentPeriodEnd;
    const periodEnd = new Date(base.getTime() + MONTH_MS);

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: "PAID", paymentKey: result.paymentKey, method: result.method, rawWebhook: result as object },
      }),
      prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "ACTIVE", currentPeriodStart: periodStart, currentPeriodEnd: periodEnd },
      }),
      prisma.user.update({ where: { id: sub.userId }, data: { isPremium: true } }),
    ]);

    return { ok: true };
  } catch (err) {
    const message = err instanceof TossError ? err.message : "charge failed";
    await prisma.$transaction([
      prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } }),
      prisma.subscription.update({ where: { id: sub.id }, data: { status: "PAST_DUE" } }),
    ]);
    return { ok: false, error: message };
  }
}

/**
 * Cron entrypoint: renew every subscription whose period has ended.
 * - cancelAtPeriodEnd -> expire (drop premium).
 * - otherwise -> charge the billing key and extend.
 */
export async function runSubscriptionRenewals(now = new Date()): Promise<{
  renewed: number;
  expired: number;
  failed: number;
}> {
  const due = await prisma.subscription.findMany({
    where: { status: { in: ["ACTIVE", "PAST_DUE"] }, currentPeriodEnd: { lte: now } },
    take: 200,
  });

  let renewed = 0;
  let expired = 0;
  let failed = 0;

  for (const sub of due) {
    if (sub.cancelAtPeriodEnd) {
      await prisma.$transaction([
        prisma.subscription.update({ where: { id: sub.id }, data: { status: "EXPIRED" } }),
        prisma.user.update({ where: { id: sub.userId }, data: { isPremium: false } }),
      ]);
      expired++;
      continue;
    }
    const res = await chargeAndExtend(sub);
    if (res.ok) renewed++;
    else failed++;
  }

  return { renewed, expired, failed };
}
