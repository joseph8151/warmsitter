import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// List recent notifications + unread count for the bell.
export async function GET() {
  try {
    const user = await requireUser();
    const [items, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.notification.count({ where: { userId: user.id, read: false } }),
    ]);
    return json({ items, unread });
  } catch (err) {
    return handleError(err);
  }
}
