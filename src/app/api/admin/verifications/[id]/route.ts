import { requireRole } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { verificationReviewSchema } from "@/lib/schemas";

// Admin approves / rejects a sitter verification.
// APPROVE also flips SitterProfile.verified so the "✔ 인증" badge appears.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const { action, rejectionReason } = verificationReviewSchema.parse(await req.json());

    const v = await prisma.sitterVerification.findUnique({ where: { id: params.id } });
    if (!v) return json({ error: "NOT_FOUND" }, 404);
    if (v.status !== "PENDING") return json({ error: "ALREADY_REVIEWED" }, 409);

    if (action === "APPROVE") {
      const [updated] = await prisma.$transaction([
        prisma.sitterVerification.update({
          where: { id: v.id },
          data: { status: "APPROVED", reviewedAt: new Date(), reviewedBy: admin.id },
        }),
        prisma.sitterProfile.update({
          where: { userId: v.sitterId },
          data: { verified: true },
        }),
      ]);
      return json({ verification: updated });
    }

    const updated = await prisma.sitterVerification.update({
      where: { id: v.id },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewedBy: admin.id,
        rejectionReason,
      },
    });
    return json({ verification: updated });
  } catch (err) {
    return handleError(err);
  }
}
