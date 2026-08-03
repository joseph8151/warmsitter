import { requireRole } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { signedUrl } from "@/lib/storage";
import { isSupabaseStorageEnabled } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

// Admin: list pending verifications with short-lived signed document URLs.
export async function GET() {
  try {
    await requireRole(["ADMIN"]);
    const rows = await prisma.sitterVerification.findMany({
      where: { status: "PENDING" },
      orderBy: { submittedAt: "asc" },
      include: { sitter: { select: { id: true, name: true, email: true } } },
      take: 50,
    });

    const items = await Promise.all(
      rows.map(async (r) => ({
        id: r.id,
        sitter: r.sitter,
        legalName: r.legalName,
        submittedAt: r.submittedAt,
        documentUrl: isSupabaseStorageEnabled
          ? await signedUrl("verification", r.documentPath).catch(() => null)
          : null,
      }))
    );

    return json({ verifications: items });
  } catch (err) {
    return handleError(err);
  }
}
