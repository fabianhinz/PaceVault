# Cleanup audit B: KISS / YAGNI before the merge

Scope: every file changed since `2a3bfb2` plus the untracked files (128 tracked + ~50 untracked) in `apps/web`, `packages/*`, `tools/workbench` (backlog only `tech.md`). Read-only; no code, plan or review file changed. Every `path:line` below was checked against the working tree on 2026-11-05.

## Method

- Every new or changed module: importer count outside itself (fixed-string grep on `/<name>.ts` and `/<name>'` across `apps/web/src`, `packages/*/src`, `tools/workbench/{scripts,site/src}`; tests counted separately).
- Every `export const|type|interface` in those modules: importers outside the declaring file, in source and in tests.
- Props of new kit/app components against every call site.
- The 33 added i18n keys in `packages/i18n/messages/en.json` against `apps/web/src` and the workbench site.
- Test ids against `apps/web/e2e`, `apps/web/tests`, `packages/ui/tests`, `tools/workbench/scripts` and the item's `review/capture.spec.ts`.
- Leftover names of removed designs (scatter, window, drag scroll, scroll end, legend, chip, tabs, detection, type labels, Pass times).

## Headline

The round-by-round removals were done carefully. There are **no dead modules**: every new module has at least one source importer. **All 33 added i18n keys are used.** The engine is matcher-only: all six exports of `packages/engine/src/segments.ts` are used, and no detection code is left. Nothing of the scatter, window, drag scroll, scroll-end, legend, tabs, dotted best line or spacing picker survives in `src/`. What is left is small:

- a handful of props and knobs no caller passes,
- one real leftover of R44: the explorer waits for the records of *every* pass before it draws two lines,
- one duplicated create-dialog wrapper (R84),
- a cache-write heuristic that skips saves it should make,
- "chip" naming after the R60 rename,
- over-exported symbols,
- stale lines in `tech.md`.

## 1. Dead code

| # | What | Evidence | Proposal | Effort | Risk |
| --- | --- | --- | --- | --- | --- |
| D1 | `PvActionItem` props `selected` and `trailing`, plus `TRAILING_CLASS_BY_ACTION_ITEM_SIZE` | Declared `packages/ui/src/components/pvActionItem/PvActionItem.tsx:26-29`, `:38`, `:41`; read `:61`, `:69`, `:100-104`. Both callers pass neither: `apps/web/src/components/segments/PassItem.tsx:38-57`, `apps/web/src/components/sessions/session/SessionSegmentItem.tsx:41-63` (0 of 2) | delete | S | low (kit, no spec covers them) |
| D2 | `SegmentHeader` prop `className` | `apps/web/src/components/segments/SegmentHeader.tsx:19`, `:27`. Callers `apps/web/src/components/segments/index.tsx:32-39` and `apps/web/src/components/segments/SegmentItem.tsx:35` pass none (0 of 2) | delete | S | none |
| D3 | `PvPlotStrip` prop `className` | `packages/ui/src/components/pvPlotStrip/PvPlotStrip.tsx:11`, `:19`. Only caller is `apps/web/src/components/segments/PassStrip.tsx:40-72`, which passes none | delete | S | none |
| D4 | `SegmentNameDialog` prop `mode`: it only blanks `similarSegment` in rename mode, and rename already passes `undefined` | `apps/web/src/components/segments/SegmentNameDialog.tsx:20`, `:37`; rename call `apps/web/src/components/segments/SegmentActionsMenu.tsx:42-46`; create calls `SaveSegmentPill.tsx:58`, `ReferenceSegmentDialog.tsx:25` | delete (`similarSegment` alone carries it) | S | none (`SegmentNameDialog.spec.tsx:98` "no similar hint when renaming" keeps passing) |
| D5 | `sessionRecordSlicesQueryKey` branches without `scope` or `sessionId` | `apps/web/src/queries/sessions/useSessionRecordSlices.ts:20-26`; the only call `:39` always passes both; nothing invalidates by prefix (grep `session-record-slices`: 1 hit, the constant) | collapse to one key builder | S | none |
| D6 | Matching metrics knobs beyond R50 | `clockMs` injection `apps/web/src/lib/analysis/segmentMatching.ts:58`, `:308-309`: no spec passes it. `window.pvSegmentMetrics` `apps/web/src/lib/debug/segmentMetrics.ts:8-12`, `:41` duplicates `pvDebug.segmentMetrics()` (`apps/web/src/lib/debug/pvDebug.ts`, the one R50 asks for). `metrics` is optional in `apps/web/src/lib/workers/segmentsContract.ts:97` although the worker always sends it (`apps/web/src/lib/workers/segments.worker.ts:51-59`), hence the guard `apps/web/src/queries/segments/useSegmentPasses.ts:56-59` | drop `clockMs` and the window global; make `metrics` required. Keep `pv:debug:segments` / `cold` (plan Approach 4 keeps them) and the metric fields until R50 is measured | S | none |
| D7 | Over-exported symbols: exported, only used in their own file (no importer in src or tests) | `segmentsContract.ts:6`, `:15`, `:43`, `:65`, `:79` (sub-schemas). `workerMessageOutSchema` `:94` is imported only by `apps/web/tests/lib/workers/segmentsContract.spec.ts:6`; the sibling contracts keep it private (`gpsBuildContract.ts:10`, `personalBestsContract.ts:30`). Others: `useSessionRecordSlices.ts:12`, `:20`; `useSegmentPasses.ts:34`; `charts/segmentChartRows.ts:26`, `:80`; `charts/segmentChannels.ts:28`; `charts/hooks/useSegmentChartRows.ts:6`; `hooks/useListExpansion.ts:3`; `segmentPasses.ts:26`; `sessions/session/SessionSegmentList.tsx:12`; `mapBackground/mapScene.ts:15`; `mapBackground/hooks/useSegmentMapTracks.ts:11`; `lib/debug/segmentMetrics.ts:3`, `:6`; `store/segments.ts:9`; `packages/engine/src/segments.ts:7`, `:32`; `PvActionItem.tsx:8` | drop the `export` keyword (lint does not flag it; root CLAUDE.md §2 "delete dead code") | S | none |
| D8 | Test ids nobody queries | `segment-item-skeleton` `SegmentItemSkeleton.tsx:6`, `segment-passes-note` `SegmentPassesNote.tsx:7`, `segment-subtitle-skeleton` `SegmentHeader.tsx:37`, `segments-row-skeleton` `sessions/session/SegmentsRow.tsx:19`: 0 hits in e2e, specs or capture. Seven more (`pass-strip`, `pass-strip-skeleton`, `plot-strip`, `segment-page`, `segments-tab`, `segment-explorer`, `segment-explorer-frame`, `similar-segment`) are used only by `review/capture.spec.ts`, which goes away on acceptance | delete the 4 orphans; keep the capture ones until acceptance | S | none |

