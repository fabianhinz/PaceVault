---
id: engine-holds-domain-logic-only
tdr_reference: tdr/engine-holds-domain-logic-only.md
generated: 2026-10-23
---

# The engine returns domain values; presentation and serialization live in the app

Read `tdr/engine-holds-domain-logic-only.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

Every item is a move: the app renders, stores and decodes exactly what it does today. Run every Check from the repo root; "clean `vp check`" means `vp run -F @pacevault/i18n compile && vp check` finishes with no error. Moved code keeps only the comment kinds `packages/engine/CLAUDE.md` allows (a `@see [SourceKey]` tag, the `// Sources:` header, a why-note); everything else it carried is dropped.

1. Move the running-zone colours and labels into the app.
   Files: `packages/engine/src/zones.ts`, `packages/engine/src/types.ts`, `packages/engine/tests/zones.spec.ts`, `apps/web/src/lib/zoneColors.ts`, `apps/web/src/features/sessions/ZoneLegend.tsx`, `apps/web/src/features/labs/WorkoutExpansionPanel.tsx`
   Change: `RunningZone` (`types.ts:102-108`) loses `label` and `color` and becomes `{ name: RunningZoneName; minPace: number; maxPace: number }`. `ZONE_DEFS` (`zones.ts:6-18`) loses its `label` and `color` columns (`{ name: 'recovery', minPct: 1.4, maxPct: 1.29 }`, …), and `computeRunningZones` (`zones.ts:25-33`) returns `{ name: def.name, minPace: Math.round(thresholdPaceSec * def.minPct), maxPace: Math.round(thresholdPaceSec * def.maxPct) }`. In `apps/web/src/lib/zoneColors.ts` add `export const COLOR_BY_RUNNING_ZONE: Record<RunningZoneName, string> = { recovery: '#60a5fa', easy: '#34d399', tempo: '#fbbf24', threshold: '#f97316', vo2max: '#ef4444' };` (the same five literals, moved, not new), and read it in place of `zone.color`: `paceBands` (`zoneColors.ts:77-88`) `color: COLOR_BY_RUNNING_ZONE[zone.name]`, `ZONE_PALETTES.pace` (`:93`) `computeRunningZones(1).map((zone) => COLOR_BY_RUNNING_ZONE[zone.name])`. `ZoneLegend.tsx:23` `backgroundColor: zone.color` → `backgroundColor: COLOR_BY_RUNNING_ZONE[zone.name]`; `ZoneLegend.tsx:24` `{ZONE_LABELS[zone.name]?.() ?? zone.label}` → `{ZONE_LABELS[zone.name]()}` (the map is a full `Record<RunningZoneName, …>`, so the fallback never fired). `WorkoutExpansionPanel.tsx:66` `zone?.color ?? '#888'` → `zone ? COLOR_BY_RUNNING_ZONE[zone.name] : '#888'`. Delete the `it('each zone has a color', …)` case (`zones.spec.ts:39-42`); add to `apps/web/tests/lib/zoneColors.spec.ts` (create it if it does not exist) a case asserting `ZONE_PALETTES.pace` equals `['#60a5fa', '#34d399', '#fbbf24', '#f97316', '#ef4444']`.
   Check: `rg -n "label|color" packages/engine/src/zones.ts packages/engine/src/types.ts` prints nothing; `rg -n "zone\.(color|label)" apps/web/src` prints nothing; clean `vp check`; `vp run test` passes.

