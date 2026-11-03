# Pass mini charts and segment labels: research

Scope: plan Q11 (mini chart metric per sport in the pass cards of the passes dialog), Q20 (its colour) and Q10 (segment label without an external service or place name). Builds on `segment-ui.md` (sources [S1]–[S14] there) and `segment-model.md`.

## Facts in the repo that shape the options

- Per-record fields are all optional except `timestamp`: `hr`, `power`, `cadence`, `speed`, `lat`, `lng`, `elevation`, `distance`, `timerTime` (`packages/engine/src/types.ts:61-72`). Every pass has distance and time (it was matched on GPS), so anything built from **distance + time** exists for every pass; HR, power, cadence and elevation may be missing per pass.
- Grade-adjusted pace already exists in the engine (`packages/engine/src/normalizedEffort.ts:47`, `packages/engine/src/normalizedEffort.ts:55`) and has a chart and a token (`apps/web/src/components/sessions/charts/GradeAdjustedPaceChart.tsx:79`).
- Chart tokens (`packages/ui/src/lib/tokens.ts:42-53`): `chartHr` red `#ef4444`, `chartPower` blue `#3b82f6`, `chartSpeed` green `#22c55e`, `chartCadence` amber `#f59e0b`, `chartElevation` violet `#8b5cf6`, `chartPace` cyan `#06b6d4`, `chartGap` pink `#ec4899`. **`chartGap` means grade-adjusted pace, not time gap**: a "time gap to best" line has no token today, and reusing the name would mislead.
- Identity colours available: `sportRunning` `#4ade80`, `sportCycling` `#f97316` (`packages/ui/src/lib/tokens.ts:36-37`), `mapHighlight` white (`packages/ui/src/lib/tokens.ts:39`), text greys (`packages/ui/src/lib/tokens.ts:9-12`). Q18 settled the best marker as neutral (white ring + chip). The dialog is off the map, so the "no blue/cyan/grey" rule (`apps/web/CLAUDE.md` §3) does not bind the sparkline; it binds only the map.
- The mockup draws the sparkline 88 px wide (56 px on phone) and 30 px high, with one shared y-range across all cards and identity colours (this session = sport colour, best = neutral, others = dot grey) (`tools/workbench/backlog/session-segments/mockup/index.html:607-612`, `tools/workbench/backlog/session-segments/mockup/index.html:1179-1199`).
- Stepper label: a fixed `w-104px` span (`apps/web/src/components/sessions/session/LapStepper.tsx:50`). Existing names there are `Lap {number}`, `Split {number}` (`packages/i18n/messages/en.json:545-546`) and, for efforts, a **type word + ordinal**: `Work {number}`, `Rec {number}`, `Steady {number}`, `Warm-up` (`packages/i18n/messages/en.json:752-758`, built in `apps/web/src/components/sessions/session/lapLabels.ts:263-306`). That is a precedent for a typed label such as `Climb 2`.

## 1. Comparable products

### 1a. What a pass comparison draws along the stretch

| Product | What is drawn along the segment / route | Per sport | Source |
| --- | --- | --- | --- |
| Strava Effort Comparison | **Elevation profile + time gaps** between compared efforts against a baseline; pins on the map for relative position. No speed, HR or power line. | Same for run and ride | [C1] |
| Strava Analyze Effort (segment) | Scrub along the segment; sensor graphs (HR, power, cadence) overlaid on the elevation profile; **without sensors only the speed graph**. | Speed/pace always, sensors when present | [C2] |
| Strava My Results | List and scatter compared by **time, speed or pace, heart rate, power or date**; scatter is date × time. | Pace for runs, speed for rides | [C2] |
| Strava Matched Runs/Activities | Trend of **average pace / speed** over time, one dot per activity; no per-activity line. | Pace vs speed by sport (wording only, unverified per sport) | [C3] |
| Strava GAP | GAP shown as segment average on hilly segments (mobile); meant for comparing **across** flat and hilly routes. | Runs only | [C4] |
| Garmin Connect | Activity charts can overlay a second metric (e.g. pace vs elevation), max two; "Compare activities" is a side-by-side table, users ask for overlays and a distance-vs-time (ahead/behind) plot, i.e. not offered. Segment detail shows time and average speed/pace. | Pace for runs, speed for rides | [C5], [C6], [C7] |
| intervals.icu Compare | Overlays **power, heart rate and other traces** of several activities; x-axis time or distance; manual offset to align. No time-gap trace documented. Routes: auto-matched whole activities with a route tab (contents not documented in text). | User picks traces | [C8], [C9], [S11] |
| Golden Cheetah | Compare mode over rides and intervals on ride, CP, histogram and metric charts; distance x-axis for compare not confirmed. | Power-first (cycling) | [C10] |
| Runalyze | Recurring routes: groups activities on the same route, detail view = route + list of activities. No per-route overlay found. | n/a | [C11] |
| TrainingPeaks / WKO, Wahoo, COROS, Suunto | No own segment-pass chart found; Wahoo/COROS consume Strava Live Segments. | n/a | unverified; [S13], [S14] |

