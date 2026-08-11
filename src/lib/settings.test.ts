import { describe, expect, it } from "vitest";
import {
  computeFeeSplit,
  costForAction,
  normalize,
  DEFAULT_ACTION_COSTS,
} from "./settings";
import type { PlatformSetting } from "@prisma/client";

describe("computeFeeSplit", () => {
  it("splits a care fee at 10% (default)", () => {
    const { platformFee, sitterPayout, feeRateBps } = computeFeeSplit(60000, 1000);
    expect(platformFee).toBe(6000);
    expect(sitterPayout).toBe(54000);
    expect(feeRateBps).toBe(1000);
    expect(platformFee + sitterPayout).toBe(60000); // no money lost
  });

  it("rounds the platform fee to the nearest KRW", () => {
    // 15000 * 3 * 12.5% = 5625 -> exact; use a value that needs rounding
    const { platformFee, sitterPayout } = computeFeeSplit(12345, 1000); // 1234.5 -> 1235
    expect(platformFee).toBe(1235);
    expect(sitterPayout).toBe(12345 - 1235);
  });

  it("handles a 0% fee (sitter keeps everything)", () => {
    const { platformFee, sitterPayout } = computeFeeSplit(50000, 0);
    expect(platformFee).toBe(0);
    expect(sitterPayout).toBe(50000);
  });

  it("supports an adjusted admin fee rate (e.g. 15%)", () => {
    const { platformFee, sitterPayout } = computeFeeSplit(100000, 1500);
    expect(platformFee).toBe(15000);
    expect(sitterPayout).toBe(85000);
  });
});

describe("costForAction", () => {
  const settings = {
    feeRateBps: 1000,
    ticketPrice: 29000,
    ticketDurationDays: 30,
    creditPackages: [],
    actionCosts: { INTERVIEW_PROPOSAL: 1, ACCEPT_APPLICATION: 2, START_CHAT: 1 },
    premiumMonthlyPrice: 9900,
  };

  it("returns the configured cost per action", () => {
    expect(costForAction(settings, "ACCEPT_APPLICATION")).toBe(2);
    expect(costForAction(settings, "INTERVIEW_PROPOSAL")).toBe(1);
    expect(costForAction(settings, "START_CHAT")).toBe(1);
  });
});

describe("normalize", () => {
  it("merges defaults for missing action costs and packages", () => {
    const row = {
      feeRateBps: 1000,
      ticketPrice: 29000,
      ticketDurationDays: 30,
      creditPackages: null,
      actionCosts: { START_CHAT: 3 },
      premiumMonthlyPrice: 9900,
    } as unknown as PlatformSetting;

    const s = normalize(row);
    // custom value kept, others fall back to defaults
    expect(s.actionCosts.START_CHAT).toBe(3);
    expect(s.actionCosts.INTERVIEW_PROPOSAL).toBe(DEFAULT_ACTION_COSTS.INTERVIEW_PROPOSAL);
    // non-array creditPackages falls back to defaults
    expect(Array.isArray(s.creditPackages)).toBe(true);
    expect(s.creditPackages.length).toBeGreaterThan(0);
  });
});
