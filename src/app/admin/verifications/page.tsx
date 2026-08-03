import { AdminVerifications } from "@/components/AdminVerifications";

// Admin console for reviewing sitter identity verifications. Access enforced
// server-side by /api/admin/verifications (ADMIN role).
export default function AdminVerificationsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-extrabold text-slate-900">Admin · 신원확인 심사</h1>
      <p className="mt-1 text-slate-600">시터가 제출한 신분증을 검토하고 인증 뱃지를 부여합니다.</p>
      <div className="mt-6">
        <AdminVerifications />
      </div>
    </div>
  );
}
