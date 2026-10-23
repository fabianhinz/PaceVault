---
id: spec-describe-and-case-titles
tdr_reference: tdr/spec-describe-and-case-titles.md
depends_on: [test-data-from-mock-factories, mirrored-spec-layout]
generated: 2026-10-23
---

# One top-level describe per engine spec, titled by its unit

Read `tdr/spec-describe-and-case-titles.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`test-data-from-mock-factories`](test-data-from-mock-factories.md) — rewrites the record builders of the same engine specs; regrouping their describes afterwards keeps each spec edit on settled text.
- [`mirrored-spec-layout`](mirrored-spec-layout.md) — puts the workbench specs where item 7 titles them.

## Changes

Only `describe` structure and titles change; no `it` body, no assertion and no case title moves between units. Spec names are today's — if the mirrored-spec or helpers-group plan renamed or merged a spec, apply the item to the file it became (a merged spec still gets exactly one top-level `describe`). Symbol names are whatever the subject is called when the item runs: `describe(subject.name, …)` follows later renames by itself. Check for every item: `vp test -- --run` from `packages/engine/` passes with the same test count.

1. Put the specs that cover several peer exports under one module-titled describe (R1, R3, R5).
   Files: `packages/engine/tests/cadence.spec.ts`, `coaching.spec.ts`, `datedValue.spec.ts`, `gradient.spec.ts`, `normalize.spec.ts`, `paceCalculator.spec.ts`, `stress.spec.ts`, `trainingEffect.spec.ts`, `vdot.spec.ts`, `windExposure.spec.ts`, `zones.spec.ts`, `gps.spec.ts` (all under `packages/engine/tests/`)
   Change: each file gets one top-level `describe('<module>', () => { … })` named after its module file (`'cadence'`, `'coaching'`, `'datedValue'`, `'gradient'`, `'normalize'`, `'paceCalculator'`, `'stress'`, `'trainingEffect'`, `'vdot'`, `'windExposure'`, `'zones'`, `'gps'`), and today's top-level describes become nested groups inside it in the same order. A nested group that names an imported function becomes `describe(<function>.name, …)`. A suffix-style group moves under the group of its unit with the suffix as its title: `'computeRunningZones edge cases'` (`zones.spec.ts:46`) → `'edge cases'` inside `describe(computeRunningZones.name)`; `'calculateNormalizedPower with recorded zeros'` and `'… on smart recording'` (`normalize.spec.ts:158,175`) → `'recorded zeros'` and `'smart recording'` inside `describe(calculateNormalizedPower.name)`; `'calculateSummaryStress for runs'` (`stress.spec.ts:191`) → `'runs'` inside `describe(calculateSummaryStress.name)`. Behaviour clusters keep a short noun phrase: `'threshold consistency: getLoadState and getInjuryRisk agree at boundaries'` (`coaching.spec.ts:100`) → `'threshold consistency'`, `'round-trip consistency'` (`paceCalculator.spec.ts:43`) stays, the two calibration groups in `trainingEffect.spec.ts:202,253` stay. A constant that has no `.name` keeps a string: `describe('RACE_DISTANCE_METERS', …)` (`vdot.spec.ts:41`) stays as the string of its current name.
   Check: for every listed file `rg -c "^describe\\(" <file>` prints `1`; `rg -n "^  describe\\('(get|calculate|compute|valueAt|upsert|stepLength|coasting|windAngles|relativeWindAngles|bearing|bounds|densest|intensity|variability|threshold(HrRatio|PaceFromRace)|predict|time|pace|distance|windowed|average)" packages/engine/tests` prints nothing (no nested group spells a function name as a string).

2. Title the single-unit specs with the unit's symbol (R2).
   Files: `packages/engine/tests/climbs.spec.ts`, `decoupling.spec.ts`, `effortDetection.spec.ts`, `energy.spec.ts`, `metrics.spec.ts`, `ewmaAlpha.spec.ts` (or `metrics.ewmaAlpha.spec.ts`), `wattsPerKg.spec.ts`, `zoneDistribution.spec.ts`, `gpsPick.spec.ts` (or `gps.pick.spec.ts`)
   Change: `describe('detectClimbs'` → `describe(detectClimbs.name`, and the same for `aerobicDecoupling`, `detectEfforts`, `computeMetrics`, `wattsPerKgHistory`, `secondsInZones`, `segmentIntersectsBounds`. `energy.spec.ts`'s four top-level groups `'estimateSessionEnergy — power'` / `— running` / `— heart rate (Keytel)` / `— method choice` (`:21,49,63,87`) become nested `'power'`, `'running'`, `'heart rate (Keytel)'`, `'method choice'` inside one `describe(estimateSessionEnergy.name)`. `ewmaAlpha.spec.ts`'s `'EWMA alpha matches Coggan PMC model'` becomes `describe(computeMetrics.name, () => { describe('EWMA alpha (Coggan PMC)', …) })`.
   Check: `rg -n "^describe\\('" packages/engine/tests` prints only the module-titled describes of item 1; every spec prints `1` for `rg -c "^describe\\("`.

3. Write the describe rule into the engine rules.
   Files: `packages/engine/CLAUDE.md`
   Change: append to the **Tests** bullet (`CLAUDE.md:16`): "One top-level `describe` per spec: `describe(unit.name, …)` when the spec covers one exported function, the module name as a string when it covers several; nested groups name a sub-unit (`describe(sub.name, …)`) or a short behaviour cluster."
   Check: `rg -n "One top-level" packages/engine/CLAUDE.md` prints one line.

### packages/gpx

The gpx specs as the earlier plans leave them: `simplifyGpxPoints.spec.ts` is gone and `buildGpxFilename` has left `buildGpx.spec.ts` (engine-holds-domain-logic-only items 10 and 13). Only `describe` structure and titles change, except item 5, which fixes two case titles that contradict their own assertions.

4. (packages/gpx) One top-level describe per gpx spec (R1, R2, R3, R5).
   Files: `packages/gpx/tests/buildGpx.spec.ts`, `packages/gpx/tests/parseGpx.spec.ts`, `packages/gpx/tests/routeCut.spec.ts`, `packages/gpx/tests/routeGeometry.spec.ts`, `packages/gpx/tests/routeProfile.spec.ts`
   Change: `describe('buildGpxString'` (`buildGpx.spec.ts:18`) → `describe(buildGpxString.name`; `describe('parseGpx'` (`parseGpx.spec.ts:15`) → `describe(parseGpx.name`; `describe('buildRouteGeometry'` (`routeGeometry.spec.ts:13`) → `describe(buildRouteGeometry.name`; `describe('buildRouteProfile'` (`routeProfile.spec.ts:30`) → `describe(buildRouteProfile.name`. `routeCut.spec.ts` gets one top-level `describe('routeCut', () => { … })` holding today's three groups (`:69`, `:138`, `:164`) as `describe(sliceRoute.name, …)`, `describe(pointAtRouteDistance.name, …)` and `describe(routeDistanceAtPosition.name, …)`, in the same order with their `const route = …` lines inside them.
   Check: `rg -c "^describe\(" packages/gpx/tests/*.spec.ts` prints `1` for every file; `rg -n "describe\('(buildGpxString|parseGpx|sliceRoute|pointAtRouteDistance|routeDistanceAtPosition|buildRouteGeometry|buildRouteProfile)'" packages/gpx/tests` prints nothing; `vp -C packages/gpx exec vitest run` passes with the same count.

5. (packages/gpx) Fix the two route-cut case titles that state the opposite of their assertions.
   Files: `packages/gpx/tests/routeCut.spec.ts`
   Change: `it('split pin drifts ahead of the export cut on simplified line', …)` (`:141`) asserts that the pin equals the first point of the export cut → `it('puts the split pin on the first point of the export cut', …)`; `it('map click saves a shorter km than the export uses', …)` (`:167`) asserts that a recorded point maps back to its own distance → `it('maps a recorded point back to its own route distance', …)`. The bodies stay.
   Check: `rg -n "drifts ahead|saves a shorter km" packages/gpx/tests` prints nothing.

6. (packages/gpx) Write the describe rule into the gpx rules.
   Files: `packages/gpx/CLAUDE.md`
   Change: append to the **Tests** bullet (`CLAUDE.md:10`): "One top-level `describe` per spec: `describe(unit.name, …)` when the spec covers one exported function, the module name as a string when it covers several; nested groups name a sub-unit (`describe(sub.name, …)`) or a short behaviour cluster."
   Check: `rg -n "One top-level" packages/gpx/CLAUDE.md` prints one line.

### tools/workbench

The workbench specs as the mirrored-spec-layout plan left them (`tools/workbench/tests/scripts/`, `tests/site/src/lib/`, `tests/site/src/actions/`). Each already has exactly one top-level `describe` (R1); only the titles change.

7. (tools/workbench) Title every workbench spec by its unit (R2, R3).
   Files: every spec under `tools/workbench/tests/`
   Change: single-unit specs take the symbol's `.name`: `describe('statusGuard'` (`scripts/statusGuard.spec.ts`) → `describe(decide.name`; `describe('workerGitGuard'` → `describe(decideWorker.name`; `describe('workbenchCleanup'` (`scripts/cleanup.spec.ts`) → `describe(selectDeletions.name`. Specs covering several peers take the module name as a string: `'checkWorkbench'` (`scripts/check.spec.ts`, which also covers `itemFolders` and `checkDecisions`) → `'check'`; `'workbenchDeps'` → `'deps'`; `'workbenchFrontmatter'` → `'frontmatter'`; `'workbenchInterfaces'` → `'interfaces'`; `'dev plugin'` → `'devPlugin'`; the three action specs (`'board.read'`, `'boardDone'`, `'board'`) → `'actions'`. `'changedFiles'` and `'writeBack'` already name their module. Case titles stay.
   Check: `rg -c "^describe\(" tools/workbench/tests --glob '*.spec.ts'` prints `1` for every file; `rg -n "^describe\('(statusGuard|workerGitGuard|workbench\w+|checkWorkbench|dev plugin|board\.read|boardDone|board)'" tools/workbench/tests` prints nothing; `vp test -- --run` from `tools/workbench/` passes 66 tests.

## Open items

- R4 (`should …` case titles) is dropped by the owner; case titles stay as they are.
- `apps/web` and `packages/ui` specs are not covered by this plan; their top-level describe titles follow `describe(subject.name)` under collaborators-replaced-with-mocks R7, and whether they also adopt the one-top-level-describe rule is a later choice.

- `packages/gpx`: case titles are not governed by this record; item 5 only corrects two that describe the defect a case was written for instead of the behaviour it asserts.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
