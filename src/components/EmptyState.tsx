import Link from "next/link";
import type { ReactNode } from "react";

// Shared warm empty-state card: an emoji badge, a title, a short line, and an
// optional call-to-action. Keeps every list page's "nothing here yet" state
// consistent with the sky-blue theme.
export function EmptyState({
  icon,
  title,
  description,
  cta,
}: {
  icon: string;
  title: string;
  description?: ReactNode;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="ws-card flex flex-col items-center gap-4 p-12 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-sky-100 text-3xl">{icon}</div>
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">{title}</h2>
        {description && <p className="mt-2 max-w-md text-slate-600">{description}</p>}
      </div>
      {cta && (
        <Link href={cta.href} className="ws-btn-primary">
          {cta.label}
        </Link>
      )}
    </div>
  );
}
