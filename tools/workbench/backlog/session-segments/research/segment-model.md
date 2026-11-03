# Research: segment model (fixed vs. dynamic) and the cut-off problem

Scope: inform the owner's choice. No recommendation except which variant to test first (marked at the end of the shortlist).

## 0. What the repo gives us today

- Every session has one simplified polyline plus bounds in `session-gps` (`apps/web/src/lib/analysis/gpsTrack.ts:36-48`, store at `apps/web/src/lib/storage/db.ts:53`). Douglas-Peucker tolerance is `0.00005°` (`apps/web/src/lib/analysis/gpsTrack.ts:12`), roughly 5.5 m north-south and 3.6 m east-west at Karlsruhe's latitude. That is well inside GPS noise, so the polyline is precise enough for shape matching.
- The polyline has **no timestamps and no distance per vertex**. To get a time on an overlap for *another* session, the app must load that session's full records from `session-records` (`apps/web/src/lib/storage/db.ts:50`), or the GPS store would need a per-vertex elapsed-time and distance array (a schema change).
- Cheap prefilter: `hasBoundsOverlap` (`packages/engine/src/bounds.ts:48`). Point distance: `haversineDistanceMeters` (`packages/engine/src/geodesy.ts:22`).
- Entry point idea: a new control beside `MapViewControl` and `LapsControl` (`apps/web/src/components/sessions/session/SessionMapControls.tsx:24-36`).

## 1. Comparable products

| Product | Model | Cut-off / start-end | Direction | Partial | Source |
|---|---|---|---|---|---|
| **Strava segments** | Fixed. A user creates a stored segment from an activity or a map; the start and finish point are user-picked. | Patent: a virtual start and finish line about 100 m long, laid across the path; a crossing is consecutive GPS points on opposite sides of the line. The time comes from the recorded points closest to the start and finish. | Directional in practice (the line crossing plus the order of the points); no official statement found, so **unverified**. | Two levels in the patent: "loose" match at roughly 65 % overlap, "tight" at roughly 80 % overlap plus crossing both lines. Only tight matches count. The support tool lists "partial or potential" matches and highlights the matched part. | [Patent US9116922], [Strava matching help], [Strava segment-matching issues] |
| Strava, segment-creation advice | Same | Keep start and end away from intersections (stopped time counts) and tight switchbacks; short segments under about 30 s match badly; build from clean GPS. | A start just after a turn excludes athletes who don't turn. | n/a | [Strava good segments] |
| **Strava matched activities** | Dynamic, *whole activity* clusters (not segments). | Compares start and end points, direction and distance. | Direction is a criterion. | Whole route only; a slightly different effort can open a second cluster. Private to the owner. | [Strava matched runs] |
| **Garmin Connect segments** | Fixed. Created from an activity in the Segments tab ("+ Create Segment"); the device races it as a "virtual race course". | Not documented; forum users assume it works like Strava (**unverified**). Users report false positives and misses. | Not documented. | Not documented. | [Garmin forum create], [Garmin forum problems], [Garmin Edge manual] |
| **intervals.icu routes** | Dynamic auto-clustering of **whole activities** into routes; the user can merge routes and rename them. Segments deliberately not built: "Strava have several patents on segments so I need to steer clear". | Whole route: start and end within about 100 m, distance within 2 % or 200 m, "a percentage of missed points"; the track is simplified with Douglas-Peucker and points are looked up with S2 cells. Later made "less fussy". | "Reversed track is a different route": yes. | "complete routes, not partial matches". | [icu beta thread], [icu matching thread], [icu routes page] |
| **Runalyze recurring routes** | Dynamic auto-grouping of whole activities. | Prefilter on distance (200 m or 4 %), start and end, bounding box; then dynamic time warping with quadratic penalty and a score limit. The other side of the road is fine; a short detour is not. | Not stated. | Not stated; merging routes "planned". | [Runalyze help] |
| **Komoot Highlights** | Community-curated places and route segments; recommendations, no timing found (**unverified**: the help article returned 403). | n/a | n/a | n/a | [Komoot vs Strava] |
| **Golden Cheetah** | No released route or segment matching found (**unverified**); "Find Intervals" detects efforts by power or W', not by geography. | n/a | n/a | n/a | [GC 3.1 release notes], [Zwift forum GC] |

