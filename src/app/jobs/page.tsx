import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

// Open job board. Parents post; sitters browse by city and apply.
export default async function JobsPage({
  searchParams,
}: {
  searchParams: { city?: string };
}) {
  const user = await getCurrentUser();

  const where: Prisma.JobPostWhereInput = { status: "OPEN" };
  if (searchParams.city) where.city = { contains: searchParams.city, mode: "insensitive" };

  const jobs = await prisma.jobPost.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      parent: { select: { name: true } },
      _count: { select: { applications: true } },
    },
    take: 50,
  });

  // Mark jobs this sitter already applied to, so they don't try again.
  let appliedSet = new Set<string>();
  if (user?.role === "SITTER" && jobs.length > 0) {
    const mine = await prisma.application.findMany({
      where: { sitterId: user.id, jobId: { in: jobs.map((j) => j.id) } },
      select: { jobId: true },
    });
    appliedSet = new Set(mine.map((a) => a.jobId));
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">돌봄 구인글</h1>
          <p className="mt-1 text-slate-600">부모가 올린 돌봄 요청에 시터가 지원할 수 있어요.</p>
        </div>
        {user?.role === "PARENT" && (
          <Link href="/jobs/new" className="ws-btn-primary shrink-0">+ 구인글 작성</Link>
        )}
      </div>

      {/* City filter */}
      <form method="get" className="mb-6 flex flex-wrap items-end gap-2">
        <label className="text-sm text-slate-600">
          지역
          <input
            name="city"
            defaultValue={searchParams.city ?? ""}
            placeholder="예: 서울, 부산"
            className="mt-1 block w-56 rounded-lg border border-sky-200 px-3 py-2"
          />
        </label>
        <button type="submit" className="ws-btn-primary text-sm">검색</button>
        {searchParams.city && (
          <Link href="/jobs" className="ws-btn-ghost text-sm">초기화</Link>
        )}
      </form>

      {jobs.length === 0 ? (
        <div className="ws-card flex flex-col items-center gap-4 p-12 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-sky-100 text-3xl">
            {searchParams.city ? "🔍" : "📝"}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {searchParams.city ? "조건에 맞는 구인글이 없어요" : "아직 열린 구인글이 없어요"}
            </h2>
            <p className="mt-2 max-w-md text-slate-600">
              {searchParams.city
                ? "지역을 바꾸거나 필터를 초기화해보세요."
                : user?.role === "PARENT"
                ? "첫 구인글을 올리고 우리 동네 시터의 지원을 받아보세요."
                : "곧 새로운 돌봄 요청이 올라올 거예요. 프로필을 완성해두면 먼저 연결될 수 있어요."}
            </p>
          </div>
          {searchParams.city ? (
            <Link href="/jobs" className="ws-btn-ghost text-sm font-semibold">필터 초기화</Link>
          ) : user?.role === "PARENT" ? (
            <Link href="/jobs/new" className="ws-btn-primary">구인글 작성</Link>
          ) : (
            <Link href="/profile" className="ws-btn-primary">프로필 완성하기</Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {jobs.map((j) => (
            <Link key={j.id} href={`/jobs/${j.id}`} className="ws-card p-5 hover:bg-sky-50">
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-slate-900">{j.title}</p>
                <div className="flex shrink-0 items-center gap-1.5">
                  {appliedSet.has(j.id) && (
                    <span className="ws-badge bg-emerald-100 text-emerald-700">지원함</span>
                  )}
                  <span className="ws-badge bg-sky-100 text-sky-700">지원 {j._count.applications}</span>
                </div>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{j.description ?? "상세 내용 없음"}</p>
              <p className="mt-3 text-xs text-slate-400">
                {j.parent.name} · {j.city ?? "전국"} · {j.hoursPerSession}시간 · {formatDate(j.createdAt)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
