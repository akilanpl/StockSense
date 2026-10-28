# StockSense

A Next.js + PostgreSQL inventory application for one shared workspace. Products, locations, receipts, transfers, deliveries, physical counts, current stock, and the movement ledger use the same database and transaction engine.

## Run locally

Requirements: Node.js 20.9+ and PostgreSQL 15+.

```sh
npm ci
cp .env.example .env
# Set DATABASE_URL and a unique AUTH_SECRET (openssl rand -hex 32).
npx prisma generate
npm run db:migrate
npm run dev
```

Visit `http://localhost:3000`, sign up, and verify your email. Without SMTP in development, the local server prints the verification code. Production requires real SMTP credentials. No usable demo password is committed. The optional `npm run db:seed` adds development catalog/warehouse/partner fixtures; create your own login using signup. Its development user intentionally has no usable password.

A blank database is supported: Products → Add Product lets you create the first category and unit, then Warehouses and Locations establish where stock lives. Supplier/customer selection reads actual partners; both are optional.

## Finals demonstration

See [the demo script](docs/DEMO.md) for receive 100 → transfer 30 → deliver 20 → count 8, leaving 70 in Rack A and 8 in Rack B. Every operation follows Draft → Ready → Done; only validation changes stock. Failed deliveries leave stock and the ledger unchanged.

## Deploy

1. Configure a dedicated database, a unique `AUTH_SECRET` with at least 32 characters, and SMTP variables from `.env.example`.
2. Set `APP_ORIGIN` to the exact public origin, without a trailing slash, and serve over HTTPS.
3. Set `SIGNUP_ALLOWED_EMAILS` to the approved team addresses. Production registration is closed to other addresses. Every approved account shares the workspace and can operate inventory; the role field does not implement tenant isolation or differentiated permissions.
4. Run `npm ci`, then `npm run db:migrate` as a controlled release step, then `npm run build` and `npm start`. The build no longer runs migrations against your database.
5. For a controlled finals demo with disposable data only, `ALLOW_PUBLIC_SIGNUP=true` enables open registration. Keep it false for a real workspace.

The session-version migration invalidates legacy sessions; users must sign in again. Password resets revoke all existing sessions. Login is limited per normalized email to 20 attempts per 15 minutes, shared across application instances. Put broader IP/request throttling at your hosting edge. API writes check origin; all catalog and inventory endpoints require a verified session. External production SMTP requires TLS; loopback relays are permitted for local integration tests.

Before real business use, configure database backups and restore drills, monitoring and log retention, your approved membership/role policy, and edge throttling. This repository does not include stock reservations, costing, automatic purchasing, multi-company tenancy, or an Odoo connector.

## Verification

Use a disposable database whose name contains `_test_` or `_review_`. Verification inserts inventory records that deliberately retain audit history. Never point these scripts at real inventory.

```sh
npx prisma generate
npm run db:migrate
npm run lint
npm run typecheck
npm run verify:auth
npm run verify:inventory
npm run verify:integration
npm audit
```

Set `DATABASE_URL` and `AUTH_SECRET` in the environment before running verification. `verify:auth` uses development email capture and must run without production SMTP configuration. The integration verifier exercises every protected API handler, deterministic transaction interleavings, unchanged physical counts, OTP concurrency and login limits.

### Full HTTP and browser workflow

Start a test mail relay in one terminal:

```sh
SMTP_TEST_OUTBOX=/tmp/stocksense-test-mail.jsonl node scripts/test-smtp.mjs
```

Build the application, then start it against the same disposable database in a second terminal, with `AUTH_SECRET`, `ALLOW_PUBLIC_SIGNUP=true`, `SMTP_HOST=127.0.0.1`, `SMTP_PORT=3188`, `SMTP_USER=test`, `SMTP_PASSWORD=test`, and `SMTP_FROM=stocksense@example.test` set:

```sh
npm run build
npm start -- --hostname 127.0.0.1 --port 3187
```

In a third terminal, set the same `DATABASE_URL`, then run:

```sh
SMTP_TEST_OUTBOX=/tmp/stocksense-test-mail.jsonl npm run test:e2e -- api-workflow
npx playwright install chromium
SMTP_TEST_OUTBOX=/tmp/stocksense-test-mail.jsonl npm run test:e2e -- workflow.spec.ts
```

The mail fixture binds to loopback only, captures test OTP messages locally, and is not a real mail-deliverability test. Playwright needs OS permission to launch Chromium. When that is restricted, the HTTP integration test still runs; verify visible browser interactions separately. See [the review and evidence](docs/REVIEW.md).

## Continuous integration

`.github/workflows/verify.yml` runs lint, type checks, migrations, auth/inventory/concurrency regressions, the dependency audit, the production build, and both HTTP and Chromium workflows against a disposable PostgreSQL service and loopback mail relay. It runs for pull requests and pushes to main or codex branches. No production secrets or deployment are involved.

## Architecture

```text
Browser UI -> authenticated API -> catalog / operation services -> PostgreSQL
Server pages -> current-user check -> the same services ---------^

DRAFT -> WAITING -> READY -> DONE
  |         |        |
  +---------+--------+----> CANCELED

Validate locks operation, then product/location pairs in stable order:
  checks + stock quantities + movement ledger + DONE in one transaction
All header/line edits, readiness and cancellation share the operation lock.
```

Decimal quantities support four decimal places. Receipts, deliveries and transfers require positive quantities. Adjustments accept zero and unchanged counts; unchanged counts complete without inventing a stock movement.