2. Move the heart-rate and power zone colours and labels into the app.
   Files: `packages/engine/src/zoneDistribution.ts`, `apps/web/src/lib/zoneColors.ts`, `apps/web/src/lib/sessionTitleFormatter.ts`
   Change: `HR_ZONE_DEFS` (`zoneDistribution.ts:7-13`) and `POWER_ZONE_DEFS` (`:15-51`) lose `label` (read by nothing) and `color`, and are declared `as const`, e.g. `{ zone: 'Z1', name: 'recovery', minPct: 0.5, maxPct: 0.6 }`. Beside each add the derived name union: `export type HeartRateZoneName = (typeof HR_ZONE_DEFS)[number]['name'];` and `export type PowerZoneName = (typeof POWER_ZONE_DEFS)[number]['name'];`. In `zoneColors.ts` add `export const COLOR_BY_HEART_RATE_ZONE: Record<HeartRateZoneName, string> = { recovery: '#60a5fa', aerobic: '#34d399', tempo: '#fbbf24', threshold: '#f97316', vo2max: '#ef4444' };` and `export const COLOR_BY_POWER_ZONE: Record<PowerZoneName, string> = { active_recovery: '#94a3b8', endurance: '#60a5fa', tempo: '#34d399', threshold: '#fbbf24', vo2max: '#f97316', anaerobic: '#ef4444', neuromuscular: '#dc2626' };`. `PctZoneDef` (`zoneColors.ts:53-59`) drops `color` and becomes generic over its name, `interface PctZoneDef<Name extends string> { zone: string; name: Name; minPct: number; maxPct: number }`. `pctBands` becomes generic over `Name extends string`, takes `defs: readonly PctZoneDef<Name>[]` plus the colour map `colorByName: Record<Name, string>` as a further input (a positional parameter between `defs` and `toValue`, or a field of its options object if the signature-parameter-shape plan already converted it), and returns `color: colorByName[def.name]`. Its two callers in `bandsFor` pass `COLOR_BY_HEART_RATE_ZONE` and `COLOR_BY_POWER_ZONE`, with no cast. `ZONE_PALETTES.hr` / `.power` (`:91-92`) become `HR_ZONE_DEFS.map((def) => COLOR_BY_HEART_RATE_ZONE[def.name])` and `POWER_ZONE_DEFS.map((def) => COLOR_BY_POWER_ZONE[def.name])`. `sessionTitleFormatter.ts:34` `ZONE_LABEL_MAP: Record<string, () => string>` keeps working on the narrower name type; tighten it to `Record<HeartRateZoneName, () => string>` only if its keys are exactly the five names (otherwise leave it).
   Check: `rg -n "color|label" packages/engine/src/zoneDistribution.ts` prints nothing; clean `vp check`; `vp run test` passes; the zoneColors spec of item 1 also asserts `ZONE_PALETTES.hr` and `ZONE_PALETTES.power` against the twelve literals above, in order.

3. Move the ACWR traffic-light colour into the app.
   Files: `packages/engine/src/coaching.ts`, `apps/web/src/lib/statusColors.ts`, `apps/web/src/features/dashboard/ACWRGauge.tsx`, `apps/web/tests/lib/statusColors.spec.ts` (new)
   Change: delete `getACWRColor` with its doc block (`coaching.ts:81-91`). Export the three thresholds it read, unchanged: `export const ACWR_UNDERTRAINING_THRESHOLD = 0.8;`, `export const ACWR_MODERATE_THRESHOLD = 1.3;`, `export const ACWR_HIGH_THRESHOLD = 1.5;` (`coaching.ts:37-41`). In `statusColors.ts` add `export type AcwrColor = keyof typeof acwrColorMap;` and `export const acwrColor = (acwr: number): AcwrColor => { if (acwr < ACWR_UNDERTRAINING_THRESHOLD) return 'yellow'; if (acwr <= ACWR_MODERATE_THRESHOLD) return 'green'; if (acwr <= ACWR_HIGH_THRESHOLD) return 'yellow'; return 'red'; };` importing the thresholds from `@pacevault/engine/coaching.ts`. `ACWRGauge.tsx:6,26` imports and calls `acwrColor(dialValue)`. The new spec asserts `acwrColor` at 0, 0.79, 0.8, 1.3, 1.31, 1.5, 1.51 and 2 gives `yellow, yellow, green, green, yellow, yellow, red, red`.
   Check: `rg -n "getACWRColor" apps packages --glob '!node_modules'` prints nothing; clean `vp check`; `vp run test` passes.

