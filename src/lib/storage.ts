import { getSupabaseAdmin } from "./supabase/admin";
import { AVATARS_BUCKET, WORKLOGS_BUCKET, isSupabaseStorageEnabled } from "./supabase/config";

export type UploadKind = "avatar" | "worklog";

const BUCKET: Record<UploadKind, string> = {
  avatar: AVATARS_BUCKET,
  worklog: WORKLOGS_BUCKET,
};

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export class UploadError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

// Uploads an image to Supabase Storage and returns its public URL.
// Path: <kind>/<ownerId>/<timestamp>-<safeName>
export async function uploadImage(params: {
  kind: UploadKind;
  ownerId: string;
  file: File;
}): Promise<{ url: string; path: string }> {
  if (!isSupabaseStorageEnabled) {
    throw new UploadError("스토리지가 설정되지 않았습니다 (Supabase service-role key 필요).", 503);
  }
  const { kind, ownerId, file } = params;

  if (!ALLOWED.includes(file.type)) {
    throw new UploadError("이미지 파일(JPEG/PNG/WEBP/GIF)만 업로드할 수 있습니다.");
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

  const { data } = admin.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, path };
}
