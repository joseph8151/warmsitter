import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { JobForm } from "@/components/JobForm";

export const dynamic = "force-dynamic";

export default async function NewJobPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "PARENT") {
    return (
      <div className="ws-card mx-auto max-w-md p-10 text-center text-slate-600">
        구인글 작성은 부모 계정에서 이용할 수 있어요.
        <div className="mt-4">
          <Link href="/login" className="ws-btn-primary inline-flex">로그인</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/jobs" className="text-sm text-sky-600 hover:underline">← 구인글 목록</Link>
      <h1 className="mt-2 text-3xl font-extrabold text-slate-900">구인글 작성</h1>
      <p className="mt-1 text-slate-600">돌봄 요청을 올리면 시터들이 지원합니다. 작성은 무료예요.</p>
      <div className="mt-6">
        <JobForm />
      </div>
    </div>
  );
}
