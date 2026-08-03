"use client";

import { useState } from "react";
import Image from "next/image";
import { api } from "@/lib/client/api";
import { ImageUploader } from "./ImageUploader";

// Sitter writes a work log after a care session (step 4), with an optional photo
// uploaded to Supabase Storage.
export function WorkLogForm({ jobId, jobTitle }: { jobId: string; jobTitle: string }) {
  const [hours, setHours] = useState("3");
  const [note, setNote] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await api("/api/worklogs", {
        method: "POST",
        body: JSON.stringify({
          jobId,
          hours: Number(hours),
          note: note || undefined,
          imageUrl: imageUrl || undefined,
        }),
      });
      setDone(true);
    } catch (e: any) {
      setError(e?.message ?? "저장 실패");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return <p className="text-sm font-medium text-sky-600">근무일지가 제출되었어요 ✅</p>;
  }

  return (
    <div className="space-y-2">
      <p className="font-bold text-slate-900">{jobTitle} · 근무일지</p>
      <div className="flex gap-2">
        <input
          type="number"
          step="0.5"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          className="w-28 rounded-lg border border-sky-200 px-3 py-2 text-sm"
          placeholder="시간"
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="flex-1 rounded-lg border border-sky-200 px-3 py-2 text-sm"
          placeholder="오늘의 돌봄 메모"
        />
      </div>

      <div className="flex items-center gap-3">
        <ImageUploader kind="worklog" label="사진 첨부" onUploaded={setImageUrl} />
        {imageUrl && (
          <Image
            src={imageUrl}
            alt="worklog"
            width={48}
            height={48}
            className="h-12 w-12 rounded-lg object-cover"
          />
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button onClick={submit} disabled={busy} className="ws-btn-primary text-sm">
        {busy ? "저장 중…" : "근무일지 제출"}
      </button>
    </div>
  );
}
