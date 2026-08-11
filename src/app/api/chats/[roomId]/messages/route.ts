import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { messageSchema } from "@/lib/schemas";
import { notify } from "@/lib/notify";
import { enforceRateLimit } from "@/lib/security";
import { areBlocked } from "@/lib/blocks";

export const dynamic = "force-dynamic";

// Ensure the current user belongs to the room; returns the room or null.
async function authorizeRoom(roomId: string, userId: string) {
  const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
  if (!room) return null;
  if (room.parentId !== userId && room.sitterId !== userId) return null;
  return room;
}

// List messages (optionally after ?after=<ISO> for polling).
export async function GET(req: Request, { params }: { params: { roomId: string } }) {
  try {
    const user = await requireUser();
    const room = await authorizeRoom(params.roomId, user.id);
    if (!room) return json({ error: "FORBIDDEN" }, 403);

    const after = new URL(req.url).searchParams.get("after");
    const messages = await prisma.message.findMany({
      where: { roomId: room.id, ...(after ? { createdAt: { gt: new Date(after) } } : {}) },
      orderBy: { createdAt: "asc" },
      take: 200,
      include: { sender: { select: { id: true, name: true } } },
    });
    return json({ messages });
  } catch (err) {
    return handleError(err);
  }
}

// Send a message. Persisted here; realtime fan-out is done client-side via a
// Supabase broadcast channel (see src/lib/client/realtime.ts).
export async function POST(req: Request, { params }: { params: { roomId: string } }) {
  try {
    const user = await requireUser();
    enforceRateLimit(req, "write", user.id);
    const room = await authorizeRoom(params.roomId, user.id);
    if (!room) return json({ error: "FORBIDDEN" }, 403);

    const { body } = messageSchema.parse(await req.json());

    const recipientId = room.parentId === user.id ? room.sitterId : room.parentId;
    if (await areBlocked(user.id, recipientId)) {
      return json({ error: "BLOCKED", message: "차단된 사용자와는 대화할 수 없습니다." }, 403);
    }

    const message = await prisma.message.create({
      data: { roomId: room.id, senderId: user.id, body },
      include: { sender: { select: { id: true, name: true } } },
    });

    await notify({
      userId: recipientId,
      type: "MESSAGE_RECEIVED",
      title: `${user.name}님의 새 메시지`,
      body: body.length > 60 ? `${body.slice(0, 60)}…` : body,
      link: `/chat/${room.id}`,
    });

    return json({ message }, 201);
  } catch (err) {
    return handleError(err);
  }
}
