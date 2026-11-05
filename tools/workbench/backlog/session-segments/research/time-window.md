# Research: time window for the Pass times scatter and passes list

Question: should the Pass times scatter (and maybe the passes list) show only the past N weeks, and how do other tools let people pick a slice? Relates to Q66 (d) and Q60 in `plan.md`.

## Summary

- **The direct precedents show all history.** Strava's segment "My Results" graph and its Matched Activities chart plot every effort and let you scroll sideways. Neither help article mentions a date filter on the chart. Strava's date presets (Today / This Week / This Month / This Year / All-Time) are **leaderboard** filters, not chart windows. Runalyze takes the other route: a fixed count ("the last ten times up to the date of this activity").
- **Preset chips are the common slicing pattern** in general-purpose trend charts: Apple Health (D/W/M/Y), Highcharts Stock (1m 3m 6m YTD 1y All by default), intervals.icu (1/3/6 months, seasons, last 42/84 days for curves), Strava's progress chart (12 weeks). A brush or drag-to-zoom is the tool for custom ranges. Free date pickers show up only in coach tools (TrainingPeaks, Golden Cheetah).
- **I found no tool that widens the window automatically when it holds too few points.** Tools either show everything, use a fixed count (Runalyze), or show a sparse or empty chart. Apple Health has a "Needs More Data" state for Activity Trends.
- **In the demo data a short window is often nearly empty.** Most segments span about 38–52 weeks. In the last 4 weeks, 28 of 36 segments have ≤ 2 passes and 8 have none. In the last 12 weeks, 5 have none and 27 have fewer than 5. The 5-pass rolling median (`mockup/hifi/data.ts:80`) needs at least 5 points before it is a median.
- **PaceVault already has the pieces:** the `FilterTime` model with its resolver (`apps/web/src/lib/filtering/timeRange.ts:7-12`, `:123-135`), translated labels such as "last {count} weeks" (`packages/i18n/messages/en.json:231`), drag-to-zoom with a reset pill on the dashboard charts, and two kit controls for small option sets (`PvTabsList variant="inline"`, `PvSegmentedControl size="sm"`).

## Other tools

Facts come from the cited primary sources. Anything not documented there is marked _unverified_.

| Tool / view                             | Default window                                          | Slices                                                                                                                                                                | Control type / placement                                         | Sparse data                                                 | List follows chart?                                                                     |
| --------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Strava segment "My Results" graph [1]   | All efforts ("All of your efforts … are plotted")       | None on the graph; you scroll left and right                                                                                                                          | My Results is a leaderboard filter; graph above the efforts list | Shows what exists; PR as a gold dot                         | You scroll the list and the graph separately; linking not documented                    |
| Strava segment leaderboard [2]          | All-Time                                                | Today, This Week, This Month, This Year, All-Time (web: This Year in the side menu, the rest in the All-Time dropdown; app: This Year and Today)                      | Dropdown and side-menu items                                     | n/a (ranking)                                               | It is the list                                                                          |
| Strava Matched Activities [3]           | Full history of matches, scrolled horizontally          | None                                                                                                                                                                  | Chart with trend line; list grouped by year below                | Not documented                                              | Hovering or scrolling the list highlights points on the chart; the list is not windowed |
| Strava progress chart [4]               | Last 12 weeks                                           | Article names only 12 weeks (_a "this year" option is unverified_)                                                                                                    | Chart on the profile / You tab                                   | n/a                                                         | n/a                                                                                     |
| Garmin Connect segments [5][6]          | Leaderboard, all time                                   | No date filter found; "Me Only" filter; age groups                                                                                                                    | Filter button top right of the full leaderboard                  | n/a                                                         | It is the list                                                                          |
| Runalyze recurring routes [7]           | Last 10 times up to the activity's date (small graphic) | Detail view: all activities on the route, filterable table, chart with chosen axes                                                                                    | Table filters and column picker                                  | Count-based window, so it never shows fewer than min(n, 10) | The chart sits with the table; filtering the table is "dynamic"                         |
| intervals.icu Fitness / curves [8][9]   | Last-used range is remembered and centred on today      | 1, 3, 6 months; seasons (user-defined); curves: last 42 / 84 days, seasons, custom ranges                                                                             | Range dropdown above the chart                                   | Not documented                                              | One range shared by the whole Fitness chart                                             |
| TrainingPeaks dashboard [10]            | Dashboard-wide range                                    | Each chart follows the dashboard range or has its own                                                                                                                 | Chart settings (tap the title)                                   | Not documented                                              | n/a                                                                                     |
| Golden Cheetah Trends [11]              | Selected season / date range                            | Seasons, user-defined relative ranges (v3.7)                                                                                                                          | Sidebar date range / season tree                                 | Not documented                                              | Charts follow the selected range                                                        |
| Apple Health / Fitness [12][13]         | Week (Health charts)                                    | D / W / M / (6M) / Y segmented control above the chart (_the 6M label is unverified in a primary source_); Activity Trends compare the last 90 days with the last 365 | iOS segmented control at the top of the chart                    | Activity Trends: "Needs More Data" section                  | Lists under the chart follow the selected period (_unverified_)                         |
| Highcharts Stock (library default) [14] | Not fixed                                               | 1m, 3m, 6m, YTD, 1y, All buttons plus a navigator (overview brush)                                                                                                    | Buttons top left, brush below the plot                           | Not handled                                                 | n/a                                                                                     |

