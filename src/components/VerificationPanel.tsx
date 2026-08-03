"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { ImageUploader } from "./ImageUploader";

interface Status {
  verified: boolean;
  submission: { id: string; status: string; rejectionReason?: string | null } | null;
}

// Sitter identity verification (신원확인): upload an ID document → admin review.
export function VerificationPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [legalName, setLegalName] = useState("");
  const [documentPath, setDocumentPath] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setStatus(await api<Status>("/api/verification"));
    } catch {
      setStatus(null);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function submit() {
    if (!documentPath) {
      setError("신분증 파일을 먼저 업로드해주세요.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api("/api/verification", {
        method: "POST",
        body: JSON.stringify({ legalName: legalName || undefined, documentPath }),
      });
      setDocumentPath(null);
      await load();
    } catch (e: any) {
      setError(e?.message ?? "제출 실패");
    } finally {
      setBusy(false);
    }
  }

  if (!status) return <div className="h-24 animate-pulse rounded-xl bg-sky-50" />;

  if (status.verified) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4">
        <span className="text-2xl">✅</span>
        <div>
          <p className="font-bold text-emerald-700">신원확인 완료</p>
          <p className="text-sm text-emerald-600">프로필에 인증 뱃지가 표시됩니다.</p>
        </div>
      </div>
    );
  }

  const pending = status.submission?.status === "PENDING";
  const rejected = status.submission?.status === "REJECTED";

  return (
    <div>
      {pending ? (
        <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-4">
          <span className="text-2xl">🕒</span>
          <div>
            <p className="font-bold text-amber-700">심사 중</p>
            <p className="text-sm text-amber-600">관리자 검토 후 인증 뱃지가 부여됩니다.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {rejected && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              이전 제출이 반려되었습니다{status.submission?.rejectionReason ? `: ${status.submission.rejectionReason}` : ""}. 다시 제출해주세요.
            </p>
          )}
          <input
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            placeholder="실명 (신분증과 동일하게)"
            className="w-full rounded-lg border border-sky-200 px-3 py-2 text-sm"
          />
          <div className="flex items-center gap-3">
            <ImageUploader kind="verification" label="신분증 업로드" onUploaded={setDocumentPath} />
            {documentPath && <span className="text-sm text-sky-600">첨부됨 ✓</span>}
          </div>
          <p className="text-xs text-slate-400">
            신분증은 비공개 저장소에 안전하게 보관되며 관리자만 심사용으로 열람합니다.
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button onClick={submit} disabled={busy} className="ws-btn-primary text-sm">
            {busy ? "제출 중…" : "신원확인 제출"}
          </button>
        </div>
      )}
    </div>
  );
}