Takeaways:

1. Only Strava and Garmin time **sub-route segments**, and both use a fixed, user-made entity with start and finish lines. Nobody documents a "dynamic segment".
2. Products that work dynamically (Strava matched activities, intervals.icu, Runalyze) cluster **whole activities** and avoid the cut-off problem by refusing partial matches.
3. Direction: where it is documented, reverse means a different route.
4. Thresholds people use: endpoints within about 100 m, distance within 2 to 4 % or 200 m, a corridor or "missed points" tolerance, overlap of 65 to 80 %.
5. The intervals.icu author cites Strava's segment patents as the reason for not building segments. Whether that matters for a private, local, non-commercial app is a legal question this research does not answer (**unverified**, not legal advice).

## 2. Model options

Shared building block for every option: *corridor matching*. A point of session A "is on" session B when it lies within *w* metres (about 20 to 30 m, which covers GPS noise and the other side of the road) of B's polyline **and** the local headings agree within about 45°, so A and B travel the same direction. A run of consecutive matched points is an overlap. Gaps under *g* metres (about 50 m, for tunnels and GPS dropouts) are bridged.

| | **A. Fixed** (Strava-like entity) | **B. Dynamic pairwise** (this session vs. each other session) | **C. Dynamic coverage chunks** (cut where the number of sessions on the path changes) | **D. Hybrid: discover, then pin** (B or C proposes; a pin freezes it as A) | **E. Auto-cluster into fixed** (background job builds a personal junction-to-junction network; well-used edges become fixed segments) |
|---|---|---|---|---|---|
| What a segment is | A stored polyline with start and finish gates, a direction and an id | The maximal common run of the current session with one other session | A stretch of the current session between two points where the coverage count changes (a branch joins or leaves) | A proposal like B or C; once pinned, an entity like A | An edge of a graph built from all polylines, kept above *N* traversals |
| Cut-off decided by | The user (pick a start and end on the track, or trim handles); matching = cross both gates + corridor coverage ≥ ~80 % | Where the two tracks diverge (corridor exit), ±*w* of GPS jitter | Coverage step: count of other same-direction sessions on each point; cut where the count changes by ≥ *k* and the stretch is ≥ *L* (e.g. 300 m); optionally snap to the nearest sharp turn | Proposal as B or C; the user can trim before pinning; frozen after | Junctions (points where ≥ 2 distinct paths split), detected over all sessions |
| Direction | Stored on the segment; reverse = no match (or a sibling segment) | From the heading test; reverse can be shown separately or filtered out | Coverage is counted per direction | As A | Per directed edge |
| Partially ridden | Not counted (like Strava) or shown as "partial, x %" without a time | No such case: the overlap *is* whatever was shared | A session that covers only part of a chunk does not count for that chunk's times | As A | Not counted for that edge |
| Stable over time? | Yes, until edited | No: each pair has its own cut, A∩B ≠ A∩C | Partly: a new session that branches mid-chunk splits it into two | Yes after pinning; proposals change | Mostly; a new junction splits an edge (needs id continuity: the child keeps the parent's id plus a suffix, or a re-map) |
| Times comparable? | Yes, same gates for every effort | No: every pair is timed over a different stretch | Yes within a chunk, across every session that covers it completely | Yes after pinning | Yes |
| Data needed | Records of every candidate session for gate times (once at creation for history, then per import) | Polylines for shape; records of the other session for its time | Polylines of all bounds-overlapping sessions for coverage; records only for sessions covering a chosen chunk | B or C, then A | All polylines in a worker; records per edge effort; persisted graph |
| User mental model | Known from Strava; "my climb, my times" | "Where else did I go along here?", no leaderboard | "The parts of this route I do often", list of sections with an effort count | "Find it, keep it" | "The app knows my standard sections" (magic, harder to correct) |
| 390 px | Creating with trim handles on a small map is fiddly; viewing is fine | List of other sessions plus coloured overlap on the map: fits | List of chunks (length, count, best/last time) plus map highlight: fits | List fits; trim before pinning is fiddly (can be optional) | List fits; no creation UI needed |
| Effort | Medium-high: entity + store + migration, creation UI, matcher, backfill over history | Low-medium: matcher on polylines, lazy, in a worker | Medium: coverage counting + chunking + records loading for times | High: C or B + A | High: graph building, junction detection, incremental updates, id stability |
| Main risks | Endpoint choice by the user (intersection, stop sign, start in a noisy area); backfill cost; the patent note in §1 | Numbers look comparable but aren't; many tiny overlaps (min length needed) | Chunk borders jitter with GPS noise; chunks shift as the history grows; short chunks at junctions | Two systems to explain; proposals and pinned segments can overlap | Junction detection in noisy GPS; hard to debug; surprising segments; unclear when to re-cluster |

GPS noise for every option: a corridor of *w* ≈ 20 to 30 m absorbs noise and road side; bridging gaps < *g* ≈ 50 m absorbs dropouts; a minimum length *L* (≈ 300 m running, ≈ 1 km cycling) suppresses tiny overlaps at crossings; for times, interpolate the moment the track crosses the cut point from the 1 Hz records instead of taking the nearest point, so a cut that wobbles by a few metres changes the time by only a second or two.

## 3. Shortlist

Legend: `===` current session, `---` other sessions, `|` cut, `S`/`F` start/finish gate.

**S1. Fixed gates, user-made (A).** Rationale: the only model with timing that is comparable and stable by construction; known from Strava and Garmin.

```
              S                         F
  ====|=======+=========================+=======|====
              ^ gate ~ across the path  ^
  other run:  ---+------------------------+--   -> counted (crosses S and F, >=80 % in corridor)
  other run:  ---+-----------------\             -> partial: no time (or "partial, 60 %")
```

**S2. Pairwise overlap, no timing (B, discovery only).** Rationale: cheapest, uses only the stored polylines, honest about "where else"; shows *which* sessions shared the path and how far, but no time comparison.

```
  this:   =================================================
  run 1:      |----------------------|                 (overlap 1.8 km)
  run 2:                 |------------------------|    (overlap 2.4 km)
  cuts differ per pair -> show distance shared, not time
```

**S3. Coverage chunks (C).** Rationale: no creation UI, cuts fall where your own routes branch, so on repeated home routes the chunks become "the sections I always run"; times are comparable inside a chunk.

```
  coverage count of other same-direction sessions along this session:
  this:   ==========|=====================|==============|=====
  count:     3      |         14          |      6       |  0
                    ^ branch joins        ^ branch leaves
  chunks: [ 0.9 km, 3x ] [ 2.6 km, 14x ] [ 1.2 km, 6x ]   (0x: not a chunk)
```

**S4. Chunks plus pin (D = C then A).** Rationale: S3 for discovery; a pin freezes a chunk's borders as gates, so it stops shifting when new sessions arrive and gets its own history.

```
  proposed:  ====|=====================|====   (chunk, may shift later)
  pinned:    ====S=====================F====   (frozen gates, matched like S1)
```

**S5. Auto-clustered personal network (E).** Rationale: fully automatic, stable ids, segments independent of which session is open; highest effort and the hardest to correct.

```
          (B)
           |\
  (A)------+ \-------(C)      junctions from all sessions; each edge with
           |                  >= N traversals becomes a fixed segment
          (D)                 A->B, B->C, B->D (per direction)
```

**Test first: S3 (coverage chunks).** Why: it answers the core open question (do automatic cuts land in sensible places on real home routes?) with data the app already stores (polylines + bounds), needs no new entity, store migration or creation UI, and fits 390 px as a list. If the cuts look right, S4 (pin) builds on it; if they jitter, that is direct evidence for gates (S1).

## 4. Open questions for the owner

1. **Fixed, dynamic or both?** (a) dynamic only (S2/S3); (b) fixed only (S1); (c) dynamic discovery plus pin (S4); (d) automatic network (S5).
2. **Does a segment need comparable times, or is "where else did I go" enough for v1?** (a) times required (rules out S2 as the end state); (b) shared distance and the list of sessions is enough for v1.
3. **Reverse direction:** (a) separate segment / chunk; (b) same segment with a direction filter; (c) ignore direction (risk: times not comparable).
4. **Partially ridden segment:** (a) not shown; (b) shown as "partial, x %" without a time; (c) shown with time over the covered part (not comparable).
5. **Time data for other sessions:** the stored polyline has no times. (a) load the other sessions' full records lazily when the mode opens (no migration, slower with many matches); (b) add per-vertex elapsed time and distance to `session-gps` (store migration, fast); (c) compute and store segment efforts at import time (needs fixed segments).
6. **Cross-sport:** should a run and a ride on the same path share a segment? (a) per sport only; (b) shared, filterable.
7. **Minimum length and corridor width:** (a) fixed defaults (≈ 300 m running / 1 km cycling, 25 m corridor); (b) per sport, tuned on the owner's data during the S3 test.
8. **Strava segment patents** (cited by intervals.icu as a reason to avoid segments): (a) not relevant for a private local app, proceed; (b) check before choosing S1/S4/S5. Not legal advice.

## 5. Sources

- [Patent US9116922] Strava, "Defining and matching segments": https://patents.google.com/patent/US9116922 (also US9208175: https://patents.google.com/patent/US9208175)
- [Strava matching help] Segment matching troubleshooting: https://support.strava.com/hc/en-us/articles/216918247
- [Strava segment-matching issues] https://support.strava.com/da/articles/15401957-problemer-med-segment-matching
- [Strava good segments] https://support.strava.com/en-us/articles/15401997-how-do-i-create-good-segments-on-strava
- [Strava matched runs] https://support.strava.com/hc/en-us/articles/216918597-Matched-Runs
- [Garmin forum create] https://forums.garmin.com/apps-software/mobile-apps-web/f/garmin-connect-web/87152/how-do-i-create-a-segment-in-garmin-connect/860297
- [Garmin forum problems] https://forums.garmin.com/apps-software/mobile-apps-web/f/garmin-connect-web/246523/problem-with-new-segments and https://forums.garmin.com/apps-software/mobile-apps-web/f/garmin-connect-web/152912/using-segments
- [Garmin Edge manual] Racing a segment: https://www8.garmin.com/manuals/webhelp/fenix5/EN-AU/GUID-97E9B519-2749-4910-A2BE-783B4DDB0E34.html
- [icu beta thread] https://forum.intervals.icu/t/activity-routes-beta-testing-needed/86792
- [icu matching thread] https://forum.intervals.icu/t/activity-route-matching/89041
- [icu routes page] https://www.intervals.icu/features/routes/
- [Runalyze help] Recurring routes: https://runalyze.com/help/article/recurring-routes
- [Komoot vs Strava] https://travesiapirenaica.com/en/komoot-vs-strava/ (Komoot help https://support.komoot.com/hc/articles/10364710659994 returned 403, unverified)
- [GC 3.1 release notes] https://github.com/GoldenCheetah/GoldenCheetah/blob/master/doc/user/GC31-Release.pdf?raw=true
- [Zwift forum GC] https://forums.zwift.com/t/zwift-segments-in-golden-cheetah-analysis-software-your-experience/532829/4
