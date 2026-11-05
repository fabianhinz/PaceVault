# R80: moving time for passes and the segment charts

Analysis only, no code changed. Every `path:line` checked against the working tree on 2026-11-05.

## 1. The session's moving-time logic

**One function drives every session chart:** `movingSeconds(records)` in `apps/web/src/lib/analysis/movingTime.ts:50-71`. It returns a cumulative moving clock, one value per record (seconds).

- The typical step is the median record step: `medianStep`, `movingTime.ts:6-18`.
- A pair counts as a stop in two cases:
  - **Timer pause** (auto-pause or manual): the wall step minus the `timerTime` step, `movingTime.ts:20-31`.
  - **Standing gap**: the step is more than 2 × typical and the distance moved is under 1 m, `movingTime.ts:33-48` (constants at `:3-4`).
- A stop pair still adds `max(step − stop, typical)`, `movingTime.ts:62-63`. So each stop shrinks to about one typical step instead of vanishing.
- Speed thresholds are not used. A device that records at 1 Hz with the timer running while you stand still counts that standing time as moving. The session behaves the same way.
- `sessionMovingTime` (`movingTime.ts:73-81`) gives the totals (`movingS`, `elapsedS`) for More stats (`apps/web/src/lib/analysis/moreStats.ts:183`).

**How the session charts use it:** `buildSessionChartRows` sets x to `moving[i] / 60` (moving minutes), `apps/web/src/components/charts/chartData.ts:284-291`.

- The charts do not break the line at a stop. The stop is collapsed on the x axis, so the points before and after it sit about one step apart and no long bridge is drawn.
- Null rows come only from empty buckets (`chartData.ts:204-217`; `'gap'` is the default, `'skip'` is used only at `:383`).
- No chart sets `connectNulls`.
- The same clock is used by:
  - lap bands: `apps/web/src/lib/analysis/laps.ts:174-190`
  - dynamic laps: `laps.ts:425`
  - the rail and zoom range: `apps/web/src/components/sessions/charts/railRange.ts:129-147, :188`
  - terrain: `apps/web/src/components/charts/sessionTerrain.ts:41`

**Engine pair logic (not used by the charts):** `activeDurationSec` and `isMovingPair`, with a 10 s pair gap and speed > 0, in `packages/engine/src/recordPairs.ts:3-27`. These feed metric sums (zones, stress, energy, cadence, climbs). They do not form a clock, so they don't fit here.

**What can be reused for a pass slice:**

- `movingSeconds`, run over the **full session** records. The median step and the stop rules then match the session exactly.
- A missing piece: the moving clock at an interpolated timestamp. Pass start and end come from projections (`segments.ts:338-374`) and fall between records. This would be a small new helper in `movingTime.ts`.

**Demo data:** demo stops write a speed-0 record every 5 s with `timerTime === timestamp` and unchanged distance (`apps/web/src/lib/demo/demoRecords.ts:330-332, :349-364`). The standing-gap rule catches them, and each 5 s sample counts 1 s. A 60 s demo stop therefore still adds about 12 s of moving time.

## 2. Pass duration: computed, stored, read

**Computed** in the engine. `passFrom` takes the timestamp at the projection of the reference start and end, then `durationSec = end − start` (`packages/engine/src/segments.ts:464-468`).

- The track is resampled every 10 m by distance (`segments.ts:138-154`). Points with no distance gain are skipped (`:147`), so the matcher's track holds no standing points at all. Only their elapsed time remains.
- When a session rides the stretch several times, `fastestPassOn` keeps the shortest elapsed visit (`segments.ts:495`).
- Entry point: `segmentPasses`, `segments.ts:581-602`.
- Engine test that pins this behaviour: `packages/engine/tests/segments.spec.ts:154`.
- Settled as agent decision `review/decisions.md:113`.

**Worker:** `segments.worker.ts` calls `matchSegment` (`apps/web/src/lib/workers/segments.worker.ts:40-46`).

- `datedPasses` adds the session date to each engine pass (`apps/web/src/lib/analysis/segmentMatching.ts:194-209`).
- The full session records are already in `run.records` (`segmentMatching.ts:138-153`).

**Stored** in the `segment-passes` IndexedDB store, keyed by `segmentId` (`apps/web/src/lib/storage/db.ts:38`, read with `safeParse` at `:133-140`).

