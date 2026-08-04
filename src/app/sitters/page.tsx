import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SitterCard } from "@/components/SitterCard";
import { SitterFilters } from "@/components/SitterFilters";
import { format, getDictionary, getLocale } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/auth";
import { blockedUserIds } from "@/lib/blocks";
import { DAY_LABELS, SLOT_LABELS, TIME_SLOTS } from "@/lib/availability";
import { RecentlyViewedStrip, type RecentSitter } from "@/components/RecentlyViewedStrip";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

// Step 1 of the flow: parents search sitters for FREE, with filters + paging.
export default async function SittersPage({
  searchParams,
}: {
  searchParams: {
    city?: string;
    maxRate?: string;
    minRating?: string;
    verified?: string;
    day?: string;
    slot?: string;
    q?: string;
    sort?: string;
    page?: string;
  };
}) {
  const page = Math.max(1, Number(searchParams.page ?? "1") || 1);
  const user = await getCurrentUser();

  const where: Prisma.SitterProfileWhereInput = {};
  if (searchParams.city) where.city = { contains: searchParams.city, mode: "insensitive" };
  if (searchParams.maxRate) where.hourlyRate = { lte: Number(searchParams.maxRate) };
  if (searchParams.minRating) where.ratingAvg = { gte: Number(searchParams.minRating) };
  if (searchParams.verified === "1") where.verified = true;

  // Keyword search over sitter name (on User) or bio.
  if (searchParams.q) {
    const q = searchParams.q;
    where.OR = [
      { bio: { contains: q, mode: "insensitive" } },
      { user: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  // Availability filter: sitters available on a given day and/or time slot.
  const dayNum = searchParams.day !== undefined && searchParams.day !== "" ? Number(searchParams.day) : undefined;
  const slotVal = (TIME_SLOTS as readonly string[]).includes(searchParams.slot ?? "")
    ? searchParams.slot
    : undefined;
  if ((dayNum !== undefined && !Number.isNaN(dayNum)) || slotVal) {
    // availability is a relation on User; filter through the profile's user.
    where.user = {
      availability: {
        some: {
          ...(dayNum !== undefined && !Number.isNaN(dayNum) ? { dayOfWeek: dayNum } : {}),
          ...(slotVal ? { slot: slotVal as (typeof TIME_SLOTS)[number] } : {}),
        },
      },
    };
  }

  // Hide sitters blocked by (or who blocked) the current user.
  if (user) {
    const blocked = await blockedUserIds(user.id);
    if (blocked.size > 0) where.userId = { notIn: [...blocked] };
  }

  // Premium sitters always get priority placement, then the chosen sort.
  const sortTail: Prisma.SitterProfileOrderByWithRelationInput[] =
    searchParams.sort === "rate_asc"
      ? [{ hourlyRate: "asc" }]
      : searchParams.sort === "exp_desc"
      ? [{ yearsOfExp: "desc" }]
      : [{ verified: "desc" }, { ratingAvg: "desc" }];
  const orderBy: Prisma.SitterProfileOrderByWithRelationInput[] = [
    { user: { isPremium: "desc" } },
    ...sortTail,
  ];

  const [total, sitters] = await Promise.all([
    prisma.sitterProfile.count({ where }),
    prisma.sitterProfile.findMany({
      where,
      orderBy,
      include: { user: { select: { id: true, name: true, isPremium: true } } },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const t = getDictionary(getLocale()).sitters;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Which of the listed sitters has the current parent already favorited?
  let favoritedSet = new Set<string>();
  let recentSitters: RecentSitter[] = [];
  if (user?.role === "PARENT" && sitters.length > 0) {
    const favs = await prisma.favorite.findMany({
      where: { parentId: user.id, sitterId: { in: sitters.map((s) => s.user.id) } },
      select: { sitterId: true },
    });
    favoritedSet = new Set(favs.map((f) => f.sitterId));
  }
  if (user?.role === "PARENT") {
    const recent = await prisma.recentlyViewed.findMany({
      where: { userId: user.id },
      orderBy: { viewedAt: "desc" },
      take: 8,
      include: { sitter: { select: { id: true, name: true, sitterProfile: { select: { photoUrl: true, hourlyRate: true } } } } },
    });
    recentSitters = recent
      .filter((r) => r.sitter.sitterProfile)
      .map((r) => ({
        id: r.sitter.id,
        name: r.sitter.name,
        photoUrl: r.sitter.sitterProfile!.photoUrl,
        hourlyRate: r.sitter.sitterProfile!.hourlyRate,
      }));
  }
  const qs = (p: number) => {
    const q = new URLSearchParams();
    if (searchParams.city) q.set("city", searchParams.city);
    if (searchParams.maxRate) q.set("maxRate", searchParams.maxRate);
    if (searchParams.minRating) q.set("minRating", searchParams.minRating);
    if (searchParams.verified) q.set("verified", searchParams.verified);
    if (searchParams.day) q.set("day", searchParams.day);
    if (searchParams.slot) q.set("slot", searchParams.slot);
    if (searchParams.q) q.set("q", searchParams.q);
    if (searchParams.sort) q.set("sort", searchParams.sort);
    q.set("page", String(p));
    return `/sitters?${q.toString()}`;
  };

  const locale = getLocale();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900">{t.title}</h1>
        <p className="mt-1 text-slate-600">{t.subtitle}</p>
      </div>

      <RecentlyViewedStrip title={t.recentlyViewed} sitters={recentSitters} />

      <div className="mb-6">
        <SitterFilters
          labels={{
            region: t.region,
            maxRate: t.maxRate,
            minRating: t.minRating,
            all: t.all,
            verifiedOnly: t.verifiedOnly,
            availableDay: t.availableDay,
            availableTime: t.availableTime,
            searchPlaceholder: t.searchPlaceholder,
            sortLabel: t.sortLabel,
            sortRating: t.sortRating,
            sortRateAsc: t.sortRateAsc,
            sortExp: t.sortExp,
            apply: t.apply,
            reset: t.reset,
          }}
          dayOptions={DAY_LABELS[locale]}
          slotOptions={TIME_SLOTS.map((s) => ({ value: s, label: SLOT_LABELS[locale][s] }))}
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
              favorited={favoritedSet.has(s.user.id)}
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
