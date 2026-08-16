# JobLink Frontend Development Roadmap

This roadmap defines the complete, ordered build of the JobLink **frontend**.

The frontend consumes the existing backend at `backend/`.

The backend is the **source of truth**. Never invent endpoints, never fake API behavior.

Follow `UI_DESIGNE.MD` for all visual and UX decisions.

---

# The Rules

- Complete exactly **one phase at a time**.
- Never work on multiple phases simultaneously.
- Never skip a phase.
- Stop after finishing a phase and wait for the next instruction.
- Read `UI_DESIGNE.MD` before every phase.
- Read the backend reference below before every phase.
- Before building a feature, re-confirm the exact endpoint, request body, auth, and response shape in `backend/src/routes`.

---

# Frontend Stack (from PROJECT.md)

- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- React Hook Form + Zod
- Axios
- TanStack Query
- lucide-react (icons), socket.io-client (real-time), clsx + tailwind-merge (class utils), date-fns (dates)

---

# Backend Integration Reference (source of truth)

## Request Context

- Base URL: `http://localhost:5000/api/v1`
- Frontend dev server: `http://localhost:3000` (matches backend CORS).
- Auth: access token sent as `Authorization: Bearer <token>`; refresh token is an **httpOnly cookie** (`refreshToken`) managed by the backend.
- Protected endpoints return 401 when unauthenticated. On 401, call `POST /auth/refresh` (cookie auto-sent), then retry once. On refresh failure -> logout.

## Response Format (from `backend/src/utils/apiResponse.js`)

```json
{ "success": true, "data": ..., "message": "...", "meta": {...}, "statusCode": 200, "timestamp": "..." }
{ "success": false, "message": "...", "data": ..., "statusCode": 400, "timestamp": "..." }
```

- Lists return `data` (array) + `meta` with `{ page, limit, total, totalPages, hasNext, hasPrev }`.
- The API client must unwrap `data` and throw the server `message` for errors.

## Auth Routes (`backend/src/routes/authRoutes.js`)

| Endpoint | Auth | Notes |
|---|---|---|
| POST `/auth/register` | - | body: name, email, password, confirmPassword, role (`job_seeker`\|`employer`) |
| POST `/auth/login` | - | body: email, password -> `data: { user, accessToken }` |
| POST `/auth/refresh` | cookie | -> `data: { accessToken }` |
| POST `/auth/logout` | cookie | body OR cookie refreshToken |
| POST `/auth/logout-all` | protected | |
| GET `/auth/verify-email/:token` | - | |
| POST `/auth/resend-verification` | - | body: email |
| POST `/auth/forgot-password` | - | body: email |
| POST `/auth/reset-password/:token` | - | body: password, confirmPassword |
| POST `/auth/change-password` | protected | body: currentPassword, newPassword, confirmPassword |
| GET `/auth/me` | protected | -> `data: { user }` |
| PATCH `/auth/profile` | protected | name, phone, bio, location, website, linkedin |

Roles: `job_seeker`, `employer`, `admin`.

## Feature Route Map (for phase scoping)

- **Jobs**: `GET /jobs`, `GET /jobs/featured`, `GET /jobs/:id`, `POST /jobs`, `PATCH /jobs/:id`, `DELETE /jobs/:id`, `POST /jobs/:id/publish|close|archive`, `GET /jobs/my-jobs`, `GET /jobs/company/:companyId`, `GET /jobs/recommended`, admin: `GET/PATCH/DELETE /jobs/admin...`, `POST /jobs/admin/:id/feature`
- **Search**: `GET /search`, `GET /search/facets`, `GET /search/suggestions`, protected: `/search/saved`, `/search/history`
- **Companies**: `GET/POST /companies`, `GET /companies/search`, `GET /companies/slug/:slug`, `GET /companies/:id`, `POST /companies/:id/logo|cover`, member management, admin `.../admin...`, `POST /companies/admin/:id/verify`
- **Categories & Skills**: `GET` (public) + admin CRUD on `/categories`, `/skills` (mounted under `/api/v1`)
- **Applications**: `POST /applications/jobs/:jobId/apply`, `GET /applications/my-applications`, `GET /applications/:id`, `PATCH /applications/:id/status`, `POST /applications/:id/interview|offer|accept|withdraw`, company/job queries, `POST /applications/bulk-update`
- **Saved jobs**: `GET/POST/DELETE /saved-jobs...`, notes + tags
- **Notifications**: `GET /notifications`, unread count, preferences, mark read, delete
- **Messaging**: conversations CRUD, messages CRUD, read/unread, attachments, socket.io real-time
- **Employer dashboard**: `/employer/dashboard/stats`, `/analytics`, `/applications`, `/companies`, `/company/:id/team`, `/subscription`
- **Job seeker dashboard**: `/jobseeker/dashboard/stats`, `/applications`, `/saved-jobs`, `/recommended-jobs`, `/application-timeline`, `/skill-gap`, `/salary-insights`, `/activity-heatmap`, `/profile-completeness`
- **Admin dashboard**: `/admin/dashboard/overview`, `/analytics/users|companies|jobs|revenue`, `/health`, `/audit-logs`, `/settings` (GET/PATCH)
- **Analytics**: `/analytics/user-behavior`, `/market-trends`, `/funnel`, `/company/:id/performance`, `/revenue`, reports, export
- **Uploads**: `POST /uploads/upload`, `/upload-multiple`, `/signature` (also avatar/logo/cover endpoints on users/companies)
- **Emails / Telegram**: admin-only screens

