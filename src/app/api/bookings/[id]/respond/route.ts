import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { bookingRespondSchema } from "@/lib/schemas";
import { notify } from "@/lib/notify";

// The counterparty (whoever did NOT propose) confirms or declines a booking.
// On CONFIRM, the linked job (if any) gets the agreed rate/hours + matched
// sitter so the existing payment flow can charge it.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const { action } = bookingRespondSchema.parse(await req.json());

    const booking = await prisma.booking.findUnique({ where: { id: params.id } });
    if (!booking) return json({ error: "NOT_FOUND" }, 404);
    if (booking.parentId !== user.id && booking.sitterId !== user.id) {
      return json({ error: "FORBIDDEN" }, 403);
    }
    if (booking.proposedById === user.id) {
      return json({ error: "PROPOSER_CANNOT_RESPOND" }, 403);
    }
    if (booking.status !== "PROPOSED") {
      return json({ error: "ALREADY_RESPONDED", status: booking.status }, 409);
    }

    if (action === "DECLINE") {
      const updated = await prisma.booking.update({
        where: { id: booking.id },
        data: { status: "DECLINED" },
      });
      await notify({
        userId: booking.proposedById,
        type: "BOOKING_UPDATE",
        title: "예약 제안이 거절되었어요",
        body: `${user.name}님이 예약을 거절했습니다.`,
        link: "/bookings",
      });
      return json({ booking: updated });
    }

    // CONFIRM
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CONFIRMED" },
    });
    if (booking.jobId) {
      await prisma.jobPost.update({
        where: { id: booking.jobId },
        data: {
          status: "MATCHED",
          matchedSitterId: booking.sitterId,
          agreedRate: booking.hourlyRate,
          agreedHours: booking.hours,
        },
      });
    }
    await notify({
      userId: booking.proposedById,
      type: "BOOKING_UPDATE",
      title: "예약이 확정되었어요 🎉",
      body: `${user.name}님이 예약을 확정했습니다.`,
      link: "/bookings",
    });
    return json({ booking: updated });
  } catch (err) {
    return handleError(err);
  }
}