Komoot and Wahoo: I found no segment-effort history view comparable to this one.

## Dataviz patterns for a time-sliced history of discrete events

1. **Preset chips / segmented control** (4W · 12W · 1Y · All). It costs one tap, is easy to read, and fits phone width with 3–4 options. The state is one enum. The risk is an empty or sparse chart for segments you rarely ride.
2. **Overview + detail (brush).** A thin strip with all passes and a draggable window above or below the detail plot (Highcharts navigator). It is precise, but it adds a second chart and conflicts with "no axes, minimal" (Q67), and dragging is poor on phone.
3. **Drag-to-zoom on the plot itself, with a reset pill.** PaceVault already does this on the dashboard. It costs no extra chrome, but a pointer-only gesture is hard to discover (the dashboard shows a hint tile for exactly this, `apps/web/src/components/filters/index.tsx:118-125`).
4. **Count-based window** ("last n passes", Runalyze). It is never sparse and needs no control, but the x span varies per segment, so "4 weeks" means nothing.
5. **Minimum-count fallback.** The window is N weeks, widened (or padded with earlier passes) until it holds at least k passes. The chart is never empty, but the actual span differs from the label, so the caption has to state the real span. No tool I found does this automatically.
6. **Window as emphasis, not filter.** All passes are drawn, those outside the window dimmed, and the trend is computed over the window only. Context stays and there is no empty state, but it does not reduce the clutter of 93 dots, which is the owner's concern.

## In-app precedent (verified)

- **Time model:** `FilterTime` covers `relative` (amount + unit day/week/month/year), `calendarYear`, `calendar`, `since` and `range` with `source: 'zoom'` (`apps/web/src/lib/filtering/timeRange.ts:7-12`). `resolveFilterRange` turns it into `{from, to}` clamped to today (`timeRange.ts:123-135`); `isZoomTime` detects a zoom range (`timeRange.ts:137-138`). The file has no React, so a segment page can reuse it as is.
- **Default presets (dashboard):** three saved filters, last 7 days, last 30 days and this year (`apps/web/src/lib/filtering/filters.ts:189-199`). The free-text parser maps "last w/m/y" to 7/30/365 days (`filters.ts:498-503`).
- **Labels:** `relativeLabel` builds "last week" / "last {count} weeks" / months / years through `formatPlural` (`filters.ts:284-300`); `timeLabel` adds "this year", "since …" and formatted zoom ranges (`filters.ts:333-368`). Messages: `ui_filter_last_weeks` "last {count} weeks" / "letzte {count} Wochen" (`packages/i18n/messages/en.json:231`, `de.json:231`), `ui_filter_last_months` (`en.json:233`), `ui_filter_this_year` (`en.json:234`), `ui_filter_all_time` "all time" / "gesamter Zeitraum" (`en.json:225`, `de.json:225`).
- **Controls:** the dashboard filters render as `PvActionTile` items in the filter panel (`apps/web/src/components/filters/index.tsx:126-140`), not as chips on the chart. The closest in-card control is the Load chart's Day / Week / Month switch: `PvTabs` with `PvTabsList variant="inline"` and small triggers inside the chart card (`apps/web/src/components/dashboard/LoadChart.tsx:39-43`, `:107-127`; variant at `packages/ui/src/components/pvTabs/PvTabsList.tsx:6-13`). The kit also has `PvSegmentedControl` with a `sm` size (`packages/ui/src/components/pvSegmentedControl/PvSegmentedControl.tsx:9-28`), used only in the Labs pace converter (`apps/web/src/components/labs/PaceCalculator.tsx:36-41`). `PvChip` is a static label without a pressed state (`packages/ui/src/components/pvChip/PvChip.tsx:11-20`).
- **Brush / zoom:** `useChartZoom` (drag on the plot, `apps/web/src/components/charts/hooks/useChartZoom.ts:24`) is used by the Load, Volume, Performance, Elevation and Grade charts. On the dashboard, a zoom becomes `FilterTime` `range/zoom` through `setDashboardChartRange` (`apps/web/src/components/dashboard/hooks/useDashboardChartZoom.ts:12-32`) and is undone with `PvZoomResetPill` (`apps/web/src/components/dashboard/DashboardZoomReset.tsx:7-16`).
- **Where the state lives:** dashboard range and group-by are in the Zustand store `store-filters`, persisted to IndexedDB (`apps/web/src/store/filters.ts:19-31`, `:206-210`), not in the URL. Tab-like page state uses the URL query through `useRouterQuery` (`apps/web/src/routing/useRouterQuery.ts:9`; e.g. Labs tabs `apps/web/src/components/labs/index.tsx:31`). The segment page already carries `?from=` in the URL (Q64).
- **Mockup today:** the trend is a 5-pass rolling median (`tools/workbench/backlog/session-segments/mockup/hifi/data.ts:80-90`); the list shows the best pass plus "Show n more" (Q60).

