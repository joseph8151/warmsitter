import { getCurrentUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/security";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({ sitterId: z.string().min(1).max(64) });

// Record that the current parent viewed a sitter (upsert, bumps viewedAt).
// Silently no-ops for guests / non-parents / self / non-sitter targets.
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const { sitterId } = schema.parse(await req.json());
    if (!user || user.role !== "PARENT" || sitterId === user.id) {
      return json({ ok: true, recorded: false });
    }
    enforceRateLimit(req, "write", user.id);

    // Only record real sitter listings — never let a client seed rows against
    // arbitrary user ids (parents, admins, non-existent).
    const target = await prisma.sitterProfile.findUnique({
      where: { userId: sitterId },
      select: { userId: true },
    });
    if (!target) return json({ ok: true, recorded: false });

    await prisma.recentlyViewed.upsert({
      where: { userId_sitterId: { userId: user.id, sitterId } },
      create: { userId: user.id, sitterId },
      update: { viewedAt: new Date() },
    });
    return json({ ok: true, recorded: true });
  } catch (err) {
    return handleError(err);
  }
}
