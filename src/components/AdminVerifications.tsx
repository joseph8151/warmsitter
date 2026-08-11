"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { formatDate } from "@/lib/format";

interface Item {
  id: string;
  sitter: { id: string; name: string; email: string };
  legalName: string | null;
  submittedAt: string;
  documentUrl: string | null;
}

export function AdminVerifications() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await api<{ verifications: Item[] }>("/api/admin/verifications");
      setItems(res.verifications);
    } catch (e: any) {
      setError(e?.message ?? "불러오기 실패 (ADMIN 필요)");
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function review(id: string, action: "APPROVE" | "REJECT") {
    const rejectionReason =
      action === "REJECT" ? window.prompt("반려 사유 (선택)") ?? undefined : undefined;
    setBusy(id);
    try {
      await api(`/api/admin/verifications/${id}`, {
        method: "POST",
        body: JSON.stringify({ action, rejectionReason }),
      });
      await load();
    } catch (e: any) {
      setError(e?.message ?? "처리 실패");
    } finally {
      setBusy(null);
    }
  }

  if (error) return <p className="rounded-lg bg-red-50 p-4 text-red-600">{error}</p>;
  if (!items) return <div className="h-40 animate-pulse rounded-xl2 bg-sky-50" />;
  if (items.length === 0)
    return <p className="ws-card p-8 text-center text-slate-500">대기 중인 신원확인 요청이 없습니다.</p>;

  return (
    <div className="space-y-3">
      {items.map((it) => (
        <div key={it.id} className="ws-card flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-bold text-slate-900">
              {it.sitter.name} {it.legalName && <span className="text-slate-500">({it.legalName})</span>}
            </p>
            <p className="text-sm text-slate-500">{it.sitter.email} · {formatDate(it.submittedAt)}</p>
            {it.documentUrl ? (
              <a href={it.documentUrl} target="_blank" rel="noreferrer" className="text-sm text-sky-600 underline">
                신분증 열람 (서명 URL)
              </a>
            ) : (
              <span className="text-sm text-slate-400">문서 미리보기 불가 (스토리지 미설정)</span>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => review(it.id, "REJECT")} disabled={busy === it.id} className="ws-btn-ghost text-sm">
              반려
            </button>
            <button onClick={() => review(it.id, "APPROVE")} disabled={busy === it.id} className="ws-btn-primary text-sm">
              승인
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
