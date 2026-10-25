---
id: names-spell-out-their-meaning
tdr_reference: tdr/names-spell-out-their-meaning.md
depends_on: [colocated-types-module, test-data-from-mock-factories]
generated: 2026-10-23
---

# Engine names say what a value is, in full, with its unit

Read `tdr/names-spell-out-their-meaning.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`colocated-types-module`](colocated-types-module.md) — the last plan that changes engine code before this one (it settles which engine module owns which type); every rename here starts from the names and shapes it leaves (`BANISTER_BY_GENDER`, `METERS_BY_RACE_DISTANCE`).
- [`test-data-from-mock-factories`](test-data-from-mock-factories.md) — moves the record, lap and session series into `packages/testing/src/series.ts` under their final names and removes their dead inputs (items 3, 14–17), so item 9 renames each local once, in its final module.

## Changes

Every item is a rename: TypeScript reports every missed reference, and the existing specs are the safety net. Each rename updates the declaration, every engine and app reader, the specs, `packages/engine/README.md`, `packages/engine/SOURCES.md` and `CLAUDE.md` files that mention the old name (`rg -nw <old> apps packages tools docs --glob '!node_modules' --glob '!tools/workbench/backlog/**' --glob '!docs/conventions/**'`). Spec `describe` titles that spell the old name follow it. Run every Check from the repo root; "green" means `vp run -F @pacevault/i18n compile && vp check` finishes with no error and `vp run test` passes. Line numbers are today's; earlier plans may have moved a symbol.

1. Drop the empty verb prefixes from the engine's exported functions (R1).
   Files: `packages/engine/src/coaching.ts`, `packages/engine/src/zones.ts`, `packages/engine/src/trainingEffect.ts`, `packages/engine/src/metrics.ts`, `packages/engine/src/gps.ts`, `packages/engine/src/windExposure.ts`, `packages/engine/src/vdot.ts`, `packages/engine/src/normalize.ts`, `packages/engine/src/stress.ts`, `packages/engine/src/sessionDerivation.ts`, `packages/engine/README.md`, their specs, and every app reader (`apps/web/src/lib/coachingMessages.ts`, `apps/web/src/lib/prescription.ts`, `apps/web/src/features/dashboard/ACWRGauge.tsx`, `apps/web/src/lib/zoneColors.ts`, `apps/web/src/features/labs/hooks/useCoachPlan.ts`, `apps/web/src/features/sessions/session/TrainingEffectCard.tsx`, `apps/web/src/lib/hooks/useMetrics.ts`, `apps/web/src/features/labs/hooks/useRacePredictor.ts`, `apps/web/src/lib/railRange.ts`, `apps/web/src/lib/sessionStress.ts`, `apps/web/src/parsers/fit.ts`, `apps/web/src/features/demo/buildDemoDataset.ts`, `apps/web/src/features/sessions/session/hooks/useWindExposure.ts`, `packages/gpx/src/routeGeometry.ts`, `apps/web/e2e/helpers/seed.ts`, and the app specs that import them)
   Change:
   - `getFormStatus` → `formStatusFromTsb`; `getLoadState` → `loadStateFromAcwr`; `getInjuryRisk` → `injuryRiskFromAcwr` (`coaching.ts`).
   - `getZoneForPace` → `zoneForPace`; `getZoneMidPace` → `zoneMidPace`; `computeRunningZones` → `runningZonesFromThresholdPace` (`zones.ts`).
   - `getTrainingEffectLabel` → `trainingEffectLabel`; `getTrainingEffectSummary` → `trainingEffectSummary`; `calculateTrainingEffect` → `trainingEffectFromRecords` (`trainingEffect.ts`).
   - `computeMetrics` → `dailyMetricsFromSessions` (`metrics.ts`).
   - `computeBounds` → `boundsFromPoints` (`gps.ts`, read by `packages/gpx/src/routeGeometry.ts:2,112`).
   - `computeWindExposure` → `windExposureFromRecords` (`windExposure.ts`).
   - `calculateVdot` → `vdotFromRace` (`vdot.ts`).
   - `calculateNormalizedPower` → `normalizedPowerFromRecords`; `calculateGAP` → `gradeAdjustedPaceFromRecords` (`normalize.ts`; `sessionDerivation.ts` and its `gradeAdjustedPaceFor` helper read the latter).
   - `calculateSummaryStress` → `stressFromSummary`; `calculateSessionStress` → `stressFromRecords` (`stress.ts`; `README.md:10` shows the new name).
   - Module-local: `getDateRange` → `dayKeysFromSessions` (`metrics.ts`), `calculateTSS` → `trainingStressScore` (`stress.ts`), `computeTrimpRef` → `referenceTrimp` (`trainingEffect.ts`).
   `detect*`, `estimate*`, `predict*`, `derive*`, `build*` and `upsert*` keep their verbs: each names work the function does.
   Check: `rg -n "\\b(get|calculate|compute)[A-Z]\\w*" packages/engine/src packages/engine/README.md` prints nothing; `rg -nw "getFormStatus|getLoadState|getInjuryRisk|getZoneForPace|getZoneMidPace|computeRunningZones|getTrainingEffectLabel|getTrainingEffectSummary|calculateTrainingEffect|computeMetrics|computeBounds|computeWindExposure|calculateVdot|calculateNormalizedPower|calculateGAP|calculateSummaryStress|calculateSessionStress" apps packages tools --glob '!node_modules' --glob '!tools/workbench/backlog/**'` prints nothing; green; `vp run e2e` passes.

2. Spell out the abbreviated engine names (R2).
   Files: `packages/engine/src/gps.ts`, `packages/engine/src/windExposure.ts`, `packages/engine/src/trainingEffect.ts`, `packages/engine/src/zoneDistribution.ts`, `packages/engine/src/zones.ts`, `packages/engine/tests/gps.spec.ts`, `apps/web/src/lib/localizedTrainingEffect.ts`, `apps/web/src/features/sessions/session/TrainingEffectCard.tsx`, `apps/web/src/lib/zoneColors.ts`, `apps/web/src/lib/sessionTitleFormatter.ts`, `apps/web/src/lib/weather.ts`, `apps/web/src/features/map/previewDrawIn.ts`, `apps/web/src/features/demo/demoRecords.ts`, `apps/web/scripts/generateDemoRoutes.ts`, `packages/gpx/src/routeGeometry.ts`, `packages/gpx/tests/routeCut.spec.ts`, `apps/web/tests/features/demo/buildDemoDataset.spec.ts`
   Change: `toRad` → `degreesToRadians`; `haversineM` → `haversineDistanceMeters`; `bearingDeg` → `initialBearingDegrees`, and the module-local `scaledDistDeg` → `scaledDistanceDegrees` (`gps.ts`; `apps/web/scripts/generateDemoRoutes.ts` declares its own local `haversineM` at `:277` — rename only imports of the engine's); `TELabelKey` → `TrainingEffectLabel`, `TESummaryKey` → `TrainingEffectSummary`, and the module constants `TE_SCALE_MAX`, `TE_OVERREACHING`, `TE_HIGHLY_IMPROVING`, `TE_IMPROVING`, `TE_MAINTAINING`, `TE_MINOR` → the same names with `TRAINING_EFFECT_` in place of `TE_` (`trainingEffect.ts`); `HR_ZONE_DEFS` → `HEART_RATE_ZONES`, `POWER_ZONE_DEFS` → `POWER_ZONES` (`zoneDistribution.ts`, beside `HeartRateZoneName` and `PowerZoneName`); `ZONE_DEFS` → `RUNNING_ZONE_PACE_FACTORS` (`zones.ts`). The established domain acronyms stay as they are (HR, TSS, NP, FTP, CTL, ATL, TSB, ACWR, VDOT, VAM, TRIMP, PELT).
   Check: `rg -nw "toRad|haversineM|bearingDeg|scaledDistDeg|TELabelKey|TESummaryKey|HR_ZONE_DEFS|POWER_ZONE_DEFS|ZONE_DEFS|TE_[A-Z_]+" apps packages --glob '!node_modules' | rg -v "generateDemoRoutes.ts:.*const haversineM"` prints nothing; green.

3. Put the unit into every engine name that carries a quantity (R3).
   Files: `packages/engine/src/climbs.ts`, `packages/engine/src/windExposure.ts`, `packages/engine/src/cadence.ts`, `packages/engine/src/decoupling.ts`, `packages/engine/src/energy.ts`, `packages/engine/src/vdot.ts`, `packages/engine/src/paceCalculator.ts`, `packages/engine/src/zones.ts`, `packages/engine/src/zoneDistribution.ts`, `packages/engine/src/sessionDerivation.ts`, `packages/engine/src/stress.ts`, `packages/engine/src/normalize.ts`, the engine specs, `apps/web/src/lib/windRose.ts`, `apps/web/src/lib/moreStats.ts`, `apps/web/src/lib/zoneColors.ts`, `apps/web/src/features/labs/RacePredictor.tsx`, and every further reader `vp check` reports
   Change:
   - Fields: `Climb.movingSeconds` and `ClimbEffort.movingSeconds` → `movingSec`; `ClimbRules.minSeconds` → `minSec`, `mergeGapSeconds` → `mergeGapSec`, `minGain` → `minGainMeters`; `WindSegment.seconds` and `RelativeWind.seconds` → `durationSec` (`apps/web/src/lib/windRose.ts:19-20`); `StepLength.metres` → `lengthMeters` (the app's own `MoreStats.stepLength.metres` field keeps its name; `moreStats.ts` maps `step.stepLength.lengthMeters` onto it); `CountedInterval.seconds` → `durationSec` (`decoupling.ts`); the race prediction's `timeSeconds` → `timeSec` (`vdot.ts` and `RacePredictor.tsx:69`).
   - Parameters: `timeMinutes` → `timeMin`, `timeSeconds` → `timeSec` (`vdot.ts`, `paceCalculator.ts`); `thresholdPaceSec` → `thresholdPaceSecPerKm` (`zones.ts`, `zoneColors.ts` `paceBands`); `paceSec` → `paceSecPerKm` (`zones.ts` `zoneForPace`).
   - Functions: the module-local `segmentMetres` → `segmentLengthMeters` (`windExposure.ts:59`).
   - Locals: `seconds`, `totalSeconds`, `gradedSeconds`, `movingSeconds`, `counted` (seconds) → `…Sec` (`seconds` itself becomes `durationSec` or `movingSec` by what it sums) in `cadence.ts`, `decoupling.ts`, `climbs.ts`, `energy.ts`, `zoneDistribution.ts`, `sessionDerivation.ts`, `stress.ts`, `normalize.ts`; `metres` → `distanceMeters` (`cadence.ts`); every `dt` → `elapsedSec` and every `dx` → `distanceDeltaMeters` (`cadence.ts`, `decoupling.ts`, `energy.ts`, `normalize.ts`, `zoneDistribution.ts`, `sessionDerivation.ts`, `windExposure.ts`, `effortDetection.ts` where present).
   Persisted fields (`TrainingSession`, `SessionRecord`, `SessionLap`) are not renamed.
   Check: `rg -n "\\b(dt|dx|metres|seconds|totalSeconds|movingSeconds|gradedSeconds|timeMinutes|timeSeconds|thresholdPaceSec|paceSec|minSeconds|mergeGapSeconds)\\b" packages/engine/src` prints nothing; green; `vp run e2e` passes.

4. Replace the stand-in names of engine locals and parameters (R4).
   Files: `packages/engine/src/metrics.ts`, `packages/engine/src/gradient.ts`, `packages/engine/src/windExposure.ts`, `packages/engine/src/effortDetection.ts`, `packages/engine/src/energy.ts`, `packages/engine/src/normalize.ts`, `packages/engine/src/decoupling.ts`, `packages/engine/src/vdot.ts`, `packages/engine/src/sessionDerivation.ts`, `packages/engine/src/gps.ts`
   Change: `metrics.ts` `ewmaStep`'s `result` → `smoothed`; `gradient.ts:77` `result` → `gradientByIndex`; `windExposure.ts:191` `result` → `exposure`, `bestIdx` → `bestIndex`, `bestDiff` → `bestDiffMs`, `windIdx` → `windIndex`; `effortDetection.ts` the signal series `x` (every parameter and the locals at `:201`, `:704`) → `series`, `out` → `smoothed` (`:262`), `merged` (`:442`), `bridged` (`:461`), `marked` (`:530`), `processed` (`:564`), `pelt`'s `s`/`e` → `start`/`end`; `energy.ts:80` `c` → `coefficients`; `normalize.ts:55-56` `g` → `clampedGradient`, `c` → `coefficient`; `decoupling.ts:66,75` `c` → `candidate`; `vdot.ts:74` `f` → `vdotError`, `:114` `dist` → `meters` (or gone after the exhaustive plan); `sessionDerivation.ts:22,64` `r` → `record`, `v` → `value`; `gps.ts` `isValidCoordinate`'s `r` → `point`, `isSegmentIntersectingBounds`'s `p`/`q`/`pi`/`qi` → `directions`/`distances`/`direction`/`distance`, `densestClusterBounds`' `ci`/`cj` → `center`/`other`, `bestIdx` → `bestIndex`, `idx` → `index`. Loop indices `i`/`j`/`k` and comparator pairs `(a, b)` passed to `sort` stay.
   Check: `rg -nw "result|out|fmt|dist|idx|bestIdx|windIdx|ci|cj|pi|qi" packages/engine/src` prints nothing; `rg -n "const [a-z] = |\\(([a-z], )*[a-z]\\) =>" packages/engine/src` prints only comparator callbacks and `i`/`j`/`k` loops; green.

### packages/gpx

Items 5–8 rename names declared in `packages/gpx/src`. Stored fields keep their names (`lat`, `lng`, `ele`, `time`, `seg`, `dist` of `ParsedGpxPoint`/`RoutePoint`; `gain`, `loss`, `min`, `max`, `maxGrade` of `RouteElevationStats`), and so do the GPX-format fields of `GpxPoint`, `GpxWaypoint` and `GpxMetadata` (`lat`, `lon`, `ele`, `time`, `name`, `desc`, `seg`) — the TDR records both. `RouteProfile`'s fields already carry their units (engine-holds-domain-logic-only item 12). Line numbers are today's; earlier plans moved code, so find each name by its text. Check for every item: green, and the item's `rg` prints nothing.

5. (packages/gpx) Drop the empty verb prefix (R1).
   Files: `packages/gpx/src/routeGeometry.ts`
   Change: the module-local `computeElevationStats` → `elevationStatsFromPoints` (`:59`, its call `:114`). `parse*`, `build*`, `collect*`, `group*`, `slice*` keep their verbs: each names work the function does.
   Check: `rg -n "\b(get|calculate|compute)[A-Z]\w*" packages/gpx/src` prints nothing.

6. (packages/gpx) Spell out the abbreviated names (R2).
   Files: `packages/gpx/src/routeCut.ts`, `packages/gpx/src/parseGpx.ts`
   Change: `lerp` → `interpolateLinear` (`routeCut.ts:8`, uses `:12`, `:18`, `:19`); `lerpKnown` → `interpolateKnown` (`:10`, uses `:23`, `:25`); `interpolate` → `interpolatedPoint`, named for what it returns (`:15`, uses `:54`, `:69`, `:82`); `parseCoordAttribute` → `parseCoordinateAttribute` (`parseGpx.ts:39`, uses `:49`, `:50`).
   Check: `rg -nw "lerp|lerpKnown|interpolate|parseCoordAttribute" packages/gpx/src` prints nothing.

7. (packages/gpx) Put the unit into every gpx name that carries a quantity (R3).
   Files: `packages/gpx/src/routeCut.ts`, `packages/gpx/src/routeGeometry.ts`, `packages/gpx/src/parseGpx.ts`, `apps/web/src/features/studio/createStudioRoute.ts`, the gpx specs `vp check` reports
   Change: `routeCut.ts`: `distanceM` → `distanceMeters` (parameters of `interpolatedPoint`, `firstIndexAtOrAfter`, `pointAtRouteDistance`, `:15-54`), `startM`/`endM` → `startMeters`/`endMeters` (`sliceRoute`, `:57-83`). `routeGeometry.ts`: the field `RouteGeometry.distance` → `distanceMeters` (`:24`, `:113`; `createStudioRoute.ts:25` becomes `distance: geometry.distanceMeters,`, the stored `StudioRoute.distance` keeps its name; the spec reads at `routeGeometry.spec.ts:25,67` and `routeCut.spec.ts` `route.distance` follow); the local `dist` → `distanceMeters` (`:94`, `:98`, `:100`, `:113`); `steepestGrade` → `steepestGradePercent` (`:46`, `:87`) with its local `maxGrade` → `steepestPercent` (`:47`, `:53`, `:56`); in `elevationStatsFromPoints` `min`/`max`/`gain`/`loss` → `minElevationMeters`/`maxElevationMeters`/`gainMeters`/`lossMeters` (`:63-66`, `:74-82`), `ref` → `referenceElevationMeters` (`:71`, `:76`, `:79`, `:82`), `delta` → `elevationDeltaMeters` (`:76-81`), and the return keeps the stored keys: `return { gain: gainMeters, loss: lossMeters, min: minElevationMeters, max: maxElevationMeters, maxGrade: steepestGradePercent(points) };`. `parseGpx.ts`: `parseTime` → `parseTimeMs` (`:31`, `:52`).
   Check: `rg -nw "distanceM|startM|endM|dist|ref|delta|maxGrade|steepestGrade|parseTime" packages/gpx/src | rg -v "\.dist\b|maxGrade: |dist: "` prints nothing; `vp run e2e` passes.

8. (packages/gpx) Replace the stand-in names of gpx locals and parameters (R4).
   Files: `packages/gpx/src/buildGpx.ts`, `packages/gpx/src/parseGpx.ts`, `packages/gpx/src/routeCut.ts`, `packages/gpx/src/routeGeometry.ts`, `packages/gpx/src/routeProfile.ts`
   Change: `buildGpx.ts`: `escapeXml`'s `s` → `text` (`:22`), `parts` → `lines` (`:37-101`), `w` → `waypoint` (`:60-69`), `p` → `point` and `currentSeg` → `currentSegment` (`:78-95`). `parseGpx.ts`: every `el` → `element` (`:23`, `:31`, `:39`, `:47`, `:68`), `eleEl` → `elevationElement` (`:24`), `timeEl` → `timeElement` (`:32`), `nameEl` → `nameElement` (`:78`), `raw` → `attributeText` (`:40`), the `seg` parameter and loop counter → `segmentIndex` (`:47`, `:55`, `:63-70`; the `seg` key of the returned point stays), `pointEls` → `pointElements` (`:66`), `doc` → `gpxDocument` (`:77`, `:85-95`). `routeCut.ts`: the interpolation parameters `a`, `b`, `t` → `from`, `to`, `fraction` (`:8`, `:10`) and in `interpolatedPoint` `a`, `b` → `before`, `after`, `t` → `fraction` (`:15-27`); `lo`/`hi`/`mid` → `low`/`high`/`middle` (`:31-41`); `at` → `atOrAfter` (`:50-54`); `startIdx`/`endIdx` → `startIndex`/`endIndex` (`:61-78`); in `routeDistanceAtPosition` the parameter `click` → `position` (`:90`; its type `RoutePosition` stays), `cosLat` → `longitudeScale`, `cx`/`cy` → `positionX`/`positionY`, `bestSq` → `nearestDistanceSquared`, `bestAt` → `nearestRouteDistanceMeters`, `b`/`a` → `segmentEnd`/`segmentStart`, `ax`/`ay` → `startX`/`startY`, `dx`/`dy` → `deltaX`/`deltaY`, `lenSq` → `lengthSquared`, `t` → `fraction`, `ex`/`ey` → `offsetX`/`offsetY`, `distSq` → `distanceSquared` (`:92-125`). `routeGeometry.ts`: every `p` → `point` (`:34-41`, `:50`, `:60`, `:73-83`, `:96-102`), `current`/`currentSeg` → `segment`/`segmentIndex` in `groupBySegment`, `elevated` → `elevatedPoints` (`:60-68`), `prev` → `previous` (`:95-101`). `routeProfile.ts`: `p` → `point` (`:31`), `percent` → `gradePercent` (`:37-40`).
   Check: `rg -nw "s|w|p|a|b|t|el|doc|raw|lo|hi|mid|at|idx|startIdx|endIdx|cx|cy|ax|ay|dx|dy|ex|ey|lenSq|distSq|bestSq|bestAt|cosLat|prev|current|currentSeg|parts|percent|elevated|eleEl|timeEl|nameEl|pointEls|click" packages/gpx/src` prints nothing.

### packages/testing

Item 9 renames inside `packages/testing/src/series.ts` as test-data-from-mock-factories leaves it (series names `cyclingRecordSeries`, `runningRecordSeries`, …; `lastSegment` from boolean-names item 10; `LAP_DURATION_SEC` from the duration-constants plan, which this item does not touch). The per-channel arrays (`elevations`, `speeds`, `hrs`, `cadences`, `grades`, `powers`) keep their names: each fills the persisted `SessionRecord` field of that name.

9. (packages/testing) Spell out the series names and put units into them (R1–R4).
   Files: `packages/testing/src/series.ts`; the option callers `packages/engine/tests/trainingEffect.spec.ts:93,103,113,122,130,173,181,182,194,208,216,224,232,240`, `apps/web/tests/lib/computePbsForSessions.spec.ts:22-25,67,68,96-99,122,123,146,200,209-213`, `apps/web/tests/store/deleteAllData.integration.test.ts:31`, `apps/web/tests/features/sessions/createIngestBatcher.integration.test.ts:29`, `apps/web/tests/features/sessions/recomputeTrainingLoad.integration.test.ts:95`, `apps/web/tests/packages/engine/stressPipeline.integration.test.ts:15,70`, `apps/web/tests/lib/sessionFitness.spec.ts:20` (spec paths as today; mirrored-spec-layout may have renamed them)
   Change:
   - Options (R3), every caller adapted: `cyclingRecordSeries` `basePower` → `basePowerWatts`, `baseHr` → `baseHrBpm`; `runningRecordSeries` `baseSpeed` → `baseSpeedMetersPerSec`, `baseHr` → `baseHrBpm`. Callers: `{ basePower: 250 }` → `{ basePowerWatts: 250 }`, `{ baseHr: 155 }` → `{ baseHrBpm: 155 }`, `{ baseSpeed: 3.5 }` → `{ baseSpeedMetersPerSec: 3.5 }`; in `computePbsForSessions.spec.ts:209-213` the helper `cyclingSession(sessionId, basePower)` takes `basePowerWatts` and passes `{ basePowerWatts }`.
   - `randomWalk`: `r` → `draw`, `stayProb` → `stayProbability`, `smallProb` → `smallStepProbability` (R2, R4).
   - `generateTerrainSegments` → `terrainSegments` (R1), its parameter `totalRecords` → `totalRecordCount`; the segment fields `{ length, slope }` → `{ recordCount, slopeMetersPerRecord }` (both inline type literals and every read); `s` → `segmentIndex`, `avgLen` → `averageRecordCount`, `length` → `recordCount`, `actualLen` → `segmentRecordCount`, `slope` → `slopeMetersPerRecord`.
   - `buildElevationArray`: `startElevation` → `startElevationMeters`, `elev` → `elevationMeters`, `idx` → `recordIndex`, the loop variable `seg` → `segment`.
   - `buildHrArray`: `baseHr` → `baseHrBpm`, `warmUpDuration` → `warmUpRecordCount`, `totalDrift` → `totalDriftBpm`, `currentHr` → `currentHrBpm`, `driftTarget` → `driftTargetBpm`.
   - `buildSpeedArray`: `baseSpeed` → `baseSpeedMetersPerSec`, `currentSpeed` → `currentSpeedMetersPerSec`, `rampDuration` → `rampRecordCount`, `elevDiff` → `elevationDeltaMeters`.
   - `buildCadenceArray`: `base`/`min`/`max` → `baseCadence`/`minCadence`/`maxCadence`, `current` → `cadence`.
   - `buildGradeArray`: the callback parameter `elev` → `elevationMeters`, `elevDiff` → `elevationDeltaMeters`, and `distance` → `speedMetersPerSec` (it holds `Math.max(speeds[i] ?? 0.5, 0.5)`, a speed, not a distance).
   - `buildPowerArray`: `basePower` → `basePowerWatts`, `baseSpeed` → `baseSpeedMetersPerSec`, `currentPower` → `currentPowerWatts`, `rampDuration` → `rampRecordCount`.
   - `assembleRecords` and `gpsRunningRecordSeries`: `cumulativeDistance` → `cumulativeDistanceMeters`, `speed` → `speedMetersPerSec` (the record key stays `speed: speedMetersPerSec`); `cyclingRecordSeries`'s local `baseSpeed` → `baseSpeedMetersPerSec`.
   Spec titles and notes that spell `baseHr` (`trainingEffect.spec.ts:112,121,207,215,223,231`) are spec text and stay as they are.
   Check: `rg -n "\b(const|let) (r|s|seg|elev|idx|avgLen|actualLen|length|slope|elevDiff|distance|cumulativeDistance|speed|warmUpDuration|rampDuration|totalDrift|currentHr|currentSpeed|currentPower|driftTarget|baseSpeed|current)\b|\b(stayProb|smallProb|startElevation|totalRecords|generateTerrainSegments)\b|\((elev|seg), i\)|\bbase: number" packages/testing/src` prints nothing; `rg -n "\b(baseHr|basePower|baseSpeed)\??:|\{ basePower \}" packages/testing/src apps/web/tests packages/engine/tests` prints nothing; `vp run check` clean; `vp run test` passes with the same counts.

### tools/docs

Line numbers are today's; the plans before this one (index-modules, comments, behavioural-constants, boolean-names, exhaustive-record-maps) have already edited these modules, so find each line by its text. For these items "green" means `vp check` from `tools/docs/` is clean and `vp run docs:banner --locale de` and `vp run docs:banner --locale en` both write their banner without error.

10. (tools/docs) Name the dev servers and the locale for the banner, not for the README (R2).
   Files: `tools/docs/banner/env.ts`, `tools/docs/banner/run.ts`, `tools/docs/playwright.config.ts`, `tools/docs/banner/capture.ts`, `tools/docs/CLAUDE.md`
   Change: `README_PORT` and `README_ORIGIN` (`env.ts:14-15`) are the web app's dev server, and `readmeLocale` / `README_LOCALE_ENV` (`env.ts:4,6`) carry the banner's locale. Renames, every reader updated: `README_PORT` → `WEB_APP_PORT`, `README_ORIGIN` → `WEB_APP_ORIGIN` (readers `playwright.config.ts:6-7,25,40,42`, `capture.ts:10,332`); `readmeLocale` → `bannerLocale` (readers `playwright.config.ts:8,26`, `capture.ts:10,13`); `README_LOCALE_ENV` → `BANNER_LOCALE_ENV` (readers `env.ts:7`, `run.ts:4,24`), and its value `'README_LOCALE'` → `'BANNER_LOCALE'` — it is only the variable `run.ts` hands to the Playwright process, nothing else sets or reads it. The thrown message `Unknown README banner locale "${value}"` (`env.ts:9`) becomes `Unknown banner locale "${value}"`. In `tools/docs/CLAUDE.md:10`, `port \`README_PORT\`` → `port \`WEB_APP_PORT\``. `BANNER_PORT` and `BANNER_ORIGIN` keep their names.
   Check: `rg -n "README_(PORT|ORIGIN|LOCALE)|readmeLocale" tools/docs --glob '!node_modules'` prints nothing; green; `README_LOCALE=en vp run docs:banner` is no longer honoured (the flag is the only interface, `tools/docs/README.md:8-9`).

