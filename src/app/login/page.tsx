import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LoginButtons } from "@/components/LoginButtons";
import { AuthForm } from "@/components/AuthForm";
import { Logo } from "@/components/brand/Logo";
import {
  BadgeCheckIcon,
  SearchIcon,
  LockIcon,
  ShieldCheckIcon,
  ClockIcon,
  WalletIcon,
  ArrowRightIcon,
} from "@/components/brand/Icons";
import { isSupabaseAuthEnabled } from "@/lib/supabase/config";
import { isDemoLoginAllowed } from "@/lib/security";
import { getDictionary, getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// Real Supabase auth when configured; demo user-picker only when demo login is
// allowed (never in production / when real auth is on).
export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; as?: string };
}) {
  const supabaseOn = isSupabaseAuthEnabled;
  const demoOn = isDemoLoginAllowed();
  const t = getDictionary(getLocale()).auth;
  const asSitter = searchParams.as === "sitter";

  // Only expose the user list when the demo picker is actually usable.
  const users = demoOn
    ? await prisma.user.findMany({
        orderBy: { role: "asc" },
        take: 20,
        select: { id: true, name: true, email: true, role: true },
      })
    : [];

  // Value props shown beside the form — different pitch for parents vs sitters.
  const parentSell = [
    { Icon: BadgeCheckIcon, title: t.sell1, desc: t.sell1d },
    { Icon: SearchIcon, title: t.sell2, desc: t.sell2d },
    { Icon: LockIcon, title: t.sell3, desc: t.sell3d },
    { Icon: ShieldCheckIcon, title: t.sell4, desc: t.sell4d },
  ];
  const sitterSell = [
    { Icon: WalletIcon, title: t.sellSitter1, desc: t.sellSitter1d },
    { Icon: ClockIcon, title: t.sellSitter2, desc: t.sellSitter2d },
    { Icon: ShieldCheckIcon, title: t.sellSitter3, desc: t.sellSitter3d },
  ];
  const sell = asSitter ? sitterSell : parentSell;

  return (
    <div className="mx-auto grid max-w-5xl items-start gap-10 py-4 md:grid-cols-2 md:gap-14 md:py-10">
      {/* ------------------------------------------------- Explanation panel */}
      <section className="ws-animate relative order-2 md:order-1">
        <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="relative">
          <Logo />
          <h1 className="mt-6 whitespace-pre-line text-3xl font-extrabold leading-tight tracking-tight text-ink-900 md:text-4xl">
            {asSitter ? t.sitterJoinTitle : t.sellTitle}
          </h1>
          <p className="mt-3 max-w-md text-slate-600">
            {asSitter ? t.sitterJoinSubtitle : t.sellSubtitle}
          </p>

          <ul className="mt-8 space-y-4">
            {sell.map(({ Icon, title, desc }) => (
              <li key={title} className="flex gap-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-bold text-ink-900">{title}</p>
                  <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            <BadgeCheckIcon className="h-4 w-4" />
            {t.sellFree}
          </p>
        </div>
      </section>

      {/* --------------------------------------------------------- Auth card */}
      <section className="order-1 md:order-2">
        <h2 className="text-2xl font-extrabold text-ink-900">
          {!supabaseOn ? t.demoTitle : asSitter ? t.sitterJoinTitle : t.loginTitle}
        </h2>
        <p className="mt-1 text-slate-600">
          {!supabaseOn ? t.demoSubtitle : asSitter ? t.sitterJoinSubtitle : t.loginSubtitle}
        </p>

        {searchParams.error === "oauth" && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            소셜 로그인에 실패했어요. 다시 시도해주세요.
          </p>
        )}

        <div className="mt-5">
          {supabaseOn ? (
            <AuthForm sitter={asSitter} />
          ) : !demoOn ? (
            <div className="ws-card p-6 text-center text-slate-500">
              로그인이 구성되지 않았습니다. Supabase 인증 환경변수를 설정해주세요.
            </div>
          ) : users.length === 0 ? (
            <div className="ws-card p-6 text-center text-slate-500">
              사용자가 없습니다. <code>npm run db:seed</code> 를 먼저 실행하세요.
            </div>
          ) : (
            <LoginButtons users={users} />
          )}
        </div>

        {/* Switch between parent / sitter intent */}
        {supabaseOn && (
          <div className="mt-5 text-center text-sm text-slate-500">
            {asSitter ? (
              <Link href="/login" className="inline-flex items-center gap-1 font-semibold text-sky-600 hover:text-sky-700">
                {t.sellSwitchToParent}
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            ) : (
              <Link href="/login?as=sitter" className="inline-flex items-center gap-1 font-semibold text-sky-600 hover:text-sky-700">
                {t.sellSwitchToSitter}
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
