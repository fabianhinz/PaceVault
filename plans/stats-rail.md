# Stats rail beside every chart

## Context
On the session overview, the summary stats sit in `SessionStatsGrid`, far below the chart stack (`src/features/sessions/session/OverviewTab.tsx:52-58`). Each chart has a value that belongs to it, but you can only read that value in a tooltip, and tooltips don't work on touch.

We compared five layouts in an interactive mockup, against the research on UI/UX patterns and other fitness apps (Strava's stats column, intervals.icu, TrainingPeaks). **Variant B, the "stats rail"**, won:
- it works on mobile and with touch;
- the layout doesn't shift on hover;
- the numbers can be taken in at a glance.

Range selection, map track highlight and map camera are out of scope; see `plans/draft_chart_zooming.md`.

## Rules (settled)
- **Rail:** a fixed-width column (~84px) to the left of the plot, inside every `ChartPreviewCard` listed below. It shows in compact and expanded mode.
  - Each row has a label, a big value with its unit, and a small secondary value.
  - The width is fixed and the numbers are tabular, so nothing shifts when the values change.
- **Hover:** while the cursor is on a chart, the rail's label becomes the x value at the cursor ("23:40", "Lap 3", "4.2 km", "12 Sep"). The big value becomes the value at that point, and the small line shows the resting primary value for comparison (e.g. "avg 156").
  - The overview, Laps and Studio stacks stay synced: hovering one chart updates every rail in its stack.
  - Dashboard charts are **not** synced. Each chart's rail only reacts to its own chart.
  - The expanded (fullscreen) chart writes to the same hover group as its stack, so the rails behind it follow.
  - Exceptions to the "resting primary" comparison:
    - Load compares with the avg per bucket ("avg/day 72", or per week/month), not with the period total.
    - Laps show the hovered lap's min–max, as in the Laps table below.
- **Charts with several lines:** one rail row per line (Performance, Load split by sport, lap popup).
  - A header line above the rows carries the x value: "3 Sep" on hover, and "latest" / "total" / "lap avg" at rest. The row labels stay the series names (CTL / ATL / TSB, HR / Power / Pace).
- **Labels must fit the 84px rail in en and de:**
  - Use short rail-only messages where the full word doesn't fit (e.g. "Geschw." instead of "Geschwindigkeit").
  - Elevation shows no word, only signs: "+212 m" big, "−205 m" small.
  - The rail never widens and never truncates.
- **Tooltips:** removed from every chart in scope, in compact and expanded mode. The rail replaces them, so nothing that only the tooltip showed may get lost (lap min–max, dashboard date, per-sport split, popup values).
- **Info popovers** (ⓘ `MetricLabel`, `src/components/ui/MetricLabel.tsx:19`):
  - **Single-series charts:** the ⓘ sits at the card title, the way `LoadChart` already does it via `titleSlot` (`src/features/dashboard/LoadChart.tsx:156-163`).
  - **Multi-series charts** (Performance, Load split by sport, lap popup): the ⓘ sits next to each row label in the rail, and fades out while hovering.
- **Computed extremes** (best pace, max cadence, grade max/min): the raw min/max over the records, no smoothing.
- **0 and missing:** missing values show `--`, a recorded 0 shows `0`. Pace is missing at speed 0, so it shows `--` (CLAUDE.md §2).
- **Grids keep only values that belong to no chart:**
  - Overview `SessionStatsGrid`: duration, distance, stress score, pacing trend, recovery and sensor warnings stay. Avg HR, pace/speed, power, GAP, elevation and cadence move to the rails (`src/features/sessions/session/SessionStatsGrid.tsx:83-186`).
  - Studio `RouteStatsGrid` (`src/features/studio/RouteStatsGrid.tsx:12`): distance, imported date and source file stay. Gain, loss, min/max elevation and max grade move to the rails (gain `:24` through max grade `:48`).
  - Dashboard `TrainingSummaryCard`: unchanged (it has no chart-bound values).
- **Out of scope:**
  - `ZoneDistributionChart` stays as it is, tooltip included.
  - Range selection, track highlight and camera; see the draft.
- **Lap hover bug is fixed here** (see step 4).
- **Cadence unit:** "spm" for running, "rpm" for cycling. Today it is always "rpm" (`src/features/sessions/session/SessionStatsGrid.tsx:183`).

## Rail contents
**Overview** (`src/features/sessions/charts/SessionChartsExplorer.tsx:130-286`). The resting values come from the stored session wherever they exist. Values the session doesn't have are computed from the records.

| Chart | Primary | Secondary | Source |
|---|---|---|---|
| Heart rate | avg | max | `avgHr`, `maxHr` |
| Power | NP | avg | `normalizedPower`, `avgPower` |
| Speed | avg | max | `avgSpeed`, `maxSpeed` |
| Pace (running) | avg | best | `avgPace`; best = raw fastest record |
| GAP (running) | avg | — | `gap` |
| Elevation | +gain | −loss | `elevationGain`, `elevationLoss` |
| Cadence | avg | max | `avgCadence`; max = raw highest record |
| Grade | max | min | raw extremes from records |

**Laps tab** (`src/features/sessions/laps/LapsTab.tsx:125-170`)

| Chart | Primary | Secondary | Hover |
|---|---|---|---|
| HR per lap | avg over laps | max lap | "Lap 3": lap avg + min–max |
| Power per lap | avg over laps | max lap | "Lap 3": lap avg + min–max |
| Pace/Speed per lap | avg | best lap | "Lap 3": lap avg + min–max |

**Studio** (`src/features/studio/charts/RouteChartsExplorer.tsx:76-109`)

| Chart | Primary | Secondary | Hover |
|---|---|---|---|
| Elevation | +gain | −loss | "4.2 km": elevation |
| Grade | max | min (new) | "4.2 km": grade |

**Dashboard**

| Chart | Rows | Hover |
|---|---|---|
| Load (`src/features/dashboard/LoadChart.tsx:62`) | total TSS in the shown period · avg per day/week/month | date or bucket: TSS |
| Load, split by sport (`src/features/dashboard/LoadChart.tsx:244-256`) | one row per sport: total | date: one row per sport |
| Performance (`src/features/dashboard/PerformanceChart.tsx:118-142`) | fitness / fatigue / form, latest value | date: the three values |

The Performance footer legend (`src/features/dashboard/PerformanceChart.tsx:50`) is removed: the rail rows, with their colour swatch, name and ⓘ, are the legend now.

**Lap popup on the map** (`src/features/sessions/laps/LapPickPopup.tsx:196-280`): one row each for HR / power / pace (or speed), showing the lap avg. On hover: "12:40" plus the three values.

Its table (`src/features/sessions/laps/LapPickPopup.tsx:285-320`) is trimmed to what the rail doesn't show: distance, time, cadence and elevation stay; pace/speed, avg HR and power go.

## Order
### 1. Hover state: `src/store/chartHover.ts` (new, not persisted)
- `hoveredX: Record<string, number | string | null>`, keyed by chart group: `session-detail`, `laps-detail`, `studio-detail`, or a per-chart id on the dashboard.
- Actions: `setChartHover(group, x)` and `clearChartHover(group)`.
- Each rail subscribes to its own group, so only that group's rails re-render.
- Overview: today the hover callback only exists when the session has GPS (`src/features/sessions/charts/SessionChartsExplorer.tsx:142`). Split it, so the chart hover is always set and the map lookup (`:70-82`) only runs when GPS is present.

### 2. `StatRail` (`src/components/ui/StatRail.tsx`, new) + `ChartPreviewCard`
- `StatRail` takes:
  - `rows: { label, value, unit?, metricId?, secondary?: { label, value } }[]`
  - `activeLabel?: string`
- `ChartPreviewCard` gets an optional `rail?: ReactNode` prop. When it is set, the body (`src/components/ui/ChartPreviewCard.tsx:58-64`) becomes a 2-column grid: rail and plot.
- Missing values show `--`, a recorded 0 shows `0`, and pace at speed 0 shows `--` (CLAUDE.md §2).
- Row ⓘ only for multi-series rails, with an opacity fade while hovering. For single-series charts, the ⓘ goes into the card title through `titleSlot` (`src/components/ui/ChartPreviewCard.tsx:34`).
- New messages (en + de): short rail labels such as "avg", "max", "best", "min", "NP", and "Lap {n}".

### 3. Remove tooltips, keep the hover line
Remove the tooltip from the 14 charts in scope. Locations (`Tooltip as RechartsTooltip` import, then render):
- `src/components/charts/ElevationChart.tsx:8`, `:82`
- `src/components/charts/GradeChart.tsx:8`, `:83`
- `src/features/dashboard/LoadChart.tsx:8`, `:236`
- `src/features/dashboard/PerformanceChart.tsx:8`, `:103`
- `src/features/sessions/laps/LapSplitsChart.tsx:9`, `:73`
- `src/features/sessions/laps/LapHrChart.tsx:9`, `:59`
- `src/features/sessions/laps/LapPowerChart.tsx:9`, `:59`
- `src/features/sessions/laps/LapPickPopup.tsx:9`, `:229`
- `src/features/sessions/charts/HrChart.tsx:8`, `:74`
- `src/features/sessions/charts/PowerChart.tsx:8`, `:74`
- `src/features/sessions/charts/SpeedChart.tsx:8`, `:74`
- `src/features/sessions/charts/CadenceChart.tsx:8`, `:74`
- `src/features/sessions/charts/PaceChart.tsx:8`, `:76`
- `src/features/sessions/charts/GradeAdjustedPaceChart.tsx:8`, `:76`

Keeping the hover line:
- The tooltip also draws the vertical hover line and the lap highlight band (`cursor`).
- Approach: keep the `<RechartsTooltip>` element with content that renders nothing, so the cursor and `syncId` keep working.
- If Recharts 3 keeps the active index and sync without it, drop the element instead. Spike this first.
- `chartTheme.tooltip` (`src/lib/chartTheme.ts:64-74`) becomes dead code and gets deleted. Update the `syncId` doc (`:43-44`).

### 4. Fix lap hover (regression test)
- The lap charts treat the hovered position as the lap index (`src/features/sessions/laps/LapHrChart.tsx:32`). But laps without data are skipped when the chart data is built (`src/lib/lapChartData.ts:40`, `:96`, `:116`), so the map and `LapDetailTable` highlight the wrong lap. On top of that, `?? 0` highlights lap 1 when no lap is under the cursor.
- Fix:
  - Add `lapIndex` to the lap point types (`src/lib/lapChartData.ts:4-30`).
  - Map the hovered position to `data[i].lapIndex` in a small lib helper. With nothing hovered, the result is `null`, not 0.

### 5. Wire the rails
- Overview: compute the rails in `SessionChartsExplorer`. Add a small pure helper for the values the session doesn't store (best pace, max cadence, grade max/min), as raw extremes over the records.
- Laps.
- Studio: grade min is new; compute it from the profile (`src/packages/gpx/routeProfile.ts:116-123`).
- Dashboard: `useFilteredMetrics().current` for Performance; the bucketed data for Load.
- Lap popup, then trim its table.
- Remove the Performance footer legend.
- Then trim `SessionStatsGrid` and `RouteStatsGrid`.

## Review points
None open.

## Tests
- `tests/lib/lapChartData.spec.ts`, regression test "lap hover highlights wrong lap when laps are skipped": the points carry `lapIndex`, and the helper maps the hovered position to the real lap or to `null`.
- Unit tests for the new pure helpers:
  - best pace and max cadence over records, including 0 values and missing values (pace at speed 0 is ignored);
  - grade min/max;
  - Load totals per bucket.
- e2e, extending the existing specs:
  - `e2e/sessions.spec.ts`: a rail value (e.g. avg HR) is visible next to the HR chart.
  - `e2e/studio.spec.ts:27-29`: it uses exact text "Distance", "Elevation", "Grade". Keep the rail labels from duplicating these words, or scope the locators to the card.
  - `e2e/mobile/map.spec.ts:141-144` stays green (aria-labels of the expand button unchanged).
  - `e2e/dashboard.spec.ts`: assertions on the summary values must not collide with rail text.

## Verification
`vp check`, `vp test -- --run`, `vp exec playwright test`, `vp build`.

Manually:
- On desktop and on a phone: overview, Laps tab, Studio route, Dashboard and lap popup.
- Hover or scrub: the label shows the x value, every rail in the synced stack follows, and dashboard charts stay independent.
- In both `en` and `de`: no rail label is truncated and the rail width stays fixed.
- A session with stops: 0 W / 0 rpm / 0 km/h show as 0, and pace shows `--`.
