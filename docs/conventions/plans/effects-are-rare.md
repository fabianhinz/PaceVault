---
id: effects-are-rare
tdr_reference: tdr/effects-are-rare.md
depends_on: [hook-directory-placement, names-spell-out-their-meaning, one-server-call-per-hook-module, hooks-return-the-fitting-shape, floating-promises-marked-void]
generated: 2026-10-23
---

# An effect only synchronises with something outside React

Read `tdr/effects-are-rare.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`hook-directory-placement`](hook-directory-placement.md) — creates `tools/workbench/site/src/app/hooks/`, where item 21 puts the effect hooks.
- [`names-spell-out-their-meaning`](names-spell-out-their-meaning.md) — renames the locals of `TechPane`, `WriteCard` and `tech.ts` that the effect bodies of item 21 read.
- [`one-server-call-per-hook-module`](one-server-call-per-hook-module.md) — sets the fetcher / `<name>QueryKey` / annotated-hook shape and the `QueryResults` registry in `apps/web/src/types/index.ts` that the new read modules in items 9–15 follow, and creates the delete mutations items 9 and 12 extend.
- [`hooks-return-the-fitting-shape`](hooks-return-the-fitting-shape.md) — reshapes the returns of `useGpsBackfill` and `useStudioRoutePoints`, which items 9 and 14 then delete; running it first keeps its check valid.
- [`floating-promises-marked-void`](floating-promises-marked-void.md) — marks the `.then` chains in the effects that items 9–13 delete; running it first keeps its check valid.

Several items below change what a user sees or when work runs (listener target and firing moment, measured box, stored grouping preference, dialog seeding before first paint, cached reads, background-job scheduling, the write card's close moment). Each is verified by the spec its Check names, the full suite, and the review round: capture before/after screenshots at desktop and 390 px with `vp run workbench:capture` for every item that touches a screen, and record the visible differences in the review doc instead of requiring identical pixels.

## Changes

1. Add the purpose-built hook library.
   Files: `apps/web/package.json`, `pnpm-lock.yaml`
   Change: from the repo root run `vp add react-use --filter @pacevault/web` (adds `"react-use"` to `dependencies`).
   Check: `rg -n '"react-use"' apps/web/package.json` prints one line; `vp check` passes.

2. Replace the hand-rolled debounce effect with `useDebounce`.
   Files: `apps/web/src/lib/hooks/useDebouncedValue.ts`
   Change: the `useEffect(() => { const id = setTimeout(...); return () => clearTimeout(id); }, [value, delayMs])` block (`:8-11`) becomes `useDebounce(() => setDebounced(value), delayMs, [value]);` with `import { useDebounce } from 'react-use';`; drop the `useEffect` import.
   Check: `rg -n "useEffect" apps/web/src/lib/hooks/useDebouncedValue.ts` prints nothing; `vp test -- --run tests/features/intervals` (from `apps/web/`) passes.

3. Replace the hand-rolled Escape listeners with `useKeyPressEvent` (R4).
   Files: `apps/web/src/features/sessions/session/LapsControl.tsx`, `apps/web/src/features/filters/hooks/useFilterBuilder.ts`, `apps/web/e2e/sessions.spec.ts`
   Change: in `LapStepper`, the `useEffect` at `LapsControl.tsx:292-298` (`window.addEventListener('keydown', onKeyDown)` closing the selected lap on Escape) becomes `useKeyPressEvent('Escape', () => useMapControlsStore.getState().closeSelectedLap());`; drop `useEffect` from the `react` import at `:1`. In `useFilterBuilder.ts` the `document` keydown effect at `:28-44` becomes:

   ```ts
   useKeyPressEvent('Escape', () => {
     if (!open) return;
     if (text !== '') {
       setText('');
       return;
     }
     onClose();
   });
   ```

   Both import `useKeyPressEvent` from `react-use`. Accepted behaviour change: the filter listener moves from `document` to `window`, both handlers fire once per press from react-use's key-state effect instead of synchronously on every `keydown` (no auto-repeat), so their order against Radix's own Escape handling can differ. In `apps/web/e2e/sessions.spec.ts`, test `a lap picked on a chart turns the laps pill into a stepper, steps without moving and keeps its settings per sport`, after the second `lap-strip-bar` click (`:145-147`) press `page.keyboard.press('Escape')` and expect `stepper` to have count 0 and `lapsPill` to be visible, instead of clicking `lap-stepper-clear` there (`:148-149`).
   Check: `rg -n "addEventListener\('keydown'" apps/web/src/features` prints nothing; `vp run e2e` passes, including the lap-stepper Escape step above and `apps/web/e2e/filters.spec.ts` `creates a filter through the inline input and puts it at the top` (first Escape clears the text, second closes the list).

4. Replace the document listeners in `useDismiss` with `useEvent`.
   Files: `apps/web/src/lib/hooks/useDismiss.ts`
   Change: keep `handleKeyDown` and `handleClickOutside` as plain consts in the hook body; replace the `useEffect` (`:13-28`) with a target chosen per flag and two `useEvent` calls: `let keyTarget: Document | null = null; if (escapeEnabled) keyTarget = document;` and the same for `pointerTarget` with `outsideEnabled`, then `useEvent('keydown', handleKeyDown, keyTarget);` and `useEvent('pointerdown', handleClickOutside, pointerTarget);` (`import { useEvent } from 'react-use';`). `useEvent` re-subscribes when the handler identity changes, which matches today's `[onClose, ...]` dependency list.
   Check: `rg -n "useEffect|addEventListener" apps/web/src/lib/hooks/useDismiss.ts` prints nothing; `vp run e2e` passes (dock list open/close).

5. Replace the `ResizeObserver` effect with `useMeasure` (R4).
   Files: `apps/web/src/features/settings/ThresholdSparkline.tsx`
   Change: `const ref = useRef<HTMLDivElement>(null);` (`:14`), `const [box, setBox] = useState({ width: 0, height: 0 });` (`:15`) and the `useEffect` at `:18-26` become `const [ref, box] = useMeasure<HTMLDivElement>();` (`import { useMeasure } from 'react-use';`); the `<div>` keeps `ref={ref}` (`:52`) and every `box.width` / `box.height` read stays. Drop `useEffect` and `useRef` from the `react` import at `:1`. The measured `<div>` (`className="h-full w-full touch-pan-y"`) has no padding, so the content box equals today's client box except that it is fractional: accepted behaviour change, the sparkline paths and the scrub guide shift by sub-pixels.
   Check: `rg -n "ResizeObserver" apps/web/src/features/settings` prints nothing; `vp check` passes; the before/after capture of Settings › General shows the threshold sparklines at full tile width (sub-pixel differences only), and by hand in `vp dev` the scrub guide follows the pointer.

6. Derive the effective load-chart grouping during render instead of writing it back to the store (R2).
   Files: `apps/web/src/features/dashboard/LoadChart.tsx`, `apps/web/e2e/dashboard.spec.ts`
   Change: delete the effect at `LoadChart.tsx:116-120` and `useEffect` from the `react` import at `:1`. Below `isGroupingDisabled` (`:114`) add `const effectiveGroupBy: LoadGroupBy = isGroupingDisabled ? 'day' : groupBy;` and read `effectiveGroupBy` everywhere the component reads `groupBy` after that line (`:128-129`, `:142`, `:147-148`, `:151`, `:198`, `:244`). Accepted behaviour change: the stored `loadChartGroupBy` preference is no longer overwritten with `'day'` while the range is 7 days or shorter, so widening the range restores the user's own grouping. In `apps/web/e2e/dashboard.spec.ts` add one test to `Dashboard volume`: `keeps the chosen load grouping across a short range` — select the week tab of the load chart, switch the dashboard range to 7 days (the day tab is selected and the others are disabled), switch back to the previous range and expect the week tab to be selected again.
   Check: `rg -n "setLoadChartGroupBy\('day'\)" apps/web/src/features/dashboard/LoadChart.tsx` prints nothing; `vp run e2e` passes, including the new dashboard test.

7. Seed the trip and studio-route form dialogs on open during render instead of in an effect (R2).
   Files: `apps/web/src/features/trips/TripFormDialog.tsx`, `apps/web/src/features/studio/StudioRouteFormDialog.tsx`
   Change: replace each `useEffect(() => { if (props.open) { setName(...); ... } }, [props.open, ...])` (`TripFormDialog.tsx:45-52`, `StudioRouteFormDialog.tsx:26-31`) with the adjust-on-change pattern already used at `apps/web/src/components/ImportProgressOverlay.tsx:168-172`, initialised to `false` so a dialog mounted already open seeds once on its first render:

   ```tsx
   const [seededOpen, setSeededOpen] = useState(false);
   if (props.open !== seededOpen) {
     setSeededOpen(props.open);
     if (props.open) {
       setName(props.trip?.name ?? '');
       setDescription(props.trip?.description ?? '');
       setSelectedIds(new Set(props.trip?.sessionIds ?? []));
       setShowAll(false);
     }
   }
   ```

   (studio dialog: `setName(props.route.name); setColor(props.route.color);`). Drop `useEffect` from both `react` imports. Accepted behaviour change: the fields are seeded before the dialog's first paint instead of one frame after it; a `trip`/`route` prop that changes while the dialog stays open no longer re-seeds it.
   Check: `rg -n "useEffect" apps/web/src/features/trips/TripFormDialog.tsx apps/web/src/features/studio/StudioRouteFormDialog.tsx` prints nothing; `vp run e2e` passes, pinned by `apps/web/e2e/trips.spec.ts` `edits an existing trip from the detail page actions menu` (the dialog opens prefilled) and `creates a trip from the CTA by naming it and selecting sessions` (it opens empty), and `apps/web/e2e/studio.spec.ts` `imports a GPX route, opens its detail page, edits and deletes it`.

8. Seed the studio marker dialog and reset the filter text on open/close during render (R2).
   Files: `apps/web/src/features/studio/markers/StudioMarkerDialog.tsx`, `apps/web/src/features/filters/hooks/useFilterBuilder.ts`
   Change: in `StudioMarkerDialog.tsx` the effect at `:49-83` becomes a seed key adjusted during render. After `maxKm` (`:40`) add `` const seedTarget = active ? `${editor.markerId ?? 'new'}|${editor.type}|${editor.initialDistanceM ?? ''}` : null; `` and after the `useState` lines (`:42-46`):

   ```tsx
   const [seededTarget, setSeededTarget] = useState<string | null>(null);
   if (seedTarget !== seededTarget) {
     setSeededTarget(seedTarget);
     if (seedTarget !== null) {
       <the seeding body of today's effect, :52-79, unchanged>
     }
   }
   ```

   The key covers every input the effect re-ran on (`active`, `editor.markerId`, `editor.initialDistanceM`, `isPoi` via `editor.type`; `existing` and `props.route` cannot change while the dialog is open, because saving closes it); the comment lines inside the effect go with it. In `useFilterBuilder.ts` the cleanup effect at `:21-26` (clears `text` when `open` turns false) becomes `const [seenOpen, setSeenOpen] = useState(open); if (open !== seenOpen) { setSeenOpen(open); if (!open) setText(''); }`. Drop `useEffect` from both `react` imports (item 3 removed the filter's other effect). Accepted behaviour change: seeding and the reset happen during render instead of after paint or in cleanup.
   Check: `rg -n "useEffect" apps/web/src/features/filters/hooks/useFilterBuilder.ts apps/web/src/features/studio/markers/StudioMarkerDialog.tsx` prints nothing; `vp run e2e` passes, pinned by `apps/web/e2e/studio.spec.ts` `adds, edits and deletes markers in the Tools tab` (add opens empty, edit opens prefilled) and `apps/web/e2e/filters.spec.ts` `applies a default filter, keeps the list open and clears it again`.

9. Load studio route points through a cached read module, invalidated on every points write (R3).
   Files: new `apps/web/src/queries/studio/useStudioRoutePoints.ts`; delete `apps/web/src/features/studio/hooks/useStudioRoutePoints.ts`; `apps/web/src/pages/StudioDetailPage.tsx`, `apps/web/src/features/studio/markers/StudioMarkerPins.tsx`, `apps/web/src/features/studio/markers/StudioTrackPickPopup.tsx`, `apps/web/src/features/studio/createStudioRoute.ts`, `apps/web/src/features/studio/hooks/useGpxImport.ts`, `apps/web/src/features/sessions/session/hooks/useEditInStudio.ts`, `apps/web/src/features/demo/loadDemoData.ts`, `apps/web/src/mutations/studio/useDeleteStudioRouteMutation.ts`, `apps/web/src/features/settings/DeleteAllDataDialog.tsx`, `apps/web/src/types/index.ts`; new test `apps/web/tests/queries/studio/useStudioRoutePoints.integration.test.ts`
   Change: add `studioRoutePoints: RoutePoint[];` to `QueryResults`. New module (imports `getStudioRoutePoints` from the module that exports it when this runs, `@/lib/indexeddb.ts` today):

   ```ts
   export const loadStudioRoutePoints = async (options: { routeId: string }): Promise<QueryResults['studioRoutePoints']> =>
     getStudioRoutePoints(options.routeId);

   export const studioRoutePointsQueryKey = (options: { routeId: string }): string[] => ['studio-route-points', options.routeId];

   export const invalidateStudioRoutePoints = (queryClient: QueryClient, options: { routeId: string }): Promise<void> =>
     queryClient.invalidateQueries({ queryKey: studioRoutePointsQueryKey(options) });

   export const resetStudioRoutePoints = (queryClient: QueryClient): void => {
     queryClient.removeQueries({ queryKey: ['studio-route-points'] });
   };

   export const useStudioRoutePoints = (options: { routeId: string }): UseQueryResult<QueryResults['studioRoutePoints']> =>
     useQuery({ queryKey: studioRoutePointsQueryKey(options), queryFn: () => loadStudioRoutePoints(options), staleTime: Infinity });
   ```

   Readers: `StudioDetailPage.tsx:37` `const routePoints = useStudioRoutePoints({ routeId: props.route.id });` and the charts render on `routePoints.data` (`routePoints.data && <RouteChartsExplorer points={routePoints.data} ... />`, `:53-54`); `StudioMarkerPins.tsx:15-16` `const points = useStudioRoutePoints({ routeId: props.routeId }).data;`; `StudioTrackPickPopup.tsx:23` `useStudioRoutePoints({ routeId: props.info.routeId })` with `routePoints.points` (`:35-38`) read as `routePoints.data` and the `!== null` test at `:38` as `!== undefined`. Writers: `createStudioRouteFromPoints` (`createStudioRoute.ts:11`) takes `queryClient: QueryClient` in its `meta` options and, after `saveStudioRoutePoints` (`:30`) succeeds, awaits `invalidateStudioRoutePoints(meta.queryClient, { routeId: id })` (a map layer mounted for the new route before the save finished would otherwise keep its cached `[]`); `createStudioRouteFromGpx` forwards `meta.queryClient`; `useGpxImport.ts:14` and `useEditInStudio.ts:26` pass `useQueryClient()`, `loadDemoData.ts:50` passes its `queryClient`. `useDeleteStudioRouteMutation` gains `onSuccess: (_data, variables) => queryClient.removeQueries({ queryKey: studioRoutePointsQueryKey(variables) })` with `const queryClient = useQueryClient();`. `DeleteAllDataDialog.tsx` calls `resetStudioRoutePoints(queryClient);` beside `resetPersonalBests(queryClient);` (`:46`). Accepted behaviour change: reopening a route shows its cached points at once instead of an empty first frame. New test `useStudioRoutePoints.integration.test.ts`: `shows points saved after the route's query first ran` — render the hook for `routeId: 'r1'` inside a `QueryClientProvider` (data `[]`), save two points with `saveStudioRoutePoints('r1', …)`, call `invalidateStudioRoutePoints(client, { routeId: 'r1' })`, and expect the hook's data to hold the two points.
   Check: `test ! -e apps/web/src/features/studio/hooks/useStudioRoutePoints.ts`; `rg -n "saveStudioRoutePoints|deleteStudioRoutePoints" apps/web/src --glob '!**/lib/**'` lists only `createStudioRoute.ts` and `useDeleteStudioRouteMutation.ts`, each also calling the invalidate or remove helper; `vp test -- --run tests/queries/studio` (from `apps/web/`) passes; `vp run e2e` passes (`apps/web/e2e/studio.spec.ts`: import, detail charts, markers, delete).

