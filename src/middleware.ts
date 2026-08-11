import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const MUTATIONS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
// External callers that legitimately POST cross-origin (verified by signature).
const CSRF_EXEMPT = new Set(["/api/payments/webhook"]);

// CSRF defense: a cookie-authenticated mutating API request must originate from
// our own site. Browsers always send Origin on such requests, so a mismatch (or
// a cross-site Origin) is rejected. Webhooks are exempt (signature-verified).
function blockedByCsrf(request: NextRequest): boolean {
  const { method, nextUrl } = request;
  if (!MUTATIONS.has(method)) return false;
  if (!nextUrl.pathname.startsWith("/api/")) return false;
  if (CSRF_EXEMPT.has(nextUrl.pathname)) return false;

  const origin = request.headers.get("origin");
  if (!origin) return false; // non-browser client without Origin; allow
  try {
    return new URL(origin).host !== request.headers.get("host");
  } catch {
    return true; // malformed Origin -> block
  }
}

export async function middleware(request: NextRequest) {
  if (blockedByCsrf(request)) {
    return NextResponse.json({ error: "CSRF_BLOCKED" }, { status: 403 });
  }

  const response = NextResponse.next({ request });

  // Capture a referral code from `?ref=CODE` so it survives until the visitor
  // signs up (applied once by applyReferralForNewUser on first provisioning).
  const ref = request.nextUrl.searchParams.get("ref");
  if (ref) {
    const code = ref.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
    if (code.length >= 4) {
      response.cookies.set("ws_ref", code, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
    }
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return response;

  // Refresh the Supabase auth session and forward updated cookies.
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
