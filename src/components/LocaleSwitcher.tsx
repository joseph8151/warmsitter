"use client";

import type { Locale } from "@/lib/i18n";

// Toggle between Korean and English. Persists to the ws_locale cookie (readable
// server-side) and reloads so server components re-render in the new language.
export function LocaleSwitcher({ locale }: { locale: Locale }) {
  function set(next: Locale) {
    if (next === locale) return;
    document.cookie = `ws_locale=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    window.location.reload();
  }

  return (
    <div className="flex items-center rounded-full bg-sky-50 p-0.5 text-xs font-semibold" aria-label="언어 선택">
      {(["ko", "en"] as Locale[]).map((l) => (
        <button
          key={l}
          onClick={() => set(l)}
          aria-pressed={locale === l}
          className={`rounded-full px-2 py-1 transition ${
            locale === l ? "bg-white text-sky-700 shadow" : "text-slate-400 hover:text-sky-600"
          }`}
        >
          {l === "ko" ? "한국어" : "EN"}
        </button>
      ))}
    </div>
  );
}
