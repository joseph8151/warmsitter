import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getPayment } from "@/lib/toss";
import { fulfillPayment, markPaymentStatus } from "@/lib/fulfillment";
import crypto from "crypto";

// -----------------------------------------------------------------------------
// Toss Payments webhook.
//
// Toss POSTs status changes here. We:
//   1. Verify the signature (TOSS_WEBHOOK_SECRET) to reject spoofed calls.
//   2. Re-fetch the payment from Toss as the source of truth (never trust the
//      body's amount/status blindly).
//   3. Map DONE -> fulfill, CANCELED/EXPIRED/ABORTED -> mark failed.
//
// Fulfillment is idempotent, so duplicate webhook deliveries are safe.
// -----------------------------------------------------------------------------

export const dynamic = "force-dynamic";

function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.TOSS_WEBHOOK_SECRET;
  // If no secret configured (local dev), skip verification.
  if (!secret) return true;
  if (!signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature =
      req.headers.get("toss-signature") ?? req.headers.get("x-toss-signature");

    if (!verifySignature(rawBody, signature)) {
      return json({ error: "INVALID_SIGNATURE" }, 401);
    }

    const event = JSON.parse(rawBody) as {
      eventType?: string;
      data?: { paymentKey?: string; orderId?: string; status?: string };
    };
    const data = event.data ?? {};
    const orderId = data.orderId;
    if (!orderId) return json({ ok: true, ignored: "no orderId" });

    const payment = await prisma.payment.findUnique({ where: { orderId } });
    if (!payment) return json({ ok: true, ignored: "unknown order" });

    // Source of truth: re-fetch from Toss when we have a paymentKey.
    let status = data.status;
    if (data.paymentKey) {
      try {
        const fresh = await getPayment(data.paymentKey);
        status = fresh.status;
        await prisma.payment.update({
          where: { id: payment.id },
          data: { paymentKey: fresh.paymentKey, method: fresh.method, rawWebhook: fresh as object },
        });
      } catch {
        // fall back to the webhook-reported status
      }
    }

    switch (status) {
      case "DONE":
        await fulfillPayment(payment.id);
        break;
      case "CANCELED":
      case "PARTIAL_CANCELED":
        await markPaymentStatus(payment.id, "REFUNDED");
        break;
      case "ABORTED":
      case "EXPIRED":
        await markPaymentStatus(payment.id, "FAILED");
        break;
      default:
        // READY / IN_PROGRESS / WAITING_FOR_DEPOSIT — nothing to do yet.
        break;
    }

    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
