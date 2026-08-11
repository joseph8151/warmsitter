import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { Logo } from "@/components/brand/Logo";
import { BillingProvider } from "@/components/BillingProvider";
import { PwaManager } from "@/components/PwaManager";
import { getDictionary, getLocale } from "@/lib/i18n";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "warm sitter — Trusted babysitters, warmly matched",
  description:
    "Find and book caring, background-checked babysitters. Free to search — pay only when you connect.",
  manifest: "/manifest.webmanifest",
  applicationName: "warm sitter",
  appleWebApp: {
    capable: true,
    title: "warm sitter",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-180.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0ea5e9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = getLocale();
  const dict = getDictionary(locale);
  const isDark = cookies().get("ws_theme")?.value === "dark";
  return (
    <html lang={locale} className={isDark ? "dark" : undefined}>
      <body>
        <a href="#main" className="skip-link">
          본문 바로가기
        </a>
        <BillingProvider>
          <SiteHeader />
          <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6">
            {children}
          </main>
          <footer className="mt-8 border-t border-slate-100 bg-white/60">
            <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4">
              <div className="sm:col-span-2 md:col-span-1">
                <Logo markClass="h-9 w-9" />
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-500">
                  {dict.footer.tagline}
                </p>
              </div>
              <FooterCol
                title={locale === "en" ? "Explore" : "둘러보기"}
                links={[
                  { href: "/sitters", label: dict.nav.findSitters },
                  { href: "/jobs", label: dict.nav.jobs },
                  { href: "/pricing", label: dict.nav.pricing },
                ]}
              />
              <FooterCol
                title={locale === "en" ? "For sitters" : "시터"}
                links={[
                  { href: "/login?as=sitter", label: dict.home.sitterCtaButton },
                  { href: "/dashboard", label: dict.nav.dashboard },
                  { href: "/invite", label: locale === "en" ? "Invite & earn" : "친구 초대" },
                ]}
              />
              <FooterCol
                title={locale === "en" ? "Support" : "고객 지원"}
                links={[
                  { href: "/faq", label: locale === "en" ? "FAQ / Help" : "자주 묻는 질문" },
                  { href: "/login", label: dict.nav.login },
                ]}
              />
            </div>
            <div className="border-t border-slate-100 py-5 text-center text-xs text-slate-400">
              © {new Date().getFullYear()} warm sitter. {locale === "en" ? "All rights reserved." : "모든 권리 보유."}
            </div>
          </footer>
          <PwaManager />
        </BillingProvider>
      </body>
    </html>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="text-sm font-bold text-ink-900">{title}</p>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link href={l.href} className="text-sm text-slate-500 transition hover:text-sky-600">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
