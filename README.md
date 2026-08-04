# warm sitter ☀️

A babysitter matching platform (US-style, sky-blue) with a **hybrid revenue model**:
tickets/credits, transaction fees, and premium subscriptions — built on Next.js 14
(App Router) + TypeScript + Prisma + Tailwind, with **Toss Payments** integration.

> Free to search — pay only when you connect.

---

## The hybrid revenue model

### 1) Tickets / Credits
- Parents buy a **30-day pass** (`Ticket`) or a **credit package** (`CreditTransaction`).
- Credits/tickets are **spent on billable actions**:
  - `INTERVIEW_PROPOSAL` — propose an interview to a sitter
  - `ACCEPT_APPLICATION` — accept a sitter's application
  - `START_CHAT` — start the first chat with a sitter
- Balances live directly on the `User` model: `creditBalance`, `ticketExpiresAt`, `isPremium`.
- Coverage order: **premium → active ticket → credits**. A ticket holder inside the
  30-day window and a premium member pay **no per-action deduction**.
- Expiry reminders: `src/lib/notifications.ts` powers the in-app banner and a daily
  cron (`/api/cron/expiry`, wired in `vercel.json`).

### 2) Transaction fee
- When a parent pays for confirmed care, the **platform fee** (default **10%**, admin-
  adjustable) is auto-deducted.
- `sitter payout = agreed hourly rate × hours − platform fee`.
- Split is computed in `computeFeeSplit()` and stored on the `Payment`; a `Settlement`
  is created on success with lifecycle **`pending → paid → completed`**.

### 3) Premium subscription (optional)
- Monthly plan: **unlimited proposals + priority badge + perks**.
- Subscribers bypass all deductions (`user.isPremium`).
- **Recurring billing via Toss billing keys**: the billing-auth widget registers a
  card → `issueBillingKey` exchanges the authKey for a durable `billingKey` →
  `chargeAndExtend` charges the first month and activates. A daily cron
  (`/api/cron/subscriptions`) renews due subscriptions and expires canceled ones
  (`src/lib/subscriptions.ts`). Cancel-at-period-end via `/api/subscription/cancel`.

### Plus
- **Sitter verification (신원확인)** — sitters upload an ID document to a **private**
  Storage bucket; an admin reviews it at `/admin/verifications` and, on approval,
  flips `SitterProfile.verified` (the "✔ 인증" badge). Docs are viewed via short-lived
  signed URLs. Models: `SitterVerification`.
- **Realtime chat** — `/chat` + `/chat/[roomId]` with **Supabase Realtime (Broadcast)**
  for instant delivery, persisted via `/api/chats/[roomId]/messages`. Falls back to
  4s polling when Supabase isn't configured.
- **In-app notifications** — a `Notification` model + `notify()` helper fire on new
  applications, accepts, interview proposals/responses, new messages, settlements, and
  verification results. Header bell (`/api/notifications`) polls every 30s with an
  unread badge. `notify()` fans out to **in-app + web push + email** (email via Resend
  for a curated set of important types; `src/lib/email.ts`, no-op without a key).
- **Notification preferences** — users toggle email/push channels
  (`User.emailNotifications` / `pushNotifications`, `/api/me/preferences`, settings on
  the dashboard); `notify()` honors them before sending.
- **Interview management** — `/interviews` lists proposals; sitters accept/decline and
  set a time (`/api/interviews/[id]/respond`).
- **Search** — `/sitters` supports city / max-rate / min-rating / verified filters and
  pagination; premium sitters get priority placement.
- **Sitter profiles & favorites** — public `/sitters/[id]` profile with bio, rating,
  reviews, and connect actions; parents can save sitters (❤ `Favorite` model,
  `/api/favorites`) and view them at `/favorites`.
- **Safety: report & block** — users report others (`Report` model, admin queue at
  `/admin/reports`) and block them (`Block` model). Blocks are mutual: they cut off
  chat, messaging, and interview proposals, and hide the user from search
  (`src/lib/blocks.ts`).
