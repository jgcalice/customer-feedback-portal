# AB InBev Brand World Snapshot (Applied)

## Palette Tokens (Exact Hex)
- `black`: `#000000`
- `white`: `#ffffff`
- `gold`: `#e5b611`
- `lightGold`: `#f5e003`
- `darkGold`: `#d1a33c`
- `lightGrey`: `#efefef`
- `darkGrey`: `#c7c7c7`
- `red`: `#921a28`
- `blue`: `#325a6d`
- `beige`: `#d69e77`
- `green`: `#959b7b`
- `lightRed`: `#e88475`
- `brown`: `#3f1f14`

## Usage Constraints Applied
- Primary palette dominates product UI: gold gradient + white/black surfaces.
- Secondary palette (red/blue/beige/green/lightRed/brown) is accent-only.
- Tertiary palette is reserved for charts/graphs only (not applied to core UI surfaces).

## Text-on-Background Rules Applied
- On gold gradient backgrounds: black text only.
- On black backgrounds: white, lightGold, or darkGold text.
- On lightGrey, darkGold, white, lightGold, darkGrey backgrounds: black text only.
- Enforced by default utility guardrails in global styles and in design-system rules.

## Logo + Tagline Constraints
- Logo must never be stretched/squeezed/manipulated.
- Clear space required around the logo on all sides.
- Preferred placement: top-left (app shell) or bottom sign-off.
- Tagline approved text: `To a Future With More Cheers`.
- Symbol expressions are restricted and require special permission; not introduced in product UI.

## Graphic System + Patterning Constraints
- Symbol-curve compositions and patterning are subtle-only.
- Do not place patterning behind dense forms/tables/data-heavy surfaces.

## Typography Rules Applied
- Primary typeface target: Avantt.
- Current implementation uses fallback stack (`Inter`, `system-ui`) to preserve scale/weights.
- TODO: add licensed Avantt files under `public/fonts/avantt/` and wire via `@font-face`.

## Accessibility Constraints
- Minimum focus visibility: 2px ring with offset on interactive elements.
- Product UI target: WCAG 2.1 AA contrast for text/background combinations.

## Verification TODOs (Brand World)
- TODO: Verify official minimum logo clear-space measurement ratio in Brand World.
- TODO: Verify if tagline placement is mandatory on all shells or optional by product type.
- TODO: Verify any legal/compliance lockups required when logo is shown without symbol.