4. Move the training-effect colour into the app.
   Files: `packages/engine/src/trainingEffect.ts`, `packages/engine/tests/trainingEffect.spec.ts`, `apps/web/src/features/sessions/session/TrainingEffectCard.tsx`
   Change: delete the `TrainingEffectLabel` object type (`trainingEffect.ts:106-112`); `getTrainingEffectLabel` (`:175-182`) returns `TELabelKey` — `if (te >= 5.0) return 'overreaching'; … return 'no_effect';`, same thresholds and order. In `TrainingEffectCard.tsx` re-key the two colour maps by the label (`:32-47`): `const FILL_BY_TRAINING_EFFECT_LABEL: Record<TELabelKey, string> = { no_effect: tokens.statusNeutral, minor: tokens.accent, maintaining: tokens.statusSuccessStrong, improving: tokens.statusWarningStrong, highly_improving: tokens.chartCadence, overreaching: tokens.statusDangerStrong };` and `const TEXT_CLASS_BY_TRAINING_EFFECT_LABEL: Record<TELabelKey, string> = { no_effect: 'text-text-tertiary', minor: 'text-accent', maintaining: 'text-status-success', improving: 'text-status-warning', highly_improving: 'text-chart-cadence', overreaching: 'text-status-danger' };` (old key → label: neutral → no_effect, blue → minor, green → maintaining, amber → improving, orange → highly_improving, red → overreaching). `fillOf` (`:55`) → `FILL_BY_TRAINING_EFFECT_LABEL[getTrainingEffectLabel(value)]`; `:87-88` → `const label = getTrainingEffectLabel(props.value); const textClass = TEXT_CLASS_BY_TRAINING_EFFECT_LABEL[label];`; `:111` `localizedTELabel(label)`; `:163` drops the two `.label` reads. The `?? ''` fallbacks go: the maps are exhaustive. In the spec (`trainingEffect.spec.ts:274-303`) every `toEqual({ label: 'x', color: 'y' })` becomes `toBe('x')`.
   Check: `rg -n "color" packages/engine/src/trainingEffect.ts` prints nothing; clean `vp check`; `vp run test` passes; `vp run e2e` passes.

5. Replace the formatter strategy with the day key it actually provides.
   Files: `packages/engine/src/formatter.ts` (deleted), `packages/engine/tests/formatter.spec.ts` (deleted), `packages/engine/src/metrics.ts`, `apps/web/src/lib/sessionFitness.ts`
   Change: in `metrics.ts` declare the body of `defaultFormatter.date` (`formatter.ts:13-16`), verbatim apart from the names:

   ```ts
   export const localDayKey = (timestamp: number): string => {
     const date = new Date(timestamp);
     return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
   };
   ```

   `computeMetrics` drops the `formatter` option and `fmt` (`metrics.ts:89,91`) and passes `localDayKey` where it passed `fmt.date` (`:98`, `:101`); drop the two `formatter.ts` imports (`:5-6`). `sessionFitness.ts:1,5` imports and calls `localDayKey(timestamp)`. Delete `formatter.ts` and its spec: `defaultFormatter.pace` is read by its spec only, and nothing passes a formatter.
   Check: `rg -n "formatter" packages/engine apps/web/src --glob '!node_modules' -i | rg -v "formatters\.ts|Formatter\.ts"` prints only `packages/engine/CLAUDE.md` (fixed in item 8); clean `vp check`; `vp run test` passes.

