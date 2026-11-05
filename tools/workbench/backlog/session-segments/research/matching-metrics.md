# Segment matching: cold-run metrics (R50)

Input: `apps/web/src/components/segments/coldSegmentMetrics.json`. One cold run (`pv:debug:segments = 'cold'`) on a 10-core desktop Mac in Chrome 156. 12 segments, 375 sessions read, workerMs 3021, mainThreadMs 3263, matcher v1.

## 1. What the numbers say

**How the run works.** `useSegmentPasses` starts a fresh worker for each query (`apps/web/src/queries/segments/useSegmentPasses.ts:45`). The worker loads all `session-gps` rows once (`apps/web/src/lib/workers/segments.worker.ts:37`). It then matches the segments **one after another** (`segments.worker.ts:39-49`), and all of them share one `records` map (`segments.worker.ts:35`, passed at `:43`). `recordsOf` reads and decodes a session's records only on its first use in the run (`apps/web/src/lib/analysis/segmentMatching.ts:147-152`). Each read is an IDB get, a gzip decompress, `JSON.parse` and a zod parse of every record (`apps/web/src/lib/storage/recordCodec.ts:55-66`, schema `:8-21`). Every candidate session is resampled again for **every** segment (`segmentTrack` per candidate, `segmentMatching.ts:186-190`; resampling `packages/engine/src/segments.ts:138-154`). Projection and the grid are also rebuilt per segment (`segments.ts:592-597`).

**Oddities explained.**

- **`sessionsChecked` 352 vs 195** is the sport filter (`segmentMatching.ts:314`). 352 sessions of one sport and 195 of the other have detailed records and are not planned (`segmentMatching.ts:72-80`). The two 195-segments (5f018159, 887a23a5) belong to the other sport.
- **`recordsRead` is below `bboxCandidates`, or 0**, because records are cached across segments within a run. `recordsRead` counts only the first read (`segmentMatching.ts:150`). Later segments find most or all of their candidates already in memory. The 12 `recordsRead` values add up to 375, which equals `sessionsRead` (= `records.size`, `segments.worker.ts:56`). So every session was read exactly once. 5f018159 and 887a23a5 have the same 142 candidates (they overlap): the first one read 142 sessions, the second read 0.
- **`recordsRead` = `bboxCandidates`** (472c66fa, 5f018159): the first segment of each sport reads every candidate itself. The source session is always a candidate (`segmentMatching.ts:170`), so the reference read is counted inside that number too.
- **6db7ab43 is the slowest (707 ms)** because it runs 8th but its large bbox (4945 reference points ≈ 49 km at 10 m steps, `segments.ts:81`) covers 121 sessions that no earlier segment had read. Reads are about 500 ms of that and matching CPU about 200 ms. The long reference itself is not the cost: the walk only runs on tracks that hit both the start and the end (`segments.ts:510-514`).
- **The ~240 ms gap (mainThreadMs − workerMs)** is outside the matching. The 12 segment `ms` values add up to ~3011, so the worker spends only ~10 ms outside them, mostly the `session-gps` load. The gap is spawning the worker, fetching and evaluating its module, cloning the messages both ways and scheduling `onmessage`. `startMs` is taken before `new Worker` (`useSegmentPasses.ts:44`); `workerMs` starts at `onmessage` (`segments.worker.ts:31`). The gap is paid on every run, warm runs included.

**Where the time goes (rough fit).** The five segments with 0 reads show matching CPU alone: ~1.3–1.7 ms per candidate for the 352-sport (fb206e59 168 ms/129, 80e9283f 146/88, a7dcba07 110/74, db6b1ca4 62/36) and ~0.4 ms per candidate for the other sport (887a23a5 55/142; not explained, the next instrumentation should show why). Subtracting that from the reading segments gives **~3–5.5 ms per record read** (5f018159 ≈ 2.9, 6db7ab43 ≈ 4.1, 472c66fa ≈ 5.5, which includes first-run JIT and IDB open). That puts the split at about **half reads (375 × ~4 ms ≈ 1.5 s), half matching CPU (1042 segment×candidate pairs ≈ 1.3–1.5 s)**.

**Prefilter quality.** 1042 bbox candidate pairs yield 173 passes (17 %). Per segment it ranges from 7 % (472c66fa 5/74, 887a23a5 3/142) to 39 % (fb206e59 50/129). The bbox test (`segmentMatching.ts:169-174`) lets through every session that touches the area.

## 2. UX

- **What the user sees.** The query resolves only once, when the whole batch is done (`useSegmentPasses.ts:54-61`), so the slowest segment holds up all of them.
  - Segments tab: 10 skeleton rows until done (`apps/web/src/components/segments/SegmentsTab.tsx:16`).
  - Segment page: header with a subtitle skeleton, `PassStripSkeleton` and an empty explorer frame (`apps/web/src/components/segments/index.tsx:28-46`).
  - Session page: segment chips are undefined until done, because `useSessionSegments` runs the same full query (`apps/web/src/components/segments/hooks/useSessionSegments.ts:12`). Opening any session therefore starts the cold run as well.
