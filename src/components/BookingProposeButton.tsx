"use client";

import { useState } from "react";
import { api } from "@/lib/client/api";
import { Modal } from "./Modal";
import { won } from "@/lib/format";

// Propose a care booking to the other chat participant.
export function BookingProposeButton({
  counterpartyId,
  jobId,
}: {
  counterpartyId: string;
  jobId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [hours, setHours] = useState("3");
  const [rate, setRate] = useState("18000");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!date) {
      setError("일정을 선택해주세요.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api("/api/bookings", {
        method: "POST",
        body: JSON.stringify({
          counterpartyId,
          jobId,
          scheduledDate: new Date(date).toISOString(),
          hours: Number(hours),
          hourlyRate: Number(rate),
          note: note || undefined,
        }),
      });
      setDone(true);
    } catch (e: any) {
      setError(e?.message ?? "예약 제안 실패");
    } finally {
      setBusy(false);
    }
  }

  const total = Number(hours) * Number(rate) || 0;

  return (
    <>
      <button onClick={() => setOpen(true)} className="ws-btn-accent text-sm">
        📅 일정 예약
      </button>

      {open && (
        <Modal
          onClose={() => {
            setOpen(false);
            setDone(false);
          }}
          title="돌봄 일정 예약 제안"
        >
          {done ? (
            <div className="text-center">
              <p className="text-3xl">📬</p>
              <p className="mt-2 font-bold text-slate-900">예약 제안을 보냈어요!</p>
              <p className="mt-1 text-sm text-slate-500">상대가 확정하면 알림을 받게 됩니다.</p>
              <button onClick={() => { setOpen(false); setDone(false); }} className="ws-btn-primary mt-4">닫기</button>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-sm text-slate-600">
                일정
                <input
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  aria-label="예약 일정"
                  className="mt-1 w-full rounded-lg border border-sky-200 px-3 py-2"
                />
              </label>
              <div className="flex gap-2">
                <label className="flex-1 text-sm text-slate-600">
                  시간
                  <input
                    type="number"
                    step="0.5"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    aria-label="시간"
                    className="mt-1 w-full rounded-lg border border-sky-200 px-3 py-2"
                  />
                </label>
                <label className="flex-1 text-sm text-slate-600">
                  시급 (₩)
                  <input
                    type="number"
                    step="500"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    aria-label="시급"
                    className="mt-1 w-full rounded-lg border border-sky-200 px-3 py-2"
                  />
                </label>
              </div>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="메모 (선택)"
                aria-label="예약 메모"
                className="w-full rounded-lg border border-sky-200 px-3 py-2 text-sm"
              />
              <p className="text-center text-sm text-slate-500">
                예상 돌봄비 <b className="text-sky-600">{won(total)}</b>
              </p>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button onClick={submit} disabled={busy} className="ws-btn-primary w-full">
                {busy ? "제안 중…" : "예약 제안하기"}
              </button>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
