import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureReferralCode, REFERRAL_BONUS } from "@/lib/referral";
import { InviteCard } from "@/components/InviteCard";

export const dynamic = "force-dynamic";

// Referral page: share your code, and see how many friends have joined.
export default async function InvitePage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="ws-card mx-auto max-w-md p-10 text-center">
        <p className="text-slate-600">로그인이 필요합니다.</p>
        <Link href="/login" className="ws-btn-primary mt-4 inline-flex">로그인</Link>
      </div>
    );
  }

  const code = await ensureReferralCode(user.id);
  const joined = await prisma.user.count({ where: { referredById: user.id } });
  const creditsEarned = joined * REFERRAL_BONUS;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header className="text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-sky-100 text-3xl">🎁</div>
        <h1 className="mt-4 text-3xl font-extrabold text-slate-900">친구 초대하고 크레딧 받기</h1>
        <p className="mt-2 text-slate-600">
          내 링크로 친구가 가입하면 <b className="text-sky-600">둘 다 크레딧 {REFERRAL_BONUS}개</b>를 받아요.
          크레딧은 시터에게 면접 제안·채팅을 시작할 때 쓸 수 있어요.
        </p>
      </header>

      <section className="ws-card p-6">
        <InviteCard code={code} bonus={REFERRAL_BONUS} />
      </section>

      <section className="grid grid-cols-2 gap-4">
        <div className="ws-card p-5 text-center">
          <p className="text-sm text-slate-500">가입한 친구</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{joined}명</p>
        </div>
        <div className="ws-card p-5 text-center">
          <p className="text-sm text-slate-500">받은 크레딧</p>
          <p className="mt-1 text-2xl font-extrabold text-sky-600">{creditsEarned}개</p>
        </div>
      </section>

      <ol className="ws-card space-y-3 p-6 text-sm text-slate-600">
        <li className="flex gap-3">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sky-500 text-xs font-bold text-white">1</span>
          위 링크를 친구에게 공유하세요.
        </li>
        <li className="flex gap-3">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sky-500 text-xs font-bold text-white">2</span>
          친구가 그 링크로 접속해 가입해요.
        </li>
        <li className="flex gap-3">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sky-500 text-xs font-bold text-white">3</span>
          가입이 완료되면 두 사람 모두에게 크레딧 {REFERRAL_BONUS}개가 지급돼요.
        </li>
      </ol>
    </div>
  );
}
