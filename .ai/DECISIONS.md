# Implementation Decisions & Gaps

Tracked deviations, assumptions, and backend gaps discovered while building the JobLink frontend.

## Phase 6 — Admin Experience

### Backend gap (FIXED): admin list routes were shadowed by `/:id`

- `backend/src/routes/jobRoutes.js`: public `GET /:id` was registered **before** `GET /admin`, so `GET /jobs/admin` matched `/:id` with `id="admin"` and threw a CastError (500) instead of reaching `adminGetAllJobs`.
- `backend/src/routes/companyRoutes.js`: public `GET /:id` preceded `GET /admin`. Same shadowing on `GET /companies/admin`.
- `backend/src/routes/userRoutes.js`: public `GET /:id` preceded the admin `GET /stats` and `GET /search`, shadowing `GET /users/stats` and `GET /users/search`.

**Fix applied:** registered the protected admin routes (`GET /admin`, `GET /admin/:id`, `GET /stats`, `GET /search`) **above** the `/:id` routes, with explicit `protect, restrictTo('admin')` inline middleware. Regression coverage added in `backend/test/adminRoutes.test.js` (asserts these admin routes resolve to their protected handlers and are not shadowed — verified: `/jobs/admin`, `/companies/admin`, `/users/stats`, `/users/search` all return 401 without auth instead of a CastError 500).

### Frontend behavior notes

- Revenue screens intentionally render **no monetary figures**. The backend returns `revenueAvailable: false` with real activity counts only; the UI surfaces that status explicitly instead of inventing money.
- `GET /users` (admin list) returns an array; `GET /users/stats` returns an object. Both are consumed separately.
- Audit logs are a backend-synthesized combined activity feed (users + companies + jobs), as implemented in `adminDashboardService.getAuditLogs`.
- Email "queue" lives in memory (`emailService`); queue status and analytics reflect the current process.

## Phase 7 — Polish, Integration & Final QA

- **Accessibility fixes applied:** `src/components/ui/modal.tsx` now traps focus (Tab/Shift+Tab cycling, initial focus on the close button) and restores focus to the previously focused element on close; `src/components/ui/tabs.tsx` now supports roving tabindex with Arrow/Home/End navigation (`"use client"` added). Unlabeled controls across admin/employer/messages screens received `aria-label` or `htmlFor`+`id`.
- **Error states completed:** every query-backed screen now renders `ErrorState` (with retry) instead of silently showing empty data — employer (my-jobs, applicants, dashboard), admin (users, jobs, companies, categories, dashboard, analytics, telegram, email, settings), and messages (conversation list + thread + composer).
- **Verification:** `npx tsc --noEmit`, `npm run lint`, and `npm run build` (Next 16 / Turbopack) all pass in `frontend/`. Backend regression suite `backend/test/adminRoutes.test.js` passes 4/4.
- **Known constraint:** the full backend jest suite requires `.env` with `MONGODB_URI`; without it `connectDB()` calls `process.exit(1)` (pre-existing, unrelated to the admin-route fix).

## Phase 7 — Runtime bugfixes (discovered while running the server)

Several pre-existing bugs surfaced once the backend actually booted with a real `.env`:

- **`dotenv` never loaded** — `src/server.js` now calls `require('dotenv').config()` first so `backend/.env` is read. `src/config/database.js` now uses `MONGODB_URI` from `./env` (safe localhost default) instead of raw `process.env.MONGODB_URI`, which was `undefined` without a `.env`.
- **`optimization.responseTime` crashed every response** — it called `res.setHeader()` inside the `finish` event after headers were already sent, throwing `ERR_HTTP_HEADERS_SENT` and killing the process (`middleware/optimization.js`). Replaced with a `writeHead` override that injects `X-Response-Time` before headers flush.
- **`categorySkillRoutes.js` gated every `/api/v1/*` route** — a bare `router.use(protect, restrictTo('admin'))` (no path) in a router mounted at `/api/v1` ran before the other API routers, so even public routes like `/jobs`, `/jobs/featured`, `/categories` returned 401. Scoped it to `'/categories'` and `'/skills'`.
- **All 17 controllers destructured `{ ApiResponse }`** — `utils/apiResponse.js` exports the class directly, so `ApiResponse` was `undefined` and every success response threw a 500. Switched all controllers to `const ApiResponse = require('../utils/apiResponse')`.
- **Mongoose async pre-save hooks called `next()`** — Mongoose does not pass `next` to async hooks, so `User`, `Company`, `Category`, `Job`, and `Skill` models crashed on save (`next is not a function`). Removed the `next` callback (async hooks resolve on return).
- **Mongoose duplicate-index warnings** — harmless noise on TokenBlacklist/Job/Category/Skill/SiteSetting/User/Company (both `index:true` and `schema.index()`). Not fixed; cosmetic only.

## Phase 7 — Email service for development

- **Email never arrived** — with blank `EMAIL_HOST`/`EMAIL_USER`/`EMAIL_PASS`, `emailService.sendEmail` silently returns `{ success: false }`; users were created as `pending_verification` but no email was sent, so verification was impossible to test.
- **Fix:** configured an **Ethereal test inbox** in `backend/.env` (`smtp.ethereal.email:587` with the generated test-user credentials). Emails are "delivered" to Ethereal's web inbox — view them at `https://ethereal.email/messages` by logging in with the `EMAIL_USER`/`EMAIL_PASS` values. This keeps dev self-contained with no real SMTP credentials.
- **Dev helper added:** `emailService.js` now logs `nodemailer.getTestMessageUrl(info)` after each send when `NODE_ENV !== 'production'`, printing a per-message preview link directly in the server console (click it to see the verification email without opening the dashboard).
- **Switched to real Gmail SMTP (App Password)** — `backend/.env` now uses `smtp.gmail.com:587` with `EMAIL_USER=niguss50@gmail.com`, a Gmail App Password (16-char, works with or without spaces), and `EMAIL_FROM` set to the same account so the From matches the authenticated sender. Verified end-to-end: SMTP connect + send OK, and the register flow returns 201 with the verification email delivered via Gmail. Ethereal creds no longer used.
- Note: nodemon may not watch `.env` changes — restart the server after editing email config. Verification link uses `FRONTEND_URL` (`http://localhost:3000`), which matches the dev frontend's `/verify-email/[token]` page. The Ethereal `[DEV] preview URL` log is harmless under Gmail (no preview URL is produced).

## Phase 7 — Email verification disabled for dev

- Added `REQUIRE_EMAIL_VERIFICATION` env flag (`src/config/env.js`, default `true`; `backend/.env` sets it to `false`). When `false`, `authService.register` creates users with `status: 'active'` and `emailVerified: true`, generates no verification token, and skips the verification email — so login works immediately. Set it back to `true` (and restart) to re-enable the email verification flow.