import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// OAuth (Google / Apple) redirect target. Supabase sends the user back here with
// a `code`; we exchange it for a session cookie, then land them in the app.
// getCurrentUser() then provisions the matching Prisma user just-in-time.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // No code or exchange failed → back to login with a flag.
  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
