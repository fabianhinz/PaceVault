# Session laps: Laps pill, lap bands and lap peek (no Laps tab)

Mockup: `mockups/session-laps/index.html` (round 4, "Laps card: a · No card").

## Context

- The session page has an Overview and a Laps tab (`src/pages/SessionDetailPage.tsx:20-25`, `:83-95`). The Laps tab (`src/features/sessions/laps/LapsTab.tsx`) shows three per-lap line charts (`LapHrChart.tsx`, `LapPowerChart.tsx`, `LapSplitsChart.tsx`), a lap table (`LapDetailTable.tsx`) and a device/custom switch with a distance slider (`SplitDistanceCard.tsx`, persisted in `src/store/lapOptions.ts`).
- Problems found during exploration:
  - Lines over evenly spaced lap categories suggest a trend and ignore lap length; the synced lap charts disagree on x positions because the pace chart drops non-active laps (`src/lib/lapChartData.ts:43`).
  - The map only shows lap start markers (`src/features/map/DeckGLOverlay.tsx:252-295`); on touch a lap highlight is lost when the finger lifts.
  - Custom splits use elapsed time as moving time (`src/lib/dynamicLaps.ts:42`), so a split containing a stop shows a too-slow pace.
  - Bug: interval detection treats any non-active lap as proof of an interval session (`src/lib/laps.ts:74`, `:96`). Both fixtures end with a single `recovery` cool-down lap (`running.fit`: 14 laps, last `683m:recovery`; `cycling.fit`: 8 laps, last `458m:recovery`), so every lap counts as an interval and the overview's pacing trend / recovery stats (`src/features/sessions/session/SessionStatsGrid.tsx:34-35`) are computed for steady sessions.
- `repetition_num` in the fixtures is only the lap counter (1…n), not a rep number.

## Decisions (settled)

- **No Laps tab.** The session page is one view. Laps appear only as bands on the Overview charts, on the map and in the lap peek. No laps card, no lap table, no per-lap charts.
- **Laps pill** next to the "Color by" pill, same anatomy and placement (`src/features/sessions/session/ColorByControl.tsx`, `SessionColorBy.tsx`, `src/components/ui/SheetAbove.tsx`): glass pill with icon, label, mini lap-strip swatch, chevron. Label: "Laps" (off), "{n} laps" (device), "{d} km splits" (splits).
- **Laps picker** = `ResponsivePopover` with radio rows only, like Color by: Off | Device laps | Splits. Choosing Splits shows chips 0.4 / 1 / 2 / 5 km inside the row. The checked row's subtitle carries a short summary: "{n} laps · spread {s}". No nested view, no table, no "›".
- **Default:** every session starts with Device laps. **Nothing is remembered** — neither the lap source nor Color by carries over between sessions. No toast on reset.
- **No interval special case** in this version: no "6 × 800 m", no rep view, no rep naming. Laps are named "Lap {n}".
- **Bands:** the selected source draws lap bands on all Overview time-series charts.
- **Selection:**
  - Desktop hover on a chart band or the map track previews the lap; click selects.
  - Tap/click on a chart band, the map track (lap at that point) or ‹ › in the peek selects.
  - Selected lap: outlined band on every chart; on the map a white casing around the lap (zone/wind colours stay visible inside), rest of the track dimmed, camera fits the lap (zoom capped).
  - Clearing: ✕, Esc, tapping the selected lap again, or tapping the map away from the track. Changing the source clears the selection.
- **Peek:** glass pill. Desktop: ‹ Lap · distance · time · pace · HR · power › ✕. Phone: ‹ Lap · time · pace · HR › ✕, replacing the pills above the sheet edge (travels with the sheet); ✕ brings the pills back.
  - **No layout shift, no ellipsis:** fixed-width slots, tabular numbers, `--` for missing values; ‹ › never move between laps.
- **Split pace uses moving time** (stops excluded), consistent with device laps.
- **Chart zoom (desktop) stays, without the click reset:** drag across a chart zooms as today; a plain click no longer resets the zoom (today `onMouseUp` in `src/lib/hooks/useChartZoom.ts:67-75` resets on a click without drag) — a click selects a lap instead. While zoomed, a small glass "Reset zoom" chip appears above the charts and resets the synced range.

## Approach

### Data