6. Move track encoding and decoding into the app.
   Files: `packages/engine/src/gps.ts`, `packages/engine/tests/gps.spec.ts`, new `apps/web/src/lib/gpsTrack.ts`, new `apps/web/tests/lib/gpsTrack.spec.ts`, `apps/web/src/features/map/gpsBuild.worker.ts`, `apps/web/src/features/demo/loadDemoData.ts`, `apps/web/src/features/map/hooks/types.ts`
   Change: move `extractGPSPoints`, `simplifyTrack`, `encodeTrack`, `buildSessionGPS` and `decodeTrackForRendering` (`gps.ts:56-84,105-126`) into `apps/web/src/lib/gpsTrack.ts`, bodies unchanged, with the two library imports (`gps.ts:4-5`). `simplifyTrack` loses its never-passed `tolerance` parameter; its default becomes `const SIMPLIFY_TOLERANCE_DEGREES = 0.00005;` at the top of `gpsTrack.ts`. `buildSessionGPS` keeps calling `computeBounds` and `isValidCoordinate` from `@pacevault/engine/gps.ts`. The new module opens with `// Sources: [Ramer1972], [DouglasPeucker1973]` and `// See packages/engine/SOURCES.md for full citations.`; `gps.ts:1` drops those two keys from its own header. Repoint the three importers (`gpsBuild.worker.ts:2`, `loadDemoData.ts:3`, `hooks/types.ts:1`) to `@/lib/gpsTrack.ts`. Move the `describe('buildSessionGPS', …)` block (`gps.spec.ts:35-57`) into `gpsTrack.spec.ts`, importing the record series from `@pacevault/testing/gps.ts` (or `@pacevault/testing/series.ts` if the test-data plan moved them), and drop its import from `gps.spec.ts`. In `packages/engine/SOURCES.md` the Ramer–Douglas–Peucker row's module cell becomes `` `apps/web/src/lib/gpsTrack.ts` ``.
   Check: `rg -n "polyline-codec|simplify-ts|buildSessionGPS|decodeTrackForRendering" packages/engine/src` prints nothing; clean `vp check`; `vp run test` passes; `vp run e2e` passes (map tracks render from the same polylines).

7. Drop the two library dependencies the engine no longer uses.
   Files: `packages/engine/package.json`, `pnpm-lock.yaml` (regenerated)
   Change: remove the `dependencies` block (`package.json:13-16`); `apps/web/package.json:28,50` already declares both libraries at the same range, so nothing is added there. Run `pnpm install` to refresh the lockfile.
   Check: `rg -n "dependencies" packages/engine/package.json` prints only `devDependencies`; `vp run workbench:deps` reports no `engine-is-pure` violation; `vp run check`, `vp run test` and `vp run build` pass.

8. Rewrite the engine rules for the domain-only boundary.
   Files: `packages/engine/CLAUDE.md`, `packages/engine/README.md`
   Change: `CLAUDE.md:8` and `CLAUDE.md:14` are replaced by these two bullets, and `README.md:3` drops "GPS track encoding and simplification" in favour of "GPS geometry":

   ```md
   - **Pure, no React, no app imports**: No imports from `apps/web` (`@/…`, `src/lib/`, `src/store/`, `src/features/`), no React, no state library, no browser API, no npm runtime dependency: it imports only its own modules. `vp run workbench:deps` checks this (`engine-is-pure`).
   - **Domain values only**: Functions return domain values — numbers, union keys, thresholds. No colour, label, display string or rendering order, and no encoding for storage; the app maps keys to presentation in `apps/web/src/lib/` (e.g. `COLOR_BY_RUNNING_ZONE`) and owns encoding (`apps/web/src/lib/gpsTrack.ts`).
   ```
   Check: `rg -n "polyline-codec|simplify-ts|EngineFormatter|defaultFormatter" packages/engine` prints nothing; a human reads `packages/engine/CLAUDE.md:8,14` against `tdr/engine-holds-domain-logic-only.md` §2.

### packages/gpx

Items 9–14 apply R1, R2 and R4 to `packages/gpx` (owner decision): the GPX parse and build stay in the package, the route polylines, the chart rounding of the route profile and the export file name move into `apps/web/src/lib/`. The app stores, renders and downloads exactly what it does today; item 9 pins the values that move and every later item keeps its snapshot text byte for byte. Run every Check from the repo root.

