import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/security";
import { z } from "zod";

const schema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

// Save (or refresh) a Web Push subscription for the current user.
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    enforceRateLimit(req, "write", user.id);
    const { endpoint, keys } = schema.parse(await req.json());

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: { userId: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
      update: { userId: user.id, p256dh: keys.p256dh, auth: keys.auth },
    });

    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
