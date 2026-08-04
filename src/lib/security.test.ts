import { afterEach, describe, expect, it, vi } from "vitest";
import { createRateLimiter, isDemoLoginAllowed } from "./security";

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

// The demo `ws_uid` cookie lets a request name any user by id — getCurrentUser()
// only trusts it when this gate is open. It MUST be closed in production unless
// explicitly opted in, or it becomes a full account-takeover hole.
describe("isDemoLoginAllowed", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is closed in production unless explicitly opted in", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ALLOW_DEMO_LOGIN", "");
    expect(isDemoLoginAllowed()).toBe(false);
  });

  it("opens when ALLOW_DEMO_LOGIN=true even in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ALLOW_DEMO_LOGIN", "true");
    expect(isDemoLoginAllowed()).toBe(true);
  });

  it("is open in non-production without Supabase (local dev)", () => {
    // In the test runtime Supabase is unconfigured, so a non-prod env allows demo.
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ALLOW_DEMO_LOGIN", "");
    expect(isDemoLoginAllowed()).toBe(true);
  });
});
