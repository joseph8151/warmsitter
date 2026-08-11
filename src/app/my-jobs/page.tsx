import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { won, formatDate } from "@/lib/format";
import { PayButton } from "@/components/PayButton";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { ko: string; cls: string }> = {
  OPEN: { ko: "모집 중", cls: "bg-sky-100 text-sky-700" },
  MATCHED: { ko: "매칭 완료", cls: "bg-emerald-100 text-emerald-700" },
  IN_PROGRESS: { ko: "진행 중", cls: "bg-amber-100 text-amber-700" },
  COMPLETED: { ko: "완료", cls: "bg-slate-100 text-slate-500" },
  CANCELED: { ko: "취소", cls: "bg-slate-100 text-slate-500" },
};

// Parent's job management: all their posts with applicant counts + status.
export default async function MyJobsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="ws-card mx-auto max-w-md p-10 text-center">
        <p className="text-slate-600">로그인이 필요합니다.</p>
        <Link href="/login" className="ws-btn-primary mt-4 inline-flex">로그인</Link>
      </div>
    );
  }
  if (user.role !== "PARENT") {
    return (
      <div className="ws-card mx-auto max-w-md p-10 text-center text-slate-600">
        구인글 관리는 부모 계정에서 이용할 수 있어요.
      </div>
    );
  }

  const jobs = await prisma.jobPost.findMany({
    where: { parentId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { applications: true } },
      applications: { where: { status: "PENDING" }, select: { id: true } },
    },
  });

  // Resolve matched sitter names (matchedSitterId is a plain id).
  const sitterIds = Array.from(
    new Set(jobs.map((j) => j.matchedSitterId).filter((v): v is string => Boolean(v)))
  );
  const nameById = new Map(
    (await prisma.user.findMany({ where: { id: { in: sitterIds } }, select: { id: true, name: true } })).map(
      (u) => [u.id, u.name]
    )
  );

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">내 구인글</h1>
          <p className="mt-1 text-slate-600">올린 구인글의 지원 현황과 상태를 관리하세요.</p>
        </div>
        <Link href="/jobs/new" className="ws-btn-primary">+ 구인글 작성</Link>
      </div>

      {jobs.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="📝"
            title="아직 올린 구인글이 없어요"
            description="첫 구인글을 올리고 우리 동네 시터의 지원을 받아보세요."
            cta={{ href: "/jobs/new", label: "첫 구인글 작성하기" }}
          />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {jobs.map((j) => {
            const s = STATUS[j.status] ?? STATUS.OPEN;
            const pending = j.applications.length;
            return (
              <div key={j.id} className="ws-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link href={`/jobs/${j.id}`} className="font-bold text-slate-900 hover:text-sky-600">
                      {j.title}
                    </Link>
                    <p className="mt-1 text-sm text-slate-500">
                      {j.city ?? "전국"} · {j.hoursPerSession}시간 · {formatDate(j.createdAt)}
                    </p>
                    {j.matchedSitterId && (
                      <p className="mt-1 text-sm text-slate-600">
                        매칭: {nameById.get(j.matchedSitterId) ?? "시터"}
                        {j.agreedRate ? ` · ${won(j.agreedRate)}/시간` : ""}
                        {j.agreedHours ? ` · ${j.agreedHours}시간` : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`ws-badge ${s.cls}`}>{s.ko}</span>
                    {j.status === "OPEN" && (
                      <Link href={`/jobs/${j.id}`} className="ws-btn-ghost text-sm">
                        지원자 {j._count.applications}{pending > 0 ? ` · 대기 ${pending}` : ""}
                      </Link>
                    )}
                    {(j.status === "MATCHED" || j.status === "IN_PROGRESS") && <PayButton jobId={j.id} />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
