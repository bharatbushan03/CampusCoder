# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Read `AGENTS.md` first.** It contains critical "this is NOT the Next.js you know" warnings about the Next.js 16 / proxy.ts / Supabase-3-clients conventions, plus the canonical commands table and env-var reference.

## Project Layout

CampusCoder is a monorepo with two independently-installed npm workspaces and a shared scripts folder:

```
CampusCoder/
├── frontend/             # Next.js 16 app (App Router) — runs from here for UI work
├── backend/              # Express + TypeScript API service (separate port, separate env)
├── supabase/migrations/  # SQL migrations applied manually via Supabase SQL Editor, in filename order
├── deploy/aws-free-tier/ # nginx unit + env example for free-tier EC2 deploy
├── tests/e2e/            # Playwright specs (root-level, runs against `npm run start`)
├── docs/                 # supabase_setup, email_setup, aws-deployment, security_audit
└── scripts/              # accessibility-check, lighthouse-audit, prepare-standalone
```

The repo-root `package.json` and `frontend/package.json` / `backend/package.json` each have their own scripts. Root-level commands are convenience wrappers that `cd` into the right workspace (e.g. `npm run dev` → `cd frontend && next dev`).

## Commands

Run from repo root unless noted.

| Command | What it does |
|---|---|
| `npm run dev` | Next.js dev server (Turbopack) on :3000 |
| `npm run dev --prefix backend` | Backend dev server (tsx watch) on :4000 |
| `npm run build` | Production frontend build + standalone prep |
| `npm run lint` | ESLint (frontend) |
| `npm run type-check` | `tsc --noEmit` (frontend) |
| `npm run test` | `lint && type-check` — front-end smoke gate |
| `npm run test:unit` | vitest (frontend) |
| `npm run production-check` | `lint && type-check && build` — pre-deploy gate |
| `npm run test:e2e` | Playwright against `npm run start`; screenshots into `docs/qa-screenshots/` |
| `npm run doctor` | react-doctor |
| `cd frontend && npx vitest run <path>` | Run a single frontend unit test |
| `cd frontend && npx playwright test <spec>` | Run a single Playwright spec |

Full verification order: `npm run test` → `npm run test:e2e`.

## Architecture

**Two-process system.** The Next.js app serves UI and Server Actions; the Express backend exposes REST routes for backend-specific work (admin tooling, email rendering, integrations that don't belong in a Server Action). Both talk to the same Supabase project. See `backend/src/server.ts` for the route map (`/health`, `/api/announcements`, `/api/registrations`, `/api/admin`, `/api/emails`).

**Frontend — App Router conventions (Next.js 16):**

- No `middleware.ts`. Auth/redirect logic lives in `frontend/src/proxy.ts` (`export function proxy` + `export const config = { matcher: [...] }`).
- Server Actions live in `frontend/src/app/actions/` (files begin with `'use server'`). The two currently relevant: `adminActions.ts`, `registrationActions.ts`.
- Routes are page components under `frontend/src/app/<segment>/page.tsx`. Admin lives under `frontend/src/app/admin/` with its own `layout.tsx` + `AdminSidebar.tsx`. Several routes use a `*PageClient.tsx` companion for the client component — pattern: server `page.tsx` fetches, `<Client>.tsx` handles interactivity.
- Public pages: `HomePageClient`, `events/`, `events/[slug]/`, `events/archive/`, `dashboard/`, `resources/`, `showcase/`, `workshops/`, `leaderboard/`, `about/`, auth flows (`login/`, `signup/`, `forgot-password/`, `reset-password/`), legal (`privacy/`, `terms/`).
- Email React components (rendered to HTML for Resend) live in both `frontend/src/lib/registrationEmails.tsx` and `backend/src/lib/registrationEmails.tsx` — keep them in sync.
- Validation is centralized in `frontend/src/lib/validation.ts` (Zod) and mirrored by `backend/src/lib/validation.ts`.

**Supabase usage.** Three clients in `frontend/src/utils/supabase/`:

- `server.ts` — cookie-based, for Server Components / Server Actions.
- `client.ts` — browser singleton; **gracefully degrades to a no-op when env vars are placeholders** so the app builds/runs in CI without secrets.
- `admin.ts` — service-role, server-only; bypasses RLS.
- Config helpers (`getSupabaseUrl`, `getSupabasePublicKey`, …) are in `config.ts`.

A separate `frontend/src/lib/supabase.ts` and `backend/src/lib/supabase.ts` exist — confirm which one a given file imports before adding new Supabase code.

**Backend.** Express + Zod + Resend. Routes in `backend/src/routes/`. Shared utilities in `backend/src/lib/{email,errors,eventSchedule,registrationEmails,supabase,validation}.ts`. The backend has its own `.env` (see `backend/.env.example`), its own tsconfig, and uses `tsx watch` for dev.

## Gotchas (non-obvious)

- `frontend/src/lib/suppress-deprecations.ts` exists for a reason — do not delete without checking what's silenced.
- `next.config.js` enables `allowedDevOrigins: ['*.trycloudflare.com']` and sets `outputFileTracingRoot`; `output: 'standalone'` is enabled. `next` is pinned to 15.5.23; `lucide-react` pinned to 1.17.0 (1.25.0 ships no `.d.ts`); root `eslint-config-next` pinned to 16.2.6 (15.x ships legacy eslintrc flat configs). Root scripts delegate to `frontend/` — never run bare `npm install` at the root (it prunes `frontend/node_modules`).
- `app/not-found.tsx` + `app/global-error.tsx` exist on purpose: without them Next prerenders `/404`/`/500` via the pages-router `_error.js`, which intermittently crashed with `Cannot read properties of null (reading 'useContext')` (VM-chunk race in the prerender worker). Do not remove them.
- `prepare-standalone.mjs` re-wires the standalone output for `node .next/standalone/server.js`.
- E2E specs live at repo root in `tests/e2e/` but run from `frontend/` — check `playwright.config.ts` at root.
- Migrations use timestamp prefixes (`YYYYMMDDhhmmss_*.sql`); apply in lexicographic order. Two unrelated migration series exist (`20260529...` vs `20260716...`); both must run.
- `npm audit` shows 2 moderate advisories (Next/PostCSS) with no safe fix — ignore.
- The Do NOT-make-up rule: AGENTS.md explicitly forbids generic tips sections — don't add "Common Tasks", "Tips", "Support" stubs.
