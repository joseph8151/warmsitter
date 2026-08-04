import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { blockSchema } from "@/lib/schemas";
import { enforceRateLimit } from "@/lib/security";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

// List the users the caller has blocked.
export async function GET() {
  try {
    const user = await requireUser();
    const blocks = await prisma.block.findMany({
      where: { blockerId: user.id },
      select: { blockedId: true },
    });
    return json({ blockedIds: blocks.map((b) => b.blockedId) });
  } catch (err) {
    return handleError(err);
  }
}

// Toggle a block on another user.
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    enforceRateLimit(req, "write", user.id);
    const { userId } = blockSchema.parse(await req.json());

    if (userId === user.id) return json({ error: "CANNOT_BLOCK_SELF" }, 400);
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!target) return json({ error: "USER_NOT_FOUND" }, 404);

    const existing = await prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: user.id, blockedId: userId } },
    });
    if (existing) {
      await prisma.block.delete({ where: { id: existing.id } });
      await audit({ actorId: user.id, action: "USER_UNBLOCKED", targetType: "user", targetId: userId, req });
      return json({ blocked: false });
    }
    await prisma.block.create({ data: { blockerId: user.id, blockedId: userId } });
    await audit({ actorId: user.id, action: "USER_BLOCKED", targetType: "user", targetId: userId, req });
    return json({ blocked: true });
  } catch (err) {
    return handleError(err);
  }
}
