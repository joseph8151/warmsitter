import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { verificationSubmitSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

// Sitter's current verification status.
export async function GET() {
  try {
    const user = await requireUser();
    const latest = await prisma.sitterVerification.findFirst({
      where: { sitterId: user.id },
      orderBy: { submittedAt: "desc" },
    });
    const profile = await prisma.sitterProfile.findUnique({ where: { userId: user.id } });
    return json({
      verified: profile?.verified ?? false,
      submission: latest
        ? { id: latest.id, status: latest.status, submittedAt: latest.submittedAt, rejectionReason: latest.rejectionReason }
        : null,
    });
  } catch (err) {
    return handleError(err);
  }
}

// Sitter submits an identity document (path from POST /api/uploads kind=verification).
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (user.role !== "SITTER") return json({ error: "SITTER_ONLY" }, 403);
    const { legalName, documentPath } = verificationSubmitSchema.parse(await req.json());

    // Reuse an open PENDING submission if one exists, else create a new one.
    const existingPending = await prisma.sitterVerification.findFirst({
      where: { sitterId: user.id, status: "PENDING" },
    });

    const submission = existingPending
      ? await prisma.sitterVerification.update({
          where: { id: existingPending.id },
          data: { legalName, documentPath, submittedAt: new Date() },
        })
      : await prisma.sitterVerification.create({
          data: { sitterId: user.id, legalName, documentPath, status: "PENDING" },
        });

    return json({ submission: { id: submission.id, status: submission.status } }, 201);
  } catch (err) {
    return handleError(err);
  }
}
