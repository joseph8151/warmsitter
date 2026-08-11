"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { DAY_LABELS, SLOT_LABELS, TIME_SLOTS, slotKey, type TimeSlot } from "@/lib/availability";
import type { Locale } from "@/lib/i18n";

// Sitter weekly availability editor — a 7-day × 4-slot toggle grid.
export function AvailabilityEditor({ locale }: { locale: Locale }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    api<{ slots: { dayOfWeek: number; slot: TimeSlot }[] }>("/api/availability")
      .then((r) => setSelected(new Set(r.slots.map((s) => slotKey(s.dayOfWeek, s.slot)))))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  function toggle(day: number, slot: TimeSlot) {
    const k = slotKey(day, slot);
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const slots = [...selected].map((k) => {
        const [d, s] = k.split(":");
        return { dayOfWeek: Number(d), slot: s as TimeSlot };
      });
      await api("/api/availability", { method: "PUT", body: JSON.stringify({ slots }) });
      setMsg("가능 시간이 저장되었어요 ✅");
    } catch {
      setMsg("저장 실패");
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return <div className="h-40 animate-pulse rounded-xl bg-sky-50" />;

  const days = DAY_LABELS[locale];
  const slotLabels = SLOT_LABELS[locale];

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-center text-sm">
          <thead>
            <tr>
              <th className="p-1" />
              {days.map((d, i) => (
                <th key={i} className="p-1 font-semibold text-slate-500">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((slot) => (
              <tr key={slot}>
                <td className="p-1 text-right font-medium text-slate-500">{slotLabels[slot]}</td>
                {days.map((_, day) => {
                  const on = selected.has(slotKey(day, slot));
                  return (
                    <td key={day} className="p-1">
                      <button
                        type="button"
                        onClick={() => toggle(day, slot)}
                        aria-pressed={on}
                        aria-label={`${days[day]} ${slotLabels[slot]}`}
                        className={`h-8 w-full rounded-lg transition ${
                          on ? "bg-sky-500 text-white" : "bg-sky-50 text-slate-300 hover:bg-sky-100"
                        }`}
                      >
                        {on ? "✓" : ""}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button onClick={save} disabled={saving} className="ws-btn-primary text-sm">
          {saving ? "저장 중…" : "가능 시간 저장"}
        </button>
        {msg && <span className="text-sm text-sky-600">{msg}</span>}
      </div>
    </div>
  );
}
