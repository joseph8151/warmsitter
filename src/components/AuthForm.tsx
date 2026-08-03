"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Mode = "signin" | "signup";

// Supabase email/password auth. On success the server session cookie is set and
// getCurrentUser() provisions the matching Prisma user just-in-time.
export function AuthForm() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"PARENT" | "SITTER">("PARENT");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    const supabase = getSupabaseBrowserClient();

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name, role } },
        });
        if (error) throw error;
        // If email confirmation is on, there's no session yet.
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setNotice("확인 메일을 보냈어요. 메일의 링크를 눌러 가입을 완료해주세요.");
          setBusy(false);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err?.message ?? "인증에 실패했습니다.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="ws-card space-y-3 p-6">
      <div className="flex gap-2 rounded-full bg-sky-50 p-1">
        {(["signin", "signup"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
              mode === m ? "bg-white text-sky-700 shadow-card" : "text-slate-500"
            }`}
          >
            {m === "signin" ? "로그인" : "회원가입"}
          </button>
        ))}
      </div>

      {mode === "signup" && (
        <>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름"
            aria-label="이름"
            className="w-full rounded-lg border border-sky-200 px-3 py-2"
          />
          <div className="flex gap-2">
            {(["PARENT", "SITTER"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
                  role === r ? "border-sky-400 bg-sky-50 text-sky-700" : "border-sky-200 text-slate-500"
                }`}
              >
                {r === "PARENT" ? "부모" : "시터"}
              </button>
            ))}
          </div>
        </>
      )}

      <input
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="이메일"
        aria-label="이메일"
        autoComplete="email"
        className="w-full rounded-lg border border-sky-200 px-3 py-2"
      />
      <input
        required
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="비밀번호"
        aria-label="비밀번호"
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
        className="w-full rounded-lg border border-sky-200 px-3 py-2"
      />

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {notice && <p className="rounded-lg bg-sky-100 px-3 py-2 text-sm text-sky-700">{notice}</p>}

      <button disabled={busy} type="submit" className="ws-btn-primary w-full">
        {busy ? "처리 중…" : mode === "signin" ? "로그인" : "회원가입"}
      </button>
    </form>
  );
}