9. (packages/gpx) Pin today's route outputs that items 10–13 move.
   Files: new `apps/web/tests/lib/gpxRoutePinned.spec.ts` (temporary, deleted by item 14)
   Change: the spec builds 60 `ParsedGpxPoint` objects with `lat: 47 + i * 0.00002`, `lng: 11 + 0.00002 * Math.sin(i * 1.3)`, `ele: 600 + Math.sin(i / 10) * 5`, `time: Date.parse('2025-08-17T06:00:00Z') + i * 1000`, `seg: Math.floor(i / 30)` (two segments), runs `const geometry = buildRouteGeometry(points)` (from `@pacevault/gpx/routeGeometry.ts`, guarded with `if (!geometry) throw new Error('route needs two points')`) and, inside one `describe('pinned gpx route outputs', …)`, holds three cases, each `expect(JSON.stringify(<value>)).toMatchInlineSnapshot()`: (a) `geometry.encodedPolylines`; (b) `buildRouteProfile(geometry.points)` (from `@pacevault/gpx/routeProfile.ts`); (c) `[buildGpxFilename('running', 1700000000000), buildGpxFilename('cycling', 1703980800000)]` (from `@pacevault/gpx/buildGpx.ts`). Run it once with `vp -C apps/web exec vitest run tests/lib/gpxRoutePinned.spec.ts -u` to fill the snapshots. Items 10, 12 and 13 rewrite only the expression inside `JSON.stringify(…)` of the case they touch; the snapshot strings are never edited again.
   Check: `vp -C apps/web exec vitest run tests/lib/gpxRoutePinned.spec.ts` passes without `-u` and the three snapshots are filled.

10. (packages/gpx) Move the route polyline encoding into the app.
   Files: `packages/gpx/src/routeGeometry.ts`, `packages/gpx/src/simplifyGpxPoints.ts` (deleted), `packages/gpx/tests/simplifyGpxPoints.spec.ts` (deleted), `packages/gpx/tests/routeGeometry.spec.ts`, `packages/gpx/tests/routeCut.spec.ts`, `apps/web/src/lib/gpsTrack.ts`, `apps/web/tests/lib/gpsTrack.spec.ts`, `apps/web/src/features/studio/createStudioRoute.ts`, `apps/web/tests/lib/gpxRoutePinned.spec.ts`
   Change: in `routeGeometry.ts` delete the `encode` import (`:1`), the `simplifyGpxPoints` import (`:6`), the `encodedPolylines: string[];` field of `RouteGeometry` (`:22`), the `encodedPolylines` block (`:104-107`) and `encodedPolylines,` in the returned object (`:111`). Delete `simplifyGpxPoints.ts` and its spec. In `apps/web/src/lib/gpsTrack.ts` (created by item 6) add, below `encodeTrack`:

   ```ts
   export const encodedSegmentPolylines = (points: RoutePoint[]): string[] =>
     groupBySegment(points).map((segment) => encodeTrack(simplifyTrack(segment)));
   ```

   with `import { groupBySegment } from '@pacevault/gpx/routeGeometry.ts';` and `import type { RoutePoint } from '@pacevault/gpx/routeGeometry.ts';`. The strings are the same: `simplifyGpxPoints` and `simplifyTrack` both return the input below three points and otherwise call `Simplify` on `{ x: lng, y: lat }` with tolerance `0.00005`; the gpx path kept the original points the library returned, `simplifyTrack` maps them to `{ lat: y, lng: x }` — the same numbers — and both encode `[lat, lng]` pairs. `createStudioRoute.ts:23` becomes `encodedPolylines: encodedSegmentPolylines(geometry.points),` with `import { encodedSegmentPolylines } from '@/lib/gpsTrack.ts';` (the stored `StudioRoute.encodedPolylines` field keeps its name). Specs: move the cases `'encodes a decodable polyline'` and `'encodes one polyline per segment'` (`routeGeometry.spec.ts:34-57`) into `apps/web/tests/lib/gpsTrack.spec.ts` under `describe(encodedSegmentPolylines.name, …)`, each building its points with `buildRouteGeometry([...])?.points ?? []` and decoding `encodedSegmentPolylines(points)`; add there the three geometric cases of the deleted spec, asserted on the decoded line: the first and last input points survive (`toBeCloseTo(…, 5)` on both coordinates, from `simplifyGpxPoints.spec.ts:15-24`), 100 collinear points decode to fewer than 100 (`:26-34`), and the corner of the sharp turn `{ lat: 48.139, lng: 11.575 }` survives (`:54-66`). The two cases about the returned objects themselves (`:6-13`, `:36-52`) have no subject left and go. In `routeCut.spec.ts` the case at `:141` drops its precondition lines `:142-143` and the `decode` import (`:4`); its assertions stay. The pinned case (a) becomes `encodedSegmentPolylines(geometry.points)`.
   Check: `rg -n "polyline-codec|simplify-ts|encodedPolylines|simplifyGpxPoints" packages/gpx/src packages/gpx/tests` prints nothing; `test ! -e packages/gpx/src/simplifyGpxPoints.ts`; the pinned spec passes without `-u`; `vp run check` clean; `vp run test` and `vp run e2e` pass (studio routes draw the same lines).