- Shape: `StoredSegmentPass { sessionId, date, startTimestampSec, endTimestampSec, durationSec, coverageRatio }`, `apps/web/src/lib/workers/segmentsContract.ts:15-22`.
- The entry carries `matcherVersion`, `segmentsContract.ts:26-32`.

**Readers of `durationSec`:**

| Reader | Where |
| --- | --- |
| Best pass (derived on every call, never stored) | `apps/web/src/components/segments/segmentPasses.ts:10-16` |
| Strip dot scale (fastest to 90th percentile) | `segmentPasses.ts:42-55` |
| Rank | `segmentPasses.ts:57-67` |
| Strip dots and best line | `apps/web/src/components/segments/PassStrip.tsx:47, :64` |
| Selected item: gap to best (+0:07) and time | `apps/web/src/components/segments/PassItem.tsx:30-33` |
| Pass tile time | `apps/web/src/components/segments/PassTile.tsx:23` |
| Session Segments row time | `apps/web/src/components/sessions/session/SessionSegmentList.tsx:36` |
| Chart x domain = max(selected, best) | `apps/web/src/components/segments/charts/SegmentChartsExplorer.tsx:31-32` |
| Rail speed and pace (distance / duration) | `apps/web/src/components/segments/charts/segmentChannels.ts:89-93` |

**Readers of `start/endTimestampSec`** (stay elapsed record timestamps; unaffected):

- record slicing: `segmentChartRows.ts:80-90`
- session map hover span: `SessionSegmentItem.tsx:27-35`
- date order: `segmentPasses.ts:89`

**Hover sync:** charts and rails share x = elapsed seconds through `SEGMENT_HOVER_GROUP`.

- Map markers: `positionAtElapsed`, `apps/web/src/components/segments/charts/segmentExplorerHover.ts:22-30`.
- Rail values: `valueAtElapsed`, `apps/web/src/components/segments/charts/SegmentChannelRail.tsx:39-47`.

## 3. Why the segment charts connect across standing time

1. **The x axis is elapsed time.** `passSeries` sets x = `record.timestamp − pass.startTimestampSec` (`apps/web/src/components/segments/charts/segmentChartRows.ts:113`). The axis domain runs 0 to the elapsed duration (`SegmentChannelChart.tsx:43-47`).
   - When the device pauses (auto-pause), no records are written. The line then jumps straight from the last record before the stop to the first one after it, because no null row lies in between (`SegmentChannelChart.tsx:65-81`).
   - When the device keeps recording (demo stops), the stop shows as a flat speed-0, power-0 run as wide as the stop.
2. **The selected and best passes are merged by elapsed second.** `segmentChartRows` adds a row for every sample of both passes and fills the other pass by linear interpolation in `valueAtElapsed`, which does not limit the size of the gap it bridges (`segmentChartRows.ts:148-153`, rows at `:182-206`).
   - Inside one pass's stop, every sample of the other pass produces an interpolated point of the stopped pass. That draws a dense straight ramp across the stop. The rail note during hover reads the same made-up value.
   - The two passes stop at different elapsed seconds, so everything after the first stop is offset between them.
3. `sampled` (`segmentChartRows.ts:176-180`) only thins rows; it plays no part in this.

So the cause is (1) together with (2). Recharts is not the cause: `connectNulls` is off everywhere.

## 4. Smallest fix

**(a) The pass time becomes moving time** (app only; the engine keeps matching on elapsed time):

- `apps/web/src/lib/analysis/movingTime.ts`: add a helper `movingSecondsAt({ records, moving, timestampSec })` that interpolates the moving clock between two records.
- `apps/web/src/lib/analysis/segmentMatching.ts` `datedPasses` (`:194-209`): for each engine pass, take that session's records from `run.records`, run `movingSeconds` once per session, and store `moving(end) − moving(start)` as the pass time.
- `apps/web/src/lib/workers/segmentsContract.ts:4`: bump `SEGMENT_MATCHER_VERSION` from 1 to 2. This is how the repo already invalidates stored passes:
  - `missReasonOf` sees the old version and returns `'matcherVersion'` (`segmentMatching.ts:111`).
  - The baseline is dropped, so every candidate session is matched again (`segmentMatching.ts:125-127`).
  - The entry is overwritten (`segmentMatching.ts:298`).
  - The query key changes as well (`apps/web/src/queries/segments/useSegmentPasses.ts:84`).
  - No IndexedDB schema bump is needed. If a field is renamed or added, old entries fail `safeParse` (`db.ts:137-138`), count as `noEntry` and are matched again too.