- **Audit log** — append-only `AuditLog` of sensitive actions (settings changes,
  verification decisions, settlement transitions, report handling, blocks) with
  actor + IP (`src/lib/audit.ts`), viewable by admins at `/admin/audit`.
- **Sitter availability** — sitters set a weekly day×time-slot grid
  (`AvailabilitySlot`, editor on `/profile`, `/api/availability`); shown on the
  profile and filterable in search (`?day=&slot=`).
- **Bookings** — either party proposes a care booking from chat (date/hours/rate),
  the counterparty confirms/declines (`Booking` model, `/bookings`,
  `/api/bookings`). Confirming writes the agreed rate/hours + matched sitter onto
  the linked job, so the existing payment flow can charge it. Blocks/notifications
  apply.
- **Receipts** — `/receipts` shows the user's payment history with a **CSV export**
  (`/api/receipts/export`, UTF-8 BOM for Excel). CSV serialization is a pure,
  unit-tested helper (`src/lib/receipts.ts`).
- **Image optimization** — avatars & work-log photos render via `next/image`
  (Supabase hosts allow-listed in `next.config.mjs`).
- **PWA (installable)** — web app manifest (`src/app/manifest.ts`), a service worker
  (`public/sw.js`, app-shell cache + offline fallback), generated icons
  (`npm run gen:icons`), and an install banner (`PwaManager`). Installs to the home
  screen on Android/desktop Chrome; iOS via Share → Add to Home Screen.
- **Web push notifications** — VAPID-based push (`web-push`). `notify()` also fires a
  push, so every in-app notification reaches the lock screen. Subscribe from the bell's
  "🔔 푸시 알림 켜기" toggle; the SW shows the notification and focuses the app on click.
  Generate keys with `npm run gen:vapid`. Degrades to no-op when VAPID isn't set.
- **Accessibility** — skip-to-content link, keyboard `:focus-visible` ring, focus-trapped
  dialogs (`useFocusTrap` in Modal + mobile nav with Escape-to-close and focus restore),
  labeled form controls (`aria-label`/`autoComplete`), and a `radiogroup` star rating.
- **i18n (한국어 / English)** — cookie-based locale (`src/lib/i18n.ts`) with a header
  language switcher. The public front door (nav, footer, landing, pricing, sitter
  search, login) is fully bilingual; `<html lang>` follows the locale.
- **Security** — CSP + security headers, same-origin CSRF guard (middleware),
  rate limiting on sensitive endpoints, production-disabled demo login, private
  ID-document storage with signed URLs, signature-verified webhooks. See
  [`SECURITY.md`](./SECURITY.md).

---

## Prisma models

| Model | Purpose |
|-------|---------|
| `User` | Balances (`creditBalance`, `ticketExpiresAt`, `isPremium`), roles |
| `Ticket` | 30-day pass records |
| `CreditTransaction` | Credit ledger (purchase / spend / refund / adjustment) with running balance + idempotency |
| `Subscription` | Premium membership (Toss billing key) |
| `Payment` | Care fee + fee split, and credit/ticket/subscription purchases |
| `Settlement` | Sitter payout (`pending → paid → completed`) |
| `SitterVerification` | Identity verification submissions (`pending → approved/rejected`) |
| `PlatformSetting` | Admin-editable fee rate, ticket/credit prices, action costs |
| `JobPost`, `Application`, `Interview`, `ChatRoom`, `Message`, `WorkLog`, `Review` | Matching flow |

---

## Matching flow (with hybrid billing integrated)

1. **Free search / job board** — `/sitters` to browse, or `/jobs` where parents post
   (`POST /api/jobs`) and sitters apply for free (`POST /api/applications`).
2. **Connect** — `POST /api/interviews`, `POST /api/applications/:id/accept`,
   `POST /api/chats`. Each calls `deductForAction()`:
   - premium/ticket → pass through (no charge),
   - credits → `-cost`,
   - insufficient → **HTTP 402 `INSUFFICIENT_CREDIT`** → the frontend opens the
     **"이용권이 부족합니다"** modal → purchase page.
