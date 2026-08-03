import { AdminSettingsForm } from "@/components/AdminSettingsForm";

// Admin console for the hybrid revenue model. Access is enforced server-side
// by the /api/admin/settings route (ADMIN role required).
export default function AdminSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-extrabold text-slate-900">Admin · Revenue settings</h1>
      <p className="mt-1 text-slate-600">
        수수료율, 이용권 가격, 크레딧 패키지, 액션별 크레딧 비용을 조정합니다.
      </p>
      <div className="mt-6">
        <AdminSettingsForm />
      </div>
    </div>
  );
}
