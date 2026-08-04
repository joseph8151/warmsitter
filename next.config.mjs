// Build the allowed remote image hosts from the Supabase URL (+ common Supabase
// domains) so next/image can optimize uploaded avatars / work-log photos.
const remotePatterns = [
  { protocol: "https", hostname: "*.supabase.co" },
  { protocol: "https", hostname: "*.supabase.in" },
];
let supabaseHost = "";
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
    remotePatterns.push({ protocol: "https", hostname: supabaseHost });
  } catch {
    // ignore malformed URL
  }
}

const isDev = process.env.NODE_ENV !== "production";
const supabaseImg = supabaseHost ? `https://${supabaseHost}` : "";

// Content-Security-Policy. Allows only what the app needs: Toss Payments SDK,
// Supabase (REST + Realtime websockets), data/blob images. 'unsafe-inline' is
// required for Next's hydration/styles without a nonce pipeline; 'unsafe-eval'
// is dev-only (HMR).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://*.tosspayments.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in ${supabaseImg}`,
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.supabase.in https://*.tosspayments.com ${supabaseImg} ${supabaseHost ? `wss://${supabaseHost}` : ""}`,
  "frame-src 'self' https://*.tosspayments.com",
  "font-src 'self' data:",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
]
  .map((s) => s.replace(/\s+/g, " ").trim())
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // No ESLint config is shipped in this scaffold; typecheck runs via `npm run typecheck`.
  eslint: { ignoreDuringBuilds: true },
  images: { remotePatterns },
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
