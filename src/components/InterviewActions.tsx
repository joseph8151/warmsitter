"use client";

import { useState } from "react";
import { api } from "@/lib/client/api";

// Sitter responds to a proposed interview (accept / decline), optionally with a
// scheduled time.
export function InterviewActions({ interviewId }: { interviewId: string }) {
  const [when, setWhen] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function respond(action: "ACCEPT" | "DECLINE") {
    setBusy(true);
    try {
      await api(`/api/interviews/${interviewId}/respond`, {
        method: "POST",
        body: JSON.stringify({
          action,
          scheduledFor: action === "ACCEPT" && when ? new Date(when).toISOString() : undefined,
        }),
      });
      setResult(action === "ACCEPT" ? "수락함 ✓" : "거절함");
    } catch {
      setResult("처리 실패");
    } finally {
      setBusy(false);
    }
  }

  if (result) return <span className="ws-badge bg-sky-100 text-sky-700">{result}</span>;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="datetime-local"
        value={when}
        onChange={(e) => setWhen(e.target.value)}
        className="rounded-lg border border-sky-200 px-2 py-1 text-sm"
      />
      <button onClick={() => respond("DECLINE")} disabled={busy} className="ws-btn-ghost text-sm">
        거절
      </button>
      <button onClick={() => respond("ACCEPT")} disabled={busy} className="ws-btn-primary text-sm">
        {busy ? "…" : "수락"}
      </button>
    </div>
  );
}
