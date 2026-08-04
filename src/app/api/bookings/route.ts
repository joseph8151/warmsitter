import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { createBookingSchema } from "@/lib/schemas";
import { enforceRateLimit } from "@/lib/security";
import { areBlocked } from "@/lib/blocks";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";

// List the current user's bookings (as parent or sitter).
export async function GET() {
  try {
    const user = await requireUser();
    const bookings = await prisma.booking.findMany({
      where: { OR: [{ parentId: user.id }, { sitterId: user.id }] },
      orderBy: { scheduledDate: "desc" },
      take: 100,
      include: {
        parent: { select: { id: true, name: true } },
        sitter: { select: { id: true, name: true } },
        job: { select: { id: true, title: true } },
      },
    });
    return json({ userId: user.id, bookings });
  } catch (err) {
    return handleError(err);
  }
}

// Propose a booking to a counterparty. The creator's role determines which side
// is parent vs sitter; the counterparty must be the opposite role.
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    enforceRateLimit(req, "write", user.id);
    const body = createBookingSchema.parse(await req.json());

    if (body.counterpartyId === user.id) return json({ error: "CANNOT_BOOK_SELF" }, 400);
    if (user.role !== "PARENT" && user.role !== "SITTER") {
      return json({ error: "ROLE_NOT_ALLOWED" }, 403);
    }
    if (await areBlocked(user.id, body.counterpartyId)) {
      return json({ error: "BLOCKED" }, 403);
    }

    const counterparty = await prisma.user.findUnique({
      where: { id: body.counterpartyId },
      select: { role: true },
    });
    if (!counterparty) return json({ error: "USER_NOT_FOUND" }, 404);

    // Determine parent/sitter sides from the two roles.
    const parentId = user.role === "PARENT" ? user.id : body.counterpartyId;
    const sitterId = user.role === "SITTER" ? user.id : body.counterpartyId;
    const expectedCounterRole = user.role === "PARENT" ? "SITTER" : "PARENT";
    if (counterparty.role !== expectedCounterRole) {
      return json({ error: "INVALID_COUNTERPARTY_ROLE" }, 400);
    }

    // If a job is linked, the caller must own/participate in it.
    if (body.jobId) {
      const job = await prisma.jobPost.findUnique({ where: { id: body.jobId } });
      if (!job) return json({ error: "JOB_NOT_FOUND" }, 404);
      if (job.parentId !== parentId) return json({ error: "JOB_MISMATCH" }, 403);
    }

    const booking = await prisma.booking.create({
      data: {
        jobId: body.jobId,
        parentId,
        sitterId,
        proposedById: user.id,
        scheduledDate: new Date(body.scheduledDate),
        hours: body.hours,
        hourlyRate: body.hourlyRate,
        note: body.note,
        status: "PROPOSED",
      },
    });

    await notify({
      userId: body.counterpartyId,
      type: "BOOKING_UPDATE",
      title: "새 예약 제안이 도착했어요 📅",
      body: `${user.name}님이 돌봄 일정을 제안했습니다. 확인 후 확정해주세요.`,
      link: "/bookings",
    });

    return json({ booking }, 201);
  } catch (err) {
    return handleError(err);
  }
}
