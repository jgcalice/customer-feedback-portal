# What Changed — UI/UX Upgrade Summary

**Scope:** Design system lock, showcase page, foundations, components, and systematic application. No IA, flows, features, or copy changed.

---

## 1. Deliverables

| Deliverable | Location |
|-------------|----------|
| Plan + file strategy | `docs/PLAN-UI-UPGRADE.md` |
| UI Baseline Report | `docs/UI-BASELINE-REPORT.md` |
| Design tokens (high-level) | `design/design.json` |
| Component specs (detailed) | `design/design-system.json` |
| Design system showcase | **Route:** `/design-system` · **File:** `src/app/design-system/page.tsx` |
| Empty state component | `src/components/EmptyState.tsx` |

---

## 2. Code and Config Changes

### Foundations
- **`src/app/globals.css`**  
  - Default radius increased from `0.25rem` (4px) to `0.375rem` (6px) in both `:root` and `.dark` for a slightly softer, more consistent look on cards and buttons.

### New Files
- **`design/design.json`** — Brand tone, spacing scale, typography scale (with Tailwind class mapping), colors, radii, shadows, icon sizing, interaction rules.
- **`design/design-system.json`** — Button variants (primary/secondary/ghost/destructive) and states, input/select/textarea/card specs, nav, toast, badge, table, empty/error/loading patterns, a11y rules.
- **`src/app/design-system/page.tsx`** — Showcase page rendering typography, spacing scale, color palette, buttons (primary/secondary/disabled, destructive), form controls, cards, StatusBadge, empty/error/loading states, toast reference.
- **`src/components/EmptyState.tsx`** — Reusable empty state: message + optional CTA link (Next.js `Link`), with focus ring.

### Components Updated
- **`Nav.tsx`** — All links and the Logout button now have `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` (and `rounded-md` where needed) for keyboard visibility.
- **`ToastProvider.tsx`** — Close button (“Fechar”) given the same focus ring pattern.

### Pages Updated
- **`page.tsx` (Home)** — “Recent problems” empty state uses `<EmptyState message="No problems yet." actionLabel="Create the first one" actionHref="/problems/new" />` instead of plain text.
- **Login, Problems (list/detail/new), Admin** — All primary action buttons (Submit, New Problem, Save current view, Export CSV, Post comment, Me afeta, Add, Merge) and the problem-detail “Me afeta” control now use the same focus ring: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`.

---

## 3. Where to Look

- **Design tokens and component specs:**  
  `design/design.json` and `design/design-system.json`.
- **Visual and interaction reference:**  
  Open the app and go to **`/design-system`** to see typography, spacing, colors, buttons, form controls, cards, badges, empty/error/loading, and toasts.
- **Reusing empty states:**  
  Import `EmptyState` from `@/components/EmptyState` and pass `message` and optionally `actionLabel` + `actionHref`.
- **Consistent focus:**  
  For new buttons/links, add:  
  `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`  
  (and `rounded-md` on buttons so the ring fits).

---

## 4. How to Extend the System

1. **New components**  
   Define them in `design/design-system.json` (variants, states, a11y), then implement to match. Add a section to `/design-system` so they stay the single source of truth.

2. **New tokens**  
   Add variables to `:root` / `.dark` in `globals.css`, then to `@theme inline` if they should be Tailwind utilities. Document in `design/design.json`.

3. **Spacing and type**  
   Use the scales in `design.json` (e.g. 4/8/12/16/24/32 for spacing; pageTitle/sectionTitle/body/caption/label for type). Prefer semantic tokens (e.g. `text-card-foreground`, `bg-muted`) over ad-hoc colors.

4. **Loading / error patterns**  
   Reuse the patterns shown on `/design-system` (text + optional spinner; inline vs block error). Consider extracting a small `LoadingState` or `ErrorBlock` component if you add more async pages.

---

## 5. What Was Not Done (by design)

- No layout or navigation structure change (no sidebar, no new routes besides `/design-system`).
- No new dependencies (no shadcn or other UI kit).
- No copy or feature changes.
- No systematic replacement of every secondary button with the design-system focus ring (only primary and Nav/Toast); you can roll the same pattern out to the rest in a follow-up.
- No dedicated loading skeletons (only “Loading...” text and the spinner sample on the showcase); can be added later using the same tokens.

---

## 6. QA Notes

- **Build:** `npm run build` passes.
- **Lint:** Run `npm run lint` and fix any reported issues.
- **Manual checks:**  
  - Keyboard tab through Nav, Login, Problems list, and Admin; confirm focus ring is visible.  
  - Home “Recent problems” empty state shows the new EmptyState with link.  
  - `/design-system` renders all sections without errors.  
  - Radii look consistent on cards and buttons (6px base).

---

*End of summary.*
