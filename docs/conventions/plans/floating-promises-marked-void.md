---
id: floating-promises-marked-void
tdr_reference: tdr/floating-promises-marked-void.md
depends_on: [one-server-call-per-hook-module, names-spell-out-their-meaning]
generated: 2026-10-23
---

# Deliberate fire-and-forget promises are prefixed with void

Read `tdr/floating-promises-marked-void.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`one-server-call-per-hook-module`](one-server-call-per-hook-module.md) — names `boardQueryKey`, `refetchBoard` and `refetchBoardOnConflict`, which item 5 marks.
- [`names-spell-out-their-meaning`](names-spell-out-their-meaning.md) — names `drawGraph`, which item 5 marks.

## Changes

`typescript/no-floating-promises` is `off` in the root `vite.config.ts:32`, so nothing marks fire-and-forget today. A read-only type-aware oxlint run found 27 unmarked floating promises and 14 async functions passed where a void-returning callback is expected. The detector used for every Check below, run from the repo root on macOS (it changes no file):

```bash
OXLINT_TSGOLINT_PATH="$(ls -d node_modules/.pnpm/@oxlint-tsgolint+darwin-arm64@*/node_modules/@oxlint-tsgolint/darwin-arm64 | head -1)/tsgolint" \
  "$(ls -d node_modules/.pnpm/oxlint@*/node_modules/oxlint | head -1)/bin/oxlint" --type-aware -A all \
  -D typescript/no-floating-promises -D typescript/no-misused-promises <paths>
