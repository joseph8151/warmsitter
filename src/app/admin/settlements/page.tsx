import Link from "next/link";
import { AdminSettlements } from "@/components/AdminSettlements";

// Admin settlement processing: advance PENDING -> PAID -> COMPLETED.
export default function AdminSettlementsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin" className="text-sm text-sky-600 hover:underline">← Admin 대시보드</Link>
      <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Admin · 정산 처리</h1>
      <p className="mt-1 text-slate-600">
        부모 결제 완료 후 생성된 시터 정산을 지급·완료 처리합니다.
      </p>
      <div className="mt-6">
        <AdminSettlements />
      </div>
    </div>
  );
}
