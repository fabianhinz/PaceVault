# Cleanup audit A: KISS / YAGNI before the merge

Scope: every file changed since `2a3bfb2` (`git diff --name-only 2a3bfb2`, plus untracked files) in `apps/web`, `packages/*`, `tools/workbench` (133 source files), plus `tech.md` as the planned record. Analysis only; no code changed.

## Short answer

Fewer leftovers than the owner fears. The replaced designs are gone cleanly:

- No file, hook or spec of the scatter (`useScatterWindow`, `useScatterScrollEndEffect`, `useDragScroll`, `PassScatter`, `PassTimesRow`, `PassGapSpark`), the Zeiten/Durchgänge tabs, the explorer legend, the dotted best line (`PvPlotStripBackdrop`, `PvPlotStripReference`), the pick popup (`SegmentsPickPopup`, `useSegmentsPickPopup`, `segmentBounds`) or the detection (`segmentDetection.ts`, `useStoredSegments`) is left in the source tree.
- Every one of the 34 i18n keys added since the base is used by an `m.<key>` call; `en.json` and `de.json` have the same key set.
- No export in the changed files is unused: the 25 exports without an outside importer are all used inside their own module (types, fetcher/key pairs, schemas), which the conventions ask for.
- `packages/engine/src/segments.ts` has no unused function; every module-level const is referenced at least twice.

What is left falls into four groups: optional props no caller passes, a few names from older designs, one behaviour kept from a removed design (all pass records preloaded for the scrub preview), and stale records in `tech.md` and `plan.md`.

## 1. Dead code

| # | What | Evidence | Proposal | Effort | Risk |
|---|------|----------|----------|--------|------|
| D1 | `PvActionItem` `trailing` slot and its size map | `packages/ui/src/components/pvActionItem/PvActionItem.tsx:26-29`, `:38`, `:100-104`. The only two callers pass neither: `apps/web/src/components/segments/PassItem.tsx:38-57`, `apps/web/src/components/sessions/session/SessionSegmentItem.tsx:41-63`. The chevron went in R11/R67 | delete | S | none |
| D2 | `PvActionItem` `selected` (bg + `aria-pressed`) | `PvActionItem.tsx:41`, `:61`, `:69`; no caller passes it (the select-on-click behaviour went in R11) | delete | S | none |
| D3 | `PvPlotStrip` `className` | `packages/ui/src/components/pvPlotStrip/PvPlotStrip.tsx:11`, `:19`; its only caller `apps/web/src/components/segments/PassStrip.tsx:40-54` passes none | delete | S | none |
| D4 | `SegmentHeader` `className` | `apps/web/src/components/segments/SegmentHeader.tsx:19`, `:27`; callers `SegmentItem.tsx:35` and `index.tsx:32-37` pass none | delete | S | none |
| D5 | Test ids no spec, e2e or capture reads | `segment-item-skeleton` (`SegmentItemSkeleton.tsx:6`), `segment-passes-note` (`SegmentPassesNote.tsx:7`), `segment-subtitle-skeleton` (`SegmentHeader.tsx:37`), `segments-row-skeleton` (`apps/web/src/components/sessions/session/SegmentsRow.tsx:19`); grep over `apps/web/tests`, `apps/web/e2e`, `packages/ui/tests`, `review/capture.spec.ts` | delete, or keep if the owner wants hooks for later specs | S | none |
| D6 | Exports with no outside reader | `COLLAPSED_SESSION_SEGMENTS` (`SessionSegmentList.tsx:12`); `workerMessageOutSchema` exported only for its spec (`apps/web/src/lib/workers/segmentsContract.ts:94`; the other worker contracts keep it module-local, e.g. `personalBestsContract.ts:30`), and its `metrics` is `.optional()` (`:97`) although the worker always sends it (`segments.worker.ts:51-59`) | un-export; make `metrics` required | S | low (contract spec case "without metrics" goes) |
| D7 | `SECONDS_PER_MINUTE` exported from the hover module, plus a second copy | `apps/web/src/components/segments/charts/segmentExplorerHover.ts:6` (read by `SegmentChannelRail.tsx:11`, `SegmentChannelChart.tsx:8`) and a local copy at `segmentChartRows.ts:34` | one constant, next to its readers | S | none |

## 2. YAGNI / over-engineering

