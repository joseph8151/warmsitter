import {
  BillableAction,
  Prisma,
  type PrismaClient,
  type User,
} from "@prisma/client";
import { prisma } from "./prisma";
import { costForAction, getSettings } from "./settings";
import type { DeductionResult } from "./types";

type Tx = Prisma.TransactionClient | PrismaClient;

/** Is the user's 30-day pass currently valid? */
export function hasActiveTicket(user: Pick<User, "ticketExpiresAt">, now = new Date()): boolean {
  return !!user.ticketExpiresAt && user.ticketExpiresAt.getTime() > now.getTime();
}

/**
 * Non-mutating check: would this user be able to perform `action`?
 * Order of coverage: premium subscriber -> active ticket -> credits.
 */
export async function checkEntitlement(
  user: User,
  action: BillableAction
): Promise<DeductionResult> {
  const settings = await getSettings();
  const cost = costForAction(settings, action);

  const base = {
    creditBalance: user.creditBalance,
    ticketExpiresAt: user.ticketExpiresAt,
    isPremium: user.isPremium,
    cost,
  };

  if (user.isPremium) return { ok: true, method: "premium", ...base };
  if (hasActiveTicket(user)) return { ok: true, method: "ticket", ...base };
  if (user.creditBalance >= cost) return { ok: true, method: "credit", ...base };

  return { ok: false, method: null, reason: "INSUFFICIENT_CREDIT", ...base };
}

/**
 * Atomically deduct for a billable action.
 *
 * - Premium subscribers and active-ticket holders pass through with NO credit
 *   change (but we still record a zero-amount audit row for tickets/premium so
 *   the action is idempotent).
 * - Credit users are charged `cost` credits.
 * - Idempotent per (user, action, refType, refId): re-running does not double-charge.
 *
 * Throws `InsufficientCreditError` when the user cannot cover the action, which
 * the API layer maps to a 402 the frontend uses to open the purchase modal.
 */
export async function deductForAction(params: {
  userId: string;
  action: BillableAction;
  refType: string;
  refId: string;
  reason?: string;
}): Promise<DeductionResult> {
  const { userId, action, refType, refId, reason } = params;
  const settings = await getSettings();
  const cost = costForAction(settings, action);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });

    // Idempotency: if we already recorded a SPEND (or pass-through) for this
    // exact reference, return success without charging again.
    const existing = await tx.creditTransaction.findUnique({
      where: {
        userId_action_refType_refId: { userId, action, refType, refId },
      },
    });
    if (existing) {
      return entitlementSnapshot(user, "credit", cost, true);
    }

    // Premium bypass — unlimited, no deduction.
    if (user.isPremium) {
      await recordPassThrough(tx, { userId, action, refType, refId, reason, balance: user.creditBalance });
      return entitlementSnapshot(user, "premium", cost, true);
    }

    // Active ticket — unlimited within the 30-day window, no deduction.
    if (hasActiveTicket(user)) {
      await recordPassThrough(tx, { userId, action, refType, refId, reason, balance: user.creditBalance });
      return entitlementSnapshot(user, "ticket", cost, true);
    }

    // Credit path — must have enough.
    if (user.creditBalance < cost) {
      throw new InsufficientCreditError(cost, user.creditBalance);
    }

    const balanceAfter = user.creditBalance - cost;
    const updated = await tx.user.update({
      where: { id: userId },
      data: { creditBalance: balanceAfter },
    });
    await tx.creditTransaction.create({
      data: {
        userId,
        type: "SPEND",
        amount: -cost,
        balanceAfter,
        action,
        refType,
        refId,
        reason,
      },
    });

    return entitlementSnapshot(updated, "credit", cost, false);
  });
}

// Record a zero-credit audit row so ticket/premium actions are idempotent too.
async function recordPassThrough(
  tx: Tx,
  args: { userId: string; action: BillableAction; refType: string; refId: string; reason?: string; balance: number }
) {
  await tx.creditTransaction.create({
    data: {
      userId: args.userId,
      type: "ADJUSTMENT",
      amount: 0,
      balanceAfter: args.balance,
      action: args.action,
      refType: args.refType,
      refId: args.refId,
      reason: args.reason ?? "covered by ticket/premium",
    },
  });
}

function entitlementSnapshot(
  user: User,
  method: DeductionResult["method"],
  cost: number,
  alreadyCharged: boolean
): DeductionResult {
  return {
    ok: true,
    method,
    creditBalance: user.creditBalance,
    ticketExpiresAt: user.ticketExpiresAt,
    isPremium: user.isPremium,
    cost: alreadyCharged ? 0 : cost,
  };
}

/** Add credits (purchase / refund / admin adjustment) with an audit row. */
export async function addCredits(params: {
  userId: string;
  amount: number; // positive
  type: "PURCHASE" | "REFUND" | "ADJUSTMENT";
  reason?: string;
  paymentId?: string;
  tx?: Tx;
}): Promise<number> {
  const run = async (client: Tx) => {
    const user = await client.user.update({
      where: { id: params.userId },
      data: { creditBalance: { increment: params.amount } },
    });
    await client.creditTransaction.create({
      data: {
        userId: params.userId,
        type: params.type,
        amount: params.amount,
        balanceAfter: user.creditBalance,
        reason: params.reason,
        paymentId: params.paymentId,
      },
    });
    return user.creditBalance;
  };
  return params.tx ? run(params.tx) : prisma.$transaction(run);
}

/** Grant / extend a 30-day pass. Stacks onto an existing active ticket. */
export async function grantTicket(params: {
  userId: string;
  durationDays: number;
  pricePaid: number;
  paymentId?: string;
  tx?: Tx;
}): Promise<Date> {
  const run = async (client: Tx) => {
    const user = await client.user.findUniqueOrThrow({ where: { id: params.userId } });
    const now = new Date();
    const base = hasActiveTicket(user, now) ? user.ticketExpiresAt! : now;
    const expiresAt = new Date(base.getTime() + params.durationDays * 24 * 60 * 60 * 1000);

    await client.ticket.create({
      data: {
        userId: params.userId,
        startsAt: now,
        expiresAt,
        pricePaid: params.pricePaid,
        paymentId: params.paymentId,
      },
    });
    await client.user.update({
      where: { id: params.userId },
      data: { ticketExpiresAt: expiresAt },
    });
    return expiresAt;
  };
  return params.tx ? run(params.tx) : prisma.$transaction(run);
}

export class InsufficientCreditError extends Error {
  cost: number;
  balance: number;
  constructor(cost: number, balance: number) {
    super("이용권이 부족합니다");
    this.name = "InsufficientCreditError";
    this.cost = cost;
    this.balance = balance;
  }
}
