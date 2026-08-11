import Link from "next/link";
import { AdminAudit } from "@/components/AdminAudit";

// Admin audit trail viewer.
export default function AdminAuditPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin" className="text-sm text-sky-600 hover:underline">← Admin 대시보드</Link>
      <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Admin · 감사 로그</h1>
      <p className="mt-1 text-slate-600">민감 작업(설정 변경·정산·신원확인·신고·차단)의 기록입니다.</p>
      <div className="mt-6">
        <AdminAudit />
      </div>
    </div>
  );
}
