# Research: segment suggestions

Question: how PaceVault can suggest stretches the user rides or runs often, so they can be saved as segments in one step from a primary button under the Segments empty state (`apps/web/src/components/segments/SegmentsEmpty.tsx:7-17`, button pattern `apps/web/src/components/trips/TripsTab.tsx:21-35`). This informs the decision; it does not make it. The mockup is `mockup/index.html` (variants A–D).

## 1. Comparable products

| Product | What it does with frequent stretches | Suggests or automatic? | Source |
| --- | --- | --- | --- |
| **Strava: segment creation** | Segments are created by hand from a finished activity (⋯ menu → Create Segment, pick start and end on the map, name it). Guides recommend at least 500 m for cycling and 300 m for running. Users are told to check first whether a segment already exists there. | Manual | [StravaCreate], [Alphr] |
| **Strava: Segment Explore** | Map view (web: Maps → Segments) lists the most popular segments in the visible area; newer or less popular ones may be missing. Popularity is across all athletes, not the user's own history. | Ranked list, crowd-based | [StravaExplore] |
| **Strava: Matched Activities** | Subscribers get repeat runs/rides on the same route grouped automatically, by start and end points, direction and distance; private, reached from an activity's matched-activities bar, grouped by year. Whole routes only, no sub-stretches. | Automatic, whole route | [StravaMatched] |
| **Garmin Connect** | Segments are created by hand from an activity (Segments section → Create Segment, mark start and finish). No suggestion of frequent stretches found. | Manual | [GarminForum] (forum, **unverified** against official docs) |
| **Komoot Highlights** | Community-made places and segments (name, sport, tip, photos) created from a completed activity or the map; duplicates merge into the oldest. Not frequency-based on the user's own data. | Manual, crowd | [KomootHighlights] |
| **intervals.icu Routes** | "Automatically recognizes your favourite routes" and matches activities to them; activities are named and tagged after the route; routes can be merged. Whole routes, no sections. | Automatic, whole route | [IcuRoutes], [IcuForum] |
| **Veloq** (third-party app on intervals.icu data) | "Automatically generate frequently visited sections to track over time": pieces of the user's own traces that overlap often; also manual sections that live beside the generated ones. Forward and reverse were merged in one section; testers asked for them to be separate. Analysis runs on the phone and "may run slowly on older phones"; it can be switched off. | Automatic sections | [VeloqForum] (developer and testers in a forum thread) |
| **tracematch** (Rust crate behind Veloq, **unverified** link) | "Multi-scale detection of frequently-traveled sections" using an R-tree and consensus averaging of the overlapping traces; a discovery preset and a conservative preset (minimum activity count 4 in one version). | Library | [tracematch] |
| **Runalyze Recurring routes** | Premium; groups whole activities automatically: candidates by distance (≤ 200 m or 4 %), start/end and bounding box, then dynamic time warping. List of routes with ≥ 2 activities, filterable by sport, named after the start location by default; no confirm step. | Automatic, whole route | [Runalyze] |
| **Wandrer, CityStrides** | Count new streets or new distance against OpenStreetMap ways; the opposite of "frequent" (they reward unvisited roads) and need a road graph. Not applicable. | n/a | [CityStridesWiki], [CityStridesForum] |

Takeaways:

- Nobody found **suggests** sub-stretches for the user to accept; products either make the user cut segments by hand (Strava, Garmin, Komoot) or create groups silently (Strava Matched, intervals.icu, Runalyze, Veloq). PaceVault's "suggest, the user accepts" sits between both and avoids the failure the automatic path had here: 1432 overlapping segments on real data (`tools/workbench/backlog/session-segments/plan.md`, Context).
- Whole-route grouping is the common automatic feature; sections are rare (Veloq) and reported as noisy (false positives, merged directions).
- Strava's minimum lengths (≥ 300 m running, ≥ 500 m cycling) and "check whether one exists" match the dedupe and minimum rules below.

## 2. Detection

### 2.1 What exists to reuse

