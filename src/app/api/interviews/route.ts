import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { deductForAction } from "@/lib/billing";
import { proposeInterviewSchema } from "@/lib/schemas";

// Step 2 of the flow: parent proposes an interview to a sitter.
// Billable action: INTERVIEW_PROPOSAL (premium/ticket bypass, else -credits).
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = proposeInterviewSchema.parse(await req.json());

    // Create the interview first so we have a stable refId for idempotent billing.
    const interview = await prisma.interview.create({
      data: {
        parentId: user.id,
        sitterId: body.sitterId,
        jobId: body.jobId,
        scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : null,
        status: "PROPOSED",
      },
    });

    try {
      const deduction = await deductForAction({
        userId: user.id,
        action: "INTERVIEW_PROPOSAL",
        refType: "interview",
        refId: interview.id,
        reason: `Interview proposal to sitter ${body.sitterId}`,
      });
      return json({ interview, deduction }, 201);
    } catch (billingErr) {
      // Roll back the interview if the parent couldn't pay for it.
      await prisma.interview.delete({ where: { id: interview.id } }).catch(() => {});
      throw billingErr;
    }
  } catch (err) {
    return handleError(err);
  }
}
