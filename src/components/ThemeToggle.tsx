"use client";

import { useState } from "react";

// Light/dark toggle. Persists to the ws_theme cookie (read server-side in the
// layout so there's no flash) and flips the `dark` class immediately.
export function ThemeToggle({ initialDark }: { initialDark: boolean }) {
  const [dark, setDark] = useState(initialDark);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    document.cookie = `ws_theme=${next ? "dark" : "light"}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      aria-pressed={dark}
      title={dark ? "라이트 모드" : "다크 모드"}
      className="grid h-9 w-9 place-items-center rounded-full bg-sky-50 text-lg hover:bg-sky-100"
    >
      {dark ? "🌙" : "☀️"}
    </button>
  );
}