Not dead, checked: `passRank` (`segmentPasses.ts:57`) and `suggestedSegmentName` (`segmentCreation.ts:53`) are used in-module and tested directly. `INITIAL_SEGMENT_FOCUS_STORE_STATE` is required by the store TDR. `useListExpansion` has one caller (`SessionSegmentList.tsx:21`). `SegmentPassesNote` has two (`index.tsx:47`, `SegmentDetail.tsx:26`).

## 2. YAGNI / over-engineering

| # | What | Evidence | Proposal | Effort | Risk |
| --- | --- | --- | --- | --- | --- |
| Y1 | **Explorer waits for all passes (R44 leftover).** R44 loaded "all passes inside the filter … before the charts show" so the scatter scrub could preview any pass (`review/findings.md:57`). The scrub is gone (R51), and the explorer plots only selected + best (`charts/SegmentChartsExplorer.tsx:19-37`). Yet `useSegmentChartRows` still slices every pass's records (`charts/hooks/useSegmentChartRows.ts:24-32`) and shows the frame until *all* are done (`:39`, via `useSessionRecordSlices.ts:53` `results.some(isPending)`). A segment with 60 passes parses 60 record sets before the first line appears. The spec locks this in: `useSegmentChartRows.spec.ts:29` | gate on selected + best only. Either keep the other passes as background prefetch (a tile tap stays instant, R78) or drop the prefetch. **Owner decision** (first paint vs instant tap) | S–M | medium (changes load behaviour; spec and `tech.md:284`, `:314` change) |
| Y2 | `useSegmentChartRows` returns `selectedPass`, an echo of its input `selected`; the name says "rows" but it returns series (rows are built in `SegmentChannelChart`) | `charts/hooks/useSegmentChartRows.ts:6-11`, `:42`; read at `SegmentChartsExplorer.tsx:26-27` | drop `selectedPass`, read `props.selected`; rename to `useSegmentPassSeries` | S | none |
| Y3 | `useSaveSegment.save(null)` doubles as "show the no-GPS snackbar" | `hooks/useSaveSegment.ts:15-19`; callers `SaveSegmentPill.tsx:44`, `hooks/useReferenceSegmentMenuEntry.ts:46` | split into `save(draft)` and `notifyNoGps()` | S | none (spec `useSaveSegment.spec.ts:39` adapts) |
| Y4 | `PvPlotStripTile` has a 4-state map whose `idle` and `bestIdle` rows are identical. `markerIcon` is a generic icon slot, but the marker always draws it in `text-best` | `PvPlotStripTile.tsx:8-35`; `PvPlotStripMarker.tsx:17-27` | optional: fold to pressed × tone. Leave `markerIcon` | S | low |
| Y5 | Kept on purpose (checked, single or double caller but justified) | `PvActionItem` (2 callers), `PvPlotStrip*` (kit rule R51), `useScrollToEndEffect` (1 caller, kit hook), `useScrollFadeEffect` `axis` (`x` used by the strip, `y` by 3 callers), `PvStatRail.notePlacement` (top for segments, bottom for sessions), `PvZoomResetPill.children`, `VirtualItemList` (2 callers: `SessionList.tsx:22`, `SegmentsTab.tsx:19`), `segmentFocus` store (pass/best markers, cleared with the scene) | keep | – | – |