- **Cold, desktop:** ~3.3 s of skeletons. Acceptable for a one-off.
- **Cold, phone (3–5×):** about **10–16 s** for these 12 segments, and it grows roughly linearly with segments × candidates (≈ 25–40 s at 30 segments). It happens once per matcher bump (R80 → v2) or after clearing data. The query key carries the matcher version (`useSegmentPasses.ts:84`). After a reload, `keepPreviousData` (`:109`) has no previous data, so the user sees skeletons for the whole run. Tolerable as a rare event, poor for a first impression after an update.
- **Phone memory risk (not measured):** the run keeps all 375 decoded record arrays alive until the end (`segments.worker.ts:35`). At ~0.3–1 MB per session as JS objects that is roughly 100–400 MB in one worker, which could crash the worker or tab on iOS. The phone run must check this.
- **Warm path stays cheap.**
  - Cache hit: one `getSegmentPassesEntry` per segment. `unchecked` is empty, so `newPassesOf` returns before any read (`segmentMatching.ts:263-264`). The cost is the ~240 ms spawn plus the `session-gps` load.
  - After an import: the entry is partial, and only new sessions inside the bbox are read. Each segment with at least one such candidate also reads its source again to rebuild the reference (`segmentMatching.ts:265`, `:163`). Expect tens of ms per segment on desktop.
  - First save: the new segment is `noEntry` and the others hit, so it costs one segment cold (55–700 ms desktop, ×3–5 phone) plus the spawn.

## 3. Bottlenecks and cheapest wins (ranked by gain ÷ effort)

1. **Add phase timing first (tiny effort, debug-only):** `readMs` and `matchMs` per segment in `segmentMatchMetricsSchema` (`apps/web/src/lib/workers/segmentsContract.ts:65-75`), set in `recordsOf` and around `segmentPasses`. The read/CPU split above is fitted, not measured. Every ranking below depends on it.
2. **Polyline start/end prefilter (medium effort, largest gain).** Before reading a session's records, test that its stored polyline passes within the end tolerance of both the reference start and the reference end. The polyline is already in memory (`segments.worker.ts:37`) and simplified to ~5.5 m (`apps/web/src/lib/analysis/gpsTrack.ts:12`), well under the 50–200 m end tolerance (`segments.ts:85-86`). The test needs point-to-line distance, not vertex distance, because simplified vertices are far apart on straight roads. Expected effect: reads and pairs drop from bbox level (1042 pairs, 17 % hit) to close to the sessions that actually reach both ends, likely less than half the reads and about a third of the CPU. Cold run ≈ 3.0 s → ~1–1.5 s (estimate). It also cuts memory. The reference must exist first, so the source records are read before the prefilter (this already happens, `segmentMatching.ts:265`).
3. **Keep tracks instead of records, or match per session (low to medium effort, CPU and memory).** Cache the resampled `SegmentTrack` per session in place of the records. This removes ~667 repeated resamples (1042 pairs − 375 sessions). It also lets the decoded records be dropped and limits the zod/JSON objects that stay in memory. Gain: part of the ~1.4 s CPU (the resample share is unknown until item 1 measures it) plus the memory risk from §2. Inverting the loop (read a session once, test it against every segment) is the larger version of the same idea.
4. **Cheaper record decode (low effort, needs item 1).** If `readMs` turns out to be dominated by the zod parse of every record (`recordCodec.ts:8-21`) rather than IDB and gzip, validating only the array shape on this hot path would cut the ~3–5 ms per read. Do not change this before measuring.
5. **Progressive results (medium effort, UX only).** Post each segment's entry as it finishes instead of one `done`. The list and the segment page then fill in early. This does not change total time, but on a phone it turns 10–16 s of skeletons into the first rows after ~1 s.
6. **Not justified by the numbers:**
   - Several workers: IDB reads would contend, and items 2–3 remove most of the work first.
   - Thinning reference points: the long reference was not the cost.
   - Reusing a warm worker: saves ~240 ms per run and matters only if warm runs feel slow.

## 4. What is missing to close the real-data check

Each run: open DevTools, then `copy(pvDebug.segmentMetrics())` (`apps/web/src/lib/debug/pvDebug.ts:10`).

- **Warm run (desktop):** remove the flag or set it to `log` (`apps/web/src/lib/debug/segmentMetrics.ts:29-34`), reload, open the Segments tab. Expect `cache: 'hit'` for every segment and `recordsRead: 0`; record mainThreadMs.
- **After-import run:** with `log`, import 1–3 new sessions that cross known segments, then open the Segments tab. Expect `partial` with small `sessionsChecked`/`recordsRead`.
- **First save:** with `log`, save a new segment from a session chart, then open the Segments tab or stay on the session. Expect one `noEntry` miss and hits for the rest.
- **Phone run (cold and warm):** use Android Chrome through `chrome://inspect` remote DevTools, or iOS Safari Web Inspector from a Mac. Set `localStorage.setItem('pv:debug:segments','cold')`, reload, open the Segments tab, copy the metrics, then repeat with `log`. Also watch memory (Performance monitor or Safari Timelines) for the risk in §2. Note the device model next to `environment`.
- Take every run on the same data set as the desktop cold run, and once more after R80 (matcher v2, moving time) lands. The R80 run is the real "after update" cold case.

## 5. Where `coldSegmentMetrics.json` belongs

It is measurement data that no code imports or references, and it is untracked. In `apps/web/src/` it only adds noise next to app code. Move it to the item's research folder, for example `tools/workbench/backlog/session-segments/research/metrics/cold-desktop-v1.json`, and put the warm, import, save and phone runs beside it. The folder is cleaned up with the item after acceptance. If a figure is worth keeping after that, the plan's real-data check line should quote the number instead of keeping the file.
