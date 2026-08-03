import type { SettlementStatus } from "@prisma/client";

// Allowed settlement lifecycle transitions: PENDING -> PAID -> COMPLETED.
// PENDING may also be CANCELED. Terminal states allow nothing further.
export const SETTLEMENT_TRANSITIONS: Record<SettlementStatus, SettlementStatus[]> = {
  PENDING: ["PAID", "CANCELED"],
  PAID: ["COMPLETED"],
  COMPLETED: [],
  CANCELED: [],
};

export function canTransitionSettlement(
  from: SettlementStatus,
  to: SettlementStatus
): boolean {
  return SETTLEMENT_TRANSITIONS[from].includes(to);
}
