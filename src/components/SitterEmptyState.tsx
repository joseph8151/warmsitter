import Link from "next/link";

interface Labels {
  filteredTitle: string;
  filteredDesc: string;
  resetCta: string;
  noneTitle: string;
  noneDesc: string;
  noneCta: string;
}

// Shown when the sitter list is empty. Two very different situations:
//  - marketplace is empty (no sitters anywhere) → bootstrap supply with a
//    warm "become a sitter, free" call-to-action.
//  - the parent's filters are just too narrow → nudge them to widen/reset.
export function SitterEmptyState({
  marketplaceEmpty,
  labels,
}: {
  marketplaceEmpty: boolean;
  labels: Labels;
}) {
  if (marketplaceEmpty) {
    return (
      <div className="ws-card flex flex-col items-center gap-4 bg-gradient-to-b from-sky-50 to-white p-12 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-sky-100 text-3xl">☀️</div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">{labels.noneTitle}</h2>
          <p className="mt-2 max-w-md text-slate-600">{labels.noneDesc}</p>
        </div>
        <Link
          href="/login?as=sitter"
          className="rounded-full bg-sky-500 px-6 py-3 font-bold text-white shadow-card hover:bg-sky-600"
        >
          {labels.noneCta}
        </Link>
      </div>
    );
  }

  return (
    <div className="ws-card flex flex-col items-center gap-4 p-12 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-sky-100 text-3xl">🔍</div>
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">{labels.filteredTitle}</h2>
        <p className="mt-2 max-w-md text-slate-600">{labels.filteredDesc}</p>
      </div>
      <Link href="/sitters" className="ws-btn-ghost text-sm font-semibold">
        {labels.resetCta}
      </Link>
    </div>
  );
}
