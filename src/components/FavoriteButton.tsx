"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/client/api";

// Heart toggle to save/unsave a sitter. Silently no-ops for non-parents (the
// server enforces PARENT_ONLY / auth).
export function FavoriteButton({
  sitterId,
  initialFavorited = false,
  className = "",
}: {
  sitterId: string;
  initialFavorited?: boolean;
  className?: string;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [busy, setBusy] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const optimistic = !favorited;
    setFavorited(optimistic);
    try {
      const res = await api<{ favorited: boolean }>("/api/favorites", {
        method: "POST",
        body: JSON.stringify({ sitterId }),
      });
      setFavorited(res.favorited);
    } catch (err) {
      setFavorited(!optimistic); // revert
      if (err instanceof ApiError && err.status === 401) {
        window.location.href = "/login";
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-pressed={favorited}
      aria-label={favorited ? "찜 해제" : "찜하기"}
      title={favorited ? "찜 해제" : "찜하기"}
      className={`grid h-9 w-9 place-items-center rounded-full text-lg transition ${
        favorited ? "bg-rose-50 text-rose-500" : "bg-sky-50 text-slate-400 hover:text-rose-400"
      } ${className}`}
    >
      {favorited ? "♥" : "♡"}
    </button>
  );
}
