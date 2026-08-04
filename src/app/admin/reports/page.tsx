import Link from "next/link";
import { AdminReports } from "@/components/AdminReports";

// Admin moderation queue for user safety reports.
export default function AdminReportsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin" className="text-sm text-sky-600 hover:underline">← Admin 대시보드</Link>
      <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Admin · 신고 처리</h1>
      <p className="mt-1 text-slate-600">사용자 신고를 검토하고 조치합니다.</p>
      <div className="mt-6">
        <AdminReports />
      </div>
    </div>
  );
}
