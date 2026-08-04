import { DAY_LABELS, SLOT_LABELS, TIME_SLOTS, slotKey, type Slot } from "@/lib/availability";
import type { Locale } from "@/lib/i18n";

// Read-only weekly availability grid (server-rendered) for a sitter profile.
export function AvailabilityGrid({ slots, locale }: { slots: Slot[]; locale: Locale }) {
  const set = new Set(slots.map((s) => slotKey(s.dayOfWeek, s.slot)));
  const days = DAY_LABELS[locale];
  const slotLabels = SLOT_LABELS[locale];

  if (set.size === 0) {
    return <p className="text-sm text-slate-500">등록된 가능 시간이 없습니다.</p>;
  }

  return (
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
              {days.map((_, day) => (
                <td key={day} className="p-1">
                  <div
                    className={`h-6 w-full rounded ${
                      set.has(slotKey(day, slot)) ? "bg-sky-400" : "bg-sky-50"
                    }`}
                    aria-label={set.has(slotKey(day, slot)) ? `${days[day]} ${slotLabels[slot]} 가능` : undefined}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
