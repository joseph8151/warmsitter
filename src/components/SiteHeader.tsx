import Link from "next/link";
import { BalanceBadge } from "./BalanceBadge";
import { getCurrentUser } from "@/lib/auth";

// Server component shell; the BalanceBadge (client) reads live balance.
export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-30 border-b border-sky-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-sky-500 text-lg text-white shadow-card">
            ☀️
          </span>
          <span className="text-lg font-extrabold tracking-tight text-sky-700">
            warm<span className="text-sunny-500">sitter</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <Link href="/sitters" className="hover:text-sky-600">
            Find sitters
          </Link>
          <Link href="/pricing" className="hover:text-sky-600">
            Pricing
          </Link>
          <Link href="/dashboard" className="hover:text-sky-600">
            Dashboard
          </Link>
          {user && (
            <Link href="/chat" className="hover:text-sky-600">
              Chat
            </Link>
          )}
          {user?.role === "SITTER" && (
            <Link href="/profile" className="hover:text-sky-600">
              Profile
            </Link>
          )}
          {user?.role === "ADMIN" && (
            <Link href="/admin" className="font-semibold text-sky-600 hover:text-sky-700">
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <BalanceBadge />
          {user ? (
            <form action="/api/auth/signout" method="post">
              <button type="submit" className="text-sm font-medium text-slate-500 hover:text-sky-600">
                로그아웃
              </button>
            </form>
          ) : (
            <Link href="/login" className="text-sm font-medium text-slate-500 hover:text-sky-600">
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
