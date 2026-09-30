# Lemony

A single-person relationship self-check (in Mongolian). The user answers ~40 questions, sees a small teaser computed in the browser, pays through QPay, and receives a personalised AI-generated report.

```
questions → local teaser → paywall → QPay invoice → backend verifies payment → OpenAI → stored report → report page
```

OpenAI is **never** called before the backend has independently confirmed payment with QPay.

## Repository layout

```
frontend/   Vite + React + TypeScript + Tailwind CSS v4 + React Router
backend/    Laravel 12 API (PHP 8.2+, MySQL)
deploy/     Nginx site and Supervisor queue-worker config for AWS
```

## Architecture

### Frontend (`frontend/`)

| Path | Purpose |
|---|---|
| `src/data/questions.ts` | **The questionnaire** — categories, questions, options, scores, flags. Single source of truth. |
| `src/data/signals.ts` | Teaser titles (strengths / areas to explore / patterns). |
| `src/lib/analysis/teaser.ts` | Deterministic, pure teaser analysis (runs in the browser, before payment). |
| `src/lib/api.ts` | Typed API client. |
| `src/lib/storage.ts` | localStorage persistence (progress, answers, assessment token). |
| `src/lib/analytics.ts` | Privacy-safe analytics abstraction (no provider yet; never receives answers). |
| `src/hooks/useQuestionnaire.ts` | One-question-at-a-time state, auto-advance, persistence. |
| `src/pages/*` | `/`, `/check`, `/complete`, `/payment/:token`, `/report/:token`, `/privacy`, `/terms` |
| `scripts/export-questions.ts` | Exports the questionnaire to `backend/resources/questionnaire/questions.json`. |

### Backend (`backend/`)

| Path | Purpose |
|---|---|
| `app/Services/Questionnaire.php` | Loads the exported questionnaire; validates answers; resolves ids → trusted text. |
| `app/Services/QPayService.php` | QPay auth token (cached), invoice creation, payment check, payment verification. |
| `app/Services/Payments/*` | `PaymentGateway` interface, DTOs, and the dev-only `FakePaymentGateway`. |
| `app/Services/PaymentService.php` | Idempotent invoices; the only code that marks an assessment paid. |
| `app/Services/RelationshipReportService.php` | Builds the prompt, calls OpenAI (structured JSON), validates output. The only OpenAI caller. |
| `app/Jobs/GenerateRelationshipReport.php` | Runs generation; records failures without leaking answers to logs. |
| `app/Http/Controllers/Api/*` | Thin controllers. |
| `routes/api.php` | API routes and per-route rate limits. |

**Data model:** `assessments` (random 48-char `public_token`, encrypted `answers_json`, `teaser_json`, `status`), `payments` (QPay invoice + verification record), `reports` (encrypted `report_json`, one per assessment). Sequential ids are never exposed.

**Assessment status:** `created → payment_pending → paid → generating → completed` (or `failed`, which can be retried up to 4 attempts in total).

### API

| Method | Path | Notes |
|---|---|---|
| GET | `/api/config` | Price and currency (from `REPORT_PRICE`). |
| POST | `/api/assessments` | Validates answers against the questionnaire; returns `{ token, status }`. |
| GET | `/api/assessments/{token}` | Status + teaser titles (no answers). |
| DELETE | `/api/assessments/{token}` | Permanently deletes answers and report. |
| POST | `/api/assessments/{token}/payment` | Creates or reuses a QPay invoice (QR, bank deep links). |
| GET | `/api/assessments/{token}/payment-status` | Backend asks QPay; marks paid only when verified. |
| POST | `/api/assessments/{token}/generate-report` | 403 unless paid; returns the existing report instead of calling OpenAI again. |
| GET | `/api/assessments/{token}/report` | 200 when completed, 202 while generating, 403 unpaid, 409 failed. |
| GET/POST | `/api/payments/qpay/callback/{reference}` | QPay callback — only triggers verification; the call itself isn't trusted. |
| POST | `/api/assessments/{token}/dev/mark-paid` | **Dev only.** Not routed unless `PAYMENT_BYPASS=true` and `APP_ENV≠production`. |

## Local development

Requirements: Node 20+, PHP 8.2+ with `pdo_mysql`/`pdo_sqlite`, Composer, MySQL 8 (or SQLite for quick local runs).

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
# Local shortcut: DB_CONNECTION=sqlite (uses database/database.sqlite) — or create a MySQL database:
#   CREATE DATABASE soulmate_check CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
php artisan migrate
# For a full local flow without QPay: PAYMENT_BYPASS=true and leave QPAY_USERNAME empty.
php artisan serve            # http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                  # http://localhost:5173 (proxies /api → :8000)
```

With `PAYMENT_BYPASS=true` and no QPay credentials, the payment page shows a placeholder QR and a **"Туршилтын төлбөр хийх (dev)"** button (only in `npm run dev`). Report generation still needs a real `OPENAI_API_KEY`.

### Commands

| | Frontend (`frontend/`) | Backend (`backend/`) |
|---|---|---|
| Dev server | `npm run dev` | `php artisan serve` |
| Type check | `npm run typecheck` | — |
| Lint / style | `npm run lint` | `vendor/bin/pint --test` |
| Tests | `npm test` | `php artisan test` |
| Build | `npm run build` | — |
| Migrate | — | `php artisan migrate` |

### Editing questions

1. Edit `frontend/src/data/questions.ts` (text, options, scores, order).
2. If you changed question ids or option values, bump `QUESTIONNAIRE_VERSION`.
3. Run `npm run export:questions` — the backend reads the exported JSON. A frontend test fails if the two drift apart.

## Environment variables

Backend (`backend/.env`, see `.env.example`):

| Variable | Purpose |
|---|---|
| `APP_URL`, `FRONTEND_URL` | Public URLs (FRONTEND_URL is used for CORS). |
| `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | MySQL. |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | Report generation (default model `gpt-5-mini`). |
| `REPORT_LANGUAGE` | Report language (default Mongolian). |
| `QPAY_BASE_URL`, `QPAY_USERNAME`, `QPAY_PASSWORD`, `QPAY_INVOICE_CODE`, `QPAY_CALLBACK_URL` | QPay merchant API v2. |
| `REPORT_PRICE`, `REPORT_CURRENCY` | Price (e.g. `4900`, `MNT`). The frontend reads it from `/api/config`. |
| `PAYMENT_BYPASS` | Dev-only payment bypass; ignored in production. |
| `QUEUE_CONNECTION` | `sync` locally; `database` + worker in production. |

