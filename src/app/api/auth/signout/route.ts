import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isSupabaseAuthEnabled } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Signs out of Supabase (if enabled) and clears the demo cookie, then redirects.
export async function POST(req: Request) {
  if (isSupabaseAuthEnabled) {
    const supabase = createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  cookies().delete("ws_uid");
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(req.url).origin;
  return NextResponse.redirect(`${base}/`, { status: 303 });
}
