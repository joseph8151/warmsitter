"use client";

import { useEffect } from "react";

// Fire-and-forget: records that the current parent viewed this sitter. Renders
// nothing. The server endpoint ignores guests / non-parents / self.
export function RecordSitterView({ sitterId }: { sitterId: string }) {
  useEffect(() => {
    fetch("/api/recent-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sitterId }),
      keepalive: true,
    }).catch(() => {});
  }, [sitterId]);

  return null;
}
