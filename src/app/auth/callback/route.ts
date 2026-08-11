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
  const role = searchParams.get("role"); // "sitter" | "parent", from the join CTA

  if (code) {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Carry the intended role into user_metadata so getCurrentUser() provisions
      // a first-time social account with the right role. Only set it when it's
      // still empty, so an existing user's role is never overwritten here (their
      // Prisma role is authoritative regardless). resolveSelfProvisionRole() also
      // clamps anything unexpected to PARENT, so this can't grant privilege.
      if (role === "sitter" || role === "parent") {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user && !user.user_metadata?.role) {
          await supabase.auth.updateUser({ data: { role: role.toUpperCase() } });
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // No code or exchange failed → back to login with a flag.
  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
