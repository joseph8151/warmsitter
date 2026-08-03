import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { createJobSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

// List open jobs (newest first).
export async function GET() {
  try {
    const jobs = await prisma.jobPost.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { applications: true } },
      },
      take: 50,
    });
    return json({ jobs });
  } catch (err) {
    return handleError(err);
  }
}

// Step 1 (parent side): create a job post. Free — no deduction.
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (user.role !== "PARENT") return json({ error: "PARENT_ONLY" }, 403);
    const body = createJobSchema.parse(await req.json());

    const job = await prisma.jobPost.create({
      data: {
        parentId: user.id,
        title: body.title,
        description: body.description,
        city: body.city,
        hoursPerSession: body.hoursPerSession ?? 3,
        status: "OPEN",
      },
    });
    return json({ job }, 201);
  } catch (err) {
    return handleError(err);
  }
}
