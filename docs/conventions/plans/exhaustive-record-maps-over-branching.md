---
id: exhaustive-record-maps-over-branching
tdr_reference: tdr/exhaustive-record-maps-over-branching.md
depends_on: [boolean-names-without-is-prefix]
generated: 2026-10-23
---

# Exhaustive record maps for per-member values, exhaustive switches for per-member behaviour

Read `tdr/exhaustive-record-maps-over-branching.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`boolean-names-without-is-prefix`](boolean-names-without-is-prefix.md) — renames `Grid.isBreak` and `coveredByRecords`, which the engine switches of items 13–15 are written against.

## Changes

Every item's Check includes `vp run check` clean and `vp run test` green. A converted `switch` has no `default` arm and sits in a function with an explicit return type, so a missing member fails `vp check` with TS2366 ("Function lacks ending return statement") until the lint gate from the tooling plan is on.

1. Declare each union that has a runtime list once, from that list (R1).
   Files: `apps/web/src/lib/labsTab.ts`, `apps/web/src/lib/colorModes.ts:6`, `apps/web/src/lib/lapSet.ts:9`, and the module holding `COLOR_MODES`/`LAP_SOURCES` (today `apps/web/src/store/mapPreferences.ts:14-22`; after the store-slices plan `apps/web/src/store/mapPreferences/persistence.ts`).
   Change: `labsTab.ts` — replace `type LabsTab = 'studio' | 'tools' | 'training'` and the `rawTab === 'studio' || …` list at `:9` with `export const LABS_TABS = ['studio', 'tools', 'training'] as const; type LabsTab = (typeof LABS_TABS)[number];` and `resolveLabsTab = (rawTab: string | null): LabsTab => { const tab = LABS_TABS.find((candidate) => candidate === rawTab); if (tab === undefined) return 'studio'; return tab; };` (the JSDoc at `:3-7` is not carried over). `colorModes.ts` — `export const COLOR_MODES = ['sport', 'hr', 'power', 'pace', 'speed', 'wind'] as const; export type ColorMode = (typeof COLOR_MODES)[number];`; `lapSet.ts` — `export const LAP_SOURCES = ['off', 'device', 'splits', 'efforts'] as const; export type LapSource = (typeof LAP_SOURCES)[number];`. The map-preferences module imports both lists instead of redeclaring them with `as const satisfies readonly …[]`.
   Check: `rg -n "COLOR_MODES = |LAP_SOURCES = " apps/web/src` → one declaration each, in `colorModes.ts` and `lapSet.ts`; `rg -n "'studio' \|\| " apps/web/src/lib/labsTab.ts` → nothing.

2. Key the colour maps by their union instead of `string`, and drop the fallbacks that hid it (R5, R6, R4).
   Files: `apps/web/src/lib/statusColors.ts:4,13,22,41,56`, `apps/web/src/features/dashboard/ReadinessGauge.tsx:48`, `apps/web/src/features/sessions/session/TrainingEffectCard.tsx:32,41,55,88`, `apps/web/src/features/sessions/charts/SessionChartsExplorer.tsx:197`.
   Change: `statusTextClass`/`statusFill: Record<string, string>` → `Record<FormStatus, string>`; `sportColorClass: Record<string, string>` → `Record<Sport, string>`; the untyped `acwrColorMap` and `acwrFill` literals close with `} satisfies Record<ReturnType<typeof getACWRColor>, …>` (`{ bg: string; text: string; ring: string }` and `string`); `ReadinessGauge.tsx:48` `statusFill[status] ?? tokens.statusNeutral` → `statusFill[status]`; `TE_FILL`/`TE_TEXT: Record<string, string>` → `Record<ReturnType<typeof getTrainingEffectLabel>['color'], string>` and `:55`, `:88` drop `?? ''`; `SessionChartsExplorer.tsx:197` `sportIcon[session.sport] ?? sportIcon.running` → `sportIcon[session.sport]` (`sportIcon` is already `Record<Sport, LucideIcon>`). The `/** … */` lines above each map in `statusColors.ts` are not carried over.
   Check: `rg -n "Record<string, string>" apps/web/src/lib/statusColors.ts apps/web/src/features/sessions/session/TrainingEffectCard.tsx` → nothing; `rg -n "statusFill\[status\] \?\?|TE_(FILL|TEXT)\[[^]]+\] \?\?|sportIcon\[[^]]+\] \?\?" apps/web/src` → nothing.

3. Replace value-only conditional chains with maps (R2, R8, R9).
   Files: `apps/web/src/components/ImportProgressOverlay.tsx:21-25`, new or extended `apps/web/src/microcopy/importProgress.ts`; `apps/web/src/features/settings/ThresholdTiles.tsx:96-106`, new or extended `apps/web/src/microcopy/thresholds.ts`; `apps/web/src/features/map/zoneColoredPath.ts:26-30`; `apps/web/src/lib/weather.ts:164-171`.
   Change: `phaseLabel` → `LABEL_BY_IMPORT_PHASE: Record<ImportPhase, () => string> = { preparing: m.ui_import_phase_preparing, importing: m.ui_import_phase_importing, saving: m.ui_import_phase_saving }` in the microcopy module, and `foregroundLabel` reads `LABEL_BY_IMPORT_PHASE[foreground.phase]()`. `addCaption`'s six `if (key === …)` lines → `ADD_CAPTION_BY_THRESHOLD: Record<ThresholdKey, () => string>` (`restHr: m.ui_thresholds_add_rest_hr`, `maxHr: m.ui_thresholds_add_max_hr`, `thresholdHr: m.ui_thresholds_add_threshold_hr`, `ftp: m.ui_thresholds_add_ftp`, `weight: m.ui_thresholds_add_weight`, `thresholdPace: m.ui_thresholds_add_pace`), and `addCaption` starts with `if (isEditable(key)) return ADD_CAPTION_BY_THRESHOLD[key]();` followed by the unchanged `wkg` lines. `rawZoneValue` → `ZONE_VALUE_BY_METRIC: Record<TrackMetric, (record: SessionRecord) => number | undefined> = { hr: (record) => record.hr, power: (record) => record.power, pace: (record) => record.speed, speed: (record) => record.speed }` (the old fall-through sent `pace` to `speed`; the map states it). `precipitationType`'s condition chain → `PRECIPITATION_BY_CONDITION: Partial<Record<WeatherCondition, PrecipitationType>> = { drizzle: 'rain', rain: 'rain', snow: 'snow', thunderstorm: 'thunderstorm' }`, the function keeping its `FREEZING_CODES` guard and then returning `PRECIPITATION_BY_CONDITION[wmoToCondition(code)]`.
   Check: `rg -n "const (phaseLabel|rawZoneValue) " apps/web/src` → nothing; `rg -n "if \(key === 'restHr'\)" apps/web/src` → nothing; `apps/web/tests/lib/weather*.spec.ts` pass unchanged.

4. Turn behavioural conditional chains over unions into exhaustive switches in `lib/` (R3).
   Files: `apps/web/src/lib/formatters.ts:145-161`, `apps/web/src/lib/lapSet.ts:64-80`, `apps/web/src/lib/moreStats.ts:187-196`, `apps/web/src/lib/mapCamera.ts:72-90`, `apps/web/src/features/map/hooks/useMapCameraEffect.ts:86-95,180-198,240-252`.
   Change: `pbLabel` and `formatPBValue` → `switch (pb.category)` with cases `'peak-power'`, `'fastest-distance'`, `'longest'`, `'most-elevation'` (the former trailing `return` becomes the `'most-elevation'` case). `buildLapSet` → `switch (source)` with `'off'`, `'device'`, `'efforts'`, `'splits'` (the dynamic-laps tail becomes the `'splits'` case). `topicPresent` → `switch (topic)` over `'load' | 'calories' | 'power' | 'stride' | 'zones'`. `arrivalFit` → `switch (target.kind)` over `'session' | 'trip' | 'studioRoute' | 'studioTab' | 'overview'` (the trailing `refitRequested`/`null` lines become the `'overview'` case). `fitBoundsOf` → `switch (fit)` over `MapCameraFit` (`'overview' | 'session' | 'lap' | 'lapClose' | 'tilt' | 'flatten' | 'trip' | 'studio'`; today `'session'`, `'lapClose'`, `'tilt'` and `'flatten'` all reach the trailing `return sources.sessionBounds`, so they share one arm by fall-through — `'tilt'` and `'flatten'` never get there, because `applyCameraOnlyFit` settles them first, but the arm keeps today's result for them). The 3D camera code adds two more dispatches over `MapCameraFit` in `useMapCameraEffect.ts`: `applyCameraOnlyFit` (`:180-198`) → `switch (fit)` with a `'flatten'` case (today's `clearZoomLimit`, `flattenCamera`, `return true`), a `'tilt'` case (today's body from the `target.kind !== 'session'` guard on), and `'overview' | 'session' | 'lap' | 'lapClose' | 'trip' | 'studio'` sharing one arm that returns `false`; `fitPathOf` (`:240-252`) → `switch (fit)` with `'lap'` returning `lapPath`, `'tilt'` returning `lapPath` when it is not `null` and `sessionPath` otherwise, and the other six members sharing one arm that returns `sessionPath`.
   Check: `rg -nU "if \(pb\.category === [^\n]+\n\s*if \(pb\.category|if \(source === 'off'\)|if \(topic === 'load'\)|if \(target\.kind === 'trip'\)|if \(fit === 'overview'\)|if \(fit === 'flatten'\)|if \(fit === 'lap' \|\| \(fit === 'tilt'" apps/web/src` → nothing; `apps/web/tests/lib/{mapCamera,moreStats,lapSet,formatters}*.spec.ts` that exist pass unchanged.

5. Turn behavioural conditional chains over unions into exhaustive switches in components and feature modules (R3).
   Files: `apps/web/src/components/ImportProgressOverlay.tsx:38-43,58-63`, `apps/web/src/features/sessions/session/lapLabels.ts:129-133`, `apps/web/src/features/sessions/session/sensorWarningText.ts:5-15`, `apps/web/src/features/sessions/session/ColorByControl.tsx:74-79`.
   Change: `summaryTitle` and `summaryDescription` → `switch (summary.kind)` over `'imported' | 'nothing-new' | 'no-activities' | 'failed'`. `effortValueLabel` → `switch (signal)` over `'power' | 'pace' | 'hr'`. `sensorWarningText` → `switch (warning.code)` over `'hr_all_zero' | 'hr_above_max' | 'power_above_max' | 'speed_above_max'`, building `values` inside the three cases that read `limit`/`count` (only those members carry them). `swatchBackground` → `switch (mode)` with `'sport'`, `'wind'`, `'speed'` and the zone members `'hr'`, `'power'`, `'pace'` sharing one arm that returns `gradient(ZONE_PALETTES[mode])`.
   Check: `rg -n "if \(summary\.kind === 'imported'\)|if \(signal === 'power'\)|if \(warning\.code === 'hr_above_max'\)|if \(mode === 'sport'\) return" apps/web/src` → nothing.

6. (packages/ui) Name the class maps for both sides of the mapping.
   Files: `packages/ui/src/components/Button.tsx`, `packages/ui/src/components/Input.tsx`, `packages/ui/src/components/Banner.tsx`, `packages/ui/src/components/ActionTile.tsx`, `packages/ui/src/components/Typography.tsx`
   Change: `Button.tsx:15` `variantClasses` → `CLASSES_BY_BUTTON_VARIANT`, `:24` `sizeClasses` → `CLASSES_BY_BUTTON_SIZE`; `Input.tsx:17` `variantClasses` → `CLASSES_BY_INPUT_VARIANT`; `Banner.tsx:13` `variantClasses` → `CLASSES_BY_BANNER_VARIANT`; `ActionTile.tsx:19` `rowLookClasses` → `CLASSES_BY_ROW_LOOK`, `:26` `rowIconClasses` → `ICON_CLASSES_BY_ROW_LOOK`; `Typography.tsx:4` `variants` → `CONFIG_BY_TYPOGRAPHY_VARIANT`, `:20` `colorMap` → `CLASSES_BY_TYPOGRAPHY_COLOR` (the derived `TypographyVariants` and `Color` types follow the new names). Every use site renames with them.
   Check: `rg -n "\b(variantClasses|sizeClasses|rowLookClasses|rowIconClasses|colorMap)\b|\bvariants\[" packages/ui/src` prints nothing; `vp run check` and `vp run test` pass.

7. (packages/ui) Key the toast map by its union.
   Files: `packages/ui/src/components/Toast.tsx`
   Change: declare `export type ToastVariant = 'default' | 'success' | 'error' | 'warning';` beside `ToastItem`, type `ToastItem.variant?: ToastVariant` (`:18`), and type the map (`:7`) `const CLASSES_BY_TOAST_VARIANT: Record<ToastVariant, string> = {…}` (was `variantClasses: Record<string, string>`, R6). The lookup at `:41` reads `CLASSES_BY_TOAST_VARIANT[t.variant ?? 'default']` (the inline `??` default stays, variant-unions R3).
   Check: `rg -n "Record<string, string>" packages/ui/src` prints nothing; `vp run check` and `vp run test` pass.

8. (packages/ui) Replace per-variant ternaries with maps.
   Files: `packages/ui/src/components/ListItemHeader.tsx`, `packages/ui/src/components/Card.tsx`, `packages/ui/src/components/ActionTile.tsx`
   Change:
   - `ListItemHeader.tsx`: declare `type ListItemHeaderVariant = 'primary' | 'secondary';` (`variant: ListItemHeaderVariant` in the props) and three maps keyed by it — `GAP_CLASS_BY_LIST_ITEM_HEADER_VARIANT = { primary: 'gap-2', secondary: 'gap-3' }`, `AVATAR_CLASS_BY_LIST_ITEM_HEADER_VARIANT = { primary: '', secondary: 'size-[30px]' }`, `TYPOGRAPHY_BY_LIST_ITEM_HEADER_VARIANT = { primary: { variant: 'title', as: 'h4' }, secondary: { variant: 'body1', as: 'span' } }` (each `Record<ListItemHeaderVariant, …>`). Replace `isPrimary && 'gap-2', !isPrimary && 'gap-3'` (`:21-22`) with the gap map in the same position of the `cn(…)` list, `!isPrimary && 'size-[30px]'` (`:27`) with the avatar map (`cn` drops the empty string, so the class attribute is unchanged), and the two ternaries at `:34-35` with the typography map; delete `isPrimary` (`:15`).
   - `Card.tsx:34` `variant === 'compact' ? 'p-2' : 'p-4'` → `PADDING_CLASS_BY_CARD_VARIANT[variant]` with `{ default: 'p-4', compact: 'p-2' }`.
   - `ActionTile.tsx:52` `props.look === 'hint' ? 'textTertiary' : 'textSecondary'` → `DESCRIPTION_COLOR_BY_ROW_LOOK[props.look]` with `{ solid: 'textSecondary', dashed: 'textSecondary', accent: 'textSecondary', hint: 'textTertiary' }`.
   Check: `rg -n "isPrimary|=== 'compact'|=== 'hint'" packages/ui/src` prints nothing; `vp run check` and `vp run test` pass; `vp run e2e` passes.

9. (packages/ui) Drop the casts in `Typography`.
   Files: `packages/ui/src/components/Typography.tsx`
   Change: `:55` `props.color ?? (config.defaultColor as Color)` → `props.color ?? config.defaultColor` (`defaultColor` is already a `Color` key); `:56` `const Component = (props.as ?? config.element) as ElementType;` → `const Component: ElementType = props.as ?? config.element;` (R7: annotate, do not assert).
   Check: `rg -n " as (Color|ElementType)" packages/ui/src` prints nothing; `vp run check` and `vp run test` pass.

### packages/engine

Items 10–17 work in `packages/engine`. Names are the ones in force after the boolean, behavioural-constants and comments plans (`grid.breaks`, `isCoveredByRecords`, `EFFORT_HR_SHIFT_SEC`, `RESTING_JOULES_PER_KG_SEC`, `thresholdPaceSecPerKm`); signatures are still positional — the signature-parameter-shape plan converts them later. Every converted function returns the same value for every input: no arithmetic is reordered, and the order in which sums accumulate is kept.

10. (packages/engine) Pin today's outputs before touching any branch.
   Files: new `packages/engine/tests/pinnedOutputs.spec.ts` (temporary, deleted by item 17)
   Change: the spec builds one deterministic session — 4,000 records with `timestamp: i`, `hr: Math.round(140 + 25 * Math.sin(i / 97))`, `power: Math.round(220 + 90 * Math.sin(i / 53))`, `cadence: 85`, `speed: 3 + Math.sin(i / 71)`, `distance` the running sum of `speed`, `elevation: 100 + 20 * Math.sin(i / 300)`, `lat: 48 + i * 1e-5`, `lng: 8.4 + 1e-3 * Math.sin(i / 200)`, leaving out the records of seconds 1200–1259 to make a pause — and, inside one `describe('pinned engine outputs', …)`, one case per call below, each asserting `expect(…).toMatchInlineSnapshot()`: `predictRaceTimes(5000, 1200)` and `predictRaceTimes(42195, 9000)`; `estimateSessionEnergy` for `'cycling'` and `'running'` with `{ weightKg: 70, age: 40, gender: 'male' }`, `{ weightKg: 60, age: 30, gender: 'female' }` and `{}`, passing `windowedGradients(records)`; `aerobicDecoupling` for both sports; `detectEfforts` for `'cycling'` with `{ restHr: 50, maxHr: 190, ftp: 250 }` and for `'running'` with `{ restHr: 50, maxHr: 190, thresholdPaceSecPerKm: 300 }`; `computeWindExposure(records, [{ timeMs: 0, directionDegrees: 90 }, { timeMs: 2_000_000, directionDegrees: 270 }], 0)`; `deriveSessionFieldsFromRecords` for both sports; `calculateSessionStress` for both sports and both genders with `{ restHr: 50, maxHr: 190, ftp: 250, gender }` and summary `{ durationSec: 4000 }`; `calculateTrainingEffect` for both genders at CTL 40; `detectClimbs` for both sports with `windowedGradients(records)`. Fill the snapshots once, before any other item, with `vp test -- --run -u tests/pinnedOutputs.spec.ts` from `packages/engine`; never pass `-u` again in this plan.
   Check: the spec passes without `-u` and its inline snapshots are filled.

11. (packages/engine) Derive `RaceDistance` from a runtime list and build the race predictions without casts (R1, R7, R9).
   Files: `packages/engine/src/types.ts`, `packages/engine/src/vdot.ts`, `packages/engine/tests/vdot.spec.ts`, `apps/web/src/features/labs/RacePredictor.tsx`, `apps/web/src/features/labs/hooks/useRacePredictor.ts`, `apps/web/src/features/settings/PaceEstimatorDialog.tsx`
   Change: `types.ts:23` becomes `export const RACE_DISTANCES = ['5k', '10k', 'half-marathon', 'marathon'] as const;` and `export type RaceDistance = (typeof RACE_DISTANCES)[number];`. `RACE_DISTANCE_METERS` (`vdot.ts:9`) → `METERS_BY_RACE_DISTANCE`, with its four app and spec readers. `predictRaceTimes` (`vdot.ts:103-121`) stops casting (`:111`, `:113`):

   ```ts
   interface RacePrediction {
     timeSeconds: number;
     paceSecPerKm: number;
   }

   const predictionFor = (vdot: number, distance: RaceDistance): RacePrediction | undefined => {
     const meters = METERS_BY_RACE_DISTANCE[distance];
     const predicted = predictRaceTime(vdot, meters);
     if (predicted === undefined) return undefined;
     return { timeSeconds: predicted, paceSecPerKm: predicted / (meters / 1000) };
   };

   export const predictRaceTimes = (
     distanceMeters: number,
     timeSeconds: number,
   ): Record<RaceDistance, RacePrediction> | undefined => {
     const timeMinutes = timeSeconds / 60;
     const vdot = calculateVdot(distanceMeters, timeMinutes);
     if (!isFinite(vdot) || vdot <= 0) return undefined;
     const fiveK = predictionFor(vdot, '5k');
     const tenK = predictionFor(vdot, '10k');
     const halfMarathon = predictionFor(vdot, 'half-marathon');
     const marathon = predictionFor(vdot, 'marathon');
     if (!fiveK || !tenK || !halfMarathon || !marathon) return undefined;
     return { '5k': fiveK, '10k': tenK, 'half-marathon': halfMarathon, marathon };
   };
   ```

   `predictRaceTime` has no side effects, so computing all four before the check returns what the old early return did, in the same key order. `RacePredictor.tsx:23` `Object.keys(RACE_DISTANCE_METERS) as RaceDistance[]` → `RACE_DISTANCES` imported from `@pacevault/engine/types.ts` (same order).
   Check: `rg -n "as RaceDistance\[\]|as Record<RaceDistance|RACE_DISTANCE_METERS" apps/web/src packages/engine` prints nothing; the pinned spec passes; `vp run check` clean; `vp run test` green.

12. (packages/engine) Index the Banister coefficients by gender (R2, R4, R9).
   Files: `packages/engine/src/stress.ts`, `packages/engine/src/trainingEffect.ts`
   Change: `BANISTER` (`stress.ts:44-47`, `as const`) → `export const BANISTER_BY_GENDER: Record<Gender, BanisterCoefficients> = { male: { a: 0.64, b: 1.92 }, female: { a: 0.86, b: 1.67 } };` with a module-local `interface BanisterCoefficients { a: number; b: number }` that also types `impulsePerMinute`'s `coeff` (`:71`). Delete `banisterFor` (`:63-66`) and read `BANISTER_BY_GENDER[thresholds.gender]` / `BANISTER_BY_GENDER[gender]` at its three calls (`:102`, `:127`, `:186`). In `trainingEffect.ts:132-136` the `let banisterKey … if (thresholds.gender === 'female')` block becomes `const coeff = BANISTER_BY_GENDER[thresholds.gender];` (`gender` is the persisted `z.enum(['male', 'female'])`, so the two forms agree on every value the app can hold).
   Check: `rg -n "banisterFor|banisterKey|\bBANISTER\b" packages/engine/src` prints nothing; the pinned spec passes; `vp run check` clean; `vp run test` green.

13. (packages/engine) Turn the energy-method branches into exhaustive switches (R3, R9).
   Files: `packages/engine/src/energy.ts`
   Change: `ENERGY_UNCERTAINTY` → `UNCERTAINTY_BY_ENERGY_METHOD` and `KEYTEL_COEFFICIENTS` → `KEYTEL_COEFFICIENTS_BY_GENDER`. `isCoveredByRecords` (`:58-68`) becomes `switch (method) { case 'power': return current.power !== undefined; case 'heartRate': return current.hr !== undefined; case 'running': if (previous.distance === undefined || current.distance === undefined) return false; return current.distance - previous.distance >= 0 && gradient !== undefined; }`. `missingBody` (`:70-77`) becomes `switch (method) { case 'power': return undefined; case 'running': if (body.weightKg === undefined) return 'weight'; return undefined; case 'heartRate': if (body.weightKg === undefined && body.age === undefined) return 'weightAndAge'; if (body.weightKg === undefined) return 'weight'; if (body.age === undefined) return 'age'; return undefined; }` (the old `needsAge` was true only for heart rate). `intervalJoules` (`:84-110`) keeps the `dt` guard and dispatches:

   ```ts
   const runningJoules = (
     previous: SessionRecord,
     current: SessionRecord,
     gradient: number | undefined,
     body: EnergyBody,
     dt: number,
   ): number | null => {
     const weightKg = body.weightKg;
     if (weightKg === undefined) return null;
     if (previous.distance === undefined || current.distance === undefined) return null;
     if (gradient === undefined) return null;
     const dx = current.distance - previous.distance;
     if (dx < 0) return null;
     const factor = gradeAdjustedPaceFactor(gradient);
     return weightKg * (RUNNING_NET_COST_JOULES_PER_KG_METER * dx * factor + RESTING_JOULES_PER_KG_SEC * dt);
   };

   const heartRateJoules = (current: SessionRecord, body: EnergyBody, dt: number): number | null => {
     const weightKg = body.weightKg;
     if (weightKg === undefined) return null;
     if (body.age === undefined || body.gender === undefined || current.hr === undefined) return null;
     const keytel = (keytelKjPerMin(current.hr, weightKg, body.age, body.gender) * 1000 * dt) / 60;
     return Math.max(keytel, weightKg * RESTING_JOULES_PER_KG_SEC * dt);
   };

   const intervalJoules = (
     method: EnergyMethod,
     previous: SessionRecord,
     current: SessionRecord,
     gradient: number | undefined,
     body: EnergyBody,
   ): number | null => {
     const dt = activeSeconds(previous, current);
     if (dt === 0) return null;
     switch (method) {
       case 'power':
         if (current.power === undefined) return null;
         return (current.power * dt) / CYCLING_GROSS_EFFICIENCY;
       case 'running':
         return runningJoules(previous, current, gradient, body, dt);
       case 'heartRate':
         return heartRateJoules(current, body, dt);
     }
   };
   ```

   Check: `rg -n "needsAge|if \(method ===" packages/engine/src/energy.ts` prints nothing; the pinned spec passes; `vp run check` clean; `vp run test` green.

14. (packages/engine) Turn the effort-signal branches into exhaustive switches (R3, R9).
   Files: `packages/engine/src/effortDetection.ts`
   Change: `EFFORT_SIGNAL_DEFAULTS` → `DEFAULTS_BY_EFFORT_SIGNAL`, `EFFORT_SIGNAL_ORDER` → `EFFORT_SIGNALS_BY_SPORT`, `EFFORT_SIGNAL_LIMITERS` → `LIMITER_BY_EFFORT_SIGNAL` (still `Partial<…>`, R6). The loop body of `signalSeries` (`:204-211`) moves into

   ```ts
   const signalValueAt = (
     grid: Grid,
     signal: EffortSignal,
     gradeFactor: (second: number) => number,
     second: number,
   ): number => {
     switch (signal) {
       case 'power':
         return valueOrNaN(grid.power[second]);
       case 'pace':
         return valueOrNaN(grid.speed[second]) * gradeFactor(second);
       case 'hr': {
         const shifted = second + EFFORT_HR_SHIFT_SEC;
         if (shifted < grid.length && grid.breaks[shifted] === 0) return valueOrNaN(grid.hr[shifted]);
         return NaN;
       }
     }
   };
   ```

   and the loop keeps `if (grid.breaks[i] === 1) continue;` then assigns `x[i] = signalValueAt(grid, signal, gradeFactor, i);` (the old code left the `NaN` fill in place where this returns `NaN`). `referenceOf` (`:650-665`) becomes `switch (signal) { case 'power': … ; case 'pace': … ; case 'hr': return thresholds.restHr + factor * (thresholds.maxHr - thresholds.restHr); }`, each arm's body unchanged, the `@see [Karvonen1957]` tag on the `hr` arm.
   Check: `rg -n "signal === '|else if \(signal" packages/engine/src/effortDetection.ts` prints nothing; the pinned spec passes; `vp run check` clean; `vp run test` green.

15. (packages/engine) Replace the remaining union branches with a map or a switch (R2, R3, R9).
   Files: `packages/engine/src/windExposure.ts`, `packages/engine/src/decoupling.ts`, `packages/engine/src/sessionDerivation.ts`, `packages/engine/src/climbs.ts`
   Change: in `computeWindExposure` (`windExposure.ts:174-186`) the three `let …Sec` and the `if/else if/else` tally become `const secondsByWindClass: Record<WindClass, number> = { head: 0, cross: 0, tail: 0 };` with `secondsByWindClass[segment.windClass] += segment.seconds;` in the loop, then `const headSec = secondsByWindClass.head;` (and `crossSec`, `tailSec`) before the unchanged percentages and drift block. In `decoupling.ts` the sport branch of `aerobicDecoupling` (`:103-111`) moves into `const sportIntervals = (records: SessionRecord[], sport: Sport, gradients: Array<number | undefined>): { ratio: DecouplingRatio; intervals: CountedInterval[] } => { switch (sport) { case 'cycling': return { ratio: 'powerHr', intervals: rideIntervals(records) }; case 'running': return runIntervals(records, gradients); } };`, read once into a `const` whose `ratio` and `intervals` the rest of the function uses. In `sessionDerivation.ts` the `let gap … if (sport === 'running')` block (`:73-76`) becomes `const gradeAdjustedPaceFor = (sport: Sport, records: SessionRecord[]): number | undefined => { switch (sport) { case 'running': return calculateGAP(records); case 'cycling': return undefined; } };` read as `gap: gradeAdjustedPaceFor(sport, records),` in the same key position. `CLIMB_RULES` (`climbs.ts:20`) → `CLIMB_RULES_BY_SPORT`.
   Check: `rg -n "windClass === '|sport === '(running|cycling)'" packages/engine/src` prints nothing; the pinned spec passes; `vp run check` clean; `vp run test` green.

16. (packages/engine) Write the map naming into the engine rules.
   Files: `packages/engine/CLAUDE.md`
   Change: in the **Constants** bullet, the closing sentence about lookup tables is replaced by:

   ```md
   Lookup tables keyed by a closed union are a `Record<Union, T>` named `<VALUE>_BY_<KEY>` (`METERS_BY_RACE_DISTANCE`) and indexed without fallback; per-member behaviour is a `switch` with no `default`.
   ```

   Check: `rg -n "_BY_<KEY>" packages/engine/CLAUDE.md` prints one line.

17. (packages/engine) Delete the pinned spec.
   Files: `packages/engine/tests/pinnedOutputs.spec.ts`
   Change: delete the file once items 11–15 pass against it.
   Check: `test ! -e packages/engine/tests/pinnedOutputs.spec.ts`; `vp run test` green.

### packages/testing

18. (packages/testing) Map the invalid-record scenarios by kind (R2, R4, R9).
   Files: `packages/testing/src/records.ts`
   Change: the `switch (type)` of `makeInvalidRecords` (`records.ts:340-366`) only chooses the `hr` and `power` each record carries, a value per member. It becomes a map above the function and a spread in the loop; each entry keeps the key order its `case` assigned, so every record is identical, key order included:

   ```ts
   type InvalidRecordKind = 'highHr' | 'highPower' | 'zeroHr';

   const FIELDS_BY_INVALID_RECORD_KIND: Record<InvalidRecordKind, Pick<SessionRecord, 'hr' | 'power'>> = {
     highHr: { hr: 240, power: 200 },
     highPower: { power: 3000, hr: 150 },
     zeroHr: { hr: 0, power: 200 },
   };

   export const makeInvalidRecords = (kind: InvalidRecordKind): SessionRecord[] => {
     const count = 20;
     const records: SessionRecord[] = [];
     for (let i = 0; i < count; i++) {
       records.push({ timestamp: i, ...FIELDS_BY_INVALID_RECORD_KIND[kind] });
     }
     return records;
   };
   ```

   The callers (`apps/web/tests/lib/validation.spec.ts:29,53,59`, `apps/web/tests/packages/engine/stressPipeline.integration.test.ts:71`) pass the same strings and stay. This plan runs before test-data-from-mock-factories moves the function into `series.ts` as `invalidRecordSeries`; the map and type move with it.
   Check: `rg -n "switch \(type\)|base\.(hr|power)" packages/testing/src` prints nothing; `vp test -- --run` from `apps/web/` passes with the same count.

### tools/docs

Line numbers are today's; the behavioural-constants plan runs before this one and has already renamed `FILTER_READINGS` → `FILTER_READING_COUNT`, `EN_FILTER` → `EN_TYPED_FILTER`, `DE_FILTER` → `DE_TYPED_FILTER` and added `BACKDROP_FILE`, so find each line by its text. The component-declaration-shape plan may or may not have run yet: where an item changes a component's props, edit them where they are declared (the inline object type today, the `<Name>Props` interface once that plan ran). For these items "green" means `vp check` from `tools/docs/` is clean.

**Banner check** (items 19–22): before the item run `vp run docs:banner --locale de` and `vp run docs:banner --locale en` and copy `docs/banners/de_banner.png` and `docs/banners/en_banner.png` into a directory outside the repo; after it run both again and compare with `uv run --no-project --with pillow python -c "import sys;from PIL import Image,ImageChops;[print(n,ImageChops.difference(Image.open(f'{sys.argv[1]}/{n}_banner.png').convert('RGBA'),Image.open(f'docs/banners/{n}_banner.png').convert('RGBA')).getbbox()) for n in ('de','en')]" <that-directory>`, which must print `de None` and `en None`.

19. (tools/docs) Write the filter subtitle into each locale's copy and name the copy table for its key (R2, R9).
   Files: `tools/docs/banner/tiles.ts`, `tools/docs/banner/capture.ts`, `tools/docs/banner/page/Banner.tsx`
   Change: `filterReadings` (`tiles.ts:30-33`) branches on the locale for a value the locale's own entry can hold. Delete it and write each string where it is read, with the same characters: in the `en` entry `filter: { title: 'Just type it', subtitle: \`“${EN_TYPED_FILTER}” → ${FILTER_READING_COUNT} readings\` }`, in the `de` entry `filter: { title: 'Einfach eintippen', subtitle: \`„${DE_TYPED_FILTER}“ → ${FILTER_READING_COUNT} Lesarten\` }`. Rename `BANNER_TEXT` (`tiles.ts:38`) → `BANNER_TEXT_BY_LOCALE`, with its readers `capture.ts:534` (`BANNER_TEXT_BY_LOCALE[LOCALE].typedFilter`) and `Banner.tsx:8,21`.
   Check: `rg -n "filterReadings|\bBANNER_TEXT\b" tools/docs/banner` prints nothing; green; banner check passes.

20. (tools/docs) Type the browser locale map by the banner locale (R4, R9).
   Files: `tools/docs/playwright.config.ts`
   Change: `const BROWSER_LOCALES = { de: 'de-DE', en: 'en-US' } as const;` (`:12`) carries neither an annotation nor a `satisfies`, so a third banner locale would compile without a browser locale. It becomes `const BROWSER_LOCALE_BY_BANNER_LOCALE = { de: 'de-DE', en: 'en-US' } satisfies Record<BannerLocale, string>;` with `import type { BannerLocale } from './banner/tiles.ts';` (or `./banner/locales.ts` if the helpers-group plan already split `tiles.ts`); the reader `locale: BROWSER_LOCALES[readmeLocale()]` (`:26`) becomes `BROWSER_LOCALE_BY_BANNER_LOCALE[readmeLocale()]` (under whatever name the locale reader has when this item runs).
   Check: `rg -n "BROWSER_LOCALES\b" tools/docs` prints nothing; green; banner check passes.

21. (tools/docs) Map the shot fit to its classes (R2, R4, R9).
   Files: `tools/docs/banner/page/Banner.tsx`
   Change: `Shot` picks its object-fit classes with `props.fit === 'cover' && 'object-cover object-top', props.fit === 'contain' && 'object-contain object-center'` (`:60-61`). Add above `Shot`:

   ```tsx
   const CLASSES_BY_SHOT_FIT: Record<'cover' | 'contain', string> = {
     cover: 'object-cover object-top',
     contain: 'object-contain object-center',
   };
   ```

   and write the `<img>` class as `className={cn('block size-full', CLASSES_BY_SHOT_FIT[props.fit])}`; the class attribute keeps the same text (`block size-full object-cover object-top` / `block size-full object-contain object-center`). The variant-unions plan names the key union `ShotFit` afterwards.
   Check: `rg -n "props\.fit ===" tools/docs/banner/page` prints nothing; green; banner check passes.

22. (tools/docs) Derive the flow and tile keys from runtime lists and key the frames and shots by them (R1, R2, R4, R9).
   Files: `tools/docs/banner/tiles.ts`, `tools/docs/banner/page/Banner.tsx`
   Change: `type FlowKey = 'heatmap' | 'laps';` and `type TileKey = …` (`tiles.ts:8-9`) are written by hand beside the lists `BANNER_FLOWS` and `BANNER_TILES` (`:89-113`) that repeat each key as a `key` field. In `tiles.ts`:

   ```ts
   export const FLOW_KEYS = ['heatmap', 'laps'] as const;
   export type FlowKey = (typeof FLOW_KEYS)[number];
   export const TILE_KEYS = ['summary', 'weatherDetails', 'studio', 'splits', 'filter'] as const;
   export type TileKey = (typeof TILE_KEYS)[number];

   export const FRAMES_BY_FLOW: Record<FlowKey, BannerFrame[]> = {
     heatmap: [{ file: '1a-heatmap-locate.png' }, { file: BACKDROP_FILE, below: '1b-heatmap-export.png' }],
     laps: [{ file: '2a-laps-hr.png' }, { file: '2b-laps-tap.png' }, { file: '2c-laps-stats.png' }],
   };

   export const SHOT_FILE_BY_TILE: Record<TileKey, string> = {
     summary: 'summary.png',
     weatherDetails: 'weather-details.png',
     studio: 'studio.png',
     splits: 'splits.png',
     filter: 'filter.png',
   };
   ```

   The lists keep today's order. Delete `BannerFlow`, `BannerTile`, `BANNER_FLOWS` and `BANNER_TILES`; `BannerFrame` stays. In `Banner.tsx`: `FlowCard` takes `flowKey: FlowKey` instead of `flow: BannerFlow` and reads `text.flows[props.flowKey]` and `FRAMES_BY_FLOW[props.flowKey].map(…)`; `Tile` takes `tileKey: TileKey` instead of `tile: BannerTile` and reads `SHOT_FILE_BY_TILE[props.tileKey]` and `text.tiles[props.tileKey]`; `Banner` renders `{FLOW_KEYS.map((flowKey, index) => <FlowCard key={flowKey} flowKey={flowKey} index={index} />)}` and `{TILE_KEYS.map((tileKey) => <Tile key={tileKey} tileKey={tileKey} />)}`. The React keys are the same strings as before, so the rendered tree is the same.
   Check: `rg -n "BANNER_FLOWS|BANNER_TILES|BannerFlow\b|BannerTile\b|type (FlowKey|TileKey) = '" tools/docs/banner` prints nothing; green; banner check passes.

### tools/workbench

Line numbers are today's; where an earlier plan already edited a module, find the line by its text. Only names, annotations and the shape of two literal tables change; every label, colour, icon, class string and the drawing order stay as they are.

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

23. (tools/workbench) Name the board's maps for both sides of the mapping (R4, R9).
   Files: `tools/workbench/site/src/lib/vocabulary.ts`, `tools/workbench/site/src/lib/board.ts`, `tools/workbench/site/src/app/{Columns,ItemPanel,NeedsYou,WriteCard}.tsx`, `tools/workbench/site/src/app/icons.tsx`, `tools/workbench/scripts/changedFiles.ts`, `tools/workbench/tests/site/src/actions/index.writes.spec.ts` (`tools/workbench/tests/board.spec.ts` if the mirrored-spec plan has not run), `tools/workbench/README.md`
   Change: rename, at the declaration and every reader:
   - `vocabulary.ts`: `LABELS` → `LABEL_BY_BUCKET`, `TYPE_COLOR` → `COLOR_BY_ITEM_TYPE`, `SLOT_LABEL` → `LABEL_BY_SLOT`, `REASON_LABEL` → `LABEL_BY_REASON`, `REASON_TAB` → `SLOT_BY_REASON` (readers `Columns.tsx`, `ItemPanel.tsx`, `NeedsYou.tsx`, `icons.tsx`, the spec).
   - `ItemPanel.tsx:19` `SLOT_MISSING` → `MISSING_TITLE_BY_SLOT`; `icons.tsx:29` `SHAPES` → `SHAPE_BY_BUCKET`, `:57` `TYPE_ICON` → `ICON_BY_ITEM_TYPE`; `WriteCard.tsx:48` `LINE_CLASS` → `CLASSES_BY_LINE_KIND`; `changedFiles.ts:56` `STATUS` → `FILE_STATUS_BY_GIT_CODE` (stays a `Map`, read with `.get`).
   - `board.ts`: declare `type FileChip = 'A' | 'M' | 'D';` above `FileRow` and type `FileRow.chip` as `FileChip | undefined`; `CHIP_TITLES` (`:475`, `{ … } as const`) → `const TITLE_BY_CHIP: Record<FileChip, string> = { A: 'added', M: 'modified', D: 'deleted' };`; `STATUS_CHIPS` (`:477`) → `const CHIP_BY_FILE_STATUS = { added: 'A', modified: 'M', deleted: 'D' } satisfies Record<'added' | 'modified' | 'deleted', FileChip>;` (its literal values feed `FileRow.chip`), with `keyof typeof STATUS_CHIPS` at `:573` → `keyof typeof CHIP_BY_FILE_STATUS`.
   - `README.md` (§ Item files, `plan.md` frontmatter bullet): "`TYPE_COLOR` in `site/src/lib/vocabulary.ts`" → "`COLOR_BY_ITEM_TYPE` in `site/src/lib/vocabulary.ts`".
   Check: `rg -nw "LABELS|TYPE_COLOR|SLOT_LABEL|REASON_LABEL|REASON_TAB|SLOT_MISSING|SHAPES|TYPE_ICON|LINE_CLASS|CHIP_TITLES|STATUS_CHIPS|STATUS" tools/workbench/site tools/workbench/scripts tools/workbench/tests tools/workbench/README.md` prints nothing; workbench check; board check; suite.

24. (tools/workbench) Derive the item areas and the graph layers from their runtime lists (R1, R6, R8).
   Files: `tools/workbench/scripts/frontmatter.ts`, `tools/workbench/scripts/deps.ts`
   Change:
   - `frontmatter.ts` gains `export type Area = (typeof AREAS)[number];` directly under `AREAS` (`:46-57`).
   - `deps.ts:62` `type Layer = 'engine' | 'lib' | 'store' | 'feature' | 'ui' | 'page' | 'other';` → `const LAYERS = ['page', 'ui', 'feature', 'store', 'lib', 'engine', 'other'] as const;` and `type Layer = (typeof LAYERS)[number];` — the array in today's drawing order of `LAYER_TITLES`. `LAYER_TITLES` (`:168-176`, an ordered list of `{ layer, title }` pairs) is split per axis into that list and `const TITLE_BY_LAYER: Record<Layer, string> = { page: 'pages', ui: 'components', feature: 'features', store: 'store', lib: 'lib', engine: 'engine', other: 'other' };`; the loop `for (const entry of LAYER_TITLES)` (`:263`) becomes `for (const layer of LAYERS)` and reads `layer` and `TITLE_BY_LAYER[layer]` where it read `entry.layer` and `entry.title`.
   - `AREA_ROOTS: Record<string, string[]>` (`:399`) → `const ROOTS_BY_AREA: Partial<Record<Area, string[]>>` (`repo` and `skills` have no code folder, so the map is partial in its type, not by a widened key); `cruiseRoots`'s `areas` parameter becomes `Area[]` and `areasOf` (`:501`) returns `Area[]` (the schema already types `areas` that way); the lookup `ROOTS_BY_AREA[area] ?? []` stays.
   Check: `rg -n "Record<string, string\[\]>|LAYER_TITLES|AREA_ROOTS" tools/workbench/scripts` prints nothing; `vp test -- --run` from `tools/workbench/` passes 66 tests (`deps.spec.ts` checks the layer order through its label lines); workbench check.

## Open items

- `errorMessage` in `apps/web/src/features/intervals/IntervalsConnectionForm.tsx:28-33` becomes the exhaustive `MESSAGE_BY_INTERVALS_ERROR` map in the domain-error-subclasses plan, not here: the map may only be indexed once that plan has typed the code as `IntervalsRequestFailedError.code`, and that plan runs after this one (it depends on this plan).
- R9 naming (`VALUE_BY_KEY`) is applied to every map this plan creates or edits; the many existing maps outside these items keep their names until they are next touched.
- Engine code is covered by items 10–17. `RunningZoneName`, `EnergyMethod` and `EffortSignal` have no separate runtime list (their maps are keyed records, not lists), so R1 leaves them as type aliases. Item 10's pinned spec uses inline snapshots, which R7 of the assertion-vocabulary convention does not allow in a delivered spec; it is scaffolding that item 17 deletes.
- R1 is applied to unions that have, or are checked against, a runtime list. Closed unions declared only as types with no runtime counterpart (`PBCategory`, `WeatherCondition`, `MapCameraFit`, …) stay type aliases; a later plan can convert them if a runtime list is ever needed.
- `tools/docs`: `FlowCard`'s `fill && 'flex-1', !fill && 'flex-none'` (`Banner.tsx:96`, `:113-114`) branches on a boolean, not on a union, and stays. R3 has no subject in the tool (no per-member behaviour).
- `effortName` in `apps/web/src/features/sessions/session/lapLabels.ts:151-169` branches on `LapAnalysis.intensity`, which is typed `string` (an open FIT value), so neither form is exhaustive there; it stays a conditional chain.
- `tools/workbench`: `FILE_STATUS_BY_GIT_CODE` stays a `Map` keyed by git's status letters, which have no union in the code; a miss is the documented skip of an unknown status.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
