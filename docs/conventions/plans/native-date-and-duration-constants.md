---
id: native-date-and-duration-constants
tdr_reference: tdr/native-date-and-duration-constants.md
generated: 2026-10-23
---

# Native Date with composed millisecond duration constants

Read `tdr/native-date-and-duration-constants.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

Spec paths are given as they are today; if the mirrored-layout plan has already run, the same file may carry its renamed `.integration.spec.ts` name (renamed files are noted in parentheses). Import the constants as `import { MS_PER_… } from '@pacevault/engine/time.ts';` everywhere outside `packages/engine`, and from `'./time.ts'` / `'../src/time.ts'` inside it.

1. Add the shared constant module.
   Files: `packages/engine/src/time.ts` (new)
   Change: Exactly the four composed constants `MS_PER_SECOND = 1000`, `MS_PER_MINUTE = MS_PER_SECOND * 60`, `MS_PER_HOUR = MS_PER_MINUTE * 60`, `MS_PER_DAY = MS_PER_HOUR * 24`, each `export const`, nothing else (pure, no DOM, no `node:*`, so app, workers and tools can import it).
   Check: `vp check` from `packages/engine/` is clean.

2. Replace the four `DAY_MS` duplicates.
   Files: `apps/web/src/lib/intervalsSyncWindow.ts:4,20`, `apps/web/src/lib/profileHistory.ts:3,69`, `apps/web/src/features/dashboard/hooks/useDashboardChartZoom.ts:6,19`, `packages/testing/src/sessions.ts:4,41,56` (or `packages/testing/src/series.ts` if the test-data plan has already moved it there)
   Change: Delete each local `const DAY_MS = 24 * 60 * 60 * 1000;` / `const DAY_MS = 86_400_000;` and use `MS_PER_DAY` at its uses (`newest - BUFFER_DAYS * MS_PER_DAY`, `context.today - PROFILE_HISTORY_MIN_DAYS * MS_PER_DAY`, `(range.to - range.from) / MS_PER_DAY`, `count * MS_PER_DAY`, `i * daysBetween * MS_PER_DAY`; once test-data-from-mock-factories item 15 has dropped the `startDate` default and `daysBetween`, only `i * MS_PER_DAY` is left). `packages/testing` imports it as `@pacevault/engine/time.ts`.
   Check: `rg -n "DAY_MS" apps/web/src packages/engine/src packages/testing` prints nothing; `vp run test` from the root passes.

3. Replace inline second↔millisecond conversions in source.
   Files: `apps/web/src/lib/weather.ts:194,196-205,213,340,362`, `apps/web/src/lib/gpxExport.ts:24`, `apps/web/src/parsers/fit.ts:88`, `apps/web/src/lib/lapRanges.ts:27-28`, `apps/web/src/features/demo/demoRecords.ts:393-394`, `apps/web/src/features/intervals/hooks/useIntervalsSync.ts:9`, `packages/engine/src/windExposure.ts:107`
   Change: `durationSec * 1000` → `durationSec * MS_PER_SECOND` (weather 194, 362); delete `const hourMs = 3600 * 1000;` (weather 196) and use `MS_PER_HOUR` in its five uses; `(hourTimestamp - sessionDateMs) / 1000` → `/ MS_PER_SECOND` (weather 213); `timeSec * 1000` → `timeSec * MS_PER_SECOND` (weather 340); `r.timestamp * 1000` → `r.timestamp * MS_PER_SECOND` (gpxExport 24); `lap.total_elapsed_time * 1000` → `lap.total_elapsed_time * MS_PER_SECOND` (fit 88); `/ 1000` → `/ MS_PER_SECOND` (lapRanges 27, 28); `first.timestamp * 1000` / `last.timestamp * 1000` → `* MS_PER_SECOND` (demoRecords 393, 394); `const POLL_MS = 15 * 60_000;` → `const POLL_MS = 15 * MS_PER_MINUTE;`; `a.elapsedSec * 1000` → `a.elapsedSec * MS_PER_SECOND` (windExposure 107, import from `./time.ts`). Distance conversions (`/ 1000` metres → km) are not durations and stay.
   Check: `rg -n "(\*|/) *1000\b|60_000|3600 \* 1000" apps/web/src/lib/weather.ts apps/web/src/lib/gpxExport.ts apps/web/src/parsers/fit.ts apps/web/src/lib/lapRanges.ts apps/web/src/features/demo/demoRecords.ts apps/web/src/features/intervals/hooks/useIntervalsSync.ts packages/engine/src/windExposure.ts` prints only the metre/km lines `weather.ts:256` (`thresholdKm * 1000`); `vp run test` from the root passes.

4. Name the bare duration literals passed at call sites.
   Files: `apps/web/src/lib/hooks/useWatchPositionEffect.ts:36`, `apps/web/src/features/map/hooks/useGeolocationCameraEffect.ts:25`
   Change: Add module-top constants and use them: `const GEOLOCATION_TIMEOUT_MS = 10 * MS_PER_SECOND;` (`timeout: GEOLOCATION_TIMEOUT_MS`); in `useGeolocationCameraEffect.ts` `const GEOLOCATION_FLY_DURATION_MS = 800;`. The camera fit durations in `useMapCameraEffect.ts` are already named (`OVERVIEW_FIT_DURATION_MS` at `:43`, `LAP_FIT_DURATION_MS`/`SESSION_FIT_DURATION_MS`/`TILT_DURATION_MS` imported from `terrainCamera.ts:16-18`); item 5 composes the second-scale ones.
   Check: `rg -n "(timeout|duration|[Dd]elay|staleTime|gcTime|refetchInterval)\s*:\s*[0-9][0-9_]{2,}" apps/web/src --glob '!**/demo/**'` prints nothing; `vp check` from the root is clean.

5. Compose the existing second-scale constants.
   Files: `apps/web/src/components/ImportProgressOverlay.tsx:15`, `apps/web/src/features/map/previewDrawIn.ts:32-34`, `apps/web/src/features/map/hooks/useMapCameraEffect.ts:43`, `apps/web/src/features/map/terrainCamera.ts:17`
   Change: `MIN_OPEN_MS = 1500` → `1.5 * MS_PER_SECOND`; `STAGGER_SPREAD_MS = 1800` → `1.8 * MS_PER_SECOND`; `MIN_DURATION_MS = 1600` → `1.6 * MS_PER_SECOND`; `MAX_DURATION_MS = 2400` → `2.4 * MS_PER_SECOND`; `OVERVIEW_FIT_DURATION_MS = 1000` → `MS_PER_SECOND`; `SESSION_FIT_DURATION_MS = 1200` → `1.2 * MS_PER_SECOND`. Sub-second constants (`INPUT_DEBOUNCE_MS = 600`, `PHONE_REFIT_MS = 900`, the `800` of item 4, `terrainCamera.ts:15-16,18` `DEM_SETTLE_TIMEOUT_MS = 500`, `LAP_FIT_DURATION_MS = 800`, `TILT_DURATION_MS = 800`, `useTerrainTrackPickingEffect.ts:22` `SYNTHETIC_CLICK_WINDOW_MS = 500`) stay plain literals.
   Check: `rg -n "_MS = [0-9][0-9_]{3,};" apps/web/src` prints nothing; `vp test -- --run` from `apps/web/` passes (`previewDrawIn.spec.ts` covers the draw-in timing).

6. Replace the duration duplicates and literals in the app specs.
   Files: `apps/web/tests/store/storeEngine.integration.test.ts:9` (`sessions.engine.integration.spec.ts`), `apps/web/tests/lib/computePbsForSessions.spec.ts:6` (`records.computePbsForSessions.spec.ts`), `apps/web/tests/lib/filterGrammar.spec.ts:15`, `apps/web/tests/lib/sessionFitness.spec.ts:8`, `apps/web/tests/lib/savedFilters.spec.ts:13`, `apps/web/tests/lib/profileHistory.spec.ts:4`, `apps/web/tests/lib/weatherSummary.spec.ts:5`, `apps/web/tests/features/trips/tripStats.spec.ts:5`, `apps/web/tests/features/demo/buildDemoDataset.spec.ts:26,87,93,120,236`, `apps/web/tests/features/dashboard/hooks/useFilteredMetrics.spec.ts:5`, `apps/web/tests/packages/engine/metricsCoaching.integration.test.ts:7` (`lib/coachingMessages.integration.spec.ts`), `apps/web/tests/parsers/fitThresholds.integration.test.ts:8` (`fit.thresholds.integration.spec.ts`), `apps/web/tests/features/sessions/recomputeTrainingLoad.integration.test.ts:32`, `apps/web/tests/features/sessions/reprocessSessions.integration.test.ts:70`, `apps/web/tests/lib/prescription.spec.ts:43`, `apps/web/tests/lib/gpxExport.spec.ts:16`, `apps/web/tests/lib/lapRanges.spec.ts:15-16`, `apps/web/tests/lib/weather.spec.ts:268,278,316`
   Change: Delete every local `DAY_MS` / `DAY` (`24 * 60 * 60 * 1000`, `86_400_000`) and `HOUR_MS` (`3_600_000`) and use `MS_PER_DAY` / `MS_PER_HOUR`. `toBe(86400000)` → `toBe(MS_PER_DAY)`; `i * 60_000` → `i * MS_PER_MINUTE`; `fromSec * 1000` / `toSec * 1000` → `* MS_PER_SECOND`; `time: 3600000` → `time: MS_PER_HOUR`; `Date.UTC(2026, 3, 8) / 1000` → `/ MS_PER_SECOND`. In `buildDemoDataset.spec.ts` add `const DEMO_BUILD_TIMEOUT_MS = MS_PER_MINUTE;` and pass it in place of the four `60_000` test timeouts.
   Check: `rg -n "const (DAY|HOUR)(_MS)? = |86_?400_?000|3_?600_?000|60_000|\* 1000\b" apps/web/tests` prints only the two metre lines `gpxExport.spec.ts` `dist: i * 1000` and `lapSummary.spec.ts` `(1145 / 3500) * 1000` and the seconds constant `chartData.integration` `const HOUR = 3600`; `vp test -- --run` from `apps/web/` passes with the same count.

7. Replace the duration duplicates in the engine specs.
   Files: `packages/engine/tests/datedValue.spec.ts:4`, `packages/engine/tests/metrics.spec.ts:5`, `packages/engine/tests/ewmaAlpha.spec.ts:5`
   Change: Delete `const DAY_MS = 24 * 60 * 60 * 1000;` and import `MS_PER_DAY` from `'../src/time.ts'`.
   Check: `rg -n "DAY_MS" packages/engine` prints nothing; `vp test -- --run` from `packages/engine/` passes.

8. (packages/ui) Name the toast duration.
   Files: `packages/ui/src/components/Toast.tsx`
   Change: `Toast.tsx:46` `duration={t.persistent ? Infinity : 4000}` → `duration={t.persistent ? Infinity : TOAST_DURATION_MS}` with module-local `const TOAST_DURATION_MS = 4000;` (R3). The kit does not depend on `@pacevault/engine`, so no `MS_PER_SECOND` here (R2 as adapted).
   Check: `rg -n "4000" packages/ui/src` prints only the constant; `vp run check` and `vp run test` pass.

9. (packages/testing) Name the lap duration and compose its milliseconds.
   Files: `packages/testing/src/records.ts:252-276` (or `packages/testing/src/series.ts` if the test-data plan has already moved `makeLaps` there as `lapSeries`)
   Change: the local `const lapDuration = 300;` becomes the module-scope `const LAP_DURATION_SEC = 300;` above the function, and the two inline conversions use `MS_PER_SECOND` from `@pacevault/engine/time.ts` (requires item 1): `const startMs = i * LAP_DURATION_SEC * MS_PER_SECOND;`, `endTime: startMs + LAP_DURATION_SEC * MS_PER_SECOND`, `totalTimerTime: LAP_DURATION_SEC`, `totalMovingTime: LAP_DURATION_SEC - 10`. The multiplication order is unchanged, so every lap is identical.
   Check: `rg -n "\* 1000\b|\blapDuration\b" packages/testing/src` prints nothing but the two `timestamp * 1000` lines of `makeLapsFromRecords` while that function exists (test-data-from-mock-factories item 3 deletes it, so leave them); `vp test -- --run` from `apps/web/` passes with the same count.

10. (tools/docs) Name the capture's waits.
   Files: `tools/docs/banner/capture.ts`, `tools/docs/playwright.config.ts`
   Change: every bare millisecond literal passed as a timeout or wait becomes a module-scope `_MS` constant with the same value (R3); like the kit, the tool does not depend on `@pacevault/engine`, so no `MS_PER_SECOND` (R2 as adapted). In `capture.ts`, beside `STILL_POLL_MS` and `NETWORK_IDLE_MS`: `UI_READY_TIMEOUT_MS = 15_000` for the four `{ timeout: 15_000 }` (`:72` the demo button click, `:204` the first session item, `:211` the colour-by pill, `:559` the weather card's `°C`); `DEMO_IMPORT_TIMEOUT_MS = 60_000` for `:74`; `DOCK_READY_TIMEOUT_MS = 30_000` for `:78`; `SESSION_SCROLL_PAUSE_MS = 100` for `page.waitForTimeout(100)` (`:207`). In `playwright.config.ts`: `const CAPTURE_TIMEOUT_MS = 180_000;` below the imports, read by `timeout: CAPTURE_TIMEOUT_MS` (`:21`). `ANCHOR` (the frozen clock time, a point in time) is a native `Date` already and stays. Where an earlier plan moved a call into another capture module, name the wait in the module that now reads it.
   Check: `rg -n "\b(15_000|30_000|60_000|180_000)\b|waitForTimeout\(\d" tools/docs/banner tools/docs/playwright.config.ts` prints only the four constant declarations; `vp check` from `tools/docs/` is clean; `vp run docs:banner --locale de` and `--locale en` finish without a timeout.

## Open items

- R1 holds: no date, time or duration library is in any `package.json` of the workspace; nothing to change.
- R4 holds: no `valueOf()`, unary-plus or `Number(date)` coercion exists in `apps/web/src` or `packages/engine/src`.
- R5 is narrowed for this project: a `set*` call on a freshly constructed copy for a local-calendar step stays allowed (DST-safe), fixed durations use millisecond arithmetic. Every current setter (`packages/engine/src/metrics.ts:39,45,51`, `apps/web/src/store/user.ts:98`, `apps/web/src/lib/timeRange.ts:33`, `apps/web/src/lib/weekKey.ts:7`, `apps/web/src/lib/prescription.ts:299`, `apps/web/tests/store/userStore.integration.test.ts:42,196`) runs on a fresh `new Date(…)` copy, so none changes.
- Seconds-domain arithmetic (`seconds / 3600` in `apps/web/src/lib/formatters.ts`, `packages/engine/src/stress.ts`, `apps/web/src/lib/prescription.ts` step durations like `25 * 60`, `chartTheme.ts:5`, `filterGrammar.ts:422,445`) is not millisecond arithmetic; this record adopts no `SECONDS_PER_*` family. The formatting plan converts `formatters.ts` through `MS_PER_*`.
- Demo seed data (`apps/web/src/features/demo/demoSchedule.ts:175-181`, `demoRecords.ts:219`) carries workout durations in seconds as data, not timeouts; it stays.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
