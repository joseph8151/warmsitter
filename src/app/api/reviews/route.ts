import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/schemas";

// Step 6 of the flow: parent & sitter review each other after the job.
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { jobId, targetId, rating, comment } = reviewSchema.parse(await req.json());

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
