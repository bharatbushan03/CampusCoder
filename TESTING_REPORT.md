# CampusCoder Testing Report

Date: May 30, 2026

## Summary

Completed a full QA, security, build, and production-readiness pass for CampusCoder. The project now builds successfully on Next.js 16, has automated Playwright smoke coverage, uses the new `proxy.ts` convention, blocks several registration/event security edge cases, and handles placeholder/local Supabase configuration without browser console errors.

## Commands Run

| Command | Result | Notes |
| --- | --- | --- |
| `npm install` | Passed | Dependencies installed; npm audit still reports 2 moderate advisories in Next/PostCSS with no safe non-breaking fix available. |
| `npm run lint` | Passed | 0 errors, remaining warnings documented below. |
| `npm run type-check` | Passed | `tsc --noEmit` clean. |
| `npm run build` | Passed | Production build completed successfully. |
| `npm run test` | Passed | Runs lint + type-check. |
| `npm run dev` | Passed | Dev server started at `http://localhost:3000`; stopped after testing. |
| `npm run test:e2e` | Passed | 5 Playwright Chromium smoke tests passed against `next start`. |

## Automated Tests Added

Added `playwright.config.ts` and `tests/e2e/smoke.spec.ts`.

Covered:
- Public route load checks for home, events, archive, workshops, resources, auth, and registration pages.
- SEO title, description, favicon metadata.
- Browser console/page error checks.
- Mobile navigation opening and key links.
- Anonymous redirects for `/dashboard` and `/admin`.
- Registration form native validation.
- Home page internal link status checks.

Screenshots:
- `docs/qa-screenshots/home-chromium.png`
- `docs/qa-screenshots/home-mobile-chromium.png`

## Modules Tested

Passed with automation or code-level verification:
- Public website: home, navbar, footer/internal links, responsive mobile nav, metadata, favicon.
- Events listing: load path, search/filter UI presence, status display logic, event card routing.
- Event details: slug route loading, banner rendering, status messages, public draft exclusion logic, meeting link privacy.
- Registration: required field validation, server action validation, duplicate registration handling, deadline/status blocking, email failure tolerance.
- Auth/protection: signup/login pages load, forgot/reset pages load, anonymous dashboard/admin redirects, admin role check in proxy.
- Student/admin dashboards: route protection and page build coverage.
- Admin event management: server action role validation, slug duplicate message, banner validation/upload path, owner insertion.
- Registration management: UI build coverage, attendance status paths, CSV export code path reviewed.
- Community links/announcements/resources: UI route load/build coverage, active-only public query intent, RLS reviewed.
- Email/meeting link: server-only Resend key usage, meeting link send role check, sent timestamp update path reviewed.
- Supabase/RLS: schema and migrations reviewed for public/private table access, FK linkage, duplicate registrations, storage policies.

## Bugs Found And Fixed

- Fixed Next.js 16 production build failure caused by incomplete Supabase generated type shape.
- Replaced deprecated `src/middleware.ts` with `src/proxy.ts`.
- Added `type-check`, `test`, and `test:e2e` scripts.
- Fixed Turbopack root warning by setting `turbopack.root`.
- Fixed broken duplicate registration migration where a literal `` `n`` could comment out the SQL.
- Added `rate_limits` to database types.
- Hardened registration server action:
  - validates event UUID,
  - blocks non-published, completed, past, and deadline-expired events,
  - checks duplicate email/event registrations,
  - keeps saving registration even if email fails,
  - uses hashed email keys for server-side throttling when service role is configured.
- Hardened event creation/editing:
  - preserves `banner_url`,
  - validates time order,
  - reports duplicate slugs with a friendly error.
- Prevented public exposure of event meeting links on event details pages.
- Added completed/cancelled public event status handling.
- Added event banner rendering on details page.
- Switched major public images from `<img>` to `next/image`.
- Added Supabase Storage bucket and RLS policies for `banners`.
- Added a local placeholder Supabase client stub so demo `.env.local` values do not create browser console errors.
- Fixed JSX text lint errors and email quote escaping.
- Added mobile nav accessible label.
- Updated `.env.example` with server-only service role documentation.
- Added `.gitignore` entries for Playwright/test artifacts and temp dev logs.

## Failed Tests Observed During QA

- Initial `npm run build` failed on Supabase type inference. Fixed.
- Initial `npm run lint` failed with JSX errors and strict lint issues. Fixed to 0 errors; broad prototype typing items remain warnings.
- Initial Playwright smoke check failed due placeholder Supabase host network errors. Fixed with configured-env guard/stub.
- Initial mobile nav test failed due ambiguous login link selector. Fixed test and added accessible menu label.
- Full two-project Playwright run was unstable on Windows due server lifecycle/memory pressure. Reworked E2E to one Chromium project with explicit mobile viewport coverage.

## Remaining Issues

- `npm audit` reports 2 moderate advisories from Next/PostCSS. The suggested npm fix would downgrade Next to an unsafe/breaking version, so it was not applied.
- Lint passes but still reports warnings for legacy `any`, unused imports, and React Compiler advisory rules. These do not block build/test, but should be cleaned in a later type-hardening pass.
- Real Supabase writes, real Auth signup/login email verification, real Storage upload, and Resend email delivery could not be executed because the local `.env.local` uses placeholder Supabase values and no live URL/admin credentials were provided.
- Live Vercel deployment testing, live admin login, live registration, and live email delivery remain environment-dependent.

## Manual Testing Checklist

- [x] Home page loads.
- [x] Public navigation links load.
- [x] Mobile nav opens and exposes key links.
- [x] Anonymous `/dashboard` redirects to login.
- [x] Anonymous `/admin` redirects to login.
- [x] Registration form blocks invalid required input.
- [x] Production build starts and serves pages.
- [ ] Run migrations on a real Supabase project.
- [ ] Create admin/organizer account and verify admin CRUD flows against production data.
- [ ] Register for a real event and verify Supabase row creation.
- [ ] Verify duplicate registration block in production.
- [ ] Upload a real banner to Supabase Storage.
- [ ] Send real Resend confirmation/admin/meeting-link emails.
- [ ] Test live Vercel URL after deployment.

## Production Readiness Checklist

- [x] Production build passes.
- [x] Type-check passes.
- [x] Lint passes with 0 errors.
- [x] E2E smoke suite passes.
- [x] `.env*` files are ignored except `.env.example`.
- [x] Service role key is server-only and documented.
- [x] Admin routes protected by server-side role checks.
- [x] Draft events blocked from public route queries.
- [x] Meeting links hidden from public event pages.
- [x] Registration validates server-side with Zod.
- [x] Duplicate registration protected in app and database migration.
- [x] Storage bucket policies added.
- [ ] Configure real Vercel environment variables.
- [ ] Run Supabase migrations in production.
- [ ] Verify Resend domain/DKIM/SPF.
- [ ] Address npm advisory when Next releases a safe patched version.
