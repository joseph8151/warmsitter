"use client";

import { useState } from "react";
import Image from "next/image";
import { useBilling } from "./BillingProvider";
import { api } from "@/lib/client/api";
import { won } from "@/lib/format";

interface Sitter {
  id: string;
  name: string;
  bio: string;
  hourlyRate: number;
  city: string;
  yearsOfExp: number;
  photoUrl: string | null;
  verified: boolean;
  ratingAvg: number;
  ratingCount: number;
  isPremium: boolean;
}

// A sitter result card with the two billable entry points from the flow:
// "면접 제안" (INTERVIEW_PROPOSAL) and "채팅 시작" (START_CHAT).
export function SitterCard({ sitter }: { sitter: Sitter }) {
  const { runBillable } = useBilling();
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function proposeInterview() {
    setBusy("interview");
    setStatus(null);
    const res = await runBillable(() =>
      api("/api/interviews", {
        method: "POST",
        body: JSON.stringify({ sitterId: sitter.id }),
      })
    );
    setBusy(null);
    if (res) setStatus("면접 제안을 보냈어요! ✅");
  }

  async function startChat() {
    setBusy("chat");
    setStatus(null);
    const res = await runBillable(() =>
      api<{ room: { id: string } }>("/api/chats", {
        method: "POST",
        body: JSON.stringify({ sitterId: sitter.id }),
      })
    );
    setBusy(null);
    if (res?.room) {
      setStatus("채팅방이 열렸어요! 💬 이동 중…");
      window.location.href = `/chat/${res.room.id}`;
    }
  }

  return (
    <div className="ws-card flex flex-col p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-sky-100 text-2xl">
            {sitter.photoUrl ? (
              <Image src={sitter.photoUrl} alt={sitter.name} fill sizes="48px" className="object-cover" />
            ) : (
              sitter.name.charAt(0)
            )}
          </div>
          <div>
            <p className="font-bold text-slate-900">
              {sitter.name}
              {sitter.isPremium && (
                <span className="ml-2 ws-badge bg-gradient-to-r from-sunny-300 to-sunny-400 text-slate-900">
                  ★
                </span>
              )}
            </p>
            <p className="text-sm text-slate-500">
              {sitter.city || "전국"} · 경력 {sitter.yearsOfExp}년
            </p>
          </div>
        </div>
        {sitter.verified && (
          <span className="ws-badge bg-sky-100 text-sky-700">✔ 인증</span>
        )}
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-slate-600">{sitter.bio || "따뜻하게 아이를 돌봐드려요."}</p>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-lg font-extrabold text-sky-600">{won(sitter.hourlyRate)}<span className="text-sm font-medium text-slate-400">/시간</span></span>
        <span className="text-sm text-amber-500">
          ⭐ {sitter.ratingAvg.toFixed(1)} <span className="text-slate-400">({sitter.ratingCount})</span>
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={proposeInterview} disabled={busy !== null} className="ws-btn-ghost flex-1 text-sm">
          {busy === "interview" ? "…" : "면접 제안"}
        </button>
        <button onClick={startChat} disabled={busy !== null} className="ws-btn-primary flex-1 text-sm">
          {busy === "chat" ? "…" : "채팅 시작"}
        </button>
      </div>

      {status && <p className="mt-2 text-center text-sm font-medium text-sky-600">{status}</p>}
    </div>
  );
}
