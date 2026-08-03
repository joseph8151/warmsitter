"use client";

import { useState } from "react";
import { api } from "@/lib/client/api";

// Step 6: parent & sitter review each other after a completed job.
export function ReviewForm({
  jobId,
  targetId,
  targetName,
}: {
  jobId: string;
  targetId: string;
  targetName: string;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await api("/api/reviews", {
        method: "POST",
        body: JSON.stringify({ jobId, targetId, rating, comment: comment || undefined }),
      });
      setDone(true);
    } catch (e: any) {
      setError(e?.message ?? "리뷰 저장 실패");
    } finally {
      setBusy(false);
    }
  }

  if (done) return <p className="text-sm font-medium text-sky-600">{targetName}님께 리뷰를 남겼어요 ⭐</p>;

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-700">{targetName}님 평가</p>
      <div className="flex gap-1 text-2xl">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={n <= rating ? "text-amber-400" : "text-slate-300"}
            aria-label={`${n}점`}
          >
            ★
          </button>
        ))}
      </div>
      <input
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="후기를 남겨주세요 (선택)"
        className="w-full rounded-lg border border-sky-200 px-3 py-2 text-sm"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button onClick={submit} disabled={busy} className="ws-btn-primary text-sm">
        {busy ? "저장 중…" : "리뷰 등록"}
      </button>
    </div>
  );
}