- **Earlier detector** (`research/detect-bench/detection.snapshot.ts`, moved here from `session-segments`): per sport, tracks sorted newest first; each track is a *lead*; its stretch is corridor-matched against all other tracks via a 50 m grid (`:134`), 10 m resampling (`:125`), 30 m corridor (`:126`), 50 m end tolerance (`:127`), ≥ 2 passes (`:141`); anchors at sharp turns cut candidates; duplicates are dropped by cell overlap (`:133`, `:138`). Entry point `segmentDetectionResult` (`:1019-1044`), per-lead loop `leadCandidates` (`:917-946`).
- **Measured now** (this research, `detect.bench.ts` on the generated demo data, 174 sessions, Apple M5, Node): running 128 tracks / 141k resampled points → 24 segments in **550 ms** (corridor match 517 ms); cycling 46 tracks / 257k points → 11 segments in **697 ms** (corridor match 641 ms). Caveat: the demo replays the same polylines, so 104 of 128 running leads were skipped as "already a route"; on real histories almost every lead runs. At the measured ~1.6 ms per corridor match and ~14 matches per lead, 400 processed leads come to **~9 s on desktop**, ~30–45 s on a phone (× 3–5 as in `matching-metrics.md`). Plus the record reads: ~4 ms per session (`research/matching-metrics.md`, §1), ~1.6 s for 400 sessions on desktop.
- **On real data it produced 1432 overlapping segments** (session-segments Context): the per-lead approach finds the same stretch once per lead with shifted cuts (Q58 there: 2453 m vs 1952 m), and the dedupe could not tame it.
- **User-segment matcher** (`packages/engine/src/segments.ts:571-579` tolerances, `apps/web/src/lib/analysis/segmentMatching.ts`, worker `apps/web/src/lib/workers/segments.worker.ts`): computes the real passes once a segment is saved. Suggestions do not need to replace it; they only need a good reference stretch.
- **Similar-segment rule** (`apps/web/src/components/segments/segmentCreation.ts:111`): same sport, both ends within the matcher's end tolerance, length within 10 % (`:21`). Reusable as the dedupe against existing segments.
- **Stored per session**: one simplified polyline (Douglas-Peucker, `SIMPLIFY_TOLERANCE_DEGREES = 0.00005` ≈ 3.6–5.6 m, `apps/web/src/lib/analysis/gpsTrack.ts:12`) plus bounds, all loaded in one call (`getAllSessionGPS`, `apps/web/src/lib/storage/db.ts:176`).

### 2.2 Recommended approach: coverage counting on the stored polylines

Suggestions only need *where* a frequent stretch is and roughly *how often* it was passed; exact pass times come from the existing matcher after saving. That allows working on the polylines alone, with no record reads.

1. **Input.** Per sport, decode every polyline, resample every 10 m, project to a local plane (as the snapshot does). Direction per point from the bearing of ±2 samples.
2. **Index.** A 25 m grid; each cell stores which sessions pass it and in which direction bucket (8 × 45°), as bitsets over the session list (400 sessions = 13 words of 32 bits).
3. **Coverage per point.** For each resampled point of each track: the number of *distinct other sessions* in the 3 × 3 neighbourhood with a matching direction bucket (and its neighbours, to tolerate jitter). Reverse direction is counted separately. This is the coverage profile from `research/overlap-detection.md` §2.6, but over all tracks at once instead of per open session.
4. **Runs.** Along each track, join points with coverage ≥ *k* (minimum passes, e.g. 3) into runs, bridging gaps up to ~100 m; keep runs ≥ the minimum length (300 m running, 1 km cycling, Strava-like). Cut a run where coverage drops sharply (a junction where most traffic leaves), so a stretch is "the same people all the way" (segment-model option C).
5. **One candidate per stretch.** Every session on a stretch produces the same run with slightly shifted ends. Cluster runs whose ends lie within the end tolerance and whose length differs ≤ 10 % (the similar-segment rule), keep the newest session's run as the reference (it becomes the segment's source, as a chart-range save would).
6. **No overlaps.** Greedy by score: accept the best candidate, drop any later one that shares ≥ 80 % of its cells with an accepted one (`OVERLAP_SHARE_RATIO`, snapshot `:138`). Nested stretches (a 1 km climb inside a 6 km loop) survive only if they differ enough; Q10.
7. **Dedupe against existing segments.** Drop a candidate that the similar-segment rule matches, or that shares ≥ 80 % of cells with a saved segment of the same sport and direction. Previously dismissed candidates are dropped the same way (Q6).

Clean start and end points:

- Start where coverage first reaches *k* and stays there for ≥ 3 samples, end where it last holds; then move each end ~20 m inward so every counted pass crosses both gates of the matcher (end tolerance 50–200 m, `packages/engine/src/segments.ts:571-579`).
- Prefer ends at a turn anchor within ±50 m (the snapshot's turn detection) so a segment starts at a corner rather than mid-street.
- Session starts and ends: the most frequent stretch is often the street from home. Options in Q9 (rank down, cut the first/last ~300 m of each session, or treat as normal).

Ranking (Q8): score = passes in the last 12 months × a length factor (log of length, so a 10 km stretch does not drown out a 1 km one) × recency (the last pass within 90 days counts full, older decays). Ties: newer last pass first. The list shows the top 15 per run; the rest behind "Show more" or not at all.

### 2.3 Runtime estimate (400 sessions, ~10 km each)

All **estimates** built on the bench and metrics above; to measure on the owner's export with the bench once a prototype exists.

| Step | Work | Desktop | Phone (× 3–5) |
| --- | --- | --- | --- |
| Load polylines (`getAllSessionGPS`) | 400 rows | 10–50 ms | 50–200 ms |
| Decode + resample + project | ~400k points (bench: 141k + 257k for 174 sessions took 89 ms incl. records → points) | 100–200 ms | 0.3–1 s |
| Grid bitsets | 400k inserts | 30–80 ms | 0.1–0.4 s |
| Coverage per point | 400k × 9 cells × 13 words | 100–300 ms | 0.3–1.5 s |
| Runs, clustering, overlap, dedupe | thousands of runs | 20–100 ms | 0.1–0.5 s |
| **Total** | | **~0.3–0.7 s** | **~1–4 s** |

Compare: the earlier per-lead detector at ~9 s desktop plus ~1.6 s of record reads. Saving *n* accepted suggestions then runs the existing matcher once per segment, 55–700 ms each cold on desktop (`matching-metrics.md` §1); saving 5 at once ≈ 1–3 s desktop, longer on a phone, shown on each segment page as "Finding passes" as today.

Accuracy trade-off (Q11): the polylines are simplified to ~5 m, well inside the 30 m corridor, so geometry is fine; but they carry no timestamps, so the suggestion's pass count is an estimate that the matcher may correct after saving (e.g. 14 suggested, 12 real passes when two sessions miss an end gate). Reading records instead makes counts exact and costs ~1.6 s desktop / 5–8 s phone more, plus the memory risk noted in `matching-metrics.md` §2.

### 2.4 What runs when

| Option | Pros | Cons |
| --- | --- | --- |
| **On button press, with progress** ("Checked 212 of 547 sessions") | No cost until asked; simplest; matches the settled entry point | 1–4 s wait on a phone each time unless cached |
| **On press, cached** (React Query, key = algorithm version + sessions key + segment ids, `staleTime: Infinity` like `useSegmentPasses`, `apps/web/src/queries/segments/useSegmentPasses.ts:102-110`) | Second open is instant; new imports invalidate | Cache invalidation when a segment is saved or a suggestion dismissed (cheap: filter, no re-run) |
| **Background after import**, cached; the button shows the count ("Review 15 suggestions") | Zero wait; the count itself is the nudge | Work nobody asked for on every import; a worker running during import on a phone |

Recommendation for a first version: on press, cached, with a progress line; background only if the wait turns out to bother (Q2).

## 3. UI patterns

| Pattern | Phone fit (390 px) | Effort | Glanceability | Risks |
| --- | --- | --- | --- | --- |
| **Dialog list with map thumbnails** (checkboxes, "Save n segments") | Good: `PvDialog` becomes a bottom sheet; the list scrolls inside | Low–medium: dialog + row + thumbnail SVG | Medium: thumbnails show shape, not place; the real map is behind the scrim | Batch accept without looking; names auto-filled; thumbnails need their own projection |
| **Map-first review** (all suggestions on the map with numbered markers, list in the column) | Medium: map is 430 px tall, markers crowd at home; the sheet list works | Medium: markers + hover link row ↔ track (hover exists via `useMapHover`) | High: "where is that" answered at once | 15 overlapping tracks near home get busy; markers need collision handling |
| **One by one cards** (Skip / Save, name field) | Good: one card fits the sheet | Low: one card + map highlight | Low for the set, high per item | Slow with 15; the user may stop half-way (needs "resume" or dismissed state) |
| **Inline list in the tab** (dashed suggestion rows under the empty card / the segment list) | Good: same list as segments | Lowest: reuses the column, no mode | Medium; hover shows on map (desktop only; tap on phone) | Mixes saved and suggested items; needs a clear visual difference and a cap |

Flow, common to all:

- **Accept.** Saving creates a segment from the reference run (newest session, step 5) through the same path as "Use as reference segment" / chart save (`apps/web/src/components/segments/segmentCreation.ts`), so passes are found by the existing matcher. Name prefill options: the source session's name + km range, the existing pattern (`apps/web/src/microcopy/segments.ts:24-37`, "Evening Run · km 0.6–3.0"), or empty (Q4).
- **Edit ends.** Not in the first version (recommendation): the user renames later and can still cut a precise segment from the chart. Alternatives in Q5.
- **Dismiss.** Removes the suggestion from this list; whether it stays dismissed across runs is Q6 (needs a small persisted list of dismissed stretches, matched like existing segments).
- **States.** Running: a progress line "Checked n of N sessions" with a bar (no kit progress bar yet) and skeleton rows; none found: "No stretch has 3 or more passes yet" with the number of sessions checked; many found: top 15 sorted by score, rest behind "Show n more".

## 4. Shortlist

All four are in `mockup/index.html`; the scenarios cover empty state, finding, 15 found, 2 found, none found and segments existing (button placement extra), the extra *Detection runs: In background* shows option E's button.

**A · Review dialog**: batch accept in one place, the cheapest way to save many at once.

```text
Desktop                                   Phone 390
┌──────map──────┬─────── column ───────┐  ┌──── map ────┐
│   (scrim)     │ ┌Suggested segments×┐│  │ ┌─────────────┐
│ ┌───────────────────────────────┐   ││  │ │Suggested  × │
│ │☐ Select all                   │   ││  │ │☐ Select all │
│ │☐ [~] 2.4 km · +8 m            │   ││  │ │☐[~]2.4 km   │
│ │      41 passes · last 4 Nov   │   ││  │ │   41 passes │
│ │☐ [/] 12.4 km · +86 m          │   ││  │ │☐[/]12.4 km  │
│ │ …                             │   ││  │ │ …           │
│ │ names from session  Cancel [Save 3]│  │ │Cancel [Save]│
│ └───────────────────────────────┘   ││  └─┴─────────────┘
```

**B · Map review**: every suggestion on the map with a number, the list beside it; best answer to "where is that?".

```text
Desktop                                   Phone 390
┌──────── map ──────────┬── column ────┐  ┌──── map ─────┐
│   ①━━━━②              │ Suggestions  │  │ ①━━②  ③      │
│    ┃     ③━━━         │ 15 stretches │  │   ┃ ④        │
│   ④     ⑤             │ ① 2.4 km [Save][×]├──── sheet ───┤
│                       │ ② 12.4 km [Save][×]│ ① 2.4 km [Save]│
│                       │ …            │  │ ② 12.4 km …  │
└───────────────────────┴──────────────┘  └── dock ──────┘
```

**C · One by one**: a card per suggestion with the name field; the most deliberate, every segment gets a chosen name.

```text
Desktop                                   Phone 390
┌──────── map ──────────┬── column ─────────┐  ┌── map: current lit ─┐
│   (current stretch    │ SUGGESTION 1 OF 15│  ├────── sheet ────────┤
│    lit, others dim)   │ [~] 2.4 km · +8 m │  │ SUGGESTION 1 OF 15  │
│                       │ Name [Evening Run…]│ │ Name [Evening Run…] │
│                       │      [Skip][Save] │  │       [Skip][Save]  │
└───────────────────────┴───────────────────┘  └─────────────────────┘
```

**D · Inline in the tab**: suggestions as dashed rows in the Segments column, top 5 + "Show 10 more"; no new mode or dialog.

```text
Desktop                                   Phone 390
┌──────── map ──────────┬── column ──────────┐  ┌──── map ─────┐
│  (hovered stretch     │ No segments yet    │  ├──── sheet ───┤
│   lit with casing)    │ SUGGESTIONS 15 found│ │ No segments  │
│                       │ ┆[~] 2.4 km [Save][×]┆│ SUGGESTIONS  │
│                       │ ┆[/] 12.4 km [Save][×]│ ┆2.4 km [Save]┆│
│                       │   Show 10 more     │  │  …           │
└───────────────────────┴────────────────────┘  └──────────────┘
```

**E · Background + count** (orthogonal, combines with any of A–D): detection runs after each import, the button reads "Review 15 suggestions".

```text
│ No segments yet                     │
│ [ Review 15 suggestions ]           │
```

**Test first: D**, then B. D adds the least UI (rows in an existing virtual list, no mode, no dialog), keeps the map visible for hover, and works the same once segments exist (suggestions below the user's segments), so it also answers the button-placement question. If the owner finds that suggestions need their place on the map to be judged, B is the step up with the same rows plus markers. A is quickest for "save them all" but hides the map; C is good for 2–3 suggestions, tedious for 15.

## 5. Open questions for the owner

Each also a Q badge in the mockup (`decisions[]`).

- **Q1** How suggestions are presented: (a) review dialog with thumbnails (A); (b) map review with numbered markers (B); (c) one by one (C); (d) inline rows in the tab (D). Recommendation: try D first, then B.
- **Q2** When detection runs: (a) on button press with progress, cached until sessions or segments change; (b) on press, never cached; (c) in the background after each import, the button shows the count (E). Recommendation: (a).
- **Q3** The button once segments exist: (a) stays below the list, like "Create a trip"; (b) smaller secondary button above the list; (c) only in the empty state; (d) suggestions always shown inline under the segments (with D), no button. Recommendation: (a) for A–C, (d) with D.
- **Q4** Accepting and naming: (a) batch save, names prefilled from the source session + km range ("Evening Run · km 0.6–3.0"), renamed later; (b) one name dialog per save (existing `SegmentNameDialog`); (c) batch save with a neutral name ("Running · 2.4 km"). Recommendation: (a) for a dialog/list, (b) inside C.
- **Q5** Adjusting start and end before saving: (a) no, save as found, cut a precise one from the charts if needed; (b) open the source session's charts with the range preselected; (c) drag handles on the map. Recommendation: (a).
- **Q6** Dismissed suggestions: (a) remembered (a persisted list, matched like segments), never suggested again; (b) only hidden until the next run; (c) remembered, with "Show dismissed" to bring them back. Recommendation: (a).
- **Q7** Direction: (a) each direction is its own suggestion; (b) one suggestion per stretch, the more frequent direction; (c) one suggestion counting both, saved as the more frequent direction. Recommendation: (a), the matcher is direction-bound.
- **Q8** Minimums, ranking and count: (a) ≥ 3 passes, ≥ 300 m running / 1 km cycling, ranked by passes × length × recency, top 15 + show more; (b) the same, but every result listed; (c) only stretches with a pass in the last 12 months. Recommendation: (a).
- **Q9** Stretches at the usual start (home street): (a) treated like any stretch; (b) ranked down; (c) the first and last ~300 m of every session are left out. Recommendation: (b).
- **Q10** Overlapping and nested stretches: (a) no two suggestions share more than 20 % of their length; (b) nested allowed (a climb inside a loop), partial overlaps not; (c) allowed, ranked. Recommendation: (b).
- **Q11** Detect on stored polylines or on full records: (a) polylines only, ~0.3–0.7 s desktop / 1–4 s phone, pass counts approximate until saved; (b) full records, exact counts, + ~1.6 s desktop / 5–8 s phone and memory risk. Recommendation: (a).

## 6. Sources

- [StravaCreate] Business Insider, "How to create a segment on Strava": https://www.businessinsider.in/tech/news/how-to-create-a-segment-on-strava-and-compete-with-others-on-a-particular-route/articleshow/75613937.cms
- [Alphr] Alphr, "How To Create a Segment in Strava": https://www.alphr.com/create-segment-strava/
- [StravaExplore] Strava support, segment explore: https://support.strava.com/hc/en-us/articles/216918147 (summary from search results, page not opened)
- [StravaMatched] Strava support, "Matched Activities": https://support.strava.com/hc/en-us/articles/216918597-Matched-Activities (summary from search results, page not opened)
- [GarminForum] Garmin forums, "How do I create a segment in Garmin Connect": https://forums.garmin.com/apps-software/mobile-apps-web/f/garmin-connect-web/87152/how-do-i-create-a-segment-in-garmin-connect ; "Can't create segments": https://forums.garmin.com/apps-software/mobile-apps-web/f/garmin-connect-web/216883/can-t-create-segments
- [KomootHighlights] komoot help, Highlights: https://www.komoot.com/help/highlights ; https://support.komoot.com/hc/articles/10364710659994 (summary from search results)
- [IcuRoutes] intervals.icu, Routes feature page: https://www.intervals.icu/features/routes/
- [IcuForum] intervals.icu forum, "Activity route matching": https://forum.intervals.icu/t/activity-route-matching/89041
- [VeloqForum] intervals.icu forum, "Veloq: Route and section matching, mapping app": https://forum.intervals.icu/t/veloq-route-and-section-matching-mapping-app/120283
- [tracematch] tracematch README: https://docs.rs/crate/tracematch/0.1.0/source/README.md ; section config: https://docs.rs/tracematch/0.0.9/src/tracematch/sections/mod.rs.html (preset values from search results, **unverified**)
- [Runalyze] Runalyze help, "Recurring routes": https://runalyze.com/help/article/recurring-routes
- [CityStridesWiki] Wikipedia, CityStrides: https://en.wikipedia.org/wiki/CityStrides
- [CityStridesForum] CityStrides community, "Understanding Completed Streets and Completed Cities": https://community.citystrides.com/t/understanding-completed-streets-and-completed-cities/21955
- Repo (moved here from `session-segments` on 2026-11-07): `research/overlap-detection.md`, `research/segment-model.md`, `research/matching-metrics.md`, `research/detect-bench/` (bench re-run for this note on the demo data, 2026-11-06).