- Remaining edge case: when one session rides the stretch several times, the engine still picks the visit with the shortest **elapsed** time (`segments.ts:495`). Only option A2 in Q1 removes this.
- Every reader in section 2 then shows moving time without changes, including best, gap, strip scale, rank, rail speed and pace, and the x domain.

**(b) The segment charts behave like the session charts:**

- `apps/web/src/components/segments/charts/segmentChartRows.ts`: `passSeries` runs `movingSeconds(records)` on the full session (it already receives the full records, `apps/web/src/components/segments/charts/hooks/useSegmentChartRows.ts:24-32`) and sets x = `moving[i] − movingSecondsAt(pass.startTimestampSec)`.
  - Rename `elapsedSec` to `movingSec` in `PassSeries`, `SegmentChartRow`, `valueAtElapsed` and `positionAtElapsed`.
  - Stops then collapse exactly as in the session charts. The selected and best passes line up on moving seconds, so the interpolation in `valueAtElapsed` only bridges a step of about 1 s.
- Follow the rename in `SegmentChannelChart.tsx` (`dataKey`, `:44`), `SegmentChannelRail.tsx:39-47` and `segmentExplorerHover.ts:9-30`.
- `SegmentChartsExplorer.tsx:31-32` stays as it is: the domain becomes the moving duration, which matches the new x.

**Tests to update:**

- `apps/web/tests/components/segments/charts/segmentChartRows.spec.ts`: x on moving time, a stop collapses.
- `movingTime` spec: `movingSecondsAt`.
- The `segmentMatching` spec (if one exists): moving duration and version 2.
- The engine spec at `segments.spec.ts:154` stays (the engine keeps elapsed time) unless the owner picks A2.

**Decision log:** decision `review/decisions.md:113` becomes `[~] … Superseded by: R80`.

## 5. Open questions for the owner

**Q1. Where moving time is computed.**

- **(A1, recommended)** In the app, after matching (`datedPasses` plus `passSeries`). Two files plus the version bump. The engine stays unchanged. A session that rides the stretch twice keeps the visit with the shorter elapsed time.
- (A2) Move `movingSeconds` into `packages/engine` and give `SegmentTrackPoint` a `movingSec` alongside `timestampSec`. `passFrom` and `fastestPassOn` then work on moving time. This touches five more import sites (`chartData`, `railRange`, `laps`, `sessionTerrain`, `demoRecords`) and the engine spec.

**Q2. What a stored pass holds.**

- **(a, recommended)** Rename `durationSec` to `movingSec`, so the field says which time it holds. About 10 readers change name only.
- (b) Keep `durationSec` and change only its meaning. Fewest edits, but the name hides the change.
- (c) Store both `elapsedSec` and `movingSec`, for example to show "4:05 (5:12 elapsed)" later. Nothing reads the elapsed value today.

**Q3. The x axis of the segment charts.**

- **(a, recommended)** Moving time, with stops collapsed like the session charts. Before: a 90 s stop in the selected pass shows as a 90 s straight ramp, and the best line runs 90 s ahead from then on. After: the lines continue without the stop, and both passes are compared at the same moving second.
- (b) Elapsed time, with a null row at every stop so the line breaks. The gap stays visible, but the selected and best passes still drift apart after a stop.

**Q4. Existing passes and best after the change.** Nothing about the best is persisted. It is derived each time from `durationSec` (`segmentPasses.ts:10-16`), and the version bump matches everything again.

- **(a, recommended)** Accept the result: the crown can move to another pass, gaps and the strip change, and there is no note.
- (b) Show a one-time snackbar such as "Pass times now count moving time". This needs a snackbar map entry and a seen flag.

**Caveat for the owner's real-data check:** standing still with the timer running and recording at 1 Hz counts as moving, both in the session and after this fix. Only auto-pause and timer pauses, plus records more than 2 × the typical step apart with under 1 m moved, are removed. A demo stop still adds about 1 s per 5 s sample.
