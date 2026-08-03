import { prisma } from "@/lib/prisma";
import { LoginButtons } from "@/components/LoginButtons";
import { AuthForm } from "@/components/AuthForm";
import { isSupabaseAuthEnabled } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

// Real Supabase auth when configured; demo user-picker as a fallback.
export default async function LoginPage() {
  const supabaseOn = isSupabaseAuthEnabled;

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
        {supabaseOn ? "warm sitter 로그인" : "데모 로그인"}
      </h1>
      <p className="mt-1 text-slate-600">
        {supabaseOn
          ? "이메일로 로그인하거나 회원가입하세요."
          : "인증은 데모용 스텁입니다. 아래에서 사용자를 선택해 로그인하세요."}
      </p>

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
