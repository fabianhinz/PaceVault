---
id: colocated-types-module
tdr_reference: tdr/colocated-types-module.md
depends_on: [index-modules-are-not-barrels, exhaustive-record-maps-over-branching]
generated: 2026-10-23
---

# A directory's shared vocabulary lives in a colocated types.ts

Read `tdr/colocated-types-module.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`index-modules-are-not-barrels`](index-modules-are-not-barrels.md) — moves src/types/index.ts to src/types.ts first, so this plan's types moves start from the final layout
- [`exhaustive-record-maps-over-branching`](exhaustive-record-maps-over-branching.md) — adds `RACE_DISTANCES` and the Banister record to the engine modules items 9–11 edit, so the engine's `types.ts` is moved into once, from settled text

## Changes

Run every item from the repo root. "Clean `vp check`" means `vp run -F @pacevault/i18n compile && vp check` finishes with no error.

1. Turn `apps/web/src/features/map/hooks/types.ts` into a leaf with no behaviour.
   Files: `apps/web/src/features/map/hooks/types.ts`, `apps/web/src/features/map/trackPicking.ts`, `apps/web/src/features/map/hooks/useMapTracks.ts`, `apps/web/src/features/map/hooks/useMapPopupState.ts`, `apps/web/src/features/map/hooks/useOverviewMapControlsEffect.ts`, `apps/web/src/features/map/hooks/useMapCameraEffect.ts`, `apps/web/src/features/map/DeckGLOverlay.tsx`, `apps/web/src/features/studio/hooks/useStudioRoutesPopup.ts`
   Change: Today `hooks/types.ts` holds a function with a module-level cache (`decodeCached`, `pathCache`, lines 6-15), a constant (`PICK_RADIUS`, line 4) and imports a sibling implementation (`import type { MapTrack } from './useMapTracks'`, line 2). Move `PICK_RADIUS`, `pathCache` and `decodeCached` (with its `decodeTrackForRendering` import from `@pacevault/engine/gps.ts`) into `apps/web/src/features/map/trackPicking.ts`, the track-picking topic module, as exports beside `pickBoundsFromCorners`. Move `export interface MapTrack { sessionId; sport; gps; session }` from `hooks/useMapTracks.ts:10-15` into `hooks/types.ts`, importing `Sport`, `SessionGPS`, `TrainingSession` as types from `@pacevault/engine/types.ts`. `TrackPickData` (`hooks/types.ts:17-21`) stays in `hooks/types.ts` only if two or more modules read it when you execute this item; if `apps/web/src/features/map/DeckGLOverlay.tsx` is still its only reader, move it into that module as a non-exported interface. Repoint imports: `decodeCached`/`PICK_RADIUS` in `hooks/useMapPopupState.ts:8`, `DeckGLOverlay.tsx:34` and `features/studio/hooks/useStudioRoutesPopup.ts:6` now come from `@/features/map/trackPicking.ts`; `MapTrack` in `hooks/useOverviewMapControlsEffect.ts:3`, `hooks/useMapCameraEffect.ts:19`, `hooks/useMapPopupState.ts:6`, `DeckGLOverlay.tsx:33` and `hooks/useMapTracks.ts` comes from `./types.ts` (same folder) or `@/features/map/hooks/types.ts` (other folders).
   Check: `rg -n "^import" apps/web/src/features/map/hooks/types.ts` prints only `@pacevault/*` type imports; `rg -n "^export const|=>" apps/web/src/features/map/hooks/types.ts` prints nothing; clean `vp check`.

2. Give the onboarding feature its vocabulary module.
   Files: `apps/web/src/features/onboarding/types.ts` (new), `apps/web/src/features/onboarding/OnboardingStep.tsx`, `apps/web/src/features/onboarding/OnboardingIntro.tsx`
   Change: Move `export type OnboardingShell = 'card' | 'dialog';` from `OnboardingStep.tsx:40` into the new `features/onboarding/types.ts`. `OnboardingIntro.tsx:9` becomes `import { OnboardingHeading } from './OnboardingStep.tsx';` plus `import type { OnboardingShell } from './types.ts';` (if `OnboardingHeading` has already been moved to its own module by the unit-length plan, import it from there). `OnboardingStep.tsx` imports the type from `./types.ts`.
   Check: `rg -n "OnboardingShell" apps/web/src` shows one `export type` line, in `features/onboarding/types.ts`; clean `vp check`.

3. Give the intervals feature its vocabulary module.
   Files: `apps/web/src/features/intervals/types.ts` (new), `apps/web/src/features/intervals/IntervalsStatusLine.tsx`, `apps/web/src/features/intervals/IntervalsConnectionForm.tsx`
   Change: Move the union `export type IntervalsKeyCheck = | { kind: 'checking' } | { kind: 'valid' } | { kind: 'rejected' } | { kind: 'failed'; message: string };` from `IntervalsStatusLine.tsx:8-12` into the new `features/intervals/types.ts`. `IntervalsConnectionForm.tsx:17` becomes `import { IntervalsStatusLine } from './IntervalsStatusLine.tsx';` plus `import type { IntervalsKeyCheck } from './types.ts';`; `IntervalsStatusLine.tsx` imports the type from `./types.ts`.
   Check: `rg -n "type IntervalsKeyCheck" apps/web/src` shows only `features/intervals/types.ts`; clean `vp check`.

4. Lift the studio pick-popup shapes out of a component and a hook.
   Files: `apps/web/src/features/studio/types.ts` (new), `apps/web/src/features/studio/markers/StudioTrackPickPopup.tsx`, `apps/web/src/features/studio/hooks/useStudioRoutesPopup.ts`, `apps/web/src/features/studio/hooks/useStudioMapPopup.ts`, `apps/web/src/features/studio/markers/StudioRoutesPickPopup.tsx`
   Change: Move `export interface StudioTrackPickInfo { x; y; routeId; distanceM }` (`markers/StudioTrackPickPopup.tsx:13-18`) and `export interface StudioRoutesPopupInfo` (`hooks/useStudioRoutesPopup.ts:8`, with whatever types it references) into the new `features/studio/types.ts`; its readers sit in two sub-directories (`hooks/`, `markers/`), so the file lives in their common feature directory. Repoint `hooks/useStudioMapPopup.ts:6`, `markers/StudioRoutesPickPopup.tsx:4` and both declaring modules to `import type { … } from '@/features/studio/types.ts'`.
   Check: `rg -n "interface (StudioTrackPickInfo|StudioRoutesPopupInfo)" apps/web/src` shows only `features/studio/types.ts`; `rg -n "from '[^']*StudioTrackPickPopup\.tsx'" apps/web/src/features/studio/hooks` prints nothing; clean `vp check`.

5. Lift the sessions pick-popup shape out of its component.
   Files: `apps/web/src/features/sessions/types.ts` (new), `apps/web/src/features/sessions/SessionsPickPopup.tsx`, `apps/web/src/features/map/hooks/useMapPopupState.ts`
   Change: Move `export interface PopupInfo { x: number; y: number; sessions: TrainingSession[] }` from `SessionsPickPopup.tsx:7-11` into the new `features/sessions/types.ts` (type import of `TrainingSession` from `@pacevault/engine/types.ts`). `useMapPopupState.ts:7` becomes `import type { PopupInfo } from '@/features/sessions/types.ts';`.
   Check: `rg -n "from '@/features/sessions/SessionsPickPopup.tsx'" apps/web/src/features/map` prints nothing; clean `vp check`.

6. Lift the mini-rail prop shapes out of their hook.
   Files: `apps/web/src/features/sessions/session/types.ts` (new), `apps/web/src/features/sessions/session/hooks/useMiniRailHover.ts`, `apps/web/src/features/sessions/session/PeakBars.tsx`
   Change: Move `export interface MiniRailSegmentProps` (`hooks/useMiniRailHover.ts:3`) and `export interface MiniRailProps` (`hooks/useMiniRailHover.ts:8`) into the new `features/sessions/session/types.ts` (the directory of their component reader; the hook in `session/hooks/` reads them from there). `PeakBars.tsx:5` becomes `import type { MiniRailProps, MiniRailSegmentProps } from './types.ts';`; the hook imports them from `@/features/sessions/session/types.ts`.
   Check: `rg -n "interface MiniRail" apps/web/src` shows only `features/sessions/session/types.ts`; clean `vp check`.

7. Lift the thresholds-form field vocabulary out of its hook.
   Files: `apps/web/src/features/settings/hooks/types.ts` (new), `apps/web/src/features/settings/hooks/useThresholdsForm.ts`, `apps/web/src/features/onboarding/OnboardingStep.tsx`, `apps/web/src/features/intervals/IntervalsConnectionForm.tsx`, `apps/web/src/features/sessions/FitUploadButton.tsx`
   Change: Move `NumberField`, `export type TextField = NumberField | 'thresholdPace';` (`useThresholdsForm.ts:10`), `export type FormField = TextField | 'gender';` (`:12`) and `export interface ProfileGate { ready: boolean; save: () => void }` (`:245-248`) into the new `features/settings/hooks/types.ts`, all exported. `ThresholdsForm` (`:328`, `ReturnType<typeof useThresholdsForm>`) stays in the hook module because it is inferred from the hook itself. Repoint the readers of the moved names (`OnboardingStep.tsx`, `IntervalsConnectionForm.tsx`, `FitUploadButton.tsx`, the hook) to `@/features/settings/hooks/types.ts`.
   Check: `rg -n "^export (type|interface) (TextField|FormField|ProfileGate)\b" apps/web/src` shows only `features/settings/hooks/types.ts`; clean `vp check`.

8. Move the app-wide types out of the `types/` sub-directory, unless the index-modules plan already did.
   Files: `apps/web/src/types/index.ts`, `apps/web/src/types.ts` (new), every module importing `@/types/index.ts` (20 under `apps/web/src`, 7 under `apps/web/tests`)
   Change: Skip this item if `apps/web/src/types/` no longer exists. Otherwise move the file to `apps/web/src/types.ts` (contents unchanged), delete the empty `apps/web/src/types/` directory, and rewrite every `from '@/types/index.ts'` to `from '@/types.ts'`.
   Check: `test ! -e apps/web/src/types && rg -n "@/types/index" apps/web` prints nothing; clean `vp check`; `vp run test` passes.

9. (packages/engine) Move the engine types several engine modules read into `types.ts`.
   Files: `packages/engine/src/types.ts`, `packages/engine/src/datedValue.ts`, `packages/engine/src/wattsPerKg.ts`, `packages/engine/src/stress.ts`, `packages/engine/src/trainingEffect.ts`, `apps/web/src/store/user.ts`, `apps/web/src/lib/profileHistory.ts`, `apps/web/src/features/settings/ThresholdsSection.tsx`, `apps/web/src/features/settings/ThresholdTiles.tsx`, `apps/web/src/features/demo/buildDemoDataset.ts`, `apps/web/src/types.ts` (or `apps/web/src/types/index.ts`)
   Change: `DatedValue<T>` (`datedValue.ts:1-4`, read by `datedValue.ts` and `wattsPerKg.ts`) and `StressThresholds` (`stress.ts:13-20`, read by `stress.ts` and `trainingEffect.ts`) move into `types.ts` unchanged. `datedValue.ts`, `wattsPerKg.ts`, `stress.ts` and `trainingEffect.ts` import them with `import type { … } from './types.ts'`; `HrThresholds` and `TrainingEffectThresholds` stay where they are (each is read by one module) and keep their `Pick<StressThresholds, …>`. Every app module that imports one of the two names from `@pacevault/engine/datedValue.ts` or `@pacevault/engine/stress.ts` imports it from `@pacevault/engine/types.ts` instead, keeping its value imports (`valueAt`, `upsertDatedValue`) where they are.
   Check: `rg -n "^export (interface|type) (DatedValue|StressThresholds)\b" packages/engine/src` prints only `types.ts`; `rg -n "type DatedValue|DatedValue.*from '@pacevault/engine/datedValue" apps` prints no import from `datedValue.ts`; `vp run check` clean; `vp run test` green.

10. (packages/engine) Keep the engine's `types.ts` a leaf.
   Files: `packages/engine/src/types.ts`
   Change: none expected — confirm `types.ts` imports nothing (R3) and holds only declarations plus the `as const` lists `SPORTS` and `RACE_DISTANCES` and their derived unions (R4). If an earlier plan added a function or an import from a sibling module to it, move that back to the module it belongs to.
   Check: `rg -n "^import|=>|^export const (?!SPORTS|RACE_DISTANCES)" --pcre2 packages/engine/src/types.ts` prints nothing.

11. (packages/engine) Rewrite the engine's type-placement rule.
   Files: `packages/engine/CLAUDE.md`
   Change: the **Type placement** bullet (`CLAUDE.md:9`) is replaced by:

   ```md
   - **Type placement**: A type read by more than one engine module lives in `types.ts`, which imports nothing and holds only declarations and `as const` lists with the unions derived from them. A type read by one engine module stays in it, exported when the app or a spec needs it (e.g., `WindExposure` in `windExposure.ts`); a type inferred from a value stays with the value (`HeartRateZoneName` beside `HR_ZONE_DEFS`).
   ```

   Check: a human reads `packages/engine/CLAUDE.md` against `tdr/colocated-types-module.md` §1 (engine paragraph).

### packages/gpx

"More than one module" counts gpx modules, as for the engine. Of the gpx types only `RoutePoint` is read by several gpx modules (`routeGeometry.ts`, `routeCut.ts`, `routeProfile.ts`); `GpxPoint`, `GpxWaypoint`, `GpxMetadata`, `RouteElevationStats` and `RouteProfile` have one gpx reader each and stay there, and `ParsedGpxPoint` stays beside its schema (R6).

12. (packages/gpx) Move `RoutePoint` into a gpx `types.ts`.
   Files: `packages/gpx/src/types.ts` (new), `packages/gpx/src/routeGeometry.ts`, `packages/gpx/src/routeCut.ts`, `packages/gpx/src/routeProfile.ts`, `apps/web/src/lib/gpsTrack.ts`, `apps/web/src/lib/gpxExport.ts`, `apps/web/src/lib/db.ts`, `apps/web/src/lib/indexeddb.ts`, `apps/web/src/features/studio/hooks/useStudioRoutePoints.ts`, `apps/web/src/features/studio/hooks/useStudioRouteExport.ts`, `apps/web/src/features/studio/charts/RouteChartsExplorer.tsx`, `apps/web/tests/lib/gpxExport.spec.ts`, `apps/web/tests/lib/studioPoints.integration.test.ts`, `packages/gpx/tests/routeCut.spec.ts`, `packages/gpx/tests/routeProfile.spec.ts`
   Change: the new module holds the declaration moved unchanged from `routeGeometry.ts:8-10`:

   ```ts
   import type { ParsedGpxPoint } from './parseGpx.ts';

   export interface RoutePoint extends ParsedGpxPoint {
     dist: number;
   }
   ```

   The type-only import is the one exception R3 allows in gpx (§1): `ParsedGpxPoint` is inferred from its schema and stays in `parseGpx.ts`. `routeGeometry.ts` drops the declaration and imports `import type { RoutePoint } from './types.ts';`; `routeCut.ts:1` imports from `./types.ts`; `routeProfile.ts:2` becomes `import { groupBySegment } from './routeGeometry.ts';` plus `import type { RoutePoint } from './types.ts';`. Every importer of `RoutePoint` from `@pacevault/gpx/routeGeometry.ts` imports it from `@pacevault/gpx/types.ts` (`gpsTrack.ts`, `gpxExport.ts:6`, `db.ts:3`, `indexeddb.ts:2`, `useStudioRoutePoints.ts:2`, `useStudioRouteExport.ts:7`, the specs at `gpxExport.spec.ts:4`, `studioPoints.integration.test.ts:8`, `routeCut.spec.ts:7`, `routeProfile.spec.ts:3`); `RouteChartsExplorer.tsx:8` splits into `import type { RouteElevationStats } from '@pacevault/gpx/routeGeometry.ts';` and `import type { RoutePoint } from '@pacevault/gpx/types.ts';`.
   Check: `rg -n "^export (interface|type) RoutePoint\b" packages/gpx/src` prints only `types.ts`; `rg -n "RoutePoint.*from '@pacevault/gpx/routeGeometry\.ts'|from '@pacevault/gpx/routeGeometry\.ts'.*RoutePoint" apps packages --glob '!node_modules'` prints nothing; `rg -n "^import" packages/gpx/src/types.ts` prints only the `ParsedGpxPoint` type import; `vp run check` clean; `vp run test` green.

13. (packages/gpx) Write the type-placement rule into the gpx rules.
   Files: `packages/gpx/CLAUDE.md`
   Change: the **WHAT** line (`CLAUDE.md:4`) lists `types` after `routeProfile` in its module list, and a bullet is added after the **Pure** bullet:

   ```md
   - **Type placement**: A type read by more than one gpx module lives in `types.ts` (`RoutePoint`), which holds only declarations and imports nothing but the schema-inferred `ParsedGpxPoint` type it extends. A type read by one gpx module stays in it, exported when the app or a spec reads it (`GpxPoint` in `buildGpx.ts`, `RouteElevationStats` in `routeGeometry.ts`); a type inferred from a schema stays beside it (`ParsedGpxPoint` in `parseGpx.ts`).
   ```

   Check: a human reads `packages/gpx/CLAUDE.md` against `tdr/colocated-types-module.md` §1 (gpx paragraph).

## Open items

- Shared types declared in helper topic modules (`apps/web/src/lib/*.ts`, and feature-local topic modules such as `features/demo/demoRecords.ts`, `features/map/zoneColoredPath.ts` `DetailPath`, `features/map/fitPadding.ts` `MapPadding`, `features/map/previewDrawIn.ts`, `features/settings/thresholdIcons.ts` `ThresholdTileKey`) stay with the functions that give them meaning, as the helpers-group-by-topic convention requires; they are not moved into a `types.ts`.
- Types inferred from a value stay with it (`ThresholdsForm` in `features/settings/hooks/useThresholdsForm.ts:328`, `DashboardAxis` in `features/dashboard/hooks/useDashboardAxis.ts:26`).
- The worker message types (`WorkerMessageIn`/`WorkerMessageOut`/`PBSessionMeta` in the two `*.worker.ts` modules) are moved by the cross-boundary-contracts-in-shared plan, not here.
- Further shared names created by the unit-length plan's component splits (for example `ShellProps` in onboarding, `DockList` in `components/layout`) land in the `types.ts` of their directory as part of that plan.
- `packages/ui`: the types the kit's component modules export today for other modules (`ToastItem` and `ToastVariant` in `Toast.tsx`, `TypographyVariants` in `Typography.tsx:29`, `StatRailRow`/`StatRailNote` in `StatRail.tsx:5,15`, `SplitBarSegment` in `SplitBar.tsx:6`) move into their component directory's `types.ts` as part of the component-directory-and-file-naming plan, which creates those directories; the dead exports `SegmentBarSegment` and `Field`/`DataTableProps` are removed by the index-modules-are-not-barrels plan.

- `packages/engine`: "more than one module" counts engine modules. A type that one engine module computes and the app reads (`WindExposure`, `Climb`, `Decoupling`, `EffortBlock`, …) stays with its computing module, as the engine's own rule has always said; moving every app-read type would turn `types.ts` into the whole API.

- `packages/gpx`: `RoutePoint` extends `ParsedGpxPoint`, and both owner choices hold at once only with the type-only import of item 12 — the alternative, restating the schema's fields in `types.ts`, would break zod-schema-naming-and-inference R3. It is recorded as a gpx exception to R3 in the TDR.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
