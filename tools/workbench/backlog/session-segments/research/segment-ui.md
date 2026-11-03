# Segment mode UI: research

Scope: the map control that enters segments mode, the deferred detection state, segments on the map and in a list, and the segment content (trend, effort comparison, rank). Fixed vs dynamic segments is researched separately; where a choice here depends on it, it is marked **[depends: fixed/dynamic]**.

## Current state that shapes the options

- Desktop: the map fills the screen, the content panel is the right 40 dvw (`apps/web/src/components/layout/AppLayout.tsx:48`); the pill bar is centred over the map part (`apps/web/src/components/mapBackground/MapControlsBar.tsx:26-35`). At 1512 px that is roughly a 600 px panel and a 900 px map.
- Phone: pills sit above the bottom sheet in a horizontal scroller (`apps/web/src/components/mapBackground/MapControlsBar.tsx:37-48`). Three pills already; a fourth scrolls at 390 px unless others shrink.
- Lap precedent: selecting a lap swaps the Laps pill into a stepper `Flag ‹ Lap 3 ›  ✕` (`apps/web/src/components/sessions/session/LapsControl.tsx:28-37`) and collapses the map-view pill to an icon (`apps/web/src/components/sessions/session/MapViewControl.tsx:29-36`). On the map the lap is drawn as a white casing plus the track colour on top (`apps/web/src/components/mapBackground/hooks/useLapLayers.ts:10-11`, `apps/web/src/components/mapBackground/hooks/useLapLayers.ts:81-110`). A segment highlight can reuse exactly this: white is allowed on the map, blue (Strava's highlight colour) is not.
- Lap sources are a closed list `off | device | splits | efforts` (`apps/web/src/lib/analysis/laps.ts:561`). "Efforts" is already a lap source name, so "segment effort" collides in wording (open question Q5).
- Charts: recharts is in the app; the kit has `PvSegmentedControl`, `PvChip`, `PvDataTable`, `PvList`, `PvCollapsibleListItem`, `PvInlineSkeleton`, `PvValueSkeleton`, `PvBanner`, `PvTabs`, `PvStatTile`.

## 1. Comparable products

| Product | What it does with segments / repeats | Source |
| --- | --- | --- |
| Strava web, activity page | Segment list sits **beneath the map** in the activity page; hover highlights the segment on the map **in blue** and shades the elevation profile; hidden efforts behind "Show Hidden Efforts"; a detail panel opens **inside the list** with a Top 10 and "Analyze effort". Hover is subscriber-only. | [S1] |
| Strava web, analysis view | Segment **bars stacked between the elevation profile and lap bars**; click opens the effort analysis; selection is highlighted on the map, distance / elevation / grade / time shown under the profile. Stacked bars are how Strava shows overlapping segments on one axis. | [S1] |
| Strava mobile | Tapping the map opens a full-screen map **with a list of matched segments**; tapping a row opens the segment effort page. | [S2] |
| Strava "My Results" | All own efforts on a segment as a **scatter: x = date, y = time**; PR as a gold dot; when opened from an activity, that activity's effort is marked with a red line; scrubbing shows metrics along the segment. | [S3] |
| Strava Effort Comparison | From the segment detail panel, "Compare": two efforts (default: you vs. record holder, or latest vs. PR); roster edited from the leaderboard with + / ✕. Press reports 2 for free, up to 5 for subscribers (unverified on Strava's own pages). | [S4], [S5] |
| Strava Matched Activities | Whole-route repeats (start, end, direction, distance). A **bar on the activity page that appears only when matches exist**; opens a trend chart (dots per activity + trend line of speed over time), list grouped by year; fastest dot yellow, current activity orange; hover/scroll on list highlights the dot. Near-misses can form a second cluster. | [S6] |
| Garmin Connect | Segments work like Strava's; activity → "View Segments" → segment → full leaderboard, filter to own results. Users report results **taking days to appear** (server processing), i.e. a deferred state exists but is invisible. Forum sources, mostly old. | [S7], [S8] |
| intervals.icu | No native segment comparison; Strava segments shown on non-Strava activities (supporters). Workaround: create an interval per activity and compare on interval search. "Routes" beta matches **whole activities** (distance within 2 % / 200 m, start/end ~100 m, reverse = new route) and shows a route tab. | [S9], [S10], [S11] |
| Komoot | "Highlights" are community points or segments on the planning map, rated, not timed; no effort history. Relevant only as a map-marker pattern. | [S12] |
| COROS / Wahoo | Consume Strava Live Segments on the device; COROS shows results in the activity summary as preliminary until Strava finalises. No own history or comparison UI found. | [S13], [S14] |

Takeaways for PaceVault:

- Every product puts the **segment list next to (below) the map**, not in a map popover; the map only highlights.
- Trend = **date on x, time (or pace) on y, best marked, current marked** (Strava My Results, Matched Activities). This matches the data here.
- Comparison = **pick 2 (up to ~5) efforts from a list** with add/remove; default pair "this vs. best".
- Overlap on one axis = **stacked bars** (Strava analysis view).
- "Feature appears only when something matched" (Matched Activities bar) is the closest analogue to deferred detection; nobody shows live progress, Garmin hides the delay entirely.
- PaceVault's v1 (overlap with any other session, partial) sits between Strava segments (fixed, partial) and Matched Activities / intervals.icu routes (whole-activity). No product found that streams overlaps in on demand.

## 2. Patterns

Scale per criterion: ++ good, + fine, − weak, −− poor. "Data" means the data needed exists in v1 (records per session, laps, weather per hour, overlaps once detected).

### (a) Mode switch

| Pattern | Data | 390 px | Vertical | Glance | Effort | Risks |
| --- | --- | --- | --- | --- | --- | --- |
| a1 New toggle pill `Segments` beside Laps (pressed state, no popover) | ++ | − fourth pill scrolls unless others collapse | ++ | + | ++ | Pressed vs. open-popover look must differ from the other pills |
| a2 `PvSegmentedControl` `Session · Segments` as the first item of the bar | ++ | − widest option (≈170 px DE "Sitzung · Segmente") | ++ | ++ states the mode | + | Reads as a second "view" next to 2D/3D; competes with Map view pill |
| a3 Third option in the Map view popover (2D / 3D / Segments) | ++ | ++ no new pill | ++ | − hidden one tap deep | ++ | Mixes camera and content; segments in 3D then undefined |
| a4 Fifth lap source `segments` in the Laps popover | + laps are contiguous, segments may overlap or have gaps | ++ | ++ | − | + reuses stepper, strip, highlight | Overlapping / nested segments break the band model (`apps/web/src/lib/analysis/laps.ts:561`) **[depends: fixed/dynamic]** |
| a5 Panel tab `Overview · Segments` (no map control) | ++ | ++ | − tab row costs ≈40 px | + | + | Contradicts the idea (control at the map); on phone the tab is in the sheet, away from the map |

Mode-dependent pills: in segments mode Color-by and Laps have no obvious meaning. Options: hide them (frees room at 390 px, but "same action, same place" says secondary actions shrink, not vanish), keep them working on the whole track, or collapse them to icons like Map view does when a lap is selected.

### (b) Deferred detection

| Pattern | Data | 390 px | Glance | Effort | Risks |
| --- | --- | --- | --- | --- | --- |
| b1 Spinner inside the mode pill, label `Finding…` → `4 segments` | ++ | ++ | + | ++ | Nothing to read while it runs |
| b2 Skeleton rows in the list (`PvInlineSkeleton`), real rows replace them | ++ | + | + | + | Skeleton count is a guess; jumps when 0 found |
| b3 Streaming: rows append as each overlap is found, footer `Checked 120 of 340 sessions` | + needs detection to report progress per session | + | ++ honest | − | List reorders under the cursor if sorted by distance; sort by position along the track to keep it stable |
| b4 Map-first: segments appear on the map as found, list fills afterwards | + | ++ | ++ | − | Camera must not refit on every hit |
| b5 0 found: one line of fact in place of the list (`No other session overlaps this one.` / `Keine andere Einheit überschneidet sich mit dieser.`), mode stays on, pill shows `0` | ++ | ++ | ++ | ++ | Must distinguish "none found" from "no other sessions with GPS" and from "this session has no GPS" (NoGpsBanner already covers the last) |
| b6 Cache: second entry is instant, a small `Updated` date in the list header | needs persisted results | ++ | + | − | Stale when sessions are imported later; invalidation rule needed |

0-is-data applies: a found count of `0` is shown as `0`, a count still unknown is `--` or the spinner, never `0`.

### (c) Segments on the map

| Pattern | Data | 390 px | Glance | Effort | Risks |
| --- | --- | --- | --- | --- | --- |
| c1 Lap-style highlight for the selected segment only (white casing + track colour), rest of the track dimmed | ++ | ++ | + | ++ reuses `useLapLayers` | No overview of all segments at once |
| c2 All segments drawn with a thin white casing, selected one thick; numbered badges at each start (`1`, `2`…) in list order | ++ | − badges collide when zoomed out | ++ | + | Overlapping segments stack badges; needs offset or cluster |
| c3 Coverage ramp: track coloured by how many other sessions overlap here (1, 2–3, 4+), warm single-hue ramp; click a stretch to select its segment | ++ count per point is a by-product of detection | ++ no badges | ++ shows "where do I repeat" | − new colour mode, legend | Replaces sport colour like zone colours do (allowed, `apps/web/CLAUDE.md` §3); needs care to stay off blue/grey |
| c4 Start/finish flags only (Komoot-like markers), path not re-styled | ++ | + | − | ++ | Does not show extent |
| c5 Other sessions' tracks of the selected segment drawn faintly | + records of other sessions must load | + | + shows line choice | − | Clutter; same geometry mostly, little gain |

Overlapping segments **[depends: fixed/dynamic]**: with fixed segments, overlaps are rare and c2 works; with dynamic overlaps per other session, nested ranges are the norm (A 2–8 km, B 3–5 km) and c3 or the stacked bars of (d) handle them better than badges.

### (d) Segment list

| Pattern | Data | 390 px | Vertical | Glance | Effort | Risks |
| --- | --- | --- | --- | --- | --- | --- |
| d1 Rows in the panel (Strava web): number, distance, efforts count, this effort's time, rank `2 / 7`, best marker | ++ | + 4 columns max | − one row ≈48 px | ++ | + `PvList` | Long lists push detail below the fold at 860 px |
| d2 Stacked bars along the session distance (Strava analysis view), one bar per segment, under a thin elevation line | ++ | + bars shrink with width | ++ ≈60–90 px for all | ++ shows position and overlap | − new component | Tap targets for short segments at 390 px |
| d3 Picker popover from the pill (like `LapsPicker`) + stepper in the bar | ++ | ++ | ++ panel untouched | − list hidden | ++ | Only one segment visible at a time |
| d4 Collapsible rows (`PvCollapsibleListItem`): row expands into its content in place | ++ | + | − nested scroll | + | + | Trend chart inside a row gets narrow |

### (e) Segment content

| Pattern | Data | 390 px | Vertical | Glance | Effort | Risks |
| --- | --- | --- | --- | --- | --- | --- |
| e1 Trend scatter: x date, y time or pace; best marked, this effort marked; optional trend line (Strava My Results / Matched) | ++ | ++ | ≈160–200 px | ++ | + recharts | With 2–3 efforts a trend line misleads; show dots only below a threshold |
| e2 Rank line: `2nd of 7 · best 4:12 (12 Mar 2026) · +0:09` | ++ | ++ | ≈24 px | ++ | ++ | Rank meaning for dynamic segments: efforts cover different lengths **[depends: fixed/dynamic]** |
| e3 Efforts table: date, duration, pace/speed, HR, power, cadence, elevation gain, weather icon; sortable; checkbox per row | ++ | − 3 columns visible, rest scrolls horizontally or moves into a row detail | − | + | + `PvDataTable` | `--` for missing HR/power/cadence must stay aligned |
| e4 Compare 2–N: checkboxes in e3, default pre-pick "this + best"; comparison as metric rows side by side + delta | ++ | 2 columns at 390, N only on desktop | + | ++ | + | Cap N (Strava: 2 free / 5 paid, press [S5]); proposal: 2 at 390 px, up to 4 on desktop |
| e5 Compare along the segment: pace / HR line over segment distance per picked effort, overlaid | + needs records of other sessions sliced to the segment | + | ≈180 px | + | − | Distances differ per effort; x must be normalised **[depends: fixed/dynamic]** |
| e6 Weather context: temperature / wind per effort from the hourly weather | + only where weather was fetched | + | small | − | + | Missing weather → `--` |
| e7 Time gap chart (ahead/behind best along the segment) | + same as e5 | + | ≈120 px | ++ for racing-minded users | − | Same normalisation issue |

Height budget at 1512×860, desktop panel: page top padding + peek + header + map-related banners leave roughly 600–650 px; e2 + e1 (180) + e3 with ~6 rows (≈300) fits; adding e5 below needs either a tab or a selection-driven swap (table → compare).

## 3. Shortlist

Six whole-flow variants. Sketches show the state "mode on, detection done, segment 2 selected" unless noted. Desktop = map left 60 dvw, panel right 40 dvw; 390 px = map above, sheet below, pills above the sheet.

### V1 List-in-panel (Strava web model)

a1 toggle pill · b1 + b3 streaming rows · c2 all segments cased + numbered, selected thick · d1 rows · e2 + e1 + e3/e4 in a detail view that replaces the list (back arrow).

```
Desktop                                         | panel 40dvw
+---------------------------------------------+ +--------------------------------+
|        map                                   | | ← Segments            Segment 2 |
|     ①━━━━━                                   | | 2.4 km · 7 efforts              |
|            ②━━━━━━━━ (thick, white casing)   | | 2nd of 7 · best 9:41 · +0:12    |
|                    ③━━                       | | ┌ trend (date × time) ───────┐ |
|                                              | | │   •  •   ●best  •  ◆this    │ |
| [Globe 2D v] [Color v] [Flag Laps v] [▣ Segm 3] | └────────────────────────────┘ |
+---------------------------------------------+ | ☑ 12 Oct  9:53  4:07/km 152 bpm |
                                                 | ☑  3 Mar  9:41  4:02/km 158 bpm |
                                                 | ☐ ...            [Compare 2]    |
                                                 +--------------------------------+
390 px
+----------------------+
|  map  ①━━ ②━━━━ ③━   |
|[Globe][Color][Flag][▣ Segm 3] ← scrolls
+----------------------+
| ← Segments  Segment 2|
| 2nd of 7 · +0:12     |
| trend ·  • ● • ◆     |
| 12 Oct 9:53 4:07  ☑  |
|  3 Mar 9:41 4:02  ☑  |
+----------------------+
```
Rationale: the pattern every product uses (list beside the map, map only highlights); most room for content.

### V2 Stepper (laps model)

a1 pill → on select it turns into `▣ ‹ Segment 2/5 › ✕` like `LapStepper` · b1 · c1 lap-style highlight only · d3 picker popover · e2 + e1 + e4 as one card at the top of the panel; SessionOverview stays below it.

```
Desktop
+---------------------------------------------+ +--------------------------------+
|        map (rest of track dimmed)            | | Segment 2 · 2.4 km · 7 efforts  |
|            ━━━━━━━━ (white casing)           | | 2nd of 7 · best 9:41 · +0:12    |
|                                              | | trend  • • ● • ◆               |
| [Globe] [Color v] [▣ ‹ Segment 2/5 › ✕]     | | [This] vs [Best ▾]  Δ rows      |
+---------------------------------------------+ | ── Session summary (unchanged) ─|
390 px
+----------------------+
| map  ━━━━━━          |
|[Globe][▣ ‹ Seg 2/5 › ✕]
+----------------------+
| Segment 2 · 2nd of 7 |
| trend • ● ◆          |
| This 9:53 | Best 9:41|
+----------------------+
```
Rationale: reuses the lap stepper, lap highlight and pill-collapse rules users already know; smallest new surface.

### V3 Segmented mode switch, panel follows the mode

a2 `Session · Segments` first in the bar; in segments mode Color-by and Laps collapse to icons · b2 skeleton rows · c2 · d2 stacked bars on the session distance at the top of the panel, d1 rows below · e content opens in a bottom section on selection.

```
Desktop
+---------------------------------------------+ +--------------------------------+
|        map ①━━ ②━━━━━ ③━                    | | 0 km ──────────────────── 14 km |
|                                              | |   ▬▬①▬▬                         |
|                                              | |        ▬▬▬▬②▬▬▬▬               |
| [Session|Segments] [Globe] [◐] [⚑]          | |                 ▬③▬            |
+---------------------------------------------+ | ② 2.4 km · 2nd of 7 · trend …   |
390 px
+----------------------+
| map                  |
|[Session|Segments][◐][⚑]
+----------------------+
| ▬①▬  ▬▬②▬▬  ▬③      |
| ② 2nd of 7 · +0:12   |
| trend …              |
+----------------------+
```
Rationale: the mode is always readable at a glance; the bar strip shows position and nesting of overlapping segments in ≈80 px.

### V4 Coverage ramp (map-first, for dynamic overlaps)

a1 pill · b4 map fills while detection runs, pill shows `Checked 120/340` · c3 track coloured by overlap count (warm ramp), click a stretch · d1 rows grouped by stretch · e as V1.

```
Desktop
+---------------------------------------------+ +--------------------------------+
|  map  ░░░▒▒▒▓▓▓▓▓▒▒░░░  (1 / 2–3 / 4+)       | | Stretch 3.1–5.5 km · 7 sessions |
|        click ▓ → selects stretch             | | 2nd of 7 · trend …              |
| legend: 1  2–3  4+                           | | efforts table …                 |
| [Globe] [Color: Overlap] [⚑] [▣ Segm ⟳ 120/340] +--------------------------------+
390 px
+----------------------+
| map ░▒▓▓▒░  legend   |
|[▣ ⟳ 120/340][Globe]… |
+----------------------+
| Stretch 3.1–5.5 km   |
| 7 sessions · 2nd     |
+----------------------+
```
Rationale: answers "where do I repeat" without badges and handles nested overlaps natively; strongest fit if segments end up dynamic.

### V5 Inline card, no mode (baseline)

No map control; a `Segments` card in SessionOverview with a `Find` button (deferred start on click) · b2 · c1 on hover/select · d1 inside the card · e expands in the card.

```
Desktop panel                       390 px sheet
+--------------------------------+ +----------------------+
| Summary card …                 | | Summary …            |
| ┌ Segments ────────── [Find] ┐ | | Segments     [Find]  |
| │ ② 2.4 km · 7 · 2nd   ›     │ | | ② 2.4 km · 2nd  ›    |
| │ ③ 0.8 km · 3 · 1st   ›     │ | | ③ 0.8 km · 1st  ›    |
| └────────────────────────────┘ | +----------------------+
| Charts explorer …              |
+--------------------------------+
```
Rationale: lowest effort and no pill-bar pressure at 390 px; deviates from the idea (control at the map), kept as a yardstick.

### V6 Matched-first (whole-route trend on top, segments below)

a1 pill · b3 · c2 · Panel top: one "this session vs. sessions that overlap ≥ X %" trend (Strava Matched Activities [S6]), below it d1 segment rows; e as V1 on selection.

```
Desktop panel
+--------------------------------+
| Overlaps 14 sessions           |
| trend of this route  • • ● ◆   |
| ① 1.1 km · 9 efforts · 4th     |
| ② 2.4 km · 7 efforts · 2nd   › |
| ③ 0.8 km · 3 efforts · 1st   › |
+--------------------------------+
390 px: same stack, trend 140 px tall, rows below; map/pills as V1.
```
Rationale: gives a useful answer even when every segment is short; needs a "whole-route match" definition the detection may not have **[depends: fixed/dynamic]**.

### Which to test first

**V2 (Stepper)**: it changes the fewest established patterns (lap stepper, lap highlight, pill collapse), fits 390 px and 1512×860 without new layout, and a mockup of it isolates the two questions that are really new here: the deferred-detection state on a pill and what the segment card must hold. If the card turns out to need the full list, V1 is the next step from the same pieces.

## 4. Open questions for the owner

Q1 **Where does the mode live?**
- a1 own toggle pill `Segments` (V1, V2, V4, V6)
- a2 `Session · Segments` segmented control (V3)
- a3 inside the Map view popover
- a5 panel tab / V5 card, no map control

Q2 **What happens to Color-by and Laps in segments mode?**
- collapse to icons and stay working on the whole track (like Map view when a lap is selected)
- stay as they are (fourth pill scrolls at 390 px)
- hide (frees room; bends "same action, same place")

Q3 **Loading state honesty**
- spinner + count in the pill only (b1)
- streaming rows + `Checked n of N sessions` (b3), needs detection to report progress
- map-first fill (b4)
- and: persist results (b6), or detect again on every entry?

Q4 **Segment content v1 scope**: which of rank line (e2), trend scatter (e1), efforts table (e3), compare picked efforts as metric rows (e4), compare along the segment (e5/e7), weather (e6)? And the cap for compare: 2 at 390 px / up to 4 on desktop, or 2 everywhere?

Q5 **Wording**: `Segments` / `Segmente`, or `Overlaps` / `Überschneidungen` (states what v1 actually finds)? And the per-pass name, since `Efforts` is already a lap source (`apps/web/src/lib/analysis/laps.ts:561`): `Passes` / `Durchgänge`, `Efforts` / `Versuche`, or session date only?

Q6 **Overlapping segments on the map** **[depends: fixed/dynamic]**: numbered badges (c2), coverage ramp (c3), or only the selected one (c1)?

## Sources

- [S1] Strava, Ride Activity Pages: https://support.strava.com/hc/en-us/articles/216919577-Ride-Activity-Pages
- [S2] Strava, Viewing Activities: https://support.strava.com/hc/en-us/articles/216919157-Viewing-Activities
- [S3] Strava, My Segment Results: https://support.strava.com/hc/en-us/articles/216917447-My-Segment-Results
- [S4] Strava, Effort Comparison: https://support.strava.com/hc/en-us/articles/216918567-Effort-Comparison
- [S5] BikeRadar, Strava launches effort comparison tool (2 vs. 5 limit): https://www.bikeradar.com/features/routes-and-rides/strava-launches-effort-comparison-tool
- [S6] Strava, Matched Runs / Matched Activities: https://support.strava.com/hc/en-us/articles/216918597-Matched-Runs
- [S7] Garmin forum, segment leaderboards not populating: https://forums.garmin.com/apps-software/mobile-apps-web/f/garmin-connect-web/77358/segment-leaderboards-not-populating
- [S8] DC Rainmaker, Garmin Connect segments: https://dcrainmaker.com/2015/07/introduce-segments-series.html
- [S9] intervals.icu forum, Compare Segments: https://forum.intervals.icu/t/compare-segments/96258
- [S10] intervals.icu forum, Segments on non-Strava activities: https://forum.intervals.icu/t/segments-on-non-strava-activities/23936
- [S11] intervals.icu forum, Activity routes beta: https://forum.intervals.icu/t/activity-routes-beta-testing-needed/86792
- [S12] komoot, Highlights: https://www.komoot.com/help/highlights
- [S13] COROS, Strava Live Segments: https://coros.com/stravalivesegments
- [S14] Wahoo, Strava Live Segments for ELEMNT: https://support.wahoofitness.com/hc/en-us/articles/23413464042770

Unverified: Garmin's current segment UI (only old forum posts found), Strava's free/paid comparison limits (press only), COROS/Wahoo history views (none found).
