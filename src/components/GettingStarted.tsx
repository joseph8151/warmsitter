import Link from "next/link";

export interface ChecklistItem {
  label: string;
  done: boolean;
  href: string;
  cta: string;
}

// Role-based onboarding checklist shown on the dashboard until every step is done.
export function GettingStarted({ items }: { items: ChecklistItem[] }) {
  const remaining = items.filter((i) => !i.done).length;
  if (remaining === 0) return null;

  return (
    <section className="ws-card overflow-hidden">
      <div className="bg-gradient-to-r from-sky-500 to-sky-400 px-5 py-4 text-white">
        <p className="text-lg font-extrabold">시작해볼까요? ☀️</p>
        <p className="text-sm text-sky-50">남은 단계 {remaining}개를 완료하면 준비 끝!</p>
      </div>
      <ul className="divide-y divide-sky-50">
        {items.map((item) => (
          <li key={item.label} className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3">
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-sm ${
                  item.done ? "bg-emerald-100 text-emerald-600" : "bg-sky-100 text-sky-500"
                }`}
              >
                {item.done ? "✓" : "•"}
              </span>
              <span className={item.done ? "text-slate-400 line-through" : "font-medium text-slate-800"}>
                {item.label}
              </span>
            </div>
            {!item.done && (
              <Link href={item.href} className="ws-btn-ghost text-sm">
                {item.cta}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
