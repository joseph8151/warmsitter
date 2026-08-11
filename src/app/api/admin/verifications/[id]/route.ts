import { requireRole } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { verificationReviewSchema } from "@/lib/schemas";
import { notify } from "@/lib/notify";
import { audit } from "@/lib/audit";

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
      await notify({
        userId: v.sitterId,
        type: "VERIFICATION_RESULT",
        title: "신원확인이 승인되었어요 ✅",
        body: "이제 프로필에 인증 뱃지가 표시됩니다.",
        link: "/profile",
      });
      await audit({
        actorId: admin.id,
        action: "VERIFICATION_APPROVED",
        targetType: "user",
        targetId: v.sitterId,
        req,
      });
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
    await notify({
      userId: v.sitterId,
      type: "VERIFICATION_RESULT",
      title: "신원확인이 반려되었어요",
      body: rejectionReason ? `사유: ${rejectionReason}` : "프로필에서 다시 제출해주세요.",
      link: "/profile",
    });
    await audit({
      actorId: admin.id,
      action: "VERIFICATION_REJECTED",
      targetType: "user",
      targetId: v.sitterId,
      metadata: rejectionReason ? { rejectionReason } : undefined,
      req,
    });
    return json({ verification: updated });
  } catch (err) {
    return handleError(err);
  }
}
