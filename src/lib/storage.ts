import { getSupabaseAdmin } from "./supabase/admin";
import {
  AVATARS_BUCKET,
  VERIFICATIONS_BUCKET,
  WORKLOGS_BUCKET,
  isSupabaseStorageEnabled,
} from "./supabase/config";

export type UploadKind = "avatar" | "worklog" | "verification";

const BUCKET: Record<UploadKind, string> = {
  avatar: AVATARS_BUCKET,
  worklog: WORKLOGS_BUCKET,
  verification: VERIFICATIONS_BUCKET,
};

// Identity docs live in a PRIVATE bucket; the caller stores the path and views
// it later via a signed URL. Public kinds return a permanent public URL.
const IS_PRIVATE: Record<UploadKind, boolean> = {
  avatar: false,
  worklog: false,
  verification: true,
};

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
// Verification also accepts PDFs.
const DOC_TYPES = [...IMAGE_TYPES, "application/pdf"];

export class UploadError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Uploads a file to Supabase Storage.
 * Returns `path` always; `url` is a public URL for public kinds, or a signed
 * (1h) URL for private kinds.
 */
export async function uploadFile(params: {
  kind: UploadKind;
  ownerId: string;
  file: File;
}): Promise<{ url: string; path: string }> {
  if (!isSupabaseStorageEnabled) {
    throw new UploadError("스토리지가 설정되지 않았습니다 (Supabase service-role key 필요).", 503);
  }
  const { kind, ownerId, file } = params;
  const allowed = kind === "verification" ? DOC_TYPES : IMAGE_TYPES;

  if (!allowed.includes(file.type)) {
    throw new UploadError(
      kind === "verification"
        ? "이미지 또는 PDF 파일만 업로드할 수 있습니다."
        : "이미지 파일(JPEG/PNG/WEBP/GIF)만 업로드할 수 있습니다."
    );
  }
  if (file.size > MAX_BYTES) {
    throw new UploadError("파일이 너무 큽니다 (최대 5MB).");
  }

  const bucket = BUCKET[kind];
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const path = `${ownerId}/${Date.now()}-${safeName}`;

  const admin = getSupabaseAdmin();
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error } = await admin.storage.from(bucket).upload(path, bytes, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new UploadError(`업로드 실패: ${error.message}`, 502);

  if (IS_PRIVATE[kind]) {
    const url = await signedUrl(kind, path);
    return { url, path };
  }
  const { data } = admin.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

// Back-compat alias (previous name).
export const uploadImage = uploadFile;

// Create a short-lived signed URL for a private object (e.g. an ID document).
export async function signedUrl(
  kind: UploadKind,
  path: string,
  expiresInSeconds = 3600
): Promise<string> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.storage
    .from(BUCKET[kind])
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data) throw new UploadError(`서명 URL 생성 실패: ${error?.message ?? ""}`, 502);
  return data.signedUrl;
}
