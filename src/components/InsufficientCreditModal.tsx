"use client";

import { Modal } from "./Modal";

// "이용권이 부족합니다" 모달 — shown when a billable action returns 402.
// The primary CTA routes the user to the purchase modal.
export function InsufficientCreditModal({
  cost,
  balance,
  onClose,
  onBuy,
}: {
  cost: number;
  balance: number;
  onClose: () => void;
  onBuy: () => void;
}) {
  return (
    <Modal onClose={onClose} title="이용권이 부족합니다">
      <div className="text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-sky-100 text-3xl">
          🎟️
        </div>
        <p className="mt-4 text-slate-600">
          이 작업에는 <b className="text-sky-700">{cost} 크레딧</b>이 필요해요.
          <br />
          현재 잔액은 <b>{balance} 크레딧</b>입니다.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          30일 이용권을 구매하면 기간 내 무제한으로 이용할 수 있어요.
        </p>

        <div className="mt-6 flex gap-2">
          <button onClick={onClose} className="ws-btn-ghost flex-1">
            나중에
          </button>
          <button onClick={onBuy} className="ws-btn-primary flex-1">
            이용권 구매하기
          </button>
        </div>
      </div>
    </Modal>
  );
}
