import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/schemas";
import { enforceRateLimit } from "@/lib/security";
import { canReview } from "@/lib/authz";

// Step 6 of the flow: parent & sitter review each other after the job.
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    enforceRateLimit(req, "write", user.id);
    const { jobId, targetId, rating, comment, photoUrl } = reviewSchema.parse(await req.json());

    // AUTHORIZATION (see canReview / authz.test.ts): the caller must be a party
    // to the job, `targetId` must be the counterparty, and the job COMPLETED.
    const job = await prisma.jobPost.findUnique({ where: { id: jobId } });
    const decision = canReview({ job, userId: user.id, targetId });
    if (!decision.ok) return json({ error: decision.error }, decision.status);

    const review = await prisma.review.create({
      data: { jobId, authorId: user.id, targetId, rating, comment, photoUrl },
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
