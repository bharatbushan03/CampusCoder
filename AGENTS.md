<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Next dev server (Turbopack) |
| `npm run build` | Production build (skips type-check — `ignoreBuildErrors: true`) |
| `npm run lint` | ESLint only |
| `npm run type-check` | `tsc --noEmit` |
| `npm run test` | `lint && type-check` |
| `npm run test:e2e` | Playwright (1 chromium project, runs against `npm run start`) |
| `npm run doctor` | `npx react-doctor@latest` |

Order: `npm run test` → `npm run test:e2e` for full verification.

## Key Architecture

- **No `middleware.ts`.** Next.js 16 uses `src/proxy.ts` (export a `proxy` function + `config.matcher`).
- **Supabase has 3 clients:** `src/utils/supabase/{server,client,admin}.ts`. The browser client (`client.ts`) gracefully degrades when env vars are placeholders.
- **Server Actions** live in `src/app/actions/` (`'use server'`).
- **All inputs validated** with Zod schemas in `src/lib/validation.ts`.
- **Path alias:** `@/*` → `./src/*`.

## Env (`.env.local`)

| Var | Scope |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`) | Public |
| `SUPABASE_SECRET_KEY` (or legacy `SUPABASE_SERVICE_ROLE_KEY`) | Server-only |
| `RESEND_API_KEY`, `ADMIN_EMAIL`, `NEXT_PUBLIC_SITE_URL` | Email |

## Database

Migrations in `supabase/migrations/` — apply manually via Supabase SQL Editor in filename order.

## Gotchas

- This file is gitignored (see `.gitignore`). Changes here are local-only.
- `next.config.ts` sets `allowedDevOrigins: ['*.trycloudflare.com']` and `turbopack.root`.
- E2E tests take screenshots into `docs/qa-screenshots/`.
- `npm audit` shows 2 moderate advisories (Next/PostCSS) with no safe fix — ignore.
