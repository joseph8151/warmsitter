"use client";

import { useState } from "react";
import { useBilling } from "./BillingProvider";
import { api } from "@/lib/client/api";

// Parent accepts a sitter's application (step 2). Billable: ACCEPT_APPLICATION.
// On insufficient balance the BillingProvider opens the purchase modal.
export function AcceptApplicationButton({
  applicationId,
  accepted,
}: {
  applicationId: string;
  accepted: boolean;
}) {
  const { runBillable } = useBilling();
  const [done, setDone] = useState(accepted);
  const [busy, setBusy] = useState(false);

  async function accept() {
    setBusy(true);
    const res = await runBillable(() =>
      api(`/api/applications/${applicationId}/accept`, { method: "POST" })
    );
    setBusy(false);
    if (res) {
      setDone(true);
      window.location.reload();
    }
  }

  if (done) return <span className="ws-badge bg-emerald-100 text-emerald-700">수락됨 ✓</span>;

  return (
    <button onClick={accept} disabled={busy} className="ws-btn-primary text-sm">
      {busy ? "…" : "수락"}
    </button>
  );
}
