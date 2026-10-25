---
id: helpers-group-by-topic
tdr_reference: tdr/helpers-group-by-topic.md
depends_on: [names-spell-out-their-meaning, zod-schema-naming-and-inference, spec-describe-and-case-titles]
generated: 2026-10-23
---

# One helper module per topic

Read `tdr/helpers-group-by-topic.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`names-spell-out-their-meaning`](names-spell-out-their-meaning.md) — settles the engine's function names first, so items 7–13 move each function once, under its final name.
- [`zod-schema-naming-and-inference`](zod-schema-naming-and-inference.md) — switches `board.ts` to the `zod` import that item 18 moves into the new modules.
- [`spec-describe-and-case-titles`](spec-describe-and-case-titles.md) — titles the workbench specs whose cases items 17 and 19 move into new specs.

## Changes

Every item merges one topic that is split across several `apps/web/src/lib` modules into a single module named for the topic. A merge is mechanical: append the source module's declarations to the target (keep every export name unchanged, drop the import of the target from the source's code, merge duplicate imports), delete the source file, and rewrite every `from '@/lib/<source>.ts'` and `from './<source>.ts'` to the target. Spec files keep their names here; renaming them to the merged subject is the mirrored-spec-layout plan's job. Run every item from the repo root; "clean `vp check`" means `vp run -F @pacevault/i18n compile && vp check` finishes with no error. Lowest risk first.

1. Intervals: merge `intervalsSyncWindow.ts` into `intervals.ts`.
   Files: `apps/web/src/lib/intervalsSyncWindow.ts` (deleted), `apps/web/src/lib/intervals.ts`, `apps/web/src/features/intervals/runIntervalsSync.ts`, `apps/web/tests/lib/intervalsSyncWindow.spec.ts`
   Change: Move `BUFFER_DAYS`, `DAY_MS`, `toLocalDate` (module-local) and `export const intervalsSyncWindowOldest` into `intervals.ts`, which already owns the listing window (`FULL_HISTORY_OLDEST`, `listIntervalsActivities`). Repoint the two importers to `@/lib/intervals.ts`.
   Check: `test ! -e apps/web/src/lib/intervalsSyncWindow.ts`; `rg -n "intervalsSyncWindow\.ts" apps/web` prints nothing; clean `vp check`; `vp run test` passes.

2. Weather: merge `weatherSummary.ts` into `weather.ts`.
   Files: `apps/web/src/lib/weatherSummary.ts` (deleted), `apps/web/src/lib/weather.ts`, `apps/web/src/features/sessions/session/WeatherCard.tsx`, `apps/web/tests/lib/weatherSummary.spec.ts`
   Change: Move `ValueRange`, `ConditionChange` (module-local), `WeatherSummary` and `summarizeWeather` into `weather.ts`; drop the now-internal `import { wmoToCondition, type WeatherSnapshot } from '@/lib/weather.ts'`. Repoint the two importers to `@/lib/weather.ts`.
   Check: `test ! -e apps/web/src/lib/weatherSummary.ts`; `rg -n "weatherSummary\.ts" apps/web` prints nothing; clean `vp check`; `vp run test` passes.

3. Chart rows: merge `chartBuckets.ts` into `chartData.ts`.
   Files: `apps/web/src/lib/chartBuckets.ts` (deleted), `apps/web/src/lib/chartData.ts`, `apps/web/tests/lib/chartBuckets.spec.ts`, `apps/web/tests/lib/chartData.integration.test.ts`
   Change: `bucketSeries` and `TARGET_ROWS` are only ever used to build chart rows (`chartData.ts` is their sole source consumer). Move all of `chartBuckets.ts` (exports `TARGET_ROWS`, `bucketSeries` and its types) into `chartData.ts`. Repoint the two spec imports to `@/lib/chartData.ts`.
   Check: `test ! -e apps/web/src/lib/chartBuckets.ts`; `rg -n "chartBuckets\.ts" apps/web` prints nothing; clean `vp check`; `vp run test` passes.

4. Saved filters: merge `attributeFilters.ts` into `savedFilters.ts`.
   Files: `apps/web/src/lib/attributeFilters.ts` (deleted), `apps/web/src/lib/savedFilters.ts`, `apps/web/tests/lib/attributeFilters.spec.ts`
   Change: `ATTRIBUTE_FILTER_KEYS`, `fuzzyBounds` and `matchesFuzzy` are the matching half of saved-filter criteria and are read only by `savedFilters.ts` (`:5`). Move them into `savedFilters.ts` and drop its import of `@/lib/attributeFilters.ts`. Repoint the spec to `@/lib/savedFilters.ts`.
   Check: `test ! -e apps/web/src/lib/attributeFilters.ts`; `rg -n "attributeFilters\.ts" apps/web` prints nothing; clean `vp check`; `vp run test` passes.

5. IndexedDB: merge `indexeddb.ts`, `idbStorage.ts` and `weatherDb.ts` into `db.ts`.
   Files: `apps/web/src/lib/indexeddb.ts`, `apps/web/src/lib/idbStorage.ts`, `apps/web/src/lib/weatherDb.ts` (all deleted), `apps/web/src/lib/db.ts`; importers of `indexeddb.ts`: `apps/web/src/pages/SessionDetailPage.tsx`, `apps/web/src/features/map/gpsBuild.worker.ts`, `apps/web/src/features/records/personalBests.worker.ts`, `apps/web/src/features/sessions/session/hooks/useSessionExport.ts`, `apps/web/src/features/map/hooks/useSessionDetailPath.ts`, `apps/web/src/features/map/hooks/useGpsBackfill.ts`, `apps/web/src/features/sessions/session/hooks/useSessionWeather.ts`, `apps/web/src/features/map/hooks/useSessionFitBounds.ts`, `apps/web/src/features/sessions/session/hooks/useEditInStudio.ts`, `apps/web/src/lib/storageBreakdown.ts`, `apps/web/src/features/sessions/session/DeleteSessionDialog.tsx`, `apps/web/src/features/demo/loadDemoData.ts`, `apps/web/src/features/studio/DeleteStudioRouteDialog.tsx`, `apps/web/src/features/studio/hooks/useStudioRoutePoints.ts`, `apps/web/src/features/sessions/recomputeTrainingLoad.ts`, `apps/web/src/features/studio/hooks/useStudioRouteExport.ts`, `apps/web/src/features/settings/hooks/useStorageBreakdown.ts`, `apps/web/src/features/studio/createStudioRoute.ts`, `apps/web/src/features/studio/hooks/useStudioMapPopup.ts`, `apps/web/src/features/sessions/reprocessSessions.ts`, `apps/web/src/features/sessions/createIngestBatcher.ts`, `apps/web/src/features/settings/DeleteAllDataDialog.tsx`, `apps/web/tests/store/deleteAllData.integration.test.ts`, `apps/web/tests/lib/studioPoints.integration.test.ts`, `apps/web/tests/lib/indexeddb.integration.test.ts`, `apps/web/tests/features/sessions/createIngestBatcher.integration.test.ts`, `apps/web/tests/features/sessions/recomputeTrainingLoad.integration.test.ts`, `apps/web/tests/features/sessions/reprocessSessions.integration.test.ts`; importers of `idbStorage.ts`: `apps/web/src/store/user.ts`, `apps/web/src/store/coachPlan.ts`, `apps/web/src/store/studio.ts`, `apps/web/src/store/layout.ts`, `apps/web/src/store/intervals.ts`, `apps/web/src/store/mapPreferences.ts`, `apps/web/src/store/filters.ts`, `apps/web/src/store/trips.ts`, `apps/web/src/lib/guardedSessionsStorage.ts`, `apps/web/tests/store/deleteAllData.integration.test.ts`, `apps/web/tests/features/sessions/recomputeTrainingLoad.integration.test.ts`; importers of `weatherDb.ts`: `apps/web/src/features/sessions/session/hooks/useSessionWeather.ts`, `apps/web/src/features/sessions/session/DeleteSessionDialog.tsx`
   Change: All four modules are one subject — the app's IndexedDB database: `db.ts` opens it (`getDB`, schema, `DB_NAME`, `DB_VERSION`), `indexeddb.ts` reads and writes its stores, `weatherDb.ts` reads and writes the `session-weather` store, `idbStorage.ts` adapts its `kv` store to zustand's `StateStorage`. Move every declaration of the three into `db.ts` with names unchanged (`idbStorage`, `getSessionWeather`, `saveSessionWeather`, `deleteSessionWeather`, `getSessionRecords`, … `measureStoreBytes`). `db.ts` keeps its type-only import of `SessionWeather` from `./weather.ts`. Repoint every importer listed above to `@/lib/db.ts` (merge with an existing `@/lib/db.ts` import where a module already has one). `apps/web/CLAUDE.md:23` already names `src/lib/db.ts` as the IndexedDB module and stays correct.
   Check: `ls apps/web/src/lib/indexeddb.ts apps/web/src/lib/idbStorage.ts apps/web/src/lib/weatherDb.ts` reports all three missing; `rg -n "lib/(indexeddb|idbStorage|weatherDb)\.ts|'\./(indexeddb|idbStorage|weatherDb)\.ts'" apps/web` prints nothing; clean `vp check`; `vp run test` and `vp run e2e` pass; `vp run build` succeeds (both workers still bundle).

6. Laps: merge `lapRanges.ts`, `lapSet.ts`, `lapSummary.ts`, `dynamicLaps.ts` and `effortLaps.ts` into `laps.ts`.
   Files: `apps/web/src/lib/lapRanges.ts`, `apps/web/src/lib/lapSet.ts`, `apps/web/src/lib/lapSummary.ts`, `apps/web/src/lib/dynamicLaps.ts`, `apps/web/src/lib/effortLaps.ts` (all deleted), `apps/web/src/lib/laps.ts`; importers: `apps/web/src/lib/railRange.ts`, `apps/web/src/features/sessions/session/LapStrip.tsx`, `apps/web/src/features/map/DeckGLOverlay.tsx`, `apps/web/src/features/map/lapPath.ts`, `apps/web/src/features/map/SessionTerrain.tsx`, `apps/web/src/features/map/hooks/useTerrainLapStateEffect.ts`, `apps/web/src/features/map/hooks/useTerrainTrackPickingEffect.ts`, `apps/web/src/components/charts/LapBands.tsx`, `apps/web/src/features/sessions/charts/SessionChartsExplorer.tsx`, `apps/web/src/store/mapControls.ts`, `apps/web/src/store/mapPreferences.ts`, `apps/web/src/features/sessions/session/LapsControl.tsx`, `apps/web/src/features/sessions/session/hooks/useSessionLapsEffect.ts`, `apps/web/src/features/sessions/session/LapsRow.tsx`, `apps/web/src/features/sessions/session/lapLabels.ts`, `apps/web/tests/lib/lapRanges.spec.ts`, `apps/web/tests/features/map/lapPath.spec.ts`, `apps/web/tests/lib/lapSet.spec.ts`, `apps/web/tests/lib/effortLaps.spec.ts`, `apps/web/tests/lib/lapSummary.spec.ts`, `apps/web/tests/lib/dynamicLaps.spec.ts`, `apps/web/tests/features/demo/buildDemoDataset.spec.ts`
   Change: The six modules are one subject — a session's laps: `laps.ts` analyses them (`analyzeLaps`, `detectIntervals`, `LapAnalysis`), `lapRanges.ts` maps them to record spans and chart bands (`LapSpan`, `LapBand`, `deviceLapSpans`, `lapBands`, `lapIndexAtRecord`, `lapIndexAtTime`, `bandsOnRows`), `dynamicLaps.ts` builds distance splits (`recordedDistance`, `splitDistanceRange`, `computeDynamicLaps`), `effortLaps.ts` builds effort laps (`effortWorkAverage`, `buildEffortLapSet`, `effortWorkSet`, `effortWorkCount`, `effortPattern`), `lapSet.ts` selects the active set (`LapSource`, `effectiveSplitDistance`, `LapSetEfforts`, `LapSet`, `buildDeviceLapSet`, `buildLapSet`, `stepLap`), `lapSummary.ts` summarises it (`MIN_SUMMARY_LAPS`, `summarizeLaps`); they import each other in a chain (`lapSet` → `laps`, `dynamicLaps`, `lapRanges`, `effortLaps`). Move them into `laps.ts` in dependency order (ranges, dynamic, effort, set, summary after the existing analysis code), names unchanged, internal imports dropped, external imports (`@pacevault/engine/*`, `@/lib/movingTime.ts`, `@/lib/thresholdsAt.ts`) merged at the top. Repoint every importer listed above to `@/lib/laps.ts`.
   Check: `ls apps/web/src/lib/lapRanges.ts apps/web/src/lib/lapSet.ts apps/web/src/lib/lapSummary.ts apps/web/src/lib/dynamicLaps.ts apps/web/src/lib/effortLaps.ts` reports all five missing; `rg -n "lib/(lapRanges|lapSet|lapSummary|dynamicLaps|effortLaps)\.ts|'\./(lapRanges|lapSet|lapSummary|dynamicLaps|effortLaps)\.ts'" apps/web` prints nothing; clean `vp check`; `vp run test` and `vp run e2e` pass.

### packages/engine

Items 7–13 regroup `packages/engine/src` by topic. A move keeps the function body, its name and its comments (the `@see` tags and why-notes travel with it), rewrites every importer (`from '@pacevault/engine/<old>.ts'` in the app, `packages/gpx`, `packages/testing` and `tools/`, `from './<old>.ts'` inside the engine) and moves or merges the engine spec to the new module's name in the same item — engine specs are named after their module (`packages/engine/CLAUDE.md` § Tests). `packages/engine/SOURCES.md` follows every move in its module column and `// Sources:` headers are split or merged with the code they cite.

7. (packages/engine) Pin today's outputs before moving anything.
   Files: new `packages/engine/tests/pinnedOutputs.spec.ts` (temporary, deleted by item 13)
   Change: the spec builds one deterministic session — 4,000 records with `timestamp: i`, `hr: Math.round(140 + 25 * Math.sin(i / 97))`, `power: Math.round(220 + 90 * Math.sin(i / 53))`, `cadence: 85`, `speed: 3 + Math.sin(i / 71)`, `distance` the running sum of `speed`, `elevation: 100 + 20 * Math.sin(i / 300)`, `lat: 48 + i * 1e-5`, `lng: 8.4 + 1e-3 * Math.sin(i / 200)`, leaving out the records of seconds 1200–1259 — and, inside one `describe('pinned engine outputs', …)`, one `toMatchInlineSnapshot()` case per call: `haversineDistanceMeters` and `initialBearingDegrees` between records 0 and 3999; `boundsFromPoints` of all record coordinates; `unionBounds` of that box with `{ minLat: 47, maxLat: 47.5, minLng: 9, maxLng: 9.5 }`; `hasBoundsOverlap` and `isSegmentIntersectingBounds([8.39, 47.99], [8.41, 48.05], box)` against that box; `densestClusterBounds` of five boxes (three within 0.1° of each other, two 1° away); `runningZonesFromThresholdPace(300)`; `secondsInZones` with five equal HR bands of 20 bpm from 100; `normalizedPowerFromRecords`, `gradeAdjustedPaceFromRecords` and the length and sum of `powerPerSecond`; `detectEfforts` for `'cycling'` with `{ restHr: 50, maxHr: 190, ftp: 250 }`. Call each with the signature it has when this item runs. Fill the snapshots once with `vp test -- --run -u tests/pinnedOutputs.spec.ts` from `packages/engine`; never pass `-u` again in this plan.
   Check: the spec passes without `-u` and its inline snapshots are filled.

8. (packages/engine) Split `gps.ts` into its two topics: geodesy and bounding boxes.
   Files: `packages/engine/src/gps.ts` (deleted), new `packages/engine/src/geodesy.ts`, new `packages/engine/src/bounds.ts`, `packages/engine/src/windExposure.ts`, `packages/engine/tests/gps.spec.ts` (→ `geodesy.spec.ts` and `bounds.spec.ts`), `packages/engine/tests/gpsPick.spec.ts` (or `gps.pick.spec.ts`, merged into `bounds.spec.ts`), `packages/engine/SOURCES.md`, and the importers `apps/web/src/lib/gpsTrack.ts`, `apps/web/src/lib/gpxExport.ts`, `apps/web/src/features/map/zoneColoredPath.ts`, `apps/web/src/lib/weather.ts`, `apps/web/src/features/map/previewDrawIn.ts`, `apps/web/src/features/demo/demoRecords.ts`, `apps/web/src/features/map/trackPicking.ts`, `apps/web/src/features/map/hooks/useStudioMapTracks.ts`, `apps/web/src/features/map/hooks/useMapCameraEffect.ts`, `packages/gpx/src/routeGeometry.ts`, `packages/gpx/tests/routeCut.spec.ts`, `apps/web/tests/features/demo/buildDemoDataset.spec.ts`
   Change: `geodesy.ts` (`// Sources: [Veness2019]`) holds `EARTH_RADIUS_METERS`, `isValidCoordinate`, `degreesToRadians`, `haversineDistanceMeters`, `initialBearingDegrees`. `bounds.ts` (`// Sources: [LiangBarsky1984]`) holds `CLUSTER_RADIUS_DEGREES`, `boundsFromPoints`, `hasBoundsOverlap`, `unionBounds`, `isSegmentIntersectingBounds`, `densestClusterBounds` and their helpers `boundsCenter`, `scaledDistanceDegrees`. Two simplifications land with the move, both result-identical: `isValidCoordinate` becomes a type guard, `(point: { lat?: number | null; lng?: number | null }): point is { lat: number; lng: number }`, same body, and the `&& r.lat != null && r.lng != null` re-checks after it go (`windExposure.ts:92`, `apps/web/src/lib/gpsTrack.ts` `extractGPSPoints`, `apps/web/src/lib/gpxExport.ts:19`, and `zoneColoredPath.ts` if it repeats them); `boundsFromPoints` and `unionBounds` share one module-local loop, `const extentOf = (extents: Iterable<GPSBounds>): GPSBounds => { let minLat = Infinity; let maxLat = -Infinity; let minLng = Infinity; let maxLng = -Infinity; for (const e of extents) { if (e.minLat < minLat) minLat = e.minLat; if (e.maxLat > maxLat) maxLat = e.maxLat; if (e.minLng < minLng) minLng = e.minLng; if (e.maxLng > maxLng) maxLng = e.maxLng; } return { minLat, maxLat, minLng, maxLng }; };`, with `boundsFromPoints = (points) => extentOf(points.map((p) => ({ minLat: p.lat, maxLat: p.lat, minLng: p.lng, maxLng: p.lng })))` and `unionBounds` calling `extentOf(boundsArray)` after its empty check — the same comparisons in the same order as both loops today. Spec cases move with their subject: the `initialBearingDegrees` describe into `geodesy.spec.ts`, the overlap, cluster and segment cases into `bounds.spec.ts`. `SOURCES.md` rows for Liang–Barsky → `bounds.ts`, bearing and haversine → `geodesy.ts`.
   Check: `test ! -e packages/engine/src/gps.ts`; `rg -n "engine/gps\.ts|from '\./gps\.ts'" apps packages tools --glob '!node_modules'` prints nothing; `rg -n "isValidCoordinate\([^)]*\) && \w+\.lat != null" apps packages --glob '!node_modules'` prints nothing; the pinned spec passes; clean `vp check`; `vp run test` and `vp run e2e` pass.

9. (packages/engine) Merge the zone modules into one.
   Files: `packages/engine/src/zoneDistribution.ts` (deleted), `packages/engine/src/zones.ts`, `packages/engine/tests/zoneDistribution.spec.ts` (merged into `zones.spec.ts`), `packages/engine/SOURCES.md`, `apps/web/src/lib/zoneColors.ts`, `apps/web/src/lib/sessionTitleFormatter.ts`, `apps/web/src/lib/moreStats.ts`
   Change: append `HEART_RATE_ZONES`, `POWER_ZONES`, `HeartRateZoneName`, `PowerZoneName` and `secondsInZones` to `zones.ts`; its header becomes `// Sources: [Daniels2013], [Karvonen1957], [CogganAllen2010]`. The `secondsInZones` spec cases join `zones.spec.ts`. `SOURCES.md` rows for `zoneDistribution.ts` → `zones.ts`.
   Check: `test ! -e packages/engine/src/zoneDistribution.ts`; `rg -n "zoneDistribution" apps packages tools --glob '!node_modules' --glob '!tools/workbench/backlog/**'` prints nothing; the pinned spec passes; clean `vp check`; `vp run test` passes.

10. (packages/engine) Name the record-pair timing and the normalized-effort metrics for their topics.
   Files: `packages/engine/src/normalize.ts` (deleted), new `packages/engine/src/recordPairs.ts`, new `packages/engine/src/normalizedEffort.ts`, `packages/engine/tests/normalize.spec.ts` (→ `normalizedEffort.spec.ts`), `packages/engine/SOURCES.md`, the engine importers (`cadence.ts`, `climbs.ts`, `decoupling.ts`, `effortDetection.ts`, `energy.ts`, `sessionDerivation.ts`, `stress.ts`, `zones.ts`), and `apps/web/src/lib/records.ts`, `apps/web/src/lib/railRange.ts`, `apps/web/src/lib/chartData.ts`, `apps/web/src/lib/moreStats.ts`, `apps/web/tests/packages/engine/stressPipeline.integration.test.ts` (or its re-homed name), `apps/web/tests/features/sessions/reprocessSessions.integration.test.ts`
   Change: `recordPairs.ts` holds `MAX_MOVING_PAIR_GAP_SEC`, `activeSeconds` and `isMovingPair` — the pause rule eight engine modules read. `normalizedEffort.ts` holds `NP_ROLLING_WINDOW_SEC`, the GAP constants, `powerPerSecond`, `normalizedPowerFromRecords`, `gradeAdjustedPaceFactor` and `gradeAdjustedPaceFromRecords`, with their `@see` tags. `SOURCES.md` rows for `normalize.ts` → `normalizedEffort.ts`.
   Check: `test ! -e packages/engine/src/normalize.ts`; `rg -n "engine/normalize\.ts|from '\./normalize\.ts'|src/normalize\.ts" apps packages tools --glob '!node_modules'` prints nothing; the pinned spec passes; clean `vp check`; `vp run test` passes.

11. (packages/engine) Give the change-point algorithm its own module.
   Files: `packages/engine/src/effortDetection.ts`, new `packages/engine/src/changePoints.ts`, `packages/engine/SOURCES.md`
   Change: move `pelt` (`effortDetection.ts:279-325`, with its `@see [Killick2012]` tag) into `changePoints.ts` as `export const peltChangePoints`, body unchanged; it reads nothing but its inputs. `peltSegments` imports it. The PELT row of `SOURCES.md` → `changePoints.ts`. The grid, binning, post-processing and guard steps stay in `effortDetection.ts`: they share its private `Grid`, `Bin`, `Segment` and `Piece` types, and splitting them would push those internals into the engine's shared `types.ts`.
   Check: `rg -n "^const pelt\b" packages/engine/src` prints nothing; the pinned spec passes; clean `vp check`; `vp run test` passes.

12. (packages/engine) Update the module names in the engine docs.
   Files: `packages/engine/README.md`, `packages/engine/CLAUDE.md`, `CLAUDE.md`
   Change: `README.md:3` lists the topics as they are now ("record pairs and normalized effort, training load and stress, zones, training effect, VDOT and pace calculation, decoupling, climbs and gradient, wind exposure, geodesy and bounding boxes, effort detection and change points"); `packages/engine/CLAUDE.md` and the root `CLAUDE.md` repo map name no deleted module (the root map's engine row reads "metrics, zones, stress, GPS" → "metrics, zones, stress, geodesy").
   Check: `rg -n "gps\.ts|normalize\.ts|zoneDistribution\.ts" packages/engine CLAUDE.md` prints nothing.

13. (packages/engine) Delete the pinned spec.
   Files: `packages/engine/tests/pinnedOutputs.spec.ts`
   Change: delete the file once items 8–11 pass against it.
   Check: `test ! -e packages/engine/tests/pinnedOutputs.spec.ts`; `vp run test` passes.

### packages/gpx

`simplifyGpxPoints.ts`, a one-function module whose only reader was the polyline encoding, left gpx with that encoding (engine-holds-domain-logic-only item 10), so no gpx module has to merge. Items 14–15 give a computation two gpx modules repeat one home. Names are the ones in force after names-spell-out-their-meaning items 5–8; the move of `@pacevault/engine/gps.ts` to `geodesy.ts` and `bounds.ts` (item 8 above) already repoints `packages/gpx/src/routeGeometry.ts` and `packages/gpx/tests/routeCut.spec.ts`.

14. (packages/gpx) Compute each segment's gradients in one place.
   Files: `packages/gpx/src/routeGeometry.ts`, `packages/gpx/src/routeProfile.ts`
   Change: add to `routeGeometry.ts`, beside `groupBySegment`:

   ```ts
   export const segmentGradients = (segment: RoutePoint[]): Array<number | undefined> =>
     windowedGradients(segment.map((point) => ({ distance: point.dist, elevation: point.ele })));
   ```

   `steepestGradePercent` reads `for (const gradient of segmentGradients(segment))` in place of the `windowedGradients(segment.map(…))` call (today `:49-51`); `buildRouteProfile` reads `const gradients = segmentGradients(segment);` (today `routeProfile.ts:30-32`), imports `groupBySegment, segmentGradients` from `./routeGeometry.ts` and drops its `windowedGradients` import (`routeProfile.ts:1`). Same input array, same function, same results.
   Check: `rg -n "windowedGradients" packages/gpx/src` prints only the import and the body of `segmentGradients` in `routeGeometry.ts`; `vp run check` clean; `vp run test` passes with the same count.

15. (packages/gpx) Reuse the engine's degree conversion.
   Files: `packages/gpx/src/routeCut.ts`
   Change: `const longitudeScale = Math.cos((position.lat * Math.PI) / 180);` (today `:92`) becomes `const longitudeScale = Math.cos(degreesToRadians(position.lat));` with `import { degreesToRadians } from '@pacevault/engine/geodesy.ts';`. `degreesToRadians` computes `(degrees * Math.PI) / 180`, the same expression in the same order.
   Check: `rg -n "Math\.PI" packages/gpx/src` prints nothing; `packages/gpx/tests/routeCut.spec.ts` passes unchanged.

16. (tools/docs) Split `tiles.ts` into the locale vocabulary and the banner content (R1, R5).
   Files: delete `tools/docs/banner/tiles.ts`; new `tools/docs/banner/locales.ts`, `tools/docs/banner/bannerContent.ts`; importers `tools/docs/banner/env.ts`, `tools/docs/banner/run.ts`, `tools/docs/banner/capture.ts`, `tools/docs/banner/page/Banner.tsx`, `tools/docs/playwright.config.ts`; docs `tools/docs/CLAUDE.md`, `tools/docs/README.md`
   Change: `tiles.ts` holds two subjects: which locales the banner exists in (`BANNER_LOCALES`, `BannerLocale`, `DEFAULT_BANNER_LOCALE`, `isBannerLocale`, `tiles.ts:1-6`, read by `env.ts`, `run.ts` and the Playwright config), and what the banner shows (the copy table `BANNER_TEXT_BY_LOCALE` with its `TileText`/`FlowText`/`BannerText` interfaces and the typed filters, `FILTER_READING_COUNT`, `BannerFrame`, `BACKDROP_FILE`, `FLOW_KEYS`/`FlowKey`, `TILE_KEYS`/`TileKey`, `FRAMES_BY_FLOW`, `SHOT_FILE_BY_TILE` — the names the behavioural-constants and exhaustive-record-maps plans gave them). Move the first group verbatim into `locales.ts` and the rest into `bannerContent.ts`, which imports `BannerLocale` from `./locales.ts`; delete `tiles.ts`. Every export keeps its name and value. Importers: `env.ts:1` and `run.ts:5` → `./locales.ts`; `capture.ts:11` → `./bannerContent.ts`; `Banner.tsx:6-15` → `../locales.ts` for `DEFAULT_BANNER_LOCALE`/`isBannerLocale` and `../bannerContent.ts` for the rest; `playwright.config.ts` `import type { BannerLocale }` → `./banner/locales.ts`. Docs: `tools/docs/CLAUDE.md:4` "the banner texts (`tiles.ts`)" → "the locales (`locales.ts`) and the banner content (`bannerContent.ts`)", `:12` "Banner texts in `banner/tiles.ts`" → "Banner texts in `banner/bannerContent.ts`"; `tools/docs/README.md:12` "Banner texts per locale live in `banner/tiles.ts`" → "… in `banner/bannerContent.ts`".
   Check: `test ! -e tools/docs/banner/tiles.ts`; `rg -n "tiles\.ts" tools/docs --glob '!node_modules'` prints nothing; `rg -n "^import" tools/docs/banner/locales.ts` prints nothing (a leaf); `vp check` from `tools/docs/` is clean; `vp run docs:banner --locale de` and `--locale en` write their banners without error.

### tools/workbench

Every earlier workbench plan item has run (see Depends on), so the names below are their final names: `paths.ts`, `CheckHeading`, `Area`, `EditResult`, `GitChanges`, `techPresent`, the `Schema`-suffixed schemas, `zod` imports, the mirrored specs under `tools/workbench/tests/scripts/` and `tests/site/src/`, and the renamed locals (`frontmatterYaml`, `planMarked`, `splitLines`, …). Find code by name; today's line numbers no longer hold. Code moves unchanged apart from its imports; a declaration another module reads is exported, the rest stays module-local. The hook entry files keep their paths.

**Workbench check.** Save this script outside the repo (for example as `wb-probe.sh` in your scratch directory). Before the item run `bash <path>/wb-probe.sh <dir>/before`, after it `bash <path>/wb-probe.sh <dir>/after`; `diff -r <dir>/before <dir>/after` must print nothing. It feeds representative inputs to the three hooks and the CLI entry points and records each one's stdout, stderr and exit code; it writes nothing into the repo.

```bash
set -u
OUT="$1"
REPO="$(git rev-parse --show-toplevel)"
WB="$REPO/tools/workbench/scripts"
FIX="$(mktemp -d)/fix"
ITEM="$FIX/tools/workbench/backlog/demo"
mkdir -p "$ITEM/review" "$OUT"
printf -- '---\ntitle: Demo\nstatus: planned\ncreated: 2026-10-23\ntype: chore\nareas: [workbench]\nnext: Go\n---\n\n## Real-data checks\n\n- [ ] One\n\n## Open questions\n\n- **Q1** · open · Pick? (a) x (b) y\n' > "$ITEM/plan.md"
printf -- '## Agent decisions\n\n- [ ] **(scope) Keep it.** Agent: fits.\n' > "$ITEM/review/decisions.md"
P="$ITEM/plan.md"
D="$ITEM/review/decisions.md"
N="$FIX/tools/workbench/backlog/fresh/plan.md"
edit() { printf '{"tool_name":"Edit","tool_input":{"file_path":"%s","old_string":"%s","new_string":"%s"}}' "$1" "$2" "$3"; }
write() { printf '{"tool_name":"Write","tool_input":{"file_path":"%s","content":"%s"}}' "$1" "$2"; }
shell() { printf '{"tool_name":"Bash","tool_input":{"command":"%s"},"cwd":"%s"}' "$1" "$FIX"; }
run() {
  printf '%s' "$3" | (cd "$REPO" && WB_ROOT="$FIX/tools/workbench/backlog" node "$WB/$2" ${4:-}) >"$OUT/$1.out" 2>"$OUT/$1.err"
  echo $? >"$OUT/$1.code"
  perl -pi -e "s|\Q$FIX\E|FIX|g" "$OUT/$1.out" "$OUT/$1.err"
}
run sg-ready statusGuard.ts "$(edit "$P" 'status: planned' 'status: ready')"
run sg-skip statusGuard.ts "$(edit "$P" 'status: planned' 'status: in-dev')"
run sg-back statusGuard.ts "$(edit "$P" 'status: planned' 'status: idea')"
run sg-text statusGuard.ts "$(edit "$P" 'next: Go' 'next: Go on')"
run sg-tick statusGuard.ts "$(edit "$P" '- [ ] One' '- [x] One')"
run sg-size statusGuard.ts "$(edit "$P" 'next: Go' 'next: Go\nsize: small')"
run sg-new-idea statusGuard.ts "$(write "$N" '---\ntitle: F\nstatus: idea\ncreated: 2026-10-23\nnext: Go\n---\n')"
run sg-new-planned statusGuard.ts "$(write "$N" '---\ntitle: F\nstatus: planned\ncreated: 2026-10-23\nnext: Go\n---\n')"
run sg-dec-tick statusGuard.ts "$(edit "$D" '- [ ] **(scope)' '- [x] **(scope)')"
run sg-dec-kindless statusGuard.ts "$(edit "$D" 'Agent: fits.' 'Agent: fits.\n- [ ] **Other.** Agent: why.')"
run sg-dec-bare statusGuard.ts "$(edit "$D" '- [ ] **(scope) Keep it.** Agent: fits.' '- [~] **(scope) Keep it.** Agent: fits.')"
run sg-dec-pointer statusGuard.ts "$(edit "$D" '- [ ] **(scope) Keep it.** Agent: fits.' '- [~] **(scope) Keep it.** Agent: fits. Superseded by: Q2')"
run sg-sed statusGuard.ts "$(shell "sed -i '' s/Go/On/ tools/workbench/backlog/demo/plan.md")"
run sg-redirect statusGuard.ts "$(shell 'echo x > tools/workbench/backlog/demo/review/decisions.md')"
run sg-rm statusGuard.ts "$(shell 'rm -rf tools/workbench/backlog/demo')"
run sg-find statusGuard.ts "$(shell 'find tools/workbench/backlog -name x -delete')"
run sg-cd statusGuard.ts "$(shell 'cd tools/workbench/backlog/demo && rm plan.md')"
run sg-read statusGuard.ts "$(shell 'cat tools/workbench/backlog/demo/plan.md')"
run sg-other statusGuard.ts '{"tool_name":"Read","tool_input":{"file_path":"x"}}'
run sg-bad statusGuard.ts 'not json'
run wg-sub-commit workerGitGuard.ts '{"tool_name":"Bash","tool_input":{"command":"git commit -m x"},"agent_id":"a"}'
run wg-sub-reset workerGitGuard.ts '{"tool_name":"Bash","tool_input":{"command":"git -C . reset --hard"},"agent_type":"item-worker"}'
run wg-sub-status workerGitGuard.ts '{"tool_name":"Bash","tool_input":{"command":"git status"},"agent_id":"a"}'
run wg-owner-commit workerGitGuard.ts '{"tool_name":"Bash","tool_input":{"command":"git commit -m x"}}'
run wg-bad workerGitGuard.ts 'not json'
run ih-plan indexHook.ts "{\"tool_input\":{\"file_path\":\"$P\"}}"
run ih-decisions indexHook.ts "{\"tool_input\":{\"file_path\":\"$D\"}}"
run ih-other indexHook.ts '{"tool_input":{"file_path":"/tmp/x.md"}}'
run ih-bad indexHook.ts 'not json'
run check-cli check.ts ''
run deps-usage deps.ts ''
run deps-missing deps.ts '' zz-no-such-item
run interfaces-usage interfaces.ts ''
run interfaces-missing interfaces.ts '' zz-no-such-item
```

**Board check** (items that touch `site/`): with the board on `http://localhost:4321` (reuse a running board, `lsof -iTCP -sTCP:LISTEN -P | grep :4321`; start one with `vp run workbench` only when none runs, and stop it afterwards), before the item run `vp -C tools/workbench exec playwright screenshot --viewport-size=1512,860 --wait-for-timeout=3000 http://localhost:4321 <dir>/board-before.png`, after it the same into `<dir>/board-after.png`, and compare with `uv run --no-project --with pillow python -c "import sys;from PIL import Image,ImageChops;print(ImageChops.difference(Image.open(sys.argv[1]).convert('RGBA'),Image.open(sys.argv[2]).convert('RGBA')).getbbox())" <dir>/board-before.png <dir>/board-after.png`, which must print `None`. Then open an item with all four tabs, walk Mockup, Plan, Tech (Planned | Actual switch, Full screen) and Review, open Answer… on a question and close it, and confirm by eye that nothing looks or behaves differently.

**Suite**: `vp check` from `tools/workbench/` is clean, `vp run -F @pacevault/workbench check` passes (astro sync + astro check), and `vp test -- --run` from `tools/workbench/` passes 66 tests (13 spec files today; a later item that splits a spec changes the file count, never the test count).

17. (tools/workbench) Split `frontmatter.ts` into the plan reader, the check rules and the tech.md reader (R1, R2, R5; owner decision).
   Files: `tools/workbench/scripts/frontmatter.ts`, `tools/workbench/scripts/check.ts`; new `tools/workbench/scripts/checkRules.ts`, `tools/workbench/scripts/techFile.ts`; importers `tools/workbench/scripts/{deps,interfaces}.ts`, `tools/workbench/site/src/lib/board.ts`, `tools/workbench/site/src/actions/index.ts`; specs `tools/workbench/tests/scripts/{frontmatter,interfaces}.spec.ts`, new `tools/workbench/tests/scripts/checkRules.spec.ts`, `tools/workbench/tests/scripts/techFile.spec.ts`
   Change: `frontmatter.ts` holds four topics today. After the split:
   - `frontmatter.ts` keeps the plan reader: statuses, `ITEM_TYPES`, `AREAS`/`Area`, `PLAN_CHECKS`, `DECISIONS`, `CheckHeading`, `planFrontmatterSchema`, `planBody`, `parseFrontmatter`, `readStatus`, `readSize`, `sectionTokens` and `listItems` (both now exported, the two new modules read them), `CheckItem`, `readChecks`, `isOpenCheck`, `SUPERSEDED_BY`, the decision kinds and `decisionsWithoutKind`, `Question`, `readQuestions`. `statusGuard.ts` and `cleanup.ts` keep importing from it unchanged.
   - `checkRules.ts` holds the `workbench:check` rules: `PAST_READY`, `FROM_PLANNED`, `checkPlan`, `mockupConfigSchema`, `MOCKUP_CONFIG`, `checkMockupDecisions` from `frontmatter.ts`, and `DECISION`, `DECISION_FORMAT`, `checkDecisions` from `check.ts`; plus one new step both callers repeat today, `export const addedCheckErrors = ({ folder, before, after, techPresent }: { folder: string; before: string; after: string; techPresent: boolean }): string[] => { const known = new Set(checkPlan(folder, before, techPresent)); return checkPlan(folder, after, techPresent).filter((error) => !known.has(error)); };`. `board.ts`'s `movesOf` keeps a target when `addedCheckErrors({ … after: text.replace(line, \`status: ${to}\`) … }).length === 0` (today: `every` error is known), and `actions/index.ts`'s `planEdit` reads `const added = addedCheckErrors({ folder: item, before, after, techPresent });` with its refusal unchanged.
   - `techFile.ts` holds the tech.md reader: `TechEntry`, `TechPaths`, `moduleEntries`, `readTechEntries`, and `readTechPaths`, which now derives from the entries (`const entries = readTechEntries(tech); return { added: entries.added.map((entry) => entry.path), changed: entries.changed.map((entry) => entry.path) };`, the same arrays it builds today).
   - `check.ts` keeps `hasFiles`, `itemFolders`, `checkWorkbench` and its CLI block, importing the rules from `./checkRules.ts`; `indexHook.ts` keeps importing `checkWorkbench` from `./check.ts`.
   - Specs: the `frontmatter.spec.ts` cases `'reads the New and Changed paths of tech.md and nothing else'` and `'reads New / Changed from ## Files …'` move to `techFile.spec.ts` under `describe(readTechPaths.name, …)`; the cases `'checks a plan: schema, open questions from ready on, owner quotes, tech.md from planned on'`, `'skips the tech.md rule for size: small and accepts no other size'` and `'checks mockup decisions against the plan by ID only'` move to `checkRules.spec.ts` under `describe('checkRules', …)`, with the `plan` fixture helper they use copied along; `'requires one type and at least one area …'` stays in `frontmatter.spec.ts` and imports `checkPlan` from `@scripts/checkRules.ts`; `check.spec.ts` and `interfaces.spec.ts` import `checkDecisions` and `readTechPaths` from their new modules.
   Check: `rg -n "^export const (checkPlan|checkMockupDecisions|checkDecisions|addedCheckErrors)" tools/workbench/scripts` prints only `checkRules.ts`; `rg -n "^export const (readTechEntries|readTechPaths)" tools/workbench/scripts` prints only `techFile.ts`; workbench check; suite (66 tests, 15 files).

18. (tools/workbench) Split `board.ts` into the markdown renderer, the Tech tab's Actual sides and the board model, and share one HTML escape with the island (R1, R2, R5; owner decision).
   Files: `tools/workbench/site/src/lib/board.ts`; new `tools/workbench/site/src/lib/html.ts`, `tools/workbench/site/src/lib/markdown.ts`, `tools/workbench/site/src/lib/techActual.ts`; `tools/workbench/site/src/app/Prose.tsx`; spec `tools/workbench/tests/site/src/actions/index.read.spec.ts`; `tools/workbench/README.md`
   Change:
   - `html.ts` (no node import, the island reads it): `export const escapeHtml`, the body `board.ts` has today. `Prose.tsx` deletes its own identical copy (`:5-10`) and imports it from `'@site/lib/html.ts'`.
   - `markdown.ts`: `syncHtml`, `renderMarkdown`, `TECH_LANGS`, `highlighting`, `highlighter`, `plainCode`, `renderTech`. The `html` renderer and the `postprocess` hook both Marked instances spell out identically become two module-local functions read by both: `const escapedHtml = (token: Tokens.HTML | Tokens.Tag): string => { if (token.block) return \`<p>${escapeHtml(token.text.trim())}</p>\n\`; return escapeHtml(token.text); };` and `const wrapTables = (html: string): string => html.replaceAll('<table>', '<div class="wb-table"><table>').replaceAll('</table>', '</table></div>');`, wired as `html: escapedHtml` and `hooks: { postprocess: wrapTables }`.
   - `techActual.ts`: everything the Tech tab's Actual sides are built from: `depsSchema`, `Deps`, `readDeps`, `actualBar`, `missingActual`, `modulesActualHtml`, `componentsActualHtml`, `fileChangeSchema`, `filesSchema`, `FileChip`, `FileRow`, `TITLE_BY_CHIP`, `CHIP_BY_FILE_STATUS`, `SHORT_SHA_LENGTH`, `inlineNote`, `splitPath`, `compareRows`, `fileList`, `filesCount`, `filesPlannedHtml`, `filesActualHtml`, `interfacesActualHtml`, `sectionTokensOf`. It exports what `board.ts` reads: `Deps`, `readDeps` and the five `…Html` builders.
   - `board.ts` keeps the board model: `stripSections`, `LIFTED`, `frontmatterLine`, the view types, `questionsOf`, `findingsOf`, `readIfExists`, `readItem`, `movesOf`, `needsYou`, `BoardItem`, `BoardView`, `withTech`, `guideOf`, `readBoard`, importing from the three new modules.
   - The spec imports `renderTech` from `'@site/lib/markdown.ts'` (dynamic import and `typeof import` type).
   - `README.md` § Board internals: "`site/src/lib/board.ts` reads the whole board with `fs` (`readBoard`: each item with `readItem`, tech.md rendered with marked and Shiki by `renderTech`, …" names `renderTech` in `site/src/lib/markdown.ts` and the Actual sides in `site/src/lib/techActual.ts`.
   Check: `rg -n "^export const escapeHtml|^const escapeHtml" tools/workbench/site/src` prints only `html.ts`; `rg -n "replaceAll\('<table>'" tools/workbench/site/src` prints one line; workbench check; board check; suite.

19. (tools/workbench) Give the component graph its own module and the path helpers one home (R1, R2, R5; owner decision).
   Files: `tools/workbench/scripts/deps.ts`, `tools/workbench/scripts/changedFiles.ts`, `tools/workbench/scripts/paths.ts`; new `tools/workbench/scripts/componentGraph.ts`; spec `tools/workbench/tests/scripts/deps.spec.ts`, new `tools/workbench/tests/scripts/componentGraph.spec.ts`
   Change: `componentGraph.ts` takes `ComponentGraph` (exported), `isComponent`, `componentName` and `toComponentGraph` from `deps.ts`; it reads `DepsInput` with `import type { DepsInput } from './deps.ts'` (type-only, erased at run time). The path helpers both graphs and the changed-files reader use move to `paths.ts`, exported: `repoPath`, `dirOf`, `baseName`, and the comparator `comparePaths` — today's `compareText`, declared identically at `deps.ts:178` and `changedFiles.ts:32`, both copies deleted. The two `toComponentGraph` cases of `deps.spec.ts` (`"draws the component tree of the item's .tsx files and the .tsx files they import"`, `'says so when the item has no .tsx files'`) move to `componentGraph.spec.ts` under `describe(toComponentGraph.name, …)`, with the `mod` fixture helper copied along.
   Check: `rg -n "compareText" tools/workbench/scripts` prints nothing; `rg -n "^export const toComponentGraph" tools/workbench/scripts` prints only `componentGraph.ts`; workbench check; suite (66 tests, 16 files).

20. (tools/workbench) Fold the remaining duplicates that behave identically (R2).
   Files: `tools/workbench/site/src/lib/writeBack.ts`, `tools/workbench/scripts/interfaces.ts`, `tools/workbench/scripts/deps.ts`; new `tools/workbench/scripts/itemCli.ts`; `tools/workbench/site/src/app/Columns.tsx`, `tools/workbench/site/src/app/Stage.tsx`
   Change:
   - `writeBack.ts`: `editLine`, `deleteLine` and `insertLine` repeat the same six lookup steps. One module-local step replaces them: `const findUniqueBlock = ({ lines, place, expected }: { lines: string[]; place: Place; expected: string }): { ok: false; reason: 'missing' | 'duplicate' } | { ok: true; start: number; length: number } => { … }` (range missing → `'missing'`, no hit → `'missing'`, several → `'duplicate'`, in that order, as today; the failure member is assignable to `EditResult`). `editLine` keeps its `'unchanged'` guard first, then `const block = findUniqueBlock({ lines, place, expected }); if (!block.ok) return block;` and splices at `block.start`/`block.length`; `deleteLine` splices and drops the doubled blank line at `block.start`; `insertLine` looks up its `after` block and inserts at `block.start + block.length`.
   - `interfaces.ts`: `typeScriptFilesBelow` tests `TS_FILE.test(entry.name) && !entry.name.endsWith('.d.ts')`, which is `isTypeScript(entry.name)`; it calls that.
   - `deps.ts` and `interfaces.ts` open their `main` with the same argument and tech.md steps. `itemCli.ts` holds them once: `export const itemTechPaths = (command: 'deps' | 'interfaces'): { item: string; paths: TechPaths } => { … }` — `parseArgs({ allowPositionals: true, options: {} })`, `console.error(\`usage: vp run workbench:${command} -- <item>\`)` and `process.exit(1)` without an item, `console.error(\`${BACKLOG_DIR}/${item}/tech.md: missing\`)` and `process.exit(1)` without its tech.md, else `readTechPaths` of it. Both mains start with `const cli = itemTechPaths('deps')` (or `'interfaces'`); the messages and exit codes are today's.
   - `Columns.tsx`: `onOpen={(folder, tab) => props.onOpen(folder, tab)}` (on `<NeedsYou>`) → `onOpen={props.onOpen}`.
   - `Stage.tsx`: the fragment `<>…</>` around its single root `<div>` is dropped; the div is returned directly.
   Check: `rg -n "findBlock\(" tools/workbench/site/src/lib/writeBack.ts` prints one line (inside `findUniqueBlock`); `rg -n "parseArgs\(" tools/workbench/scripts` prints only `itemCli.ts`; workbench check (the `deps-usage`, `deps-missing`, `interfaces-usage`, `interfaces-missing` cases cover the shared steps); board check; suite.

21. (tools/workbench) Name the new modules in the tool docs.
   Files: `tools/workbench/README.md`, `tools/workbench/CLAUDE.md`
   Change: the `scripts/` row of the README layout table ("`check.ts` (plan rules), `frontmatter.ts` (plan reader), `cleanup.ts`, `deps.ts`, `changedFiles.ts`, `interfaces.ts`, and the hooks") becomes "`check.ts` (`plans:check`), `checkRules.ts` (plan rules), `frontmatter.ts` (plan reader), `techFile.ts` (tech.md reader), `paths.ts` (repo, backlog and workbench locations), `cleanup.ts`, `deps.ts`, `componentGraph.ts`, `changedFiles.ts`, `interfaces.ts`, `itemCli.ts`, and the hooks"; `tools/workbench/CLAUDE.md` § Rules **Paths** ("Scripts resolve the repo root as `'../../..'` from `scripts/` and the backlog as `tools/workbench/backlog`; the board's root is `backlog/` (`WB_ROOT` overrides it in tests).") becomes "Every location comes from `scripts/paths.ts` (`REPO_ROOT`, `BACKLOG_DIR`, `BACKLOG_PATH`, `WORKBENCH_DIR`, `GUIDE_FILE`); `backlogRoot()` is the board's root, which `WB_ROOT` overrides in tests, and `baseRevisionOverride()` reads `WB_BASE`." The rest of the bullet stays.
   Check: `rg -n "checkRules.ts|paths.ts" tools/workbench/README.md tools/workbench/CLAUDE.md` prints at least one line each; `rg -n "'\.\./\.\./\.\.'" tools/workbench/CLAUDE.md` prints nothing.

## Open items

- `apps/web/src/lib/filterVocabulary.ts` stays its own module. It is the lexicon read by both `filterGrammar.ts` and `savedFilters.ts`, and `filterGrammar.ts` already imports `savedFilters.ts`; folding the lexicon into either one creates an import cycle between them. If the owner wants one filter module, the merge is `filterGrammar.ts` + `filterVocabulary.ts` + `savedFilters.ts` into a single module, which this plan does not do on its own.
- `apps/web/src/lib/windRose.ts` (wind-rose sector shares) stays separate from `weather.ts`: it computes from the engine's wind exposure, not from weather snapshots. Owner may fold it in.
- Shared name stems that are different subjects and stay apart: `railFormat.ts` / `railRange.ts`, `chartHover.ts` / `chartTheme.ts` / `chartData.ts`, `recordCodec.ts` / `recordExtremes.ts` / `records.ts` (personal bests), `sessionFitness.ts` / `sessionStress.ts` / `sessionTerrain.ts` / `sessionTitleFormatter.ts`, and `features/map/fitPadding.ts` (pure padding geometry, tested in node) / `features/map/mapPadding.ts` (reads stores). The 3D map modules are topics of their own and stay apart too: `features/map/terrainCamera.ts` (moving the MapLibre camera over terrain: pitch-aware fits, eases, orbit) / `lib/mapCamera.ts` (deciding which fit runs, no map handle), and `features/map/terrainLine.ts` (the MapLibre line source and its picking) / `features/map/lapPath.ts` (lap spans on a detail path) / `features/map/zoneColoredPath.ts` (building the detail path).
- No bucket filenames exist (`utils.ts`, `helpers.ts`, `misc.ts`, `common.ts`, `shared.ts`); nothing to rename for R6.
- `packages/ui`: `lib/colors.ts` (a one-colour module beside `tokens.ts`) is folded into `tokens.ts` by the styled-api-over-sx plan; the other `src/lib/` modules are one topic each.

- `packages/engine`: `referenceTrimp` (`trainingEffect.ts`, `60 * threshold * a * Math.exp(b * threshold)`) restates the stress module's one-hour reference (`60 * impulsePerMinute(threshold, coeff)`), but the two group the multiplications differently, so sharing one helper could change the last bit of the aerobic training effect; it stays as it is (follow-up: backlog item conventions-follow-ups). `effortDetection.ts` stays one module apart from item 11 for the reason given there.

- `packages/gpx`: `parseGpx.ts` and `buildGpx.ts` are the read and write sides of the GPX file format and share no import, constant or helper; they stay two modules under their current names, which the gpx rules and every importer use.
- `tools/workbench`: `scripts/frontmatter.ts` keeps its name for the plan reader (the owner decision splits it, it does not rename it), and `site/src/scripts/tech.ts` keeps its folder name beside the package's `scripts/`.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
