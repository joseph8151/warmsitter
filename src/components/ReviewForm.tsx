"use client";

import { useState } from "react";
import { api } from "@/lib/client/api";
import { ImageUploader } from "./ImageUploader";

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
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await api("/api/reviews", {
        method: "POST",
        body: JSON.stringify({
          jobId,
          targetId,
          rating,
          comment: comment || undefined,
          photoUrl: photoUrl || undefined,
        }),
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
      <div className="flex gap-1 text-2xl" role="radiogroup" aria-label="별점">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            role="radio"
            aria-checked={n === rating}
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
        aria-label="후기"
        className="w-full rounded-lg border border-sky-200 px-3 py-2 text-sm"
      />
      <div className="flex items-center gap-3">
        {photoUrl ? (
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl} alt="첨부한 사진" className="h-14 w-14 rounded-lg object-cover" />
            <button
              type="button"
              onClick={() => setPhotoUrl(null)}
              className="text-xs text-slate-400 hover:text-red-500"
            >
              사진 삭제
            </button>
          </div>
        ) : (
          <ImageUploader kind="worklog" label="사진 첨부 (선택)" onUploaded={setPhotoUrl} />
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button onClick={submit} disabled={busy} className="ws-btn-primary text-sm">
        {busy ? "저장 중…" : "리뷰 등록"}
      </button>
    </div>
  );
}
