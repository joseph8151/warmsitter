import { prisma } from "@/lib/prisma";
import { LoginButtons } from "@/components/LoginButtons";
import { AuthForm } from "@/components/AuthForm";
import { isSupabaseAuthEnabled } from "@/lib/supabase/config";
import { getDictionary, getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// Real Supabase auth when configured; demo user-picker as a fallback.
export default async function LoginPage() {
  const supabaseOn = isSupabaseAuthEnabled;
  const t = getDictionary(getLocale()).auth;

  const users = supabaseOn
    ? []
    : await prisma.user.findMany({
        orderBy: { role: "asc" },
        take: 20,
        select: { id: true, name: true, email: true, role: true },
      });

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-extrabold text-slate-900">
        {supabaseOn ? t.loginTitle : t.demoTitle}
      </h1>
      <p className="mt-1 text-slate-600">{supabaseOn ? t.loginSubtitle : t.demoSubtitle}</p>

      <div className="mt-6">
        {supabaseOn ? (
          <AuthForm />
        ) : users.length === 0 ? (
          <div className="ws-card p-6 text-center text-slate-500">
            사용자가 없습니다. <code>npm run db:seed</code> 를 먼저 실행하세요.
          </div>
        ) : (
          <LoginButtons users={users} />
        )}
      </div>
    </div>
  );
}
