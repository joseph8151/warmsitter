"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useFocusTrap } from "@/lib/client/useFocusTrap";

interface NavLink {
  href: string;
  label: string;
}

// Hamburger menu for small screens (the inline nav is hidden below md).
export function MobileNav({
  links,
  loggedIn,
}: {
  links: NavLink[];
  loggedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useFocusTrap<HTMLElement>(open);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    if (open) document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        aria-label="메뉴 열기"
        aria-expanded={open}
        className="grid h-9 w-9 place-items-center rounded-full bg-sky-50 text-lg hover:bg-sky-100"
      >
        ☰
      </button>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="메뉴">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <nav ref={panelRef} className="absolute right-0 top-0 h-full w-72 max-w-[80%] bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-extrabold text-sky-700">메뉴</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="메뉴 닫기"
                className="grid h-8 w-8 place-items-center rounded-full bg-sky-50 text-slate-500 hover:bg-sky-100"
              >
                ✕
              </button>
            </div>
            <ul className="space-y-1">
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2.5 font-medium text-slate-700 hover:bg-sky-50"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-sky-100 pt-4">
              {loggedIn ? (
                <form action="/api/auth/signout" method="post">
                  <button type="submit" className="ws-btn-ghost w-full text-sm">
                    로그아웃
                  </button>
                </form>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)} className="ws-btn-primary w-full text-sm">
                  로그인
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