10. Load session records and laps through read modules on the detail page (R3).
    Files: new `apps/web/src/queries/sessions/useSessionRecords.ts`, new `apps/web/src/queries/sessions/useSessionLaps.ts`; `apps/web/src/pages/SessionDetailPage.tsx`; `apps/web/src/types/index.ts`
    Change: add `sessionRecords: SessionRecord[]; sessionLaps: SessionLap[];` to `QueryResults`. Each module: fetcher `loadSessionRecords(options: { sessionId: string })` / `loadSessionLaps(options: { sessionId: string })` over `getSessionRecords` / `getSessionLaps`, key builders `sessionRecordsQueryKey({ sessionId })` -> `['session-records', sessionId]` and `sessionLapsQueryKey({ sessionId })` -> `['session-laps', sessionId]`, hooks `useSessionRecords(options: { sessionId: string; enabled: boolean })` / `useSessionLaps(...)` returning `UseQueryResult<QueryResults[...]>` with React Query's default `staleTime` (refetch on mount, like today's effect, but render the cached value first). In `SessionDetailPage.tsx` delete the two `useState` lines (`:20-21`) and the effect at `:29-34`; add a module constant pair `const NO_RECORDS: SessionRecord[] = [];` / `const NO_LAPS: SessionLap[] = [];`, then `const enabled = params.id !== undefined && session?.hasDetailedRecords === true;`, `const sessionRecords = useSessionRecords({ sessionId: params.id ?? '', enabled });`, `const sessionLaps = useSessionLaps({ sessionId: params.id ?? '', enabled });`, `const records = sessionRecords.data ?? NO_RECORDS;`, `const laps = sessionLaps.data ?? NO_LAPS;` (stable fallbacks keep downstream `useMemo` deps from churning). If the navigation plan already replaced `params.id` with `useRouterParam('id')`, read that `id` instead. Accepted behaviour change: a revisited detail page renders its cached records and laps in the first frame, then refetches.
    Check: `rg -n "getSessionRecords|getSessionLaps|useEffect" apps/web/src/pages/SessionDetailPage.tsx` prints nothing (item 16 moved the seen-marking effect out); `vp run e2e` passes, pinned by `apps/web/e2e/sessions.spec.ts` `click session → navigate to detail page` and `navigate back from detail to session list`.

