# Scatter scrub: five variants from the session chart explorer

Task: the Pass times scatter should scrub like the charts explorer (vertical cursor line while scrubbing, no static line). R42 (Recharts tooltip cursor snapped to the nearest pass, dot lit, card highlighted) was rejected.

## How the explorer scrubs today (facts)

- **Cursor line** = Recharts' default `<Tooltip>` cursor with no content: `hoverOnlyTooltip` (`apps/web/src/components/charts/chartHover.ts:5`), used e.g. at `apps/web/src/components/sessions/charts/HrChart.tsx:80` and `apps/web/src/components/segments/charts/SegmentChannelChart.tsx:63`.
- **Why it feels continuous**: the x data is dense (one row per record/second), so "snap to nearest row" is invisible. The scatter has 10–90 sparse points, so the same tooltip jumps dot to dot. That jump is the R42 feel.
- **Active dot**: Recharts' default `activeDot` on each `<Line>` (none disabled in `SegmentChannelChart.tsx:74-81`); the scatter turns it off on its trend line (`apps/web/src/components/segments/PassScatter.tsx:258`).
- **Readout**: the rail beside each chart, not a tooltip. `PvChartRow` puts `rail` and chart in a `grid-cols-chart-rail` grid (`packages/ui/src/components/pvChartsCard/PvChartRow.tsx:42-52`), rail column 100 px (`packages/ui/src/theme.css:196`). `SeriesRail` swaps header to the hovered x and value to `readingAt(x)`, else shows `rest` (`apps/web/src/components/charts/SeriesRail.tsx:15-47`). `PvStatRail` has a note slot (2rem rows top/bottom, `packages/ui/src/components/pvStatRail/PvStatRail.tsx:56-80`); the segment rails put the best's value with a crown there (`apps/web/src/components/segments/charts/SegmentChannelRail.tsx:46-63`).
- **Sync**: one hover x per group in `useChartHoverStore` (`apps/web/src/store/chartHover.ts:12-27`); rows share Recharts `syncId` (`SegmentChannelChart.tsx:36`); `hoverSegmentExplorer` writes the x and the map markers (`apps/web/src/components/segments/charts/segmentExplorerHover.ts:8-32`). Touch: `chartHoverHandlers` (`chartHover.ts:15-18`).
- **Date-x rail precedent**: the dashboard Load chart runs `MultiSeriesRail` over date buckets with `formatX` → date (`apps/web/src/components/dashboard/LoadChart.tsx:86-91`).
- **Scatter today**: full-bleed, no rail (`PassScatter.tsx:206-208`), drag-scroll window (`PassScatter.tsx:209-222`), `xOf(date)` for pixel ↔ date (`PassScatter.tsx:132-134`), R42 hover snaps via `activeLabel` and `hoverPass` (`PassScatter.tsx:234-243`), cards highlight from `hoveredPassSessionId` (`apps/web/src/components/segments/PassItem.tsx:31`, `:44`).

## V1 · Explorer row clone (rail + free cursor riding the trend)

```
┌ Pass times · 39 passes ─────────────────────────────── ˅ ┐
│ 10 SEP 2026  │        ·     ♛                 │      ·   │
│ 6:04 trend   │   ·  ────·──●─────·──·         │  ·       │
│ 5:55 best ♛  │ ·        ·    ·       ·        │       ●  │
│              │                 ·              │          │
│──────────────┴────────────────────────────────┴──────────│
│ [♛ 6×800 m Isar · 5 May                         5:55  ›] │
```

- **Move**: cursor line follows the pointer freely (any date, not only pass dates). Active dot rides the trend line. Rail header = date under the cursor; value = trend (rolling median) there; note = best time with crown. A pass dot within its hit radius lights and the rail value switches to that pass's time, secondary Δ best.
- **Leave**: line and active dot go; rail shows rest (best time, "median 6:04").
- **Click**: toggles the pass under the pointer (R38 unchanged); empty space does nothing.
- **Reuse**: `SeriesRail` (`SeriesRail.tsx:15-47`), the `PvChartRow` rail grid (`PvChartRow.tsx:47`), note-slot crown pattern (`SegmentChannelRail.tsx:54-62`), `hoverOnlyTooltip` cursor (`chartHover.ts:5`), trend line `activeDot` switched on (`PassScatter.tsx:258`).
- **Changes**: scatter data gets a dense hidden day grid (trend interpolated per day) so the Recharts cursor moves smoothly like the explorer; scatter loses the full bleed and 100 px to the rail; new hover group for the scatter.
- **Effort**: M.
- **Risk**: 100 px rail on a ~460 px panel leaves ~330 px of scatter; the 10-pass window gets tighter.

## V2 · Snap with rail readout (R42 done like the explorer)

```
┌ Pass times · 39 passes ─────────────────────────────── ˅ ┐
│ 10 SEP 2026  │        ·    │             ·    │          │
│ 6:12         │   ·  ───────◉─────·──·         │  ·       │
│ +0:17        │ ·        ·  │ ·       ·        │       ●  │
│ ♛ 5:55       │             │   ·              │          │
```

