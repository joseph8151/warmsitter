import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { newOrderId } from "@/lib/toss";
import { purchaseCreditSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { packageId } = purchaseCreditSchema.parse(await req.json());

    const settings = await getSettings();
    const pkg = settings.creditPackages.find((p) => p.id === packageId);
    if (!pkg) return json({ error: "PACKAGE_NOT_FOUND" }, 404);

    const orderId = newOrderId("credit");
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        purpose: "CREDIT_PACK",
        status: "PENDING",
        orderId,
        amount: pkg.price,
      },
    });

    return json({
      paymentId: payment.id,
      orderId,
      amount: pkg.price,
      orderName: `warm sitter · ${pkg.label}`,
      customerName: user.name,
      clientKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "",
    });
  } catch (err) {
    return handleError(err);
  }
}