11. (packages/gpx) Drop the two library dependencies gpx no longer uses.
   Files: `packages/gpx/package.json`, `pnpm-lock.yaml` (regenerated)
   Change: remove `"@googlemaps/polyline-codec": "^1.0.28",` (`package.json:14`) and `"simplify-ts": "^1.0.2",` (`:16`) from `dependencies`, leaving `@pacevault/engine` and `zod`; `apps/web/package.json` already declares both libraries. Run `pnpm install`.
   Check: `rg -n "polyline-codec|simplify-ts" packages/gpx --glob '!node_modules'` prints nothing; `vp run check`, `vp run test` and `vp run build` pass.

12. (packages/gpx) Move the chart rounding of the route profile into the app.
   Files: `packages/gpx/src/routeProfile.ts`, `packages/gpx/tests/routeProfile.spec.ts`, `apps/web/src/lib/chartData.ts`, `apps/web/src/features/studio/charts/RouteChartsExplorer.tsx`, `apps/web/tests/lib/chartData.spec.ts`, `apps/web/tests/lib/gpxRoutePinned.spec.ts`
   Change: `routeProfile.ts` returns unrounded values under unit-named fields: `RouteProfilePoint` (`:4-8`) becomes `{ distanceMeters: number; lng: number; lat: number }`, `RouteElevationPoint` (`:10-12`) `extends RouteProfilePoint { elevationMeters: number }`, `RouteGradePoint` (`:14-16`) `extends RouteProfilePoint { gradePercent: number | undefined }`. Delete `roundKm` and `round1` (`:23-24`); in the loop the `dist` local (`:35`) goes, `if (gradient !== undefined) percent = round1(gradient * 100);` becomes `if (gradient !== undefined) percent = gradient * 100;`, and the two pushes become `elevation.push({ distanceMeters: point.dist, elevationMeters: point.ele, lng: point.lng, lat: point.lat });` and `grade.push({ distanceMeters: point.dist, gradePercent: percent, lng: point.lng, lat: point.lat });`. In `apps/web/src/lib/chartData.ts` add, above `buildRouteChartRows`, the shape and the rounding the chart reads today:

   ```ts
   export interface RouteChartProfile {
     elevation: { dist: number; elevation: number; lng: number; lat: number }[];
     grade: { dist: number; grade: number | undefined; lng: number; lat: number }[];
   }

   const kilometersToTheMeter = (meters: number): number => Math.round(meters) / 1000;
   const roundToTenth = (value: number): number => Math.round(value * 10) / 10;

   export const routeChartProfile = (profile: RouteProfile): RouteChartProfile => ({
     elevation: profile.elevation.map((point) => ({
       dist: kilometersToTheMeter(point.distanceMeters),
       elevation: roundToTenth(point.elevationMeters),
       lng: point.lng,
       lat: point.lat,
     })),
     grade: profile.grade.map((point) => {
       let grade: number | undefined = undefined;
       if (point.gradePercent !== undefined) grade = roundToTenth(point.gradePercent);
       return { dist: kilometersToTheMeter(point.distanceMeters), grade, lng: point.lng, lat: point.lat };
     }),
   });
   ```

   (the same expressions and key order as `routeProfile.ts:35-40` today). `buildRouteChartRows` (`chartData.ts:112`) takes `profile: RouteChartProfile`. `RouteChartsExplorer.tsx:44` becomes `const profile = useMemo(() => routeChartProfile(buildRouteProfile(props.points)), [props.points]);` and `:16` imports `routeChartProfile` beside `buildRouteChartRows`; every other read of `profile` there is unchanged. `chartData.spec.ts:109,133` wrap the profile the same way (`buildRouteChartRows(routeChartProfile(buildRouteProfile(points)))`), and the rounding case moves from `routeProfile.spec.ts:37-41` into `chartData.spec.ts` as `it('rounds distance to kilometres and elevation and grade to a tenth', …)` with the same two points and the same `toMatchObject` expectations on `routeChartProfile(buildRouteProfile(…)).elevation`. In `routeProfile.spec.ts` the remaining cases read the new fields: `:34` maps `p.distanceMeters` on both sides; `:37-41` becomes `it('keeps distance in metres and the recorded elevation', …)` expecting `{ distanceMeters: 0, elevationMeters: 500.04, lng: 11 }` and `{ distanceMeters: 1500, elevationMeters: 620.26 }`; `:45` expects `[0, 200]`; `:58` `expect(middle?.gradePercent).toBeCloseTo(10, 9)`; `:64` `expect(profile.grade[25]?.gradePercent).toBeCloseTo(-5, 9)`; `:69,86` read `p.gradePercent`; `:77` expects `.distanceMeters` to be `49_990`. The pinned case (b) becomes `routeChartProfile(buildRouteProfile(geometry.points))`.
   Check: `rg -n "roundKm|round1|\bdist:" packages/gpx/src/routeProfile.ts` prints nothing; the pinned spec passes without `-u`; `vp run check` clean; `vp run test` and `vp run e2e` pass.

