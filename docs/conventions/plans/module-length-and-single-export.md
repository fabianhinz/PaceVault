---
id: module-length-and-single-export
tdr_reference: tdr/module-length-and-single-export.md
generated: 2026-09-17
---

# Small modules, one component per implementation file

Read `tdr/module-length-and-single-export.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Split the two largest layout and map modules.
   Files: `src/components/layout/Dock.tsx` (439 lines), `src/features/map/DeckGLOverlay.tsx` (371 lines)
   Change: both are past R1's ~200-line ceiling. Move their stateful behaviour into colocated `use*` modules under the directory's `hooks/` (R6) and their module-local sub-components into their own files where a second module needs them, or keep them unexported in place where nothing else does (R4). The implementation file keeps the render tree.
   Check: both files are under 200 lines; `pnpm check && pnpm test -- --run && pnpm exec playwright test`.

2. Split the over-long feature components.
   Files: `src/features/settings/ThresholdsSection.tsx` (352), `src/features/sessions/laps/LapPickPopup.tsx` (322), `src/features/sessions/charts/SessionChartsExplorer.tsx` (306), `src/features/dashboard/LoadChart.tsx` (287), `src/features/sessions/session/SessionStatsGrid.tsx` (249), `src/features/studio/markers/StudioMarkerDialog.tsx` (223), `src/features/sessions/session/WeatherChips.tsx` (205)
   Change: same treatment as item 1, one file at a time. Take `ThresholdsSection.tsx` first — it holds a hand-rolled debounce and an effect, both of which are behaviour that belongs in a hook.
   Check: each listed file is under 200 lines; `pnpm check && pnpm test -- --run`.

3. Split the over-long `src/lib/` and engine modules by subject, not by size.
   Files: `src/lib/laps.ts` (428), `src/lib/prescription.ts` (375), `src/lib/weather.ts` (344), `src/lib/records.ts` (327), `src/lib/explanations.ts` (306), `src/lib/formatters.ts` (222), `src/lib/indexeddb.ts` (204), `src/packages/engine/gps.ts` (285), `src/packages/engine/zoneDistribution.ts` (221), `src/packages/engine/trainingEffect.ts` (209)
   Change: for each, apply the topic test before the size test — split only where the exports have stopped sharing a subject, and name the new module for the topic that left. A module that is long because it holds one wide literal table (`explanations.ts` is the likely case) is left alone; length alone is not the trigger for a helper module, and the unit-shape record owns that argument. Record which you split and which you left.
   Check: `pnpm check && pnpm test -- --run`; every remaining module over 200 lines is named in the commit message with the reason it stayed.

4. Confirm the one-component-per-implementation-file rule holds.
   Files: all `.tsx` under `src/`
   Change: run R2's detection grep. A `.tsx` implementation file exports exactly one renderable component, named after the file. Additional components in the module stay unexported (R3). `src/components/ui/Tabs.tsx` exports four (`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`) — that is a compound component family and is handled by the component-directory plan, not here; leave it and note it.
   Check: R2's grep reports only the compound families named in the commit message; `pnpm check`.

5. Check the two remaining large non-component modules.
   Files: `src/lib/factories/records.ts` (405), `src/features/dashboard/generateDevData.ts` (398), `src/parsers/fit.ts` (290)
   Change: `generateDevData.ts` and `factories/records.ts` are largely static literal data, which R1 does not target — confirm that is what they are and leave them. `src/parsers/fit.ts` is behaviour and gets the item-3 treatment.
   Check: `pnpm check && pnpm test -- --run tests/parsers`.

## Open items

R7 (at most one value re-exported per source path from a public barrel) and R8 (exporting an unguarded inner variant for its spec) are Moot: this project publishes no barrel, and no component wraps an inner variant in a guard. Neither rule is carried in the TDR reference.

This record and the unit-shape record can pull against each other — this one caps the module, that one explicitly refuses to. Where they disagree about a module that is long because one statement is wide, the unit-shape record wins and the module stays.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
