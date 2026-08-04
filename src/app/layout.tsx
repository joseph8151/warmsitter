import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
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
          <footer className="border-t border-sky-100 bg-white/60 py-8 text-center text-sm text-slate-500">
            <p>{dict.footer.tagline}</p>
          </footer>
          <PwaManager />
        </BillingProvider>
      </body>
    </html>
  );
}
