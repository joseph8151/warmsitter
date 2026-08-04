import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { uploadFile, UploadError, type UploadKind } from "@/lib/storage";
import { enforceRateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

const VALID_KINDS: UploadKind[] = ["avatar", "worklog", "verification"];

// Multipart upload endpoint.
//   field `kind`: "avatar" | "worklog" | "verification"
//   field `file`: the image (verification also accepts PDF)
//
// - avatar       → uploads and sets the sitter's SitterProfile.photoUrl.
// - worklog      → returns the URL; the client attaches it when creating the
//                  work log (POST /api/worklogs { imageUrl }).
// - verification → uploads to the private bucket; returns { path } which the
//                  client submits to POST /api/verification.
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    enforceRateLimit(req, "upload", user.id);
    const form = await req.formData();
    const kind = String(form.get("kind") ?? "") as UploadKind;
    const file = form.get("file");

    if (!VALID_KINDS.includes(kind)) {
      throw new UploadError("잘못된 업로드 종류입니다.");
    }
    if (!(file instanceof File)) {
      throw new UploadError("파일이 없습니다.");
    }

    const { url, path } = await uploadFile({ kind, ownerId: user.id, file });

    if (kind === "avatar") {
      await prisma.sitterProfile.update({
        where: { userId: user.id },
        data: { photoUrl: url },
      });
    }

    return json({ url, path });
  } catch (err) {
    return handleError(err);
  }
}
