import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { deductForAction } from "@/lib/billing";
import { startChatSchema } from "@/lib/schemas";

// Step 3 of the flow: parent starts the first chat with a sitter.
// Billable action: START_CHAT — charged only when the room is first created.
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { sitterId, jobId } = startChatSchema.parse(await req.json());

    // Reuse an existing room (no double charge — idempotent on the room id too).
    const existing = await prisma.chatRoom.findFirst({
      where: { parentId: user.id, sitterId, jobId: jobId ?? null },
    });
    if (existing) {
      return json({ room: existing, deduction: null, reused: true });
    }

    const room = await prisma.chatRoom.create({
      data: { parentId: user.id, sitterId, jobId },
    });

    try {
      const deduction = await deductForAction({
        userId: user.id,
        action: "START_CHAT",
        refType: "chatRoom",
        refId: room.id,
        reason: `Start chat with sitter ${sitterId}`,
      });
      return json({ room, deduction, reused: false }, 201);
    } catch (billingErr) {
      await prisma.chatRoom.delete({ where: { id: room.id } }).catch(() => {});
      throw billingErr;
    }
  } catch (err) {
    return handleError(err);
  }
}