3. **Confirm schedule & rate in chat** — `JobPost.agreedRate/agreedHours`.
4. **Care happens; sitter logs work** — `POST /api/worklogs`.
5. **Parent pays** — `POST /api/jobs/:id/pay` builds the fee split and returns Toss
   checkout params. On success, `fulfillPayment()` creates the sitter `Settlement`.
6. **Reviews** — `POST /api/reviews`.

### Insufficient-balance handling
`src/lib/api.ts` maps `InsufficientCreditError → 402`. The client `api()` wrapper flags
it, and `BillingProvider.runBillable()` opens `InsufficientCreditModal`, then the
`PurchaseModal`. **Premium users never hit the 402 path** (branch in `deductForAction`).

---

## Toss Payments integration

- **Server client** — `src/lib/toss.ts`: `confirmPayment`, `getPayment`, `cancelPayment`,
  `chargeBillingKey`.
- **Browser** — `src/lib/client/toss.ts` loads the SDK and opens the checkout window.
- **Confirm redirect** — `GET /api/payments/confirm` verifies the amount matches the
  order (anti-tampering), calls Toss confirm with the secret key, then fulfills.
- **Webhook** — `POST /api/payments/webhook` verifies the signature, re-fetches the
  payment from Toss as the source of truth, and maps `DONE → fulfill`,
  `CANCELED/EXPIRED → fail`. Fulfillment is idempotent (safe on retries).

> Swap in 아임포트(Iamport)/PortOne by replacing `src/lib/toss.ts` and the two routes —
> the fulfillment layer is provider-agnostic.

---

## Admin console

`/admin` (ADMIN role) is a unified dashboard: revenue metrics (platform fees,
ticket/credit/subscription revenue, premium members, active tickets, sitter payouts)
plus work queues:
- `/admin/settings` — fee rate, ticket price/duration, credit packages, premium price,
  per-action credit cost (`GET/PUT /api/admin/settings`).
- `/admin/verifications` — review sitter identity documents.
- `/admin/settlements` — advance sitter payouts `pending → paid → completed`.

---

## Getting started

```bash
npm install
cp .env.example .env          # fill in DATABASE_URL + Toss keys
npx prisma migrate dev --name init
npm run db:seed               # demo users, sitters, a matched job
npm run dev
```

Open http://localhost:3000, then `/login` to pick a demo user:

| User | Role | Notes |
|------|------|-------|
| `admin@warmsitter.test` | ADMIN | opens `/admin/settings` |
| `parent@warmsitter.test` | PARENT | 3 credits — try proposing/chatting |
| `premium-parent@warmsitter.test` | PARENT | premium — no deductions |
| `emma@…`, `sofia@…`, `grace@…`, `mia@…` | SITTER | seeded sitters |

### Auth & Storage (Supabase)
- **Auth** — when `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set,
  `src/lib/auth.ts` derives the current user from the **Supabase Auth** session and
  provisions the matching Prisma `User` just-in-time (linked by `authId`, then by
  email so seeded users attach on first login). Session refresh is handled in
  `src/middleware.ts`. `/login` shows a real email login/signup form.
- **Fallback** — with Supabase unset, the app uses the **demo stub** (`ws_uid` cookie /
  demo user-picker) so it runs locally with zero config.
- **Storage** — sitter profile photos and work-log images upload to **Supabase
  Storage** via `POST /api/uploads` (server-side, service-role key). URLs are saved to
  `SitterProfile.photoUrl` / `WorkLog.imageUrl`.

The rest of the app only depends on `getCurrentUser()` / `requireUser()`, so you can
swap in any auth provider.

## Scripts
- `npm run dev` / `build` / `start`
- `npm run typecheck` — `tsc --noEmit`
- `npm test` — Vitest unit tests (fee split, entitlement, settlement transitions, subscription periods)
- `npm run db:seed` — seed demo data
- `npm run prisma:migrate` — run migrations

## CI
`.github/workflows/ci.yml` runs typecheck → tests → build on every push to `main`
and every PR (uses dummy env vars; no DB connection needed).

## Tech
Next.js 14 · TypeScript · Prisma (PostgreSQL) · Tailwind · Zod · Toss Payments
