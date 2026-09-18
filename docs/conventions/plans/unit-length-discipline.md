---
id: unit-length-discipline
tdr_reference: tdr/unit-length-discipline.md
generated: 2026-09-17
---

# Units grow wide, not deep

Read `tdr/unit-length-discipline.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Find the units that actually violate the shape rules.
   Files: all of `src/`
   Change: run R1's and R2's detection signals and produce one list of units — not files — that carry more than roughly a dozen statements, or nest `if`/loop/`try`/`switch` more than three deep (more than two on the client side). Do not use the file-length list from the module-length record for this: they measure different things and R3 says width is not a trigger. Record each hit as `file:line — unit name — statements / max depth`.
   Check: the list exists and names a unit and a reason for each entry.

2. Flatten the deepest control flow first.
   Files: the entries from item 1 whose violation is R2 (depth), most likely in `src/parsers/fit.ts`, `src/lib/prescription.ts`, `src/lib/records.ts` and `src/features/dashboard/generateDevData.ts`
   Change: refactor each with early returns, a guard clause, or an extracted step — never by re-indenting. Take the depth violations before the statement-count ones; a deep unit is the defect R2 names, and flattening it often takes the statement count down with it.
   Check: R2's signal reports no unit over three levels; `pnpm check && pnpm test -- --run`.

3. Extract from over-long components into hooks, not into same-module helpers.
   Files: the component entries from item 1, most likely `src/components/layout/Dock.tsx`, `src/features/map/DeckGLOverlay.tsx`, `src/features/settings/ThresholdsSection.tsx`, `src/features/sessions/charts/SessionChartsExplorer.tsx`
   Change: when a component's *statements* grow past R1, the extracted piece is a hook in its own module (R4), placed by the hook-placement rules — not a helper parked beside the component. The component body should end up reading as a list of hook calls and handler bindings. Where the *markup* is what grew, the extracted piece is a module-local sub-component in the same file, unexported (R5).
   Check: each listed component's body is within R1; `pnpm check && pnpm test -- --run && pnpm exec playwright test`.

4. Extract from over-long non-component units into topic-named modules.
   Files: the non-component entries from item 1, most likely in `src/lib/laps.ts`, `src/lib/weather.ts` and `src/packages/engine/gps.ts`
   Change: the extracted step goes to a topic-named module (R6), never to a catch-all beside the caller. For engine modules, keep the extraction inside `src/packages/engine/` and respect that package's own module layout and purity rules.
   Check: R1's signal reports no unit over roughly a dozen statements; `pnpm check && pnpm test -- --run`.

5. Leave the wide units alone, and say so in the commit.
   Files: any unit from item 1 that is long only because one statement is wide
   Change: no change. A `switch` exhausting a closed union, a long markup return, a static literal table or a long argument list may run far past a screenful and is left alone (R3). `src/lib/explanations.ts` and `src/packages/engine/zones.ts` are the likely instances. Name them in the commit message so the next reader knows they were considered.
   Check: none of the named units changed; `git diff --stat` shows no edit to them.

## Open items

R7 forbids adding a `max-lines` or `max-lines-per-function` budget to the linter. This record therefore contributes nothing to the tooling plan by design — the trigger is shape, and a line budget measures the wrong thing.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
