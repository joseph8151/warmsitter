import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AvatarUploader } from "@/components/AvatarUploader";
import { VerificationPanel } from "@/components/VerificationPanel";
import { AvailabilityEditor } from "@/components/AvailabilityEditor";
import { won } from "@/lib/format";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// Sitter profile: upload a photo (Supabase Storage) and view profile summary.
export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="ws-card mx-auto max-w-md p-10 text-center">
        <p className="text-slate-600">로그인이 필요합니다.</p>
        <Link href="/login" className="ws-btn-primary mt-4 inline-flex">로그인</Link>
      </div>
    );
  }

  if (user.role !== "SITTER") {
    return (
      <div className="ws-card mx-auto max-w-md p-10 text-center text-slate-600">
        프로필 사진 업로드는 시터 계정에서 이용할 수 있어요.
      </div>
    );
  }

  const profile = await prisma.sitterProfile.findUnique({ where: { userId: user.id } });

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-3xl font-extrabold text-slate-900">내 프로필</h1>

      <section className="ws-card p-6">
        <h2 className="mb-4 font-bold text-slate-900">프로필 사진</h2>
        <AvatarUploader initialUrl={profile?.photoUrl ?? null} name={user.name} />
      </section>

      <section className="ws-card p-6">
        <h2 className="mb-4 font-bold text-slate-900">신원확인</h2>
        <VerificationPanel />
      </section>

      <section className="ws-card p-6">
        <h2 className="mb-1 font-bold text-slate-900">가능 시간</h2>
        <p className="mb-4 text-sm text-slate-500">돌봄이 가능한 요일·시간대를 선택하세요. 부모가 검색 시 참고합니다.</p>
        <AvailabilityEditor locale={getLocale()} />
      </section>

      <section className="ws-card p-6">
        <h2 className="font-bold text-slate-900">프로필 정보</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <Row k="이름" v={user.name} />
          <Row k="시급" v={won(profile?.hourlyRate ?? 0)} />
          <Row k="지역" v={profile?.city ?? "-"} />
          <Row k="경력" v={`${profile?.yearsOfExp ?? 0}년`} />
          <Row k="인증" v={profile?.verified ? "✔ 인증됨" : "미인증"} />
        </dl>
      </section>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-sky-50 pb-2">
      <dt className="text-slate-500">{k}</dt>
      <dd className="font-medium text-slate-900">{v}</dd>
    </div>
  );
}
