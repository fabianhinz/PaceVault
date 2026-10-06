# Chart downsampling: one API, keep peaks and gaps, keep synced points

## Context
The session charts are downsampled by `downsample` (`src/lib/downsample.ts:5-18`, called at `src/features/sessions/charts/SessionChartsExplorer.tsx:73`). It keeps every Nth **record**, ignoring x and content. Studio has its own sampler (`src/packages/gpx/routeProfile.ts:82-99`). The lap popup was removed with this change: clicking the map in a session does nothing. Since nulls are no longer connected, this causes bugs:

1. **Sparse channels fall apart.** A channel that isn't in every record (power dropouts, foot pod, smart recording) is often missing exactly in the picked records. The line breaks into invisible single points, or `hasSeriesValues` hides the chart.
2. **Gaps depend on luck.** A dropout shorter than the step only shows when a picked record falls into it.
3. **Pauses are bridged.** Points are spaced by array position, not x, so a pause is squeezed out and drawn across. In `e2e/fixtures/cycling.fit`, records are 4 s apart on median, with 5 pauses over 10 s (the longest 83 s).
4. **Peaks get lost.** In `e2e/fixtures/running.fit`, sampling drops max power from 391 to 390 W and max grade from 14 to 13 %. The rail shows the true maximum, so chart and number disagree. Studio keeps the steepest grade per bucket but takes elevation from that same point, so elevation peaks can be lost.
5. **Zoom stays coarse.** Zooming, and the expanded view, only filter the already-sampled data.
6. **GAP uses the wrong neighbour.** Its gradient is computed against the previous *sampled* record, not the previous recorded one (`prepareGAPData` in `src/lib/chartData.ts` runs on `sampled`).

The Recharts community recommends the same (recharts#1356, #2473, #941): downsample outside Recharts, keep peaks rather than picking every Nth point, and resample on zoom.

## Rules (settled)
- **One API for every chart stack:** `bucketSeries` in `src/lib/chartBuckets.ts` (new). It is chart preparation, not domain logic, so it lives in `src/lib/` like `chartData.ts`, not in `src/packages/engine/`.
- **Synced points stay as they are.** Each stack's series come from **one shared row grid**: same length, same x per index. Recharts' index-based `syncId` sync, the rail hover lookup (`indexByX`) and the map hover lookup keep working unchanged. The x axis stays a category axis.
- **No invented data.** A bucket without a recorded value is `null` for that channel. Nulls are never connected, and nothing is interpolated.
- **0 is data** (CLAUDE.md §2). A recorded 0 takes part in min/max. Pace is `null` only at speed 0.
- **`TARGET_ROWS = 1500`:** one exported constant. Fabian tunes the value himself.

## API
```ts
bucketSeries(rows, {
  x: (row) => number,                          // time (s) or distance (km)
  channels: { hr: (row) => row.hr, … },        // value or null/undefined per row
  range?: { from: number; to: number },        // zoom: only rows inside, re-bucketed
  targetRows: TARGET_ROWS,
})
// → Array<{ x: number; source: Row } & Record<channel, number | null>>
```

## Algorithm
1. **Fixed-width buckets on x.**
   - `width = max(span / (targetRows / 2), widest per-channel 99th-percentile spacing)`. The spacing is measured over all rows, not only the zoom range, so full view and zoom use the same rule.
   - The lower bound keeps sparse but regular data from leaving empty buckets that would look like gaps. That covers GPX points every ~20 m, smart recording at 1–8 s (p99 8 s in `cycling.fit`), and a channel present only in every other record.
   - The first version used 2 × median spacing. The zoom showed it was too narrow for smart recording.
   - An empty bucket therefore means a real pause or dropout of at least one bucket width.
2. **Two output rows per bucket**, at the bucket start and its midpoint. Every bucket emits rows, empty ones too, so index stays proportional to x and a pause keeps its real width.
3. **Per channel and bucket:**
   - Find the min and max of the recorded values.
   - Write them into the two rows in the order they occurred, so a rise and a fall stay distinguishable.
   - With a single recorded value, write it to both rows.
   - With no value, both rows are `null` for that channel.
4. **Derived values are computed per raw row before bucketing.** This covers pace, GAP, speed in km/h and Studio's grade. It fixes bug 6; pace stays `null` at speed 0.
5. **`source`** is the bucket's first row, or `undefined` for an empty bucket. Map hover reads its GPS position from it.
6. **Error bound:** an extreme's x is off by at most one bucket width, ~5 s for a 1-h session (3600 s / 750 buckets).

## Callers
| Stack | x | Channels |
|---|---|---|
| Session overview (`SessionChartsExplorer`), compact + expanded | record time (s) | hr, power, speed, cadence, elevation, grade, pace, gap |
| Studio (`src/features/studio/charts/RouteChartsExplorer.tsx`) | distance (km) | elevation, grade |

- **Studio:** `buildRouteProfile` returns every point, and `selectDisplayIndices` is deleted from `src/packages/gpx/routeProfile.ts`. The explorer buckets the profile with `bucketSeries`. The package keeps not importing from `src/lib/` (`src/packages/CLAUDE.md:5`).
- **Zoom:** overview and Studio pass the synced zoom range as `range`, so zooming re-buckets the raw rows and brings detail back.

## Order
1. `src/lib/chartBuckets.ts` + tests.
2. Session overview: replace `downsample` + `prepare*Data` + `filterTimeSeries` with `bucketSeries`. The chart components keep their data shape.
4. Studio: drop the sampler from `buildRouteProfile` and bucket in the explorer.
5. Build `gpsLookup` / `gpsByDist` from `source`.
6. Delete `downsample` and any helpers that become dead.

## Tests (`tests/lib/chartBuckets.spec.ts`)
- A spike survives (max power 391 W stays 391).
- Every channel has the same length and the same x per index.
- A channel recorded every other record draws continuously (no `null` buckets).
- Regular sparse data (points every 20 m) produces no `null` buckets.
- Smart recording with 1–8 s intervals produces no `null` buckets, in the full view and in a zoom.
- A pause of 83 s produces `null` rows of the matching width.
- A recorded 0 is kept; pace is `null` at speed 0.
- GAP uses the previous **recorded** sample.
- With `range`, the bucket width shrinks and resolution goes up.

## Verification
`vp check`, `vp test -- --run`, `vp exec playwright test`, `vp build`. Manually:
- `cycling.fit`: pauses show as gaps in the overview.
- Hover stays synced across all charts and the map dot.
- Rail max equals the chart peak.
- Zooming shows more detail.
- The Studio profile keeps its peaks.
