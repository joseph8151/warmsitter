"use client";

import { useEffect, useState } from "react";

// Client-side share UI for the referral page. The share link is built from the
// live origin so it works on any deployment domain without server config.
export function InviteCard({ code, bonus }: { code: string; bonus: number }) {
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState(`/?ref=${code}`);

  // Resolve the absolute link on the client (origin isn't known on the server).
  useEffect(() => {
    setLink(`${window.location.origin}/?ref=${code}`);
  }, [code]);

  const message = `warm sitter에 초대할게요! 이 링크로 가입하면 우리 둘 다 크레딧 ${bonus}개를 받아요 🎁\n${link}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — select fallback handled by the readonly input.
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "warm sitter 초대", text: message, url: link });
      } catch {
        /* user canceled */
      }
    } else {
      void copy();
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-sky-50 p-4 text-center">
        <p className="text-sm text-slate-500">내 초대 코드</p>
        <p className="mt-1 text-3xl font-extrabold tracking-widest text-sky-700">{code}</p>
      </div>

      <div className="flex gap-2">
        <input
          readOnly
          value={link}
          aria-label="초대 링크"
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-600"
        />
        <button onClick={copy} className="ws-btn-ghost shrink-0 text-sm font-semibold">
          {copied ? "복사됨 ✓" : "복사"}
        </button>
      </div>

      <button onClick={share} className="ws-btn-primary w-full">
        친구에게 공유하기
      </button>
    </div>
  );
}