13. (packages/gpx) Move the export file name into the app.
   Files: `packages/gpx/src/buildGpx.ts`, `packages/gpx/tests/buildGpx.spec.ts`, `apps/web/src/lib/gpxExport.ts`, `apps/web/src/features/sessions/session/hooks/useSessionExport.ts`, `apps/web/src/features/sessions/session/hooks/useEditInStudio.ts`, `apps/web/tests/lib/gpxExport.spec.ts`, `apps/web/tests/lib/gpxRoutePinned.spec.ts`
   Change: delete `buildGpxFilename` (`buildGpx.ts:104-108`), its case (`buildGpx.spec.ts:93-95`) and its name in the import at `buildGpx.spec.ts:2`. In `gpxExport.ts` add, with the body unchanged and the object parameter of the signature rule:

   ```ts
   export const buildGpxFilename = ({ sport, dateMs }: { sport: string; dateMs: number }): string => {
     const date = new Date(dateMs).toISOString().slice(0, 10);
     const sportLabel = sport.charAt(0).toUpperCase() + sport.slice(1);
     return `PaceVault_${sportLabel}_${date}.gpx`;
   };
   ```

   `useSessionExport.ts:5-6` becomes `import { buildGpxFilename, buildSessionGpx } from '@/lib/gpxExport.ts';` and `:24` `buildGpxFilename({ sport: session.sport, dateMs: session.date })`; the same two edits in `useEditInStudio.ts:6-7,28`. `gpxExport.spec.ts:2-3` import it from `@/lib/gpxExport.ts` and `:154,159` call `buildGpxFilename({ sport: 'running', dateMs: 1700000000000 })` and `({ sport: 'cycling', dateMs: 1700000000000 })`. The pinned case (c) calls the app function the same way.
   Check: `rg -n "buildGpxFilename" packages` prints nothing; the pinned spec passes without `-u`; `vp run check` clean; `vp run test` passes.

