import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, won } from "@/lib/format";
import { ApplyButton } from "@/components/ApplyButton";
import { AcceptApplicationButton } from "@/components/AcceptApplicationButton";

export const dynamic = "force-dynamic";

const STATUS_KO: Record<string, string> = {
  OPEN: "모집 중",
  MATCHED: "매칭 완료",
  IN_PROGRESS: "진행 중",
  COMPLETED: "완료",
  CANCELED: "취소",
};

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const job = await prisma.jobPost.findUnique({
    where: { id: params.id },
    include: {
      parent: { select: { id: true, name: true } },
      applications: {
        orderBy: { createdAt: "asc" },
        include: {
          sitter: {
            select: {
              id: true,
              name: true,
              sitterProfile: { select: { hourlyRate: true, verified: true, ratingAvg: true, city: true } },
            },
          },
        },
      },
    },
  });

  if (!job) return <div className="ws-card p-10 text-center text-slate-500">구인글을 찾을 수 없습니다.</div>;

  const isOwner = user?.id === job.parentId;
  const isSitter = user?.role === "SITTER";
  const myApplication = job.applications.find((a) => a.sitterId === user?.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/jobs" className="text-sm text-sky-600 hover:underline">← 구인글 목록</Link>

      <div className="ws-card p-6">
        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
            {job.urgent && <span className="ws-badge bg-rose-100 text-rose-600">🔥 급구</span>}
            {job.title}
          </h1>
          <span className="ws-badge bg-sky-100 text-sky-700">{STATUS_KO[job.status]}</span>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-slate-700">{job.description ?? "상세 내용 없음"}</p>
        <p className="mt-4 text-sm text-slate-400">
          {job.parent.name} · {job.city ?? "전국"} · {job.hoursPerSession}시간 · {formatDate(job.createdAt)}
        </p>

        {/* Sitter apply */}
        {isSitter && job.status === "OPEN" && (
          <div className="mt-5">
            <ApplyButton jobId={job.id} applied={Boolean(myApplication)} />
          </div>
        )}
      </div>

      {/* Owner: applicant list with accept (billable) */}
      {isOwner && (
        <div className="ws-card p-6">
          <h2 className="font-bold text-slate-900">지원자 ({job.applications.length})</h2>
          {job.applications.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">아직 지원자가 없습니다.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {job.applications.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl bg-sky-50 p-4">
                  <div>
                    <p className="font-bold text-slate-900">
                      {a.sitter.name}
                      {a.sitter.sitterProfile?.verified && (
                        <span className="ml-2 ws-badge bg-sky-100 text-sky-700">✔ 인증</span>
                      )}
                    </p>
                    <p className="text-sm text-slate-500">
                      {won(a.sitter.sitterProfile?.hourlyRate ?? 0)}/시간 · ⭐ {(a.sitter.sitterProfile?.ratingAvg ?? 0).toFixed(1)}
                    </p>
                    {a.message && <p className="mt-1 text-sm text-slate-600">“{a.message}”</p>}
                    <Link
                      href={`/sitters/${a.sitter.id}`}
                      className="mt-1 inline-block text-sm font-medium text-sky-600 hover:underline"
                    >
                      프로필 보기 →
                    </Link>
                  </div>
                  <AcceptApplicationButton applicationId={a.id} accepted={a.status === "ACCEPTED"} />
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-slate-400">
            지원 수락 시 이용권/크레딧이 차감됩니다 (프리미엄·이용권 보유 시 무료).
          </p>
        </div>
      )}
    </div>
  );
}
