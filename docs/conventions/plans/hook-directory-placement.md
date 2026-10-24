---
id: hook-directory-placement
tdr_reference: tdr/hook-directory-placement.md
depends_on: [index-modules-are-not-barrels]
generated: 2026-10-23
---

# A hook's directory names what it is about, not who uses it

Read `tdr/hook-directory-placement.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`index-modules-are-not-barrels`](index-modules-are-not-barrels.md) — adds the `@site/` alias item 8 imports the moved hooks by.

## Changes

1. Rewrite the two convention lines that still describe the old "feature hooks vs. shared hooks" split.
   Files: `apps/web/CLAUDE.md`, `apps/web/src/features/CLAUDE.md`
   Change: Replace the line at `apps/web/CLAUDE.md:36` (starts with `- **Hooks**: Feature hooks live in`) with exactly:

   ```markdown
   - **Hooks**: A hook lives in the `hooks/` directory of the concept it is about (a feature, a sub-surface such as `features/sessions/session/`, the store), never beside whoever happens to call it; importing it from another feature is normal. `src/lib/hooks/` holds only hooks about no domain concept (DOM, browser, timing, chart interaction). Server reads live in `src/queries/`, writes in `src/mutations/`, routing in `src/routing/`, with no `hooks/` inside them. A hook may sit loose beside a component only while that component, in the same directory, is its sole consumer. Rules: `docs/conventions/tdr/hook-directory-placement.md`.
   ```

   Replace the line at `apps/web/src/features/CLAUDE.md:3` (starts with `- **Feature-level hooks**:`) with exactly:

   ```markdown
   - **Hook placement**: A hook lives in the `hooks/` directory of the concept it is about, at whatever depth owns that concept (`features/sessions/session/hooks/` beside `features/sessions/hooks/` is correct), camelCase and named after the hook (e.g. `useDashboardChartZoom.ts`). A directory holds either a `hooks/` subdirectory or loose `use*` siblings, never both. Server reads and writes are not feature hooks: they live in `src/queries/` and `src/mutations/`.
   ```

   Check: `rg -n "shared hooks in|Feature-specific hooks must live" apps/web/CLAUDE.md apps/web/src/features/CLAUDE.md` prints nothing; both new lines are present when read by hand.

2. Move the map-hover hook out of the app-wide directory into the map feature.
   Files: `apps/web/src/lib/hooks/useMapHover.ts` -> `apps/web/src/features/map/hooks/useMapHover.ts`; importers `apps/web/src/features/studio/StudioRouteItem.tsx`, `apps/web/src/features/sessions/SessionItem.tsx`; test `apps/web/tests/lib/hooks/useMapHover.integration.test.ts` -> `apps/web/tests/features/map/hooks/useMapHover.integration.test.ts`
   Change: `mv` the module unchanged (it writes `useMapFocusStore` hover state, a map concept). Update both imports from `@/lib/hooks/useMapHover.ts` to `@/features/map/hooks/useMapHover.ts`, and the test's import the same way. Use plain `mv`, never `git mv`.
   Check: `rg -n "lib/hooks/useMapHover" apps/web` prints nothing; `vp check` and `vp test -- --run tests/features/map/hooks/useMapHover.integration.test.ts` (from `apps/web/`) pass.

3. Move the training-metrics hook into the dashboard feature that owns the metrics.
   Files: `apps/web/src/lib/hooks/useMetrics.ts` -> `apps/web/src/features/dashboard/hooks/useMetrics.ts`; importers `apps/web/src/features/dashboard/FormStatusCard.tsx`, `apps/web/src/features/dashboard/ACWRGauge.tsx`, `apps/web/src/features/dashboard/ReadinessGauge.tsx`, `apps/web/src/features/sessions/session/TrainingEffectCard.tsx`
   Change: `mv` unchanged; rewrite the four imports from `@/lib/hooks/useMetrics.ts` to `@/features/dashboard/hooks/useMetrics.ts` (the sessions import crossing into dashboard is expected, not a reason to copy the hook).
   Check: `rg -n "lib/hooks/useMetrics" apps/web` prints nothing; `vp check` passes.

4. Move the dated-thresholds hook into the settings feature that owns the thresholds.
   Files: `apps/web/src/lib/hooks/useThresholdsAt.ts` -> `apps/web/src/features/settings/hooks/useThresholdsAt.ts`; importers `apps/web/src/features/sessions/session/LapsControl.tsx`, `apps/web/src/features/sessions/session/TrainingEffectCard.tsx`, `apps/web/src/features/sessions/session/hooks/useSessionLapsEffect.ts`, `apps/web/src/features/sessions/session/hooks/useSessionColorModes.ts`, `apps/web/src/features/sessions/hooks/useSessionTitle.ts`, `apps/web/src/features/sessions/session/hooks/useMoreStats.ts`, `apps/web/src/features/sessions/charts/SessionChartsExplorer.tsx`
   Change: `mv` unchanged; rewrite the seven imports from `@/lib/hooks/useThresholdsAt.ts` to `@/features/settings/hooks/useThresholdsAt.ts`.
   Check: `rg -n "lib/hooks/useThresholdsAt" apps/web` prints nothing; `vp check` passes.

5. Move the geolocation stream hook beside its camera counterpart in the map feature.
   Files: `apps/web/src/lib/hooks/useWatchPositionEffect.ts` -> `apps/web/src/features/map/hooks/useWatchPositionEffect.ts`; importer `apps/web/src/features/map/MapBackground.tsx`
   Change: `mv` unchanged (it feeds `useGeolocationStore`, the live-position concept the map owns; `useGeolocationCameraEffect.ts` already lives in `features/map/hooks/`); update the import to `./hooks/useWatchPositionEffect.ts`.
   Check: `rg -n "lib/hooks/useWatchPositionEffect" apps/web` prints nothing; `vp check` passes.

6. Move the store-hydration hook to the store it is about, renaming the file to the hook it exports.
   Files: `apps/web/src/lib/hooks/useHydrated.ts` -> `apps/web/src/store/hooks/useStoresHydrated.ts`; importer `apps/web/src/App.tsx`
   Change: `mv apps/web/src/lib/hooks/useHydrated.ts apps/web/src/store/hooks/useStoresHydrated.ts` (export `useStoresHydrated` is unchanged, so basename and export now agree); `App.tsx:2` import becomes `import { useStoresHydrated } from './store/hooks/useStoresHydrated.ts';`. If the global-store migration has already replaced this hook, skip this item.
   Check: `rg -n "useHydrated" apps/web/src` prints nothing; `vp check` passes.

7. Move the five server-read hooks out of feature `hooks/` directories into the dedicated reads tree (placement only; their internal shape is reworked by the one-server-call plan).
   Files: `apps/web/src/features/intervals/hooks/useIntervalsSync.ts` -> `apps/web/src/queries/intervals/useIntervalsSync.ts`; `apps/web/src/features/intervals/hooks/useIntervalsKeyCheck.ts` -> `apps/web/src/queries/intervals/useIntervalsKeyCheck.ts`; `apps/web/src/features/records/hooks/usePersonalBests.ts` -> `apps/web/src/queries/records/usePersonalBests.ts`; `apps/web/src/features/map/hooks/useOnboardingPreviewRoutes.ts` -> `apps/web/src/queries/onboarding/useOnboardingPreviewRoutes.ts`; `apps/web/src/features/sessions/session/hooks/useSessionWeather.ts` -> `apps/web/src/queries/weather/useSessionWeather.ts`. Importers: `apps/web/src/features/intervals/IntervalsStatusLine.tsx`, `apps/web/src/features/intervals/IntervalsConnectionForm.tsx`, `apps/web/src/components/layout/AppLayout.tsx`, `apps/web/src/features/records/SportsRecords.tsx`, `apps/web/src/features/sessions/createIngestBatcher.ts`, `apps/web/src/features/sessions/hooks/useSessionReprocessingEffect.ts`, `apps/web/src/features/sessions/session/DeleteSessionDialog.tsx`, `apps/web/src/features/settings/DeleteAllDataDialog.tsx`, `apps/web/src/features/demo/loadDemoData.ts`, `apps/web/src/features/map/hooks/useOnboardingPreviewCameraEffect.ts`, `apps/web/src/features/map/hooks/useOnboardingPreviewLayer.ts`, `apps/web/src/features/map/hooks/useSessionDetailPath.ts`, `apps/web/src/features/sessions/session/WeatherCard.tsx`, `apps/web/src/features/sessions/session/hooks/useSessionColorModes.ts`; tests `apps/web/tests/features/records/hooks/usePersonalBests.spec.ts` -> `apps/web/tests/queries/records/usePersonalBests.spec.ts`, `apps/web/tests/features/sessions/createIngestBatcher.integration.test.ts` (import only)
   Change: `mv` each file unchanged. Inside the moved files fix relative imports to `@/` paths: `useIntervalsSync.ts` `'../runIntervalsSync.ts'` -> `'@/features/intervals/runIntervalsSync.ts'`; `useOnboardingPreviewRoutes.ts` `'../previewDrawIn.ts'` -> `'@/features/map/previewDrawIn.ts'`; `usePersonalBests.ts` already uses `@/features/records/personalBests.worker.ts` but its `new URL('../personalBests.worker.ts', import.meta.url)` becomes `new URL('../../features/records/personalBests.worker.ts', import.meta.url)`. Rewrite every importer to the new `@/queries/...` path (relative imports such as `./hooks/useIntervalsSync.ts` and `./hooks/useSessionWeather.ts` become `@/queries/intervals/useIntervalsSync.ts` and `@/queries/weather/useSessionWeather.ts`). Afterwards `apps/web/src/features/intervals/hooks/` and `apps/web/src/features/records/hooks/` are empty: delete them. No `index.ts` and no `hooks/` subdirectory inside `src/queries/`.
   Check: `rg -n "use(Query|InfiniteQuery|Mutation)\(" apps/web/src --glob '!**/queries/**' --glob '!**/mutations/**'` prints nothing; `find apps/web/src/queries -name index.ts -o -type d -name hooks` prints nothing; `vp check`, `vp test -- --run` (from `apps/web/`) and `vp run build` (from the root) pass, the build proving the worker URL still resolves.

### tools/workbench

The board island (`tools/workbench/site/src/app/`) is one surface with no `queries/` or `mutations/` trees; its server-state hooks talk to the dev server's actions, and their place is the island's own `hooks/` directory (R1, R5). The index-modules plan has given the island its `@site/` alias, so the moved hooks are imported as `@site/app/hooks/<hook>.ts`.

8. (tools/workbench) Move the island's hooks into `site/src/app/hooks/` (R6, R7).
   Files: `tools/workbench/site/src/app/useBoard.ts`, `tools/workbench/site/src/app/useBoardChangedEffect.ts`, `tools/workbench/site/src/app/useWrite.ts` → `tools/workbench/site/src/app/hooks/`; importers `tools/workbench/site/src/app/{Board,Columns,ItemPanel,NeedsYou,QuestionRow,CheckRow,AnswerDialog,ReviewPane,WriteCard}.tsx`
   Change: `useWrite.ts` is imported by nine components and `useBoard.ts`/`useBoardChangedEffect.ts` sit loose beside them, so all three move unchanged (`mv`) into the new `site/src/app/hooks/`; every `'./useWrite.ts'`, `'./useBoard.ts'`, `'./useBoardChangedEffect.ts'` specifier in the importers becomes `'@site/app/hooks/useWrite.ts'` and so on. The hooks' own imports already use `@site/` and need no change.
   Check: `ls tools/workbench/site/src/app/use*.ts` fails; `ls tools/workbench/site/src/app/hooks` lists `useBoard.ts useBoardChangedEffect.ts useWrite.ts`; `vp check` from `tools/workbench/` is clean; `vp run -F @pacevault/workbench check` passes; the board loads at `http://localhost:4321` (reuse a running board, start one with `vp run workbench` only when none runs) and renders its columns, cards and Needs you as before.

