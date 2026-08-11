"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface NavLink {
  href: string;
  label: string;
}

// Right-aligned dropdown holding the logged-in user's personal links + logout,
// so the top nav stays uncluttered as features grow.
export function UserMenu({
  name,
  links,
  logoutLabel,
}: {
  name: string;
  links: NavLink[];
  logoutLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full bg-sky-50 py-1 pl-1 pr-3 hover:bg-sky-100"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-sky-500 text-sm font-bold text-white">
          {name.charAt(0)}
        </span>
        <span className="max-w-[8rem] truncate text-sm font-medium text-slate-700">{name}</span>
        <span className="text-xs text-slate-400">▾</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-52 overflow-hidden rounded-xl2 bg-white py-1 shadow-card ring-1 ring-sky-100"
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-sky-50"
            >
              {l.label}
            </Link>
          ))}
          <form action="/api/auth/signout" method="post" className="border-t border-sky-100">
            <button type="submit" role="menuitem" className="block w-full px-4 py-2.5 text-left text-sm text-slate-500 hover:bg-sky-50">
              {logoutLabel}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
