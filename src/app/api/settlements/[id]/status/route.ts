import { requireRole } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { settlementStatusSchema } from "@/lib/schemas";
import { canTransitionSettlement } from "@/lib/settlement-status";

// Advance a settlement through its lifecycle: PENDING -> PAID -> COMPLETED.
// Admin-only (a real payout system would trigger PAID from a bank transfer job).
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(["ADMIN"]);
    const { status } = settlementStatusSchema.parse(await req.json());

    const settlement = await prisma.settlement.findUnique({ where: { id: params.id } });
    if (!settlement) return json({ error: "NOT_FOUND" }, 404);

    if (!canTransitionSettlement(settlement.status, status)) {
      return json(
        { error: "INVALID_TRANSITION", from: settlement.status, to: status },
        409
      );
    }

    const updated = await prisma.settlement.update({
      where: { id: params.id },
      data: {
        status,
        paidAt: status === "PAID" ? new Date() : settlement.paidAt,
        completedAt: status === "COMPLETED" ? new Date() : settlement.completedAt,
      },
    });

    return json({ settlement: updated });
  } catch (err) {
    return handleError(err);
  }
}