Takeaways:

- The one product that draws a **per-effort line along the segment for comparison** (Strava Effort Comparison) uses **time gap**, not pace or HR, and puts the **elevation once** as context, not per effort.
- Pace (runs) / speed (rides) is the universal fallback metric because it needs no sensor; HR and power appear only "if present".
- Nobody shows GAP per pass on the same segment. GAP corrects for grade, but all passes of one segment share the grade, so GAP changes no ranking between passes; it only flattens the shape of the line.
- Nobody found shows a sparkline per effort in a list; small multiples per pass is PaceVault's own pattern.

### 1b. How auto-detected stretches are named

| Product | Naming | Source |
| --- | --- | --- |
| Strava segments | User-created, user-titled; guidance only: no personal info in titles. Climb categories are a separate automatic classification. | [C12], [C13] |
| Strava Matched Runs | Matching by start, end, direction, distance; no route name documented (the list shows activity names). | [C3] |
| Garmin ClimbPro | Auto-detected climbs on a course; screen shows distance to go, ascent remaining, gradient; a "climb n of m" count is attributed to Garmin by DC Rainmaker (not confirmed in Garmin's own manuals). | [C14], [C15] |
| Hammerhead Climber | Auto climbs ≥ 500 m and ≥ 3 %, classed Small/Medium/Large; shows length and average grade, no name. | [C15] |
| intervals.icu routes | Auto-detected; name editable by clicking it, per athlete; default name not documented. | [S11] |
| Komoot Highlights | User-created segments, user-named; public names often "Climb from X to Y" (place names, out of scope here). | [C16], [S12] |
| Runalyze recurring routes | Auto-grouped; naming not documented. | [C11] |

Takeaways:

- **Nobody auto-generates a human name without places.** Products either let the user name it (Strava, Komoot, intervals.icu) or show it as a **typed, numbered thing with its numbers** (ClimbPro, Hammerhead: climb + length + gain/grade).
- The typed-climb pattern matches PaceVault's own `Work 2` / `Rec 1` efforts precedent.
- User rename needs a stable identity across sessions; coverage chunks (Q1 (a)) are recomputed per open session, so a rename has nothing durable to attach to in v1.

## 2. Options: mini chart metric (Q11)

Scale: ++ good, + fine, − weak, −− poor. "Comparable" = the line differs between passes in a way that explains the time difference. "Data" = present for every pass in typical FIT files. "88/56 px" = readable as a 30 px high line at that width with a shared y-range.

| Metric | Run | Ride | Comparable | Data | 88/56 px | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| M1 Time gap to best over distance (cumulative, `t_pass(d) − t_best(d)`) | ++ | ++ | ++ answers "where did I lose/gain time"; end value = the gap shown as text | ++ distance + time only | ++ smooth by construction (integral), no smoothing needed | Strava Effort Comparison's line [C1]. The best card is a flat zero line (still a valid reference). No token: `chartGap` is GAP. |
| M2 Pace over distance (runs) | ++ | − (pace is unusual on a bike) | + shape shows pacing; who was faster where | ++ | − raw pace is spiky (stops, GPS); needs smoothing and clipping of stops, y inverted | Fallback metric in Strava/Garmin [C2], [C5] |
| M3 Speed over distance (rides) | − | ++ | + as M2 | ++ | − spiky at junctions/stops, descents dominate the range | Same as M2 for cycling |
| M4 Grade-adjusted pace (runs) | + | n/a | − same grade for every pass, so no change to the ranking vs M2 | + needs elevation; barometric vs GPS elevation differ per device, adds noise between passes | − | Useful across routes, not within one segment [C4] |
| M5 Power (rides) | − rare on runs | + | + effort distribution, independent of wind on the time result | − only with a power meter | − 1 s power is very spiky; needs 10–30 s smoothing | intervals.icu/Golden Cheetah default trace for cycling [C8], [C10] |
| M6 W/kg | − | + | same line as M5 (only the scale differs; weight is one profile value) | − as M5 + weight history | as M5 | No gain over M5 on an unlabelled sparkline |
| M7 Heart rate | + | + | − explains state (fitness, fatigue, heat), not the time; lags 20–60 s on a short segment | − often missing (owner note) | + smooth | Strava/intervals.icu show it only when present [C2], [C8] |
| M8 Cadence | − | − | −− | − | − | Low value as a pass comparison |
| M9 Elevation profile | context | context | −− identical for every pass | + | ++ | Draw once (dialog header), not per card, as Strava does [C1] |

Single metric vs choice:

| Pattern | For | Against |
| --- | --- | --- |
| One fixed metric for all sports (M1) | No per-sport logic, no missing state, no control in the dialog | Does not show pace/HR for those who want it |
| One metric per sport (M2 run / M3 ride) | Familiar units | Spiky at 56 px; needs a smoothing rule; still sensor-free |
| Fixed default + a small `PvSegmentedControl` in the dialog header (`Gap · Pace/Speed · HR`) | Lets HR/power users look, keeps the default sensor-free | Extra control in a dialog the owner wanted lean (Q21); missing data per card → `--` line slot |

Colour (Q20):

| Option | For | Against |
| --- | --- | --- |
| K1 Identity colours: this session = sport colour, best = neutral white, others = `textTertiary` | Same encoding as the scatter dots in the row; the card that matters stands out; Q18 already made best neutral | Recorded exception to "chart colour = metric token"; metric not encoded by colour (acceptable when there is one metric) |
| K2 Metric token (`chartPace` cyan, `chartSpeed` green, `chartHr` red, `chartPower` blue) | Consistent with the session charts | All cards one colour: this session and best indistinguishable without the chip; M1 has no token (needs a new `chartTimeGap`) |
| K3 Metric token for the line + identity only for this session's card (sport colour) | Middle ground | Two encodings in one list; best still only marked by text |

## 3. Options: segment label (Q10)

| Option | EN / DE example | Unique in session | Stable in session | Fits 104 px pill | Meaning to the user | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| L1 Number + km range | `Segment 2 · 1.4–5.1 km` / `Segment 2 · 1,4–5,1 km` | ++ | ++ (cut on the open session) | − only `Segment 2` fits; range goes to the subtitle | + locates it on this session | Current mockup (`tools/workbench/backlog/session-segments/mockup/index.html:943`) |
| L2 Number only | `Segment 2` | ++ | ++ | ++ | − | Same as `Lap 3`, `Split 3` (`packages/i18n/messages/en.json:545-546`) |
| L3 Typed + ordinal from elevation | `Climb 1`, `Descent 1`, `Flat 2` / `Anstieg 1`, `Abfahrt 1`, `Flach 2` | ++ (ordinal) | ++ | ++ | + says what kind of stretch | Follows the efforts precedent `Work 2` (`packages/i18n/messages/en.json:752-754`); thresholds needed (Hammerhead: ≥ 500 m, ≥ 3 % [C15]); rolling terrain → `Rolling`/`Wellig`; needs elevation, else falls back to `Segment n` |
| L4 Climb tag with numbers | `Climb +312 m` / `Anstieg +312 m` | − two similar climbs collide | ++ | + (`Anstieg +312 m` ≈ 15 chars, tight) | ++ for climbs | ClimbPro style [C14]; only for climbs; non-climbs need another scheme |
| L5 Compass direction | `Northbound` / `Richtung Norden` | − several segments share a heading | + | − DE too long | − winding stretches have no single heading | Bearing start→end; loops ambiguous |
| L6 Position on the session | `Start`, `Middle`, `End` / `Anfang`, `Mitte`, `Ende` | −− with > 3 segments | ++ | ++ | − | Only as a subtitle hint |
| L7 Length | `3.7 km stretch` | −− | ++ | + | − | Already in the subtitle |
| L8 Passes count | `7 passes` | −− | − changes after imports | + | facts, not identity | Already a chip in the dialog header |
| L9 User rename (later) | free text | user's call | needs a durable segment id across sessions | truncates | ++ | Does not fit coverage chunks (Q1 (a)); belongs to fixed segments (Q1 (b)/(c)) |

## 4. Shortlists

### Q11/Q20 mini chart (each sketch: one pass card's trailing slot, 88 px chart + value column)

**A. Time gap to best, all sports, identity colours (recommended)** (M1 + K1)

```
[icon] Morning Run            ‾‾‾‾\__ ┄┄┄┄   12:41
       12 Mar · 8.2 km · 41m     \___         +0:23
```
Dashed zero line = best; line falls below where this pass lost time. Best card: flat line on zero, value `Best`. Sport-neutral, always present, smooth at 56 px.

**B. Pace (run) / speed (ride), identity colours** (M2/M3 + K1)

```
[icon] Morning Run            /\/‾\_/\/‾      12:41
       12 Mar · 8.2 km · 41m                  +0:23
```
Familiar units; needs a smoothing window (e.g. 100 m) and stop clipping; shared y-range so heights compare.

**C. Time gap default + metric switch in the dialog header** (M1 default, `Gap · Pace|Speed · HR`, K1)

```
Segment 2 · 7 passes          [Gap|Pace|HR]
[icon] Morning Run            ‾‾‾\___         12:41
[icon] Evening Run            --              13:02   (no HR in this pass)
```

**D. Pace/speed line + elevation once in the header** (M2/M3 + M9, K2 metric token)

```
Segment 2 · 1.4–5.1 km   ▁▂▄▆█▆▃  (elevation, once)
[icon] Morning Run            /\/‾\_/\/       12:41
```

### Q10 segment label (title in the dialog / stepper pill `‹ label ›` 104 px)

**1. Number, km range as subtitle (recommended)** (L2 title + L1 subtitle)

```
Dialog:  Segment 2                       ✕
         1.4–5.1 km · 3.7 km · +86 m
Pill:    ‹ Segment 2 ›
```

**2. Typed by elevation + ordinal, km range as subtitle** (L3)

```
Dialog:  Climb 1 / Anstieg 1             ✕
         1.4–5.1 km · 3.7 km · +86 m
Pill:    ‹ Climb 1 ›   ‹ Flat 2 ›   ‹ Anstieg 1 ›
```

**3. Number in the pill, number + km range in the dialog title** (L1 as today)

```
Dialog:  Segment 2 · 1.4–5.1 km          ✕
Pill:    ‹ Segment 2 ›
```

**4. Number + type chip** (L2 + L3 as a chip, not in the name)

```
Dialog:  Segment 2  [Climb]              ✕
         1.4–5.1 km · +86 m
Pill:    ‹ Segment 2 ›
```

## 5. Open questions

- **Q11 metric**: (a) **time gap to best for all sports (recommended)**: needs only distance + time, so no pass shows `--`, and it is the metric Strava's comparison draws; (b) pace for runs, speed for rides; (c) (a) by default plus a metric switch in the dialog header; (d) pace/speed per card plus the elevation profile once in the header.
- **Q11b reference for the gap**: (a) **gap to the best pass (recommended)**, matching the `+0:23` text; (b) gap to this session's pass (the open session leads, Q8), so this session's card is the flat line.
- **Q20 colour**: (a) **identity colours: this session sport colour, best neutral white, others tertiary grey (recommended)**, recorded as an exception, same encoding as the scatter dots; (b) metric token per chart (needs a new `chartTimeGap` token if Q11 = time gap, since `chartGap` is grade-adjusted pace); (c) metric token, only this session's card in the sport colour.
- **Q10 label**: (a) **`Segment n` as name, km range and length in the subtitle (recommended)**: unique, stable, fits the 104 px pill in EN and DE; (b) typed by elevation (`Climb 1` / `Anstieg 1`, `Flat 2` / `Flach 2`) like the efforts labels, falling back to `Segment n` without elevation; (c) `Segment n · 1.4–5.1 km` in the dialog title; (d) `Segment n` + a type chip.
- **Q10b numbering order**: (a) **along the open session's route (recommended)**, so number and km range rise together; (b) by passes count.

## Sources

- [C1] Strava, Effort Comparison: https://support.strava.com/hc/en-us/articles/216918567-Effort-Comparison
- [C2] Strava, My Segment Results: https://support.strava.com/hc/en-us/articles/216917447-My-Segment-Results
- [C3] Strava, Matched Runs: https://support.strava.com/hc/en-us/articles/216918597-Matched-Runs
- [C4] Strava, Grade Adjusted Pace: https://support.strava.com/hc/en-us/articles/216917067-Grade-Adjusted-Pace-GAP
- [C5] Garmin, Connect 3.7 release (chart overlays): https://www.garmin.com/en-US/blog/general/connect-3-7-release/
- [C6] Garmin forum, compare two items feature: https://forums.garmin.com/apps-software/mobile-apps-web/f/garmin-connect-web/39308/compare-two-items-feature
- [C7] Garmin forum, segment analysis tool request: https://forums.garmin.com/apps-software/mobile-apps-web/f/garmin-connect-web/60743/segment-analysis-tool-request
- [C8] intervals.icu, Compare Activities: https://www.intervals.icu/features/compare-activities/
- [C9] intervals.icu forum, Activity Compare Page: https://forum.intervals.icu/t/activity-compare-page/68311
- [C10] GoldenCheetah 3.1 release notes (compare mode): https://www.goldencheetah.org/RELEASE/release-notes_3.1.0.html
- [C11] Runalyze, Recurring routes: https://runalyze.com/help/article/recurring-routes
- [C12] Strava, Creating Segments: https://support.strava.com/hc/en-us/articles/216918167-Creating-Segments
- [C13] Strava, segment creation guidance: https://support.strava.com/en-us/articles/15401997-how-do-i-create-good-segments-on-strava
- [C14] Garmin, Using ClimbPro: https://www.garmin.com/en-GB/blog/using-climbpro-to-improve-your-climbing/
- [C15] DC Rainmaker, Hammerhead Climber: https://dcrainmaker.com/2021/06/hammerhead-climber-feature.html
- [C16] komoot help, Highlights: https://www.komoot.com/help/highlights
- [S11], [S12], [S13], [S14]: see `segment-ui.md`.
