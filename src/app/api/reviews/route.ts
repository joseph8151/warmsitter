import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/schemas";
import { enforceRateLimit } from "@/lib/security";

// Step 6 of the flow: parent & sitter review each other after the job.
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    enforceRateLimit(req, "write", user.id);
    const { jobId, targetId, rating, comment } = reviewSchema.parse(await req.json());

    // AUTHORIZATION: the caller must have been a party to this job, `targetId`
    // must be the *other* party, and the job must be completed. This prevents
    // review fraud (rating any sitter up/down via throwaway jobs).
    const job = await prisma.jobPost.findUnique({ where: { id: jobId } });
    if (!job) return json({ error: "JOB_NOT_FOUND" }, 404);

    const isParent = job.parentId === user.id;
    const isSitter = job.matchedSitterId === user.id;
    if (!isParent && !isSitter) {
      return json({ error: "FORBIDDEN", message: "이 돌봄의 당사자만 리뷰할 수 있습니다." }, 403);
    }

    // The valid review target is strictly the counterparty on this job.
    const counterpartyId = isParent ? job.matchedSitterId : job.parentId;
    if (!counterpartyId || counterpartyId !== targetId) {
      return json({ error: "INVALID_TARGET", message: "상대방에게만 리뷰를 남길 수 있습니다." }, 403);
    }

    if (job.status !== "COMPLETED") {
      return json({ error: "JOB_NOT_COMPLETED", message: "완료된 돌봄만 리뷰할 수 있습니다." }, 409);
    }

    const review = await prisma.review.create({
      data: { jobId, authorId: user.id, targetId, rating, comment },
    });

    // Keep the sitter's rating aggregate fresh when the target is a sitter.
    const profile = await prisma.sitterProfile.findUnique({ where: { userId: targetId } });
    if (profile) {
      const count = profile.ratingCount + 1;
      const avg = (profile.ratingAvg * profile.ratingCount + rating) / count;
      await prisma.sitterProfile.update({
        where: { userId: targetId },
        data: { ratingAvg: avg, ratingCount: count },
      });
    }

    return json({ review }, 201);
  } catch (err) {
    return handleError(err);
  }
}
