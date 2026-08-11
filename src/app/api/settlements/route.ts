import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// List settlements. Sitters see their own; admins see all.
export async function GET() {
  try {
    const user = await requireUser();
    const where =
      user.role === "ADMIN" ? {} : { sitterId: user.id };
    const settlements = await prisma.settlement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { payment: true, job: true },
    });
    return json({ settlements });
  } catch (err) {
    return handleError(err);
  }
}
