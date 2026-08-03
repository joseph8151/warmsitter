import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { deductForAction } from "@/lib/billing";
import { startChatSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

// List the current user's chat rooms (as parent or sitter) with the other party.
export async function GET() {
  try {
    const user = await requireUser();
    const rooms = await prisma.chatRoom.findMany({
      where: { OR: [{ parentId: user.id }, { sitterId: user.id }] },
      orderBy: { createdAt: "desc" },
      include: {
        parent: { select: { id: true, name: true } },
        sitter: { select: { id: true, name: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        job: { select: { title: true } },
      },
    });
    return json({
      rooms: rooms.map((r) => {
        const other = r.parentId === user.id ? r.sitter : r.parent;
        return {
          id: r.id,
          other,
          jobTitle: r.job?.title ?? null,
          lastMessage: r.messages[0]?.body ?? null,
          lastAt: r.messages[0]?.createdAt ?? r.createdAt,
        };
      }),
    });
  } catch (err) {
    return handleError(err);
  }
}

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