- `src/lib/dynamicLaps.ts`: moving time per split from `movingSeconds` (`src/lib/movingTime.ts`) instead of `duration` (`:42`); accept split distances 400 / 1000 / 2000 / 5000 m; mark the last split partial.
- Fix interval detection in `src/lib/laps.ts`: a session counts as intervals only with **at least 2 non-active laps between active laps**; a single trailing recovery/cool-down lap does not count. `SessionStatsGrid` keeps using `detectIntervals` / `detectProgressiveOverload` with the corrected rule.
- Lap summary helper (count, fastest, slowest, spread over full active laps; partial split excluded from rankings).
- Lap at a map point: deck.gl pick on the session path → record index → lap by time range.

### State

- Lap source and selection live in a non-persisted store (e.g. extend `src/store/mapFocus.ts`, which already holds `lapMarkers` / `hoveredLapIndex`): `lapSource`, `selectedLapIndex`, `hoveredLapIndex`. Reset on `setOpenedSession(null)` and on session change.
- Remove `src/store/lapOptions.ts` (persisted `store-lap-options`) and `src/store/sessionColoring.ts` (persisted `store-session-coloring`); Color by state moves into the same non-persisted store, default `'sport'`. Remove their rehydrate calls in `src/main.tsx`. The stale IndexedDB keys are ignored.

### UI

- `src/pages/SessionDetailPage.tsx`: drop Tabs; render `OverviewTab` content directly; the `?tab=` param goes away.
- New `LapsControl` next to `ColorByControl` in `SessionColorBy.tsx` (both pills in one row; desktop centred on the visible map strip, phone via `SheetAbove`).
- Lap bands + outline on the Overview charts (`src/features/sessions/charts/*`, `src/components/charts/ElevationChart.tsx`, `GradeChart.tsx`) via Recharts `ReferenceArea`s from lap time ranges on the moving-time axis.
- Map: selected-lap casing + dimming + camera fit in `DeckGLOverlay.tsx`; track pick enabled while a session is open (today `useMapPopupState` returns early on `openedSessionId`, `src/features/map/hooks/useMapPopupState.ts:22`).
- `LapPeek` component (fixed slots) shown when a lap is selected.

### Chart zoom

- `useChartZoom` / `useSyncedChartZoom`: remove the reset-on-click branch; expose `isZoomed` + `resetZoom` for the chip. Session overview, Studio and dashboard charts get the same chip (dashboard reset = `clearDashboardChartRange`).

### Removal

- `LapsTab.tsx`, `LapHrChart.tsx`, `LapPowerChart.tsx`, `LapSplitsChart.tsx`, `LapDetailTable.tsx`, `SplitDistanceCard.tsx`, `src/lib/lapChartData.ts` and what becomes dead in `src/lib/lapMarkers.ts`; `laps-detail` hover group; unused messages (`ui_session_tab_*`, lap table/chart strings).
- Tests of removed code (`tests/lib/lapChartData.spec.ts`, `tests/store/lapOptions.spec.ts`, `tests/store/sessionColoring.spec.ts`), updated e2e that navigates to the Laps tab.

## Tests

- Regression: "steady run with a trailing recovery lap is detected as intervals" (`tests/engine/lapsAnalysis.spec.ts`).
- `dynamicLaps` (`tests/engine/dynamicLaps.spec.ts`): split pace excludes a stop; partial last split marked; 400 m splits.
- Lap summary: spread/fastest/slowest exclude the partial split.
- Lap at map point / at chart time maps to the right lap.
- Store: lap source and Color by reset on session change; default Device laps / Sport color.
- Regression: "clicking a lap band in a zoomed chart resets the zoom" — a click without drag keeps the zoom; the chip resets it (`tests/lib/useChartZoom.integration.test.ts`).
- E2E (`e2e/sessions.spec.ts`; no existing e2e opens the Laps tab): open a session → Laps pill shows "{n} laps" → click a chart band → peek shows "Lap n" → › steps to the next lap with the chevron position unchanged → ✕ clears; opening another session resets Color by and laps.

## Verification

`vp check`, `vp test -- --run`, `vp exec playwright test`, `vp build`. Manually: desktop + phone, 43-lap session, session without power, splits 0.4–5 km, map click and hover, sheet drag with the peek.