```

Every item's Check includes `vp run check` clean and `vp run test` green.

1. Mark fire-and-forget calls in effects and synchronous handlers with `void` (R1).
   Files: `apps/web/src/features/map/hooks/useSessionDetailPath.ts:48`, `apps/web/src/features/settings/hooks/useStorageBreakdown.ts:22,25`, `apps/web/src/features/studio/hooks/useStudioMapPopup.ts:24`, `apps/web/src/features/studio/hooks/useStudioRoutePoints.ts:12`, `apps/web/src/pages/SessionDetailPage.tsx:31,32`, `apps/web/src/features/sessions/SessionItem.tsx:16`, `apps/web/src/features/studio/StudioRouteItem.tsx:12`, `apps/web/src/features/studio/StudioActionsMenu.tsx:52`, `apps/web/src/features/trips/TripItem.tsx:18`, `apps/web/src/features/studio/StudioTab.tsx:50`, `apps/web/src/features/studio/markers/StudioTrackPickPopup.tsx:79,81`, `apps/web/src/features/sessions/hooks/useSessionReprocessingEffect.ts:14`, `apps/web/tests/features/map/hooks/useMapTracks.integration.test.ts:84,87`.
   Change: prefix each statement with `void`: `void getSessionRecords(targetId).then(…)`, `void estimateStorageUsage().then(…)`, `void measureStoreBytes().then(…)`, `void getStudioRoutePoints(routeId).then(…)` (both hooks), `void getSessionRecords(params.id).then(setRecords)`, `void getSessionLaps(params.id).then(setLaps)`, `void navigate(…)` (four sites), `void gpxImport.handleFiles(e.target.files)`, `void routeExport.exportSegment(…)`, `void routeExport.exportRoute(route)`, `if (reprocessed > 0) void invalidatePersonalBests(queryClient)`, and in the test `void map.hook.result.current('/labs?tab=studio')` / `'/studio/r1'`.
   Check: the detector over these files reports no `no-floating-promises` hit.

2. Mark fire-and-forget calls inside async functions whose rejection does not matter, and await the one whose rejection does (R1, R3).
   Files: `apps/web/src/features/demo/loadDemoData.ts:56`, `apps/web/src/features/sessions/createIngestBatcher.ts:127`, `apps/web/src/features/sessions/session/DeleteSessionDialog.tsx:61,64`, `apps/web/src/features/sessions/session/hooks/useEditInStudio.ts:35`, `apps/web/src/features/settings/DeleteAllDataDialog.tsx:46,55`, `apps/web/src/lib/indexeddb.ts:78-82`, `apps/web/tests/features/records/hooks/usePersonalBests.spec.ts:25-49`.
   Change: query invalidation and navigation are refreshes whose failure has no consequence for the operation, so they are marked, not awaited: `void invalidatePersonalBests(queryClient)`, `void invalidatePersonalBests(options.queryClient)`, `void invalidatePersonalBestsOfSession(queryClient, props.session.id)`, `void resetPersonalBests(queryClient)`, `void navigate('/sessions')`, ``void navigate(`/studio/${id}`)``, `void navigate('/')`. In `deleteSessionGPS` (`indexeddb.ts:74-83`) a failed delete loses user data, so the loop `for (const key of keys) { tx.store.delete(key); }` becomes `await Promise.all(keys.map((key) => tx.store.delete(key)));` before the existing `await tx.done;`. The four `invalidatePersonalBestsOfSession` tests become `async` and `await` the call.
   Check: the detector over these files reports no `no-floating-promises` hit; `apps/web/tests/store/deleteAllData.integration.test.ts` and the session-delete tests pass.

3. Wrap async functions handed to void-returning callbacks (R1).
   Files: `apps/web/src/features/intervals/IntervalsConnectionForm.tsx:169`, `apps/web/src/features/settings/DeleteAllDataDialog.tsx:102`, `apps/web/src/features/studio/DeleteStudioRouteDialog.tsx:41`, `apps/web/src/features/sessions/session/DeleteSessionDialog.tsx:58`, `apps/web/src/features/sessions/FitUploadButton.tsx:37`, `apps/web/src/features/sessions/session/SessionActionsMenu.tsx:32,40`, `apps/web/src/features/studio/StudioActionsMenu.tsx:28`, `apps/web/src/features/trips/TripActionsMenu.tsx:48`, `apps/web/src/features/trips/TripItem.tsx:14`, `apps/web/src/pages/SettingsPage.tsx:66`, `apps/web/src/features/sessions/hooks/useFileDropEffect.ts:7`, `apps/web/src/components/layout/Dock.tsx:105`.
   Change: `onClick={handleImport}` → `onClick={() => void handleImport()}` (and the same for both `handleDelete` props); `DeleteSessionDialog.tsx:58` `onClick={async () => { … }}` → the body moves to a named `const handleDelete = async () => { … };` and the prop becomes `onClick={() => void handleDelete()}`; `FitUploadButton.tsx:37` likewise → `const handleChange = async (input: HTMLInputElement) => { … };` with `onChange={(e) => void handleChange(e.currentTarget)}`; `onSelect: () => editInStudio.editInStudio()` → `onSelect: () => void editInStudio.editInStudio()` (and `gpxExport.exportGpx()`, `routeExport.exportRoute(props.route)`); `onDeleted={() => navigate('/sessions?tab=trips')}` and ``onClick={() => navigate(`/trips/${props.trip.id}`)}`` → `() => void navigate(…)`; `onValueChange={(v) => setLocale(v as Locale)}` → `onValueChange={(v) => void setLocale(v as Locale)}`. `useFileDropEffect`'s `onDrop` parameter is typed `(files: FileList) => Promise<void>` and its drop handler calls `void onDrop(files)`, so `Dock.tsx:105` keeps passing `upload.handleFiles` unchanged and the effect's dependencies stay stable.
   Check: the detector over `apps/web/src apps/web/tests` reports "Found 0 warnings and 0 errors".

4. (packages/ui) Mark the unawaited spring animations.
   Files: `packages/ui/src/components/BottomSheet.tsx`, `packages/ui/src/components/Dialog.tsx`
   Change: motion's `animate()` returns thenable playback controls; `Dialog.tsx:69` already writes `void animate(…).then(…)`. Prefix the three bare calls the same way: `BottomSheet.tsx:94` `animate(y, positionToOffset(layout, next), SHEET_SPRING);` → `void animate(…);`, `Dialog.tsx:62` and `:77` `animate(y, 0, SHEET_SPRING);` → `void animate(y, 0, SHEET_SPRING);`. The effect at `BottomSheet.tsx:78` keeps its `const controls = animate(…)` (it is held and stopped in the cleanup).
   Check: `rg -n "^\s+animate\(" packages/ui/src` prints nothing; `vp run check` and `vp run test` pass.

### tools/workbench

The island's hooks sit in `tools/workbench/site/src/app/hooks/` under the names the one-server-call-per-hook-module and names-spell-out-their-meaning plans gave them (`refetchBoard`, `refetchBoardOnConflict`, `drawGraph`).

5. (tools/workbench) Mark the board's unawaited promises (R1).
   Files: `tools/workbench/site/src/scripts/tech.ts`, `tools/workbench/site/src/app/hooks/useBoardChangedEffect.ts`, `tools/workbench/site/src/app/hooks/boardRefetch.ts`
   Change: in `initTech` the last line `for (const entry of figures) drawGraph(entry.graph, entry.code);` → `for (const entry of figures) void drawGraph(entry.graph, entry.code);` (each render is chained on the module's queue, which already catches Mermaid errors into the figure); in `useBoardChangedEffect`'s listener `queryClient.invalidateQueries({ queryKey: boardQueryKey() });` → `void queryClient.invalidateQueries({ queryKey: boardQueryKey() });`; in `refetchBoardOnConflict` `refetchBoard(queryClient);` → `void refetchBoard(queryClient);`. `onSuccess: () => refetchBoard(queryClient)` stays: TanStack awaits the promise it returns.
   Check: `rg -n "\) (drawGraph|refetchBoard)\(|^\s*(refetchBoard|queryClient\.invalidateQueries)\(" tools/workbench/site/src` prints nothing; `vp check` from `tools/workbench/` is clean; `vp run -F @pacevault/workbench check` passes.

6. Replace the empty-catch discard with `void` (R2).
   Files: `apps/web/src/features/sessions/createIngestBatcher.ts`, `apps/web/tests/features/sessions/createIngestBatcher.integration.test.ts`
   Change: in `finish` (`createIngestBatcher.ts:124-131`) `requestPersistentStorage().catch(() => undefined);` → `void requestPersistentStorage();`. Behaviour change accepted by the owner: a rejection of `navigator.storage.persisted()`/`persist()` is no longer swallowed and surfaces as an unhandled rejection (a console error in the browser; a failing run in Vitest). `requestPersistentStorage` (`apps/web/src/lib/persistentStorage.ts`) stays unchanged. Add a case to the batcher spec that pins the new call: stub `navigator.storage` with `vi.stubGlobal` so `persisted` resolves `false` and `persist` is a `vi.fn()` resolving `true`, import one session through `add` + `finish`, and assert `expect(persist).toHaveBeenCalledWith()`; a second case with `importedCount` 0 asserts `expect(persist).not.toHaveBeenCalled()`.
   Check: `rg -n "\.catch\(\(\) => (undefined|\{\s*\}|null)\);" apps/web/src` prints nothing; `rg -n "void requestPersistentStorage\(\);" apps/web/src/features/sessions/createIngestBatcher.ts` prints one hit; `vp run test` passes, including the two new `createIngestBatcher.integration.test.ts` cases; `vp run e2e` passes (FIT import journey).

## Open items

- R4 (terminal handling on long-lived `void`ed chains): the one process-entry chain, `boot(rootEl).catch(…)` at `apps/web/src/main.tsx:57`, already ends in a `.catch`; nothing to change.
- Turning `typescript/no-floating-promises` (and `typescript/no-misused-promises`) on in the root `vite.config.ts` lint block is the tooling plan's job, after this plan has made the tree clean.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
