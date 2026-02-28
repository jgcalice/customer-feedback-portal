# Plan: UI/UX Upgrade (10x Quality, Preserve Intent)

## Scope

- **Frameworks:** Next.js 16 (App Router), React 19, Tailwind CSS v4 (@tailwindcss/postcss), no component library.
- **Styling:** Single `globals.css` with CSS variables (`:root` / `.dark`) and `@theme inline` for Tailwind. No tailwind.config.js (v4 theme-in-CSS).
- **Routing:** App Router; key pages: `/`, `/login`, `/problems`, `/problems/[id]`, `/problems/new`, `/roadmap`, `/admin`, `/positioning`.
- **Components:** Nav, ToastProvider, StatusBadge only; rest is inline in pages.

## File-Level Strategy

| Area | Files to touch | Approach |
|------|----------------|----------|
| Design spec | **NEW** `design/design.json`, `design/design-system.json` | Formalize existing tokens + add spacing/type scale and component specs. |
| Showcase | **NEW** `src/app/design-system/page.tsx` | Single page rendering all primitives and states. |
| Foundations | `src/app/globals.css` | Add spacing scale, type scale (sizes/weights/line-heights), ensure tokens align with design.json. |
| Layout | `src/app/layout.tsx` | Optional: add CSS class for container/section consistency; keep structure. |
| Components | `Nav.tsx`, `ToastProvider.tsx`, `StatusBadge.tsx` | Unify to design-system specs (no API changes). |
| Pages | `page.tsx`, `login/page.tsx`, `problems/page.tsx`, `problems/[id]/page.tsx`, `problems/new/page.tsx`, `roadmap/page.tsx`, `admin/page.tsx`, `positioning/page.tsx` | Apply spacing/hierarchy/alignment; add consistent loading/empty/error patterns. |
| No new deps | — | No shadcn/UI kit; extend current Tailwind + CSS vars only. |

## Execution Order (reviewable batches)

1. **Batch 1:** Create `docs/UI-BASELINE-REPORT.md` (this phase).
2. **Batch 2:** Create `design/design.json` and `design/design-system.json`.
3. **Batch 3:** Add `/design-system` route and page (showcase).
4. **Batch 4:** Foundations in `globals.css` (spacing/type scale, any missing tokens).
5. **Batch 5:** Component pass (Nav, Toast, StatusBadge) to match design-system.
6. **Batch 6:** Page pass — home, login, problems list/detail/new, roadmap, admin, positioning (spacing, hierarchy, loading/empty/error).
7. **Batch 7:** Micro-interactions (focus, hover, transitions) and QA pass.

## Non-Goals

- No IA/flow/feature/copy changes unless approved.
- No new dependencies.
- No layout redesign (e.g. sidebar); keep single-column + nav.
- No random gradients or decorative clutter.

## Success Criteria

- Design system documented and showcased at `/design-system`.
- Consistent typography, spacing, colors, radii, shadows across app.
- All interactive components have clear default/hover/focus/disabled (and loading/error where applicable).
- Responsive (mobile/tablet/desktop) and keyboard/focus/contrast in good shape.
- App runs and builds after each batch.