| # | What | Evidence | Proposal | Effort | Risk |
|---|------|----------|----------|--------|------|
| Y1 | **Every pass's records are loaded before the charts show.** Built for R44 (the scatter scrub previewed any pass in the explorer, V5). The scrub went with R51; the strip only previews on tap | `apps/web/src/components/segments/charts/hooks/useSegmentChartRows.ts:24-32` slices all `segment.passes`, `:39` stays loading while any is pending; spec `apps/web/tests/components/segments/charts/hooks/useSegmentChartRows.spec.ts` asserts "keeps loading until every pass in the view has its records". A segment with 93 passes reads 93 sessions' records on open | owner decision (see Open questions): load only selected + best, keep the shown series until the next one has loaded (the R15 pattern) | M | medium: tap latency on a cold pass; the R78 optimistic tile stays |
| Y2 | `useSessionRecordSlices` is a generic multi-session loader with one caller | `apps/web/src/queries/sessions/useSessionRecordSlices.ts:28-55` (`scope`, generic `slice`); only importer `useSegmentChartRows.ts:1` | follows Y1: with two passes it can stay (it already caches per pass) or shrink; decide after Y1 | S | low |
| Y3 | `SegmentChartSeries.selectedPass` repeats the input | `useSegmentChartRows.ts:7`, `:42` returns `selected` unchanged; read at `SegmentChartsExplorer.tsx:26`. Left over from "keep the previous series while the new one loads" (R15), which the preload made moot | drop the field, use `props.selected` (or keep it if Y1 brings R15 back) | S | low |
| Y4 | Segment matching metrics go out three ways | `apps/web/src/lib/debug/segmentMetrics.ts:39` (`latestMetrics` for `pvDebug.segmentMetrics()`), `:41` (`window.pvSegmentMetrics`), `:42` (`console.info`, on by default in DEV per `:32`). R50 keeps only `pvDebug.segmentMetrics()` | after the R50 real-data measurement: keep `pvDebug` and the `cold` flag, drop the window global and the console log | S | none |
| Y5 | `useListExpansion` sits in the segments folder, but its only caller is in sessions. It was shared with the pass-card collapse, which is gone | `apps/web/src/components/segments/hooks/useListExpansion.ts:9`; only importer `apps/web/src/components/sessions/session/SessionSegmentList.tsx:8`, `:21` | move to `sessions/session/hooks/` (hook-directory TDR) | S | none |
| Y6 | `SessionSegment.rank` and `passRank` only feed a best flag since R55 removed the rank suffix | `apps/web/src/components/segments/segmentPasses.ts:57-67`, `:72`, `:85`; the only reader is `SessionSegmentList.tsx:35` (`rank === 1`) | replace with `best: boolean` (ties stay best). Note: `tech.md:269` and `useSessionSegments.spec.ts` still describe the rank | S | low |
| Y7 | `SessionSegmentItem` takes both `pass` and `value`, and `value` is always `formatRaceTime(pass.durationSec)` | `SessionSegmentList.tsx:36-37`; `SessionSegmentItem.tsx:20`, `:62` | drop `value`, format inside | S | none |
| Y8 | `SegmentRideRail` takes `startLabel` and `endLabel`, but its one caller always passes the same two messages | `apps/web/src/components/sessions/session/SegmentRideRail.tsx:8-9`; `SessionSegmentList.tsx:29` | read the messages inside | S | none |
| Y9 | `PvPlotStripTile` has 4 states where 3 differ: `idle` and `bestIdle` are identical in both maps | `packages/ui/src/components/pvPlotStrip/PvPlotStripTile.tsx:11` = `:13`, `:18` = `:20` | collapse to idle / pressed / bestPressed | S | none (pixels unchanged) |
| Y10 | `formatSignedRaceTime`: the zero and positive branches return the same thing since R83 | `apps/web/src/lib/format/formatters.ts:249`, `:251` | `if (rounded < 0) return …; return \`+…\`` | S | none |

## 3. KISS and duplication

