# Segment report: analyses across all passes

Task: a Report tab on the segment page that looks at every pass of a segment at once. Today the page compares one selected pass against the best (`apps/web/src/components/segments/SegmentDetail.tsx:32-40`: `PassStrip` plus `SegmentChartsExplorer`).

What a pass holds today (`apps/web/src/lib/workers/segmentsContract.ts:15-22`): `sessionId`, `date`, `startTimestampSec`, `endTimestampSec`, `durationSec` (elapsed, see R80 in `tools/workbench/backlog/session-segments/research/moving-time.md`), `coverageRatio`. Everything else (HR, power, speed, cadence, altitude, temperature) has to be read from the session records in IndexedDB and cut to the pass window; the explorer already does this for two passes (`apps/web/src/components/segments/charts/segmentChartRows.ts:20-24`, `PassSeries`). Weather comes from Open-Meteo per session, lazily, and is cached in `session-weather` (`apps/web/src/queries/weather/useSessionWeather.ts:6-29`); a `WeatherSnapshot` has temperature, wind speed, gusts and wind direction per full hour (`apps/web/src/types.ts:115-126`).

Already settled for the segment page, and relevant here (`tools/workbench/backlog/session-segments/plan.md`):

- The Pass times scatter was replaced by the pass strip (R51). The owner rejected axes, legends and captions on that scatter (Q67), wanted every dot in the sport colour at reduced opacity, the latest pass not set apart and the trend line in front (Q63), a rolling median of 5 as the trend (Q14), always drawn (Q78), horizontal scrolling instead of presets (Q75, Q76).
- Amber-400 is the one best colour (Q79). The dashboard filters apply to the segment page (Q82, Q83).

## 1. Comparable products

| Product | What it shows across many efforts on one stretch | Source |
| --- | --- | --- |
| Strava "My Results" (subscriber) | Every own effort on the segment plotted with date on x and time on y; PR as a gold dot; list sorted by time. Effort analysis shows the top three PRs next to the viewed effort; scrubbing shows metrics along the segment. | [1], [2] |
| Strava Effort Comparison | Second-by-second comparison of speed, HR, power plus a time-gap line; 2 efforts free, up to 5 for subscribers. Pairwise, not across all efforts. | [3] |
| Strava Matched Activities | Whole-route repeats: a dot per activity plus a trend line of speed over time; fastest dot yellow, the activity you came from orange; list grouped by year below the chart; hovering the list lights the dot; hidden when there are no matches. | [4] |
| intervals.icu Routes | Route tab with a progress chart and trend line across all activities on the route; configurable activity grid; selected activities go to the compare page, which overlays traces on time or distance and can shift them to align. Supporter feature. | [5], [6], [7] |
| Garmin Connect | Segment page shows your best; all attempts only via the full leaderboard filtered to "Only Me". Users report no date sort and no comparison of attempts. Forum sources only. | [8], [9] |
| TrainingPeaks | Workout Comparison compares several whole workouts with deltas; segment-level comparison across repeats is an open feature request. Analyze 360 is climb-focused. | [10], [11] |
| Golden Cheetah | Compare mode across Summary, Ride, CP, histogram and metric charts for rides, intervals or seasons; route segments are found automatically, but ticking many instances into the compare pane is manual. | [12], [13] |
| Runalyze Recurring Routes (beta) | Detail view with the route on a map, a chart in the activity list (pace by default, both axes selectable) and a configurable, sortable, filterable table. In the activity view: rank and the last ten times up to that date. | [14], [15] |
| VeloViewer | Segment history tab lists your efforts on the segment (subscriber-only per Strava terms). Wind per effort is often mentioned but not on the page found (unverified). | [16] |

Takeaways:

