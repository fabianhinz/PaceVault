# Session detail: reload performance (PLAN, ready for review)

> The trace findings and suggestions below are the background; the binding parts are "Decisions" and the plan sections after them.

## Context

Owner recorded a DevTools trace: reload of `/sessions/:id`, 4x CPU slowdown, dev build, same session throughout. The trace itself is not kept; the tables below are the baseline. Re-record with the same setup to compare.

All numbers are main-thread ms at 4x slowdown, from a sampled profile mapped through the trace's source maps. Prod numbers are extrapolated, not measured.

## What the trace shows

### Timeline (t = 0 at navigation; trace 6.6 s, main thread busy 6.5 s)

- 22 tasks over 50 ms, 4.93 s in total, ~3.83 s blocking time.
- 534 ms, 650 ms long: mostly "(program)" with ~700 script-catchup events. Vite serving ~450 unbundled modules. Dev-only.
- 1187 ms, 329 ms: module top-level evaluation.
- 1719 ms, 396 ms: first render of the app shell.
- 2.2–2.7 s: maplibre initialisation, tasks of 52–109 ms.
- 2760 ms and 3059 ms: record decodes, 120 ms and 105 ms.
- 3197 ms, 1964 ms: detail page render + commit. Contains chart rows, more stats, laps, weather, terrain, plus a ~500 ms synchronous re-render during commit (store updates from effects).
- 5570 ms and 5697 ms: two more record decodes, 117 ms and 129 ms.
- 5830 ms, 93 ms: maplibre `getImageCanvasContext` (85 ms).

### Leaf time by category (ms)

| Category                                | ms   |
| --------------------------------------- | ---- |
| Library code (`node_modules`) self time | 2182 |
| (program)                               | 1804 |
| Our code (`/src`) self time             | 1405 |
| `console.createTask` (React dev)        | 508  |
| Browser extensions                      | ~250 |
| GC                                      | 122  |

GC (largest pause 19 ms), Layout (89 ms, largest 40 ms) and style recalc (70 ms) are minor.

### Dev-only costs (well over 1.5 s)

- React dev instrumentation: `console.createTask` 508 ms, `runWithFiberInDEV` 526 ms self, `logComponentRender` 121 ms.
- StrictMode double renders and double effects (doubles items 1–3 below).
- React DevTools extension (~95 ms) and another extension (~100 ms).
- `ReactQueryDevtools` (`src/main.tsx:46`), a 109 ms task.
- Unbundled module loading.

### Our hot paths

| #   | Hot path              | ms dev (prod est.) | Where                                                                                                                                                                                                                        | Why it's slow                                                                                                                                         |
| --- | --------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Record decoding       | ~560 (~280)        | `decodeRecords` `src/lib/recordCodec.ts:55`; Zod at `src/lib/recordCodec.ts:50`, `JSON.parse` at `src/lib/recordCodec.ts:62`                                                                                                 | Per call ~40 ms gzip inflate, ~50 ms `JSON.parse`, ~48 ms Zod array parse. Ran 4×.                                                                    |
| 2   | Chart rows            | ~463 (~230)        | `buildSessionChartRows` from `src/features/sessions/charts/SessionChartsExplorer.tsx:143`, `src/lib/chartData.ts:53`, `bucketSeries` `src/lib/chartBuckets.ts:46`                                                            | `typicalSpacing` (`src/lib/chartBuckets.ts:26-38`) copies and fully sorts all x-deltas per channel (~9 channels) to read the 99th percentile: 215 ms. |
| 3   | More stats            | ~184 (~90)         | `buildMoreStats` `src/lib/moreStats.ts:141` via `src/features/sessions/session/hooks/useMoreStats.ts:8`                                                                                                                      | Decoupling 50, `windowedGradients` 49, energy 44, HR zones 14, moving time 13, step length 11.                                                        |
| 4   | Gradients twice       | ~100               | `windowedGradients` `src/packages/engine/gradient.ts:76`, called at `src/lib/moreStats.ts:146` and `src/lib/sessionTerrain.ts:19`                                                                                            | Same records, same result, computed twice.                                                                                                            |
| 5   | Weather wind analysis | ~118               | `src/features/sessions/session/hooks/useWindRose.ts:12` (62), `src/features/sessions/session/hooks/useWindExposure.ts:12` (56)                                                                                               | Per-record bearing work (`bearingDeg` `src/packages/engine/gps.ts:34` shows 28 ms self).                                                              |
| 6   | Moving time ~5×       | ~90                | `movingSeconds` `src/lib/movingTime.ts:37`; callers `src/lib/chartData.ts:57`, `src/lib/sessionTerrain.ts:29`, `src/lib/lapRanges.ts:43`, `src/lib/dynamicLaps.ts:50`, `src/lib/railRange.ts:82`, `src/lib/movingTime.ts:66` | Each call runs `medianStep` (`src/lib/movingTime.ts:6`), which sorts.                                                                                 |
| 7   | Laps                  | ~84                | `buildLapSet` `src/lib/lapSet.ts:48` via `src/features/sessions/session/hooks/useSessionLapsEffect.ts:18`                                                                                                                    | `computeDynamicLaps` 59, `lapBands` 24.                                                                                                               |
| 8   | Terrain               | ~64                | `buildSessionTerrain` (`src/lib/sessionTerrain.ts`)                                                                                                                                                                          | Includes the second gradients pass and another moving-time pass.                                                                                      |
| 9   | Month names at load   | ~46                | `MONTH_NAMES` `src/lib/filterVocabulary.ts:68`                                                                                                                                                                               | 48 `Intl.DateTimeFormat` instances built at module load, on every page.                                                                               |
| 10  | Sensor validation     | ~43                | `validateRecords` `src/lib/validation.ts:20`                                                                                                                                                                                 | One pass over all records, mostly self time.                                                                                                          |

