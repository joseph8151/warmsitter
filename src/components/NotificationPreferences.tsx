"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";

interface Prefs {
  emailNotifications: boolean;
  pushNotifications: boolean;
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-400">{hint}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-sky-500" : "bg-slate-300"} disabled:opacity-50`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${checked ? "left-[22px]" : "left-0.5"}`}
        />
      </button>
    </div>
  );
}

// Lets users turn notification channels on/off (consent / spam control).
export function NotificationPreferences() {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<Prefs>("/api/me/preferences").then(setPrefs).catch(() => setPrefs(null));
  }, []);

  async function update(patch: Partial<Prefs>) {
    if (!prefs) return;
    const optimistic = { ...prefs, ...patch };
    setPrefs(optimistic);
    setSaving(true);
    try {
      const res = await api<Prefs>("/api/me/preferences", { method: "PUT", body: JSON.stringify(patch) });
      setPrefs(res);
    } catch {
      setPrefs(prefs); // revert
    } finally {
      setSaving(false);
    }
  }

  if (!prefs) return null;

  return (
    <section className="ws-card p-5">
      <h2 className="font-bold text-slate-900">알림 설정</h2>
      <div className="mt-2 divide-y divide-sky-50">
        <Toggle
          label="이메일 알림"
          hint="지원·수락·면접·정산·만료 등 중요 알림을 이메일로 받기"
          checked={prefs.emailNotifications}
          onChange={(v) => update({ emailNotifications: v })}
          disabled={saving}
        />
        <Toggle
          label="푸시 알림"
          hint="브라우저/기기 잠금화면 알림 받기"
          checked={prefs.pushNotifications}
          onChange={(v) => update({ pushNotifications: v })}
          disabled={saving}
        />
      </div>
    </section>
  );
}