11. (tools/docs) Replace the stand-in names of the capture, the page and the runner (R4).
   Files: `tools/docs/banner/capture.ts`, `tools/docs/banner/run.ts`, `tools/docs/banner/page/Banner.tsx`, `tools/docs/banner/page/main.tsx`
   Change: renames, behaviour unchanged:
   - `capture.ts`: the message lookup `t` (`:26`, about twenty calls) → `messageText`; `out` (`:52`, read in `shoot`) → `outPath`; in `openPngCanvas` the evaluate parameter `data` (`:137`) → `base64Png`; in `isOverTrack` the evaluate parameter `p` (`:230`) → `hoverPoint`; in `spiral` `r` (`:240`) → `radius`, `dx` (`:241`) → `offsetX`, `dy` (`:244`) → `offsetY`; in `findPositionDot` `const data` (`:272`) → `pixels`; in the heatmap test `x`, `y` (`:346-347`) → `frameX`, `frameY`; in the laps test the evaluate parameters `(el) =>` (`:425`) → `(nameElement) =>` and `(el, by) => el.scrollBy(0, by)` (`:455`) → `(scroller, scrollOffset) => scroller.scrollBy(0, scrollOffset)`; in the banner test `img` (`:602`) → `image`.
   - `run.ts`: `result` (`:21`) → `playwrightRun`.
   - `Banner.tsx`: in `FitText` `const el = ref.current;` (`:28`) → `const container = ref.current;` with its reads.
   - `main.tsx`: `rootEl` (`:6`) → `rootElement`.
   Loop indices (`i`, `frame`, `step`), the promise resolver `done` and the evaluate argument bags `input` stay. `text` and `locale` of `Banner.tsx:20-21` are renamed when the unit-length plan moves them into `bannerLocale.ts` (`BANNER_COPY`, `BANNER_LOCALE`).
   Check: `rg -n "\bconst (t|out|data|result|el|rootEl|x|y|img) =|\((p|el|data|el, by)\) =>|\b(dx|dy)\b|let r = " tools/docs/banner` prints nothing; green.

