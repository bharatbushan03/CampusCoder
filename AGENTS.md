# CampusCoder AGENTS Guide

This file provides compact, repo-specific guidance for OpenCode agents. Read CLAUDE.md for full context; this is the quick-reference summary.

## Commands (from repo root)

| Command | What it does |
|---|---|
| `npm run dev` | Next.js dev (Turbopack) on :3000 |
| `npm run build` | Production build + standalone prep |
| `npm run lint` | ESLint (frontend only) |
| `npm run type-check` | `tsc --noEmit` (frontend only) |
| `npm run test` | `lint && type-check` — frontend smoke gate |
| `npm run test:unit` | `vitest run` (frontend) |
| `npm run production-check` | `lint && type-check && build` — pre-deploy gate |
| `npm run test:e2e` | Playwright against `npm run start`; screenshots into `docs/qa-screenshots/` |
| `npm run doctor` | `npx react-doctor@latest` |
| `cd frontend && npx vitest run <path>` | Run a single frontend unit test |
| `cd frontend && npx playwright test <spec>` | Run a single Playwright spec |
| `cd backend && npm run dev` | Backend (tsx watch) on :4000 |

**Full verification order:** `npm run test` → `npm run test:e2e`.

## Two-workspace layout

- `frontend/` — Next.js 16 App Router UI (port 3000)
- `backend/` — Express API service (port 4000, `tsx watch`)
- **The backend is the ONLY service with Supabase access.** The frontend never imports Supabase packages — all auth + data flows through `/api/*` (Next rewrites proxy to the backend; `BACKEND_INTERNAL_URL` env, default `http://localhost:4000`). Env configs are separate (`frontend/.env.local`, `backend/.env`).
- Migrations in `supabase/migrations/` — apply in lexicographic order; two series exist (`20260529...` and `20260716...`)

## App Router conventions (Next.js 16)

- No `middleware.ts`. Auth/redirect logic: route handlers / server actions live in `frontend/src/app/actions/` (`'use server'`).
- Server Actions live in `frontend/src/app/actions/` (files begin with `'use server'`). Relevant: `adminActions.ts`, `registrationActions.ts`, `emailActions.ts` — all thin proxies that forward to backend endpoints via `serverApi()`.
- Page components under `frontend/src/app/<segment>/page.tsx`. Admin under `frontend/src/app/admin/` with its own `layout.tsx` (server gate via `serverApi('/auth/me')`).
- Public pages: `HomePageClient`, `events/`, `events/[slug]/`, `events/archive/`, `dashboard/`, `resources/`, `showcase/`, `workshops/`, `about/`, auth flows, legal pages.
- Email React components (rendered HTML for Resend) live in `backend/src/components/emails/` — the frontend keeps `MeetingLinkAnnouncement.tsx` only for the admin preview modal.

## Backend API — the only data access layer

- Frontend data access: `frontend/src/lib/api.ts` (`api()`, browser fetch with JSON + `ApiError`), `frontend/src/lib/serverApi.ts` (`serverApi()`, forwards cookies, `no-store`), `frontend/src/lib/auth.tsx` (`AuthProvider`/`useAuth` context).
- Backend routers: `backend/src/routes/{auth,events,me,admin,emails,upload}.ts`. Admin routes use `requireAuth` + `requireRole('admin','organizer')`.
- Session: httpOnly cookies `cc_access`/`cc_refresh` set by the backend; recovery links land on `/reset-password#access_token=...`.
- Validation centralized in `backend/src/lib/validation.ts` (Zod) — frontend `frontend/src/lib/validation.ts` mirrors it for client-side UX only (authoritative checks happen on the backend).

## Gotchas (non-obvious)

- `frontend/src/lib/suppress-deprecations.ts` exists for a reason — do not delete without checking what's silenced.
- Root scripts delegate to the frontend via `npm --prefix frontend run <x>` — there is NO root `next`/`react` install (single instance lives in `frontend/`). **Never run bare `npm install` at the repo root**: npm's arborist treats `frontend/node_modules` as part of the root tree and prunes it. Reinstall from `frontend/` only.
- `next` is pinned to 15.5.23 (frontend + the root devDep copy used by eslint-config-next's babel parser). `output: 'standalone'` is enabled (re-enabled 2026-08 after the `d.createContext is not a function` crash caused by a duplicate `lucide-react` in the old root `node_modules`).
- `lucide-react` is pinned to 1.17.0 in the frontend — 1.25.0 ships without `dist/lucide-react.d.ts` and breaks type-checking.
- `app/not-found.tsx` + `app/global-error.tsx` exist on purpose: without them, Next prerenders `/404`/`/500` through the pages-router `_error.js`, which intermittently crashed with `Cannot read properties of null (reading 'useContext')` (VM-chunk race in the prerender worker). Keep them; do not remove thinking they're boilerplate.
- `eslint-config-next` is pinned to 16.2.6 (root) — 15.x ships legacy eslintrc-format configs that break the flat `eslint.config.mjs`.
- `prepare-standalone.mjs` re-wires the standalone output for `node .next/standalone/server.js`.
- E2E specs at `tests/e2e/` but run from `frontend/` — check `playwright.config.ts` at root.
- Migrations use timestamp prefixes (`YYYYMMDDhhmmss_*.sql`); apply in lexicographic order. Two unrelated series exist (`20260529...` vs `20260716...`); both must run.
- `npm audit` shows 2 moderate advisories (Next/PostCSS) with no safe fix — ignore.
- The **Do NOT make-up rule**: AGENTS.md explicitly forbids generic "Tips", "Common Tasks", "Support" stubs — keep only verified repo-specific guidance.
