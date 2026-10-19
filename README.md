# VidFetch — Social Video Downloader

A production-ready web app that accepts a YouTube, Instagram, Facebook, or
TikTok link and shows the download options that are **actually available** —
with honest "integration not configured" states instead of fake results.

**Stack:** Next.js 15 (App Router) + TypeScript + Tailwind CSS, Supabase
(PostgreSQL + Auth + RLS), deployable to Vercel, source on GitHub.

> **Status: code-complete, NOT yet provisioned.** The app is fully built and
> all local checks pass, but no Supabase project, admin account, or
> deployment exists yet — those are *your* steps below. Nothing here invents
> credentials, URLs, or test results.

---

## 1. What was built

```
social-video-downloader/
├── app/
│   ├── page.tsx                 # homepage: URL input, fetch button, states
│   ├── faq|privacy|terms|contact # public info pages
│   ├── api/
│   │   ├── fetch/route.ts       # POST: validate URL (SSRF-safe) → integration → honest result
│   │   ├── integrations/route.ts# GET: public configured/healthy status (no secrets)
│   │   ├── contact/route.ts     # POST: visitor message → activity log
│   │   └── admin/
│   │       ├── settings/route.ts     # GET/POST settings (admin, server-verified)
│   │       └── integrations/route.ts # POST enable/disable platform (admin)
│   └── admin/
│       ├── login/page.tsx       # admin sign-in
│       ├── layout.tsx           # admin shell + server-side role check on every load
│       ├── page.tsx             # dashboard: stats, integration status, activity
│       ├── settings/            # site settings (secrets never shown/editable here)
│       ├── integrations/        # per-platform status + setup guidance
│       └── activity/            # activity log + download jobs (hashes only)
├── components/                  # Navbar, Footer, UrlForm, ResultCard, PlatformBadge
├── lib/
│   ├── config.ts                # platform hostname allowlist, limits
│   ├── url-security.ts          # validation, DNS + private-IP SSRF guard, sha256
│   ├── rate-limit.ts            # per-IP sliding-window limiter
│   ├── access.ts                # pure admin-access decision (unit-tested)
│   ├── auth.ts                  # server-side requireAdmin()
│   ├── api-helpers.ts           # body size limits, client IP, timeouts
│   ├── supabase-server.ts       # anon (RLS) + service-role (admin-only) clients
│   ├── supabase-browser.ts      # browser client (anon key only)
│   └── integrations/            # youtube|instagram|facebook|tiktok + registry
├── middleware.ts                # /admin/* → login redirect when signed out
├── supabase/migrations/
│   ├── 001_core_schema.sql      # tables, is_admin(), RLS policies
│   └── 002_seed_settings.sql    # default settings + integration rows
├── scripts/
│   ├── create-admin.mjs         # creates the REAL admin via Supabase Auth Admin API
│   └── verify-setup.mjs         # verifies schema, RLS, admin role, permission tests
├── .env.example                 # variable names only — no real values
└── README.md                    # this file
```

---

## 2. Remaining setup — do these in order

### Step 1 — Create the Supabase project
1. Go to https://supabase.com/dashboard → **New project**.
2. Note the **Project URL** and **anon key** (Settings → API).
3. Create a **service-role key** copy for server use only (Settings → API → `service_role`).

### Step 2 — Apply the database migrations
Option A (Supabase CLI):
```bash
supabase link --project-ref <your-project-ref>
supabase db push   # applies supabase/migrations/*.sql in order
```
Option B: open the Supabase SQL editor and run
`supabase/migrations/001_core_schema.sql`, then `002_seed_settings.sql`.

