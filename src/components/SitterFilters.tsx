"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export interface FilterLabels {
  region: string;
  maxRate: string;
  minRating: string;
  all: string;
  verifiedOnly: string;
  apply: string;
  reset: string;
  availableDay: string;
  availableTime: string;
}

export interface SlotOption {
  value: string;
  label: string;
}

// Search filters for the sitter listing. Updates the URL query string so the
// server component re-queries with the filters + pagination.
export function SitterFilters({
  labels,
  dayOptions,
  slotOptions,
}: {
  labels: FilterLabels;
  dayOptions: string[]; // index = day-of-week 0..6
  slotOptions: SlotOption[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  const [city, setCity] = useState(params.get("city") ?? "");
  const [maxRate, setMaxRate] = useState(params.get("maxRate") ?? "");
  const [minRating, setMinRating] = useState(params.get("minRating") ?? "");
  const [verified, setVerified] = useState(params.get("verified") === "1");
  const [day, setDay] = useState(params.get("day") ?? "");
  const [slot, setSlot] = useState(params.get("slot") ?? "");

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const q = new URLSearchParams();
    if (city) q.set("city", city);
    if (maxRate) q.set("maxRate", maxRate);
    if (minRating) q.set("minRating", minRating);
    if (verified) q.set("verified", "1");
    if (day) q.set("day", day);
    if (slot) q.set("slot", slot);
    q.set("page", "1"); // reset to first page on filter change
    router.push(`/sitters?${q.toString()}`);
  }

  function reset() {
    setCity("");
    setMaxRate("");
    setMinRating("");
    setVerified(false);
    setDay("");
    setSlot("");
    router.push("/sitters");
  }

  return (
    <form onSubmit={apply} className="ws-card flex flex-wrap items-end gap-3 p-4">
      <label className="text-sm text-slate-600">
        {labels.region}
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="예: Seoul"
          className="mt-1 block w-36 rounded-lg border border-sky-200 px-3 py-2"
        />
      </label>
      <label className="text-sm text-slate-600">
        {labels.maxRate}
        <input
          type="number"
          value={maxRate}
          onChange={(e) => setMaxRate(e.target.value)}
          placeholder="₩"
          className="mt-1 block w-32 rounded-lg border border-sky-200 px-3 py-2"
        />
      </label>
      <label className="text-sm text-slate-600">
        {labels.minRating}
        <select
          value={minRating}
          onChange={(e) => setMinRating(e.target.value)}
          className="mt-1 block w-28 rounded-lg border border-sky-200 px-3 py-2"
        >
          <option value="">{labels.all}</option>
          <option value="4.5">4.5+</option>
          <option value="4">4.0+</option>
          <option value="3">3.0+</option>
        </select>
      </label>
      <label className="text-sm text-slate-600">
        {labels.availableDay}
        <select
          value={day}
          onChange={(e) => setDay(e.target.value)}
          className="mt-1 block w-28 rounded-lg border border-sky-200 px-3 py-2"
        >
          <option value="">{labels.all}</option>
          {dayOptions.map((d, i) => (
            <option key={i} value={i}>{d}</option>
          ))}
        </select>
      </label>
      <label className="text-sm text-slate-600">
        {labels.availableTime}
        <select
          value={slot}
          onChange={(e) => setSlot(e.target.value)}
          className="mt-1 block w-28 rounded-lg border border-sky-200 px-3 py-2"
        >
          <option value="">{labels.all}</option>
          {slotOptions.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} />
        {labels.verifiedOnly}
      </label>
      <div className="flex gap-2">
        <button type="submit" className="ws-btn-primary text-sm">{labels.apply}</button>
        <button type="button" onClick={reset} className="ws-btn-ghost text-sm">{labels.reset}</button>
      </div>
    </form>
  );
}
