import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { BookingList } from "@/components/BookingList";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="ws-card mx-auto max-w-md p-10 text-center">
        <p className="text-slate-600">로그인이 필요합니다.</p>
        <Link href="/login" className="ws-btn-primary mt-4 inline-flex">로그인</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-extrabold text-slate-900">예약</h1>
      <p className="mt-1 text-slate-600">
        채팅에서 합의한 일정을 예약으로 확정하세요. 확정되면 부모가 바로 결제할 수 있어요.
      </p>
      <div className="mt-6">
        <BookingList />
      </div>
    </div>
  );
}
