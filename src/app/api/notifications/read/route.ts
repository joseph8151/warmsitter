import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";

// Mark notifications read. Body { id } marks one; empty body marks all.
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = (await req.json().catch(() => ({}))) as { id?: string };

    if (body.id) {
      await prisma.notification.updateMany({
        where: { id: body.id, userId: user.id },
        data: { read: true },
      });
    } else {
      await prisma.notification.updateMany({
        where: { userId: user.id, read: false },
        data: { read: true },
      });
    }
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