14. (packages/gpx) Rewrite the boundary rules and delete the pinned spec.
   Files: `CLAUDE.md`, `packages/gpx/CLAUDE.md`, `packages/gpx/README.md`, `apps/web/tests/lib/gpxRoutePinned.spec.ts` (deleted)
   Change: the **Pure packages** bullet (`CLAUDE.md:34`) becomes:

   ```md
   - **Pure packages**: `packages/engine` and `packages/gpx` hold domain logic only: no React, no state, no app imports (see their CLAUDE.md). Presentation aggregations (e.g. per-sport TSS for chart colours), serialization, format conversion and I/O stay out of the engine even when pure: they go to feature hooks or `apps/web/src/lib/`. The GPX file format (parse and build) lives in `packages/gpx`; route polylines, display rounding and export file names stay in `apps/web/src/lib/`.
   ```

   In `packages/gpx/CLAUDE.md` the module list of the **WHAT** line (`:4`) drops `simplifyGpxPoints`, and the **Pure** bullet (`:8`) becomes:

   ```md
   - **Pure, no React, no app imports**: No imports from `apps/web` (`@/…`), no React, no state library. Imports `@pacevault/engine` (types, gradient, GPS helpers) and `zod`, nothing else at runtime. `DOMParser` (in `parseGpx.ts`) is the one browser API it uses. GPX parse and build are its only serialization: route polylines (`apps/web/src/lib/gpsTrack.ts`), display rounding (`apps/web/src/lib/chartData.ts`) and export file names (`apps/web/src/lib/gpxExport.ts`) live in the app.
   ```

   `packages/gpx/README.md:3` drops `, simplifyGpxPoints` from the module list. Delete the pinned spec.
   Check: `rg -n "simplifyGpxPoints|polyline-codec|simplify-ts" packages/gpx/CLAUDE.md packages/gpx/README.md` prints nothing; `test ! -e apps/web/tests/lib/gpxRoutePinned.spec.ts`; a human reads `CLAUDE.md:34` and `packages/gpx/CLAUDE.md:8` against `tdr/engine-holds-domain-logic-only.md` §1 (gpx paragraph).

## Open items

- The moved zone hex literals (items 1–2) and the `'#888'` fallback (item 1) land as literals in `apps/web/src/lib/zoneColors.ts` and `WorkoutExpansionPanel.tsx`; the styled-api-over-sx plan, which runs after this one, turns them into `zone*` theme tokens with the same values (`zoneUnknown` is `#888888`). Existing same-valued tokens (`statusDangerStrong`, `sportCycling`) name other concepts and are not reused.
- `SessionGPS` (`packages/engine/src/types.ts:135-140`) is the stored shape the moved encoder produces. It stays in the engine's `types.ts` because a type is not encoding logic and ten app modules import it from there; moving it to `apps/web/src/types/index.ts` is a later choice.
- `packages/gpx`: its route polylines move into `apps/web/src/lib/gpsTrack.ts` (items 9–14), beside the session-track encoder of item 6, and reuse its simplification and encoding; the GPX parse and build stay in `packages/gpx` (owner decision).

- `packages/gpx`: the export file name keeps its UTC date (`toISOString`, today `buildGpx.ts:105`) when it moves in item 13; switching it to the local calendar day changes the file name and is not part of this migration (follow-up: backlog item conventions-follow-ups).

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
