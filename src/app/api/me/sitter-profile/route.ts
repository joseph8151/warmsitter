import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { sitterProfileSchema } from "@/lib/schemas";
import { enforceRateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

// The current sitter's editable profile fields.
export async function GET() {
  try {
    const user = await requireUser();
    if (user.role !== "SITTER") return json({ error: "SITTER_ONLY" }, 403);
    const profile = await prisma.sitterProfile.findUnique({ where: { userId: user.id } });
    return json({
      bio: profile?.bio ?? "",
      hourlyRate: profile?.hourlyRate ?? 15000,
      yearsOfExp: profile?.yearsOfExp ?? 0,
      city: profile?.city ?? "",
    });
  } catch (err) {
    return handleError(err);
  }
}

// Sitter edits their rate / bio / city / experience. Free — this is how a
// self-registered sitter completes their listing.
export async function PUT(req: Request) {
  try {
    const user = await requireUser();
    enforceRateLimit(req, "write", user.id);
    if (user.role !== "SITTER") return json({ error: "SITTER_ONLY" }, 403);
    const data = sitterProfileSchema.parse(await req.json());

    // Ensure a profile row exists (self-registered sitters always get one, but
    // be defensive) and update it.
    const updated = await prisma.sitterProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...data },
      update: data,
      select: { bio: true, hourlyRate: true, yearsOfExp: true, city: true },
    });
    return json(updated);
  } catch (err) {
    return handleError(err);
  }
}
