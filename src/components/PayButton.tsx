"use client";

import { useState } from "react";
import { api } from "@/lib/client/api";
import { openTossCheckout } from "@/lib/client/toss";
import { won } from "@/lib/format";
import { Modal } from "./Modal";

interface PayResponse {
  orderId: string;
  amount: number;
  orderName: string;
  customerName?: string;
  clientKey: string;
  breakdown: {
    hourlyRate: number;
    hours: number;
    careFee: number;
    platformFee: number;
    feeRatePercent: number;
    sitterPayout: number;
  };
}

// 결제 버튼 — 돌봄비 결제. 결제 전 수수료 내역(부모 결제액/플랫폼 수수료/시터 정산액)을
// 미리 보여준 뒤 토스 결제창을 엽니다.
export function PayButton({
  jobId,
  label = "돌봄비 결제하기",
  className = "ws-btn-primary",
}: {
  jobId: string;
  label?: string;
  className?: string;
}) {
  const [quote, setQuote] = useState<PayResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchQuote() {
    setBusy(true);
    setError(null);
    try {
      const res = await api<PayResponse>(`/api/jobs/${jobId}/pay`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setQuote(res);
    } catch (e: any) {
      setError(e?.message ?? "결제 정보를 불러오지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function pay() {
    if (!quote) return;
    setBusy(true);
    try {
      await openTossCheckout({
        clientKey: quote.clientKey,
        amount: quote.amount,
        orderId: quote.orderId,
        orderName: quote.orderName,
        customerName: quote.customerName,
      });
    } catch (e: any) {
      setError(e?.message ?? "결제를 시작하지 못했습니다.");
      setBusy(false);
    }
  }

  return (
    <>
      <button onClick={fetchQuote} disabled={busy} className={className}>
        {busy && !quote ? "계산 중…" : label}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {quote && (
        <Modal onClose={() => setQuote(null)} title="돌봄비 결제 내역">
          <div className="ws-card divide-y divide-sky-100 p-1">
            <Row label="합의 시급" value={`${won(quote.breakdown.hourlyRate)} / 시간`} />
            <Row label="근무 시간" value={`${quote.breakdown.hours} 시간`} />
            <Row label="돌봄비 합계" value={won(quote.breakdown.careFee)} strong />
            <Row
              label={`플랫폼 수수료 (${quote.breakdown.feeRatePercent}%)`}
              value={`- ${won(quote.breakdown.platformFee)}`}
              muted
            />
            <Row label="시터 정산액" value={won(quote.breakdown.sitterPayout)} strong accent />
          </div>
          <p className="mt-3 text-center text-xs text-slate-400">
            결제 금액 <b>{won(quote.amount)}</b> · 수수료는 자동 차감되어 시터에게 정산됩니다.
          </p>
          <button onClick={pay} disabled={busy} className="ws-btn-primary mt-4 w-full">
            {busy ? "이동 중…" : `${won(quote.amount)} 결제하기`}
          </button>
        </Modal>
      )}
    </>
  );
}

function Row({
  label,
  value,
  strong,
  muted,
  accent,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5">
      <span className={`text-sm ${muted ? "text-slate-400" : "text-slate-500"}`}>{label}</span>
      <span
        className={`${strong ? "font-extrabold" : "font-medium"} ${
          accent ? "text-sky-600" : "text-slate-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
