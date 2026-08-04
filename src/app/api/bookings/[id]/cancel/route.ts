import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

// Either party cancels a PROPOSED or CONFIRMED booking.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const booking = await prisma.booking.findUnique({ where: { id: params.id } });
    if (!booking) return json({ error: "NOT_FOUND" }, 404);
    if (booking.parentId !== user.id && booking.sitterId !== user.id) {
      return json({ error: "FORBIDDEN" }, 403);
    }
    if (booking.status !== "PROPOSED" && booking.status !== "CONFIRMED") {
      return json({ error: "NOT_CANCELABLE", status: booking.status }, 409);
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CANCELED" },
    });

    const otherId = booking.parentId === user.id ? booking.sitterId : booking.parentId;
    await notify({
      userId: otherId,
      type: "BOOKING_UPDATE",
      title: "예약이 취소되었어요",
      body: `${user.name}님이 예약을 취소했습니다.`,
      link: "/bookings",
    });

    return json({ booking: updated });
  } catch (err) {
    return handleError(err);
  }
}
