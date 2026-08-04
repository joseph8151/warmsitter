// Rating summary for a sitter profile: the average on the left, and a 5→1
// star-distribution bar chart on the right. Purely presentational.
export function RatingBreakdown({
  avg,
  total,
  counts,
}: {
  avg: number;
  total: number;
  counts: Record<number, number>; // star (1-5) -> number of reviews
}) {
  return (
    <div className="flex items-center gap-6">
      <div className="text-center">
        <p className="text-4xl font-extrabold text-slate-900">{avg.toFixed(1)}</p>
        <p className="text-sm text-amber-500">
          {"★".repeat(Math.round(avg))}
          <span className="text-slate-200">{"★".repeat(5 - Math.round(avg))}</span>
        </p>
        <p className="mt-1 text-xs text-slate-400">후기 {total}개</p>
      </div>
      <div className="flex-1 space-y-1">
        {[5, 4, 3, 2, 1].map((star) => {
          const n = counts[star] ?? 0;
          const pct = total > 0 ? Math.round((n / total) * 100) : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xs text-slate-500">
              <span className="w-5 shrink-0 text-right">{star}★</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-sky-50">
                <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-6 shrink-0 tabular-nums">{n}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