### tools/workbench

Line numbers are today's; where an earlier plan already edited a module, find the line by its text. Zod's `parsed.data` and the props bag `props` are library and framework names and stay. No message text, file format or rendered string changes.

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

12. (tools/workbench) Replace the stand-in names in the scripts and hooks (R4).
   Files: `tools/workbench/scripts/{statusGuard,indexHook,frontmatter,deps,interfaces,changedFiles}.ts`
   Change: rename, at the declaration and every use:
   - `statusGuard.ts:404` and `indexHook.ts:22` `raw` (the parsed stdin) → `hookJson`; `statusGuard.ts:192` `guarded` → `guardedTarget`.
   - `frontmatter.ts:148` `out` → `sectionContent`, `:242` `out` → `questions`, `:267` `out` → `entries`, `:319` `raw` → `frontmatterYaml`, `:379` `json` → `mockupConfigJson`.
   - `deps.ts`: `local` (`:111`, `:141`, `:186`, the path below `apps/web/src/`) → `appRelative`; `own` (`:270`) → `featureNodes`, (`:345`) → `fileImports`; `classOf` (`:374`, it pushes a `class` line) → `pushClassLine`; in `cruiseRepo` `run` (`:480`) → `cruiseRun`, `raw` (`:485`) → `cruiseJson`; in `areasOf` `raw` (`:503`) → `frontmatterYaml`; in `main` `run` (`:545`) → `scopedCruise`, `tsx` (`:557`) → `componentFiles`, `cruised` (`:560`) → `componentCruise`, `json` (`:571`) → `depsJson`.
   - `interfaces.ts`: `pick` (`:40`) → `typeScriptChanges`; `walk` (`:50`) → `typeScriptFilesBelow`; `raw` (`:69`) → `plannedPath`; `read` (`:117`) → `configRead`, `parsed` (`:119`) → `parsedConfig`; `out` (`:288`) → `exportsByFile`.
   - `changedFiles.ts:82` `run` → `gitRun`.
   Check: `rg -nw "raw|out|json|run|own|local|pick|walk|guarded|classOf|tsx|cruised" tools/workbench/scripts` prints nothing apart from object fields and strings that carry these words (`item.raw`, `token.raw`, `'--output-type', 'json'`); workbench check; suite.

