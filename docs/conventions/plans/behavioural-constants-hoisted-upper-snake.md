---
id: behavioural-constants-hoisted-upper-snake
tdr_reference: tdr/behavioural-constants-hoisted-upper-snake.md
generated: 2026-09-17
---

# Behavioural constants hoisted to module scope in UPPER_SNAKE_CASE

Read `tdr/behavioural-constants-hoisted-upper-snake.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Hoist the inline behavioural numbers in the toast store.
   Files: `src/components/ui/toastStore.ts`
   Change: `draft.toasts.slice(-5)` appears three times with the bare literal `5`, which is a bound governing behaviour. Declare `const MAX_VISIBLE_TOASTS = 5;` at module scope above the store and use it at all three sites. The existing `PROGRESS_TOAST_ID` is already the correct shape and stays.
   Check: `grep -n "slice(-5)" src/components/ui/toastStore.ts` returns nothing; `pnpm test -- --run tests/components/ui/toastStore.spec.ts` passes.

2. Sweep the feature and lib modules for inline thresholds, delays and bounds.
   Files: all of `src/` except `src/packages/engine/`
   Change: run R1's detection signal. For every numeric literal that governs behaviour — a debounce delay, a gesture threshold, a simplification tolerance, an upper or lower bound, a retry count, a fallback used when an input is absent — declare it as a module-scope `const` in `UPPER_SNAKE_CASE` above the unit that reads it (R1, R2), named for the reason it exists rather than its value, with a `DEFAULT_` prefix where it supplies an absent input and a unit suffix on a duration (R7). `src/features/settings/ThresholdsSection.tsx` (debounce delay), `src/packages/gpx/simplifyGpxPoints.ts` (tolerance) and `src/features/map/` (pick radius, zoom bounds) are the likely sites.
   Check: R1's signal reports no unnamed behavioural literal; `pnpm check && pnpm test -- --run`.

3. Leave one-off structural CSS and Tailwind classes inline.
   Files: all `.tsx` under `src/`
   Change: no change. R4 keeps a structural value inline when it is meaningful only where it sits and is read by nothing else — `flex-shrink-0`, `min-w-0`, `overflow-hidden`, a single `z-10` lift over one adjacent sibling. Hoisting those into constants makes the markup harder to read, not easier. Hoist a layering value only once there is a scheme of two or more named layers, which `src/features/map/mapZ.ts` already provides for the map.
   Check: `git diff --stat` shows no `.tsx` changed for this item.

4. Confirm no design value was laundered into a behavioural constant.
   Files: the constants introduced in items 1 and 2
   Change: R5 rules out hoisting a colour, spacing, radius, shadow or typeface literal into a named constant — that is the design-token record's territory and a name does not launder it. Review each new constant and move any design value into the token module instead.
   Check: none of the new constants holds a hex colour, a spacing value or a font size; `pnpm check`.

5. Keep each constant unexported and colocated unless a sibling reads it.
   Files: the constants introduced in items 1 and 2
   Change: R6 declares the constant unexported in the module that reads it. Export it only when a sibling module or a spec reads it, and R8 forbids collecting them into a central constants module — `src/lib/tokens.ts` is the design-token module and is not a home for behavioural constants.
   Check: `pnpm check` passes with every unnecessary `export` removed.

## Open items

`src/packages/engine/` is out of this record's scope: `src/packages/engine/CLAUDE.md` already fixes the same rule for that package — `UPPER_SNAKE_CASE`, exported, declared at file top, lookup tables as `Record<>` or `Map<>` — and adds a citation requirement this record does not carry. Do not apply items 2, 4 or 5 inside the engine.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
