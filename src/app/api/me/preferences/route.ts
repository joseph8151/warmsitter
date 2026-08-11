import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { preferencesSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

// The current user's notification channel preferences.
export async function GET() {
  try {
    const user = await requireUser();
    return json({
      emailNotifications: user.emailNotifications,
      pushNotifications: user.pushNotifications,
    });
  } catch (err) {
    return handleError(err);
  }
}

// Update one or both channel preferences.
export async function PUT(req: Request) {
  try {
    const user = await requireUser();
    const patch = preferencesSchema.parse(await req.json());

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(patch.emailNotifications !== undefined ? { emailNotifications: patch.emailNotifications } : {}),
        ...(patch.pushNotifications !== undefined ? { pushNotifications: patch.pushNotifications } : {}),
      },
      select: { emailNotifications: true, pushNotifications: true },
    });
    return json(updated);
  } catch (err) {
    return handleError(err);
  }
}
