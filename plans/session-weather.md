# Session weather: mini-rose card with expandable details

Mockup: `mockups/session-weather/index.html` (mini rose, chevron-toggle header).

## Context
- Weather is shown as a row of chips under the session header (`src/pages/SessionDetailPage.tsx:80`, `src/features/sessions/session/WeatherChips.tsx`): wind share chips, temperature, wind, gusts, condition, humidity; 4 chips on desktop, 2 on the phone, then "+N". Hard to scan, and condition and compass direction come from the first snapshot only.
- Data (`src/lib/weather.ts:20-32`): one snapshot per full hour, from the hour in which the session starts to its end (`src/lib/weather.ts:88-96`): time, temperature, feelsLike, humidity, windSpeed, windGusts, windDirection, weatherCode/condition. `feelsLike` is fetched but never shown.
- Per-record wind angle: `windAngles` (`src/packages/engine/windExposure.ts:118`) returns the absolute angle 0–180° (`angleDelta`, `:60`). It cannot tell wind from the left from wind from the right, which a rider-relative rose needs.
- There is no accordion component. The chevron toggle exists twice: `src/components/ui/CardGrid.tsx:30-34` and `src/features/sessions/laps/LapDetailTable.tsx:45-49` (the latter is removed by `plans/session-laps.md`).

## Decisions (settled)
- **One weather card** replaces the chip row, same place under the header.
- **Peek (collapsed):** mini wind-rose glyph · condition · temperature range · first condition change (e.g. "rain from 11:00"). Only the first change is shown; the open state shows the rest.
- **Open state adds, never repeats:**
  - the full rider-relative wind rose with the head / cross / tail split (no extra "cross" label; head and tail labels plus the chart make it obvious);
  - an hourly table, rows = metrics, columns = hours: time, condition icon, temperature, feels-like, humidity, wind, gusts, direction. Change hours highlighted. No footnote.
- **Toggle:** the whole header row is the button; a `ChevronRight` rotating 90° is the cue (look of `CardGrid`). Desktop expands inline (smooth height animation); phone opens the `ResponsivePopover` dialog (as Color by).
- **Always starts collapsed**; nothing is remembered.
- **The start hour** (e.g. 08:00 for an 08:40 start) is shown like any other hour and counts in the ranges.
- **Wind arrows** follow Apple Weather: the arrow points where the wind blows to, the label names where it comes from (e.g. "W"). Same in peek, table and rose.
- Units: °C, km/h.

## Approach
### Data
- Engine: add a signed rider-relative wind angle per record (−180…180°, left vs. right) next to `windAngles` in `src/packages/engine/windExposure.ts`, reusing the same segments (pauses > 30 s and segments < 1 m skipped, time-weighted). `computeWindExposure` and `windAngles` keep their behaviour.
- `src/lib/`: rose bins (e.g. 16 sectors, share of moving time per sector), session summary (condition, temperature and feels-like ranges, first condition change with its hour), all from `SessionWeather` + records.

### UI
- `src/components/ui/`: shared collapsible card header (button spanning the row, chevron, controlled open state, height animation) — extracted because the pattern now exists in `CardGrid` and the weather card; `CardGrid` switches to it.
- `src/features/sessions/session/WeatherCard.tsx`: peek, open state, loading skeleton, hidden when there is no weather; `WindRose` (glyph + full size, colours from `windColorAt`, `src/lib/zoneColors.ts:45`); hourly table with a sticky label column.
- Replace `WeatherChips` in `SessionDetailPage.tsx:80`; delete `WeatherChips.tsx` and messages that become unused; keep `useWindExposure` for the split.

## Tests
- Signed wind angle: wind from the left vs. right of the direction of travel gives opposite signs; pauses skipped.
- Rose bins sum to 100 % of classified moving time.
- Summary: ranges include the start hour; first condition change found; no change → no hint.
- E2E (`e2e/sessions.spec.ts`): no e2e covers weather today and none mocks Open-Meteo. Intercept the archive request with `page.route` (fixture response with 2+ hours incl. a condition change) → card collapsed with condition and range → open → hourly table shows every hour.

## Verification
`vp check`, `vp test -- --run`, `vp exec playwright test`, `vp build`. Manually: 1 h run (2 snapshots), long ride with a condition change, loading and no-weather states, desktop inline expand, phone dialog.
