import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { uploadImage, UploadError, type UploadKind } from "@/lib/storage";

export const dynamic = "force-dynamic";

// Multipart upload endpoint.
//   field `kind`: "avatar" | "worklog"
//   field `file`: the image
//
// - avatar  → uploads and sets the sitter's SitterProfile.photoUrl.
// - worklog → uploads and returns the URL; the client attaches it when creating
//             the work log (POST /api/worklogs { imageUrl }).
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const form = await req.formData();
    const kind = String(form.get("kind") ?? "") as UploadKind;
    const file = form.get("file");

    if (kind !== "avatar" && kind !== "worklog") {
      throw new UploadError("잘못된 업로드 종류입니다.");
    }
    if (!(file instanceof File)) {
      throw new UploadError("파일이 없습니다.");
    }

    const { url, path } = await uploadImage({ kind, ownerId: user.id, file });

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
