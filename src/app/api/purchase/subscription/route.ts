import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { newOrderId } from "@/lib/toss";

// Create (or reuse) a subscription record and a PENDING payment for the first
// month's charge. In production you'd issue a billingKey via the Toss billing
// widget; here we charge the first period and mark the sub ACTIVE on fulfill.
export async function POST() {
  try {
    const user = await requireUser();
    const settings = await getSettings();

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const sub = await prisma.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        plan: "PREMIUM_MONTHLY",
        status: "PAST_DUE", // becomes ACTIVE once paid
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        customerKey: user.id,
      },
      update: {
        status: "PAST_DUE",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
    });

    const orderId = newOrderId("sub");
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        purpose: "SUBSCRIPTION",
        status: "PENDING",
        orderId,
        amount: settings.premiumMonthlyPrice,
        subscriptionId: sub.id,
      },
    });

    return json({
      paymentId: payment.id,
      orderId,
      amount: settings.premiumMonthlyPrice,
      orderName: "warm sitter · 프리미엄 멤버십 (월)",
      customerName: user.name,
      customerKey: user.id,
      clientKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "",
    });
  } catch (err) {
    return handleError(err);
  }
}