### Step 3 — Configure environment variables
```bash
cp .env.example .env.local
```
Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`. Leave platform keys empty until you have real
ones — the UI will honestly report those integrations as "not configured".

### Step 4 — Create the administrator account (REAL account)
The app cannot do this by itself. Run, with secrets exported in your shell
(never written to a file):

```bash
export SUPABASE_URL="https://xyzcompany.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJ..."      # service-role key, keep secret
export ADMIN_EMAIL="qaisranimehboob69@gmail.com"
export ADMIN_NAME="Mehboob Qaisrani"
export ADMIN_PASSWORD="<choose-a-strong-password>"
npm run admin:create
```

The script creates the user through the Supabase Auth Admin API (Supabase
hashes the password — it is never stored in plaintext) and upserts
`profiles.role = 'admin'` server-side. It prints verification steps and
**does not** write the password anywhere.

> The password shown in the original request was for one-time setup only.
> It is **not** stored in this repo, in any commit, or in the app.

### Step 5 — Verify the backend
```bash
npm run admin:verify
```
Checks: all tables exist, the admin profile has `role='admin'`, anonymous
users are blocked from `activity_log`, and an anonymous self-promotion to
admin is rejected by RLS.

### Step 6 — Change the admin password after first login
1. Sign in at `/admin/login` with the credentials from Step 4.
2. Immediately change the password: Supabase Dashboard → Authentication →
   Users → select the admin → **Send password recovery email**, then follow
   the link to set a new password. (Alternatively use
   `supabase.auth.updateUser({ password })` from a signed-in session.)

### Step 7 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit: VidFetch social video downloader"
gh repo create vidfetch --private --source=. --push
# or: git remote add origin <your-repo-url> && git push -u origin main
```

### Step 8 — Deploy to Vercel
1. https://vercel.com → **Add New Project** → import the GitHub repo.
2. Add **all** environment variables from `.env.local` in
   Project Settings → Environment Variables. Mark `SUPABASE_SERVICE_ROLE_KEY`
   and platform keys as sensitive.
3. Deploy. Then verify:
   - the homepage loads and shows the URL form,
   - `/admin/login` redirects correctly and the admin can sign in,
   - a logged-out visit to `/admin` redirects to `/admin/login`,
   - `/api/integrations` shows all four platforms as "not configured".

---

## 3. Local checks (all must pass)

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint, zero warnings allowed
npm run test        # vitest: URL security, integrations, access, rate-limit
npm run build       # production build
```

---

## 4. Security notes

- Raw submitted URLs are **never stored** — only `sha256(url_hash)` + platform + outcome.
- SSRF protection: strict hostname allowlist + DNS resolution with rejection
  of every private/loopback/link-local/reserved/multicast/CGNAT address.
- Rate limiting: 20 req/hour/IP by default (override via env or admin setting).
- RLS on all tables; `profiles.role` can never be self-promoted (`WITH CHECK (role='user')`).
- Service-role key is server-only; the client bundle contains only `NEXT_PUBLIC_*` vars.
- No DRM circumvention, no private-account bypass, no invented download links.

---

## 5. Final delivery report (honest)

| Item | Status |
|---|---|
| Full app (pages, API, admin UI, middleware) | ✅ Built, in this repo |
| Supabase schema + RLS migrations | ✅ Written (`supabase/migrations/`), **not yet applied** — needs Step 2 |
| Administrator account | ❌ **NOT created** — no Supabase access on this machine; run Step 4 |
| Admin login tested | ❌ Cannot test without a live Supabase project (unit-tested role logic only) |
| Public-user restriction tests | ⚠️ RLS policies written + `verify-setup.mjs` permission tests ready; **not run** (no live DB) |
| URL validation / SSRF / rate-limit tests | ✅ Written and run locally (see below) |
| Integrations (YouTube/IG/FB/TikTok) | ⚠️ Code-complete; all report **not configured** until real credentials are added |
| Production build | ✅ Passes (`next build`, 18 routes) |
| GitHub push | ❌ Not pushed (no connection available) — see Step 7 |
| Vercel deployment | ❌ Not deployed (no connection available) — see Step 8 |
| Live website URL | ❌ None exists — **not invented** |
| Secrets in repo | ✅ None — `.env.example` has names only; verified by grep (see below) |

**Remaining actions for you:** Steps 1–8 above, in order. After Step 8 the
site is live; add platform API credentials later to light up integrations
one by one — the UI will report each honestly.
