import { requireRole } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { reportStatusSchema } from "@/lib/schemas";

// Admin updates a report's status (REVIEWING / RESOLVED / DISMISSED).
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const { status } = reportStatusSchema.parse(await req.json());

    const report = await prisma.report.findUnique({ where: { id: params.id } });
    if (!report) return json({ error: "NOT_FOUND" }, 404);

    const updated = await prisma.report.update({
      where: { id: params.id },
      data: {
        status,
        reviewedBy: admin.id,
        reviewedAt: status === "RESOLVED" || status === "DISMISSED" ? new Date() : report.reviewedAt,
      },
    });
    return json({ report: updated });
  } catch (err) {
    return handleError(err);
  }
}
