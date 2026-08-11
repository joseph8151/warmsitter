import Link from "next/link";

// Toss redirects here after checkout. `status=success|fail`.
export default function BillingResultPage({
  searchParams,
}: {
  searchParams: { status?: string; orderId?: string };
}) {
  const success = searchParams.status === "success";
  return (
    <div className="mx-auto max-w-md pt-16 text-center">
      <div className="ws-card p-10">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-sky-100 text-4xl">
          {success ? "🎉" : "😕"}
        </div>
        <h1 className="mt-5 text-2xl font-extrabold text-slate-900">
          {success ? "결제가 완료되었어요!" : "결제가 취소되었습니다"}
        </h1>
        <p className="mt-2 text-slate-600">
          {success
            ? "이용권/크레딧이 정상적으로 충전되었습니다. 이제 마음에 드는 시터와 연결해보세요."
            : "문제가 계속되면 다른 결제 수단으로 다시 시도해 주세요."}
        </p>
        {searchParams.orderId && (
          <p className="mt-2 text-xs text-slate-400">주문번호: {searchParams.orderId}</p>
        )}
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/sitters" className="ws-btn-primary">
            시터 찾기
          </Link>
          <Link href="/dashboard" className="ws-btn-ghost">
            내 대시보드
          </Link>
        </div>
      </div>
    </div>
  );
}
