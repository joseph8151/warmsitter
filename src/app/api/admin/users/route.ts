import { requireRole } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import type { Prisma, UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

// Admin: search/list users (by name or email), filter by role, paginated.
export async function GET(req: Request) {
  try {
    await requireRole(["ADMIN"]);
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const role = url.searchParams.get("role") ?? "";
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);

    const where: Prisma.UserWhereInput = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }
    if (role === "PARENT" || role === "SITTER" || role === "ADMIN") {
      where.role = role as UserRole;
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          suspended: true,
          createdAt: true,
        },
      }),
    ]);

    return json({ users, total, page, pageSize: PAGE_SIZE });
  } catch (err) {
    return handleError(err);
  }
}