| # | What | Evidence | Proposal | Effort | Risk |
|---|------|----------|----------|--------|------|
| K1 | **The map layer runs the full matched + filtered segment pipeline to draw one polyline.** On the tab, `useSegmentMapTracks` builds every filtered `MatchedSegment` (`apps/web/src/components/mapBackground/hooks/useSegmentMapTracks.ts:52`) only so `useSegmentLayers` can find the hovered one's geometry (`useSegmentLayers.ts:112-117`). On the page it runs `useSegmentDetail` with the filter (`useSegmentMapTracks.ts:53`), but the layers read only `geometry` and `sport` (`useSegmentLayers.ts:36-39`, `:47`), and both come from the stored polyline (`segmentPasses.ts:99-107`). `mode` (`useSegmentMapTracks.ts:11`) repeats `scene.kind` | look the store segment up by id (hovered id on the tab, scene segment id on the page) and decode its polyline; drop `mode`, the passes query and the filter from the map path | M | medium: R49 scene gating, so keep `mapScene.integration.spec.tsx` and `useMapTracks.integration.spec.ts` green |
| K2 | Two copies of the create-mode name dialog wiring | `apps/web/src/components/segments/SaveSegmentPill.tsx:53-68` and `apps/web/src/components/segments/ReferenceSegmentDialog.tsx:20-35`: same `useSimilarSegment`, `segmentFactsLine`, `onSubmit → save` | one `CreateSegmentDialog({ draft, title, onClose })`, used by both | S | low (`SegmentNameDialog.spec`, e2e) |
| K3 | The pass strip's look is copied into its skeleton | container class `PassStrip.tsx:35-38` = `PassStripSkeleton.tsx:12-15`; tile geometry `PassStripSkeleton.tsx:23` copies `PvPlotStripTile.tsx:64` (`size-18 … rounded-lg border p-2`) and the 40 px plot (`:76`). R68 and R74 each had to change both | one shared class constant for the container; a kit `PvPlotStripTileSkeleton` (or exported tile class) for the tile | S | none |
| K4 | `useSaveSegment().save(null)` shows the no-GPS snackbar | `apps/web/src/components/segments/hooks/useSaveSegment.ts:15-19`; callers `SaveSegmentPill.tsx:44`, `hooks/useReferenceSegmentMenuEntry.ts:46` | optional: a separate `notifyNoGps`, so `save` always saves | S | none |
| K5 | The filter view is built three times (sessions map, `Date.now()`, `segmentInFilter`) | `hooks/useFilteredSegments.ts:15-19`, `hooks/useSegmentDetail.ts:27-36`, `hooks/useSessionSegments.ts:15-29` | keep: each hook is about 15 lines and states its own `keptSessionId`; folding them saves little | none | none |
| K6 | Chart row merge interpolates both ways with a linear `findIndex` per point | `apps/web/src/components/segments/charts/segmentChartRows.ts:128-129`, `:182-206`; the rails call `valueAtElapsed` per hover too (`SegmentChannelRail.tsx:62-68`) | keep the shape (the shared x rows drive hover sync); if R80 or the real-data check shows lag on long references, switch `neighbourIndex` to a binary search | S | none |
| K7 | Segment channel table duplicates the session explorer's titles, icons, colours and units | `apps/web/src/components/segments/charts/segmentChannels.ts:101-227` vs inline specs in `apps/web/src/components/sessions/charts/SessionChartsExplorer.tsx:230-231`, `:323` | not before the merge: a shared channel table touches the session explorer; own backlog item | L | medium |
| K8 | `SegmentPassesNote` is rendered two ways: in a glass card when the filter leaves no pass (`SegmentDetail.tsx:23-28`), bare when there is no entry (`index.tsx:47`) | as cited | optional: one wrapper | S | look |

## 4. Names from older designs (optional)

- `clearPassFocus` and `useClearPassFocusEffect` (`apps/web/src/store/segmentFocus.ts:10`, `:29`; `apps/web/src/components/segments/hooks/useClearPassFocusEffect.ts:4`): the store holds only the explorer scrub markers since R39; `clearExplorerMarkers` would say what it does.
- `finding` (`apps/web/src/components/segments/hooks/useSegmentDetail.ts:14`, `:38`) is named for the "Finding passes…" line R53 removed; it means "matching".
- "chip" survives the R60 rename to plot strip: `passChipLabel` (`apps/web/src/microcopy/segments.ts:47`), keys `ui_segment_pass_chip` / `_best`, test id `pass-chip` (`apps/web/src/components/segments/PassTile.tsx:19`), `SKELETON_CHIP_KEYS` (`PassStripSkeleton.tsx:6`), the `chipKit` node (`tech.md:101`).

Renaming touches i18n keys, specs and the capture spec; the value is low. Rename only the identifiers if the round happens anyway.

## 5. Checked and kept