13. (tools/workbench) Replace the stand-in and vague names of the board, and drop its unread `text` field (R4).
   Files: `tools/workbench/site/src/lib/{board,writeBack,devPlugin}.ts`, `tools/workbench/site/src/actions/index.ts`, `tools/workbench/site/src/scripts/tech.ts`, `tools/workbench/site/src/app/{Board,Columns,ItemPanel,ItemCard,PlanPane,ReviewPane,MockupPane,QuestionRow,AnswerDialog,Prose,WriteCard}.tsx`, the undo hook's module (`tools/workbench/site/src/app/useWrite.ts`, or its moved form under `tools/workbench/site/src/app/hooks/`), the specs under `tools/workbench/tests/site/` (or their pre-mirror names `tests/board*.spec.ts`, `tests/writeBack.spec.ts`)
   Change: rename, at the declaration and every use:
   - The `ItemView` fields (`board.ts:169-191`): `data` (the parsed frontmatter) → `frontmatter` (`item.data.status` → `item.frontmatter.status` in `Columns.tsx`, `ItemPanel.tsx`, `ItemCard.tsx`, `PlanPane.tsx`, `MockupPane.tsx`, `ReviewPane.tsx`, `board.ts` `needsYou`/`readBoard`, and the specs' `.data.title`, `.data.size`); `lines: { status: string }` → `statusLine: string` (`item.lines.status` → `item.statusLine` at `Columns.tsx:136`, `ItemPanel.tsx:93`); `text` has no reader and is deleted (`:172`, `:257`).
   - `board.ts`: `sync` → `syncHtml`; `md` (`:62`) → `planMarked`, (`:341`) → `techMarked`; `out` (`:97`) → `kept`, (`:505`) → `rowHtml`; `json` (`:131`, `:382`) → `depsJson`; `raw` (`:239`) → `frontmatterYaml`, (`:563`) → `filesJsonValue`; `techOf` → `withTech`.
   - `writeBack.ts`: `split` → `splitLines`; `done` → `appliedEdit`; `quote` → `ownerQuote`; `out` (`:33`) → `headingList`, (`:77`) → `items`, (`:210`) → `numberedOp`, (`:241`) → `hunkLines`; the `DiffOp` fields `a`, `b` (line indices) → `beforeIndex`, `afterIndex`; `diffOps`'s parameters `a`, `b` → `before`, `after` and `midA`, `midB` → `beforeMiddle`, `afterMiddle`; `table` → `lcsLengths`.
   - `devPlugin.ts`: `out` (`:38`) → `questionJson`; `features` (`:83`, the backlog's static files) → `backlogFiles`; `shared` (`:84`) → `sharedFiles`.
   - `actions/index.ts`: `read` → `readBacklogFile`; `need` → `requireBacklogFile`; `commit` (it writes files, it does not commit) → `writeEdits`; `applied` → `editedText`; `calls` (`:149`) → `openDecisionCount`.
   - `tech.ts`: `apply` → `applyView`; `draw` → `drawGraph`; `h2` → `headingByText`; `segment` → `sideSwitch`, its `seg` → `switchGroup`; `out` (`:255`) → `rendered`; `px`, `py` (`:98-99`) → `pointerX`, `pointerY`; `last` (`:118`) → `lastPointer`; `end` (`:131`) → `endPan`.
   - Components: `Board.tsx:43` `data` → `boardView`, `:41` `[open, setOpen]` (what the panel shows) → `[panel, setPanel]` and its type `Open` → `PanelContent`; `q` → `question` in `QuestionRow.tsx:18` and `AnswerDialog.tsx:33`; `Prose.tsx:16` `out` → `rendered`; `WriteCard.tsx` `result` (`:56`, `:137`) → `writeResult`, `Written`'s prop `result` → `writeResult`, and `linesOf`/`titleOf`'s parameter `result` → `writeResult`; the undo hook's `mutationFn` parameter `result` (`useWrite.ts:90` today; in `site/src/app/hooks/` once the hook-directory, one-hook-per-file and one-server-call plans have moved it) → `write`.
   Check: `rg -nw "data|out|md|json|raw|q|result|sync|split|done|read|need|commit|applied|calls|apply|draw|h2|segment|seg|px|py|techOf|features" tools/workbench/site/src` prints only library members and strings (`parsed.data`, `mutation.state.data`, `token.raw`, `item.raw`, `'data-…'` attributes, `board.data` from TanStack); `rg -n "\.lines\.status|item\.text\b" tools/workbench/site tools/workbench/tests` prints nothing; workbench check; board check; suite.

## Open items

- `tools/docs`: R1 holds (the helpers are named for their result or for the work they do: `bannerLocale`, `spiral`, `nextTrackPoint`, `prepareContext`, `shoot`), and R3 has a subject only in durations, which carry `_MS` (native-date-and-duration-constants). Pixel values (`MAP_WIDTH`, the frame geometry, viewports) are CSS pixels throughout the capture and get no suffix.

- The TrainingSession fields `avgHr`, `maxHr`, `avgPower`, `avgCadence`, `avgPace`, `avgSpeed`, `maxSpeed` and the `SessionRecord` fields are persisted and keep their names; `avg` is the stored shape, not a new abbreviation.
- App-side names that still carry an old engine abbreviation (`localizedTELabel`, `localizedTESummary`, `TE_LABEL_MAP`, `TE_ZONES` in `apps/web/src`) are app names; this plan changes only their engine type references. Renaming them is the app's choice.
- `packages/testing`: cadence values (rpm for cycling, steps per minute for running in the same series) get no unit suffix; R3 names no cadence unit, and `baseCadence`/`minCadence`/`maxCadence` name the quantity. `clamp`'s `min`/`max` name the bounds of any value and stay.
- Field renames of exported engine types change what the app reads, not what it renders or stores: every reader is adapted in the same item.

- `packages/gpx`: the equirectangular coordinates of `routeDistanceAtPosition` (`positionX`, `startX`, `deltaX`, …) are degrees scaled by the cosine of the latitude, a unit of the approximation itself; they are named for their axis and carry no unit suffix.
- `packages/gpx`: `ParsedGpxPoint.time` holds unix ms and `RoutePoint.dist` metres, and `RouteElevationStats` holds metres and a percent; they are stored shapes and keep their names (owner decision, scope exclusion in the TDR §1), so no item renames them or adds an IndexedDB or persist migration.
- `tools/workbench`: the `Deps` fields `mmd` and `json` name the two artefact files they hold and stay.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
