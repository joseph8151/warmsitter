"use client";

import { useState } from "react";
import { api } from "@/lib/client/api";

// Parent creates a job post (step 1). Free — no deduction.
export function JobForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [hours, setHours] = useState("3");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ job: { id: string } }>("/api/jobs", {
        method: "POST",
        body: JSON.stringify({
          title,
          description: description || undefined,
          city: city || undefined,
          hoursPerSession: Number(hours),
        }),
      });
      window.location.href = `/jobs/${res.job.id}`;
    } catch (e: any) {
      setError(e?.message ?? "작성 실패");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="ws-card space-y-3 p-6">
      <input
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목 (예: 화요일 오후 돌봄 2명)"
        className="w-full rounded-lg border border-sky-200 px-3 py-2"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="상세 내용 (아이 나이, 시간대, 요청 사항 등)"
        rows={4}
        className="w-full rounded-lg border border-sky-200 px-3 py-2"
      />
      <div className="flex gap-2">
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="지역"
          className="flex-1 rounded-lg border border-sky-200 px-3 py-2"
        />
        <input
          type="number"
          step="0.5"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          placeholder="시간"
          className="w-28 rounded-lg border border-sky-200 px-3 py-2"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={busy} type="submit" className="ws-btn-primary w-full">
        {busy ? "작성 중…" : "구인글 등록"}
      </button>
    </form>
  );
}
