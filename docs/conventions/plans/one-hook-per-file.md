---
id: one-hook-per-file
tdr_reference: tdr/one-hook-per-file.md
depends_on: [hook-directory-placement]
generated: 2026-10-23
---

# One hook per module, module named after the hook

Read `tdr/one-hook-per-file.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`hook-directory-placement`](hook-directory-placement.md) — decides the directories the extracted hook modules below land in, and already renames `lib/hooks/useHydrated.ts` to `store/hooks/useStoresHydrated.ts` (the one R3 basename mismatch besides `useGpsBackfill.ts`).

## Changes

1. Rename the GPS backfill hook so its export matches its filename.
   Files: `apps/web/src/features/map/hooks/useGpsBackfill.ts`, `apps/web/src/features/map/MapBackground.tsx`, `apps/web/tests/features/map/hooks/useGpsBackfill.integration.test.ts`
   Change: `export const useGPSBackfill = () =>` becomes `export const useGpsBackfill = () =>` (`useGpsBackfill.ts:9`); `MapBackground.tsx:7` import and `MapBackground.tsx:32` call become `useGpsBackfill`; the test's import, `describe('useGPSBackfill', ...)` and calls become `useGpsBackfill`.
   Check: `rg -n "useGPSBackfill" apps/web` prints nothing; `vp test -- --run tests/features/map/hooks/useGpsBackfill.integration.test.ts` (from `apps/web/`) passes.

2. Move the private camera-target hook out of the camera-effect module.
   Files: `apps/web/src/features/map/hooks/useMapCameraEffect.ts`, new `apps/web/src/features/map/hooks/useMapCameraTarget.ts`
   Change: Cut `const useMapCameraTarget = (): MapCameraTarget => { ... }` (`useMapCameraEffect.ts:71-92`) into the new module as `export const useMapCameraTarget = (): MapCameraTarget => { ... }`, carrying the imports it needs (`useMemo`, `useStudioMapTracks`, `useMapFocusStore`, `useMapControlsStore`, and `MapCameraTarget` from wherever `useMapCameraEffect.ts` imports it today). `useMapCameraEffect.ts` imports it from `./useMapCameraTarget.ts`; drop imports that are now unused there.
   Check: `rg -c "^(export )?const use[A-Z]" apps/web/src/features/map/hooks/useMapCameraEffect.ts` prints `1`; `vp check` passes.

3. Move the zone-stroke hook out of `ZoneGradient.tsx` into a module named after it.
   Files: `apps/web/src/components/charts/ZoneGradient.tsx` -> `apps/web/src/components/charts/hooks/useZoneLineStroke.tsx`; importers `apps/web/src/features/sessions/charts/PaceChart.tsx`, `apps/web/src/features/sessions/charts/PowerChart.tsx`, `apps/web/src/features/sessions/charts/SpeedChart.tsx`, `apps/web/src/features/sessions/charts/HrChart.tsx`
   Change: `mv apps/web/src/components/charts/ZoneGradient.tsx apps/web/src/components/charts/hooks/useZoneLineStroke.tsx` (the module exports only `useZoneLineStroke`; it stays `.tsx` because it returns `<defs>` markup). Fix its relative import if any, and rewrite the four importers from `@/components/charts/ZoneGradient.tsx` to `@/components/charts/hooks/useZoneLineStroke.tsx`. `components/charts/` has four consumers outside the directory, so the hook goes into `hooks/`, not loose.
   Check: `test ! -e apps/web/src/components/charts/ZoneGradient.tsx && rg -n "ZoneGradient" apps/web/src` prints nothing; `vp check` passes.

4. Move the dock-list hook out of the component module `Dock.tsx`.
   Files: `apps/web/src/components/layout/Dock.tsx`, new `apps/web/src/components/layout/useDockList.ts`
   Change: Cut `const useDockList = () => { ... }` (`Dock.tsx:20-45`) into the new loose module (sole consumer `Dock.tsx` in the same directory, and `components/layout/` has no `hooks/`) as `export const useDockList = (): DockList => { ... }`; replace `type DockList = ReturnType<typeof useDockList>;` (`Dock.tsx:46`) with an `export interface DockList { ... }` declared in `useDockList.ts` listing the four members the hook returns (`Dock.tsx:43`): `open: boolean; close: () => void; toggle: () => void; handleTabClick: () => void;`. `Dock.tsx` imports `useDockList` and `type DockList` from `./useDockList.ts`. Move `useState`, `useCallback` and `useSheetScrollElement` imports with it if `Dock.tsx` no longer uses them.
   Check: `rg -n "const useDockList" apps/web/src/components/layout/Dock.tsx` prints nothing; `vp check` passes.

5. Move the held-reprocess hook out of the component module `ImportProgressOverlay.tsx`.
   Files: `apps/web/src/components/ImportProgressOverlay.tsx`, new `apps/web/src/components/useHeldReprocess.ts`
   Change: Cut `const useHeldReprocess = (foreground: ForegroundImport | null): ForegroundImport | null => { ... }` (`ImportProgressOverlay.tsx:164-182`) into the new loose module as `export const useHeldReprocess = ...` (sole consumer `ImportProgressOverlay.tsx` in the same directory, `components/` has no `hooks/`). It needs `MIN_OPEN_MS` too: move that constant into `useHeldReprocess.ts` as `export const MIN_OPEN_MS` and import it back into `ImportProgressOverlay.tsx`, which also reads it (`ImportProgressOverlay.tsx:123`). `ForegroundImport` comes from the same store module `ImportProgressOverlay.tsx` imports it from.
   Check: `rg -n "const useHeldReprocess" apps/web/src/components/ImportProgressOverlay.tsx` prints nothing; `vp check` and `vp run e2e` pass (the import overlay timing is covered by e2e).

### tools/workbench

The hook-directory-placement plan has moved the island's hooks into `tools/workbench/site/src/app/hooks/`.

6. (tools/workbench) Split the write hooks and move their shared helpers out (R1, R4, R5).
   Files: `tools/workbench/site/src/app/hooks/useWrite.ts`; new `tools/workbench/site/src/app/hooks/useUndo.ts`, `tools/workbench/site/src/app/hooks/boardRefetch.ts`, `tools/workbench/site/src/app/writeErrors.ts`, `tools/workbench/site/src/app/types.ts`; importers `tools/workbench/site/src/app/{Board,AnswerDialog,WriteCard}.tsx`
   Change: `useWrite.ts` exports two hooks (`useWrite`, `useUndo`) and a helper three components read (`messageOf`). After the split:
   - `hooks/useWrite.ts` keeps `Reply`, `FormWrite`, `WriteName`, `WRITES`, `WriteInput`, `runWrite` and `useWrite`.
   - `hooks/useUndo.ts` holds `useUndo`, unchanged.
   - `hooks/boardRefetch.ts` holds the two helpers both hooks call, unchanged apart from their exported names: `refetch` → `export const refetchBoard`, `onErrorOf` → `export const refetchBoardOnConflict`.
   - `site/src/app/writeErrors.ts` holds `messageOf` (with its `isInputError` import); `Board.tsx`, `AnswerDialog.tsx` and `WriteCard.tsx` import it from `'./writeErrors.ts'`.
   - `site/src/app/types.ts` holds `export type WriteMeta = { inline: boolean };`, read by both hooks and `WriteCard.tsx` (colocated-types-module R1: the common directory of its readers).
   `WriteCard.tsx` imports `useUndo` from `'@site/app/hooks/useUndo.ts'` and `WriteMeta` from `'./types.ts'`.
   Check: `rg -c "^export const use" tools/workbench/site/src/app/hooks/*.ts` prints `1` for every hook module and nothing for `boardRefetch.ts`; `rg -n "messageOf|WriteMeta" tools/workbench/site/src/app/hooks/useWrite.ts` prints only the `WriteMeta` import and its use; `vp check` from `tools/workbench/` is clean; `vp run -F @pacevault/workbench check` passes; `vp test -- --run` from `tools/workbench/` passes 66 tests.

## Open items

- R6 (context accessor hooks live in their provider module) has no subject in `apps/web/src`: there are no contexts here. The accessor/provider pairs live in `packages/ui` (`sheetAboveContext.ts`, `sheetPeekContext.ts`) and are handled by the later packages/ui run.
- `apps/web/src/store/chartHover.ts` exports both `useChartHoverStore` and `useChartHoverX`. Store accessor hooks are left to the global-store migration, which replaces the per-store modules; no change here.
- R4 and R5 found nothing to change: every `use*` module's non-hook exports today serve its own hook (constants such as `INPUT_DEBOUNCE_MS` in `lib/hooks/useDebouncedValue.ts`, `DASHBOARD_HOVER_GROUP` in `features/dashboard/hooks/useDashboardChartEvents.ts`). Re-check `invalidatePersonalBests*`/`resetPersonalBests` in `queries/records/usePersonalBests.ts` after the one-server-call plan: they are cache helpers for that one call and may stay.
- `packages/ui`: no violations; the accessor hooks of `packages/ui/src/components/BottomSheetProvider.tsx` (context-provider-accessor-pairs plan) are the recorded exception to R1/R2.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
