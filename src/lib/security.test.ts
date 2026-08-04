import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./security";

describe("createRateLimiter (fixed window)", () => {
  it("allows up to the limit, then blocks", () => {
    const hit = createRateLimiter(3, 60_000);
    const t = 1_000_000;
    expect(hit("ip", t).ok).toBe(true);
    expect(hit("ip", t).ok).toBe(true);
    expect(hit("ip", t).ok).toBe(true);
    const blocked = hit("ip", t);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("tracks keys independently", () => {
    const hit = createRateLimiter(1, 60_000);
    const t = 1_000_000;
    expect(hit("a", t).ok).toBe(true);
    expect(hit("b", t).ok).toBe(true); // different key, own budget
    expect(hit("a", t).ok).toBe(false);
  });

  it("resets after the window elapses", () => {
    const hit = createRateLimiter(1, 60_000);
    const t = 1_000_000;
    expect(hit("ip", t).ok).toBe(true);
    expect(hit("ip", t + 1000).ok).toBe(false); // still in window
    expect(hit("ip", t + 60_001).ok).toBe(true); // window passed
  });
});
