# UI Baseline Report — Customer Feedback Portal

**Date:** 2025-02  
**Scope:** All app routes and shared components. No IA/flow/feature changes.

---

## 1. Current Stack Summary

| Item | Current |
|------|--------|
| Framework | Next.js 16 (App Router), React 19 |
| Styling | Tailwind CSS v4, single `globals.css` |
| Theme | CSS variables in `:root` / `.dark`; `@theme inline` for Tailwind colors, radius, shadow, font |
| Component library | None (custom Nav, ToastProvider, StatusBadge) |
| Routing | `/`, `/login`, `/problems`, `/problems/[id]`, `/problems/new`, `/roadmap`, `/admin`, `/positioning` |

---

## 2. Top 5 Screens / Flows (by impact)

1. **Dashboard (Home) `/`** — First impression; hero + metrics + quick filters + recent problems.
2. **Problems list `/problems`** — Core flow: filters, workspace, list, pagination, “Me afeta.”
3. **Problem detail `/problems/[id]`** — Read problem, “Me afeta,” comments.
4. **Login `/login`** — Magic link; single form + feedback.
5. **Submit problem `/problems/new`** — Multi-field form; critical for submission.

*(Admin and Roadmap are secondary but still need consistency.)*

---

## 3. Current Issues by Severity

### Critical (hierarchy / clarity / a11y)

- **No defined type scale:** Mix of `text-2xl`, `text-3xl`, `text-lg`, `text-sm`, `text-xs` without a documented scale. Page titles and section titles are not consistently differentiated.
- **Focus visibility:** Only global `:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px }`. Buttons/inputs may not all get focus ring in all states (e.g. custom buttons).
- **Loading states:** Inconsistent: some pages show plain “Loading...” text, no skeleton or consistent placement.
- **Error/empty states:** Present but styled ad hoc (e.g. `text-destructive` for errors, `text-muted-foreground` for empty). No shared component or pattern for empty/error blocks.

### High (consistency / polish)

- **Spacing scale:** Uses Tailwind defaults (4px base) but no documented scale. Gaps like `gap-2`, `gap-3`, `gap-4`, `space-y-3`, `space-y-4`, `space-y-6`, `space-y-8`, `p-4`, `p-6`, `px-4 py-6` are mixed; section-to-section and block spacing feel uneven.
- **Button variants:** Primary (filled), secondary (border), destructive (border/background) exist but class strings are long and repeated; no single source of truth (e.g. `btn-primary`, `btn-secondary`).
- **Inputs/selects:** Styled with `border-input bg-background` etc., but height/padding/radius not standardized; some `rounded`, some `rounded-md`.
- **Cards:** Mix of `rounded-lg`, `rounded-md`; padding `p-4` vs `p-6`; shadow `shadow-sm` vs `shadow-lg`. No single “card” primitive.
- **Radii:** `--radius: 0.25rem` (4px) is very small; cards/buttons would benefit from slightly larger radius for a more premium feel (e.g. 6–8px for cards).

### Medium (responsiveness / density)

- **Responsiveness:** Some `sm:grid-cols-3`, `flex-wrap`, `max-w-5xl`; nav and problem list are flexible. No systematic breakpoints or container widths documented.
- **Density:** Problem list and admin tables are compact; no “comfortable” vs “compact” pattern.
- **Toast position/size:** Fixed `right-4 top-4`, `w-[min(24rem,...)]`; works but not part of a documented overlay/notification system.

### Low (nice-to-have)

- **Motion:** Almost no transitions except a few `transition-colors` / `transition-opacity`. No guidelines for duration/easing.
- **Icon sizing:** No icons in design system; no standard size (e.g. 16/20/24).
- **Success/warning tokens:** Success is implied via primary or card; no explicit `--success` or `--warning` in globals (only destructive).

---

## 4. 10 Highest-Leverage Changes

1. **Lock a type scale** — Define and use a small set of sizes (e.g. page title, section title, body, caption) and apply consistently.
2. **Lock a spacing scale** — e.g. 4/8/12/16/24/32/40/48; use for gaps, padding, and section margins.
3. **Single “card” pattern** — One border/radius/shadow/padding combo for all cards.
4. **Unify buttons** — Primary, secondary, ghost, destructive with fixed padding, height, radius, and states.
5. **Unify form controls** — Input, select, textarea: same height, padding, radius, border, focus ring.
6. **Standardize loading** — One pattern (e.g. spinner + text or skeleton) and reuse on all async pages.
7. **Standardize empty state** — One pattern (message + optional CTA) for “no problems,” “no roadmap,” etc.
8. **Standardize error display** — Inline form errors and page-level errors with same look (e.g. border-left + icon + text).
9. **Document and use radii** — Slightly increase default radius; use same radius for buttons, inputs, cards.
10. **Design-system showcase page** — One route that shows typography, spacing, colors, and every component/state so future work stays consistent.

---

## 5. Quick Wins (< 30 min each)

- **Add spacing scale to design** — Document 4/8/12/16/24/32 in `design.json` and use consistently in one pass on home + problems list.
- **Increase default radius** — e.g. `--radius: 0.375rem` (6px) in globals; quick visual upgrade.
- **Ensure all buttons have focus-visible** — Add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` (or equivalent) to primary/secondary buttons.
- **One shared “EmptyState” block** — Simple component: message + optional link; use on dashboard “no problems,” roadmap “no items,” admin “no problems yet.”
- **Design-system page skeleton** — Create `/design-system` with sections for type, colors, buttons, form controls, cards; fill incrementally.

---

## 6. What Already Works

- Semantic color tokens (primary, destructive, muted, card, background, foreground) are in place and used.
- Dark mode variables exist (`.dark`).
- Tailwind v4 theme uses CSS variables, so design tokens are centralized in CSS.
- Nav, toasts, and status badges use tokens; no hardcoded hex in components.
- Basic responsiveness (grid, flex-wrap, max-width) is present.
- Copy and flows are clear; no proposed copy or IA changes.

---

*Next: Create `design/design.json` and `design/design-system.json`, then the design-system showcase page.*
