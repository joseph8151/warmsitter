import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/security";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({ sitterId: z.string().min(1) });

// List the current parent's saved sitters.
export async function GET() {
  try {
    const user = await requireUser();
    const favorites = await prisma.favorite.findMany({
      where: { parentId: user.id },
      orderBy: { createdAt: "desc" },
      select: { sitterId: true },
    });
    return json({ sitterIds: favorites.map((f) => f.sitterId) });
  } catch (err) {
    return handleError(err);
  }
}

// Toggle a favorite. Returns the resulting state.
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    enforceRateLimit(req, "write", user.id);
    if (user.role !== "PARENT") return json({ error: "PARENT_ONLY" }, 403);
    const { sitterId } = schema.parse(await req.json());

    // Guard: the target must actually be a sitter.
    const sitter = await prisma.user.findUnique({ where: { id: sitterId }, select: { role: true } });
    if (!sitter || sitter.role !== "SITTER") return json({ error: "NOT_A_SITTER" }, 404);

    const existing = await prisma.favorite.findUnique({
      where: { parentId_sitterId: { parentId: user.id, sitterId } },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return json({ favorited: false });
    }
    await prisma.favorite.create({ data: { parentId: user.id, sitterId } });
    return json({ favorited: true });
  } catch (err) {
    return handleError(err);
  }
}
