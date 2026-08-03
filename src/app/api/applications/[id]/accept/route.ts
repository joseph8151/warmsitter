import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { deductForAction } from "@/lib/billing";

// Step 2 of the flow: parent accepts a sitter's application.
// Billable action: ACCEPT_APPLICATION.
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();

    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: { job: true },
    });
    if (!application) return json({ error: "NOT_FOUND" }, 404);
    if (application.job.parentId !== user.id) {
      return json({ error: "FORBIDDEN" }, 403);
    }
    if (application.status === "ACCEPTED") {
      return json({ error: "ALREADY_ACCEPTED" }, 409);
    }

    // Charge BEFORE mutating job state; idempotent per application.
    const deduction = await deductForAction({
      userId: user.id,
      action: "ACCEPT_APPLICATION",
      refType: "application",
      refId: application.id,
      reason: `Accept application ${application.id}`,
    });

    const [updatedApp] = await prisma.$transaction([
      prisma.application.update({
        where: { id: application.id },
        data: { status: "ACCEPTED" },
      }),
      prisma.jobPost.update({
        where: { id: application.jobId },
        data: { status: "MATCHED", matchedSitterId: application.sitterId },
      }),
    ]);

    return json({ application: updatedApp, deduction });
  } catch (err) {
    return handleError(err);
  }
}
