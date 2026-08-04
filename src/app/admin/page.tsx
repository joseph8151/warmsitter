import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { won } from "@/lib/format";

export const dynamic = "force-dynamic";

// Unified admin overview: revenue metrics + queues + quick links.
export default async function AdminHomePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return (
      <div className="ws-card mx-auto max-w-md p-10 text-center text-slate-600">
        관리자 전용 페이지입니다.
        <div className="mt-4">
          <Link href="/login" className="ws-btn-primary inline-flex">로그인</Link>
        </div>
      </div>
    );
  }

  const now = new Date();
  const [
    careAgg,
    ticketAgg,
    creditAgg,
    subAgg,
    premiumMembers,
    activeTickets,
    pendingVerifications,
    pendingSettlements,
    paidSettlements,
    openReports,
    settings,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: { purpose: "CARE_FEE", status: "PAID" },
      _sum: { careFee: true, platformFee: true },
      _count: true,
    }),
    prisma.payment.aggregate({ where: { purpose: "TICKET", status: "PAID" }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { purpose: "CREDIT_PACK", status: "PAID" }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { purpose: "SUBSCRIPTION", status: "PAID" }, _sum: { amount: true } }),
    prisma.user.count({ where: { isPremium: true } }),
    prisma.user.count({ where: { ticketExpiresAt: { gt: now } } }),
    prisma.sitterVerification.count({ where: { status: "PENDING" } }),
    prisma.settlement.count({ where: { status: "PENDING" } }),
    prisma.settlement.aggregate({ where: { status: { in: ["PAID", "COMPLETED"] } }, _sum: { netAmount: true } }),
    prisma.report.count({ where: { status: { in: ["OPEN", "REVIEWING"] } } }),
    getSettings(),
  ]);

  const platformRevenue =
    (careAgg._sum.platformFee ?? 0) +
    (ticketAgg._sum.amount ?? 0) +
    (creditAgg._sum.amount ?? 0) +
    (subAgg._sum.amount ?? 0);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold text-slate-900">Admin 대시보드</h1>

      {/* Revenue metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="플랫폼 총 수익" value={won(platformRevenue)} accent />
        <Metric label="돌봄 수수료" value={won(careAgg._sum.platformFee ?? 0)} sub={`거래 ${careAgg._count}건`} />
        <Metric label="이용권+크레딧" value={won((ticketAgg._sum.amount ?? 0) + (creditAgg._sum.amount ?? 0))} />
        <Metric label="구독 수익" value={won(subAgg._sum.amount ?? 0)} />
        <Metric label="프리미엄 회원" value={`${premiumMembers}명`} />
        <Metric label="활성 이용권" value={`${activeTickets}개`} />
        <Metric label="시터 지급액" value={won(paidSettlements._sum.netAmount ?? 0)} />
        <Metric label="현재 수수료율" value={`${settings.feeRateBps / 100}%`} />
      </div>

      {/* Queues + links */}
      <div className="grid gap-4 md:grid-cols-3">
        <QueueCard
          href="/admin/verifications"
          title="신원확인 심사"
          count={pendingVerifications}
          cta="심사하기"
        />
        <QueueCard
          href="/admin/settlements"
          title="정산 처리"
          count={pendingSettlements}
          cta="정산하기"
        />
        <QueueCard href="/admin/reports" title="신고 처리" count={openReports} cta="검토하기" />
        <QueueCard href="/admin/settings" title="수익 설정" count={null} cta="설정 열기" />
        <QueueCard href="/admin/users" title="사용자 관리" count={null} cta="사용자 보기" />
        <QueueCard href="/admin/audit" title="감사 로그" count={null} cta="기록 보기" />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={`ws-card p-5 ${accent ? "border-2 border-sky-400" : ""}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${accent ? "text-sky-600" : "text-slate-900"}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function QueueCard({
  href,
  title,
  count,
  cta,
}: {
  href: string;
  title: string;
  count: number | null;
  cta: string;
}) {
  return (
    <Link href={href} className="ws-card flex items-center justify-between p-5 hover:bg-sky-50">
      <div>
        <p className="font-bold text-slate-900">{title}</p>
        {count !== null && (
          <p className="text-sm text-slate-500">
            대기 <span className="font-semibold text-sky-600">{count}</span>건
          </p>
        )}
      </div>
      <span className="ws-btn-ghost text-sm">{cta}</span>
    </Link>
  );
}