## 3. KISS / duplication

| # | What | Evidence | Proposal | Effort | Risk |
| --- | --- | --- | --- | --- | --- |
| K1 | **Two identical create dialogs.** `SaveSegmentPill` re-implements what `ReferenceSegmentDialog` (R84) does: the same `useSaveSegment` + `useSimilarSegment` + `segmentFactsLine` + `SegmentNameDialog mode="create"` | `SaveSegmentPill.tsx:30-31`, `:53-68` vs `ReferenceSegmentDialog.tsx:15-16`, `:19-36` | generalise `ReferenceSegmentDialog` to `CreateSegmentDialog({ draft, title, onClose })`; the pill renders it | S | low (both flows covered by e2e `segments.spec.ts:59`, `:111`) |
| K2 | **The cache-write heuristic skips needed writes.** `unchangedEntry` compares only lengths and two scalars (`segmentMatching.ts:237-248`, used `:298`). Case 1: a non-source session is reprocessed and still matches; it swaps `x@1` for `x@2` and its old pass for a new one, so the lengths are equal and nothing is saved. Case 2: a delete and an import between two runs, same effect. The result is correct, but the cache never learns, so every later run re-reads those sessions' records (spec `segmentMatching.spec.ts:155` only covers a count change) | save whenever `unchecked.length > 0` or the baseline dropped a key or pass, or compare the key sets | S | low; add a spec. A latent perf bug, worth fixing before R50 measures |
| K3 | `SegmentPassesNote` in two places with two looks: bare under the header (`index.tsx:47`) and inside a glass card (`SegmentDetail.tsx:23-28`) | as cited | one place, one look. Look decision for the owner | S | low |
| K4 | Skeleton duplication: `PassStripSkeleton` copies the strip shell class string (`PassStrip.tsx:35-38` ≡ `PassStripSkeleton.tsx:12-15`); the 40 px icon-tile pulse is hand-written twice (`PassStripSkeleton.tsx:32`, `SegmentItemSkeleton.tsx:7`) | as cited | one `PASS_STRIP_SHELL_CLASS` constant; leave the rest | S | none |
| K5 | `SECONDS_PER_MINUTE` declared twice. One copy is exported from the hover module, an odd home | `charts/segmentExplorerHover.ts:6` (read by `SegmentChannelChart.tsx:8`, `SegmentChannelRail.tsx:11`) and `charts/segmentChartRows.ts:34` | one constant beside the chart rows | S | none |
| K6 | `formatSignedRaceTime`: the `> 0` and `=== 0` branches return the same shape | `apps/web/src/lib/format/formatters.ts:247-252` | `if (rounded < 0) return …; return \`+…\`` | S | none (R83 spec) |
| K7 | Map: `useSegmentLayers` has two near-identical `PathLayer` builders (`hooks/useSegmentLayers.ts:40-68`). `useSegmentMapTracks` runs twice per render (`hooks/useMapCameraInputs.ts:41`, `hooks/useSegmentLayers.ts:101`), each with its own `useFilteredSegments` + `useSegmentDetail` memo | as cited | optional: one builder with an id. Leave the double call (R49 scene design, cheap) | S | low |
| K8 | `SessionSegment.rank` is only read as `rank === 1` since R55 removed the rank wording | `segmentPasses.ts:57-73`; `sessions/session/SessionSegmentList.tsx:35` | keep (cheap, tested) | – | – |
| K9 | The segment explorer's channel table (titles, icons, colours, units) parallels the session explorer's inline specs | `charts/segmentChannels.ts:101-227` vs `sessions/charts/SessionChartsExplorer.tsx:115-292` | keep. Sharing it is M effort and touches the session explorer; not for this branch | M | medium |

