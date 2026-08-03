import type { BillableAction } from "@prisma/client";

// Shape of a credit package as stored in PlatformSetting.creditPackages (JSON).
export interface CreditPackage {
  id: string;
  label: string;
  credits: number;
  price: number; // KRW
  bestValue?: boolean;
}

// Per-action credit cost map stored in PlatformSetting.actionCosts (JSON).
export type ActionCosts = Record<BillableAction, number>;

// Normalized, fully-typed view of the platform settings row.
export interface ResolvedSettings {
  feeRateBps: number;
  ticketPrice: number;
  ticketDurationDays: number;
  creditPackages: CreditPackage[];
  actionCosts: ActionCosts;
  premiumMonthlyPrice: number;
}

// Result of an entitlement check / deduction attempt.
export interface DeductionResult {
  ok: boolean;
  // How the action was covered.
  method: "premium" | "ticket" | "credit" | null;
  // When ok=false, the reason the UI uses to show the "buy" modal.
  reason?: "INSUFFICIENT_CREDIT";
  creditBalance: number;
  ticketExpiresAt: Date | null;
  isPremium: boolean;
  cost: number; // credits the action would cost
}
