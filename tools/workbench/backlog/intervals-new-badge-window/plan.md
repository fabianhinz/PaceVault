---
title: Intervals sync tuning
status: ready
created: 2026-10-29
type: chore
areas: [app]
next: Owner sets ready, then "lets dev" (round 2)
size: small
---

# Intervals sync: faster downloads and a 30-day window for the "new" badge

## Context

The intervals.icu import downloads one FIT file at a time (`apps/web/src/lib/api/intervalsImport.ts:56`), so a large library takes long. Background syncs badge every session they import as new (`markNew: !foreground`, `apps/web/src/lib/api/intervalsSync.ts:75`), including backlog activities from years ago (past the 2,000-per-run cap, or left over after a 429). intervals.icu allows at most 10 requests/s per IP (developer, forum.intervals.icu/t/609).

## Decisions (settled)

- Up to 5 FIT downloads in flight; all intervals.icu requests together never exceed 5/s, half the 10/s limit (Q1).
- A 429 keeps today's behaviour: the import stops, `backlogPending` is set, the next background sync resumes. No retry, no `Retry-After` handling.
- `BUFFER_DAYS` 14 → 30.
- The badge uses the same window: a session imported by intervals sync is new only when its start is on or after (newest intervals session − `BUFFER_DAYS`), computed before the run; foreground or background no longer matters. No intervals session yet (first connect) → no badge.
- Out of scope: the rate-limit message, activities uploaded to intervals.icu more than 30 days late.

## Approach

1. **Request pacing** in `intervalsRequest`: every request waits for its slot, slots at least `MS_PER_SECOND / 5` apart (module-level next-slot time). Covers listing, key check, `/file` and the `/fit-file` fallback.
2. **Sliding download window** in `runIntervalsImport`: start the downloads of the next 5 activities, consume results in listing order (newest first), start the next download as each one is consumed. Parse and `batcher.add` stay sequential, so batching, duplicate checks and memory (≤ 5 buffers ahead) behave as today. A download result never rejects (wrapped as data or error); on a fatal code the loop stops and in-flight results are dropped. Their ids are not recorded, so the next sync fetches them again.
3. **Badge cutoff**: `intervals.ts` exports the window start in ms (`intervalsSyncWindowStart`); `intervalsSyncWindowOldest` formats it. `runIntervalsSync` reads it before the import and passes it down as `markNewSince` (replaces `markNew`); the batcher badges saved sessions with `session.date >= markNewSince`.

## Files

- `apps/web/src/lib/api/intervals.ts:34` `intervalsRequest`: await the request slot before `fetch`; constants for 5 requests/s.
- `apps/web/src/lib/api/intervals.ts:144` `BUFFER_DAYS` 14 → 30; `:153` split into `intervalsSyncWindowStart` (ms) and `intervalsSyncWindowOldest` (local date).
- `apps/web/src/lib/api/intervalsImport.ts:56` loop → sliding window of 5 (`DOWNLOAD_CONCURRENCY`); `markNew` → `markNewSince?: number`.
- `apps/web/src/lib/api/intervalsSync.ts:75` pass `markNewSince` from `intervalsSyncWindowStart(sessions)` read at the start of the run, instead of `!foreground`.
- `apps/web/src/lib/storage/createIngestBatcher.ts:89-146` `markNew` → `markNewSince`; `ingestBatch` adds saved sessions in two groups (`markNew: true` for `date >= markNewSince`, the rest without). File uploads pass nothing, as today.

## Tests

- `apps/web/tests/lib/api/intervals.spec.ts`: requests start at least 200 ms apart (fake timers).
- `apps/web/tests/lib/api/intervals.syncWindow.spec.ts`: 14 → 30 days; `intervalsSyncWindowStart` returns the ms value.
- `apps/web/tests/lib/api/intervalsImport.integration.spec.ts`: never more than 5 downloads in flight; sessions saved in listing order; a 429 still stops the import and in-flight results are not imported.
- `apps/web/tests/lib/api/intervalsSync.integration.spec.ts:106-123`: replace the two foreground/background badge cases with: inside the window → new; older than the window (backlog) → not new; no intervals session yet → not new, foreground or background. `:194` 14 → 30 days.
- `apps/web/tests/lib/storage/createIngestBatcher.integration.spec.ts`: `markNewSince` badges only sessions on or after the cutoff.

## Verification

`vp run check`, `vp run test`, `vp run e2e`, `vp run build` from the root.

## Real-data checks