Rough prod estimate: ~1.0–1.2 s of our own code still blocks after a reload at 4x.

### The four decodes

- `src/pages/SessionDetailPage.tsx:29-34`: `getSessionRecords(params.id).then(setRecords)` with no cancel; StrictMode runs it twice in dev.
- `src/features/map/hooks/useSessionDetailPath.ts:39-58`: the map loads the same records again (it cancels, but `fetchedIdRef` is reset in cleanup, so StrictMode refetches).
- Not in the trace's attribution but also on this page: `src/features/sessions/session/hooks/useSessionWeather.ts:15` reads records once more for the weather fetch (needs checking whether it ran during this reload; it is cached afterwards).
- Telling the callers apart relied on timing.

## Suggestions (options, not decided)

1. **Decode once per session view.** A single records source (shared hook/store keyed by session id, or a small in-memory cache in `getSessionRecords`) used by the page, the map path and weather. Saves ~140 ms per avoided decode. Variant: decode in a worker so the main thread only receives the array (structured clone cost to check).
2. **`typicalSpacing` without a full sort.** Compute it once per x-axis instead of per channel, and/or use quickselect for the 99th percentile. Probably the cheapest big win (~200 ms dev).
3. **Shared per-session derivations.** Compute `windowedGradients` and `movingSeconds` once per records array (memo keyed by array identity, passed down or via a `WeakMap` cache in lib) and hand them to more stats, terrain, chart rows, laps. The engine already accepts `gradients` as a parameter (`src/packages/engine/decoupling.ts:101`, `src/packages/engine/energy.ts:176`, `src/packages/engine/normalize.ts:67`).
4. **Defer below-the-fold work.** More stats sits in a collapsed accordion; compute it on expand or in idle time. Weather wind analysis could also wait until the card is visible.
5. **Lazy `MONTH_NAMES`.** Build on first filter use.
6. **The ~500 ms synchronous re-render** after commit: find which effect-driven store updates cause it (e.g. laps sync) and batch or move them. Needs its own profiling.
7. **Measure prod first.** `vp build` + preview (owner starts the server), same 4x trace, to confirm which items remain before investing.

## Decisions (2026-10-14)

- **Decode once via React Query.** One query `['session-records', id]` shared by the page (`src/pages/SessionDetailPage.tsx:31`), the map path (`src/features/map/hooks/useSessionDetailPath.ts:48`) and weather (`src/features/sessions/session/hooks/useSessionWeather.ts:15`). Purpose is only to stop the same load from decoding several times, not to cache across views: `gcTime: 0`, freed as soon as no component uses it.
- **Invalidate** the records query wherever personal bests are invalidated today: reprocess (`src/features/sessions/hooks/useSessionReprocessingEffect.ts:14`), delete one (`src/features/sessions/session/DeleteSessionDialog.tsx:61`), delete all (`src/features/settings/DeleteAllDataDialog.tsx:45`), import (`src/features/sessions/createIngestBatcher.ts:127`, `src/features/demo/loadDemoData.ts:49`).
- **Worker for derivations.** Chart rows, more stats, terrain (and the shared gradients / moving time behind them) move to a worker; sections show loading states until their result arrives. Deferring until visible is no longer a separate question.

- **Worker input:** the main thread posts only the session id; the worker reads and decodes the records from IndexedDB itself, like `personalBests.worker.ts` and `gpsBuild.worker.ts`. The main thread never ships the array; the second decode happens off-thread.
- **Worker lifecycle:** long-lived while on session detail. Created on entering the page, terminated on leaving, so zoom re-bucketing and lap changes reuse the decoded records.

