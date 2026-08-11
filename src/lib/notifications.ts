import { prisma } from "./prisma";
import { hasActiveTicket } from "./billing";
import { notify } from "./notify";

// -----------------------------------------------------------------------------
// Ticket / subscription expiry notification logic.
//
// `getExpiryStatus` powers the in-app banner. `runExpiryNotifications` is meant
// to be called by a daily cron (e.g. Vercel Cron / a scheduled job) to email or
// push users whose pass or subscription is about to lapse.
// -----------------------------------------------------------------------------

export type ExpiryLevel = "none" | "expiring_soon" | "expired";

export interface ExpiryStatus {
  ticket: {
    level: ExpiryLevel;
    expiresAt: Date | null;
    daysLeft: number | null;
  };
  subscription: {
    level: ExpiryLevel;
    currentPeriodEnd: Date | null;
    daysLeft: number | null;
  };
}

const SOON_DAYS = 3;

function daysBetween(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
}

export async function getExpiryStatus(userId: string, now = new Date()): Promise<ExpiryStatus> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { subscription: true },
  });

  const ticket = ((): ExpiryStatus["ticket"] => {
    const exp = user.ticketExpiresAt;
    if (!exp) return { level: "none", expiresAt: null, daysLeft: null };
    if (!hasActiveTicket(user, now)) return { level: "expired", expiresAt: exp, daysLeft: 0 };
    const daysLeft = daysBetween(now, exp);
    return {
      level: daysLeft <= SOON_DAYS ? "expiring_soon" : "none",
      expiresAt: exp,
      daysLeft,
    };
  })();

  const subscription = ((): ExpiryStatus["subscription"] => {
    const sub = user.subscription;
    if (!sub || sub.status === "CANCELED" || sub.status === "EXPIRED") {
      return { level: sub ? "expired" : "none", currentPeriodEnd: sub?.currentPeriodEnd ?? null, daysLeft: null };
    }
    const daysLeft = daysBetween(now, sub.currentPeriodEnd);
    return {
      level: daysLeft <= SOON_DAYS && sub.cancelAtPeriodEnd ? "expiring_soon" : "none",
      currentPeriodEnd: sub.currentPeriodEnd,
      daysLeft,
    };
  })();

  return { ticket, subscription };
}

// Cron entrypoint: find users whose pass expires within SOON_DAYS (or already
// lapsed today) and dispatch a reminder. Returns the notifications it would send.
export async function runExpiryNotifications(now = new Date()): Promise<
  Array<{ userId: string; email: string; kind: "ticket_expiring" | "ticket_expired" }>
> {
  const soon = new Date(now.getTime() + SOON_DAYS * 24 * 60 * 60 * 1000);

  // Expiring soon (still active, within the window).
  const expiringSoon = await prisma.user.findMany({
    where: { ticketExpiresAt: { gt: now, lte: soon } },
    select: { id: true, email: true },
  });

  // Just expired today — flip any stale ACTIVE tickets to EXPIRED as a side effect.
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const justExpired = await prisma.user.findMany({
    where: { ticketExpiresAt: { gt: startOfDay, lte: now } },
    select: { id: true, email: true },
  });
  await prisma.ticket.updateMany({
    where: { status: "ACTIVE", expiresAt: { lte: now } },
    data: { status: "EXPIRED" },
  });

  const out = [
    ...expiringSoon.map((u) => ({ userId: u.id, email: u.email, kind: "ticket_expiring" as const })),
    ...justExpired.map((u) => ({ userId: u.id, email: u.email, kind: "ticket_expired" as const })),
  ];

  for (const n of out) {
    // In-app notification (also fans out to push + email via notify()).
    await notify({
      userId: n.userId,
      type: "TICKET_EXPIRING",
      title: n.kind === "ticket_expiring" ? "이용권이 곧 만료돼요 ⏳" : "이용권이 만료되었어요",
      body:
        n.kind === "ticket_expiring"
          ? "기간이 곧 끝나요. 연장하고 무제한 이용을 이어가세요."
          : "이용권이 만료되었습니다. 다시 구매하면 계속 이용할 수 있어요.",
      link: "/pricing",
    });
  }
  return out;
}
