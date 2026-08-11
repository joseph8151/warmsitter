"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import type { ResolvedSettings, CreditPackage } from "@/lib/types";
import { won } from "@/lib/format";

export function AdminSettingsForm() {
  const [s, setS] = useState<ResolvedSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api<ResolvedSettings>("/api/admin/settings")
      .then(setS)
      .catch((e) => setErr(e?.message ?? "권한이 없습니다 (ADMIN 필요)."));
  }, []);

  function patch<K extends keyof ResolvedSettings>(key: K, value: ResolvedSettings[K]) {
    setS((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function updatePackage(i: number, field: keyof CreditPackage, value: string) {
    if (!s) return;
    const packages = [...s.creditPackages];
    const num = field === "credits" || field === "price";
    packages[i] = { ...packages[i], [field]: num ? Number(value) : value } as CreditPackage;
    patch("creditPackages", packages);
  }

  async function save() {
    if (!s) return;
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      const updated = await api<ResolvedSettings>("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({
          feeRateBps: s.feeRateBps,
          ticketPrice: s.ticketPrice,
          ticketDurationDays: s.ticketDurationDays,
          premiumMonthlyPrice: s.premiumMonthlyPrice,
          creditPackages: s.creditPackages,
          actionCosts: s.actionCosts,
        }),
      });
      setS(updated);
      setMsg("저장되었습니다 ✅");
    } catch (e: any) {
      setErr(e?.message ?? "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  if (err && !s) return <p className="rounded-lg bg-red-50 p-4 text-red-600">{err}</p>;
  if (!s) return <div className="h-64 animate-pulse rounded-xl2 bg-sky-50" />;

  return (
    <div className="space-y-6">
      {/* Fee rate */}
      <section className="ws-card p-5">
        <h2 className="font-bold text-slate-900">거래 수수료</h2>
        <label className="mt-3 block text-sm text-slate-600">
          플랫폼 수수료율 (%)
          <input
            type="number"
            step="0.1"
            value={s.feeRateBps / 100}
            onChange={(e) => patch("feeRateBps", Math.round(Number(e.target.value) * 100))}
            className="mt-1 w-full rounded-lg border border-sky-200 px-3 py-2"
          />
        </label>
        <p className="mt-1 text-xs text-slate-400">
          예: 10% → 시급 ₩20,000 × 3시간 = ₩60,000 결제 시 수수료 {won(6000)} 차감.
        </p>
      </section>

      {/* Ticket */}
      <section className="ws-card p-5">
        <h2 className="font-bold text-slate-900">이용권</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block text-sm text-slate-600">
            가격 (KRW)
            <input
              type="number"
              value={s.ticketPrice}
              onChange={(e) => patch("ticketPrice", Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-sky-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm text-slate-600">
            기간 (일)
            <input
              type="number"
              value={s.ticketDurationDays}
              onChange={(e) => patch("ticketDurationDays", Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-sky-200 px-3 py-2"
            />
          </label>
        </div>
      </section>

      {/* Premium */}
      <section className="ws-card p-5">
        <h2 className="font-bold text-slate-900">프리미엄 구독</h2>
        <label className="mt-3 block text-sm text-slate-600">
          월 구독료 (KRW)
          <input
            type="number"
            value={s.premiumMonthlyPrice}
            onChange={(e) => patch("premiumMonthlyPrice", Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-sky-200 px-3 py-2"
          />
        </label>
      </section>

      {/* Credit packages */}
      <section className="ws-card p-5">
        <h2 className="font-bold text-slate-900">크레딧 패키지</h2>
        <div className="mt-3 space-y-3">
          {s.creditPackages.map((p, i) => (
            <div key={p.id} className="grid grid-cols-3 gap-2">
              <input
                value={p.label}
                onChange={(e) => updatePackage(i, "label", e.target.value)}
                className="rounded-lg border border-sky-200 px-3 py-2 text-sm"
                placeholder="라벨"
              />
              <input
                type="number"
                value={p.credits}
                onChange={(e) => updatePackage(i, "credits", e.target.value)}
                className="rounded-lg border border-sky-200 px-3 py-2 text-sm"
                placeholder="크레딧"
              />
              <input
                type="number"
                value={p.price}
                onChange={(e) => updatePackage(i, "price", e.target.value)}
                className="rounded-lg border border-sky-200 px-3 py-2 text-sm"
                placeholder="가격"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Action costs */}
      <section className="ws-card p-5">
        <h2 className="font-bold text-slate-900">액션별 크레딧 비용</h2>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {(["INTERVIEW_PROPOSAL", "ACCEPT_APPLICATION", "START_CHAT"] as const).map((k) => (
            <label key={k} className="block text-sm text-slate-600">
              {k === "INTERVIEW_PROPOSAL" ? "면접 제안" : k === "ACCEPT_APPLICATION" ? "지원 수락" : "채팅 시작"}
              <input
                type="number"
                value={s.actionCosts[k]}
                onChange={(e) =>
                  patch("actionCosts", { ...s.actionCosts, [k]: Number(e.target.value) })
                }
                className="mt-1 w-full rounded-lg border border-sky-200 px-3 py-2"
              />
            </label>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="ws-btn-primary">
          {saving ? "저장 중…" : "설정 저장"}
        </button>
        {msg && <span className="text-sm font-medium text-sky-600">{msg}</span>}
        {err && <span className="text-sm text-red-600">{err}</span>}
      </div>
    </div>
  );
}
