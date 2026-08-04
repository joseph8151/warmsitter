import Link from "next/link";
import Image from "next/image";
import { won } from "@/lib/format";

export interface RecentSitter {
  id: string;
  name: string;
  photoUrl: string | null;
  hourlyRate: number;
}

// Horizontal strip of the parent's recently viewed sitters.
export function RecentlyViewedStrip({ title, sitters }: { title: string; sitters: RecentSitter[] }) {
  if (sitters.length === 0) return null;
  return (
    <div className="mb-6">
      <h2 className="mb-2 text-sm font-bold text-slate-500">{title}</h2>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {sitters.map((s) => (
          <Link
            key={s.id}
            href={`/sitters/${s.id}`}
            className="ws-card flex w-40 shrink-0 flex-col items-center p-3 text-center hover:bg-sky-50"
          >
            <div className="relative grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-sky-100 text-xl">
              {s.photoUrl ? (
                <Image src={s.photoUrl} alt={s.name} fill sizes="48px" className="object-cover" />
              ) : (
                s.name.charAt(0)
              )}
            </div>
            <p className="mt-2 w-full truncate text-sm font-bold text-slate-900">{s.name}</p>
            <p className="text-xs text-sky-600">{won(s.hourlyRate)}/시간</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
