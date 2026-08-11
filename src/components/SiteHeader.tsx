import Link from "next/link";
import { Logo } from "./brand/Logo";
import { BalanceBadge } from "./BalanceBadge";
import { NotificationBell } from "./NotificationBell";
import { MobileNav } from "./MobileNav";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary, getLocale } from "@/lib/i18n";
import { cookies } from "next/headers";

// Server component shell; the BalanceBadge (client) reads live balance.
export async function SiteHeader() {
  const user = await getCurrentUser();
  const locale = getLocale();
  const t = getDictionary(locale).nav;
  const isDark = cookies().get("ws_theme")?.value === "dark";

  // Public marketing links: always inline in the top nav.
  const publicLinks = [
    { href: "/sitters", label: t.findSitters },
    { href: "/jobs", label: t.jobs },
    { href: "/pricing", label: t.pricing },
  ];

  // Personal links for logged-in users: tucked into the right-side user menu.
  const personalLinks = user
    ? [
        { href: "/dashboard", label: t.dashboard },
        ...(user.role === "PARENT" ? [{ href: "/my-jobs", label: t.myJobs }] : []),
        ...(user.role === "PARENT" ? [{ href: "/favorites", label: t.favorites }] : []),
        { href: "/chat", label: t.chat },
        { href: "/bookings", label: t.bookings },
        { href: "/interviews", label: t.interviews },
        ...(user.role === "SITTER" ? [{ href: "/earnings", label: t.earnings }] : []),
        ...(user.role === "SITTER" ? [{ href: "/profile", label: t.profile }] : []),
        ...(user.role === "ADMIN" ? [{ href: "/admin", label: t.admin }] : []),
      ]
    : [];

  // The mobile sheet lists everything.
  const links = [...publicLinks, ...personalLinks];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-100/80 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" aria-label="warm sitter 홈" className="transition hover:opacity-90">
          <Logo markClass="h-9 w-9" />
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
          {publicLinks.map((l) => (
            <Link key={l.href} href={l.href} className="relative transition hover:text-sky-600">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <LocaleSwitcher locale={locale} />
          </div>
          <ThemeToggle initialDark={isDark} />
          {user && <NotificationBell />}
          <BalanceBadge />
          {user ? (
            <UserMenu name={user.name} links={personalLinks} logoutLabel={t.logout} />
          ) : (
            <Link href="/login" className="ws-btn-ghost hidden px-4 py-2 text-sm md:inline-flex">
              {t.login}
            </Link>
          )}
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
