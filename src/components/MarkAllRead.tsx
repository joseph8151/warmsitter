"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client/api";

// Marks every unread notification read, then refreshes the server component.
export function MarkAllRead() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function markAll() {
    setBusy(true);
    try {
      await api("/api/notifications/read", { method: "POST", body: JSON.stringify({}) });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button onClick={markAll} disabled={busy} className="ws-btn-ghost shrink-0 text-sm">
      {busy ? "…" : "모두 읽음"}
    </button>
  );
}
