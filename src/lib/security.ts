import { isSupabaseAuthEnabled } from "./supabase/config";

// -----------------------------------------------------------------------------
// Lightweight, dependency-free security helpers.
//
// NOTE: the rate limiter is in-memory (per server instance). It's a solid
// baseline against bursty abuse, but in a multi-instance/serverless deploy you
// should back it with a shared store (e.g. Upstash Redis) for global limits.
// -----------------------------------------------------------------------------

export class RateLimitError extends Error {
  retryAfterSeconds: number;
  constructor(retryAfterSeconds: number) {
    super("요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

interface Bucket {
  count: number;
  resetAt: number;
}

// A fixed-window limiter factory. Returns a function that records a hit for a
// key and reports whether it's within the limit.
export function createRateLimiter(limit: number, windowMs: number) {
  const buckets = new Map<string, Bucket>();

  return function hit(key: string, now: number = Date.now()) {
    const existing = buckets.get(key);
    if (!existing || now >= existing.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
    }
    existing.count += 1;
    if (existing.count > limit) {
      return {
        ok: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      };
    }
    return { ok: true, remaining: limit - existing.count, retryAfterSeconds: 0 };
  };
}

// Named limiters for sensitive endpoints. Tune per-route.
const limiters: Record<string, ReturnType<typeof createRateLimiter>> = {
  auth: createRateLimiter(10, 60_000), // 10/min — login attempts
  upload: createRateLimiter(20, 60_000), // 20/min — file uploads
  billable: createRateLimiter(30, 60_000), // 30/min — paid actions
  write: createRateLimiter(60, 60_000), // 60/min — general writes
};

// Best-effort client IP from proxy headers (Vercel sets x-forwarded-for).
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

// Enforce a named rate limit; throws RateLimitError (-> 429) when exceeded.
export function enforceRateLimit(
  req: Request,
  name: keyof typeof limiters,
  subject?: string
): void {
  const limiter = limiters[name];
  const key = `${name}:${subject ?? clientIp(req)}`;
  const result = limiter(key);
  if (!result.ok) throw new RateLimitError(result.retryAfterSeconds);
}

// Demo login (impersonate any user) is a development-only convenience. It must
// NOT be reachable in production unless explicitly opted in — otherwise it's a
// full account-takeover hole.
export function isDemoLoginAllowed(): boolean {
  if (process.env.ALLOW_DEMO_LOGIN === "true") return true;
  return process.env.NODE_ENV !== "production" && !isSupabaseAuthEnabled;
}