11. Load the map's detail-path records through the same read module, prefetched on hover (R3).
    Files: `apps/web/src/features/map/hooks/useSessionDetailPath.ts`
    Change: delete the `loaded` state, `fetchedIdRef` and the effect (`:28-29`, `:39-58`) and `useEffect`/`useRef`/`useState` from the `react` import. Add `const targetSession = sessions.find((s) => s.id === targetId);` and `const targetRecords = useSessionRecords({ sessionId: targetId ?? '', enabled: targetId !== null && targetSession?.hasDetailedRecords === true });` (hover prefetches, opening reads the cache). In the `useMemo` replace `if (!openedSessionId || loaded?.id !== openedSessionId) return null;` with `const records = targetRecords.data; if (!openedSessionId || records === undefined) return null;` and every `loaded.records` with `records`; the dependency list swaps `loaded` for `targetRecords.data`. While `openedSessionId` is set, `targetId === openedSessionId`, so the data is the opened session's. Accepted behaviour change: hovering a track reads that session's records from IndexedDB, and an opened session's coloured path appears from cache.
    Check: `rg -n "useEffect|getSessionRecords" apps/web/src/features/map/hooks/useSessionDetailPath.ts` prints nothing; `vp run e2e` passes, pinned by `apps/web/e2e/map.spec.ts` `session map shows a pointer cursor over the track while laps are on` (the opened session's path is drawn) and `apps/web/e2e/sessions.spec.ts` `color by HR zones colours the HR chart and is remembered per sport`.

12. Load the fallback fit bounds through a GPS read module, invalidated on every GPS write (R3).
    Files: new `apps/web/src/queries/sessions/useSessionGps.ts`; `apps/web/src/features/map/hooks/useSessionFitBounds.ts`; `apps/web/src/mutations/sessions/useDeleteSessionMutation.ts`; `apps/web/src/features/settings/DeleteAllDataDialog.tsx`; `apps/web/src/features/demo/loadDemoData.ts`; `apps/web/src/types/index.ts`
    Change: add `sessionGps: SessionGPS | null;` to `QueryResults`. New module: `loadSessionGps(options: { sessionId: string })` returning `(await getSessionGPS(options.sessionId)) ?? null` (a query must not resolve `undefined`), `sessionGpsQueryKey({ sessionId })` -> `['session-gps', sessionId]`, `export const invalidateSessionGps = (queryClient: QueryClient): Promise<void> => queryClient.invalidateQueries({ queryKey: ['session-gps'] });`, `export const resetSessionGps = (queryClient: QueryClient): void => { queryClient.removeQueries({ queryKey: ['session-gps'] }); };`, and `useSessionGps(options: { sessionId: string; enabled: boolean }): UseQueryResult<QueryResults['sessionGps']>` with `staleTime: Infinity`. In `useSessionFitBounds.ts` delete `StoredBounds`, the `stored` state and the effect (`:5-8`, `:14`, `:17-27`); call `const sessionGps = useSessionGps({ sessionId: sessionId ?? '', enabled: gpsData === null && sessionId !== null });` and replace `if (stored?.sessionId === sessionId) return stored.bounds;` with `return sessionGps.data?.bounds ?? null;`. GPS writers invalidate: `useDeleteSessionMutation` gains `onSuccess: (_data, variables) => queryClient.removeQueries({ queryKey: sessionGpsQueryKey(variables) })` with `const queryClient = useQueryClient();`; `DeleteAllDataDialog.tsx` calls `resetSessionGps(queryClient);` beside `resetPersonalBests(queryClient);`; `loadDemoData.ts` calls `invalidateSessionGps(queryClient)` beside `invalidatePersonalBests(queryClient)` (`:56`); the GPS build (item 14) and reprocessing (item 15) invalidate it as well. Accepted behaviour change: the fallback bounds are cached per session, so the camera fit can arrive in a different frame.
    Check: `rg -n "useEffect" apps/web/src/features/map/hooks/useSessionFitBounds.ts` prints nothing; read every hit of `rg -n "saveSessionGPS|deleteSessionGPS|bulkReplaceSessionData|clearAllRecords" apps/web/src --glob '!**/lib/**' --glob '!**/*.worker.ts'` and confirm the flow that triggers it (demo load, session delete, reprocessing, delete all) invalidates or removes the `['session-gps']` queries; `vp check` passes; `vp run e2e` passes, pinned by `apps/web/e2e/map.spec.ts` `back from a session keeps the overview camera`.

13. Measure storage through a read module that refetches on every mount (R3).
    Files: new `apps/web/src/queries/settings/useStorageBreakdown.ts`; delete `apps/web/src/features/settings/hooks/useStorageBreakdown.ts`; `apps/web/src/features/settings/DataManagementSection.tsx`; `apps/web/src/types/index.ts`
    Change: move `estimateStorageUsage` and `interface StorageBreakdown` into the new module (export the interface) and add `storageBreakdown: StorageBreakdown;` to `QueryResults`. Fetcher `measureStorageBreakdown = async (): Promise<QueryResults['storageBreakdown']>` awaits `Promise.all([estimateStorageUsage(), measureStoreBytes()])` and runs today's derivation (`breakdownStorage`, the total fallback loop, `:33-40`) on the two results. Key `storageBreakdownQueryKey(options: { sessionCount: number })` -> `['storage-breakdown', options.sessionCount]`; hook `useStorageBreakdown(options: { sessionCount: number }): UseQueryResult<QueryResults['storageBreakdown']>` with `staleTime: 0`, so every mount of the Data section measures again (storage can change without the session count changing: weather cache, routes). `DataManagementSection.tsx:40` becomes `const storage = useStorageBreakdown({ sessionCount });` and reads `storage.data?.categories ?? null` / `storage.data?.total ?? null` where it read `storage.categories` / `storage.total` (`:60`, `:65`, `:92`, `:95`). Accepted behaviour change: reopening Settings › Data shows the last measured total at once and replaces it when the new measurement lands.
    Check: `test ! -e apps/web/src/features/settings/hooks/useStorageBreakdown.ts`; `vp check` passes; the before/after capture of Settings › Data shows a storage total and its breakdown.

14. Build and load the map's GPS tracks through a read module instead of the backfill effect (R3).
    Files: new `apps/web/src/queries/sessions/useSessionGpsTracks.ts`; delete `apps/web/src/features/map/hooks/useGpsBackfill.ts`; `apps/web/src/features/map/MapBackground.tsx`; test `apps/web/tests/features/map/hooks/useGpsBackfill.integration.test.ts` -> `apps/web/tests/queries/sessions/useSessionGpsTracks.integration.test.ts`; `apps/web/src/types/index.ts`
    Change: add `sessionGpsTracks: SessionGPS[];` to `QueryResults`. Fetcher `loadSessionGpsTracks = async (options: { detailedSessionIds: string[]; signal: AbortSignal; queryClient: QueryClient; onSettled: () => void }): Promise<QueryResults['sessionGpsTracks']>` holds the body of today's `run()` (`useGpsBackfill.ts:34-59`): read `getAllSessionGPS()`, compute the missing ids, and when some are missing start the `gpsBuild.worker.ts` worker (URL `new URL('../../features/map/gpsBuild.worker.ts', import.meta.url)`), resolve after its `onmessage` by re-reading `getAllSessionGPS()` and calling `invalidateSessionGps(options.queryClient)` (the worker wrote GPS), terminate it on `signal` abort and on error; call `options.onSettled()` exactly where today's code calls `finishTrackBuild()`. Key `sessionGpsTracksQueryKey(options: { detailedSessionIds: string[] })` -> `['session-gps-tracks', options.detailedSessionIds.join(',')]`. Hook `useSessionGpsTracks(): UseQueryResult<QueryResults['sessionGpsTracks']>` reads the sessions selector, derives the sorted ids of sessions with `hasDetailedRecords` in a `useMemo`, and calls `useQuery({ queryKey: sessionGpsTracksQueryKey({ detailedSessionIds }), queryFn: (ctx) => loadSessionGpsTracks({ detailedSessionIds, signal: ctx.signal, queryClient: ctx.client, onSettled: () => useImportProgressStore.getState().finishTrackBuild() }), enabled: !importing && !reprocessing, staleTime: Infinity, placeholderData: keepPreviousData })`. `MapBackground.tsx:35-36` reads `const gpsTracks = useSessionGpsTracks();` and passes `gpsTracks.data ?? null` where it passed the backfill's `gpsData` (`:36`, `:103`). Port the existing cancellation test to the new path and hook (render it inside a `QueryClientProvider`, assert that unmounting mid-read leaves `workers.live === 0`). Accepted behaviour change: tracks are built and cancelled on the query's schedule, and `keepPreviousData` keeps the previous tracks drawn while a new id set builds, so after import, reprocessing or delete the tracks can appear at a different moment.
    Check: `rg -n "useGpsBackfill|useGPSBackfill" apps/web` prints nothing; `vp test -- --run tests/queries/sessions/useSessionGpsTracks.integration.test.ts` (from `apps/web/`) passes; `vp run e2e` passes, pinned by `apps/web/e2e/map.spec.ts` `map shows a pointer cursor over a pickable track` (tracks drawn) and `apps/web/e2e/upload.spec.ts` (tracks after import); `vp run build` passes (the worker URL resolves).

15. Run the startup reprocessing and training-load recompute jobs as gated read modules instead of effects (R3).
    Files: new `apps/web/src/queries/sessions/useOutdatedSessionsReprocessing.ts`, new `apps/web/src/queries/sessions/useTrainingLoadRecompute.ts`; delete `apps/web/src/features/sessions/hooks/useSessionReprocessingEffect.ts` and `apps/web/src/features/sessions/hooks/useTrainingLoadRecomputeEffect.ts`; `apps/web/src/components/layout/AppLayout.tsx`; `apps/web/src/types/index.ts`; new test `apps/web/tests/queries/sessions/useTrainingLoadRecompute.integration.test.ts`
    Change: add `outdatedSessionsReprocessing: number; trainingLoadRecompute: true;` to `QueryResults`. Reprocessing module: fetcher `reprocessOutdated = async (options: { queryClient: QueryClient }): Promise<QueryResults['outdatedSessionsReprocessing']>` calling `reprocessOutdatedSessions()`; when the count is above 0 it calls `invalidatePersonalBests(options.queryClient)`, `invalidateSessionGps(options.queryClient)` and `options.queryClient.invalidateQueries` for `['session-gps-tracks']`, `['session-records']` and `['session-laps']` (reprocessing rewrites records, laps and GPS without changing the id set); on rejection `console.error('Reprocessing sessions failed:', err)` and rethrow. Key `outdatedSessionsReprocessingQueryKey()` -> `['outdated-sessions-reprocessing']`. Hook `useOutdatedSessionsReprocessing(): UseQueryResult<QueryResults['outdatedSessionsReprocessing']>` with `enabled: useSessionReprocessingStore((s) => s.phase === 'pending')`, `queryFn: (ctx) => reprocessOutdated({ queryClient: ctx.client })`, `staleTime: Infinity`, `gcTime: Infinity`, `retry: false`. Recompute module: key `trainingLoadRecomputeQueryKey(options: { hrSignature: string; ftpSignature: string })` -> `['training-load-recompute', options.hrSignature, options.ftpSignature]`, fetcher calling `recomputeTrainingLoad()` and resolving `true` (log `'Recomputing training load failed:'` and rethrow on failure), hook `useTrainingLoadRecompute(): UseQueryResult<QueryResults['trainingLoadRecompute']>` reading the same three store values `useTrainingLoadRecomputeEffect.ts:10-12` reads today, `enabled: phase === 'done'`, `staleTime: Infinity`, `retry: false`; the `recomputedFor` ref and the comment lines go away (the key carries the signature; a failed run stays an errored query until the next start, as the ref reset made it today). `AppLayout.tsx:17-18,67-68` imports and calls `useOutdatedSessionsReprocessing();` and `useTrainingLoadRecompute();`. Accepted behaviour change: both jobs run on the query's schedule, failures become query errors, and the reprocessing overlay can open or close in a different frame. New test `useTrainingLoadRecompute.integration.test.ts`: `recomputes the training load again after the threshold HR changes` — with the reprocessing phase `done` and the sessions and profile set up as in `apps/web/tests/features/sessions/recomputeTrainingLoad.integration.test.ts` `re-scores HR loads from the records after a threshold HR change and keeps ride TSS`, render the hook inside a `QueryClientProvider`, change the profile's threshold HR, and expect the run's stored load to be re-scored.
    Check: `rg -n "useSessionReprocessingEffect|useTrainingLoadRecomputeEffect" apps/web` prints nothing; `vp test -- --run tests/queries/sessions tests/features/sessions` (from `apps/web/`) passes; `vp run e2e` passes.

16. Name every remaining effect after the external system it synchronises with by moving it into its own `use<Thing>Effect` module.
    Files: `apps/web/src/pages/TripDetailPage.tsx`, `apps/web/src/pages/SessionDetailPage.tsx`, `apps/web/src/components/layout/AppLayout.tsx`, `apps/web/src/components/ImportProgressOverlay.tsx`, `apps/web/src/features/onboarding/OnboardingFlow.tsx`, `apps/web/src/features/sessions/session/SessionMapControls.tsx`, `apps/web/src/features/map/MapBackground.tsx`, `apps/web/src/features/studio/charts/RouteChartsExplorer.tsx`, `apps/web/src/features/sessions/charts/SessionChartsExplorer.tsx`, and the new modules listed below
    Change: cut each inline effect into a module returning `void`, body unchanged, and call it where the effect was:
    - `TripDetailPage.tsx:22-27` -> `apps/web/src/features/trips/hooks/useTripMapFocusEffect.ts`, `useTripMapFocusEffect(sessionIds: string[] | undefined): void`.
    - `SessionDetailPage.tsx:23-27` -> `apps/web/src/features/sessions/session/hooks/useMarkSessionSeenEffect.ts`, `useMarkSessionSeenEffect(sessionId: string | undefined): void`.
    - `AppLayout.tsx:40-46` -> `apps/web/src/components/layout/useOverscrollLockEffect.ts` (loose: sole consumer in the same directory), `useOverscrollLockEffect(): void`.
    - `ImportProgressOverlay.tsx:116,122-126` -> `apps/web/src/components/useMinOpenTimeReached.ts` (loose), `useMinOpenTimeReached(openedAt: number): boolean` owning the `minTimeReached` state and the timeout.
    - `OnboardingFlow.tsx:142-144` (`features/onboarding/index.tsx` with the component `Onboarding` after component-declaration-shape item 12) -> `apps/web/src/features/onboarding/hooks/useRevealOnboardingPreviewEffect.ts`, `useRevealOnboardingPreviewEffect(): void`.
    - `SessionMapControls.tsx:20-22` -> `apps/web/src/features/sessions/session/hooks/useTrackColorModeEffect.ts`, `useTrackColorModeEffect(mode: <the type of coloring.effective>): void`.
    - `MapBackground.tsx:47-49` -> `apps/web/src/features/map/hooks/useOpenedSessionEffect.ts`, `useOpenedSessionEffect(sessionId: string | null): void` (MapBackground passes `match?.params.id ?? null`, or the routing plan's `useRouteMatch` result once that runs).
    - `RouteChartsExplorer.tsx:79-85` -> `apps/web/src/features/studio/hooks/useClearRouteChartHoverEffect.ts`, `useClearRouteChartHoverEffect(group: string): void`.
    - `SessionChartsExplorer.tsx:187-194` -> `apps/web/src/features/sessions/hooks/useClearSessionChartHoverEffect.ts`, `useClearSessionChartHoverEffect(group: string): void`.
    Check: `rg -n "useEffect\(" apps/web/src --glob '*.tsx' --glob '!**/hooks/**'` prints nothing (no effect left inline in a component module; if the one-hook-per-file plan has not run yet, the `useHeldReprocess` hit in `components/ImportProgressOverlay.tsx` is expected); `vp lint apps/web/src 2>&1 | rg -c "exhaustive-deps"` prints `0`; `vp check`, `vp test -- --run` and `vp run e2e` pass.

17. (packages/ui) Add the hook library to the kit.
    Files: `packages/ui/package.json`, `pnpm-lock.yaml`
    Change: from the repo root run `vp add react-use --filter @pacevault/ui`.
    Check: `rg -n '"react-use"' packages/ui/package.json` prints one line; `vp check` passes.

18. (packages/ui) Replace the bottom sheet's resize listener with `useEvent` in a layout hook.
    Files: new `packages/ui/src/hooks/useSheetLayout.ts`; `packages/ui/src/lib/sheetPosition.ts`, `packages/ui/src/components/BottomSheet.tsx`
    Change: export the `SheetLayout` interface from `lib/sheetPosition.ts:9` (now read by a second module). `useSheetLayout.ts`: `export const useSheetLayout = (): SheetLayout => { const [layout, setLayout] = useState(readSheetLayout); const handleResize = useCallback(() => setLayout(readSheetLayout()), []); useEvent('resize', handleResize); return layout; };` (`import { useEvent } from 'react-use';` — its default target is `window`, and the stable handler subscribes once, as the effect did). `BottomSheet.tsx:56` `const [layout, setLayout] = useState(readSheetLayout);` → `const layout = useSheetLayout();`; delete the effect at `:71-75`.
    Check: `rg -n "addEventListener\('resize'" packages/ui/src` prints nothing; `vp run check` and `vp run test` pass; `vp run e2e` passes (mobile sheet).

19. (packages/ui) Move the remaining inline kit effects into `use<Thing>Effect` modules.
    Files: new `packages/ui/src/hooks/useSheetPeekActiveEffect.ts`, `packages/ui/src/hooks/useSheetAboveMotionEffect.ts`, `packages/ui/src/hooks/useSheetSpringEffect.ts`; `packages/ui/src/components/SheetPeek.tsx`, `packages/ui/src/components/BottomSheet.tsx`
    Change: cut each effect into its own module returning `void`, body and dependency list unchanged:
    - `SheetPeek.tsx:16-19` → `useSheetPeekActiveEffect(setActive: (active: boolean) => void): void` (registers the peek's presence with the sheet provider), called as `useSheetPeekActiveEffect(peek.setActive)`.
    - `BottomSheet.tsx:66-69` → `useSheetAboveMotionEffect({ registerMotion, y, height }: { registerMotion: (motion: SheetAboveMotion | null) => void; y: MotionValue<number>; height: number }): void` (publishes the sheet's motion to the provider for `SheetAbove`); export `SheetAboveMotion` from wherever the sheet-above context lives when this runs.
    - `BottomSheet.tsx:77-80` → `useSheetSpringEffect({ y, layout, position }: { y: MotionValue<number>; layout: SheetLayout; position: number }): void`, dependency list `[y, layout, position]` exactly as today, so the spring restarts on the same changes.
    Check: `rg -n "useEffect" packages/ui/src/components` prints nothing; `vp run check` and `vp run test` pass; `vp run e2e` passes.

### tools/workbench

The board island's effects all synchronise with something outside React (the mockup iframe, the tech tab's DOM script and animation frames, a timer, Vite's hot channel), so R1 holds; what changes is where they sit (R6) and, for the mockup message and the write card's close timer, the react-use form (R4). The hooks go into `tools/workbench/site/src/app/hooks/` (hook-directory-placement) with a `: void` return type (the write card's close-timer hook returns its hover handlers instead), taking one object parameter.

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

**Board check** (items that touch `site/`): with the board on `http://localhost:4321` (reuse a running board, `lsof -iTCP -sTCP:LISTEN -P | grep :4321`; start one with `vp run workbench` only when none runs, and stop it afterwards), before the item run `vp -C tools/workbench exec playwright screenshot --viewport-size=1512,860 --wait-for-timeout=3000 http://localhost:4321 <dir>/board-before.png`, after it the same into `<dir>/board-after.png`, and compare with `uv run --no-project --with pillow python -c "import sys;from PIL import Image,ImageChops;print(ImageChops.difference(Image.open(sys.argv[1]).convert('RGBA'),Image.open(sys.argv[2]).convert('RGBA')).getbbox())" <dir>/board-before.png <dir>/board-after.png`, which must print `None`. Then open an item with all four tabs, walk Mockup, Plan, Tech (Planned | Actual switch, Full screen) and Review, open Answer… on a question and close it, and confirm by eye that nothing looks or behaves differently beyond the accepted change an item names.

**Suite**: `vp check` from `tools/workbench/` is clean, `vp run -F @pacevault/workbench check` passes (astro sync + astro check), and `vp test -- --run` from `tools/workbench/` passes 66 tests (13 spec files today; a later item that splits a spec changes the file count, never the test count).

20. (tools/workbench) Add `react-use` to the workbench.
    Files: `tools/workbench/package.json`
    Change: from the repo root run `vp add react-use --filter @pacevault/workbench` (adds `"react-use"` to `dependencies`).
    Check: `rg -n '"react-use"' tools/workbench/package.json` prints one line; `vp check` from `tools/workbench/` is clean.

21. (tools/workbench) Move the island's inline effects into hook modules and run the write card's close timer on `useTimeoutFn` (R1, R4, R6, R7).
    Files: `tools/workbench/site/src/app/MockupPane.tsx`, `tools/workbench/site/src/app/TechPane.tsx`, `tools/workbench/site/src/app/WriteCard.tsx`; new `tools/workbench/site/src/app/hooks/useMockupQuestionsMessageEffect.ts`, `tools/workbench/site/src/app/hooks/useTechDiagramsEffect.ts`, `tools/workbench/site/src/app/hooks/useTechRefitEffect.ts`, `tools/workbench/site/src/app/hooks/useWriteCardCloseTimer.ts`
    Change:
    - `MockupPane.tsx:17-22` (the `shown` ref and the effect that posts `{ wbQuestions: true }` when the question states differ from the last ones) → `useMockupQuestionsMessageEffect({ frame, questionStates: states })`, whose body is `useUpdateEffect(() => { frame.current?.contentWindow?.postMessage({ wbQuestions: true }, '*'); }, [questionStates]);` with `useUpdateEffect` from `react-use`. It skips the first render, as the ref did, and runs on every later change of the string, which is exactly when today's guard let the message through.
    - `TechPane.tsx:36-40` → `useTechDiagramsEffect({ pane, techHtml, actualHtml, folder: props.item.folder, expand: setFull })`, body unchanged with `initTech(element, expand)`, dependencies `[techHtml, actualHtml, folder, expand]` (`expand` is React's stable state setter, so the effect runs exactly when it does today); `TechPane.tsx:42-47` → `useTechRefitEffect({ pane, expanded: props.expanded, active: props.active })`, body and cleanup unchanged, dependencies `[pane, expanded, active]` (`pane` is a ref object and never changes).
    - `WriteCard.tsx:123-134` (the `setTimeout` loop that re-arms every `HOLD_MS` while `hovering.current` is set) and the `hovering` ref (`:121`) → `useWriteCardCloseTimer({ latestId, hide: setHidden })` in `hooks/useWriteCardCloseTimer.ts`, which moves `SHOW_MS` (`WriteCard.tsx:12`) into the module, deletes `HOLD_MS` (`:13`) and the comment above them (`:11`), and returns the card's hover handlers:

      ```ts
      interface WriteCardHoverHandlers {
        onMouseEnter: () => void;
        onMouseLeave: () => void;
      }

      export const useWriteCardCloseTimer = (options: { latestId: number | undefined; hide: (id: number) => void }): WriteCardHoverHandlers => {
        const [, cancel, restart] = useTimeoutFn(() => {
          if (options.latestId !== undefined) options.hide(options.latestId);
        }, SHOW_MS);
        useUpdateEffect(() => {
          restart();
        }, [options.latestId]);
        return { onMouseEnter: cancel, onMouseLeave: restart };
      };
      ```

      (`useTimeoutFn` and `useUpdateEffect` from `react-use`; `useTimeoutFn` keeps the latest callback, so it hides the current `latestId`). `WriteCard` calls `const closeTimer = useWriteCardCloseTimer({ latestId, hide: setHidden });` and passes `onMouseEnter={closeTimer.onMouseEnter}` / `onMouseLeave={closeTimer.onMouseLeave}` to the `Card` in place of the two inline handlers (`:144-149`). Accepted behaviour change: hovering stops the timer, and leaving restarts the full `SHOW_MS`, so a hovered card closes 12 s after the pointer leaves instead of within 2 s of it; a new write arriving while the card is hovered restarts the timer.
    Each component calls its hook where the effect stood; nothing else in it changes.
    Check: `rg -n "useEffect|setTimeout" tools/workbench/site/src/app --glob '!hooks/**'` prints nothing; `rg -n "useEffect|useUpdateEffect" tools/workbench/site/src/app/hooks` lists the four new modules and `useBoardChangedEffect.ts`; workbench check; board check, and by hand: expand and collapse the panel on the Tech tab and see the diagrams refit; reload the Mockup tab and see the mockup keep its badges; answer a question, keep the pointer on the write card for more than 12 s (it stays), move it away and see the card close 12 s later.

## Open items

- `packages/ui` R1 judgement: `useSheetPeekActiveEffect` and `useSheetAboveMotionEffect` synchronise with state the sheet provider owns outside the registering component (an external store from that component's point of view), the same reading as the app's store-publishing effects above; they stay effects.
- R2 judgement kept as external-store synchronisation, not changed: the effects that publish route-scoped values into a zustand store the map reads from outside the route subtree — `useTripMapFocusEffect`, `useOpenedSessionEffect`, `useTrackColorModeEffect`, `features/sessions/session/hooks/useSessionLapsEffect.ts`, `features/map/hooks/useOverviewMapControlsEffect.ts` — and the persisted writes `useMarkSessionSeenEffect` and `features/labs/hooks/useCoachPlan.ts:62-66` (plan cache). The opened-session and trip-focus mirrors could instead be derived from the router (`useRouteMatch('sessionDetail')`, `useRouteMatch('tripDetail')`) once the navigation plan has run; that removes two store fields and is a candidate follow-up.
- R3 scope: the click-time reads in `features/studio/hooks/useStudioMapPopup.ts`, `features/studio/hooks/useStudioRouteExport.ts` and `features/sessions/session/hooks/useSessionExport.ts` run in event handlers, not effects, and stay as they are here; moving them to `queryClient.fetchQuery` with the read modules' key builders and fetchers is the one-server-call plan's follow-up.
- R4 left as raw effects because the purpose-built hook cannot express them: `features/map/hooks/useSuppressTapMouseEffect.ts` (passive-false listener on a map canvas reached through a ref after load), `features/sessions/hooks/useFileDropEffect.ts` (four document listeners registered as one unit), the animation-frame loops in `features/map/hooks/useOnboardingPreviewLayer.ts` and `features/map/hooks/useOnboardingPreviewCameraEffect.ts`, and the timers in `components/useHeldReprocess.ts`, `features/labs/hooks/useCoachPlan.ts:26-32`. From the 3D map: `features/map/hooks/useTerrainOrbitEffect.ts` (two capture-phase listeners on the map container and two `window` listeners registered as one unit around a shared gesture), and the MapLibre instance subscriptions (`map.on`, not DOM listeners) in `useTerrainTrackPickingEffect.ts`, `useTerrainLineEffect.ts` (`whenLineRendered`) and `useMapCameraEffect.ts` (`useCameraRuns`), which no react-use hook covers.
- R5 already holds: every registering effect (`useFileDropEffect`, `useWatchPositionEffect`, `useTripMapFocusEffect`, `useSessionLapsEffect`, the chart-hover cleanups) returns a cleanup that unregisters or clears what it set. So do the 3D map effects (`useMapTerrainEffect`, `useTerrainLineEffect`, `useTerrainHoverPointEffect`, `useTerrainLapStateEffect`, `useTerrainOrbitEffect`, `useCameraRuns` in `useMapCameraEffect.ts`), with one gap left to the owner: `useTerrainTrackPickingEffect.ts:107-115` resets `terrainTrackHovered` on cleanup but not the `hoveredLapIndex` its `onMove` sets (`:74`); clearing it there changes when a lap preview disappears, so it is not a step here.
- R7 (exhaustive dependency arrays) has no violations today (`vp lint apps/web/src` reports zero `react-hooks/exhaustive-deps` warnings); the gate is `warn`, and raising it to `error` is a tooling proposal.
- `tools/workbench`: `useBoardChangedEffect` listens on Vite's hot channel, which no react-use hook covers.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