### Demo density (passes in window, 36 segments, `mockup/hifi/segments.json`)

| Window   | Median per segment | Segments with 0 | Segments with < 5 | Max |
| -------- | ------------------ | --------------- | ----------------- | --- |
| 4 weeks  | 2                  | 8               | 31                | 10  |
| 12 weeks | 4                  | 5               | 27                | 24  |
| 26 weeks | 8                  | 0               | 6                 | 52  |
| 52 weeks | 14                 | 0               | 3                 | 93  |

The demo spans about one year, so "All" equals 52 weeks here. Real exports over several years will make "All" denser.

## Options for PaceVault

### O1 · Preset tabs in the row, default 12 weeks, fallback to All when sparse

```
Pass times                      [12W] 6M  1Y  All
  ·   ·  ·    ·  ·── ─ ─── ·  ·    ·
4 Mar 2026 · 3:12            7 of 93 passes
```

`PvTabsList variant="inline"` like the Load chart, with options 12 W · 6 M · 1 Y · All. Labels come from the existing `relativeLabel` messages in long form for screen readers and short visible labels (new keys). The list shows the window's passes plus the best pass, always, even when it lies outside the window.

- Pros: reuses the Load chart pattern; one tap; the caption counts make the window honest; `FilterTime` and `resolveFilterRange` do the maths.
- Cons: a new set of short labels (12 W / 6 M) is needed; a 12-week default holds fewer than 5 passes on 27 of 36 demo segments.

### O2 · Same presets, smart default: smallest preset with ≥ 8 passes

```
Pass times                       12W [6M] 1Y  All
  ·  ·   · ·  ·──·─── ·─ ·   ·  ·  ·
6M chosen: 12W holds 3 passes
```

Same control as O1, but the initial selection is the shortest preset holding at least k passes (k ≈ 8: enough for a 5-pass median to settle), else All. Choosing a tab yourself overrides it.

- Pros: never opens on an empty or near-empty plot; a busy segment (93 passes) opens on 12 W (24 passes), a rare one on All.
- Cons: the default differs between segments, which can surprise; it needs one line of copy explaining the choice (or none, if the selected tab is enough).

### O3 · Count window, no control ("last 20 passes", Runalyze-style)

```
Pass times · last 20 passes            Show all
  · ·  · ·──·── · ─ · ·
```

- Pros: no empty state; the trend always has enough points; minimal chrome (fits Q67).
- Cons: no calendar meaning, so for a rarely ridden segment 20 passes span years; one more toggle is still needed for All.

### O4 · Drag-to-zoom on the scatter + reset pill, default All (dashboard pattern)

```
Pass times                                 ⤺ Reset
  · ·  ·[·  · ·──·── ·]·  · ·
```

