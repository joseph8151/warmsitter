import { requireRole } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { z } from "zod";

const schema = z.object({ suspend: z.boolean(), reason: z.string().max(500).optional() });

// Admin suspends / reinstates a user. Admins cannot be suspended, nor can the
// acting admin suspend themselves.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const { suspend, reason } = schema.parse(await req.json());

    if (params.id === admin.id) return json({ error: "CANNOT_SUSPEND_SELF" }, 400);

    const target = await prisma.user.findUnique({ where: { id: params.id }, select: { role: true } });
    if (!target) return json({ error: "NOT_FOUND" }, 404);
    if (target.role === "ADMIN") return json({ error: "CANNOT_SUSPEND_ADMIN" }, 403);

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        suspended: suspend,
        suspendedAt: suspend ? new Date() : null,
        suspendedReason: suspend ? reason ?? null : null,
      },
      select: { id: true, suspended: true },
    });

    await audit({
      actorId: admin.id,
      action: suspend ? "USER_SUSPENDED" : "USER_UNSUSPENDED",
      targetType: "user",
      targetId: params.id,
      metadata: suspend && reason ? { reason } : undefined,
      req,
    });

    if (suspend) {
      await notify({
        userId: params.id,
        type: "SYSTEM",
        title: "계정이 정지되었어요",
        body: reason ? `사유: ${reason}` : "문의가 필요하면 고객센터로 연락해주세요.",
      });
    }

    return json({ user: updated });
  } catch (err) {
    return handleError(err);
  }
}
