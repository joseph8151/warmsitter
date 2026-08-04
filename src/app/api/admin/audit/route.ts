import { requireRole } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Admin: recent audit-log entries, with actor names resolved.
export async function GET(req: Request) {
  try {
    await requireRole(["ADMIN"]);
    const limit = Math.min(200, Number(new URL(req.url).searchParams.get("limit") ?? "100") || 100);

    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const actorIds = Array.from(new Set(logs.map((l) => l.actorId).filter((v): v is string => Boolean(v))));
    const actors = await prisma.user.findMany({
      where: { id: { in: actorIds } },
      select: { id: true, name: true },
    });
    const nameById = new Map(actors.map((a) => [a.id, a.name]));

    return json({
      logs: logs.map((l) => ({
        id: l.id,
        action: l.action,
        actor: l.actorId ? nameById.get(l.actorId) ?? l.actorId : "system",
        targetType: l.targetType,
        targetId: l.targetId,
        metadata: l.metadata,
        ip: l.ip,
        createdAt: l.createdAt,
      })),
    });
  } catch (err) {
    return handleError(err);
  }
}
