import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

// Open job board. Parents can post; sitters can apply.
export default async function JobsPage() {
  const user = await getCurrentUser();
  const jobs = await prisma.jobPost.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    include: {
      parent: { select: { name: true } },
      _count: { select: { applications: true } },
    },
    take: 50,
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">돌봄 구인글</h1>
          <p className="mt-1 text-slate-600">부모가 올린 돌봄 요청에 시터가 지원할 수 있어요.</p>
        </div>
        {user?.role === "PARENT" && (
          <Link href="/jobs/new" className="ws-btn-primary">+ 구인글 작성</Link>
        )}
      </div>

      {jobs.length === 0 ? (
        <div className="ws-card p-10 text-center text-slate-500">아직 열린 구인글이 없습니다.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {jobs.map((j) => (
            <Link key={j.id} href={`/jobs/${j.id}`} className="ws-card p-5 hover:bg-sky-50">
              <div className="flex items-center justify-between">
                <p className="font-bold text-slate-900">{j.title}</p>
                <span className="ws-badge bg-sky-100 text-sky-700">지원 {j._count.applications}</span>
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
