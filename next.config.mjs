// Build the allowed remote image hosts from the Supabase URL (+ common Supabase
// domains) so next/image can optimize uploaded avatars / work-log photos.
const remotePatterns = [
  { protocol: "https", hostname: "*.supabase.co" },
  { protocol: "https", hostname: "*.supabase.in" },
];
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    remotePatterns.push({
      protocol: "https",
      hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,
    });
  } catch {
    // ignore malformed URL
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // No ESLint config is shipped in this scaffold; typecheck runs via `npm run typecheck`.
  eslint: { ignoreDuringBuilds: true },
  images: { remotePatterns },
};

export default nextConfig;
