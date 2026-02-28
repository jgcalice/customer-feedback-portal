# UI Baseline Report

## Repository + Runtime Baseline
- Framework: Next.js 16 (App Router), React 19, TypeScript.
- Styling: Tailwind CSS v4 via `@tailwindcss/postcss`, theme tokens in global CSS.
- Data/UI architecture: server components + client components, Prisma + SQLite.
- Runtime verification (local dev at `http://localhost:3000`):
  - `/` -> `200`
  - `/problems` -> `200`
  - `/problems/new` -> `200`
  - `/roadmap` -> `200`
  - `/login` -> `200`
  - `/admin` -> `307` (auth gate working)

## Top 5 Product Screens / Flows
1. Dashboard summary (`/`)
2. Suggestions list, filters, sorting, pagination (`/problems`)
3. New suggestion submission (`/problems/new`)
4. Suggestion detail + comments + interest (`/problems/[id]`)
5. Roadmap visibility (`/roadmap`) and admin controls (`/admin`) for internal users

## Issues By Severity

### Critical
- Brand palette is not aligned with AB InBev token set and usage constraints.
- No explicit text/background rule guardrails for the required ADA combinations.
- No Brand World snapshot in repo documenting applied constraints.

### High
- Visual hierarchy varies between pages (hero, stats, and section headings differ in emphasis).
- Surface system is inconsistent (multiple card/button treatments with drift in contrast/weight).
- Focus/keyboard styles exist but are not fully standardized as reusable system rules.

### Medium
- Typography stack does not target Avantt and lacks an explicit font onboarding path.
- Border/radius/shadow rhythm is close but not locked to a single reusable scale.
- Secondary/tertiary color usage boundaries are not encoded in design docs.

### Low
- Design system page is useful but does not yet codify brand compliance checks.
- Navigation shell lacks explicit documentation for logo clear-space/tagline constraints.

## 10 Highest-Leverage Fixes
1. Introduce AB InBev token source of truth in `styles/tokens.css`.
2. Wire semantic theme tokens to Tailwind v4 via `@theme inline`.
3. Add short Brand World rule snapshot (`design/brandworld_snapshot.md`).
4. Standardize global surface primitives (background, card, border, ring, focus).
5. Enforce text-on-background rules in global guardrail selectors.
6. Lock typography scale/weights in `design/design.json`.
7. Update component contract states + accessibility matrix in `design/design-system.json`.
8. Add explicit TODO workflow for Avantt font drop-in.
9. Use primary gold gradient intentionally on high-emphasis surfaces only.
10. Keep dense data surfaces neutral (white/light grey) for readability and contrast stability.