- **Move**: cursor line snaps to the nearest pass by x (as R42); that dot gets the explorer active-dot look (solid, white ring). Rail header = pass date, value = pass time, secondary = Δ best, note = ♛ best time.
- **Leave**: line goes, rail back to rest.
- **Click**: toggles the snapped pass, so a click anywhere selects the nearest pass.
- **Reuse**: the current R42 snap (`PassScatter.tsx:234-243`), `SeriesRail`, note crown (`SegmentChannelRail.tsx:54-62`).
- **Changes**: rail added; card highlight from scatter hover dropped (the rail carries the readout).
- **Effort**: S–M.
- **Risk**: same jumpy line the owner rejected in R42; only the readout is new.

## V3 · Full-width scatter, readout in the row header

```
┌ Pass times · 10 Sep 2026 · 6:12 · +0:17 ────────────── ˅ ┐
│        ·     ♛          │                 ·              │
│   ·  ────·──────·────●──┼──·                  ·          │
│ ·        ·    ·         │·                         ●     │
```

- **Move**: free cursor line (dense day grid as in V1), no rail. The row's secondary line (`39 passes`) swaps to `date · trend` under the cursor, or `date · pass time · Δ best` when a dot is within reach.
- **Leave**: secondary back to `39 passes`.
- **Click**: toggles the dot in reach.
- **Reuse**: `PvCollapsibleListItem` `secondary` (`apps/web/src/components/segments/PassTimesRow.tsx:43-51`), `hoverOnlyTooltip` cursor, `formatShortDate` / `formatRaceTime` / `formatSignedRaceTime` (`apps/web/src/lib/format/formatters.ts:50`, `:271`, `:280`).
- **Changes**: dense grid; header text bound to the scatter hover x. No layout change.
- **Effort**: S.
- **Risk**: readout sits ~120 px above the pointer; it is not the explorer's rail, so it may not read as "a clone".

## V4 · Scatter moves into the explorer card as its first row

```
┌ Explorer card ─────────────────────── [— Sep 10  — Best] ┐
│ ⁘ Pass times                                              │
│ 10 SEP 2026  │        ·     ♛          │       ·          │
│ 6:04         │   ·  ────·──●─────·──·  │   ·              │
│ ♛ 5:55       │ ·        ·    ·        │ ·         ●      │
├───────────────────────────────────────────────────────────┤
│ ♥ Heart Rate                                              │
│ 3:00         │ ~~~~~~~~~~~│~~~~~~~~~~~~                    │
│ 139 bpm      │ ~~~~~~~~~~~│~~~~~~~~~~~~                    │
├───────────────────────────────────────────────────────────┤
Summary card above keeps only the pass cards.
```

- **Move / leave / click**: as V1 inside a `PvChartRow`; the scatter has its own hover group (date x), the channel rows keep theirs (elapsed x); the two do not sync.
- **Reuse**: `PvChartRow` with `rail` (`PvChartRow.tsx:27-57`), the explorer card and legend (`apps/web/src/components/segments/charts/SegmentChartsExplorer.tsx:44-71`), the session explorer's row loop (`apps/web/src/components/sessions/charts/SessionChartsExplorer.tsx:364-379`).
- **Changes**: scatter leaves `PassTimesRow` (`PassTimesRow.tsx:54-61`); the explorer card renders a row before the channels; the row header carries the title instead of the collapsible row.
- **Effort**: M–L.
- **Risk**: undoes Q53 (scatter is the first expandable row of the summary card, passes inside it); scatter and the cards it selects end up in two cards.

## V5 · Scrubbing the scatter previews the pass in the explorer

```
┌ Pass times ───────────────────────────────────────────── ┐
│ 10 SEP 2026  │        ·    │           ·                  │
│ 6:12  +0:17  │   ·  ───────◉─────·──·                     │
├ Explorer ─────────────────────── [— Sep 10 (hover) — Best]┤
│ ♥ HR   avg 141 │ ~~~~ hovered pass line ~~~~ amber best ~ │
```

- **Move**: V1/V2 cursor on the scatter; the pass in reach becomes the explorer's plotted pass while the pointer stays (legend shows its date), the rails show its rest values.
- **Leave**: explorer returns to the selected pass.
- **Click**: makes the previewed pass the selection.
- **Reuse**: `useSegmentChartRows` keeps showing the last complete series while loading (`apps/web/src/components/segments/charts/hooks/useSegmentChartRows.ts:54-60`), `useSessionRecords` cache (`useSegmentChartRows.ts:29`), legend (`SegmentChartsExplorer.tsx:45`).
- **Changes**: explorer takes `hoveredPassSessionId ?? selected`; scatter rail as V1.
- **Effort**: L.
- **Risk**: one records decode per newly hovered pass (R39 removed hover-time loads for this reason); the explorer flickers between passes while scrubbing.

## Recommendation

**V1.** It is the explorer row's mechanics one to one: free cursor line, active dot on the line, rail on the left whose header becomes the cursor's date and whose value follows it, rest values on leave, best in the crown note. The dense day grid removes the dot-to-dot jump that sank R42 without leaving Recharts' tooltip cursor. It keeps Q53 (scatter stays in the summary card with the passes) and R39 (no loads on hover).

## Open questions for the owner

1. Cursor: free (V1, V3) or snapped to the nearest pass (V2)? Recommendation: free.
2. Readout: 100 px rail left of the scatter (V1, V2, V4) or the row header's secondary line (V3)? Recommendation: rail.
3. Rail value between passes: rolling-median trend at the cursor date, or the nearest pass's time? Recommendation: trend, switching to the pass when a dot is within reach.
4. Does scatter hover still highlight the pass card (R42), or does the rail replace that? Recommendation: rail only; cards highlight only on their own hover.
