import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// The current user's payment history (billing receipts).
export async function GET() {
  try {
    const user = await requireUser();
    const payments = await prisma.payment.findMany({
      where: { userId: user.id, status: { in: ["PAID", "REFUNDED"] } },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        createdAt: true,
        orderId: true,
        purpose: true,
        status: true,
        amount: true,
        careFee: true,
        platformFee: true,
        sitterPayout: true,
        method: true,
      },
    });
    return json({ payments });
  } catch (err) {
    return handleError(err);
  }
}
