import { prisma } from "@/lib/prisma";
import { LoginButtons } from "@/components/LoginButtons";

export const dynamic = "force-dynamic";

// Demo login: pick any seeded user to impersonate (sets the ws_uid cookie).
// Replace with real auth (NextAuth/Clerk) in production.
export default async function LoginPage() {
  const users = await prisma.user.findMany({
    orderBy: { role: "asc" },
    take: 20,
    select: { id: true, name: true, email: true, role: true },
  });

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-extrabold text-slate-900">데모 로그인</h1>
      <p className="mt-1 text-slate-600">
        인증은 데모용 스텁입니다. 아래에서 사용자를 선택해 로그인하세요.
      </p>
      {users.length === 0 ? (
        <div className="ws-card mt-6 p-6 text-center text-slate-500">
          사용자가 없습니다. <code>npm run db:seed</code> 를 먼저 실행하세요.
        </div>
      ) : (
        <div className="mt-6">
          <LoginButtons users={users} />
        </div>
      )}
    </div>
  );
}
