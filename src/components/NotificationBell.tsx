"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/client/api";
import { PushToggle } from "./PushToggle";

interface Note {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

// Header notification bell with an unread badge and a dropdown list.
// Polls every 30s (in-app; no server push needed).
export function NotificationBell() {
  const [items, setItems] = useState<Note[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await api<{ items: Note[]; unread: number }>("/api/notifications");
      setItems(res.items);
      setUnread(res.unread);
    } catch {
      setEnabled(false); // not logged in
    }
  }

  useEffect(() => {
    void load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      await api("/api/notifications/read", { method: "POST", body: JSON.stringify({}) });
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }

  if (!enabled) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        className="relative grid h-9 w-9 place-items-center rounded-full bg-sky-50 text-lg hover:bg-sky-100"
        aria-label={unread > 0 ? `알림 ${unread}개` : "알림"}
        aria-haspopup="true"
        aria-expanded={open}
      >
        🔔
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl2 bg-white shadow-card ring-1 ring-sky-100">
          <div className="border-b border-sky-100 px-4 py-2 text-sm font-bold text-slate-900">알림</div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">새 알림이 없습니다.</p>
            ) : (
              items.map((n) => (
                <a
                  key={n.id}
                  href={n.link ?? "#"}
                  className={`block border-b border-sky-50 px-4 py-3 hover:bg-sky-50 ${n.read ? "" : "bg-sky-50/60"}`}
                >
                  <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                  {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{n.body}</p>}
                </a>
              ))
            )}
          </div>
          <a
            href="/notifications"
            className="block border-t border-sky-100 px-4 py-2.5 text-center text-sm font-semibold text-sky-600 hover:bg-sky-50"
          >
            모든 알림 보기
          </a>
          <PushToggle />
        </div>
      )}
    </div>
  );
}
