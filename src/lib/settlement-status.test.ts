import { describe, expect, it } from "vitest";
import { canTransitionSettlement } from "./settlement-status";

describe("canTransitionSettlement", () => {
  it("allows the happy path PENDING -> PAID -> COMPLETED", () => {
    expect(canTransitionSettlement("PENDING", "PAID")).toBe(true);
    expect(canTransitionSettlement("PAID", "COMPLETED")).toBe(true);
  });

  it("allows canceling only from PENDING", () => {
    expect(canTransitionSettlement("PENDING", "CANCELED")).toBe(true);
    expect(canTransitionSettlement("PAID", "CANCELED")).toBe(false);
  });

  it("forbids skipping PAID (no PENDING -> COMPLETED)", () => {
    expect(canTransitionSettlement("PENDING", "COMPLETED")).toBe(false);
  });

  it("forbids leaving terminal states (double payout guard)", () => {
    expect(canTransitionSettlement("COMPLETED", "PAID")).toBe(false);
    expect(canTransitionSettlement("COMPLETED", "COMPLETED")).toBe(false);
    expect(canTransitionSettlement("CANCELED", "PAID")).toBe(false);
  });
});
