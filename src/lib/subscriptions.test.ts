import { describe, expect, it } from "vitest";
import { computeNextPeriod, MONTH_MS } from "./subscriptions";

describe("computeNextPeriod", () => {
  const periodEnd = new Date("2026-08-31T00:00:00Z");

  it("first charge starts now and runs ~30 days", () => {
    const now = new Date("2026-08-03T00:00:00Z");
    const { periodStart, periodEnd: end } = computeNextPeriod(now, now, true);
    expect(periodStart.getTime()).toBe(now.getTime());
    expect(end.getTime()).toBe(now.getTime() + MONTH_MS);
  });

  it("on-time renewal extends from the current period end (no lost days)", () => {
    const now = new Date("2026-08-31T00:00:00Z");
    const { periodStart, periodEnd: end } = computeNextPeriod(periodEnd, now, false);
    expect(periodStart.getTime()).toBe(periodEnd.getTime());
    expect(end.getTime()).toBe(periodEnd.getTime() + MONTH_MS);
  });

  it("late renewal still anchors to period end (no lost days, no drift)", () => {
    // Cron ran 5 days late — the new period end must be periodEnd + 30d,
    // so the member is not shortchanged and charges don't drift later.
    const now = new Date("2026-09-05T00:00:00Z");
    const { periodStart, periodEnd: end } = computeNextPeriod(periodEnd, now, false);
    expect(periodStart.getTime()).toBe(periodEnd.getTime());
    expect(end.getTime()).toBe(periodEnd.getTime() + MONTH_MS);
  });
});