- `encodeURIComponent` / `decodedParam` (`apps/web/src/routing/pageRegistry.ts:58`, `apps/web/src/routing/useRouteMatch.ts:9-22`): segment ids are UUIDs now (`segmentCreation.ts:83`), but sessions, trips and studio routes encode too (`pageRegistry.ts:54-62`), so the decode fixes every route. Keep.
- `useScrollToEndEffect` (one caller, `PvPlotStrip.tsx:17`): the effect TDR wants it in its own module. Keep.
- `scroll-fade-x` and the x axis in `useScrollFadeEffect`: removed in R65, back in R75/R77, used by `PvPlotStrip.tsx:16`, `:24`. Keep.
- `PvStatRail` `notePlacement` and note `icon`: used by `SegmentChannelRail.tsx:59`, `:27-34`. Keep.
- `PvZoomResetPill` `children`: used by `SessionChartsExplorer.tsx` for `SaveSegmentPill`. Keep.
- `BestCrown` (one importer, `BestHighlight.tsx:15`): small, separate concern. Keep.
- `MapScene` / `useMapScene` / `mapHover` (R49): every scene kind and hover kind has a reader. Keep.
- `packages/testing` additions (`gpsPathRecordSeries`, `createMockSegment*`) and `apps/web/tests/factories/segments.ts`, `trips.ts`: all used.

## 6. Stale records

`tech.md`, file and diagram entries that no longer describe the code:

- `tech.md:32`: data flow node "segment page: Finding passes… / passes" (R53 removed the line).
- `tech.md:174`, `tech.md:258`: `SessionSegmentItem` shows "time · rank"; since R55 it is time only.
- `tech.md:197`, `tech.md:240`, `tech.md:252`: `SegmentPassesNote` "1 pass · only this session so far" and "the single-pass note"; since R79 it is only the no-pass note.
- `tech.md:217`: `PvPlotStripTile` "no box for the best tone, dotted …" (garbled; the best tile has a border since R58/R71).
- `tech.md:237`: microcopy lists "rank"; there is no rank copy any more.
- `tech.md:269`, `:302`, `:305`: rank in `useSessionSegments` / its specs (true today, goes with Y6).
- `tech.md:292`: `useClearPassFocusEffect` "clears the hovered pass": there is no hovered pass since R39.
- `tech.md:309`: `segmentPasses.spec.ts` "median, rank, window, ride order"; the spec covers `passDotScale`, `passesByYear`, `passRank`, `sessionSegmentsInRideOrder` (`apps/web/tests/components/segments/segmentPasses.spec.ts:19`, `:47`, `:69`, `:80`).
- `tech.md:346`: formatters "short date" (removed in R46; the remaining additions are `day-month`, `year`, signed race time, `formatList`).
- The Interfaces section (`tech.md:398-636`): every declared identifier exists in the source.

`plan.md` (the contract; the plan skill updates it, not a worker):

- `## Files` still lists removed or replaced files: `plan.md:142` (`SegmentsPickPopup.tsx`, `PassTimesRow.tsx`), `plan.md:143` (scatter, `useScatterWindow`, `useScatterScrollEndEffect`, `apps/web/src/lib/hooks/useDragScroll.ts`), `plan.md:147` (`useSegmentsPickPopup.ts`, `trackPicking.ts`).
- `## Tests`: `plan.md:172` names `apps/web/tests/components/segments/PassTimesRow.spec.tsx`; `plan.md:174` (e2e) still expects "Finding passes…" and "Pass times".
- `## Decisions (settled)`: `plan.md:25` still says the page shows "Finding passes…" after Save (R53).

## Verdict

**Yes, one short cleanup round before the merge**, held to deletions and S-sized simplifications that change no pixels and no behaviour, plus the record update. About half a day. K1 and Y1 are worth doing only with the owner's go, because they change data flow or loading behaviour.

Order:

1. Dead code: D1–D7 (kit props, unread exports, test ids, duplicate constant).
2. Zero-behaviour simplifications: Y5, Y6, Y7, Y8, Y9, Y10, K2, K3.
3. With the owner's go: Y1 (+ Y2, Y3), then K1. Each gets its own verification pass (the R49 map specs for K1).
4. After the R50 real-data measurement: Y4.
5. Last, so they describe the final state: refresh `tech.md` (section 6) and the plan's Files, Tests and Decisions lines (plan skill).

Not in the round: K5 and K6 (keep), K7 (own item), the renames in section 4 (only if cheap while touching those files).

## Open questions for the owner

1. **Y1, chart loading on the segment page.** (a) Load only the selected and the best pass; a tap on a not-yet-loaded tile keeps the current charts until the new pass has loaded (recommended: the preload served the scrub preview, which is gone, and it reads every pass's session records on open); (b) keep preloading every pass in the filter (instant taps, cost grows with the pass count).
2. **K1, map segment tracks.** (a) Look up the hovered or page segment in the store and decode its polyline, without the passes query and the filter (recommended); (b) keep the current path.
3. **Section 4 renames.** (a) Rename identifiers only (`clearExplorerMarkers`, `matching`, `passTileLabel`), keep the i18n keys and test ids (recommended); (b) rename everything including keys and test ids; (c) leave as is.