Selection (`useSegmentPassSelection.ts:6-23` with `useOptimistic` in `PassStrip.tsx:24-31`), the chart row merge (`segmentChartRows.ts:182-206`) and the matcher cache (`segmentMatching.ts`) were all checked. Each matches what the current UI and the plan need, and none is a rewrite candidate.

## 4. Naming leftovers ("chip" after R60)

| # | What | Evidence | Proposal | Effort | Risk |
| --- | --- | --- | --- | --- | --- |
| N1 | Chip naming survives the rename to plot strip / tile | testId `pass-chip` `PassTile.tsx:19`; `passChipLabel` `PassTile.tsx:21`, `apps/web/src/microcopy/segments.ts:47`; keys `ui_segment_pass_chip` / `_best` (en, de); `SKELETON_CHIP_KEYS` `PassStripSkeleton.tsx:6`; spec titles `SegmentDetail.spec.tsx:72`, `:98`, `PvPlotStripTile.spec.ts:61`, `:69`; `capture.spec.ts:498`, `:508` | rename to tile (`pass-tile`, `passTileLabel`, `ui_segment_pass_tile*`) | S | low (e2e queries by role, `segments.spec.ts:78`) |
| N2 | Stale spec title | `apps/web/tests/components/segments/charts/segmentExplorerHover.spec.ts:32` "(nothing selected)": a pass is always selected now (plan.md:60) | retitle | S | none |

## 5. Stale records in `tech.md`

| Line | Says | Now |
| --- | --- | --- |
| `tech.md:32` | segment page "Finding passes… / passes" | line removed (R53) |
| `tech.md:174`, `:258` | `SessionSegmentItem` "time · rank" | time only (R55) |
| `tech.md:197`, `:252` | `SegmentPassesNote` "1 pass · only this session so far" | "0 passes" + imports note (R79) |
| `tech.md:217` | `PvPlotStripTile` "no box for the best tone, dotted …" (sentence garbled) | best tile has a white/10 border, best line gone (R71, R72, R75) |
| `tech.md:219` | `PvPlotStripGroup` sticky "24 px in, past the edge fade" | `left-0`, fade only on the tile row (R77; `PvPlotStripGroup.tsx:15`) |
| `tech.md:232` | metrics on `window.pvSegmentMetrics` | correct today; changes with D6 |
| `tech.md:237`, `:263` | microcopy / `segmentPasses` "rank", "pass chip" | no rank label; tile |
| `tech.md:284`, `:314` | chart rows "loading until all are sliced" | changes with Y1 |
| `tech.md:309` | `segmentPasses.spec` "median, rank, window, ride order" | dot scale, years, rank, ride order (`segmentPasses.spec.ts:19-81`); no median or window |

`plan.md` (owner-edited, not touched) also carries pre-strip text: `:59` (Pass times row, scatter), `:75` (Pass card, Pass times / Zeiten), `:105` (`PassTimesRow`), `:119` (`pvCollapsibleListItem` listed as changed, not in the diff), `:143` (`useScatterWindow`, `useScatterScrollEndEffect`, `useDragScroll`), `:172` (`PassTimesRow.spec.tsx`), `:187`.

## Verdict

**Yes to a short, dedicated cleanup round, but a small one** (about half a day, no design changes). The branch is not full of dead features; it carries a thin layer of leftovers. Do it before the merge, because each item is cheapest now while the reviewers still know the code.

Order:

1. **K2**: cache-write fix plus a spec. It is a latent perf bug and should land before R50 measures.
2. **Y1**: explorer gate on selected + best. Needs the owner's call on prefetch first. Fold it into R80 (moving time), which rewrites `passSeries` and the chart x axis anyway (`findings.md:99`).
3. **K1, Y2, Y3, D4**: creation dialog and hook simplifications (one PR-sized step, covered by e2e).
4. **D1–D3, D5–D8, K4–K6**: mechanical deletions and un-exports.
5. **N1, N2**: chip → tile rename, one sweep including the i18n keys.
6. **`tech.md`** rows above, after steps 1–5 so it is written once.

Leave out: K7, K8, K9, Y4 (optional, low value) and anything in the map scene (R49 is settled and tested).
