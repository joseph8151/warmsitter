import Link from "next/link";
import { BalanceBadge } from "./BalanceBadge";
import { NotificationBell } from "./NotificationBell";
import { MobileNav } from "./MobileNav";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary, getLocale } from "@/lib/i18n";

// Server component shell; the BalanceBadge (client) reads live balance.
export async function SiteHeader() {
  const user = await getCurrentUser();
  const locale = getLocale();
  const t = getDictionary(locale).nav;

  // Links shown in both the desktop nav and the mobile sheet.
  const links = [
    { href: "/sitters", label: t.findSitters },
    { href: "/jobs", label: t.jobs },
    { href: "/pricing", label: t.pricing },
    ...(user?.role === "PARENT" ? [{ href: "/favorites", label: t.favorites }] : []),
    ...(user ? [{ href: "/dashboard", label: t.dashboard }] : []),
    ...(user ? [{ href: "/chat", label: t.chat }] : []),
    ...(user ? [{ href: "/bookings", label: t.bookings }] : []),
    ...(user ? [{ href: "/interviews", label: t.interviews }] : []),
    ...(user?.role === "SITTER" ? [{ href: "/profile", label: t.profile }] : []),
    ...(user?.role === "ADMIN" ? [{ href: "/admin", label: t.admin }] : []),
  ];

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
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={
                l.href === "/admin"
                  ? "font-semibold text-sky-600 hover:text-sky-700"
                  : "hover:text-sky-600"
              }
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <LocaleSwitcher locale={locale} />
          </div>
          {user && <NotificationBell />}
          <BalanceBadge />
          <div className="hidden md:block">
            {user ? (
              <form action="/api/auth/signout" method="post">
                <button type="submit" className="text-sm font-medium text-slate-500 hover:text-sky-600">
                  {t.logout}
                </button>
              </form>
            ) : (
              <Link href="/login" className="text-sm font-medium text-slate-500 hover:text-sky-600">
                {t.login}
              </Link>
            )}
          </div>
          <MobileNav
            links={links}
            loggedIn={Boolean(user)}
            loginLabel={t.login}
            logoutLabel={t.logout}
          />
        </div>
      </div>
    </header>
  );
}