---

# Environment Variables (frontend `.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:5000
```

---

# PHASES

## Phase 0 — Foundation & Design System

Goal: a solid, branded foundation every later phase builds on.

Deliverables:

1. Scaffold Next.js (App Router, TypeScript, Tailwind) — done via create-next-app.
2. Folder structure: feature-oriented under `src/`:
   - `app/` (routes), `components/ui` (design-system primitives), `components/layout`, `components/shared`
   - `lib/` (api client, query client, auth session), `types/` (backend types), `hooks/`, `config/`
3. Implement the JobLink identity from `UI_DESIGNE.MD` §2 as Tailwind theme tokens:
   - Brand colors (primary, surfaces, semantic success/error/warning), typography scale, spacing scale, radii, shadows — consistent, not generic.
4. Design-system components (`components/ui`): Button, Input, Textarea, Select, Checkbox, Radio, Badge, Avatar, Card, Table, Tabs, Modal, Dialog, Toast, Tooltip, Spinner, Skeleton, Pagination, EmptyState, ErrorState, FormField.
5. `cn()` utility (clsx + tailwind-merge). Global styles + accessible focus system.
6. API integration layer (`lib/api`): axios client with base URL, auth header injection, 401->refresh->retry, error normalization to the backend `message`. Query client + providers (TanStack Query).
7. Backend TypeScript types (`types/`): User, Company, Job, Category, Skill, Application, Notification, Conversation, Message, SavedJob + list meta.
8. Auth foundation: `AuthProvider` (session context), token storage, `useAuth`, route guards (`RequireAuth`, `RequireRole`), current-user fetch.
9. Layout shell: public header + footer, role-aware nav, responsive mobile nav.

Acceptance: the app starts, design tokens render consistently, API client loads `/auth/me` cleanly, navigation is responsive and role-aware, all core design-system components behave and are accessible. No phase 1 features.

---

## Phase 1 — Authentication & User Profile

Goal: the complete auth experience matches the backend exactly.

Deliverables:

1. Register (job_seeker / employer role toggle) with confirm-password, inline validation, success feedback ("check your email").
2. Login (email + password), loading/error handling, session persistence.
3. Logout + logout-all.
4. Email verification: `/verify-email/:token` page + resend-verification flow.
5. Forgot / reset password flows with `/reset-password/:token`.
6. Change password.
7. `GET /auth/me` -> global session; guard unknown/inactive user states.
8. Profile: update profile fields (`PATCH /auth/profile`), upload avatar (`POST /users/me/avatar`).
9. Single-role redirect logic after login (seeker -> seeker dashboard, employer -> company/employer dashboard).

Acceptance: full auth loop (register -> verify -> login -> refresh after expiry -> logout) works live against the backend; protected routes redirect correctly; unauthorized states handled.

---

## Phase 2 — Public Experience & Job Discovery

Goal: the strongest part of the product.

Deliverables:

1. Landing page per `UI_DESIGNE.MD` §5 (strong opening, Discover → Explore → Apply / Post → Find → Hire sections, featured jobs, categories, trusted-companies strip, not a generic template).
2. Job discovery: `GET /jobs` list with pagination, sort; job cards exposing title, company, location, type, salary, experience, skills, posted date, save action (`UI_DESIGNE.MD` §6).
3. Search + filters wired to `GET /search`, `/search/facets`, `/search/suggestions`: keyword, location, category, salary range, experience, employment type, remote, company. Filters must match what the backend supports. Mobile-specific filter layout.
4. Job details page with `UI_DESIGNE.MD` §7 hierarchy + obvious Apply primary action (redirects to auth if logged out).
5. Featured jobs section (`GET /jobs/featured`).
6. Companies: list, detail (`.../slug/:slug`), company search.
7. Categories & Skills public pages (tree + grouped skills).
8. Job seeker save/unsave a job; mark applied state on job cards.
9. Apply form (cover letter, resume, portfolio, expected salary, availability date) with React Hook Form + Zod matching `POST /applications/jobs/:jobId/apply` validation.
10. About + Contact pages.

Acceptance: discovery, filtering, pagination, and apply flows work against the real backend; all loading/empty/error states present; desktop + mobile layouts validated.

---

## Phase 3 — Job Seeker Experience

Deliverables (`GET /jobseeker/dashboard/...` + feature modules):

1. Seeker dashboard: stats cards (decision-oriented, per `UI_DESIGNE.MD` §8), recent activity, recommended jobs, notifications.
2. My applications: list + status, timeline (`/application-timeline`), withdraw, accept offer.
3. Saved jobs: list with notes + tags, unsave.
4. Notifications: list, unread count, mark read/all read, preferences.
5. Recommended jobs (`/recommended-jobs`), skill-gap analysis, salary insights, activity heatmap, profile-completeness widget.
6. Notifications + messaging entry points (messaging UI built fully in Phase 5; here wire navigation/links).

Acceptance: every screen reflects real backend data with loading/empty/error states; actions (withdraw, save, mark read) work; responsive.

---

## Phase 4 — Employer Experience

Deliverables:

1. Company management: create company, my companies, update, logo + cover upload, members (add/remove/role).
2. Job management: create/edit job (RHF+Zod matching all validation constraints), list my jobs, publish/close/archive, delete.
3. Employer dashboard: stats, analytics, application pipeline, company overview, team, subscription info (`/employer/dashboard/...`).
4. Applicants: per-job applicant list, applicant details, status management (`PATCH /applications/:id/status`), schedule interview, make offer, bulk status update.
5. Company performance analytics (`/analytics/company/:id/performance`).

Acceptance: employer can post -> manage -> hire end-to-end against the real backend; applicant pipeline reflects status changes; responsive.

---

## Phase 5 — Messaging & Real-Time

Deliverables:

1. Conversations list (direct + group), create direct (`/messages/conversations/direct`), group.
2. Message thread UI: send, edit, delete, mark read, attachments; pagination.
3. Conversation settings: rename/avatar, participants, archive/unarchive, leave.
4. Socket.io real-time integration using `NEXT_PUBLIC_WS_URL` + access token; new-message + read receipts update lists live.
5. Unread counts in nav.

Acceptance: real-time messaging works between two accounts live against the backend; read/unread and typing order stable; responsive inbox layout.

---

## Phase 6 — Admin Experience

Deliverables (`/admin/dashboard/...` + admin CRUD endpoints):

1. Admin dashboard: overview, health, audit logs, settings (GET/PATCH persisted via backend SiteSetting).
2. User management: list, search, stats, update role/status, delete.
3. Company management: list, verify (`/companies/admin/:id/verify`), update, delete.
4. Job management: list, feature, update, delete.
5. Categories & Skills admin CRUD.
6. Analytics: users/companies/jobs charts, revenue (respect `revenueAvailable:false` — do not render invented money), reports, export data.
7. Email admin & Telegram bot admin screens (match exposed endpoints only).

Acceptance: admin moderation workflows (verify company, feature job, suspend user, edit settings) persist and reflect after reload; analytics render real backend numbers; responsive.

---

## Phase 7 — Polish, Integration & Final QA

Status: **COMPLETE**

Deliverables:

1. Full responsive audit across mobile/tablet/desktop (no horizontal overflow, adapted tables/filters/nav). — **Done**: audit passed; tables wrapped in overflow containers, filters/nav adapt.
2. Accessibility pass (focus states, labels, contrast, reduced motion). — **Done**: `Modal` now traps focus and restores it on close; `Tabs` support roving tabindex + Arrow/Home/End navigation; unlabeled controls (archive button, search inputs, role/status selects, message composer textarea) received `aria-label`/`htmlFor`+`id`.
3. Every loading / empty / error / success state reviewed against `UI_DESIGNE.MD` §11. — **Done**: added `ErrorState` (with retry) to employer dashboard, admin dashboard, admin analytics, admin telegram, admin email, admin settings, messages screen, and to the previously missing employer my-jobs/applicants + admin users/jobs/companies/categories screens.
4. Performance: no unnecessary renders/requests, lazy loading, image optimization. — **Done**: review found no blocking issues.
5. Final end-to-end test of all major flows against the live backend (auth, each role, forms, errors, real-time). — **Done** for the verified flows; backend gap (admin list routes shadowed by `/:id`) found and fixed, with regression test `backend/test/adminRoutes.test.js` (4/4 passing). Full backend jest suite requires a `.env` with `MONGODB_URI`.
6. No mock data remains. Document any backend gap in `.ai/DECISIONS.md`. — **Done**: mock-data audit passed; backend gap documented and marked FIXED.

Acceptance: the app works, is easy to use, and **feels like JobLink**.