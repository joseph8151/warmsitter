import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasActiveTicket } from "@/lib/billing";
import { won, formatDate } from "@/lib/format";
import { PayButton } from "@/components/PayButton";
import { WorkLogForm } from "@/components/WorkLogForm";
import { SubscriptionManager } from "@/components/SubscriptionManager";
import { ReviewForm } from "@/components/ReviewForm";
import { GettingStarted, type ChecklistItem } from "@/components/GettingStarted";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="ws-card mx-auto max-w-md p-10 text-center">
        <p className="text-slate-600">로그인이 필요합니다.</p>
        <Link href="/login" className="ws-btn-primary mt-4 inline-flex">
          데모 로그인
        </Link>
      </div>
    );
  }

  const [txns, settlements, jobs] = await Promise.all([
    prisma.creditTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.settlement.findMany({
      where: { sitterId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { job: true },
    }),
    prisma.jobPost.findMany({
      where: { parentId: user.id, status: { in: ["MATCHED", "IN_PROGRESS"] } },
      orderBy: { createdAt: "desc" },
      include: { workLogs: true },
      take: 10,
    }),
  ]);

  // Jobs the current user is the matched sitter for (to write work logs).
  const sitterJobs =
    user.role === "SITTER"
      ? await prisma.jobPost.findMany({
          where: { matchedSitterId: user.id, status: { in: ["MATCHED", "IN_PROGRESS"] } },
          orderBy: { createdAt: "desc" },
          take: 10,
        })
      : [];

  // Completed jobs the user took part in — offer a review of the other party
  // (step 6). Hide jobs this user already reviewed.
  const completedJobs = await prisma.jobPost.findMany({
    where: { status: "COMPLETED", OR: [{ parentId: user.id }, { matchedSitterId: user.id }] },
    orderBy: { updatedAt: "desc" },
    include: {
      parent: { select: { id: true, name: true } },
      reviews: { where: { authorId: user.id }, select: { id: true } },
    },
    take: 10,
  });
  // Resolve matched-sitter names (matchedSitterId is a plain id, not a relation).
  const sitterIdSet = Array.from(
    new Set(completedJobs.map((j) => j.matchedSitterId).filter((v): v is string => Boolean(v)))
  );
  const sitterNameById = new Map(
    (await prisma.user.findMany({ where: { id: { in: sitterIdSet } }, select: { id: true, name: true } })).map(
      (u) => [u.id, u.name]
    )
  );
  const reviewable = completedJobs
    .filter((j) => j.reviews.length === 0)
    .map((j) => {
      const asParent = j.parentId === user.id;
      const targetId = asParent ? j.matchedSitterId : j.parentId;
      const targetName = asParent ? sitterNameById.get(j.matchedSitterId ?? "") ?? "시터" : j.parent.name;
      return targetId ? { jobId: j.id, title: j.title, targetId, targetName } : null;
    })
    .filter((v): v is { jobId: string; title: string; targetId: string; targetName: string } => Boolean(v));

  // Role-based onboarding checklist.
  const checklist: ChecklistItem[] = [];
  if (user.role === "PARENT") {
    const hasBalance = user.creditBalance > 0 || hasActiveTicket(user) || user.isPremium;
    const jobCount = await prisma.jobPost.count({ where: { parentId: user.id } });
    checklist.push(
      { label: "마음에 드는 시터 찾기", done: false, href: "/sitters", cta: "검색" },
      { label: "이용권 또는 크레딧 준비하기", done: hasBalance, href: "/pricing", cta: "구매" },
      { label: "돌봄 구인글 올리기", done: jobCount > 0, href: "/jobs/new", cta: "작성" }
    );
  } else if (user.role === "SITTER") {
    const profile = await prisma.sitterProfile.findUnique({ where: { userId: user.id } });
    checklist.push(
      { label: "프로필 사진 등록하기", done: Boolean(profile?.photoUrl), href: "/profile", cta: "등록" },
      { label: "신원확인 받기", done: Boolean(profile?.verified), href: "/profile", cta: "인증" },
      { label: "구인글에 지원하기", done: false, href: "/jobs", cta: "둘러보기" }
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold text-slate-900">
        안녕하세요, {user.name}님 👋
      </h1>

      {checklist.length > 0 && <GettingStarted items={checklist} />}

      {/* Balance summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="크레딧 잔액" value={`${user.creditBalance}`} suffix="크레딧" />
        <StatCard
          label="이용권"
          value={hasActiveTicket(user) ? "활성" : "없음"}
          suffix={user.ticketExpiresAt ? `~ ${formatDate(user.ticketExpiresAt)}` : ""}
        />
        <StatCard label="멤버십" value={user.isPremium ? "★ Premium" : "일반"} />
      </div>

      {/* Reviews for completed jobs (step 6) */}
      {reviewable.length > 0 && (
        <section className="ws-card p-5">
          <h2 className="font-bold text-slate-900">리뷰 작성</h2>
          <div className="mt-3 space-y-4">
            {reviewable.map((r) => (
              <div key={r.jobId} className="rounded-xl bg-sky-50 p-4">
                <p className="mb-2 text-sm text-slate-500">{r.title}</p>
                <ReviewForm jobId={r.jobId} targetId={r.targetId} targetName={r.targetName} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Premium membership management */}
      <SubscriptionManager />

      {/* Sitter: active jobs — write work logs (with photo upload) */}
      {sitterJobs.length > 0 && (
        <section className="ws-card p-5">
          <h2 className="font-bold text-slate-900">근무일지 작성</h2>
          <div className="mt-3 space-y-4">
            {sitterJobs.map((j) => (
              <div key={j.id} className="rounded-xl bg-sky-50 p-4">
                <WorkLogForm jobId={j.id} jobTitle={j.title} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Care jobs awaiting payment (parent) */}
      {jobs.length > 0 && (
        <section className="ws-card p-5">
          <h2 className="font-bold text-slate-900">돌봄 결제</h2>
          <p className="mt-1 text-sm text-slate-500">
            근무일지를 확인한 뒤 결제하면 수수료가 자동 차감되어 시터에게 정산됩니다.
          </p>
          <div className="mt-3 space-y-3">
            {jobs.map((j) => {
              const loggedHours = j.workLogs.reduce((sum, w) => sum + w.hours, 0);
              return (
                <div
                  key={j.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-sky-50 p-4"
                >
                  <div>
                    <p className="font-bold text-slate-900">{j.title}</p>
                    <p className="text-sm text-slate-500">
                      합의 시급 {won(j.agreedRate ?? 0)} ·{" "}
                      {loggedHours > 0 ? `근무 ${loggedHours}시간 기록됨` : `예정 ${j.agreedHours ?? j.hoursPerSession}시간`}
                    </p>
                  </div>
                  <PayButton jobId={j.id} />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Credit history */}
      <section className="ws-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-900">크레딧 / 이용권 내역</h2>
          <Link href="/receipts" className="text-sm text-sky-600 hover:underline">결제 내역 · 영수증 →</Link>
        </div>
        {txns.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">아직 내역이 없습니다.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <tbody className="divide-y divide-sky-100">
              {txns.map((t) => (
                <tr key={t.id}>
                  <td className="py-2 text-slate-500">{formatDate(t.createdAt)}</td>
                  <td className="py-2">{t.reason ?? t.type}</td>
                  <td className={`py-2 text-right font-semibold ${t.amount < 0 ? "text-red-500" : "text-sky-600"}`}>
                    {t.amount > 0 ? `+${t.amount}` : t.amount}
                  </td>
                  <td className="py-2 text-right text-slate-400">잔액 {t.balanceAfter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Sitter settlements */}
      {settlements.length > 0 && (
        <section className="ws-card p-5">
          <h2 className="font-bold text-slate-900">정산 내역 (시터)</h2>
          <table className="mt-3 w-full text-sm">
            <tbody className="divide-y divide-sky-100">
              {settlements.map((st) => (
                <tr key={st.id}>
                  <td className="py-2 text-slate-500">{formatDate(st.createdAt)}</td>
                  <td className="py-2">{st.job?.title ?? "돌봄"}</td>
                  <td className="py-2 text-right font-semibold text-sky-600">{won(st.netAmount)}</td>
                  <td className="py-2 text-right">
                    <SettlementBadge status={st.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="ws-card p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-slate-900">{value}</p>
      {suffix && <p className="text-xs text-slate-400">{suffix}</p>}
    </div>
  );
}

function SettlementBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    PAID: "bg-sky-100 text-sky-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    CANCELED: "bg-slate-100 text-slate-500",
  };
  const ko: Record<string, string> = {
    PENDING: "정산 대기",
    PAID: "지급 완료",
    COMPLETED: "정산 완료",
    CANCELED: "취소",
  };
  return <span className={`ws-badge ${map[status] ?? ""}`}>{ko[status] ?? status}</span>;
}
