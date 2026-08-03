import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { InterviewActions } from "@/components/InterviewActions";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { ko: string; cls: string }> = {
  PROPOSED: { ko: "제안됨", cls: "bg-amber-100 text-amber-700" },
  ACCEPTED: { ko: "수락됨", cls: "bg-emerald-100 text-emerald-700" },
  DECLINED: { ko: "거절됨", cls: "bg-slate-100 text-slate-500" },
  DONE: { ko: "완료", cls: "bg-sky-100 text-sky-700" },
};

export default async function InterviewsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="ws-card mx-auto max-w-md p-10 text-center">
        <p className="text-slate-600">로그인이 필요합니다.</p>
        <Link href="/login" className="ws-btn-primary mt-4 inline-flex">로그인</Link>
      </div>
    );
  }

  const interviews = await prisma.interview.findMany({
    where: { OR: [{ parentId: user.id }, { sitterId: user.id }] },
    orderBy: { proposedAt: "desc" },
    include: {
      parent: { select: { id: true, name: true } },
      sitter: { select: { id: true, name: true } },
      job: { select: { title: true } },
    },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-extrabold text-slate-900">면접</h1>
      <p className="mt-1 text-slate-600">면접 제안을 확인하고 일정을 조율하세요.</p>

      {interviews.length === 0 ? (
        <div className="ws-card mt-6 p-10 text-center text-slate-500">면접 내역이 없습니다.</div>
      ) : (
        <div className="mt-6 space-y-3">
          {interviews.map((iv) => {
            const asSitter = iv.sitterId === user.id;
            const other = asSitter ? iv.parent : iv.sitter;
            const s = STATUS[iv.status];
            return (
              <div key={iv.id} className="ws-card flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-bold text-slate-900">
                    {other.name} {iv.job?.title && <span className="text-slate-400">· {iv.job.title}</span>}
                  </p>
                  <p className="text-sm text-slate-500">
                    제안 {formatDate(iv.proposedAt)}
                    {iv.scheduledFor && ` · 예정 ${formatDate(iv.scheduledFor)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`ws-badge ${s.cls}`}>{s.ko}</span>
                  {asSitter && iv.status === "PROPOSED" && <InterviewActions interviewId={iv.id} />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