- [ ] Full import of a large intervals.icu account is clearly faster than before and hits no 429.
- [ ] After a backlog continuation, only recent sessions carry the blue badge.

## Delivery and acceptance

Review doc in `tools/workbench/backlog/intervals-new-badge-window/review/` (root `CLAUDE.md` §5 step 4); no UI change, so no screenshots beyond the badge list if useful. Cleanup only via `item-done` after the owner's acceptance.

## Open questions

- **Q1** · answered 2026-10-29 · Request cap: (a) 5/s, 200 ms gap (b) 3/s (c) 8/s → (a). Owner: "5/s, 200 ms gap (Recommended)"
- **Q2** · answered 2026-10-30 · How does a run know it was requested by the Import button? (a) the open dialog carries its source: `ForegroundImport` gets `source: 'intervals' | 'files' | 'demo'`, the run is foreground when an intervals dialog without summary is open (b) a non-persisted `importRequested` flag in the intervals store, set by the handler, cleared when the run ends (needs `partialize`, the store is persisted) → (a). Owner: "Dialog carries source (Recommended)"
- **Q3** · answered 2026-10-30 · Import clicked in Settings while a background sync is already running: (a) Import is disabled while the sync runs (the status line already shows it syncing, `IntervalsStatusLine.tsx:20`) (b) Import cancels the running sync and starts the requested one (c) the running sync takes over the dialog mid-run and shows progress from there → (a). Owner: "Disable while syncing (Recommended)"
- **Q4** · answered 2026-10-30 · The handler still awaits the summary (for the button's loading state and `onSynced` → onboarding complete): (a) it calls `queryClient.fetchQuery` on the same query with the same fetcher; whichever trigger fires first starts the one run and the other joins it, and the run's behaviour comes from state, so the order no longer matters (b) the handler awaits nothing; the run finishes the dialog itself and onboarding completes from a store subscription when the summary arrives with sessions → (a). Owner: "fetchQuery, same fetcher (Recommended)"
- **Q5** · answered 2026-10-30 · Shape of the Q2 source: `beginImport(source)` with `ImportSource = 'files' | 'demo' | 'intervals-import' | 'intervals-sync'`, foreground derived from `FOREGROUND_BY_IMPORT_SOURCE` (the `foreground` option goes away), with these two intervals names? → yes. Owner: "yes"

## Review round 1

- **R1** · the import progress overlay stays on "Einen Moment…" with no progress while FIT files download.
- **R2** · the overlay ends with "Du bist auf dem neuesten Stand" although activities were imported.
- Cause (pre-existing, confirmed by an e2e probe): "Delete all data" (`apps/web/src/components/settings/deleteAllData.ts:15-28`) resets the stores but does not stop a running background intervals sync. The old run keeps downloading and writes sessions and imported ids into the cleared stores and IndexedDB. On re-connect, `syncAfterConnect` (`apps/web/src/mutations/intervals/useConnectIntervalsMutation.ts:15-23`) waits for that run without progress (R1), then its own run finds every id known → "nothing new" (R2). Deleted intervals sessions reappear (R3, found by the probe).
- Fix (owner, 2026-10-30: "Abort via signal"): `clearAllAppState` cancels and removes the `intervals-sync` query; the query's `AbortSignal` goes through `runIntervalsSync` into `runIntervalsImport` and the intervals requests; on abort the run starts no further downloads, aborts open ones and skips the save and `recordIntervalsImported`. Regression e2e: background sync running → Delete all data → onboard again with the key → progress shows, summary counts the imported sessions, no old session reappears.
- Save gap (owner, 2026-10-30: "Fix now"): a batch save already running at the abort still lands; the signal also goes into `createIngestBatcher`, which skips `addSavedSessions` and the remaining chunks once aborted.
- R4 (owner, round 2: fresh incognito onboarding still shows only "Einen Moment…" and ends with "nothing new"). Reproduced every run (dev and production build, HEAD and HEAD~1) when Import is clicked after "Key valid" shows: the cached key check resumes after one microtask, `Mutation.execute` awaits `onMutate` before `mutationFn`, and React's pending sync render enables `useIntervalsSync` in between, so the background run starts first and `syncAfterConnect` waits for it. Introduced by merge 2de6192 (chore/conventions), which moved the foreground `fetchQuery` into `useConnectIntervalsMutation`; not by this item. The comment at `apps/web/src/components/intervals/hooks/useIntervalsImport.ts:59-60` states the wrong ordering.
- Rejected: a separate `/onboarding` route with the sync disabled during onboarding (owner: "Drop it"; the abort fix covers the bug).
- Rejected: gating `useIntervalsSync` while the import progress overlay is open (owner chose it 2026-10-30, reverted the same day: on a fresh connect the foreground run already wins, and the gate cannot stop a run in flight).

## Review round 2

- **R4 fix** (owner, 2026-10-30: "d) one runner: lets do it on this branch"): a sync runs only through the `intervals-sync` query and its one fetcher. Whether a run is foreground (progress, summary) and lists the full history is read from state when the run starts, never passed by the caller. Rejected as order-dependent: starting the foreground fetch synchronously in the handler, moving the store writes into the mutation, cancel-then-run.
- **R5** (owner, 2026-10-30): the `preparing` phase shows the determinate layout: empty static ring with "0 / 0" and a skeleton in place of the label; `ui_import_phase_preparing` is deleted. Owner on the side effects (file upload and reprocess pass through `preparing` too): "side effects are acceptable".

### Round 2 approach

1. `apps/web/src/store/importProgress.ts:14-21`, `:54-66` (Q2, Q5): `ImportSource = 'files' | 'demo' | 'intervals-import' | 'intervals-sync'`; `beginImport(source)` replaces `beginImport({ foreground })` and derives foreground from `FOREGROUND_BY_IMPORT_SOURCE` (`intervals-sync` → false, the rest → true); `ForegroundImport` stores `source` for imports, reprocess has none. Callers: `apps/web/src/components/sessions/hooks/useFileUpload.ts:109` (`files`), `apps/web/src/components/demo/loadDemoData.ts:73` (`demo`), the intervals handler (`intervals-import`), `apps/web/src/lib/api/intervalsSync.ts:145` (`intervals-sync`).
2. `runIntervalsSync` (`apps/web/src/lib/api/intervalsSync.ts:106-159`) drops the `full` and `foreground` options. At run start: foreground = the import progress overlay (`apps/web/src/components/importProgress/index.tsx`, state `useImportProgressStore().foreground`) is open with `source: 'intervals-import'` and no summary yet, otherwise `beginImport('intervals-sync')`; full history = foreground or `backlogPending` (today's connect behaviour). A foreground run calls `setImportTotal`, `advanceImport`, `markImportSaving` as today.
3. The handler (`apps/web/src/components/intervals/hooks/useIntervalsImport.ts:37-88`) keeps the key check, then in one synchronous step `beginImport('intervals-import')`, `connectIntervals`, and awaits `queryClient.fetchQuery` on `intervalsSyncQueryKey()` with the same fetcher as `useIntervalsSync` (`apps/web/src/queries/intervals/useIntervalsSync.ts:21-27`) and `staleTime: 0` (Q4). Summary → `finishImport` and `onSynced` as today.
4. `apps/web/src/mutations/intervals/useConnectIntervalsMutation.ts` is deleted, with the wrong ordering comment at `useIntervalsImport.ts:59-60`.
5. `apps/web/src/components/intervals/index.tsx:71-77` Import is also disabled while the sync runs (`useIsFetching` on `intervalsSyncQueryKey()`, as `apps/web/src/components/intervals/IntervalsStatusLine.tsx:20`) (Q3).
6. R5: `apps/web/src/components/importProgress/ProgressRing.tsx:17-61` no spin, counter also in `preparing`; `apps/web/src/components/importProgress/OverlayContent.tsx:55` renders `PvInlineSkeleton` for `preparing`; `apps/web/src/microcopy/importProgress.ts:4-8` loses `preparing`; key removed from `packages/i18n/messages/{de,en}.json`.

### Round 2 tests

- `apps/web/e2e/intervals.spec.ts:51` onboarding test: realistic delays (key check ~300 ms, listing ~1 s, files ~200 ms), type the key, wait for "Key valid", then Import; assert exactly one `/activities` request, a counter `n / N` with N > 0 that rises above 0, and "N new sessions". Must fail on today's code first.
- `apps/web/tests/lib/api/intervalsSync.integration.spec.ts`: foreground and full come from state (request marker present / absent, `backlogPending`), replacing the option-driven cases.
- `apps/web/tests/store/importProgress.spec.ts:19`, `:39`: `beginImport(source)` opens the overlay with `source` for every foreground source and only counts the run for `intervals-sync`.
- Settings: Import is disabled while a sync runs (component spec of `apps/web/src/components/intervals/index.tsx`).

## Risks

- The module-level pacer adds up to 200 ms per request in specs that call the API several times; specs that need speed use fake timers.
