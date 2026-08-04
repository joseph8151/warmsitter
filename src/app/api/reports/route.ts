import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { reportSchema } from "@/lib/schemas";
import { enforceRateLimit } from "@/lib/security";

// File a safety report against another user (reviewed by admins).
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    enforceRateLimit(req, "write", user.id);
    const { reportedId, reason, detail } = reportSchema.parse(await req.json());

    if (reportedId === user.id) {
      return json({ error: "CANNOT_REPORT_SELF" }, 400);
    }
    const reported = await prisma.user.findUnique({ where: { id: reportedId }, select: { id: true } });
    if (!reported) return json({ error: "USER_NOT_FOUND" }, 404);

    const report = await prisma.report.create({
      data: { reporterId: user.id, reportedId, reason, detail, status: "OPEN" },
    });
    return json({ report: { id: report.id, status: report.status } }, 201);
  } catch (err) {
    return handleError(err);
  }
}
