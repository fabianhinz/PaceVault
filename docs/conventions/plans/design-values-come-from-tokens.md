---
id: design-values-come-from-tokens
tdr_reference: tdr/design-values-come-from-tokens.md
generated: 2026-09-17
---

# Design values come from the token layer, never from literals

Read `tdr/design-values-come-from-tokens.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Consolidate the two colour modules into one authoring home.
   Files: `src/lib/colors.ts`, `src/lib/tokens.ts`, `src/index.css`, plus importers of `SURFACE_BASE`
   Change: `src/lib/colors.ts` exports a single constant, `SURFACE_BASE`, while `src/lib/tokens.ts` holds the full token object mirroring the `@theme` block in `src/index.css`. Two authoring modules for one concern defeats R8. Move `SURFACE_BASE` into `src/lib/tokens.ts` as a token member, delete `src/lib/colors.ts`, and update its importers — `vite.config.ts` imports it for the PWA manifest's `theme_color` and `background_color`, so check that import path too.
   Check: `src/lib/colors.ts` no longer exists; `grep -rn "lib/colors" src vite.config.ts` returns nothing; `pnpm check && pnpm build`.

2. Route the chart theme's literals through the token module.
   Files: `src/lib/chartTheme.ts`
   Change: the module authors colour literals directly. Replace each with a read from `tokens` (R1, R2). Where a chart needs a colour no token expresses, add the token to `src/lib/tokens.ts` and to the `@theme` block in `src/index.css` in the same change — the CSS file is the source of truth and the two must not drift.
   Check: R2's grep reports nothing in `src/lib/chartTheme.ts`; `pnpm test -- --run` and a visual check that the charts still render in the dashboard.

3. Route the map and studio colour modules through tokens.
   Files: `src/features/map/zoneColoredPath.ts`, `src/features/studio/routeColors.ts`
   Change: same treatment. These author track and route colours as literals; they become token reads. Where a value is a genuine palette of distinguishable route colours rather than a semantic design value, keep the palette as one exported `UPPER_SNAKE_CASE` array in the token module and index it here.
   Check: R2's grep reports nothing in either file; `pnpm exec playwright test e2e/studio.spec.ts`.

4. Decide the engine's two colour-carrying modules deliberately.
   Files: `src/packages/engine/zones.ts`, `src/packages/engine/zoneDistribution.ts`
   Change: both author colour literals, and `src/packages/engine/CLAUDE.md` forbids the engine importing from `src/lib/`. Those two constraints cannot both hold with colours in the engine. Move the zone colour palette out of the engine into `src/lib/tokens.ts`, keyed by the zone-name union the engine already exports, and have the presentation layer look it up. The engine keeps the zone names and the thresholds; it stops knowing what they look like.
   Check: R2's grep reports nothing under `src/packages/engine/`; `pnpm test -- --run tests/engine && pnpm check`.

5. Sweep the remaining components for raw design values.
   Files: all `.tsx` under `src/`
   Change: run R2, R3, R4 and R7's signals. A colour, spacing, radius, shadow or typeface expressed as a raw value rather than a Tailwind theme class or a token read is a violation; a Tailwind utility that resolves to a theme token is the correct form and is not. An arbitrary-value class (`w-[80px]`, `text-[13px]`, `bg-[#0a0b0f]`) is the common escape and is what to look for.
   Check: R2's, R3's and R7's greps return nothing outside the token module; `pnpm check && pnpm build`.

6. Bind the genuinely untokenisable values to named constants.
   Files: wherever item 5 found a value that compensates for something outside the design system
   Change: R9's escape hatch is for a third-party primitive's internal geometry or a browser default — a MapLibre control's fixed offset, a Recharts tick width — not for a value the tokens could express. Bind each to a module-scope `UPPER_SNAKE_CASE` constant in the module that reads it, named for why the value exists. A colour, spacing, radius or typeface is never in this category.
   Check: every remaining raw value in `src/` is bound to a named constant with a reason in its name; `pnpm check`.

## Open items

R6 (layering from a z-index token set) is already satisfied by `src/features/map/mapZ.ts`, which is the map's named layer scheme. Confirm it after item 1 and extend it to any layering outside the map that uses a bare `z-[n]` class over a non-sibling.

R10 (typing a prop that carries a design value as a token key rather than `string`) is carried in the TDR reference but has no current violation to fix: no component under `src/components/ui/` currently takes a free-string colour prop. It is a guard for the first one that does.

R11 of the original — keep using the UI framework's own behaviour-carrying theme fields — is Moot: there is no MUI theme here, and Tailwind's own utilities are the equivalent and are not violations of R1.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
