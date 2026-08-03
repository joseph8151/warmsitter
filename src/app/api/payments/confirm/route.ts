import { NextResponse } from "next/server";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { confirmPayment } from "@/lib/toss";
import { fulfillPayment } from "@/lib/fulfillment";

// -----------------------------------------------------------------------------
// Toss success redirect target: GET /api/payments/confirm?paymentKey&orderId&amount
//
// We look up our PENDING payment by orderId, verify the amount matches what we
// created (anti-tampering), confirm with Toss using the secret key, then run
// fulfillment (grant credits/ticket/subscription or create the settlement).
// On success we redirect the browser to a friendly result page.
// -----------------------------------------------------------------------------

export async function GET(req: Request) {
  const url = new URL(req.url);
  const paymentKey = url.searchParams.get("paymentKey");
  const orderId = url.searchParams.get("orderId");
  const amount = Number(url.searchParams.get("amount"));
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? url.origin;

  try {
    if (!paymentKey || !orderId || !Number.isFinite(amount)) {
      return json({ error: "MISSING_PARAMS" }, 400);
    }

    const payment = await prisma.payment.findUnique({ where: { orderId } });
    if (!payment) return json({ error: "ORDER_NOT_FOUND" }, 404);

    // Anti-tampering: the redirect amount must equal the order amount.
    if (payment.amount !== amount) {
      return json({ error: "AMOUNT_MISMATCH" }, 400);
    }

    // Already fulfilled (e.g. webhook beat us here) — just redirect.
    if (payment.status === "PAID") {
      return NextResponse.redirect(`${base}/billing/result?status=success&orderId=${orderId}`);
    }

    const toss = await confirmPayment({ paymentKey, orderId, amount });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { paymentKey: toss.paymentKey, method: toss.method, rawWebhook: toss as object },
    });

    await fulfillPayment(payment.id);

    return NextResponse.redirect(`${base}/billing/result?status=success&orderId=${orderId}`);
  } catch (err) {
    // Redirect to a fail page for a nicer UX, but keep JSON for API callers.
    if (req.headers.get("accept")?.includes("text/html")) {
      return NextResponse.redirect(`${base}/billing/result?status=fail`);
    }
    return handleError(err);
  }
}
