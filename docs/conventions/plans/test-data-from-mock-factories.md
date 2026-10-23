---
id: test-data-from-mock-factories
tdr_reference: tdr/test-data-from-mock-factories.md
depends_on: [colocated-types-module]
generated: 2026-10-23
---

# Test data comes from createMock factories, never from object literals

Read `tdr/test-data-from-mock-factories.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`colocated-types-module`](colocated-types-module.md) — moves `RoutePoint` into `packages/gpx/src/types.ts`, the path the gpx route factories of items 10–12 import it from.

## Changes

`@pacevault/testing` stays the home of the engine-entity factories and `apps/web/tests/factories/` the home of the app-entity factories; factories are renamed `createMock<Entity>` in place, and the series and scenario builders move out of the factory modules into one new module, `packages/testing/src/series.ts`. Engine specs keep importing `packages/testing` by relative path (`../../testing/src/…`, the workspace cycle stays avoided). Spec paths below are today's; if `mirrored-spec-layout` has already run, the same file sits at its renamed path (`lapsAnalysis.spec.ts` → `laps.spec.ts`, `computePbsForSessions.spec.ts` → `records.computePbsForSessions.spec.ts`, `packages/engine/*.integration.test.ts` → `lib/*.integration.spec.ts`, every `.integration.test.ts` → `.integration.spec.ts`), and each item's grep re-locates its sites. Rename table used by every item:

| Old | New | Module |
| :--- | :--- | :--- |
| `makeSession` | `createMockTrainingSession` | `@pacevault/testing/sessions.ts` |
| `makeSessionSequence` | `sessionSeries` | `@pacevault/testing/series.ts` |
| `makeCyclingRecords` | `cyclingRecordSeries` | `@pacevault/testing/series.ts` |
| `makeRunningRecords` | `runningRecordSeries` | `@pacevault/testing/series.ts` |
| `makeGPSRunningRecords` | `gpsRunningRecordSeries` | `@pacevault/testing/series.ts` |
| `makeIndoorRecords` | `indoorRecordSeries` | `@pacevault/testing/series.ts` |
| `makeLaps` | `lapSeries` | `@pacevault/testing/series.ts` |
| `makeInvalidRecords` | `invalidRecordSeries` | `@pacevault/testing/series.ts` |
| `makeLapsFromRecords` | deleted (no importer) | — |
| `makeUserProfile` | `createMockUserProfile` | `@tests/factories/profiles.ts` |

1. Add the missing engine-entity factories.
   Files: `packages/testing/src/records.ts`, `packages/testing/src/gps.ts`, `packages/testing/src/personalBests.ts` (new), `packages/testing/src/dailyMetrics.ts` (new)
   Change: Add, each as `export const createMock<Entity> = (overrides?: Partial<Entity>): Entity => ({ …defaults, ...overrides })` with types from `@pacevault/engine/types.ts`: in `records.ts` `createMockSessionRecord` (`{ timestamp: 0 }`) and `createMockSessionLap` (`{ lapIndex: 0, startTime: 0, endTime: 300_000, totalTimerTime: 300, distance: 1000, intensity: 'active' }`, from `apps/web/tests/lib/lapsAnalysis.spec.ts:5-14`); in `gps.ts` `createMockSessionGPS` (`sessionId: 'session-id'`, `pointCount: 3`, and the `encodedPolyline` and `bounds` literals of `apps/web/tests/lib/indexeddb.integration.test.ts:133-138` copied verbatim); in `personalBests.ts` `createMockPersonalBest` (`{ sport: 'cycling', category: 'peak-power', window: 5, value: 300, sessionId: 'session-id', date: 0 }`); in `dailyMetrics.ts` `createMockDailyMetrics` (`{ date: '2026-02-20', tss: 50, ctl: 40, atl: 50, tsb: -10, acwr: 1.0 }`, from `apps/web/tests/lib/prescription.spec.ts:14-21`). Nothing is removed yet.
   Check: `rg -n "^export const createMock[A-Za-z0-9]+ = \((?!overrides\?: Partial<)" --pcre2 packages/testing/src` prints nothing; `vp check` from `packages/testing/` is clean.

2. Rename the two existing entity factories and every call site.
   Files: `packages/testing/src/sessions.ts:6-29`, `apps/web/tests/factories/profiles.ts:3-16`; `makeSession` importers `packages/engine/tests/ewmaAlpha.spec.ts`, `packages/engine/tests/metrics.spec.ts`, `apps/web/tests/features/dashboard/hooks/useFilteredMetrics.spec.ts`, `apps/web/tests/features/intervals/intervalsSync.integration.test.ts`, `apps/web/tests/features/map/hooks/useGpsBackfill.integration.test.ts`, `apps/web/tests/features/map/hooks/useMapTracks.integration.test.ts`, `apps/web/tests/features/sessions/createIngestBatcher.integration.test.ts`, `apps/web/tests/features/sessions/recomputeTrainingLoad.integration.test.ts`, `apps/web/tests/features/sessions/reprocessSessions.integration.test.ts`, `apps/web/tests/features/trips/tripStats.spec.ts`, `apps/web/tests/lib/gpxExport.spec.ts`, `apps/web/tests/lib/intervalsSyncWindow.spec.ts`, `apps/web/tests/lib/moreStats.spec.ts`, `apps/web/tests/lib/sessionFitness.spec.ts`, `apps/web/tests/packages/engine/metricsCoaching.integration.test.ts`, `apps/web/tests/store/deleteAllData.integration.test.ts`, `apps/web/tests/store/sessionsStore.integration.test.ts`, `apps/web/tests/store/storeEngine.integration.test.ts`; `makeUserProfile` importers `apps/web/tests/features/intervals/intervalsImport.integration.test.ts`, `apps/web/tests/lib/thresholdsAt.spec.ts`, `apps/web/tests/parsers/fitThresholds.integration.test.ts`, `apps/web/tests/store/userStore.integration.test.ts` and the five `makeSession` importers above that also import it
   Change: `makeSession` → `createMockTrainingSession` and `makeUserProfile` → `createMockUserProfile`, both in place, each body becoming the expression form `(overrides?: Partial<Entity>): Entity => ({ …defaults, ...overrides })` with the defaults unchanged; `makeSessionSequence` keeps calling the renamed factory until item 3 moves it. Rename the import specifier and every call site in the importers (module paths unchanged: `@pacevault/testing/sessions.ts`, `../../testing/src/sessions.ts`, `@tests/factories/profiles.ts`). `apps/web/tests/lib/fingerprint.spec.ts` declares its own local `makeSession`; leave it to item 5.
   Check: `rg -n "import \{[^}]*\bmake(Session|UserProfile)\b" apps/web/tests packages/engine/tests` prints nothing; `vp test -- --run` from `apps/web/` and from `packages/engine/` pass with the same counts as before.

3. Move the series builders into their own module and repoint their importers.
   Files: `packages/testing/src/series.ts` (new), `packages/testing/src/records.ts`, `packages/testing/src/gps.ts`, `packages/testing/src/sessions.ts:4,31-73`; importers `packages/engine/tests/gps.spec.ts:3`, `packages/engine/tests/metrics.spec.ts:3`, `packages/engine/tests/normalize.spec.ts:7`, `packages/engine/tests/trainingEffect.spec.ts:9`, `packages/engine/tests/windExposure.spec.ts:5`, `apps/web/tests/features/sessions/createIngestBatcher.integration.test.ts`, `apps/web/tests/features/sessions/recomputeTrainingLoad.integration.test.ts`, `apps/web/tests/features/sessions/reprocessSessions.integration.test.ts`, `apps/web/tests/lib/chartData.integration.test.ts`, `apps/web/tests/lib/computePbsForSessions.spec.ts`, `apps/web/tests/lib/dynamicLaps.spec.ts`, `apps/web/tests/lib/gpxExport.spec.ts`, `apps/web/tests/lib/indexeddb.integration.test.ts`, `apps/web/tests/lib/sessionFitness.spec.ts`, `apps/web/tests/lib/validation.spec.ts`, `apps/web/tests/packages/engine/stressPipeline.integration.test.ts`, `apps/web/tests/store/deleteAllData.integration.test.ts`
   Change: Move `makeCyclingRecords`, `makeRunningRecords`, `makeLaps`, `makeInvalidRecords` and their private helpers (`clamp`, `randomWalk`, `generateTerrainSegments`, the `build*Array` functions, `assembleRecords`, and the `InvalidRecordKind` type and `FIELDS_BY_INVALID_RECORD_KIND` map and `LAP_DURATION_SEC` constant where the exhaustive-record-maps and duration-constants plans have already added them) out of `records.ts`, `makeGPSRunningRecords` and `makeIndoorRecords` out of `gps.ts`, and `makeSessionSequence` with its `DAY_MS` constant out of `sessions.ts` into `series.ts`, under the new names of the table and unchanged in behaviour; `sessionSeries` imports `createMockTrainingSession` from `./sessions.ts`. Delete `makeLapsFromRecords`. Remove every comment the moved code carries (`// --- Random-walk helpers ---`, the JSDoc blocks, the inline `//` notes) except the two why-notes the owner keeps, which move with their lines unchanged: the cardiac-drift note above `totalDrift` in `buildHrArray` (`records.ts:84`) and the per-record jitter note for the TRIMP gender split (`records.ts:100`). `DAY_MS` becomes `MS_PER_DAY` from `@pacevault/engine/time.ts` if the duration-constants plan has already created it; otherwise move the line as is. Drop imports the three old modules no longer use. In every importer, import the builders from `@pacevault/testing/series.ts` (app) or `'../../testing/src/series.ts'` (engine) under their new names and rename the call sites.
   Check: `rg -n "^export (const|function) (?!createMock[A-Z])" --pcre2 packages/testing/src --glob '!series.ts'` prints nothing; `rg -n "//|/\*" packages/testing/src` prints exactly two lines, both in `series.ts`: the cardiac-drift note and the TRIMP jitter note; `rg -n "@pacevault/testing/(records|gps)\.ts|testing/src/(records|gps)\.ts|\bmake(SessionSequence|CyclingRecords|RunningRecords|GPSRunningRecords|IndoorRecords|Laps|InvalidRecords|LapsFromRecords)\b" apps/web/tests packages/engine/tests packages/testing` prints nothing; `vp check` from the root is clean; `vp test -- --run` from `apps/web/` and from `packages/engine/` pass with the same counts.

4. Add the coaching-entity factories of the app.
   Files: `apps/web/tests/factories/coaching.ts` (new)
   Change: Export, with types from `@/types/index.ts`, `createMockCoachingRecommendation` (`{ status: 'neutral', message: '', tsb: 0, acwr: 1.0, injuryRisk: 'low', dataMaturityDays: 42 }`, from `apps/web/tests/lib/coachingMessages.spec.ts:12-19`), `createMockWorkoutStep` (`{ type: 'work', durationSec: 300, zone: 'tempo', targetPaceMin: 270, targetPaceMax: 290 }`, from `apps/web/tests/lib/groupSteps.spec.ts:5-11`) and `createMockWeeklyPlan` (`{ weekOf: '2026-02-09', workouts: [], totalEstimatedTss: 0, context: { mode: 'no-data' } }`, from `apps/web/tests/store/coachPlan.spec.ts:5-10`). Each takes `overrides?: Partial<Entity>` and spreads it last; the module exports nothing else.
   Check: `rg -n "^export (const|function) (?!createMock[A-Z])" --pcre2 apps/web/tests/factories` prints nothing; the item-1 grep over `apps/web/tests/factories` prints nothing; `vp check` from the root is clean.

5. Replace per-spec entity factories with the shared ones.
   Files: `apps/web/tests/lib/fingerprint.spec.ts:51-65`, `apps/web/tests/lib/lapsAnalysis.spec.ts:5-14`, `apps/web/tests/lib/validation.spec.ts:10-13`, `apps/web/tests/parsers/fit.spec.ts:12-14`, `apps/web/tests/lib/prescription.spec.ts:14-21`, `apps/web/tests/lib/coachingMessages.spec.ts:12-19`, `apps/web/tests/lib/groupSteps.spec.ts:5-11`, `apps/web/tests/store/coachPlan.spec.ts:5-10`, `apps/web/tests/lib/indexeddb.integration.test.ts:133-138`, `apps/web/tests/features/records/hooks/usePersonalBests.spec.ts:9-16`
   Change: Delete each local helper and call the shared factory with only the fields the test depends on: `makeSession(…)` → `createMockTrainingSession(…)` (`@pacevault/testing/sessions.ts`); `makeLap(…)` → `createMockSessionLap(…)` and `makeRecord(…)` → `createMockSessionRecord(…)` (`@pacevault/testing/records.ts`); `makeMetrics(…)` → `createMockDailyMetrics(…)` (`@pacevault/testing/dailyMetrics.ts`); `makeTestGPS(id)` → `createMockSessionGPS({ sessionId: id })` (`@pacevault/testing/gps.ts`); `pb(sessionId)` → `createMockPersonalBest({ sessionId })` (`@pacevault/testing/personalBests.ts`); `makeRec(…)` → `createMockCoachingRecommendation(…)`, `makeStep(…)` → `createMockWorkoutStep(…)`, `makePlan(weekOf)` → `createMockWeeklyPlan({ weekOf })` (`@tests/factories/coaching.ts`). `fingerprint.spec.ts`'s local defaults differ from `createMockTrainingSession` (`id: v4()`, `sport: 'running'`, `distance: 10000`, `tss: 100`, `stressMethod: 'trimp'`): run the spec after the swap and, in each test that fails, pass exactly the fields that test turns on at its call site — never restore a local factory.
   Check: `rg -n "^\s*const (make|build|create|mock)[A-Z]\w* = \(overrides" apps/web/tests --glob '*.spec.ts' --glob '*.integration.test.ts'` prints nothing; `vp test -- --run` from `apps/web/` passes with the same count.

6. Build the positional scenario helpers on the shared factories.
   Files: `apps/web/tests/lib/groupPbsBySport.spec.ts:6-22`, `apps/web/tests/lib/computePbsForSessions.spec.ts:9-16`, `apps/web/tests/lib/weather.spec.ts:195-200`
   Change: These helpers take positional scenario inputs, so they stay local but return the shared factory's instance and drop the factory-style name: `makePB(sport, window)` → `pbFor(sport, window)` returning `createMockPersonalBest({ sport, window, category, value, sessionId: v4() })` (the `if (sport === 'cycling')` choice of `category`/`value` kept); `makePowerBests(value, date)` → `powerBestsAt(value, date)` mapping `POWER_WINDOWS` to `createMockPersonalBest({ window, value, sessionId: 'existing', date })`; `makeRecord(timerTime, lat, lng)` → `gpsRecordAt(timerTime, lat, lng)` returning `createMockSessionRecord({ timestamp: timerTime, timerTime, lat, lng })`.
   Check: `rg -n "const (makePB|makePowerBests|makeRecord) =" apps/web/tests` prints nothing; `vp test -- --run tests/lib` from `apps/web/` passes with the same count.

7. Update the documented factory conventions.
   Files: `apps/web/tests/CLAUDE.md:18`, `packages/testing/CLAUDE.md:4,11`, `packages/testing/README.md:3,8-9`, `CLAUDE.md:13`
   Change: `apps/web/tests/CLAUDE.md:18` becomes `- **Factories**: Every entity a spec needs comes from a \`createMock<Entity>(overrides?)\` factory that returns a complete instance; pass only the fields the test turns on. Engine entities (sessions, records, laps, GPS, PBs, daily metrics) from \`@pacevault/testing/<entity>.ts\`, record/lap/session series from \`@pacevault/testing/series.ts\` (engine tests import both by relative path, \`../../testing/src/…\`, to avoid a workspace cycle); app entities (profile, coaching, workout step, weekly plan) from \`@tests/factories/<module>.ts\`. No local \`make…\` helpers and no entity object literals in specs; factory modules are imported by specs only.` `packages/testing/CLAUDE.md:4` becomes `**WHAT:** Entity factories (\`src/sessions.ts\`, \`src/records.ts\`, \`src/gps.ts\`, \`src/personalBests.ts\`, \`src/dailyMetrics.ts\`, each exporting only \`createMock<Entity>(overrides?)\`) and the series builders in \`src/series.ts\`, imported as \`@pacevault/testing/<module>.ts\`; no build step, no tests of its own. Shared code rules: root \`CLAUDE.md\` §2.`; line 11 becomes `- **Randomness**: The record series use \`Math.random\` and \`createMockTrainingSession\` uses \`Date.now()\`; assert ranges or pass explicit values when a test needs exact numbers.` `packages/testing/README.md:3` becomes `Test factories shared by the app and the packages: \`createMock<Entity>\` factories per entity (\`sessions.ts\`, \`records.ts\`, \`gps.ts\`, \`personalBests.ts\`, \`dailyMetrics.ts\`) and record, lap and session series (\`series.ts\`). Built on \`@pacevault/engine\` types.`; lines 8–9 become `import { createMockTrainingSession } from '@pacevault/testing/sessions.ts';` and `import { runningRecordSeries } from '@pacevault/testing/series.ts';`. `CLAUDE.md:13`: the description cell becomes `Test factories (\`createMock<Entity>\`) and record/session series for app and package tests` (Oxfmt realigns the table).
   Check: `rg -n "makeSession|makeRunningRecords|records, GPS and session factories" CLAUDE.md apps/web/tests/CLAUDE.md packages/testing` prints nothing; `vp run check` and `vp run test` from the root pass.

8. (packages/engine) Build every record in the engine specs with the shared factory.
   Files: `packages/engine/tests/cadence.spec.ts`, `packages/engine/tests/climbs.spec.ts`, `packages/engine/tests/decoupling.spec.ts`, `packages/engine/tests/effortDetection.spec.ts`, `packages/engine/tests/energy.spec.ts`, `packages/engine/tests/normalize.spec.ts` (or `normalizedEffort.spec.ts`), `packages/engine/tests/stress.spec.ts`, `packages/engine/tests/trainingEffect.spec.ts`, `packages/engine/tests/windExposure.spec.ts`, `packages/engine/tests/zoneDistribution.spec.ts` (or the zones spec it was merged into), `packages/engine/tests/gradient.spec.ts`
   Change: every `SessionRecord` object literal becomes a `createMockSessionRecord({ … })` call with the same fields, imported from `'../../testing/src/records.ts'` (item 1 adds it). `normalize.spec.ts:10` `makeRecord` is deleted and its call sites call `createMockSessionRecord` directly. The scenario builders that exist for one spec only (`ride`, `run`, `steadyRide`, `steadyRun`, `hrRecords`, `trackFromLngs`, `eastTrack`, `intervalRide`, …) stay in their spec (R7) and build each record through the factory. `GradientPoint` literals in `gradient.spec.ts` and `GPSBounds` literals in the bounds specs are not entities with a factory and stay.
   Check: `rg -n "timestamp:" packages/engine/tests | rg -v "createMockSessionRecord\(\{"` prints nothing; `rg -n "const makeRecord" packages/engine/tests` prints nothing; `vp test -- --run` from `packages/engine/` passes with the same count.

9. (packages/engine) Name the factory rule in the engine rules.
   Files: `packages/engine/CLAUDE.md`
   Change: in the **Tests** bullet (`CLAUDE.md:16`), "Factories come from `packages/testing` by relative path (`../../testing/src/…`)" becomes "Records, sessions and other engine entities come from the `createMock<Entity>` factories and series builders of `packages/testing` by relative path (`../../testing/src/…`); a spec writes no entity literal".
   Check: `rg -n "createMock<Entity>" packages/engine/CLAUDE.md` prints one line.

### packages/gpx

GPX route entities get factories in `packages/testing/src/route.ts` (owner decision); `@pacevault/testing` gains a dependency on `@pacevault/gpx`. gpx specs import it by relative path (`../../testing/src/route.ts`) like engine specs, app specs as `@pacevault/testing/route.ts`. Type locations are the ones colocated-types-module item 12 leaves (`RoutePoint` in `@pacevault/gpx/types.ts`). Builders used by one spec stay in it (R7) and build each point through a factory; none is shared, so `series.ts` gets nothing from gpx.

10. (packages/gpx) Add the route-entity factories.
   Files: `packages/testing/src/route.ts` (new), `packages/testing/package.json`, `pnpm-lock.yaml` (regenerated)
   Change: add `"@pacevault/gpx": "workspace:*"` to `dependencies` beside `@pacevault/engine`, run `pnpm install`, and create:

   ```ts
   import type { GpxMetadata, GpxPoint, GpxWaypoint } from '@pacevault/gpx/buildGpx.ts';
   import type { ParsedGpxPoint } from '@pacevault/gpx/parseGpx.ts';
   import type { RoutePoint } from '@pacevault/gpx/types.ts';

   export const createMockParsedGpxPoint = (overrides?: Partial<ParsedGpxPoint>): ParsedGpxPoint => ({
     lat: 47,
     lng: 11,
     seg: 0,
     ...overrides,
   });

   export const createMockRoutePoint = (overrides?: Partial<RoutePoint>): RoutePoint => ({
     ...createMockParsedGpxPoint(),
     dist: 0,
     ...overrides,
   });

   export const createMockGpxPoint = (overrides?: Partial<GpxPoint>): GpxPoint => ({
     lat: 48.137,
     lon: 11.575,
     ...overrides,
   });

   export const createMockGpxWaypoint = (overrides?: Partial<GpxWaypoint>): GpxWaypoint => ({
     lat: 48.138,
     lon: 11.576,
     name: 'Summit',
     ...overrides,
   });

   export const createMockGpxMetadata = (overrides?: Partial<GpxMetadata>): GpxMetadata => ({
     time: new Date('2026-01-01'),
     ...overrides,
   });
   ```

   The defaults are the required fields only, so an instance carries no optional key a spec did not ask for (`studioPoints.integration.test.ts:24` compares a stored point with `toEqual`).
   Check: the item-1 grep over `packages/testing/src` prints nothing; `vp check` from `packages/testing/` is clean.

11. (packages/gpx) Build every point in the gpx specs with the factories.
   Files: `packages/gpx/tests/buildGpx.spec.ts`, `packages/gpx/tests/routeCut.spec.ts`, `packages/gpx/tests/routeGeometry.spec.ts`, `packages/gpx/tests/routeProfile.spec.ts`
   Change: `buildGpx.spec.ts`: `makePoints(count)` (`:5-11`) → `trackPoints(count)` mapping to `createMockGpxPoint({ lat, lon, ele, time })` with the same values; the `metadata` literal (`:13-16`) → `const metadata = createMockGpxMetadata();` (same `time`, no `name`); `:20-23` → `createMockGpxMetadata({ name: 'Test Run', time: new Date('2024-01-15T06:00:00Z') })`; `:34` → `createMockGpxMetadata({ name: 'Run & Ride <fast>' })`; the `GpxPoint` literals (`:39-42`, `:50-53`) → `createMockGpxPoint({ lat, lon })` / `({ lat, lon, ele })`; the waypoints (`:74-82`) → `createMockGpxWaypoint({ lat: 48.1371234, lon: 11.5751234, ele: 530.06, name: 'Café & <Hut>', desc: '"Fresh" water' })` and `createMockGpxWaypoint({ lat: 48.138, lon: 11.576 })`. `routeCut.spec.ts`: `denseTrack` (`:12-19`) maps to `createMockParsedGpxPoint({ lat, lng, ele, time })` (`seg` is the default 0); the four literals at `:183-188` → `createMockParsedGpxPoint({ lat: 0, lng: 0 })`, `({ lat: 0, lng: 1 })`, `({ lat: 0, lng: 10, seg: 1 })`, `({ lat: 0, lng: 11, seg: 1 })`. `routeGeometry.spec.ts`: the positional helper `point(lat, lng, ele, seg)` (`:6-11`) → `pointAt(lat, lng, ele, seg)` returning `createMockParsedGpxPoint({ lat, lng, ele, seg })` (positional scenario helper, R7). `routeProfile.spec.ts`: `point(dist, ele)` (`:5-11`) → `pointAtDistance(dist, ele)` returning `createMockRoutePoint({ lat: 47 + dist / 111_190, ele, dist })`; `routeWithRamp` calls it. Factories come from `'../../testing/src/route.ts'`.
   Check: `rg -n "^const (point|makePoints) =|seg: 0,|: GpxPoint\[\] = \[" packages/gpx/tests` prints nothing; `vp -C packages/gpx exec vitest run` passes with the same count; the `buildGpx` file snapshot is unchanged.

12. (packages/gpx) Build the route points of the app specs with the factory.
   Files: `apps/web/tests/lib/gpxExport.spec.ts`, `apps/web/tests/lib/studioPoints.integration.test.ts`, `apps/web/tests/lib/chartData.spec.ts`
   Change: `gpxExport.spec.ts:9-17` `routePoints(count)` → `routePointsAlong(count)` returning `createMockRoutePoint({ lat, lng, ele, dist, time })` with the same values (`seg` is the default); `studioPoints.integration.test.ts:10-17` `makePoints(count)` → `routePointsAlong(count)` returning `createMockRoutePoint({ lat, lng, ele, dist })` with the same values; `chartData.spec.ts:107` and `:118-132` → `createMockRoutePoint({ ele, dist })` (the charts read neither coordinate nor segment beyond the defaults). All import from `@pacevault/testing/route.ts`.
   Check: `rg -n "seg: 0" apps/web/tests/lib/gpxExport.spec.ts apps/web/tests/lib/studioPoints.integration.test.ts apps/web/tests/lib/chartData.spec.ts` prints nothing; `vp test -- --run` from `apps/web/` passes with the same count.

13. (packages/gpx) Name the factory rule in the gpx rules.
   Files: `packages/gpx/CLAUDE.md`
   Change: append to the **Tests** bullet (`CLAUDE.md:10`): "Route points, GPX points, waypoints and metadata come from the `createMock<Entity>` factories of `packages/testing/src/route.ts` by relative path (`../../testing/src/route.ts`); a spec writes no entity literal."
   Check: `rg -n "createMock<Entity>" packages/gpx/CLAUDE.md` prints one line.

### packages/testing

Items 14–17 run after item 3 and edit `packages/testing/src/series.ts` only, plus the callers named. Each removes an input or a branch no caller reaches; every value a spec observes stays identical, including the order of the `Math.random` draws. Names are the ones items 1–3 leave; names-spell-out-their-meaning and signature-parameter-shape rename and reshape the same code afterwards.

14. (packages/testing) Drop the options `gpsRunningRecordSeries` is never given.
   Files: `packages/testing/src/series.ts`
   Change: no caller passes `options` (`gpxExport.spec.ts:22,36,51,59`, `gps.spec.ts:47` and the `gpsTrack` spec all call `gpsRunningRecordSeries(count)`). Before:

   ```ts
   export const gpsRunningRecordSeries = (
     count: number,
     options?: { startLat?: number; startLng?: number; baseHr?: number },
   ): SessionRecord[] => {
     const startLat = options?.startLat ?? 48.137;
     const startLng = options?.startLng ?? 11.575;
     const baseHr = options?.baseHr ?? 145;
   ```

   After, the three constants at module top of `series.ts` and the function taking `count` alone:

   ```ts
   const GPS_SERIES_START_LATITUDE_DEGREES = 48.137;
   const GPS_SERIES_START_LONGITUDE_DEGREES = 11.575;
   const GPS_SERIES_BASE_HR_BPM = 145;

   export const gpsRunningRecordSeries = (count: number): SessionRecord[] => {
   ```

   with `lat: GPS_SERIES_START_LATITUDE_DEGREES + i * 0.0001`, `lng: GPS_SERIES_START_LONGITUDE_DEGREES + i * 0.00015`, `hr: GPS_SERIES_BASE_HR_BPM + (i / count) * 15`; the rest of the body is unchanged.
   Check: `rg -n "startLat|startLng|options\?\.baseHr" packages/testing/src` prints nothing; `vp run test` passes with the same counts.

15. (packages/testing) Reduce `sessionSeries` to the inputs its one caller passes.
   Files: `packages/testing/src/series.ts`, `packages/engine/tests/metrics.spec.ts:27-31`
   Change: the only caller passes `startDate`, `baseTss` and `tssVariation` and never `sport` or `daysBetween`. The options become required and the dead ones go: `sessionSeries(count: number, options: { startDate: number; baseTss: number; tssVariation: number })`. The body keeps `const tss = options.baseTss + options.tssVariation * Math.sin(i * 0.8);` and computes `const date = options.startDate + i * DAY_MS;` (`MS_PER_DAY` once the duration-constants plan has run; `i * 1 * DAY_MS` equals `i * DAY_MS` exactly). Delete the four `?? …` defaults, the `let stressMethod … if (sport === 'cycling')` block, and the `sport`, `stressMethod` and `isPlanned: false` keys of the `createMockTrainingSession({ … })` call: they always passed `'cycling'`, `'tss'` and `false`, which are that factory's own defaults, so every session is unchanged, key order included. The call keeps exactly `id` (its `session-seq-${i}` template), `date`, `tss: Math.round(tss * 10) / 10`, `duration: 3600 + i * 60` and `createdAt: date`. The caller in `metrics.spec.ts` stays as it is.
   Check: `rg -n "daysBetween|stressMethod|sport" packages/testing/src/series.ts` prints nothing; `vp test -- --run` from `packages/engine/` passes with the same count.

16. (packages/testing) Delete the unreachable branches of the record channel synthesis.
   Files: `packages/testing/src/series.ts`
   Change: in `generateTerrainSegments` delete the trailing `if (remaining > 0) { segments.push({ length: remaining, slope: 0 }); }`: the last loop pass takes `length = remaining`, and an earlier exit means `remaining` already reached 0. Keep the `Math.random()` draw inside the `length` expression of that last pass even though the value is overwritten — dropping it would shift every later draw. In `buildElevationArray` delete the `while (elevations.length < count)` fill: the segments sum to `count`, so the loop has already pushed `count` values. In `buildSpeedArray` delete `const hasTerrain = elevations.length > 0;` and write `if (i > 0)`: both callers pass `buildElevationArray(count, …)`, which holds `count` values whenever the loop body runs.
   Check: `rg -n "hasTerrain|elevations.length < count|slope: 0" packages/testing/src` prints nothing; `vp run test` passes with the same counts (every record-series spec in `apps/web/tests` and `packages/engine/tests`).

17. (packages/testing) Make the channel inputs of `assembleRecords` and `buildPowerArray` say what callers pass.
   Files: `packages/testing/src/series.ts`
   Change: both callers of `assembleRecords` pass `elevations` and `cadences`, only cycling passes `powers`. `channels?: { elevations?: number[]; cadences?: number[]; powers?: number[] }` becomes `channels: { elevations: number[]; cadences: number[]; powers?: number[] }`; the record literal gains `elevation: channels.elevations[i], cadence: channels.cadences[i]` after `distance` (same key order as the two removed `if (channels?.…)` assignments), and only `if (channels.powers) record.power = channels.powers[i];` stays. `buildPowerArray` drops its `count` parameter, which always equals `speeds.length`: the loop runs to `speeds.length` and the ramp is `Math.min(15, Math.floor(speeds.length * 0.01))`; its caller becomes `buildPowerArray(basePower, speeds, grades, baseSpeed)`.
   Check: `rg -n "channels\?|buildPowerArray\(count" packages/testing/src` prints nothing; `vp run test` passes with the same counts.

## Open items

- R5 (each package publishes its entities' factories from a `./testing` subpath) dropped by the owner: `@pacevault/testing` and `apps/web/tests/factories/` stay, no `exports` change in `packages/engine/package.json`, no repoint of `tools/workbench/scripts/deps.ts:405`.
- R6 holds today and is kept by the factory modules living outside every `src/` that ships: `rg -n "@pacevault/testing|@tests/" apps/web/src packages/*/src` prints nothing.
- R8: `createMockTrainingSession` keeps the `Date.now()`-based `id`, `date` and `createdAt` defaults of `makeSession` so no spec's behaviour changes; specs that assert on those fields already pass explicit values.
- Local builders that produce no schema-defined entity stay colocated with their spec as fixtures: `makeParsed` (`createIngestBatcher` integration spec, a parse result built from the shared factories), `makeLongRideWithStops` (`chartData` integration spec), `makeHourly` (`weather.spec.ts`, an Open-Meteo payload), `makeFitLap` (`fitLaps.spec.ts`, raw parser input), `makeRouteInput` (`studio.spec.ts`, a store action input), `makeTrack` (`trackPicking.spec.ts`), `makeZip` (`archive.spec.ts`), `mockEvent` (`useChartZoom` integration spec).
- `packages/testing`: `TrainingSession.isPlanned` and `hasDetailedRecords` in the `createMockTrainingSession` defaults keep their persisted names: persisted `TrainingSession` flags are excluded from the boolean-naming rename (`tdr/boolean-names-without-is-prefix.md` §1 scope).
- `packages/testing`: the spec titles and notes in `packages/engine/tests/trainingEffect.spec.ts` that mention `baseHr` are spec text, not code; the unit rename of the option (names-spell-out-their-meaning) leaves them as they are.
- `packages/engine/tests/normalize.spec.ts:10` `makeRecord` is replaced by item 8; the gpx route points (`packages/gpx/tests/*`, `studioPoints` integration spec, `gpxExport` and `chartData` specs) get factories in items 10–12.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
