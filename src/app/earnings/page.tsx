import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { won, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { ko: string; cls: string }> = {
  PENDING: { ko: "정산 대기", cls: "bg-amber-100 text-amber-700" },
  PAID: { ko: "지급 완료", cls: "bg-sky-100 text-sky-700" },
  COMPLETED: { ko: "정산 완료", cls: "bg-emerald-100 text-emerald-700" },
  CANCELED: { ko: "취소", cls: "bg-slate-100 text-slate-500" },
};

// Sitter earnings overview: totals + settlement history + CSV export.
export default async function EarningsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="ws-card mx-auto max-w-md p-10 text-center">
        <p className="text-slate-600">로그인이 필요합니다.</p>
        <Link href="/login" className="ws-btn-primary mt-4 inline-flex">로그인</Link>
      </div>
    );
  }
  if (user.role !== "SITTER") {
    return (
      <div className="ws-card mx-auto max-w-md p-10 text-center text-slate-600">
        수입 내역은 시터 계정에서 이용할 수 있어요.
      </div>
    );
  }

  const settlements = await prisma.settlement.findMany({
    where: { sitterId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { job: { select: { title: true } } },
  });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const paidLike = (s: (typeof settlements)[number]) => s.status === "PAID" || s.status === "COMPLETED";
  const totalNet = settlements.filter(paidLike).reduce((sum, s) => sum + s.netAmount, 0);
  const pendingNet = settlements.filter((s) => s.status === "PENDING").reduce((sum, s) => sum + s.netAmount, 0);
  const monthNet = settlements
    .filter((s) => paidLike(s) && s.createdAt >= monthStart)
    .reduce((sum, s) => sum + s.netAmount, 0);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">수입</h1>
          <p className="mt-1 text-slate-600">돌봄 정산 내역과 수입을 확인하세요.</p>
        </div>
        {settlements.length > 0 && (
          <a href="/api/earnings/export" className="ws-btn-ghost text-sm">⬇ CSV 내보내기</a>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Metric label="총 수입" value={won(totalNet)} accent />
        <Metric label="이번 달" value={won(monthNet)} />
        <Metric label="정산 대기" value={won(pendingNet)} />
      </div>

      <div className="mt-6">
        {settlements.length === 0 ? (
          <div className="ws-card p-10 text-center text-slate-500">아직 정산 내역이 없습니다.</div>
        ) : (
          <div className="ws-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sky-100 text-left text-slate-400">
                  <th className="px-4 py-3 font-medium">일자</th>
                  <th className="px-4 py-3 font-medium">돌봄</th>
                  <th className="px-4 py-3 text-right font-medium">돌봄비</th>
                  <th className="px-4 py-3 text-right font-medium">수수료</th>
                  <th className="px-4 py-3 text-right font-medium">정산액</th>
                  <th className="px-4 py-3 text-right font-medium">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-50">
                {settlements.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 text-slate-500">{formatDate(s.createdAt)}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{s.job?.title ?? "돌봄"}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{won(s.grossAmount)}</td>
                    <td className="px-4 py-3 text-right text-slate-400">- {won(s.platformFee)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-sky-600">{won(s.netAmount)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`ws-badge ${STATUS[s.status]?.cls ?? ""}`}>{STATUS[s.status]?.ko ?? s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`ws-card p-5 ${accent ? "border-2 border-sky-400" : ""}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${accent ? "text-sky-600" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}
