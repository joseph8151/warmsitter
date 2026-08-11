import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { applyJobSchema } from "@/lib/schemas";
import { notify } from "@/lib/notify";

// Sitter applies to a job. Free for the sitter — the parent pays to accept.
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (user.role !== "SITTER") return json({ error: "SITTER_ONLY" }, 403);
    const { jobId, message } = applyJobSchema.parse(await req.json());

    const job = await prisma.jobPost.findUnique({ where: { id: jobId } });
    if (!job) return json({ error: "JOB_NOT_FOUND" }, 404);
    if (job.status !== "OPEN") return json({ error: "JOB_NOT_OPEN" }, 409);

    // One application per (job, sitter).
    const existing = await prisma.application.findUnique({
      where: { jobId_sitterId: { jobId, sitterId: user.id } },
    });
    if (existing) return json({ application: existing, reused: true });

    const application = await prisma.application.create({
      data: { jobId, sitterId: user.id, message, status: "PENDING" },
    });

    await notify({
      userId: job.parentId,
      type: "APPLICATION_RECEIVED",
      title: "새 지원자가 있어요",
      body: `${user.name}님이 "${job.title}"에 지원했습니다.`,
      link: `/jobs/${job.id}`,
    });

    return json({ application }, 201);
  } catch (err) {
    return handleError(err);
  }
}
