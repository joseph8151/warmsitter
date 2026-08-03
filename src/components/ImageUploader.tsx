"use client";

import { useRef, useState } from "react";

// Reusable image picker that uploads to /api/uploads and reports the public URL.
export function ImageUploader({
  kind,
  onUploaded,
  label = "이미지 선택",
}: {
  kind: "avatar" | "worklog" | "verification";
  onUploaded: (url: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("kind", kind);
      form.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: form });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.message ?? "업로드 실패");
      onUploaded(body.url as string);
    } catch (e: any) {
      setError(e?.message ?? "업로드 실패");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="ws-btn-ghost text-sm"
      >
        {busy ? "업로드 중…" : `📷 ${label}`}
      </button>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
