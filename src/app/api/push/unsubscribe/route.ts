import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({ endpoint: z.string().url() });

// Remove a Web Push subscription (called when the user turns off push).
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { endpoint } = schema.parse(await req.json());
    await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: user.id } });
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
