---
id: mirrored-spec-layout
tdr_reference: tdr/mirrored-spec-layout.md
generated: 2026-09-17
---

# Specs live in a mirrored tests tree

Read `tdr/mirrored-spec-layout.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Move the engine specs under the path their subject actually has.
   Files: all 22 specs under `tests/engine/` → `tests/packages/engine/` and `tests/packages/gpx/`
   Change: the engine lives at `src/packages/engine/`, so its specs belong at `tests/packages/engine/`. Move `normalize`, `paceCalculator`, `trainingEffect`, `vdot`, `windExposure`, `zoneDistribution`, `zones`, `gps`, `formatter`, `stressPipeline`, `metricsCoaching` and the rest to the path that mirrors their subject. Several of these specs cover modules that are *not* in the engine — `downsample`, `dynamicLaps`, `fingerprint`, `lapMarkers`, `validation` are all under `src/lib/`, and `computePbsForSessions`, `groupPbsBySport`, `recordsPbs` cover `src/lib/records.ts`. Each moves to mirror its own subject, not to wherever its neighbours went.
   Check: the R2 mirror script in the TDR reference reports no unmatched spec under `tests/packages/`; `pnpm test -- --run`.

2. Move the hook specs into the mirrored hooks directories.
   Files: `tests/lib/useChartZoom.integration.test.ts`, `tests/lib/useExpandCard.spec.ts`, `tests/lib/useMapHover.integration.test.ts`, `tests/features/map/hooks/computePopupPosition.spec.ts`
   Change: their subjects live under `src/lib/hooks/` and `src/features/map/hooks/`, so the specs move to `tests/lib/hooks/` and the mirrored feature hooks path. Execute the hook-placement plan first if you are running both — it moves several of these subjects, and mirroring a module that is about to move means moving the spec twice.
   Check: R2's script reports no unmatched spec under `tests/lib/`; `pnpm test -- --run`.

3. Rename the store specs after the modules they cover.
   Files: `tests/store/sessionsStore.integration.test.ts`, `tests/store/userStore.integration.test.ts`, `tests/store/storeEngine.integration.test.ts`, `tests/store/deleteAllData.integration.test.ts`, `tests/store/studioPoints.integration.test.ts`
   Change: R3 requires the spec to reproduce its subject's filename exactly. `sessionsStore.integration.test.ts` covers `src/store/sessions.ts`, so it becomes `sessions.integration.test.ts`; `userStore` becomes `user`. The other three cover behaviour spanning several modules rather than one — under R10 they keep the mirrored path of their principal subject and take a qualifier segment before the suffix (`sessions.deleteAll.integration.test.ts`), or they move to the directory of the module they principally exercise. Decide per file and say which in the commit message.
   Check: R3's script reports no name mismatch; `pnpm test -- --run tests/store`.

4. Move the remaining unmirrored specs.
   Files: `tests/parsers/fitLaps.spec.ts`, `tests/features/studio/markerGeometry.spec.ts`, `tests/features/studio/routeSegments.spec.ts`
   Change: `fitLaps.spec.ts` covers lap mapping inside `src/parsers/fit.ts` — under R10 it becomes `tests/parsers/fit.laps.spec.ts` beside `fit.spec.ts`. `markerGeometry` lives at `src/features/studio/markers/markerGeometry.ts`, so its spec gains the `markers/` segment. Locate `routeSegments`' subject and mirror it likewise.
   Check: R2's and R3's scripts report nothing across the whole tree; `pnpm test -- --run`.

5. Colocate fixtures and confirm the setup file is the only tree-wide setup.
   Files: `tests/setup.ts`, `tests/factories/`, any binary or recorded fixture under `tests/`
   Change: R8 — a spec's own fixtures sit in the mirrored directory beside it; helpers shared across specs stay under `tests/factories/` and are imported through the `@tests` alias declared in `vitest.config.ts`. R7 — `tests/setup.ts` is the one setup file, registered only through `setupFiles`; no spec re-applies tree-wide setup.
   Check: `grep -rn "fake-indexeddb\|@testing-library/jest-dom" tests --include='*.spec.ts' --include='*.integration.test.ts'` returns nothing; `pnpm test -- --run`.

## Open items

R4 of the original chose between two runner trees (`tests/node` and `tests/jsdom`) by the runtime a subject needs. PaceVault runs one Vitest project with `environment: 'jsdom'` for everything, so that rule is Moot and is not carried in the TDR reference. If the engine and lib suites are ever split onto a `node` environment for speed, this record needs revisiting before that happens.

R6 of the original required importing `describe`/`it`/`expect` from `vitest` in every spec. That is the whole subject of the vitest-imports record adopted alongside this one and is not restated here.

Items 1 and 2 overlap with the hook-placement plan, which moves several of these subjects. Run that plan first where both are outstanding.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
