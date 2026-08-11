"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { formatDate } from "@/lib/format";

interface Log {
  id: string;
  action: string;
  actor: string;
  targetType: string | null;
  targetId: string | null;
  metadata: unknown;
  ip: string | null;
  createdAt: string;
}

const ACTION_KO: Record<string, string> = {
  SETTINGS_UPDATED: "수익 설정 변경",
  VERIFICATION_APPROVED: "신원확인 승인",
  VERIFICATION_REJECTED: "신원확인 반려",
  SETTLEMENT_STATUS_CHANGED: "정산 상태 변경",
  REPORT_STATUS_CHANGED: "신고 처리",
  USER_REPORTED: "사용자 신고",
  USER_BLOCKED: "사용자 차단",
  USER_UNBLOCKED: "차단 해제",
};

export function AdminAudit() {
  const [logs, setLogs] = useState<Log[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ logs: Log[] }>("/api/admin/audit")
      .then((r) => setLogs(r.logs))
      .catch((e) => setError(e?.message ?? "불러오기 실패 (ADMIN 필요)"));
  }, []);

  if (error) return <p className="rounded-lg bg-red-50 p-4 text-red-600">{error}</p>;
  if (!logs) return <div className="h-40 animate-pulse rounded-xl2 bg-sky-50" />;
  if (logs.length === 0)
    return <p className="ws-card p-8 text-center text-slate-500">기록이 없습니다.</p>;

  return (
    <div className="ws-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-sky-100 text-left text-slate-400">
            <th className="px-4 py-3 font-medium">일시</th>
            <th className="px-4 py-3 font-medium">행위자</th>
            <th className="px-4 py-3 font-medium">작업</th>
            <th className="px-4 py-3 font-medium">대상</th>
            <th className="px-4 py-3 font-medium">IP</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-sky-50">
          {logs.map((l) => (
            <tr key={l.id}>
              <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(l.createdAt)}</td>
              <td className="px-4 py-3 font-medium text-slate-800">{l.actor}</td>
              <td className="px-4 py-3">
                <span className="ws-badge bg-sky-100 text-sky-700">{ACTION_KO[l.action] ?? l.action}</span>
              </td>
              <td className="px-4 py-3 text-slate-500">
                {l.targetType ? `${l.targetType}:${(l.targetId ?? "").slice(0, 8)}` : "-"}
              </td>
              <td className="px-4 py-3 text-slate-400">{l.ip ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
