"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Registers the service worker and shows a lightweight "install app" banner when
// the browser fires beforeinstallprompt (Android/desktop Chrome). iOS Safari
// installs via Share → Add to Home Screen, so no prompt event fires there.
export function PwaManager() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      // Respect a prior dismissal within this session.
      if (sessionStorage.getItem("ws_install_dismissed") !== "1") setHidden(false);
    };
    const onInstalled = () => setHidden(true);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setHidden(true);
  }

  function dismiss() {
    sessionStorage.setItem("ws_install_dismissed", "1");
    setHidden(true);
  }

  if (hidden || !deferred) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto mb-4 flex max-w-md items-center gap-3 rounded-xl2 border border-sky-100 bg-white px-4 py-3 shadow-card">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-sky-500 text-lg text-white">☀️</span>
      <div className="flex-1">
        <p className="text-sm font-bold text-slate-900">warm sitter 앱 설치</p>
        <p className="text-xs text-slate-500">홈 화면에 추가하고 앱처럼 사용하세요.</p>
      </div>
      <button onClick={dismiss} className="text-sm text-slate-400">나중에</button>
      <button onClick={install} className="ws-btn-primary text-sm">설치</button>
    </div>
  );
}
