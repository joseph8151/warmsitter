"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { formatDate } from "@/lib/format";

interface Report {
  id: string;
  reason: string;
  detail: string | null;
  status: string;
  createdAt: string;
  reporter: { id: string; name: string; email: string };
  reported: { id: string; name: string; email: string; role: string };
}

const REASON_KO: Record<string, string> = {
  INAPPROPRIATE: "부적절",
  HARASSMENT: "괴롭힘",
  SPAM: "스팸",
  SAFETY: "안전",
  OTHER: "기타",
};

export function AdminReports() {
  const [reports, setReports] = useState<Report[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await api<{ reports: Report[] }>("/api/admin/reports");
      setReports(res.reports);
    } catch (e: any) {
      setError(e?.message ?? "불러오기 실패 (ADMIN 필요)");
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function setStatus(id: string, status: "REVIEWING" | "RESOLVED" | "DISMISSED") {
    setBusy(id);
    try {
      await api(`/api/admin/reports/${id}`, { method: "POST", body: JSON.stringify({ status }) });
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (error) return <p className="rounded-lg bg-red-50 p-4 text-red-600">{error}</p>;
  if (!reports) return <div className="h-40 animate-pulse rounded-xl2 bg-sky-50" />;
  if (reports.length === 0)
    return <p className="ws-card p-8 text-center text-slate-500">대기 중인 신고가 없습니다.</p>;

  return (
    <div className="space-y-3">
      {reports.map((r) => (
        <div key={r.id} className="ws-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-bold text-slate-900">
                <span className="ws-badge bg-red-100 text-red-700">{REASON_KO[r.reason] ?? r.reason}</span>{" "}
                {r.reported.name} <span className="text-sm font-normal text-slate-400">({r.reported.role})</span>
              </p>
              <p className="text-sm text-slate-500">
                신고자 {r.reporter.name} · {formatDate(r.createdAt)}
                {r.status === "REVIEWING" && " · 검토 중"}
              </p>
            </div>
            <div className="flex gap-2">
              {r.status === "OPEN" && (
                <button onClick={() => setStatus(r.id, "REVIEWING")} disabled={busy === r.id} className="ws-btn-ghost text-sm">
                  검토 시작
                </button>
              )}
              <button onClick={() => setStatus(r.id, "DISMISSED")} disabled={busy === r.id} className="ws-btn-ghost text-sm">
                기각
              </button>
              <button onClick={() => setStatus(r.id, "RESOLVED")} disabled={busy === r.id} className="ws-btn-primary text-sm">
                조치 완료
              </button>
            </div>
          </div>
          {r.detail && <p className="mt-2 rounded-lg bg-sky-50 p-3 text-sm text-slate-600">{r.detail}</p>}
        </div>
      ))}
    </div>
  );
}
