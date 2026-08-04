import { cookies } from "next/headers";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, isDemoLoginAllowed } from "@/lib/security";

// Demo-only login: set the ws_uid cookie to the chosen user. Hard-disabled in
// production (and whenever real Supabase auth is configured) to prevent account
// takeover — see isDemoLoginAllowed().
export async function POST(req: Request) {
  try {
    if (!isDemoLoginAllowed()) return json({ error: "DISABLED" }, 403);
    enforceRateLimit(req, "auth");

    const { userId } = (await req.json()) as { userId?: string };
    if (!userId) return json({ error: "MISSING_USER" }, 400);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return json({ error: "NOT_FOUND" }, 404);

    cookies().set("ws_uid", user.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return json({ ok: true, user: { id: user.id, name: user.name, role: user.role } });
  } catch (err) {
    return handleError(err);
  }
}
