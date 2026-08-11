import Link from "next/link";
import { AdminUsers } from "@/components/AdminUsers";

// Admin user management: search + suspend/reinstate.
export default function AdminUsersPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin" className="text-sm text-sky-600 hover:underline">← Admin 대시보드</Link>
      <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Admin · 사용자 관리</h1>
      <p className="mt-1 text-slate-600">사용자를 검색하고 계정을 정지·해제합니다.</p>
      <div className="mt-6">
        <AdminUsers />
      </div>
    </div>
  );
}
