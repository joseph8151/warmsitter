"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { openTossCheckout } from "@/lib/client/toss";
import type { CreditPackage } from "@/lib/types";
import { Modal } from "./Modal";
import { won } from "@/lib/format";

type Tab = "ticket" | "credit" | "premium";

interface PublicSettings {
  ticketPrice: number;
  ticketDurationDays: number;
  creditPackages: CreditPackage[];
  premiumMonthlyPrice: number;
  feeRatePercent: number;
  clientKey: string;
}

interface CheckoutResponse {
  orderId: string;
  amount: number;
  orderName: string;
  customerName?: string;
  clientKey: string;
}

// 구매 모달 — 이용권 / 크레딧 / 프리미엄 구독 구매.
export function PurchaseModal({
  initialTab = "ticket",
  onClose,
  onPurchased,
}: {
  initialTab?: Tab;
  onClose: () => void;
  onPurchased?: () => void;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<PublicSettings>("/api/settings/public")
      .then(setSettings)
      .catch(() => setError("가격 정보를 불러오지 못했습니다."));
  }, []);

  async function checkout(endpoint: string, body?: object) {
    setBusy(endpoint);
    setError(null);
    try {
      const res = await api<CheckoutResponse>(endpoint, {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      });
      await openTossCheckout({
        clientKey: res.clientKey,
        amount: res.amount,
        orderId: res.orderId,
        orderName: res.orderName,
        customerName: res.customerName,
      });
      onPurchased?.();
      // The Toss SDK redirects the browser, so we usually don't reach here.
    } catch (e: any) {
      setError(e?.message ?? "결제를 시작하지 못했습니다.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Modal onClose={onClose} title="warm sitter 이용권 구매">
      <div className="mb-4 flex gap-2 rounded-full bg-sky-50 p-1">
        {(["ticket", "credit", "premium"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
              tab === t ? "bg-white text-sky-700 shadow-card" : "text-slate-500"
            }`}
          >
            {t === "ticket" ? "이용권" : t === "credit" ? "크레딧" : "프리미엄"}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {!settings ? (
        <div className="h-40 animate-pulse rounded-xl bg-sky-50" />
      ) : tab === "ticket" ? (
        <div className="ws-card p-5 text-center">
          <p className="text-sm font-semibold text-sky-600">가장 인기 있는 선택</p>
          <p className="mt-1 text-3xl font-extrabold text-slate-900">
            {settings.ticketDurationDays}일 무제한 이용권
          </p>
          <p className="mt-2 text-slate-500">
            기간 내 면접 제안·수락·채팅을 <b>차감 없이</b> 무제한으로.
          </p>
          <p className="mt-4 text-4xl font-extrabold text-sky-600">{won(settings.ticketPrice)}</p>
          <button
            disabled={busy !== null}
            onClick={() => checkout("/api/purchase/ticket")}
            className="ws-btn-primary mt-5 w-full"
          >
            {busy ? "이동 중…" : "이용권 구매하기"}
          </button>
        </div>
      ) : tab === "credit" ? (
        <div className="grid gap-3">
          {settings.creditPackages.map((p) => (
            <div
              key={p.id}
              className="ws-card flex items-center justify-between p-4"
            >
              <div>
                <p className="font-bold text-slate-900">
                  {p.label}
                  {p.bestValue && (
                    <span className="ml-2 ws-badge bg-sunny-300 text-slate-900">BEST</span>
                  )}
                </p>
                <p className="text-sm text-slate-500">{p.credits} 크레딧</p>
              </div>
              <button
                disabled={busy !== null}
                onClick={() => checkout("/api/purchase/credit", { packageId: p.id })}
                className="ws-btn-primary"
              >
                {won(p.price)}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="ws-card p-5 text-center">
          <p className="ws-badge mx-auto bg-gradient-to-r from-sunny-300 to-sunny-400 text-slate-900">
            ★ Premium
          </p>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">프리미엄 멤버십</p>
          <ul className="mx-auto mt-4 max-w-xs space-y-2 text-left text-sm text-slate-600">
            <li>✅ 무제한 면접 제안 · 수락 · 채팅 (차감 없음)</li>
            <li>✅ 검색 결과 우선 노출 뱃지</li>
            <li>✅ 신규 시터 우선 알림 등 추가 기능</li>
          </ul>
          <p className="mt-4 text-4xl font-extrabold text-sky-600">
            {won(settings.premiumMonthlyPrice)}
            <span className="text-base font-medium text-slate-400"> / 월</span>
          </p>
          <button
            disabled={busy !== null}
            onClick={() => checkout("/api/purchase/subscription")}
            className="ws-btn-accent mt-5 w-full"
          >
            {busy ? "이동 중…" : "프리미엄 시작하기"}
          </button>
        </div>
      )}

      <p className="mt-4 text-center text-xs text-slate-400">
        결제는 토스페이먼츠로 안전하게 처리됩니다.
      </p>
    </Modal>
  );
}