## Open items

- R2 leaves four hooks in `apps/web/src/lib/hooks/` on purpose: `useChartZoom.ts`, `useSyncedChartZoom.ts` (chart interaction over any data), `useDebouncedValue.ts` and `useDismiss.ts` (timing and DOM primitives). `useDismiss` has a single importer (`components/layout/Dock.tsx`); a generic primitive with one call site is correctly placed.
- R4's `src/mutations/` and `src/routing/` get their first modules from the one-server-call and navigation plans; nothing exists to move into them today.
- R7 and R8 already hold: no directory under `apps/web/src` mixes a `hooks/` subdirectory with loose `use*` siblings, and no `hooks/` directory contains a `helpers`/`utils`/`misc`/`common`/`shared`/`index` module. `apps/web/src/features/map/hooks/types.ts` is handled by the colocated-types plan. The 3D map hooks (`useMapRendererHandOver.ts`, `useMapTerrainEffect.ts`, `useTerrain*Effect.ts`) already sit in `features/map/hooks/`, the concept they are about (R1); `features/sessions/session/MapViewControl.tsx` declares no hook.
- Hooks declared inside component modules (`components/charts/ZoneGradient.tsx`, `components/layout/Dock.tsx`, `components/ImportProgressOverlay.tsx`) are extracted by the one-hook-per-file plan, which places them per R6.
- Store accessor hooks (`useChartHoverX` in `apps/web/src/store/chartHover.ts`) stay with their store until the global-store migration settles their home.
- `tools/workbench`: R2 and R4 name `apps/web` trees (`src/lib/hooks/`, `queries/`, `mutations/`, `routing/`) and have no subject in the board island.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