Frontend (`frontend/.env`, optional): `VITE_API_BASE_URL` (empty = same origin). Never put secrets in `VITE_*` variables — they are public.

## QPay

`QPayService` implements the QPay merchant API v2:

- `POST /auth/token` (Basic auth) → access token, cached until expiry and refreshed on 401.
- `POST /invoice` with `invoice_code`, `sender_invoice_no` (our random reference), `invoice_receiver_code`, `invoice_description`, `amount`, `callback_url`.
- `POST /payment/check` with `object_type=INVOICE`, then `GET /payment/{payment_id}` to verify status `PAID`, amount and invoice.

Before going live, confirm these endpoints and field names against the documentation QPay provides with your merchant contract. They are isolated in one file. Test against the sandbox (`https://merchant-sandbox.qpay.mn/v2`) first.

## Production deployment (AWS Ubuntu)

`deploy.sh` provisions the server and ships releases over SSH. Run it from **Git Bash** (Windows), macOS or Linux, in the repository root.

### First time

1. **AWS security group:** allow inbound TCP 22 (SSH), 80 (HTTP) and 443 (HTTPS).
2. **Configure:** run `./deploy.sh` once. It creates `deploy/deploy.env` (git-ignored); fill in:
   ```bash
   SERVER=ubuntu@<server-public-ip>
   SSH_KEY=~/Downloads/<your-key>.pem
   DOMAIN=            # optional for now
   EMAIL=             # for the HTTPS certificate
   ```
3. **Provision** (Nginx, PHP-FPM, MySQL, Composer, Supervisor, Certbot, firewall, swap, database):
   ```bash
   ./deploy.sh setup
   ```
4. **Deploy:** builds and tests locally, uploads, installs, migrates and activates:
   ```bash
   ./deploy.sh
   ```
   The first deploy creates the production `.env` on the server (random DB password, new `APP_KEY`, `PAYMENT_BYPASS=false`, database queue). It then copies the QPay, AI and price settings from your local `backend/.env`.
5. **HTTPS:** point your domain's DNS A record at the server, set `DOMAIN` and `EMAIL`, then:
   ```bash
   ./deploy.sh ssl
   ```
   This also updates `APP_URL` and `QPAY_CALLBACK_URL` to the HTTPS domain. Certificates renew automatically.

### Everyday commands

| Command | What it does |
|---|---|
| `./deploy.sh` | Build, test, upload and switch to a new release (keeps the last 5). |
| `SKIP_TESTS=1 ./deploy.sh` | Same, without running tests. |
| `./deploy.sh env` | Push changed secrets (QPay, AI keys, model, price) from `backend/.env`. |
| `./deploy.sh rollback` | Switch back to the previous release (database migrations are not reversed). |
| `./deploy.sh logs` | Laravel and queue-worker logs, service status. |

### On the server

```
/var/www/soulmate-check/
  current -> releases/<timestamp>     active release (frontend/dist + backend)
  releases/                           last 5 releases
  shared/.env                         production settings (persist across deploys)
  shared/storage/                     logs, cache, sessions
```

Nginx serves the SPA and routes `/api/*` to PHP-FPM (templates in `deploy/nginx/`). A Supervisor worker runs the report queue (`deploy/supervisor/`), and cron runs the Laravel scheduler.

**Back up `APP_KEY`** from `/var/www/soulmate-check/shared/.env`. Answers and reports are encrypted with it; losing it makes stored data unreadable.

## Privacy and safety

- Answers and reports are encrypted at rest (Laravel `encrypted:array` casts).
- No answers in URLs; tokens are 24 random bytes (CSPRNG).
- OpenAI receives only question/answer text. The free-text answer has emails, phone numbers and links redacted. `store: false` is sent.
- Logs record failure reason codes only, never answers or prompts.
- API responses are sent with `Cache-Control: no-store`, and all endpoints are rate-limited.
- Users can delete their assessment and report. Unpaid assessments are pruned after 30 days.
- The AI prompt forbids diagnoses, labels such as "toxic", cheating predictions, verdicts on love, and unsupported claims about a partner’s motives. It supports informed choices, including stepping back when appropriate.


### Final production checks

See [the production release handoff](docs/production-release.md) for the launch procedure and remaining live checks. After configuring the production environment, run `php artisan app:production-check` in the active backend directory. Test-payment bypasses are limited to `local` and `testing`; legacy production bypass flags are ignored. Support is available through the Facebook page linked in the footer, payment help and privacy pages.
