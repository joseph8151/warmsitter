"use client";

import { useState } from "react";
import { api } from "@/lib/client/api";

// Sitter applies to a job. Free for the sitter.
export function ApplyButton({ jobId, applied }: { jobId: string; applied: boolean }) {
  const [done, setDone] = useState(applied);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function apply() {
    setBusy(true);
    setError(null);
    try {
      await api("/api/applications", {
        method: "POST",
        body: JSON.stringify({ jobId, message: message || undefined }),
      });
      setDone(true);
      setOpen(false);
    } catch (e: any) {
      setError(e?.message ?? "지원 실패");
    } finally {
      setBusy(false);
    }
  }

  if (done) return <span className="ws-badge bg-emerald-100 text-emerald-700">지원 완료 ✓</span>;

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="ws-btn-primary">
        이 구인글에 지원하기
      </button>
    );
  }

  return (
    <div className="ws-card space-y-2 p-4">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="자기소개 / 지원 메시지 (선택)"
        aria-label="지원 메시지"
        rows={3}
        className="w-full rounded-lg border border-sky-200 px-3 py-2 text-sm"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button onClick={() => setOpen(false)} className="ws-btn-ghost text-sm">취소</button>
        <button onClick={apply} disabled={busy} className="ws-btn-primary text-sm">
          {busy ? "지원 중…" : "지원 제출"}
        </button>
      </div>
    </div>
  );
}
