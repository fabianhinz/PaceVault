# Dashboard: volume row in the charts card, one shared date axis

Mockup: `mockups/dashboard-stats/index.html` (variant C).

## Context

- The dashboard shows Peek (phone), FormStatusCard (today's TSB/ACWR, ignores the dock filters), one ChartsCard with LoadChart (TSS per day/week/month, `src/features/dashboard/LoadChart.tsx`) and PerformanceChart (daily CTL/ATL/TSB, `PerformanceChart.tsx`), then `TrainingSummaryCard` (4 totals, `src/features/dashboard/TrainingSummaryCard.tsx:13-73`).
- Volume (distance, duration, elevation) appears only as totals in the stats card; nothing shows it over time, and nothing compares with an earlier period.
- Load and Performance use separate hover groups (`dashboard-load`, `dashboard-performance`) and different x-axes (Load buckets as categories, Performance per day).
- `TrainingSummaryCard.tsx:44` sums `s.distance ?? 0` (missing counted as 0).
- Variants compared: one row per metric, one volume row with a switch, cumulative volume vs. the period before. Chosen: cumulative vs. before — it answers "more or less than before, and since when" without repeating Load or Performance.

## Decisions (settled)

- **Volume row** ("Volume") in the dashboard ChartsCard, directly **after Load**; the separate stats card (`TrainingSummaryCard`) is removed.
- The row shows **cumulative volume day by day** over the dock's range (stacked by sport) against a **dashed line for the same number of days before**. A metric switch Distance / Duration / Elevation in the spot and style of Load's Day/Week/Month tabs; the selected metric is **remembered** (persisted, filters-store style with version bump + migration).
- Rail: "This range" and "Before" totals with session counts at rest; both values at the hovered day. Missing data: sum only sessions that recorded the value; `--` if none did; "from n of m sessions" only when incomplete. A recorded 0 stays 0.
- **All time** (no earlier period): the Volume row is hidden.
- **Always coloured by sport**, in Load and Volume; the "Color by sport" switch is removed. A single-sport filter shows that sport's colour.
- Day/Week/Month tabs stay on the Load row and only affect Load.
- **One shared date axis** for Load, Volume and Performance, like the session charts (shared x-axis, laps as bands): Load buckets become date spans; hovering a day highlights its bucket in Load and the day in Volume and Performance; drag-zoom and the reset pill act on all rows.

## Open

- Exact layout of the rail and the switch on the phone (from the mockup).

## Tests

- Regression: "dashboard distance total stays missing when no session recorded distance".
- Cumulative series and previous-period window (lib, pure).
- Shared axis: hovering a day maps to the containing Load bucket.

## Verification

`vp check`, `vp test -- --run`, `vp exec playwright test`, `vp build`; by hand on desktop and 390 px: hover sync across the three rows, zoom, all-time hides the row, metric switch persists.
