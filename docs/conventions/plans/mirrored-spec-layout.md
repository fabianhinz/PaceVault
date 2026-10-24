---
id: mirrored-spec-layout
tdr_reference: tdr/mirrored-spec-layout.md
depends_on: [index-modules-are-not-barrels]
generated: 2026-10-23
---

# Specs live in one tests tree that mirrors the source tree

Read `tdr/mirrored-spec-layout.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`index-modules-are-not-barrels`](index-modules-are-not-barrels.md) — gives the workbench specs their `@scripts/` and `@site/` imports, so item 11 moves them without rewriting an import.

## Changes

Baseline before item 1: `vp test -- --run` from `apps/web/` runs 103 spec files with 1027 passing tests in the single jsdom test project of `apps/web/vitest.config.ts`. Every item below must end at 1027 passing tests (the count changes only when another plan changes specs). Move files with plain `mv` (never `git mv`), stage nothing. Imports of the test API stay `from 'vite-plus/test'`; `apps/web/tests/setup.ts` and the `@tests` alias stay as they are.

1. Add the shared-helper alias and a transitional include list.
   Files: `apps/web/vitest.config.ts`, `apps/web/tsconfig.test.json`
   Change: In `resolve.alias` add `'@testUtils': path.resolve(__dirname, 'tests/testUtils')` after `'@tests'`. Replace `include: ['tests/**/*.integration.test.ts', 'tests/**/*.spec.ts']` with `include: ['tests/**/*.spec.{ts,tsx}', 'tests/**/*.integration.test.ts']` (the second glob keeps the not-yet-renamed specs running until item 8 removes it). In `apps/web/tsconfig.test.json` add `"@testUtils/*": ["./tests/testUtils/*"]` to `paths` after `"@tests/*"`.
   Check: `vp test -- --run` from `apps/web/` reports 1027 passed; `vp test -- --run` from the repo root passes (the root `vite.config.ts` `test.projects` entry `'apps/web'` picks the config up); `vp check` from the root is clean.

2. Replace the five copied FIT-fixture readers with one shared helper.
   Files: `apps/web/tests/testUtils/fixtures.ts` (new), `apps/web/tests/parsers/fit.spec.ts:128-133`, `apps/web/tests/parsers/fitThresholds.integration.test.ts:10-15`, `apps/web/tests/features/sessions/reprocessSessions.integration.test.ts:52-57`, `apps/web/tests/features/intervals/intervalsSync.integration.test.ts:21-26`, `apps/web/tests/features/intervals/intervalsImport.integration.test.ts:10-15`
   Change: `fixtures.ts` exports `readE2eFixture = (name: string): ArrayBuffer` that does `readFileSync(resolve(import.meta.dirname, '../../e2e/fixtures', name))`, copies it into a fresh `Uint8Array` and returns its `buffer` (the body the five copies share). Each spec deletes its local `fixture`/`runningFit` helper and its `node:fs`/`node:path` imports if no longer used, imports `{ readE2eFixture } from '@testUtils/fixtures.ts'`, and calls `readE2eFixture('running.fit')` or `readE2eFixture(name)`. The fixture files stay in `apps/web/e2e/fixtures/` because Playwright reads them too.
   Check: `rg -n "e2e/fixtures" apps/web/tests` prints only `apps/web/tests/testUtils/fixtures.ts`; `vp test -- --run` from `apps/web/` reports 1027 passed.

3. Rename the store specs whose name does not mirror their subject.
   Files: `apps/web/tests/store/sessionsStore.integration.test.ts`, `apps/web/tests/store/userStore.integration.test.ts`, `apps/web/tests/store/storeEngine.integration.test.ts`, `apps/web/tests/store/deleteAllData.integration.test.ts`
   Change: `sessionsStore.integration.test.ts` → `apps/web/tests/store/sessions.integration.spec.ts`; `userStore.integration.test.ts` → `apps/web/tests/store/user.integration.spec.ts`; `storeEngine.integration.test.ts` → `apps/web/tests/store/sessions.engine.integration.spec.ts`; `deleteAllData.integration.test.ts` → `apps/web/tests/lib/indexeddb.deleteAllData.integration.spec.ts` (its subject is `clearAllRecords` from `@/lib/indexeddb.ts` plus the store resets). The other eleven store specs keep their names.
   Check: `find apps/web/tests/store -name '*.test.ts'` prints nothing; `vp test -- --run` from `apps/web/` reports 1027 passed.

4. Rename the parser specs to qualifier names of their subject.
   Files: `apps/web/tests/parsers/fitLaps.spec.ts`, `apps/web/tests/parsers/fitRequiredFields.spec.ts`, `apps/web/tests/parsers/fitThresholds.integration.test.ts`
   Change: `fitLaps.spec.ts` → `fit.laps.spec.ts`; `fitRequiredFields.spec.ts` → `fit.requiredFields.spec.ts`; `fitThresholds.integration.test.ts` → `fit.thresholds.integration.spec.ts` (all three cover `@/parsers/fit.ts`). `fit.spec.ts` and `fitSchemas.spec.ts` keep their names.
   Check: `ls apps/web/tests/parsers` lists exactly `fit.laps.spec.ts fit.requiredFields.spec.ts fit.spec.ts fit.thresholds.integration.spec.ts fitSchemas.spec.ts`; `vp test -- --run` from `apps/web/` reports 1027 passed.

5. Rename the `lib` specs to the module they cover.
   Files: `apps/web/tests/lib/chartData.integration.test.ts`, `apps/web/tests/lib/db.integration.test.ts`, `apps/web/tests/lib/indexeddb.integration.test.ts`, `apps/web/tests/lib/studioPoints.integration.test.ts`, `apps/web/tests/lib/computePbsForSessions.spec.ts`, `apps/web/tests/lib/groupPbsBySport.spec.ts`, `apps/web/tests/lib/lapsAnalysis.spec.ts`, `apps/web/tests/lib/utils.spec.ts`, `apps/web/tests/lib/hooks/useChartZoom.integration.test.ts`, `apps/web/tests/lib/hooks/useMapHover.integration.test.ts`
   Change: In place under `apps/web/tests/lib/`: `chartData.integration.test.ts` → `chartData.integration.spec.ts`; `db.integration.test.ts` → `db.integration.spec.ts`; `indexeddb.integration.test.ts` → `indexeddb.integration.spec.ts`; `studioPoints.integration.test.ts` → `indexeddb.studioPoints.integration.spec.ts` (subject `@/lib/indexeddb.ts`); `computePbsForSessions.spec.ts` → `records.computePbsForSessions.spec.ts` and `groupPbsBySport.spec.ts` → `records.groupPbsBySport.spec.ts` (subject `@/lib/records.ts`); `lapsAnalysis.spec.ts` → `laps.spec.ts` (subject `@/lib/laps.ts`); `utils.spec.ts` → `formatters.spec.ts` (subject `@/lib/formatters.ts`); `hooks/useChartZoom.integration.test.ts` → `hooks/useChartZoom.integration.spec.ts`; `hooks/useMapHover.integration.test.ts` → `hooks/useMapHover.integration.spec.ts`. Every other `lib` spec keeps its name.
   Check: `find apps/web/tests/lib -name '*.test.ts'` prints nothing; `ls apps/web/tests/lib/utils.spec.ts apps/web/tests/lib/lapsAnalysis.spec.ts` fails for both; `vp test -- --run` from `apps/web/` reports 1027 passed.

6. Re-home the two app-wiring specs filed under `packages/engine` at their `lib` subjects.
   Files: `apps/web/tests/packages/engine/metricsCoaching.integration.test.ts` → `apps/web/tests/lib/coachingMessages.integration.spec.ts`; `apps/web/tests/packages/engine/stressPipeline.integration.test.ts` → `apps/web/tests/lib/validation.integration.spec.ts`
   Change: `mv` with the new names (their only `@/` subjects are `@/lib/coachingMessages.ts` and `@/lib/validation.ts`); delete the empty `apps/web/tests/packages/`.
   Check: `ls apps/web/tests/packages` fails; `vp test -- --run` from `apps/web/` reports 1027 passed.

7. Rename the feature specs.
   Files: `apps/web/tests/features/intervals/intervalsImport.integration.test.ts`, `apps/web/tests/features/intervals/intervalsSync.integration.test.ts`, `apps/web/tests/features/sessions/createIngestBatcher.integration.test.ts`, `apps/web/tests/features/sessions/recomputeTrainingLoad.integration.test.ts`, `apps/web/tests/features/sessions/reprocessSessions.integration.test.ts`, `apps/web/tests/features/map/hooks/useGpsBackfill.integration.test.ts`, `apps/web/tests/features/map/hooks/useMapTracks.integration.test.ts`, `apps/web/tests/features/map/hooks/useMapRendererHandOver.integration.test.ts`
   Change: In place: `intervals/intervalsImport.integration.test.ts` → `intervals/runIntervalsImport.integration.spec.ts` and `intervals/intervalsSync.integration.test.ts` → `intervals/runIntervalsSync.integration.spec.ts` (subjects `@/features/intervals/runIntervalsImport.ts`, `@/features/intervals/runIntervalsSync.ts`); the other six (including the 3D renderer hand-over spec, subject `@/features/map/hooks/useMapRendererHandOver.ts`) keep their base name and only swap `.integration.test.ts` for `.integration.spec.ts`. The sixteen `.spec.ts` feature specs keep their names.
   Check: `find apps/web/tests -name '*.test.ts*'` prints nothing; `vp test -- --run` from `apps/web/` reports 1027 passed.

8. Drop the transitional include glob.
   Files: `apps/web/vitest.config.ts`
   Change: `include` becomes `['tests/**/*.spec.{ts,tsx}']`. Nothing else in the `test` block changes (`environment: 'jsdom'`, `setupFiles: ['tests/setup.ts']`, `globals: true`, `coverage` stay).
   Check: `rg -n "integration\.test" apps/web/vitest.config.ts` prints nothing; `vp test -- --run` from `apps/web/` reports 1027 passed across 103 files.

9. Rewrite the documented test conventions to the adopted layout.
   Files: `apps/web/tests/CLAUDE.md:12,16-17`, `CLAUDE.md:46`
   Change: `apps/web/tests/CLAUDE.md:12`: replace `(\`*.integration.test.ts\`)` with `(\`*.integration.spec.ts\`)`, nothing else on the line. Line 16 becomes `- **Naming**: App specs live in \`apps/web/tests/\`, package specs in \`packages/<p>/tests/\`, workbench specs in \`tools/workbench/tests/\`, named \`<subject>.spec.ts\` (\`.spec.tsx\` when the spec contains JSX). Several specs for one subject keep the mirrored path and add a qualifier before \`.spec\` (\`chartData.integration.spec.ts\`, \`fit.laps.spec.ts\`); there is no \`.test.ts\` suffix.` Line 17 becomes `- **Location**: Specs mirror the source folder structure: \`src/<path>/<file>.ts\` is specified in \`tests/<path>/<file>.spec.ts\` of the same package, e.g. \`apps/web/src/lib/chartData.ts\` → \`apps/web/tests/lib/chartData.spec.ts\`, \`packages/engine/src/zones.ts\` → \`packages/engine/tests/zones.spec.ts\`. An app spec that exercises engine code through an \`@/\` module sits at that module's mirrored path. Never place a spec under \`src/\`; move or rename a spec in the same change as its subject. A spec's own fixtures sit beside it; helpers shared by several specs live in \`apps/web/tests/testUtils/\`, imported as \`@testUtils/<module>.ts\`; ambient test declarations go to \`apps/web/tests/types/*.d.ts\`.` Lines 18–20 (factories, setup, imports) stay. `CLAUDE.md:46`: the Tests row becomes `| Tests | Mirrored path + \`.spec.ts\` / \`.spec.tsx\`, qualifier before \`.spec\` | \`chartData.integration.spec.ts\` |` (Oxfmt realigns the table).
   Check: `rg -n "integration\.test|tests/packages/engine" CLAUDE.md apps/web/CLAUDE.md apps/web/README.md apps/web/tests/CLAUDE.md` prints nothing; a human reads `apps/web/tests/CLAUDE.md` lines 16–17 and finds the two bullets above.

10. (packages/engine) Give the two engine specs named after a topic the name of the module they cover.
   Files: `packages/engine/tests/ewmaAlpha.spec.ts` → `packages/engine/tests/metrics.ewmaAlpha.spec.ts`; `packages/engine/tests/gpsPick.spec.ts` → `packages/engine/tests/gps.pick.spec.ts`
   Change: plain file renames (`mv`), contents unchanged; both still match `packages/engine/vitest.config.ts`'s `tests/**/*.spec.ts`. Skip the second rename if the helpers-group plan already merged `gpsPick.spec.ts` into `bounds.spec.ts`. Every engine spec is named after its module (`<module>.spec.ts`) or carries a qualifier before `.spec` (R3, R10); the engine has no further directory to mirror (`src/` is flat).
   Check: `ls packages/engine/tests | rg -v "^[a-zA-Z]+(\.[a-zA-Z]+)?\.spec\.ts$"` prints nothing; every `<module>` part names a file in `packages/engine/src` (`for f in packages/engine/tests/*.spec.ts; do m=$(basename "$f" | cut -d. -f1); test -e "packages/engine/src/$m.ts" || echo "$f"; done` prints nothing); `vp test -- --run` from `packages/engine/` passes with the same count.

### tools/workbench

`tools/workbench` has two source roots, `scripts/` and `site/src/`, and one spec tree, `tools/workbench/tests/`. The specs mirror their subject's path inside the package (`scripts/x.ts` → `tests/scripts/x.spec.ts`, `site/src/lib/x.ts` → `tests/site/src/lib/x.spec.ts`); the actions module is specified under `tests/site/src/actions/` with one qualifier per concern. The index-modules plan has given the specs their `@scripts/` and `@site/` imports, so a move changes no import except the one hand-built path below. Move with plain `mv`, stage nothing. `tools/workbench/vitest.config.ts` keeps `include: ['tests/**/*.spec.ts']`.

11. (tools/workbench) Mirror the workbench specs and import the test API explicitly (R1, R2, R3, R10).
   Files: `tools/workbench/tests/*.spec.ts` (13 files)
   Change: move `statusGuard.spec.ts`, `workerGitGuard.spec.ts`, `check.spec.ts`, `cleanup.spec.ts`, `changedFiles.spec.ts`, `deps.spec.ts`, `frontmatter.spec.ts` and `interfaces.spec.ts` to `tools/workbench/tests/scripts/` (same names); `devPlugin.spec.ts` and `writeBack.spec.ts` to `tools/workbench/tests/site/src/lib/`; the three action specs, which drive the handlers of `site/src/actions/index.ts`, to `tools/workbench/tests/site/src/actions/` as `boardRead.spec.ts` → `index.read.spec.ts`, `boardDone.spec.ts` → `index.done.spec.ts`, `board.spec.ts` → `index.writes.spec.ts`. In the moved `devPlugin.spec.ts`, `fileURLToPath(new URL('../site/src/lib/board.ts', import.meta.url))` (today `:114`) becomes `fileURLToPath(new URL('../../../../site/src/lib/board.ts', import.meta.url))`. Every spec imports the test-API names it uses (`describe`, `it`, `expect`, `vi`, `beforeAll`, `afterAll`, `beforeEach`, `afterEach`) from `'vite-plus/test'`, as `workerGitGuard.spec.ts:1` does today; `globals: true` stays in the config.
   Check: `find tools/workbench/tests -maxdepth 1 -name '*.spec.ts'` prints nothing; `for f in $(find tools/workbench/tests -name '*.spec.ts'); do s=${f#tools/workbench/tests/}; s=${s%.spec.ts}; s=${s%.read}; s=${s%.done}; s=${s%.writes}; test -e tools/workbench/$s.ts || echo $f; done` prints nothing; `rg -L "from 'vite-plus/test'" tools/workbench/tests --glob '*.spec.ts'` prints nothing; `vp test -- --run` from `tools/workbench/` passes 66 tests in 13 files.

12. (tools/workbench) Write the spec layout into the tool rules.
   Files: `tools/workbench/CLAUDE.md`, `tools/workbench/README.md`
   Change: `tools/workbench/CLAUDE.md` § Rules gains "- **Specs**: `tests/` mirrors the two source roots: `scripts/x.ts` → `tests/scripts/x.spec.ts`, `site/src/<path>/x.ts` → `tests/site/src/<path>/x.spec.ts`; several specs of one subject add a qualifier before `.spec` (`index.read.spec.ts`); the test API is imported from `vite-plus/test`." The `tests/` row of the `README.md` layout table ("Vitest specs for the scripts, hooks and the board (write-back, Needs you, type and areas)") becomes "Vitest specs, mirroring `scripts/` and `site/src/`".
   Check: `rg -n "tests/scripts/x.spec.ts" tools/workbench/CLAUDE.md` prints one line; `rg -n "mirroring" tools/workbench/README.md` prints one line.

## Open items

- R4 (two trees picking the runtime) dropped by the owner: `apps/web/tests/` stays one tree under the single jsdom project of `apps/web/vitest.config.ts`.
- R6 (import the test API from `vitest`) dropped by the owner: specs keep importing from `vite-plus/test` (`apps/web/tests/CLAUDE.md:20` stays).
- R7 (one setup file per tree root) dropped by the owner: `apps/web/tests/setup.ts` stays the one setup file, registered through `setupFiles`.
- Playwright stays untouched: `apps/web/playwright.config.ts` and `apps/web/e2e/` keep their layout; `apps/web/e2e/fixtures/` stays the single home of the FIT fixtures (item 2 reaches them through `@testUtils/fixtures.ts`).
- `apps/web/tests/factories/` stays a fixed point beside the mirror (owner decision; the test-data plan renames its factories in place).
- `apps/web/tests/features/dashboard/hooks/useFilteredMetrics.spec.ts` imports no `@/` module at all — it exercises `computeMetrics` from `@pacevault/engine/metrics.ts` under a hook's name. It keeps the hook's mirrored path here; whether it should be rewritten against `useFilteredMetrics` or moved to `packages/engine/tests/metrics.spec.ts` is a separate decision.
- `apps/web/tests/types/` is not created here: no ambient test declaration is needed until the assertion-vocabulary plan adds one (R9).
- `packages/ui`: already conforms — every kit spec mirrors its subject under `packages/ui/tests/` (`tests/lib/`, `tests/hooks/`), named `<subject>.spec.ts`; there is no shared helper and no alias (R8 has nothing to govern there).
- `tools/workbench`: `globals: true` stays in `tools/workbench/vitest.config.ts`, as in `apps/web`; the three action specs share the subject `site/src/actions/index.ts` and differ by qualifier (`read`, `done`, `writes`).

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
