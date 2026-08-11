import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { workLogSchema } from "@/lib/schemas";

// Step 4 of the flow: sitter writes a work log after a care session.
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { jobId, hours, note, imageUrl } = workLogSchema.parse(await req.json());

    const job = await prisma.jobPost.findUnique({ where: { id: jobId } });
    if (!job) return json({ error: "JOB_NOT_FOUND" }, 404);
    if (job.matchedSitterId !== user.id) {
      return json({ error: "FORBIDDEN", message: "Only the matched sitter can log work" }, 403);
    }

    const log = await prisma.workLog.create({
      data: { jobId, sitterId: user.id, hours, note, imageUrl, status: "SUBMITTED" },
    });
    await prisma.jobPost.update({
      where: { id: jobId },
      data: { status: "IN_PROGRESS" },
    });

    return json({ workLog: log }, 201);
  } catch (err) {
    return handleError(err);
  }
}
