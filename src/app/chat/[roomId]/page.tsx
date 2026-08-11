import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChatRoom } from "@/components/ChatRoom";

export const dynamic = "force-dynamic";

export default async function ChatRoomPage({ params }: { params: { roomId: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="ws-card mx-auto max-w-md p-10 text-center">
        <p className="text-slate-600">로그인이 필요합니다.</p>
        <Link href="/login" className="ws-btn-primary mt-4 inline-flex">로그인</Link>
      </div>
    );
  }

  const room = await prisma.chatRoom.findUnique({
    where: { id: params.roomId },
    include: {
      parent: { select: { id: true, name: true } },
      sitter: { select: { id: true, name: true } },
    },
  });
  if (!room || (room.parentId !== user.id && room.sitterId !== user.id)) {
    return <div className="ws-card p-10 text-center text-slate-500">대화를 찾을 수 없습니다.</div>;
  }

  const other = room.parentId === user.id ? room.sitter : room.parent;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/chat" className="text-sm text-sky-600 hover:underline">← 대화 목록</Link>
      <div className="mt-3">
        <ChatRoom
          roomId={room.id}
          currentUserId={user.id}
          otherName={other.name}
          otherId={other.id}
          jobId={room.jobId ?? undefined}
        />
      </div>
    </div>
  );
}
