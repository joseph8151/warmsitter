import { requireRole } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Admin: list open/reviewing reports for moderation.
export async function GET() {
  try {
    await requireRole(["ADMIN"]);
    const reports = await prisma.report.findMany({
      where: { status: { in: ["OPEN", "REVIEWING"] } },
      orderBy: { createdAt: "asc" },
      take: 100,
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        reported: { select: { id: true, name: true, email: true, role: true } },
      },
    });
    return json({ reports });
  } catch (err) {
    return handleError(err);
  }
}