- Pros: no new control; reuses `useChartZoom` and `PvZoomResetPill`; precise.
- Cons: hard to discover, poor on phone; dragging competes with hover and dot click (Q54 selects a pass from the dots); it does not answer "past N weeks" by default.

**Recommendation:** O2 (presets with a sparse-aware default), with the presets **12 W · 6 M · 1 Y · All** and **k = 8**. Background for the default N: Strava's own progress chart uses 12 weeks [4], intervals.icu's recent windows are 42 / 84 days [9] (6 / 12 weeks), and in the demo 12 weeks still gives the busiest segment 24 passes while 4 weeks leaves 8 of 36 segments empty. A 4 W preset is not worth a slot: the median of 2 passes is not a trend. With fewer than 5 passes in the chosen window, draw the dots without the trend line rather than a median of 2–4. The best pass stays visible in the list and on the scatter (amber, Q63) even when it falls outside the window, marked as outside (a pinned edge dot like Q66 (a)).

**List:** the list follows the window (the "Show n more" count is per window), with the best pass and the origin pass (Q64) always kept. Strava keeps lists unwindowed (grouped by year), which is the alternative.

**State:** the window in the URL query (`?window=12w`) like the other segment-page state (`?from=`, Q64), not persisted. _Assumption_: a persisted per-user default in the store would need a store version bump with `migrate`.

## Open questions for the owner

1. **Default window:** (a) the smallest preset with ≥ 8 passes, else All (O2); (b) a fixed 12 weeks (O1); (c) the last 20 passes (O3); (d) All, zoom to narrow (O4). Recommendation: (a).
2. **Preset set:** (a) 12 W · 6 M · 1 Y · All; (b) 4 W · 12 W · 1 Y · All; (c) 3 M · 6 M · 1 Y · All (month units like intervals.icu). Recommendation: (a).
3. **Does the passes list follow the window?** (a) yes, with the best pass and the origin pass always included; (b) no, the list always holds every pass; (c) yes, strictly, without the pinned best/origin. Recommendation: (a).
4. **Trend in a sparse window:** (a) hide the trend below 5 passes; (b) compute the median over passes from before the window too, so the line starts filled; (c) always draw it. Recommendation: (a).

## Sources

1. Strava, My Segment Results: https://support.strava.com/hc/en-us/articles/216917447-My-Segment-Results
2. Strava, Segment Leaderboard Filters: https://support.strava.com/hc/en-us/articles/360030851772-Segment-Leaderboard-Filters
3. Strava, Matched Activities: https://support.strava.com/hc/en-us/articles/216918597-Matched-Activities
4. BikeRadar, Strava progress chart (last 12 weeks): https://www.bikeradar.com/news/strava-personalised-progress-chart/
5. Garmin Edge 520 manual, segment details / leaderboard: https://www8.garmin.com/manuals/webhelp/edge520/EN-US/GUID-BE36116B-0613-43D3-8EEB-3BFC19306772.html
6. Garmin forum, segment leaderboard "Me Only": https://forums.garmin.com/apps-software/mobile-apps-web/f/garmin-connect-web/83665/how-to-see-segment-times
7. Runalyze, Recurring Routes: https://blog.runalyze.com/allgemein-en/new-feature-recurring-routes/
8. intervals.icu forum, Fitness preset time selector: https://forum.intervals.icu/t/fitness-preset-time-selector-on-mobile/66587 and https://forum.intervals.icu/t/solved-fitness-tab-x-alignment/127504
9. intervals.icu forum, power curve 42 / 84 days: https://forum.intervals.icu/t/power-curve-understanding-issue/108347
10. TrainingPeaks, Customize the Dashboard: https://help.trainingpeaks.com/hc/en-us/articles/204072104-Customize-the-Dashboard
11. GoldenCheetah v3.7 release notes: https://www.goldencheetah.org/RELEASE/release-notes_3.7.0.html
12. Macworld, Apple Watch Activity Trends (90 vs 365 days): https://www.macworld.com/article/233093/ios-13-and-apple-watch-activity-trends-give-you-the-big-picture.html
13. Uxcel, iOS segmented controls (Health: Day/Week/Month/Year): https://app.uxcel.com/lessons/ios-app-design-712/segmented-buttons-instead-of-tabs-5352
14. Highcharts API, rangeSelector.buttons: https://api.highcharts.com/highstock/rangeSelector.buttons
