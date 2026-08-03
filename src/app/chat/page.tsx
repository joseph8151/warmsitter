import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

// Chat list — all rooms the current user participates in.
export default async function ChatListPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="ws-card mx-auto max-w-md p-10 text-center">
        <p className="text-slate-600">로그인이 필요합니다.</p>
        <Link href="/login" className="ws-btn-primary mt-4 inline-flex">로그인</Link>
      </div>
    );
  }

  const rooms = await prisma.chatRoom.findMany({
    where: { OR: [{ parentId: user.id }, { sitterId: user.id }] },
    orderBy: { createdAt: "desc" },
    include: {
      parent: { select: { id: true, name: true } },
      sitter: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-extrabold text-slate-900">대화</h1>
      {rooms.length === 0 ? (
        <div className="ws-card mt-6 p-10 text-center text-slate-500">
          아직 대화가 없습니다. <Link href="/sitters" className="text-sky-600 underline">시터 찾기</Link>에서 채팅을 시작해보세요.
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {rooms.map((r) => {
            const other = r.parentId === user.id ? r.sitter : r.parent;
            return (
              <Link
                key={r.id}
                href={`/chat/${r.id}`}
                className="ws-card flex items-center justify-between p-4 hover:bg-sky-50"
              >
                <div>
                  <p className="font-bold text-slate-900">{other.name}</p>
                  <p className="line-clamp-1 text-sm text-slate-500">
                    {r.messages[0]?.body ?? "새 대화를 시작하세요"}
                  </p>
                </div>
                <span className="text-xs text-slate-400">{formatDate(r.messages[0]?.createdAt ?? r.createdAt)}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
