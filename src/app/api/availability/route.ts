import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { availabilitySchema } from "@/lib/schemas";
import { enforceRateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

// The current sitter's weekly availability.
export async function GET() {
  try {
    const user = await requireUser();
    const slots = await prisma.availabilitySlot.findMany({
      where: { sitterId: user.id },
      select: { dayOfWeek: true, slot: true },
    });
    return json({ slots });
  } catch (err) {
    return handleError(err);
  }
}

// Replace the sitter's availability with the provided set.
export async function PUT(req: Request) {
  try {
    const user = await requireUser();
    enforceRateLimit(req, "write", user.id);
    if (user.role !== "SITTER") return json({ error: "SITTER_ONLY" }, 403);
    const { slots } = availabilitySchema.parse(await req.json());

    // De-dupe defensively (the unique constraint would otherwise throw).
    const seen = new Set<string>();
    const unique = slots.filter((s) => {
      const k = `${s.dayOfWeek}:${s.slot}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    await prisma.$transaction([
      prisma.availabilitySlot.deleteMany({ where: { sitterId: user.id } }),
      prisma.availabilitySlot.createMany({
        data: unique.map((s) => ({ sitterId: user.id, dayOfWeek: s.dayOfWeek, slot: s.slot })),
      }),
    ]);

    return json({ ok: true, count: unique.length });
  } catch (err) {
    return handleError(err);
  }
}
