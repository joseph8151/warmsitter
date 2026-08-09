"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useBilling } from "./BillingProvider";
import { api } from "@/lib/client/api";
import { won } from "@/lib/format";
import { FavoriteButton } from "./FavoriteButton";
import { Avatar } from "./brand/Avatar";
import { BadgeCheckIcon, StarIcon } from "./brand/Icons";

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
export function SitterCard({ sitter, favorited = false }: { sitter: Sitter; favorited?: boolean }) {
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
    <div className="ws-card ws-card-hover flex flex-col p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-soft">
            {sitter.photoUrl ? (
              <Image src={sitter.photoUrl} alt={sitter.name} fill sizes="48px" className="object-cover" />
            ) : (
              <Avatar name={sitter.name} className="h-12 w-12" />
            )}
          </div>
          <div>
            <Link href={`/sitters/${sitter.id}`} className="inline-flex items-center gap-1.5 font-bold text-ink-900 hover:text-sky-600">
              {sitter.name}
              {sitter.isPremium && (
                <span className="ws-badge bg-gradient-to-r from-sunny-300 to-sunny-400 text-ink-900">★</span>
              )}
            </Link>
            <p className="text-sm text-slate-500">
              {sitter.city || "전국"} · 경력 {sitter.yearsOfExp}년
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {sitter.verified && (
            <span className="ws-badge bg-sky-50 text-sky-700">
              <BadgeCheckIcon className="h-3.5 w-3.5" /> 인증
            </span>
          )}
          <FavoriteButton sitterId={sitter.id} initialFavorited={favorited} className="h-8 w-8 text-base" />
        </div>
      </div>

      <Link href={`/sitters/${sitter.id}`} className="mt-3 line-clamp-2 text-sm text-slate-600 hover:text-slate-800">
        {sitter.bio || "따뜻하게 아이를 돌봐드려요."}
      </Link>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-lg font-extrabold text-sky-600">{won(sitter.hourlyRate)}<span className="text-sm font-medium text-slate-400">/시간</span></span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-sunny-600">
          <StarIcon className="h-4 w-4" /> {sitter.ratingAvg.toFixed(1)} <span className="font-normal text-slate-400">({sitter.ratingCount})</span>
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
