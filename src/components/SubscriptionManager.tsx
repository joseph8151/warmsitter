"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { useBilling } from "./BillingProvider";
import { formatDate } from "@/lib/format";

interface SubInfo {
  isPremium: boolean;
  subscription: {
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    hasBillingKey: boolean;
  } | null;
}

export function SubscriptionManager() {
  const { openPurchase, refresh } = useBilling();
  const [info, setInfo] = useState<SubInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    try {
      setInfo(await api<SubInfo>("/api/subscription"));
    } catch {
      setInfo(null);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function cancel() {
    if (!window.confirm("정기결제를 해지할까요? 남은 기간까지는 프리미엄이 유지됩니다.")) return;
    setBusy(true);
    setMsg(null);
    try {
      await api("/api/subscription/cancel", { method: "POST" });
      setMsg("해지 예약됨 — 현재 기간 종료 시 종료됩니다.");
      await load();
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!info) return null;

  const sub = info.subscription;
  const active = info.isPremium && sub?.status === "ACTIVE";

  return (
    <section className="ws-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-slate-900">프리미엄 멤버십</h2>
          {active ? (
            <p className="mt-1 text-sm text-slate-500">
              {sub?.cancelAtPeriodEnd
                ? `해지 예약됨 · ${formatDate(sub?.currentPeriodEnd)}에 종료`
                : `다음 결제일 ${formatDate(sub?.currentPeriodEnd)}`}
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-500">
              프리미엄으로 무제한 제안 + 우선 노출 뱃지를 이용하세요.
            </p>
          )}
        </div>
        {active ? (
          <span className="ws-badge bg-gradient-to-r from-sunny-300 to-sunny-400 text-slate-900">
            ★ Premium
          </span>
        ) : (
          <button onClick={() => openPurchase("premium")} className="ws-btn-accent text-sm">
            구독하기
          </button>
        )}
      </div>

      {active && !sub?.cancelAtPeriodEnd && (
        <button onClick={cancel} disabled={busy} className="ws-btn-ghost mt-4 text-sm">
          {busy ? "처리 중…" : "정기결제 해지"}
        </button>
      )}
      {msg && <p className="mt-2 text-sm text-sky-600">{msg}</p>}
    </section>
  );
}
