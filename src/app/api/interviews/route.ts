import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { deductForAction } from "@/lib/billing";
import { proposeInterviewSchema } from "@/lib/schemas";
import { notify } from "@/lib/notify";
import { enforceRateLimit } from "@/lib/security";
import { areBlocked } from "@/lib/blocks";

export const dynamic = "force-dynamic";

// List interviews the current user is part of (as parent or sitter).
export async function GET() {
  try {
    const user = await requireUser();
    const interviews = await prisma.interview.findMany({
      where: { OR: [{ parentId: user.id }, { sitterId: user.id }] },
      orderBy: { proposedAt: "desc" },
      include: {
        parent: { select: { id: true, name: true } },
        sitter: { select: { id: true, name: true } },
        job: { select: { title: true } },
      },
      take: 50,
    });
    return json({
      role: user.role,
      userId: user.id,
      interviews,
    });
  } catch (err) {
    return handleError(err);
  }
}

// Step 2 of the flow: parent proposes an interview to a sitter.
// Billable action: INTERVIEW_PROPOSAL (premium/ticket bypass, else -credits).
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    enforceRateLimit(req, "billable", user.id);
    const body = proposeInterviewSchema.parse(await req.json());

    if (await areBlocked(user.id, body.sitterId)) {
      return json({ error: "BLOCKED", message: "차단된 사용자에게는 면접을 제안할 수 없습니다." }, 403);
    }

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
      await notify({
        userId: body.sitterId,
        type: "INTERVIEW_PROPOSED",
        title: "면접 제안이 도착했어요",
        body: "부모님이 면접을 제안했습니다. 수락 또는 거절을 선택해주세요.",
        link: "/interviews",
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
