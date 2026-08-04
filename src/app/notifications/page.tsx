import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import { MarkAllRead } from "@/components/MarkAllRead";

export const dynamic = "force-dynamic";

// Emoji per notification type, so the full-history list scans quickly.
const ICON: Record<string, string> = {
  APPLICATION_RECEIVED: "📥",
  APPLICATION_ACCEPTED: "✅",
  INTERVIEW_PROPOSED: "🗓️",
  INTERVIEW_RESPONSE: "💬",
  MESSAGE_RECEIVED: "✉️",
  SETTLEMENT_PAID: "💰",
  VERIFICATION_RESULT: "🪪",
  TICKET_EXPIRING: "⏳",
  BOOKING_UPDATE: "📅",
  SYSTEM: "☀️",
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="ws-card mx-auto max-w-md p-10 text-center">
        <p className="text-slate-600">로그인이 필요합니다.</p>
        <Link href="/login" className="ws-btn-primary mt-4 inline-flex">로그인</Link>
      </div>
    );
  }

  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.notification.count({ where: { userId: user.id, read: false } }),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">알림</h1>
          <p className="mt-1 text-slate-600">돌봄 매칭과 관련된 소식을 한곳에서 확인하세요.</p>
        </div>
        {unread > 0 && <MarkAllRead />}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="아직 알림이 없어요"
          description="지원·면접·예약·정산 등 새로운 소식이 생기면 여기로 모여요."
        />
      ) : (
        <ul className="ws-card divide-y divide-sky-50">
          {items.map((n) => {
            const inner = (
              <div className={`flex gap-3 px-4 py-3 ${n.read ? "" : "bg-sky-50/60"}`}>
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sky-100 text-lg">
                  {ICON[n.type] ?? "🔔"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{n.title}</p>
                    {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-sky-500" />}
                  </div>
                  {n.body && <p className="mt-0.5 text-sm text-slate-600">{n.body}</p>}
                  <p className="mt-1 text-xs text-slate-400">{formatDate(n.createdAt)}</p>
                </div>
              </div>
            );
            return (
              <li key={n.id}>
                {n.link ? (
                  <Link href={n.link} className="block hover:bg-sky-50">{inner}</Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
