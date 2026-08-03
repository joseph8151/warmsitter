# Deploying warm sitter

Recommended stack: **Vercel** (hosting) + **Neon** or **Supabase** (Postgres) +
**Toss Payments**. Every step below can be driven from Claude once you connect the
matching MCP connectors (Vercel, Supabase/Neon, GitHub) at
`claude.ai → Settings → Connectors`.

---

## 1. Provision the database

### Option A — Neon (serverless Postgres, great with Vercel)
1. Create a project at [neon.tech](https://neon.tech).
2. Copy **two** connection strings from the dashboard:
   - Pooled host (contains `-pooler`) → `DATABASE_URL`
   - Direct host (no `-pooler`) → `DIRECT_URL`

### Option B — Supabase (Postgres + auth + storage)
1. Create a project at [supabase.com](https://supabase.com).
2. **Project Settings → Database → Connection string**:
   - Transaction pooler (port `6543`, add `?pgbouncer=true`) → `DATABASE_URL`
   - Direct connection (port `5432`) → `DIRECT_URL`
3. Bonus: Supabase Auth can replace the demo auth stub (`src/lib/auth.ts`), and
   Supabase Storage can hold sitter photos / work-log images.

Run the migrations against the new database:

```bash
DATABASE_URL=... DIRECT_URL=... npm run migrate:deploy
DATABASE_URL=... DIRECT_URL=... npm run db:seed   # optional demo data
```

---

## 2. Deploy to Vercel

1. **Import the GitHub repo** at [vercel.com/new](https://vercel.com/new)
   (Framework preset: **Next.js** — auto-detected).
2. **Environment Variables** (Production + Preview):

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | pooled Postgres URL |
   | `DIRECT_URL` | direct Postgres URL |
   | `NEXT_PUBLIC_TOSS_CLIENT_KEY` | Toss client key |
   | `TOSS_SECRET_KEY` | Toss secret key |
   | `TOSS_WEBHOOK_SECRET` | Toss webhook signing secret |
   | `NEXT_PUBLIC_BASE_URL` | your deployed URL (e.g. `https://warmsitter.vercel.app`) |
   | `CRON_SECRET` | any random string (secures the expiry cron) |

3. Build settings are already correct:
   - `postinstall` runs `prisma generate`
   - `build` runs `prisma generate && next build`
4. Deploy. Each PR gets a **preview deployment** automatically.

> **Migrations on deploy:** run `npm run migrate:deploy` from CI or locally against
> production. Avoid putting `migrate deploy` in the Vercel build command, since
> preview builds would run it against your shared database.

---

## 3. Configure Toss Payments

1. In the [Toss developer console](https://developers.tosspayments.com), set the
   **webhook URL** to:
   ```
   https://<your-domain>/api/payments/webhook
   ```
2. Copy the webhook signing secret into `TOSS_WEBHOOK_SECRET`.
3. The success/fail redirect URLs are built from `NEXT_PUBLIC_BASE_URL`:
   - success → `/api/payments/confirm`
   - fail → `/billing/result?status=fail`

---

## 4. Cron (expiry notifications)

`vercel.json` already registers a daily job:

```json
{ "crons": [{ "path": "/api/cron/expiry", "schedule": "0 9 * * *" }] }
```

Set `CRON_SECRET` in Vercel; it is sent automatically as
`Authorization: Bearer <CRON_SECRET>` and verified by the route. Wire an email/push
provider inside `runExpiryNotifications()` (`src/lib/notifications.ts`).

---

## 5. Post-deploy checklist
- [ ] `migrate:deploy` run against production DB
- [ ] All env vars set (Production **and** Preview)
- [ ] Toss webhook URL + secret configured
- [ ] A test payment flows through `/api/payments/confirm` and fulfills
- [ ] Replace the demo auth stub with real auth before going live
