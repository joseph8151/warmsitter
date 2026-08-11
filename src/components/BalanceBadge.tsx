"use client";

import { useBilling } from "./BillingProvider";

// 잔액 표시 — compact credit / ticket / premium status pill shown in the header.
export function BalanceBadge() {
  const { balance, loading, openPurchase } = useBilling();

  if (loading) {
    return <div className="h-9 w-28 animate-pulse rounded-full bg-sky-100" />;
  }
  if (!balance) {
    return (
      <a href="/login" className="ws-btn-ghost text-sm">
        Sign in
      </a>
    );
  }

  const expiring = balance.expiry.ticket.level === "expiring_soon";

  return (
    <div className="flex items-center gap-2">
      {balance.isPremium ? (
        <span className="ws-badge bg-gradient-to-r from-sunny-300 to-sunny-400 text-slate-900">
          ★ Premium
        </span>
      ) : balance.hasActiveTicket ? (
        <button
          onClick={() => openPurchase("ticket")}
          className={`ws-badge ${expiring ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-700"}`}
          title={balance.ticketExpiresAt ?? undefined}
        >
          🎟️ 이용권 {balance.expiry.ticket.daysLeft ?? 0}일 남음
        </button>
      ) : (
        <button
          onClick={() => openPurchase("credit")}
          className="ws-badge bg-sky-100 text-sky-700"
        >
          💳 크레딧 {balance.creditBalance}
        </button>
      )}
      <button onClick={() => openPurchase("ticket")} className="ws-btn-accent text-sm">
        충전
      </button>
    </div>
  );
}
