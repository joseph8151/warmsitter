import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { won, formatDate } from "@/lib/format";
import { PURPOSE_LABEL } from "@/lib/receipts";

export const dynamic = "force-dynamic";

const STATUS_CLS: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-700",
  REFUNDED: "bg-slate-100 text-slate-500",
};

// Billing history / receipts with a CSV export.
export default async function ReceiptsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="ws-card mx-auto max-w-md p-10 text-center">
        <p className="text-slate-600">로그인이 필요합니다.</p>
        <Link href="/login" className="ws-btn-primary mt-4 inline-flex">로그인</Link>
      </div>
    );
  }

  const payments = await prisma.payment.findMany({
    where: { userId: user.id, status: { in: ["PAID", "REFUNDED"] } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const total = payments.reduce((sum, p) => (p.status === "PAID" ? sum + p.amount : sum), 0);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">결제 내역</h1>
          <p className="mt-1 text-slate-600">누적 결제 {won(total)}</p>
        </div>
        {payments.length > 0 && (
          <a href="/api/receipts/export" className="ws-btn-ghost text-sm">⬇ CSV 내보내기</a>
        )}
      </div>

      {payments.length === 0 ? (
        <div className="ws-card mt-6 p-10 text-center text-slate-500">아직 결제 내역이 없습니다.</div>
      ) : (
        <div className="ws-card mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sky-100 text-left text-slate-400">
                <th className="px-4 py-3 font-medium">일자</th>
                <th className="px-4 py-3 font-medium">항목</th>
                <th className="px-4 py-3 text-right font-medium">금액</th>
                <th className="px-4 py-3 text-right font-medium">수수료</th>
                <th className="px-4 py-3 text-right font-medium">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-50">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-slate-500">{formatDate(p.createdAt)}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {PURPOSE_LABEL[p.purpose] ?? p.purpose}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">{won(p.amount)}</td>
                  <td className="px-4 py-3 text-right text-slate-500">
                    {p.platformFee != null ? won(p.platformFee) : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`ws-badge ${STATUS_CLS[p.status] ?? ""}`}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
