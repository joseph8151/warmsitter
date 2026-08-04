import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { won, formatDate } from "@/lib/format";
import { SitterProfileActions } from "@/components/SitterProfileActions";
import { ReportBlockMenu } from "@/components/ReportBlockMenu";
import { AvailabilityGrid } from "@/components/AvailabilityGrid";
import { RecordSitterView } from "@/components/RecordSitterView";
import { RatingBreakdown } from "@/components/RatingBreakdown";
import { getLocale } from "@/lib/i18n";
import type { TimeSlot } from "@/lib/availability";

export const dynamic = "force-dynamic";

// Public sitter profile: full details + reviews + connect actions.
export default async function SitterDetailPage({ params }: { params: { id: string } }) {
  const [profile, reviews, ratingGroups, availability, user] = await Promise.all([
    prisma.sitterProfile.findUnique({
      where: { userId: params.id },
      include: { user: { select: { id: true, name: true, isPremium: true } } },
    }),
    prisma.review.findMany({
      where: { targetId: params.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { author: { select: { name: true } } },
    }),
    // Full star distribution (all reviews, not just the latest page).
    prisma.review.groupBy({
      by: ["rating"],
      where: { targetId: params.id },
      _count: { rating: true },
    }),
    prisma.availabilitySlot.findMany({
      where: { sitterId: params.id },
      select: { dayOfWeek: true, slot: true },
    }),
    getCurrentUser(),
  ]);

  if (!profile) notFound();

  // Star distribution (1-5) and true total from the grouped counts.
  const ratingCounts: Record<number, number> = {};
  let ratingTotal = 0;
  for (const g of ratingGroups) {
    ratingCounts[g.rating] = g._count.rating;
    ratingTotal += g._count.rating;
  }

  const favorited =
    user?.role === "PARENT"
      ? Boolean(
          await prisma.favorite.findUnique({
            where: { parentId_sitterId: { parentId: user.id, sitterId: params.id } },
          })
        )
      : false;

  // Show safety controls to any logged-in user viewing someone else's profile.
  const canModerate = Boolean(user && user.id !== params.id);
  const blocked = canModerate
    ? Boolean(
        await prisma.block.findUnique({
          where: { blockerId_blockedId: { blockerId: user!.id, blockedId: params.id } },
        })
      )
    : false;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <RecordSitterView sitterId={profile.userId} />
      <Link href="/sitters" className="text-sm text-sky-600 hover:underline">← 시터 목록</Link>

      {/* Header */}
      <div className="ws-card p-6">
        <div className="flex items-start gap-4">
          <div className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-sky-100 text-3xl">
            {profile.photoUrl ? (
              <Image src={profile.photoUrl} alt={profile.user.name} fill sizes="80px" className="object-cover" />
            ) : (
              profile.user.name.charAt(0)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900">{profile.user.name}</h1>
              {profile.verified && <span className="ws-badge bg-sky-100 text-sky-700">✔ 인증</span>}
              {profile.user.isPremium && (
                <span className="ws-badge bg-gradient-to-r from-sunny-300 to-sunny-400 text-slate-900">★</span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {profile.city || "전국"} · 경력 {profile.yearsOfExp}년
            </p>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-lg font-extrabold text-sky-600">
                {won(profile.hourlyRate)}<span className="text-sm font-medium text-slate-400">/시간</span>
              </span>
              <span className="text-sm text-amber-500">
                ⭐ {profile.ratingAvg.toFixed(1)}{" "}
                <span className="text-slate-400">({profile.ratingCount})</span>
              </span>
            </div>
          </div>
        </div>

        <p className="mt-4 whitespace-pre-wrap text-slate-700">
          {profile.bio || "따뜻하게 아이를 돌봐드려요."}
        </p>

        <div className="mt-5">
          <SitterProfileActions sitterId={profile.userId} favorited={favorited} />
        </div>

        {canModerate && (
          <ReportBlockMenu targetId={profile.userId} targetName={profile.user.name} initialBlocked={blocked} />
        )}
      </div>

      {/* Availability */}
      <div className="ws-card p-6">
        <h2 className="mb-3 font-bold text-slate-900">가능 시간</h2>
        <AvailabilityGrid
          slots={availability.map((a) => ({ dayOfWeek: a.dayOfWeek, slot: a.slot as TimeSlot }))}
          locale={getLocale()}
        />
      </div>

      {/* Reviews */}
      <div className="ws-card p-6">
        <h2 className="font-bold text-slate-900">후기 {ratingTotal > 0 && `(${ratingTotal})`}</h2>
        {ratingTotal === 0 ? (
          <p className="mt-3 text-sm text-slate-500">아직 후기가 없습니다.</p>
        ) : (
          <>
            <div className="mt-4">
              <RatingBreakdown avg={profile.ratingAvg} total={ratingTotal} counts={ratingCounts} />
            </div>
            <ul className="mt-5 space-y-4 border-t border-sky-50 pt-4">
            {reviews.map((r) => (
              <li key={r.id} className="border-b border-sky-50 pb-3 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{r.author.name}</span>
                  <span className="text-sm text-amber-500">{"★".repeat(r.rating)}<span className="text-slate-200">{"★".repeat(5 - r.rating)}</span></span>
                </div>
                {r.comment && <p className="mt-1 text-sm text-slate-600">{r.comment}</p>}
                <p className="mt-1 text-xs text-slate-400">{formatDate(r.createdAt)}</p>
              </li>
            ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
