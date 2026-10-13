# Session detail: reload performance (DRAFT)

> Draft. Owner is not convinced of the approach yet. Everything we learned is dumped here; the suggestions are options, not decisions.

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

## Open questions

- Approach at all: measure a production build first, or start with the obvious wins (2, 3, 5)?
- Decode once: shared cache in `getSessionRecords` vs. a records store vs. a worker?
- Is deferring more stats / weather until visible acceptable, or must everything be ready on load?
- Target: what reload time at 4x is "good enough"?

## Verification (once an approach is chosen)

- Re-record the same trace (dev and prod), compare per-item ms against the tables above.
- Unit tests for any new pure helpers (percentile, shared derivations) per `tests/CLAUDE.md`.
- `vp check`, `vp test -- --run`, `vp exec playwright test`, `vp build`.
