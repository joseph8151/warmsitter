"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/client/api";
import { Modal } from "./Modal";

const REASONS: { value: string; label: string }[] = [
  { value: "INAPPROPRIATE", label: "부적절한 프로필/행동" },
  { value: "HARASSMENT", label: "괴롭힘/폭언" },
  { value: "SPAM", label: "스팸/광고" },
  { value: "SAFETY", label: "안전 우려" },
  { value: "OTHER", label: "기타" },
];

// Safety controls on a sitter profile: report (modal) + block (toggle).
export function ReportBlockMenu({
  targetId,
  targetName,
  initialBlocked = false,
}: {
  targetId: string;
  targetName: string;
  initialBlocked?: boolean;
}) {
  const [blocked, setBlocked] = useState(initialBlocked);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0].value);
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggleBlock() {
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ blocked: boolean }>("/api/blocks", {
        method: "POST",
        body: JSON.stringify({ userId: targetId }),
      });
      setBlocked(res.blocked);
      setNotice(res.blocked ? `${targetName}님을 차단했어요.` : `차단을 해제했어요.`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) window.location.href = "/login";
      else setError("처리에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function submitReport() {
    setBusy(true);
    setError(null);
    try {
      await api("/api/reports", {
        method: "POST",
        body: JSON.stringify({ reportedId: targetId, reason, detail: detail || undefined }),
      });
      setReportOpen(false);
      setDetail("");
      setNotice("신고가 접수되었어요. 검토 후 조치하겠습니다.");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) window.location.href = "/login";
      else setError("신고 접수에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 flex items-center gap-3 text-sm">
      <button onClick={() => setReportOpen(true)} className="text-slate-400 hover:text-red-500">
        🚩 신고
      </button>
      <span className="text-slate-200">·</span>
      <button onClick={toggleBlock} disabled={busy} className="text-slate-400 hover:text-slate-700">
        {blocked ? "🔓 차단 해제" : "🚫 차단"}
      </button>
      {notice && <span className="text-sky-600">{notice}</span>}
      {error && <span className="text-red-500">{error}</span>}

      {reportOpen && (
        <Modal onClose={() => setReportOpen(false)} title={`${targetName}님 신고`}>
          <div className="space-y-3">
            <label className="block text-sm text-slate-600">
              사유
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1 w-full rounded-lg border border-sky-200 px-3 py-2"
              >
                {REASONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </label>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="상세 내용 (선택)"
              aria-label="신고 상세 내용"
              rows={4}
              className="w-full rounded-lg border border-sky-200 px-3 py-2 text-sm"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => setReportOpen(false)} className="ws-btn-ghost flex-1">취소</button>
              <button onClick={submitReport} disabled={busy} className="ws-btn-primary flex-1">
                {busy ? "접수 중…" : "신고 접수"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
