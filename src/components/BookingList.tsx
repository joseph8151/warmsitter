"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client/api";
import { won, formatDate } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";

interface Booking {
  id: string;
  status: "PROPOSED" | "CONFIRMED" | "COMPLETED" | "CANCELED" | "DECLINED";
  scheduledDate: string;
  hours: number;
  hourlyRate: number;
  note: string | null;
  proposedById: string;
  parentId: string;
  parent: { id: string; name: string };
  sitter: { id: string; name: string };
  job: { id: string; title: string } | null;
}

const STATUS: Record<string, { ko: string; cls: string }> = {
  PROPOSED: { ko: "제안됨", cls: "bg-amber-100 text-amber-700" },
  CONFIRMED: { ko: "확정됨", cls: "bg-emerald-100 text-emerald-700" },
  COMPLETED: { ko: "완료", cls: "bg-sky-100 text-sky-700" },
  CANCELED: { ko: "취소됨", cls: "bg-slate-100 text-slate-500" },
  DECLINED: { ko: "거절됨", cls: "bg-slate-100 text-slate-500" },
};

export function BookingList() {
  const [userId, setUserId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    try {
      const res = await api<{ userId: string; bookings: Booking[] }>("/api/bookings");
      setUserId(res.userId);
      setBookings(res.bookings);
    } catch {
      setBookings([]);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function respond(id: string, action: "CONFIRM" | "DECLINE") {
    setBusy(id);
    try {
      await api(`/api/bookings/${id}/respond`, { method: "POST", body: JSON.stringify({ action }) });
      await load();
    } finally {
      setBusy(null);
    }
  }
  async function cancel(id: string) {
    if (!window.confirm("예약을 취소할까요?")) return;
    setBusy(id);
    try {
      await api(`/api/bookings/${id}/cancel`, { method: "POST" });
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (!bookings) return <div className="h-40 animate-pulse rounded-xl2 bg-sky-50" />;
  if (bookings.length === 0)
    return (
      <EmptyState
        icon="📅"
        title="예약이 없어요"
        description="채팅에서 “📅 일정 예약”으로 돌봄 일정을 제안하면 여기에 표시돼요."
        cta={{ href: "/chat", label: "대화로 이동" }}
      />
    );

  return (
    <div className="space-y-3">
      {bookings.map((b) => {
        const s = STATUS[b.status];
        const iAmParent = b.parentId === userId;
        const other = iAmParent ? b.sitter : b.parent;
        const iProposed = b.proposedById === userId;
        return (
          <div key={b.id} className="ws-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-bold text-slate-900">
                  {other.name} <span className="font-normal text-slate-400">· {formatDate(b.scheduledDate)}</span>
                </p>
                <p className="text-sm text-slate-500">
                  {b.hours}시간 · {won(b.hourlyRate)}/시간 · 합계 {won(Math.round(b.hours * b.hourlyRate))}
                  {b.job && <> · {b.job.title}</>}
                </p>
                {b.note && <p className="mt-1 text-sm text-slate-600">“{b.note}”</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`ws-badge ${s.cls}`}>{s.ko}</span>
                {b.status === "PROPOSED" && !iProposed && (
                  <>
                    <button onClick={() => respond(b.id, "DECLINE")} disabled={busy === b.id} className="ws-btn-ghost text-sm">거절</button>
                    <button onClick={() => respond(b.id, "CONFIRM")} disabled={busy === b.id} className="ws-btn-primary text-sm">확정</button>
                  </>
                )}
                {(b.status === "PROPOSED" || b.status === "CONFIRMED") && (
                  <button onClick={() => cancel(b.id)} disabled={busy === b.id} className="ws-btn-ghost text-sm">취소</button>
                )}
                {b.status === "CONFIRMED" && iAmParent && b.job && (
                  <Link href="/dashboard" className="ws-btn-accent text-sm">결제하러 가기</Link>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
