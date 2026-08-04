import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SitterCard } from "@/components/SitterCard";
import { SitterFilters } from "@/components/SitterFilters";
import { format, getDictionary, getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

// Step 1 of the flow: parents search sitters for FREE, with filters + paging.
export default async function SittersPage({
  searchParams,
}: {
  searchParams: { city?: string; maxRate?: string; minRating?: string; verified?: string; page?: string };
}) {
  const page = Math.max(1, Number(searchParams.page ?? "1") || 1);

  const where: Prisma.SitterProfileWhereInput = {};
  if (searchParams.city) where.city = { contains: searchParams.city, mode: "insensitive" };
  if (searchParams.maxRate) where.hourlyRate = { lte: Number(searchParams.maxRate) };
  if (searchParams.minRating) where.ratingAvg = { gte: Number(searchParams.minRating) };
  if (searchParams.verified === "1") where.verified = true;

  const [total, sitters] = await Promise.all([
    prisma.sitterProfile.count({ where }),
    prisma.sitterProfile.findMany({
      where,
      // Premium sitters get priority placement (priority-listing perk).
      orderBy: [{ user: { isPremium: "desc" } }, { verified: "desc" }, { ratingAvg: "desc" }],
      include: { user: { select: { id: true, name: true, isPremium: true } } },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const t = getDictionary(getLocale()).sitters;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (p: number) => {
    const q = new URLSearchParams();
    if (searchParams.city) q.set("city", searchParams.city);
    if (searchParams.maxRate) q.set("maxRate", searchParams.maxRate);
    if (searchParams.minRating) q.set("minRating", searchParams.minRating);
    if (searchParams.verified) q.set("verified", searchParams.verified);
    q.set("page", String(p));
    return `/sitters?${q.toString()}`;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900">{t.title}</h1>
        <p className="mt-1 text-slate-600">{t.subtitle}</p>
      </div>

      <div className="mb-6">
        <SitterFilters
          labels={{
            region: t.region,
            maxRate: t.maxRate,
            minRating: t.minRating,
            all: t.all,
            verifiedOnly: t.verifiedOnly,
            apply: t.apply,
            reset: t.reset,
          }}
        />
      </div>

      <p className="mb-3 text-sm text-slate-500">{format(t.count, { n: total })}</p>

      {sitters.length === 0 ? (
        <div className="ws-card p-10 text-center text-slate-500">{t.empty}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sitters.map((s) => (
            <SitterCard
              key={s.id}
              sitter={{
                id: s.user.id,
                name: s.user.name,
                bio: s.bio ?? "",
                hourlyRate: s.hourlyRate,
                city: s.city ?? "",
                yearsOfExp: s.yearsOfExp,
                photoUrl: s.photoUrl,
                verified: s.verified,
                ratingAvg: s.ratingAvg,
                ratingCount: s.ratingCount,
                isPremium: s.user.isPremium,
              }}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link href={qs(page - 1)} className="ws-btn-ghost text-sm">{t.prev}</Link>
          )}
          <span className="text-sm text-slate-500">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link href={qs(page + 1)} className="ws-btn-ghost text-sm">{t.next}</Link>
          )}
        </div>
      )}
    </div>
  );
}
