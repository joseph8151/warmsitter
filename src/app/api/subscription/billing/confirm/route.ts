import { NextResponse } from "next/server";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { issueBillingKey } from "@/lib/toss";
import { chargeAndExtend } from "@/lib/subscriptions";

// Toss billing-auth success redirect:
//   GET /api/subscription/billing/confirm?customerKey=...&authKey=...
// Exchange authKey -> billingKey, store it, charge the first month, activate.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const customerKey = url.searchParams.get("customerKey");
  const authKey = url.searchParams.get("authKey");
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? url.origin;

  try {
    if (!customerKey || !authKey) return json({ error: "MISSING_PARAMS" }, 400);

    const sub = await prisma.subscription.findFirst({ where: { customerKey } });
    if (!sub) return json({ error: "SUBSCRIPTION_NOT_FOUND" }, 404);

    // 1) Exchange for a durable billing key.
    const auth = await issueBillingKey({ authKey, customerKey });
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { billingKey: auth.billingKey },
    });

    // 2) Charge the first month immediately.
    const fresh = await prisma.subscription.findUniqueOrThrow({ where: { id: sub.id } });
    const result = await chargeAndExtend(fresh, { first: true });

    const status = result.ok ? "success" : "fail";
    return NextResponse.redirect(`${base}/billing/result?status=${status}&plan=premium`);
  } catch (err) {
    if (req.headers.get("accept")?.includes("text/html")) {
      return NextResponse.redirect(`${base}/billing/result?status=fail`);
    }
    return handleError(err);
  }
}