- **Scope, first step:** only the biggest bucket moves: chart rows incl. zoom re-bucketing (`src/features/sessions/charts/SessionChartsExplorer.tsx:143`, `:149`). More stats, terrain, laps and wind stay on the main thread for now.
- **No algorithmic fixes** (suggestions 2, 3, 5 are dropped).
- **No hard target.** Effects are measured before and after the change.

- **Measuring:** the owner records a manual DevTools trace before and after (reload `/sessions/:id`, 4x CPU slowdown, same session, dev and prod preview). The old trace is gone and the code has changed, so a new baseline comes first. No measuring code.

## Approach

### 1. Records query (decode once)

- New `src/features/sessions/hooks/useSessionRecords.ts`: `sessionRecordsQueryOptions(sessionId)`, `useSessionRecords(sessionId, enabled)`, `invalidateSessionRecords(queryClient)` (prefix `['session-records']`), modelled on `src/features/records/hooks/usePersonalBests.ts:48-59`. Options: `queryFn: () => getSessionRecords(id)` (`src/lib/indexeddb.ts:17`), `gcTime: 0`, `staleTime: Infinity` (otherwise a later observer refetches and decodes again), `structuralSharing: false` (no deep compare of ~10k records), `retry: false`.
- Page (`src/pages/SessionDetailPage.tsx`): records state (`:20`, `:31`) replaced by the query; the laps load (`:32`) keeps its own effect; the gate at `:49` stays.
- Map path (`src/features/map/hooks/useSessionDetailPath.ts`): ref, state and effect (`:28-29`, `:39-58`) replaced by `useSessionRecords(targetId, hasDetailedRecords)`.
- Weather (`src/features/sessions/session/hooks/useSessionWeather.ts:15`): `client.fetchQuery(sessionRecordsQueryOptions(sessionId))` via `ctx.client` (pattern of `src/features/intervals/hooks/useIntervalsSync.ts:21`), reusing in-flight or cached data.
- StrictMode's unmount/remount keeps the query, so the dev double decode disappears.

### 2. Invalidation

`invalidateSessionRecords(queryClient)` next to the personal-bests invalidation: `src/features/sessions/hooks/useSessionReprocessingEffect.ts:14`, `src/features/sessions/session/DeleteSessionDialog.tsx:61`, `src/features/settings/DeleteAllDataDialog.tsx:45`, `src/features/sessions/createIngestBatcher.ts:127` (file upload and intervals.icu), `src/features/demo/loadDemoData.ts:49`.

### 3. Worker protocol

- Worker `src/features/sessions/charts/sessionChartRows.worker.ts` (thin `self.onmessage`); logic in `src/lib/sessionChartRows.ts` (`createSessionChartRowsResponder()`) so it is testable in jsdom.
- Messages are plain types with `satisfies` (own data, no Zod), like `src/features/records/personalBests.worker.ts:13-15`:

```ts
type ChartRowsRequest =
  | {
      type: 'chart-rows';
      requestId: number;
      sessionId: string;
      range: { from: number; to: number } | null;
    }
  | { type: 'reset' };
type ChartRowsResponse =
  | { type: 'chart-rows'; requestId: number; rows: SessionChartRows }
  | { type: 'chart-rows-failed'; requestId: number };
```

- Rows need terrain (`src/features/sessions/charts/SessionChartsExplorer.tsx:107-110`), so the worker runs `buildSessionTerrain(sport, records)` itself. They don't need laps, lap bands, profile, thresholds, units or locale.
- **Strictly id-only (decided):** the worker reads `sport` itself from the persisted sessions store in the `kv` store (key `store-sessions`, `src/store/sessions.ts:96`, `src/lib/db.ts:33`), validated with a Zod schema per the "no `as any`" rule. Worker cache: one entry per session id (records promise, sport, terrain). When the records query's `dataUpdatedAt` changes (invalidation after reprocess, delete, import), the hook posts `{ type: 'reset' }`, the worker drops its cache and the next request re-reads. Each request runs `buildSessionChartRows(records, { isRunning, terrain, range })` as at `:143`/`:149`.
- Posted: one full request on mount and after each reset (plus a range request if zoomed); one range request per completed zoom drag (`src/lib/hooks/useSyncedChartZoom.ts:6`); zoom reset posts nothing. Records are never posted. Response ≤ ~1500 rows (`src/lib/chartBuckets.ts:1`); structured clone keeps `null`, so "0 is data" holds.
- Stale responses: monotonic `requestId`, latest id per kind (full, range); older ones are dropped; rows are stored with their session id and the `dataUpdatedAt` they were requested under.
- Lifecycle: `src/features/sessions/charts/hooks/useSessionChartRows.ts` creates the worker in a mount effect (pattern of `src/features/map/hooks/useGpsBackfill.ts:46`) and terminates it on unmount. The explorer only mounts once records exist (`src/pages/SessionDetailPage.tsx:49`).

