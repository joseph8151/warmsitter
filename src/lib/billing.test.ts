import { describe, expect, it } from "vitest";
import { hasActiveTicket } from "./billing";

describe("hasActiveTicket", () => {
  const now = new Date("2026-08-03T00:00:00Z");

  it("is false when there is no ticket", () => {
    expect(hasActiveTicket({ ticketExpiresAt: null }, now)).toBe(false);
  });

  it("is false when the ticket has expired", () => {
    expect(hasActiveTicket({ ticketExpiresAt: new Date("2026-08-01T00:00:00Z") }, now)).toBe(false);
  });

  it("is true when the ticket is still valid", () => {
    expect(hasActiveTicket({ ticketExpiresAt: new Date("2026-08-30T00:00:00Z") }, now)).toBe(true);
  });

  it("is false exactly at expiry (strictly greater than now)", () => {
    expect(hasActiveTicket({ ticketExpiresAt: now }, now)).toBe(false);
  });
});
