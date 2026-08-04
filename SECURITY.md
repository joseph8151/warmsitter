# Security

warm sitter handles personal data (contact info, sitter ID documents, payment
records), so security is built in. This documents what's in place and what you
must configure before going live.

## Built-in protections

### HTTP hardening (`next.config.mjs`)
- **Content-Security-Policy** — restricts scripts/styles/connections to `self`
  plus exactly the third parties used (Toss Payments SDK, Supabase REST +
  Realtime websockets). Blocks most XSS injection vectors.
- **X-Frame-Options: DENY** + `frame-ancestors 'none'` — clickjacking protection.
- **X-Content-Type-Options: nosniff**, **Referrer-Policy**, **Permissions-Policy**
  (camera/mic/geolocation disabled), **HSTS** (`Strict-Transport-Security`),
  `poweredByHeader: false`.

### CSRF (`src/middleware.ts`)
- Cookie-authenticated mutating API requests (`POST/PUT/PATCH/DELETE` to `/api/*`)
  must be same-origin (Origin header check). The Toss webhook is exempt because
  it's authenticated by signature instead.

### Rate limiting (`src/lib/security.ts`)
- Fixed-window limiter on sensitive endpoints: login (10/min), uploads (20/min),
  billable actions (30/min), writes (60/min). Returns `429` with `Retry-After`.
- ⚠️ In-memory (per instance). For multi-instance/serverless, back it with a
  shared store (e.g. Upstash Redis) for a global limit.

### AuthN / AuthZ
- Real auth via **Supabase** (`src/lib/auth.ts`); JIT user provisioning.
- **Demo login is hard-disabled** in production and whenever Supabase is
  configured (`isDemoLoginAllowed()`), so it can't be used for account takeover.
  This gate covers **both** the demo-login route *and* the consumption of the
  `ws_uid` cookie in `getCurrentUser()` — when real auth is enabled the cookie is
  never trusted, so a request can't impersonate an account by naming its id.
- **Roles are never trusted from `user_metadata`** (which the user can write via
  `supabase.auth.updateUser`). Self-provisioning is clamped to `PARENT`/`SITTER`;
  `ADMIN` is only assignable out-of-band (seed / DB). This closes a privilege-
  escalation-to-admin path.
- Per-resource ownership checks: chat membership, job ownership, sitter-only /
  admin-only routes, settlement transitions (`canTransitionSettlement`), and
  **review authorization** (only a job's parties may review the counterparty, and
  only after the job is `COMPLETED`) to prevent rating fraud.

### Payments
- Toss confirm verifies the amount matches the created order (anti-tampering).
- Webhook signature is verified (HMAC) before acting; fulfillment is idempotent.
- Fee split is computed server-side; clients never set payout amounts.

### Data handling
- Identity documents go to a **private** Supabase Storage bucket; admins view
  them via short-lived **signed URLs** (never public).
- Service-role key is server-only; never exposed to the browser.
- Input validation with **zod** on API routes.
- Secrets are read from env; none are committed (`.env` is gitignored).

## Before you go live — checklist
- [ ] Configure Supabase auth (disables demo login automatically).
- [ ] Set strong, unique `TOSS_*`, `SUPABASE_*`, `VAPID_*`, `CRON_SECRET` secrets.
- [ ] Enable Row Level Security on Supabase tables if you query them directly.
- [ ] Put rate limiting on a shared store (Redis) for multi-instance deploys.
- [ ] Serve over HTTPS only (Vercel does; HSTS is preset).
- [ ] Review and tighten the CSP if you add third-party scripts.
- [ ] Run `npm audit` and patch high/critical advisories.
- [ ] Replace the demo auth stub entirely; confirm `ALLOW_DEMO_LOGIN` is unset.

## Reporting
Found a vulnerability? Email the maintainer privately rather than opening a
public issue.
