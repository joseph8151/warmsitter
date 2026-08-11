import type { BillableAction, PlatformSetting } from "@prisma/client";
import { prisma } from "./prisma";
import type {
  ActionCosts,
  CreditPackage,
  ResolvedSettings,
} from "./types";

// Defaults used to seed / backfill the singleton settings row.
export const DEFAULT_CREDIT_PACKAGES: CreditPackage[] = [
  { id: "starter", label: "Starter · 5 credits", credits: 5, price: 9900 },
  { id: "family", label: "Family · 12 credits", credits: 12, price: 19900, bestValue: true },
  { id: "plus", label: "Plus · 30 credits", credits: 30, price: 39900 },
];

export const DEFAULT_ACTION_COSTS: ActionCosts = {
  INTERVIEW_PROPOSAL: 1,
  ACCEPT_APPLICATION: 2,
  START_CHAT: 1,
};

// Read the singleton settings row, creating it with defaults on first use.
export async function getSettings(): Promise<ResolvedSettings> {
  let row = await prisma.platformSetting.findUnique({ where: { id: "singleton" } });
  if (!row) {
    row = await prisma.platformSetting.create({
      data: {
        id: "singleton",
        creditPackages: DEFAULT_CREDIT_PACKAGES as unknown as object,
        actionCosts: DEFAULT_ACTION_COSTS as unknown as object,
      },
    });
  }
  return normalize(row);
}

export function normalize(row: PlatformSetting): ResolvedSettings {
  const creditPackages = Array.isArray(row.creditPackages)
    ? (row.creditPackages as unknown as CreditPackage[])
    : DEFAULT_CREDIT_PACKAGES;
  const actionCosts = {
    ...DEFAULT_ACTION_COSTS,
    ...((row.actionCosts as unknown as Partial<ActionCosts>) ?? {}),
  } as ActionCosts;

  return {
    feeRateBps: row.feeRateBps,
    ticketPrice: row.ticketPrice,
    ticketDurationDays: row.ticketDurationDays,
    creditPackages,
    actionCosts,
    premiumMonthlyPrice: row.premiumMonthlyPrice,
  };
}

export function costForAction(
  settings: ResolvedSettings,
  action: BillableAction
): number {
  return settings.actionCosts[action] ?? 1;
}

// Compute the platform-fee split for a care payment.
export function computeFeeSplit(careFee: number, feeRateBps: number) {
  const platformFee = Math.round((careFee * feeRateBps) / 10000);
  const sitterPayout = careFee - platformFee;
  return { platformFee, sitterPayout, feeRateBps };
}
