# Draft: chart zooming and range selection

> **Status: draft, deferred.** This is parked until the per-chart stats work ("stats near charts", option B) has shipped. That first version has no range behaviour: no range stats and no selection chip.

## Context
Session detail charts already support a synced drag-to-zoom, but only with a mouse:
- `useChartZoom` listens to Recharts mouse events only (`src/lib/hooks/useChartZoom.ts:52-113`).
- The range lives in local state in `SessionChartsExplorer` (`src/features/sessions/charts/SessionChartsExplorer.tsx:87-123`) and never leaves the chart stack.
- The map doesn't know about the range. `mapFocus` only holds the hovered coordinate (`src/store/mapFocus.ts:33-35`).
- The way back to the whole session is a click without dragging (`src/lib/hooks/useChartZoom.ts:67-78`), and users don't discover it.

The mockup (`stats-near-charts.html`, variants A–E) showed the whole flow: drag a range, then the numbers recompute, the matching part of the track lights up on the map, and a "Selection 19:30–23:40 ×" chip resets it.

## Scope
### Phase 1: range selection on desktop and touch
1. **Selection that works on touch.** Replace or extend the mouse-only `useChartZoom` so a range can be selected on a phone, inside the bottom sheet.
2. **Selection chip.** Shows the selected time range and resets it with ×. This is the visible cue that a range is active, and the reset users can find.
3. **Map track highlight.** The selected part of the track is drawn brighter on top of the full track.
4. **Map camera.** The map zooms to the selected part, and goes back to the whole track on reset.

### Phase 2: range stats in the rail
The rail shows the min/avg/max of the selected range instead of the whole session. This needs the rail from the stats work to exist, and the source decision below.

## Settled
- **Highlight style: brighten the selected part.** Draw an extra wider, brighter path over the range, the same way a highlighted session is drawn (`src/features/map/DeckGLOverlay.tsx:88-96`). The rest of the track stays as it is.
  - Build the overlay with the same path builder as the detail track, on the sliced records (`src/features/map/hooks/useSessionDetailPath.ts:47-64`). That way it works in sport colour and in zone colour mode.
  - It must not be blue, per the palette rules in CLAUDE.md §6.
- **Camera: zoom to the selection.**
  - `useMapCameraEffect` already supports override bounds (`src/features/map/hooks/useMapCameraEffect.ts:21-33`). Today Studio feeds them (`src/features/map/MapBackground.tsx:51-58`).
  - The range bounds can come from `computeBounds` (`src/packages/engine/gps.ts:104`) over the GPS points in the range.
  - On reset, fall back to the opened session's bounds (`src/features/map/hooks/useMapCameraEffect.ts:37-51`).

## Open questions
1. **Touch gesture.** A horizontal drag on a chart competes with dragging the bottom sheet and with page scroll. Options: long-press then drag; a two-finger span; a handle-based range bar under the stack (as in Polar Flow's 2025 web view).
2. **Chip placement.** The stats work has no sticky strip so far. Where does the chip live so it stays visible while scrolling the chart stack?
3. **Where the range state lives.** It could move from local state into `mapFocus`, or into a new session-detail store. The map highlight, the camera and the rail all need to read it.
4. **Expanded chart.** Today the expanded (fullscreen) chart ignores the synced range (`src/features/sessions/charts/SessionChartsExplorer.tsx:140`). Should it follow the selection?
5. **Phase 2: where the numbers come from.** The session mixes device summary values and values computed from records (`src/parsers/fit.ts:288-312`). For example, `elevationGain` is the device's `total_ascent`, while `avgPower` comes from the records. Range stats can only come from records.
   - If the whole-session rail keeps device values, a range covering the whole activity shows different numbers.
   - Options: the rail always computes from records; or it keeps device values and only ranges use records, labelled accordingly.
6. **Phase 2: summary helper.** Range stats need the slice summary inside `computeDynamicLaps` (`src/lib/dynamicLaps.ts:32`) pulled out into a shared function.
   - It must run on raw records, not the downsampled chart points. The chart time is in minutes (`src/lib/chartData.ts:54`), the record timestamp in seconds.
   - NP needs ≥ 30 one-second samples (`src/packages/engine/normalize.ts:14`).
7. **Studio.** `RouteChartsExplorer` uses the same synced zoom (`src/features/studio/charts/RouteChartsExplorer.tsx:58`). Does it get the same selection, chip and map highlight?

## Order (rough)
1. Lift the range out of `SessionChartsExplorer` into shared state.
2. Make selection work on touch (gesture from open question 1).
3. Add the selection chip.
4. Draw the map highlight layer from the range.
5. Fly the camera to the range bounds on change, and back on reset.
6. Phase 2: extract the record summary helper, then feed range stats into the rail.

## Tests
- Hook test for the new selection gesture: mouse drag and touch both produce the same range; a tap without movement resets.
- `computeBounds` over a record slice: the bounds cover only the selected GPS points.
- Phase 2: summary helper unit tests (avg/max including 0 per the "0 is data" rule, NP with fewer than 30 samples, elevation gain over a slice). These go next to `tests/engine/dynamicLaps.spec.ts`.
- e2e (mobile): select a range on a chart, then the chip appears, and × resets it.

## Verification
`vp check`, `vp test -- --run`, `vp exec playwright test`, `vp build`. Manually, on desktop and on a phone, select a range and check that:
- the track part lights up;
- the map zooms to it;
- × or reset brings back the whole session and the whole track.