- The one analysis everyone has is **time (or speed) over date with best marked and a trend** (Strava, intervals.icu, Runalyze). Everything beyond that is either pairwise (Strava, intervals.icu compare) or a configurable table (intervals.icu grid, Runalyze).
- **Rank as a sentence** ("3rd of 20", "last ten times") shows up in Runalyze's activity view and Strava's PR list; distribution views (percentiles, histograms) were not found in any product.
- **Conditions vs time** (temperature, wind) was not found as a built-in view anywhere; split comparison across all efforts was not found either (only pairwise). Both would be PaceVault's own.
- **Grouping by year** is Strava's list pattern and PaceVault's pass strip already uses it.

## 2. Candidate analyses

Data: S = pass summaries only (already in memory); R = records of every pass (IndexedDB reads, cut to the window; up to ~100 sessions); W = weather (network fetch for sessions without a cache, Open-Meteo; the local-first rule allows it only lazily).

| # | Analysis | Data | Compute | 390 px | Glance | Effort | Risk / note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A1 | Time over date (dots + rolling median 5, best amber) | S | trivial | good with horizontal scroll | high | S | brings back the removed scatter; owner's Q63/Q67 rules apply |
| A2 | PR progression (step line of the running best) | S | trivial | good | high | S | flat for long stretches; reads well as an overlay on A1 |
| A3 | Best, median, latest, spread (middle 50 %) tiles | S | trivial | 2 × 2 tiles | high | S | spread needs ≥ 4 passes, else `--` |
| A4 | Rank and percentile of the latest pass ("9th of 58 · faster than 84 %") | S | trivial | one line | high | S | no product shows percentiles; wording must stay factual |
| A5 | Distribution (dot strip of all times, latest and best marked) | S | trivial | good | medium | S | meaningless with 2–3 passes |
| A6 | Best by year (best, median, count per year) | S | trivial | list rows | high | S | partly implied by the strip's year groups |
| A7 | Consistency (spread over a rolling window) | S | trivial | ok | low | S | abstract; hard to name in DE/EN without jargon |
| A8 | Efficiency over date (cycling W/bpm; running GAP per bpm) | R | per pass mean HR, mean power/speed | good | medium | M | HR or power missing on many passes; HR lags on short segments (< 2 min); elapsed time distorts speed means (R80) |
| A9 | Avg HR vs time (scatter) | R | per pass mean | ok | medium | M | same HR lag; shows "faster because harder" |
| A10 | Splits across passes (segment in 4–6 equal distance parts; rows = passes, cell = gap to best's part) | R | distance-indexed cut per pass | ok with ≤ 5 columns | medium | L | needs distance per record; smart recording (1–8 s) blurs short parts; a stop inside a pass dominates one cell (R80) |
| A11 | Sum of best parts ("theoretical best") | R | from A10 | one tile | high | M (with A10) | made-up number if parts are too short; label must say how it is built |
| A12 | Temperature vs time | R or W | device temperature mean (sun-biased) or weather | ok | low | M | device sensor runs warm; weather needs network |
| A13 | Headwind vs time | W + segment bearing | wind component along the segment | ok | medium | L | hourly wind at a grid point, not on the road; network for up to 100 sessions |
| A14 | Start hour / season vs time | S | trivial | ok | low | S | confounded with fitness and weather |
| A15 | Elapsed vs moving (stop time per pass) | R | per pass | list | low | M | belongs to R80, not the report |

## 3. Shortlist

All layouts put two tabs under the segment header: **Passes** (today's strip and explorer, unchanged) and **Report**, with `PvTabs` / `PvTabsList` floating like the dashboard (`apps/web/src/components/dashboard/index.tsx:25-46`). With 1 pass the Report shows a note (Q6). Mockup: `mockup/index.html`.

### L1 · Progress (test first)

```
desktop (content column)              390 px sheet
┌ Passes │[Report]──────────┐        ┌ Passes │[Report]┐
│ Best 4:12 Median 4:51     │        │ Best    Median  │
│ Latest 4:38 Spread 0:24   │        │ Latest  Spread  │
├ Pass times ───────────────┤        ├ Pass times ─────┤
│ · ·  ·•· ·~~~·~~·· ·  ·   │ scroll │ ·~~·•·~~·  ←    │
│ 2024   2025   2026        │        │ 2025  2026      │
├ Best by year ─────────────┤        ├ Best by year ───┤
│ 2026 4:21 ▮▮▮▮ 14 passes  │        │ 2026 4:21  14   │
│ 2025 4:12♛ …              │        │ 2025 4:12♛ 19   │
└───────────────────────────┘        └─────────────────┘
```

Rationale: everything comes from pass summaries (A1, A3, A6), no records, no network; the shape every comparable product shares. Tests the tab structure and the trend chart's look cheaply.

### L2 · Standing

```
┌ LATEST PASS                                ┐   phone: same, stacked,
│ 9th of 58                                   │   tiles 2 × 2
│ faster than 84 % of the other passes · 4:38 │
│ ●·:·:○·:|::·:· ·    ·                       │
│ 4:12   median dashed · latest white   5:40  │
│ Best 4:12 · 25 % 4:36 · Median 4:51 · 75 %  │
├ Fastest 5 ──────────────────────────────────┤
│ 1 ♛ 4:12  12 Jun 2025                       │
│ 2   4:15  …                           +0:03 │
└─────────────────────────────────────────────┘
```

Rationale: answers "how good was the latest pass" (A4, A5) without a time axis; summaries only; no product does this, so it is the most open look.

### L3 · Body (efficiency)

```
┌ LATEST PASS, AVERAGES                 ┐   phone: same, stacked
│ HR 162 bpm · Power 287 W · 1.77 W/bpm │
├ Power per heartbeat ──────────────────┤
│  ·  ·~·~~··~~·~~·•· ·                 │
├ Heart rate and time ──────────────────┤
│ faster ↑   · ·  ·•  ·                 │
│            ·  ·   ·   avg HR →        │
└───────────────────────────────────────┘
```

Rationale: A8, A9, "am I fitter or did I just push harder"; needs records and HR; the missing-data scenario is the stress test.

### L4 · Splits

```
┌ Where time goes  5 parts of 0.5 km ┐   phone: 5 narrow columns
│        ▁▂▃▅▆ (profile)              │   fit at 390 px; latest 12
│ Part   1    2    3    4    5  total │   rows plus the best
│ ♛Best 0:51 0:52 1:03 0:55 0:45 4:26 │
│ 29 Oct −2   +3   +3   −2   +4  +0:07│
│ 14 Oct +4   +7   +6   +4   +6  +0:27│
│ …                                   │
│ Best parts 4:16 · Best 4:26 · Part 2│
└─────────────────────────────────────┘
```

Rationale: A10, A11, the only analysis that says where on the stretch time is won or lost; most effort (records, distance cuts) and the most R80-sensitive.

### L5 · Full report (sections)

```
┌ Summary tiles (A3)                    ┐   phone: sections stacked,
├ Pass times (A1 compact) ──────────────┤   conditions 1 per row
├ Best by year (top 3) ─────────────────┤
├ Parts: median gap per part, best sum ─┤
├ Conditions: temperature · headwind · start hour
└───────────────────────────────────────┘
```

Rationale: one long page with every cheap section plus one card each for parts and conditions (A11–A14); shows how much is too much and where the cost of records and weather sits.

**Test first: L1.** It needs no records and no network, it settles the tab question (Q1) and the trend chart's rules (Q3) that every other layout reuses, and its sections are the top of L5. L2 is the cheap alternative look; L3–L5 decide whether the report reads records (Q4) and weather (Q5).

## 4. Open questions for the owner

1. **Q1 · Tab structure.** (a) `Passes · Report` tabs under the header (`PvTabsList` floating, like the dashboard); (b) no tabs, the report cards follow the explorer on one page; (c) a small `PvSegmentedControl` in the strip card's header. Recommendation: (a).
2. **Q2 · Which time the report uses.** (a) wait for R80 and use moving time; (b) elapsed now, as the strip does, switch with R80; (c) both, elapsed with moving below. Recommendation: (b).
3. **Q3 · Axes on the Pass times trend.** (a) none, like the old scatter (Q67); (b) year labels on x and best/median labels on y only; (c) full axes. Recommendation: (b).
4. **Q4 · Analyses that read records (efficiency, splits).** (a) computed when the Report tab opens, in a worker, with a skeleton; (b) per-pass summaries stored at match time with a matcher version bump; (c) not in v1. Recommendation: (c) for v1, (b) when they come.
5. **Q5 · Conditions need weather for up to 100 sessions from Open-Meteo.** (a) cached weather only, the rest `--`; (b) fetch on tab open; (c) not in v1. Recommendation: (c).
6. **Q6 · Segments with 1 pass (and 2–3).** (a) tab disabled below 2 passes; (b) tab always on, a note "The report needs at least 2 passes", sections that need more show `--`; (c) tab hidden with 1 pass. Recommendation: (b).
7. **Q7 · Dashboard filters.** (a) the report follows the filter like the rest of the page (Q82); (b) always every pass. Recommendation: (a).
8. **Q8 · Tapping a pass in the report.** (a) switches to Passes with that pass selected; (b) opens its session; (c) nothing. Recommendation: (a).

## 5. Sources

1. Strava Support, "My Segment Results": https://support.strava.com/hc/en-us/articles/216917447-My-Segment-Results and https://support.strava.com/en-us/articles/15401900-how-do-i-view-my-segment-results-on-strava
2. Strava Support, "Strava subscription features": https://support.strava.com/en-us/articles/15402044-strava-subscription-features
3. BikeRadar, "Strava launches effort comparison tool": https://www.bikeradar.com/features/routes-and-rides/strava-launches-effort-comparison-tool
4. Strava Support, "How do I view my Matched Activities?": https://support.strava.com/en-us/articles/15401955-how-do-i-view-my-matched-activities
5. intervals.icu, Routes feature page: https://www.intervals.icu/features/routes/
6. intervals.icu forum, "Activity route matching" and "Activity routes beta testing needed": https://forum.intervals.icu/t/activity-route-matching/89041 and https://forum.intervals.icu/t/activity-routes-beta-testing-needed/86792 (the 7-activity moving average and "Compare" from the route grid come from search excerpts, not re-read on the page: unverified)
7. intervals.icu, Compare Activities: https://www.intervals.icu/features/compare-activities/
8. Garmin forums, "compare attempts on a segment": https://forums.garmin.com/apps-software/mobile-apps-web/f/garmin-connect-mobile-andriod/406344/compare-attempts-on-a-segment
9. Garmin forums, "is there a way to look at my current and past times on a segment": https://forums.garmin.com/apps-software/mobile-apps-web/f/garmin-connect-mobile-andriod/378794/is-there-a-way-to-look-at-my-current-and-past-times-on-a-segment-on-the-garmin-connect-app
10. TrainingPeaks Help, "Workout Comparison": https://help.trainingpeaks.com/hc/en-us/articles/45991952858381-Workout-Comparison
11. TrainingPeaks feedback, "Multi-File Analysis": https://peaksware.uservoice.com/forums/106657-trainingpeaks-customer-feedback/suggestions/45012814-multi-file-analisys
12. GoldenCheetah v3.1 release notes: https://www.goldencheetah.org/RELEASE/release-notes_3.1.0.html
13. golden-cheetah-users, "Route Segments": https://groups.google.com/g/golden-cheetah-users/c/wOrFbDyabQs (forum; current versions unverified)
14. Runalyze Help, "Recurring routes": https://runalyze.com/help/article/recurring-routes
15. Runalyze blog, "New Feature: Recurring Routes": https://blog.runalyze.com/allgemein-en/new-feature-recurring-routes/
16. VeloViewer blog, "Strava Subscriber vs Non-Subscriber": https://blog.veloviewer.com/?p=2700
