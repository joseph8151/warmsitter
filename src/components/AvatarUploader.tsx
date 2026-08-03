"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageUploader } from "./ImageUploader";

// Sitter profile photo: shows the current avatar and lets the sitter replace it.
// Uploading also persists the URL to SitterProfile.photoUrl server-side.
export function AvatarUploader({ initialUrl, name }: { initialUrl: string | null; name: string }) {
  const [url, setUrl] = useState<string | null>(initialUrl);

  return (
    <div className="flex items-center gap-4">
      <div className="relative grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-sky-100 text-3xl">
        {url ? (
          <Image src={url} alt={name} fill sizes="80px" className="object-cover" />
        ) : (
          <span>{name.charAt(0)}</span>
        )}
      </div>
      <div>
        <ImageUploader kind="avatar" label="프로필 사진 변경" onUploaded={setUrl} />
        <p className="mt-1 text-xs text-slate-400">JPEG/PNG/WEBP · 최대 5MB</p>
      </div>
    </div>
  );
}
