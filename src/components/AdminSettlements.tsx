"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { won, formatDate } from "@/lib/format";

interface Settlement {
  id: string;
  status: "PENDING" | "PAID" | "COMPLETED" | "CANCELED";
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  createdAt: string;
  job: { title: string } | null;
  payment: { orderId: string } | null;
}

const NEXT: Record<string, { to: "PAID" | "COMPLETED"; label: string } | null> = {
  PENDING: { to: "PAID", label: "지급 처리" },
  PAID: { to: "COMPLETED", label: "정산 완료" },
  COMPLETED: null,
  CANCELED: null,
};

const BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-sky-100 text-sky-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELED: "bg-slate-100 text-slate-500",
};

export function AdminSettlements() {
  const [rows, setRows] = useState<Settlement[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await api<{ settlements: Settlement[] }>("/api/settlements");
      setRows(res.settlements);
    } catch (e: any) {
      setError(e?.message ?? "불러오기 실패 (ADMIN 필요)");
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function advance(id: string, to: "PAID" | "COMPLETED" | "CANCELED") {
    setBusy(id);
    setError(null);
    try {
      await api(`/api/settlements/${id}/status`, {
        method: "POST",
        body: JSON.stringify({ status: to }),
      });
      await load();
    } catch (e: any) {
      setError(e?.message ?? "처리 실패");
    } finally {
      setBusy(null);
    }
  }

  if (error) return <p className="rounded-lg bg-red-50 p-4 text-red-600">{error}</p>;
  if (!rows) return <div className="h-40 animate-pulse rounded-xl2 bg-sky-50" />;
  if (rows.length === 0)
    return <p className="ws-card p-8 text-center text-slate-500">정산 내역이 없습니다.</p>;

  return (
    <div className="space-y-2">
      {rows.map((s) => {
        const next = NEXT[s.status];
        return (
          <div key={s.id} className="ws-card flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-bold text-slate-900">{s.job?.title ?? "돌봄"}</p>
              <p className="text-sm text-slate-500">
                총 {won(s.grossAmount)} · 수수료 {won(s.platformFee)} · 지급 {won(s.netAmount)}
              </p>
              <p className="text-xs text-slate-400">{formatDate(s.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`ws-badge ${BADGE[s.status]}`}>{s.status}</span>
              {next && (
                <button
                  onClick={() => advance(s.id, next.to)}
                  disabled={busy === s.id}
                  className="ws-btn-primary text-sm"
                >
                  {busy === s.id ? "…" : next.label}
                </button>
              )}
              {s.status === "PENDING" && (
                <button
                  onClick={() => advance(s.id, "CANCELED")}
                  disabled={busy === s.id}
                  className="ws-btn-ghost text-sm"
                >
                  취소
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