### 4. Stays on the main thread

Terrain, climbs, extremes, stats (`SessionChartsExplorer.tsx:107-118`, `:205-233`), scales (`:121-136`), `byTime`/`gpsLookup` from the returned rows (`:153-160`), hover/select, more stats, laps, wind, map path.

### 5. Loading UI

- **Charts card: no skeletons.** First load: the card renders immediately with real titles and rails and empty plots. Which charts appear comes from a cheap main-thread check per channel (same rule as `hasSeriesValues`, `SessionChartsExplorer.tsx:349`, but over `records`), so there is no layout jump. Zoom: the previous rows stay until the zoomed rows arrive. Switching sessions: the body blanks briefly until the new records are decoded (no `keepPreviousData`).
- **SessionSummaryCard rows** (`src/features/sessions/session/SessionSummaryCard.tsx:15-25`): while a row's data loads, the row is disabled and its collapsed header shows skeletons sized to the real anatomy: avatar, a title-height line, a caption-height line (`src/components/ui/ListItemHeader.tsx:35-47`). A shared loading state on `CollapsibleListItem`; `WeatherCard` uses it instead of the 52 px block (`src/features/sessions/session/WeatherCard.tsx:135`). Any row that becomes async later uses the same state.
- **Worker failure:** treated as a bug. The hook rethrows during render, so the route error boundary shows `RouteErrorFallback` (`src/components/layout/AppLayout.tsx:26`). Data problems can't cause it: decoding returns `[]` instead of throwing (`src/lib/recordCodec.ts:55-67`).

## Files

**Create:** `src/features/sessions/hooks/useSessionRecords.ts`, `src/lib/sessionChartRows.ts`, `src/features/sessions/charts/sessionChartRows.worker.ts`, `src/features/sessions/charts/hooks/useSessionChartRows.ts`, `tests/lib/sessionChartRows.integration.test.ts`.

**Modify:**

- `src/pages/SessionDetailPage.tsx:1,5,20,29-34`: records from the query.
- `src/features/map/hooks/useSessionDetailPath.ts:1-2,28-29,39-58,61`: use the query.
- `src/features/sessions/session/hooks/useSessionWeather.ts:2,7-21,35`: `fetchQuery`, drop the `getSessionRecords` import.
- `src/features/sessions/charts/SessionChartsExplorer.tsx:5,139-152,573-575`: `useSessionChartRows(props.session, zoomRange)` replaces the two memos; loading branch.
- `src/lib/chartData.ts:53`: export `SessionChartRows`.
- `src/components/ui/Collapsible.tsx`: loading state on `CollapsibleListItem` (disabled, skeleton avatar + title-height + caption-height lines).
- `src/features/sessions/session/WeatherCard.tsx:134-136`: use that loading state instead of the 52 px block.
- The five invalidation sites above.
- `e2e/sessions.spec.ts:99`: drag-zoom, reset.

**Delete:** nothing.

## Tests

- `tests/lib/sessionChartRows.integration.test.ts` (fake-indexeddb; seed records with `bulkSaveSessionData([{ sessionId, records, laps: [] }])` from `src/lib/indexeddb.ts`): full and range requests equal `buildSessionChartRows(records, { isRunning, terrain })`; after overwriting the records with a second `bulkSaveSessionData` call, a `reset` makes the next request return the new rows; `sport` is read from a seeded `store-sessions` kv entry.
- E2E: extend `e2e/sessions.spec.ts:99` with drag-zoom → `zoom-reset-chip` visible → reset → gone. Existing chart assertions (`:90`, `:113`, `:295`) auto-wait for rows.
- No tests for the thin query hook or stale-response dropping (would need a mocked `Worker`).

## Verification

1. Owner records the new baseline trace first (reload `/sessions/:id`, 4x CPU, same session, dev and prod preview).
2. `vp check`, `vp test -- --run`, `vp exec playwright test`, `vp build`.
3. Owner records the same trace after: one main-thread decode, no `buildSessionChartRows` on the main thread, shorter page commit.
4. Manual: zoom/reset/fast repeated zoom (last wins); next session via the peek (no old rows); reprocess or delete while open; weather loads for a session without cached weather.

## Open questions

None. All questions answered on 2026-10-14.

## Risks

- Terrain runs on both threads (~64 ms dev); accepted, algorithmic fixes are out of scope.
- The worker starts only after the page's records arrive (explorer mounts then); still overlaps the large commit.
- Delete one invalidates before `navigate`, so the open query refetches once against records about to be deleted; harmless.
- Removing `staleTime: Infinity` or `structuralSharing: false` later brings back repeat decodes or deep compares.
- Zoom becomes asynchronous: the pill updates before the rows; per-kind `requestId` keeps an older zoom from overriding a newer one.
