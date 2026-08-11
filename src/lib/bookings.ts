import { prisma } from "./prisma";
import { notify } from "./notify";
import { formatDate } from "./format";

// -----------------------------------------------------------------------------
// Cron logic for the booking lifecycle:
//  - remind both parties ~a day before a confirmed booking (once),
//  - auto-complete confirmed bookings whose scheduled time has passed.
// -----------------------------------------------------------------------------

const REMINDER_WINDOW_MS = 30 * 60 * 60 * 1000; // ~30h ahead (daily cron safe)

export async function runBookingReminders(now = new Date()): Promise<{
  reminded: number;
  completed: number;
}> {
  const soon = new Date(now.getTime() + REMINDER_WINDOW_MS);

  // 1) Upcoming confirmed bookings not yet reminded.
  const upcoming = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      reminderSentAt: null,
      scheduledDate: { gt: now, lte: soon },
    },
    take: 500,
  });

  for (const b of upcoming) {
    const when = formatDate(b.scheduledDate);
    await notify({
      userId: b.parentId,
      type: "BOOKING_UPDATE",
      title: "곧 돌봄 일정이 있어요 ⏰",
      body: `${when} 예약된 돌봄이 곧 시작돼요.`,
      link: "/bookings",
    });
    await notify({
      userId: b.sitterId,
      type: "BOOKING_UPDATE",
      title: "곧 돌봄 일정이 있어요 ⏰",
      body: `${when} 예약된 돌봄이 곧 시작돼요. 준비해주세요.`,
      link: "/bookings",
    });
    await prisma.booking.update({ where: { id: b.id }, data: { reminderSentAt: now } });
  }

  // 2) Auto-complete confirmed bookings whose time has passed.
  const past = await prisma.booking.findMany({
    where: { status: "CONFIRMED", scheduledDate: { lt: now } },
    take: 500,
  });
  for (const b of past) {
    await prisma.booking.update({ where: { id: b.id }, data: { status: "COMPLETED" } });
    await notify({
      userId: b.parentId,
      type: "BOOKING_UPDATE",
      title: "돌봄이 완료되었어요 ✅",
      body: "이용해주셔서 감사해요. 결제와 리뷰를 남겨주세요.",
      link: "/dashboard",
    });
    await notify({
      userId: b.sitterId,
      type: "BOOKING_UPDATE",
      title: "돌봄이 완료되었어요 ✅",
      body: "수고하셨어요! 근무일지와 리뷰를 확인해보세요.",
      link: "/dashboard",
    });
  }

  return { reminded: upcoming.length, completed: past.length };
}
