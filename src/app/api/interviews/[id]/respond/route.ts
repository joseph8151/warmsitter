import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { interviewRespondSchema } from "@/lib/schemas";
import { notify } from "@/lib/notify";

// Sitter accepts or declines a proposed interview (optionally scheduling it).
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const { action, scheduledFor } = interviewRespondSchema.parse(await req.json());

    const interview = await prisma.interview.findUnique({ where: { id: params.id } });
    if (!interview) return json({ error: "NOT_FOUND" }, 404);
    if (interview.sitterId !== user.id) return json({ error: "FORBIDDEN" }, 403);
    if (interview.status !== "PROPOSED") return json({ error: "ALREADY_RESPONDED" }, 409);

    const updated = await prisma.interview.update({
      where: { id: interview.id },
      data: {
        status: action === "ACCEPT" ? "ACCEPTED" : "DECLINED",
        scheduledFor: scheduledFor ? new Date(scheduledFor) : interview.scheduledFor,
      },
    });

    await notify({
      userId: interview.parentId,
      type: "INTERVIEW_RESPONSE",
      title: action === "ACCEPT" ? "면접 제안이 수락되었어요 🎉" : "면접 제안이 거절되었어요",
      body:
        action === "ACCEPT"
          ? "시터가 면접을 수락했습니다. 채팅으로 세부 일정을 조율해보세요."
          : "시터가 면접 제안을 거절했습니다.",
      link: "/interviews",
    });

    return json({ interview: updated });
  } catch (err) {
    return handleError(err);
  }
}
