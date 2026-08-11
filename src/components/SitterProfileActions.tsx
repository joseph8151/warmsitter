"use client";

import { useState } from "react";
import { useBilling } from "./BillingProvider";
import { api } from "@/lib/client/api";
import { FavoriteButton } from "./FavoriteButton";

// Connect actions on the sitter detail page: propose interview / start chat
// (both billable, via BillingProvider) + favorite.
export function SitterProfileActions({
  sitterId,
  favorited,
}: {
  sitterId: string;
  favorited: boolean;
}) {
  const { runBillable } = useBilling();
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function proposeInterview() {
    setBusy("interview");
    setStatus(null);
    const res = await runBillable(() =>
      api("/api/interviews", { method: "POST", body: JSON.stringify({ sitterId }) })
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
        body: JSON.stringify({ sitterId }),
      })
    );
    setBusy(null);
    if (res?.room) window.location.href = `/chat/${res.room.id}`;
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <button onClick={proposeInterview} disabled={busy !== null} className="ws-btn-ghost flex-1">
          {busy === "interview" ? "…" : "면접 제안"}
        </button>
        <button onClick={startChat} disabled={busy !== null} className="ws-btn-primary flex-1">
          {busy === "chat" ? "…" : "채팅 시작"}
        </button>
        <FavoriteButton sitterId={sitterId} initialFavorited={favorited} />
      </div>
      {status && <p className="mt-2 text-center text-sm font-medium text-sky-600">{status}</p>}
    </div>
  );
}
