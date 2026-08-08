"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Provider = "google" | "apple";

// Google + Apple social sign-in. Redirects to the provider, which returns to
// /auth/callback to exchange the code for a session. An optional `role` is
// carried through the callback so a first-time social sign-up can land as a
// SITTER (otherwise brand-new social accounts default to PARENT).
export function OAuthButtons({ role }: { role?: "PARENT" | "SITTER" }) {
  const [busy, setBusy] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(provider: Provider) {
    setBusy(provider);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const callback = new URL(`${window.location.origin}/auth/callback`);
      if (role) callback.searchParams.set("role", role.toLowerCase());
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: callback.toString() },
      });
      if (error) throw error;
      // On success the browser is redirected away; nothing else to do here.
    } catch {
      setError("소셜 로그인을 시작하지 못했어요. 잠시 후 다시 시도해주세요.");
      setBusy(null);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => signIn("google")}
        disabled={busy !== null}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
      >
        <GoogleIcon />
        {busy === "google" ? "이동 중…" : "Google로 계속하기"}
      </button>

      <button
        type="button"
        onClick={() => signIn("apple")}
        disabled={busy !== null}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
      >
        <AppleIcon />
        {busy === "apple" ? "이동 중…" : "Apple로 계속하기"}
      </button>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 384 512" fill="currentColor" aria-hidden="true">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}
