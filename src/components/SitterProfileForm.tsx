"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { won } from "@/lib/format";

interface Fields {
  bio: string;
  hourlyRate: number;
  yearsOfExp: number;
  city: string;
}

// Sitter's editable listing details (rate, bio, city, experience).
export function SitterProfileForm() {
  const [f, setF] = useState<Fields | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Fields>("/api/me/sitter-profile").then(setF).catch(() => setError("불러오기 실패"));
  }, []);

  function set<K extends keyof Fields>(k: K, v: Fields[K]) {
    setF((prev) => (prev ? { ...prev, [k]: v } : prev));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!f) return;
    setSaving(true);
    setMsg(null);
    setError(null);
    try {
      const updated = await api<Fields>("/api/me/sitter-profile", {
        method: "PUT",
        body: JSON.stringify({
          bio: f.bio || undefined,
          hourlyRate: Number(f.hourlyRate),
          yearsOfExp: Number(f.yearsOfExp),
          city: f.city || undefined,
        }),
      });
      setF(updated);
      setMsg("프로필이 저장되었어요 ✅");
    } catch (e: any) {
      setError(e?.message ?? "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  if (error && !f) return <p className="rounded-lg bg-red-50 p-4 text-red-600">{error}</p>;
  if (!f) return <div className="h-56 animate-pulse rounded-xl bg-sky-50" />;

  return (
    <form onSubmit={save} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm text-slate-600">
          시급 (₩/시간)
          <input
            type="number"
            step="500"
            min={1000}
            value={f.hourlyRate}
            onChange={(e) => set("hourlyRate", Number(e.target.value))}
            aria-label="시급"
            className="mt-1 w-full rounded-lg border border-sky-200 px-3 py-2"
          />
          <span className="mt-1 block text-xs text-slate-400">{won(f.hourlyRate || 0)} / 시간</span>
        </label>
        <label className="text-sm text-slate-600">
          경력 (년)
          <input
            type="number"
            min={0}
            max={60}
            value={f.yearsOfExp}
            onChange={(e) => set("yearsOfExp", Number(e.target.value))}
            aria-label="경력"
            className="mt-1 w-full rounded-lg border border-sky-200 px-3 py-2"
          />
        </label>
      </div>
      <label className="block text-sm text-slate-600">
        지역
        <input
          value={f.city}
          onChange={(e) => set("city", e.target.value)}
          placeholder="예: Seoul"
          aria-label="지역"
          className="mt-1 w-full rounded-lg border border-sky-200 px-3 py-2"
        />
      </label>
      <label className="block text-sm text-slate-600">
        소개
        <textarea
          value={f.bio}
          onChange={(e) => set("bio", e.target.value)}
          placeholder="자기소개, 돌봄 경험, 강점 등을 적어주세요."
          aria-label="소개"
          rows={4}
          className="mt-1 w-full rounded-lg border border-sky-200 px-3 py-2"
        />
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="ws-btn-primary text-sm">
          {saving ? "저장 중…" : "프로필 저장"}
        </button>
        {msg && <span className="text-sm text-sky-600">{msg}</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  );
}
