---
id: one-server-call-per-hook-module
tdr_reference: tdr/one-server-call-per-hook-module.md
depends_on: [hook-directory-placement, one-hook-per-file]
generated: 2026-10-23
---

# One server call per module, split into fetcher, key and hook

Read `tdr/one-server-call-per-hook-module.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`hook-directory-placement`](hook-directory-placement.md) — moves the five existing read hooks into `apps/web/src/queries/` unchanged; every item below starts from those new paths.

"Server" here means every I/O boundary the app talks to: IndexedDB (`apps/web/src/lib/indexeddb.ts`, `apps/web/src/lib/weatherDb.ts`), Open-Meteo (`apps/web/src/lib/weather.ts`) and intervals.icu (`apps/web/src/lib/intervals.ts`). If the authenticated-fetch plan has already run, `verifyIntervalsKey` resolves `void` and throws on failure; the items below are written so they hold either way.
- [`one-hook-per-file`](one-hook-per-file.md) — splits the workbench write hooks into the two modules item 11 renames.

## Changes

1. Add the shared result-type registry the read hooks annotate against.
   Files: `apps/web/src/types/index.ts`, `apps/web/src/features/intervals/runIntervalsSync.ts`
   Change: Export the sync summary type: `interface IntervalsSyncSummary` (`runIntervalsSync.ts:15`) becomes `export interface IntervalsSyncSummary`. Append to `apps/web/src/types/index.ts`:

   ```ts
   import type { PersonalBest } from '@pacevault/engine/types.ts';
   import type { PreviewPasses } from '@/features/map/previewDrawIn.ts';
   import type { SessionWeather } from '@/lib/weather.ts';
   import type { IntervalsSyncSummary } from '@/features/intervals/runIntervalsSync.ts';

   export interface QueryResults {
     onboardingPreviewRoutes: PreviewPasses;
     sessionWeather: SessionWeather | null;
     personalBests: PersonalBest[];
     intervalsKeyCheck: true;
     intervalsSync: IntervalsSyncSummary;
   }
   ```

   (merge the imports with the ones the file already has; use `void` instead of `true` for `intervalsKeyCheck` if the authenticated-fetch plan already ran). Every later read hook adds its payload here.
   Check: `vp check` passes; `rg -n "export interface QueryResults" apps/web/src/types/index.ts` prints one line.

2. Reshape the onboarding preview read into fetcher, key builder and annotated hook.
   Files: `apps/web/src/queries/onboarding/useOnboardingPreviewRoutes.ts`
   Change: Keep `loadPreviewRoutes` as the named top-level fetcher but export it as `export const loadOnboardingPreviewRoutes = async (): Promise<QueryResults['onboardingPreviewRoutes']> => ...`. Add `export const onboardingPreviewRoutesQueryKey = (): string[] => ['onboarding-preview-routes'];`. The hook becomes `export const useOnboardingPreviewRoutes = (): UseQueryResult<QueryResults['onboardingPreviewRoutes']> => ...` with `queryKey: onboardingPreviewRoutesQueryKey()` and `queryFn: loadOnboardingPreviewRoutes`. Delete the JSDoc comment above the hook (no comments in this codebase).
   Check: `rg -n "queryKey:\s*\[" apps/web/src/queries/onboarding` prints nothing; `vp check` passes.

3. Reshape the session weather read and give the hook a single options object.
   Files: `apps/web/src/queries/weather/useSessionWeather.ts`, callers `apps/web/src/features/sessions/session/WeatherCard.tsx:129`, `apps/web/src/features/sessions/session/hooks/useSessionColorModes.ts:13`, `apps/web/src/features/map/hooks/useSessionDetailPath.ts:33`
   Change: `loadWeather(sessionId, sessionDateMs, durationSec)` becomes `export const loadSessionWeather = async (options: { sessionId: string; sessionDateMs: number; durationSec: number }): Promise<QueryResults['sessionWeather']> => ...` (body unchanged, reads `options.x`). Add `export const sessionWeatherQueryKey = (options: { sessionId: string }): string[] => ['session-weather', options.sessionId];`. Hook: `export const useSessionWeather = (options: { sessionId: string; sessionDateMs: number; durationSec: number }): UseQueryResult<QueryResults['sessionWeather']> => useQuery({ queryKey: sessionWeatherQueryKey({ sessionId: options.sessionId }), queryFn: () => loadSessionWeather(options), enabled: options.sessionId !== '' && options.durationSec > 0, staleTime: Infinity, retry: false })`. Callers pass `{ sessionId: props.session.id, sessionDateMs: props.session.date, durationSec: props.session.duration }` (and the equivalent `session.*` / `openedSession?.*` values already passed positionally at the other two sites).
   Check: `rg -n "useSessionWeather\([^{]" apps/web/src` prints nothing; `vp check` passes; `vp run e2e` passes (the weather card is covered by `apps/web/e2e/helpers/openMeteo.ts`).

4. Reshape the personal-bests read: explicit inputs for the fetcher, a key builder for every cache helper.
   Files: `apps/web/src/queries/records/usePersonalBests.ts`, `apps/web/tests/queries/records/usePersonalBests.spec.ts`, `apps/web/tests/features/sessions/createIngestBatcher.integration.test.ts`
   Change: Replace `export const PERSONAL_BESTS_KEY = ['personal-bests'];` with `export const personalBestsQueryKey = (): string[] => ['personal-bests'];` and use it in `useQuery`, `invalidatePersonalBests`, `invalidatePersonalBestsOfSession` and `resetPersonalBests`. `computePersonalBests(signal)` stops reading the store: it becomes `export const computePersonalBests = (options: { sessions: PBSessionMeta[]; signal: AbortSignal }): Promise<QueryResults['personalBests']>`; the `useSessionsStore.getState().sessions.filter(...).map(...)` block moves into a pure `const toPersonalBestSessions = (sessions: TrainingSession[]): PBSessionMeta[]` in the same module. The hook is the only part touching the store: `export const usePersonalBests = (): UseQueryResult<QueryResults['personalBests']> => useQuery({ queryKey: personalBestsQueryKey(), queryFn: (ctx) => computePersonalBests({ sessions: toPersonalBestSessions(useSessionsStore.getState().sessions), signal: ctx.signal }), staleTime: Infinity, gcTime: Infinity })` (read at fetch time, because `createIngestBatcher.ts:127` invalidates right after a store write, before any re-render). Tests: replace `PERSONAL_BESTS_KEY` with `personalBestsQueryKey()` in both spec files.
   Check: `rg -n "PERSONAL_BESTS_KEY" apps/web` prints nothing; `vp test -- --run tests/queries/records tests/features/sessions/createIngestBatcher.integration.test.ts` (from `apps/web/`) passes.

5. Reshape the intervals key check: options-object hook, named key builder, no inline throw wrapper.
   Files: `apps/web/src/queries/intervals/useIntervalsKeyCheck.ts`, `apps/web/src/features/intervals/IntervalsConnectionForm.tsx`
   Change: `intervalsVerifyQueryKey(apiKey)` becomes `export const intervalsKeyCheckQueryKey = (options: { apiKey: string }): string[] => ['intervals-verify', options.apiKey];`. `verifyIntervalsKeyOrThrow(apiKey)` becomes `export const checkIntervalsKey = async (options: { apiKey: string }): Promise<QueryResults['intervalsKeyCheck']> => ...` (same body while `verifyIntervalsKey` still returns a result union; a one-line `verifyIntervalsKey(options.apiKey)` once it throws). Hook: `export const useIntervalsKeyCheck = (options: { apiKey: string; savedKey: string | null }): UseQueryResult<QueryResults['intervalsKeyCheck']>` with `queryKey: intervalsKeyCheckQueryKey({ apiKey: options.apiKey })`, `queryFn: () => checkIntervalsKey({ apiKey: options.apiKey })`, `enabled: options.apiKey !== '' && options.apiKey !== options.savedKey`. `IntervalsConnectionForm.tsx:57` calls `useIntervalsKeyCheck({ apiKey: candidateKey, savedKey: storedKey })`; its `fetchQuery` at `:80-85` uses `intervalsKeyCheckQueryKey({ apiKey: trimmed })` and `() => checkIntervalsKey({ apiKey: trimmed })`.
   Check: `rg -n "intervalsVerifyQueryKey|verifyIntervalsKeyOrThrow" apps/web` prints nothing; `vp check` passes.

6. Reshape the intervals sync job read: key builder instead of a constant array, annotated hook.
   Files: `apps/web/src/queries/intervals/useIntervalsSync.ts`, `apps/web/src/features/intervals/IntervalsStatusLine.tsx:6,36`, `apps/web/src/features/intervals/IntervalsConnectionForm.tsx:16,96,99,105`
   Change: `export const INTERVALS_SYNC_KEY = ['intervals-sync'];` becomes `export const intervalsSyncQueryKey = (): string[] => ['intervals-sync'];`. Hook: `export const useIntervalsSync = (): UseQueryResult<QueryResults['intervalsSync']> => ...` with `queryKey: intervalsSyncQueryKey()`; `queryFn` stays a forwarding arrow to the named `runIntervalsSync` (`(ctx) => runIntervalsSync({ queryClient: ctx.client, ... })`; if the authenticated-fetch plan has run, it also forwards `apiKey`). Replace every `INTERVALS_SYNC_KEY` with `intervalsSyncQueryKey()`.
   Check: `rg -n "INTERVALS_SYNC_KEY" apps/web` prints nothing; `rg -n "^export const use[A-Za-z0-9]+ = \([^)]*\) =>" apps/web/src/queries` prints nothing (every hook annotated); `vp test -- --run` and `vp run e2e` pass.

7. Move the session delete I/O into a write module.
   Files: new `apps/web/src/mutations/sessions/useDeleteSessionMutation.ts`, `apps/web/src/features/sessions/session/DeleteSessionDialog.tsx`
   Change: New module with a module-local fetcher `const deleteSessionData = async (options: { sessionId: string }): Promise<void> => { await Promise.all([deleteSessionRecords(options.sessionId), deleteSessionLaps(options.sessionId), deleteSessionGPS(options.sessionId), deleteSessionWeather(options.sessionId), deleteFitFile(options.sessionId)]); };` (imports from `@/lib/indexeddb.ts` and `@/lib/weatherDb.ts`) and `export const useDeleteSessionMutation = (): UseMutationResult<void, Error, { sessionId: string }> => useMutation({ mutationFn: deleteSessionData });`. In `DeleteSessionDialog.tsx` call `const deleteSession = useDeleteSessionMutation();` and replace the `await Promise.all([...])` block (`:65-71`) with `await deleteSession.mutateAsync({ sessionId: props.session.id });`; the click handler stays `async`, so a failed IndexedDB delete still surfaces as an unhandled rejection as it does today; the store updates, PB invalidation and navigation before it stay in the handler. Drop the now-unused `@/lib/indexeddb.ts` and `@/lib/weatherDb.ts` imports from the dialog.
   Check: `rg -n "lib/(indexeddb|weatherDb)" apps/web/src/features/sessions/session/DeleteSessionDialog.tsx` prints nothing; `rg -n "deleteSession\.mutateAsync" apps/web/src/features/sessions/session/DeleteSessionDialog.tsx` prints one line; `vp run e2e` passes (session delete journey).

8. Move the studio route delete I/O into a write module.
   Files: new `apps/web/src/mutations/studio/useDeleteStudioRouteMutation.ts`, `apps/web/src/features/studio/DeleteStudioRouteDialog.tsx`
   Change: New module: `const deleteStudioRouteData = async (options: { routeId: string }): Promise<void> => { await deleteStudioRoutePoints(options.routeId); };` and `export const useDeleteStudioRouteMutation = (): UseMutationResult<void, Error, { routeId: string }> => useMutation({ mutationFn: deleteStudioRouteData });`. In the dialog call `const deleteStudioRoute = useDeleteStudioRouteMutation();`; `handleDelete` (`DeleteStudioRouteDialog.tsx:21-26`) becomes synchronous:

   ```tsx
   const handleDelete = () => {
     useStudioStore.getState().deleteStudioRoute(props.routeId);
     deleteStudioRoute.mutate({ routeId: props.routeId });
     props.onOpenChange(false);
     props.onDeleted?.();
   };
   ```

   The `.catch(() => undefined)` goes away: the dialog closes and `onDeleted` runs right after the store delete, without waiting for the IndexedDB points delete, and a failed points delete becomes the mutation's error state instead of being swallowed. Drop the now-unused `@/lib/indexeddb.ts` import.
   Check: `rg -n "deleteStudioRoutePoints|async \(\)|catch\(" apps/web/src/features/studio/DeleteStudioRouteDialog.tsx` prints nothing; `vp check` passes; `apps/web/e2e/studio.spec.ts` "imports a GPX route, opens its detail page, edits and deletes it" (`:26`) pins the new flow: after Delete it reaches `/labs?tab=studio` and the route is gone; the workbench review round shows the dialog closing at once (before/after capture of the delete flow).

9. Move the "delete all data" I/O into a write module.
   Files: new `apps/web/src/mutations/settings/useClearAllDataMutation.ts`, `apps/web/src/features/settings/DeleteAllDataDialog.tsx`
   Change: New module: `export const useClearAllDataMutation = (): UseMutationResult<void, Error, void> => useMutation({ mutationFn: clearAllRecords });` (`clearAllRecords` from `@/lib/indexeddb.ts` is already a named top-level async function). In the dialog call `const clearAllData = useClearAllDataMutation();` and delete the `isDeleting` state (`:33`). `handleDelete` stops being `async` and drops `setIsDeleting(true)`/`setIsDeleting(false)`: the store resets at `:41-50` stay as they are, then `await clearAllRecords();` and the three lines after it (`:51-55`) become

   ```tsx
   clearAllData.mutate(undefined, {
     onSuccess: () => {
       props.onOpenChange(false);
       toast(m.ui_delete_dialog_toast(), undefined, 'success');
       navigate('/');
     },
   });
   ```

   (if the snackbar plan has already replaced the `toast(...)` call, keep its replacement inside `onSuccess`). Every other `isDeleting` read — `handleOpenChange` (`:59`), `onEscapeKeyDown` (`:67`), `onPointerDownOutside` (`:70`), the cancel button's `disabled` (`:95`), the confirm button's `loading` (`:103`) and its label (`:106`) — reads `clearAllData.isPending`. A failed `clearAllRecords` now unlocks the dialog and leaves it open instead of keeping it locked with a spinning button. Drop the now-unused `useState` and `clearAllRecords` imports from the dialog.
   Check: `rg -n "isDeleting|clearAllRecords|useState" apps/web/src/features/settings/DeleteAllDataDialog.tsx` prints nothing; `vp check` passes; `vp test -- --run tests/store/deleteAllData.integration.test.ts` (from `apps/web/`) still passes (it pins what the delete clears); no spec renders the dialog (`apps/web/tests/CLAUDE.md`: no render tests), so the pending, close, toast and navigate sequence is confirmed in the workbench review round (before/after capture of Settings › Data › Delete all data, including the disabled state while pending).

10. Move the intervals.icu connect import into a write module.
   Files: new `apps/web/src/mutations/intervals/useConnectIntervalsMutation.ts`, `apps/web/src/features/intervals/IntervalsConnectionForm.tsx`
   Change: New module, written against item 6's key builder:

   ```ts
   const syncAfterConnect = async (options: { queryClient: QueryClient }): Promise<IntervalsSyncSummary> => {
     if (options.queryClient.getQueryState(intervalsSyncQueryKey())?.fetchStatus === 'fetching') {
       await options.queryClient
         .fetchQuery({
           queryKey: intervalsSyncQueryKey(),
           queryFn: () => runIntervalsSync({ queryClient: options.queryClient }),
         })
         .catch(() => undefined);
     }
     return options.queryClient.fetchQuery({
       queryKey: intervalsSyncQueryKey(),
       queryFn: () => runIntervalsSync({ queryClient: options.queryClient, full: true, foreground: true }),
       staleTime: 0,
     });
   };

   export const useConnectIntervalsMutation = (): UseMutationResult<IntervalsSyncSummary, Error, void> => {
     const queryClient = useQueryClient();
     return useMutation({ mutationFn: () => syncAfterConnect({ queryClient }) });
   };
   ```

   (`IntervalsSyncSummary` exported by item 1; if the authenticated-fetch plan has run, both `runIntervalsSync` calls also forward the `apiKey` the way item 6's `queryFn` does). The body is today's `IntervalsConnectionForm.tsx:96-108`, moved unchanged. In the form call `const connect = useConnectIntervalsMutation();` and, inside the existing second `try` (`:95`), replace those lines with `const summary = await connect.mutateAsync();`. Everything else in `handleImport` stays: the key verification `fetchQuery` in the first `try` (item 5's `intervalsKeyCheckQueryKey` and `checkIntervalsKey`), `setManual(true)`/`setManual(false)` and the `manual` state, `beginImport`, `connectIntervals`, the `finishImport` branches, `onSynced` and both `catch` blocks. The import overlay, the `onSynced` call and the button/input disabled timing are unchanged, and a thrown sync still lands in the second `catch`. Drop the `runIntervalsSync` and `intervalsSyncQueryKey` imports from the form.
   Check: `rg -n "runIntervalsSync|intervalsSyncQueryKey" apps/web/src/features/intervals/IntervalsConnectionForm.tsx` prints nothing; `rg -n "useState\(false\)" apps/web/src/features/intervals/IntervalsConnectionForm.tsx` still prints the `manual` line; `vp check` passes; `vp test -- --run tests/features/intervals` (from `apps/web/`) passes; `apps/web/e2e/intervals.spec.ts` "intervals.icu onboarding: profile + key, then import" (`:47`) and "a rejected key shows in the status line and blocks the import" (`:157`) pass.

### tools/workbench

The board island reads and writes through the dev server's Astro actions, not through `queries/` and `mutations/` trees: its one read is `board.read` (query key `['board']`), its writes are the form actions run by `useWrite` and the `undo` action. Their hooks live in `tools/workbench/site/src/app/hooks/` (hook-directory-placement), split one per module by the one-hook-per-file plan. R1, R3, R6, R7 and R8 apply to them; R2, R4, R5 and R9–R12 name app trees, app stores and the app's `QueryResults` registry and have no subject here.

11. (tools/workbench) One key builder for the board query, named request functions and `Mutation` hook names (R3, R6, R7, R8).
   Files: `tools/workbench/site/src/app/hooks/useBoard.ts`, `tools/workbench/site/src/app/hooks/useBoardChangedEffect.ts`, `tools/workbench/site/src/app/hooks/boardRefetch.ts`, `tools/workbench/site/src/app/hooks/useWrite.ts` → `useWriteMutation.ts`, `tools/workbench/site/src/app/hooks/useUndo.ts` → `useUndoMutation.ts`; importers `tools/workbench/site/src/app/{AnswerDialog,CheckRow,Columns,ItemPanel,NeedsYou,QuestionRow,ReviewPane,WriteCard}.tsx`
   Change:
   - `useBoard.ts` gains `export const boardQueryKey = () => ['board'] as const;` and the named read `const fetchBoard = () => actions.board.read.orThrow();` (no parameter, so TanStack's query context never reaches `orThrow`, as the arrow at `:12` ensures today); `boardQueryOptions` reads `queryKey: boardQueryKey(), queryFn: fetchBoard`.
   - `useBoardChangedEffect.ts:21` and `boardRefetch.ts` (`refetchBoard`) call `queryClient.invalidateQueries({ queryKey: boardQueryKey() })`; nobody writes `['board']` inline any more.
   - `useUndo`'s inline `mutationFn` becomes the module-local `const runUndo = async (write: WriteResult): Promise<WriteResult> => { … }` with today's body, passed as `mutationFn: runUndo` (`runWrite` in `useWrite.ts` is already named).
   - `useWrite` → `useWriteMutation` in `hooks/useWriteMutation.ts`, `useUndo` → `useUndoMutation` in `hooks/useUndoMutation.ts` (`mv`, then rename the export and every call); `mutationKey: ['write']` stays the shared key both mutations and the write card's `useMutationState` filter use.
   Check: `rg -n "\['board'\]" tools/workbench/site/src` prints only `useBoard.ts`; `rg -nw "useWrite|useUndo" tools/workbench/site/src` prints nothing; `ls tools/workbench/site/src/app/hooks` lists `boardRefetch.ts useBoard.ts useBoardChangedEffect.ts useUndoMutation.ts useWriteMutation.ts`; `vp check` from `tools/workbench/` is clean; `vp run -F @pacevault/workbench check` passes; `vp test -- --run` from `tools/workbench/` passes 66 tests.

## Open items

- Event-handler I/O flows not converted here: file import (`features/sessions/hooks/useFileUpload.ts`), GPX import (`features/studio/hooks/useGpxImport.ts`), edit-in-studio (`features/sessions/session/hooks/useEditInStudio.ts`) and the exports and studio map popup that read records or route points on click (`features/sessions/session/hooks/useSessionExport.ts`, `features/studio/hooks/useStudioRouteExport.ts`, `features/studio/hooks/useStudioMapPopup.ts`). They orchestrate the import-progress store around many writes; convert them to `use<Name>Mutation` modules (and the click-time reads to `queryClient.fetchQuery` with the read module's exported key builder and fetcher) once read modules for sessions and studio routes exist; the effects-are-rare plan creates them (`queries/sessions/useSessionRecords.ts`, `useSessionLaps.ts`, `useSessionGps.ts`, `queries/studio/useStudioRoutePoints.ts`, …).
- Effect-driven IndexedDB reads (session records, laps, GPS, studio route points, storage breakdown, GPS backfill, startup reprocessing and training-load recompute) are not converted here: the effects-are-rare plan moves them into read modules under `apps/web/src/queries/sessions/`, `queries/studio/` and `queries/settings/`, following this TDR's fetcher, key builder and annotated hook shape.
- Session delete (item 7) keeps `await mutateAsync` so a failed IndexedDB delete stays an unhandled rejection as today; switching it to `mutate` without await (an unshown mutation error) is not part of this migration. Follow-up: backlog item conventions-follow-ups.
- R12 already holds: no `index.ts` exists under `apps/web/src/queries/` or `apps/web/src/mutations/`.
- R9 (`shared.ts`) has no subject yet: no two modules in these trees share a fetcher or key today.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
