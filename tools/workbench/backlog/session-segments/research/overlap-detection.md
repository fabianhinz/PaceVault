# Research: overlap detection between sessions

Question: how to find, on demand in the browser, where the open session overlaps with the owner's other sessions, fast enough to feel interactive. Informs the decision; does not make it.

## Repo facts the approaches depend on

- Stored per session: one simplified encoded polyline, `bounds`, `pointCount` (`apps/web/src/lib/analysis/gpsTrack.ts:36-49`), built in the import worker (`apps/web/src/lib/workers/gpsBuild.worker.ts:5-20`). All of them load in one call: `getAllSessionGPS` (`apps/web/src/lib/storage/db.ts:143`).
- Simplification is Douglas-Peucker in raw degrees, `SIMPLIFY_TOLERANCE_DEGREES = 0.00005` (`apps/web/src/lib/analysis/gpsTrack.ts:12`): about 5.6 m north-south and about 3.6 m east-west at 49° N. Two things follow. The stored vertices are unevenly spaced, so a straight 2 km street can be just 2 vertices. Any per-point method needs to resample the polyline first, for example every 10 m.
- **The simplified polyline has no link back to record indices or timestamps.** Per-overlap metrics (time, HR, power) need the full records of both sessions, so the matched interval has to be found again on the full records. The alternative is to store a record index per vertex at import.
- Records are one IndexedDB row per session (`session-records`, keyPath `sessionId`, `apps/web/src/lib/storage/db.ts:50`), loaded whole by `getSessionRecords` (`apps/web/src/lib/storage/db.ts:77`). `SessionRecord` already carries `distance` (`packages/engine/src/types.ts:61-72`), so overlap lengths can come from the device's own cumulative distance.
- Reusable pieces: `hasBoundsOverlap` (`packages/engine/src/bounds.ts:48`), `haversineDistanceMeters` (`packages/engine/src/geodesy.ts:22`), `initialBearingDegrees` (`packages/engine/src/geodesy.ts:34`), the worker + contract pattern (`apps/web/src/lib/workers/personalBests.worker.ts:1-14`). The DB is at `DB_VERSION = 4` (`apps/web/src/lib/storage/db.ts:41`); persisting anything new per session means version 5 with a new store.
- The engine has no runtime dependencies (`packages/engine/CLAUDE.md`). Grid keys, resampling, corridor matching and run extraction can all be written by hand in a few dozen lines each. Polyline decoding, which uses `@googlemaps/polyline-codec`, stays in the app.

## 1. Known approaches

| Approach | What it does | Notes |
| --- | --- | --- |
| **Bounding-box prefilter** | Drops sessions whose bbox does not intersect the open session's bbox (padded by the tolerance). | O(N) and nearly free. With many local routes, almost every session around home passes, so it removes far-away sessions only. Runalyze also prefilters on start/end and bbox before shape comparison [Runalyze]. |
| **Grid / geohash cell hashing** | Resample the track, map every point to a cell key (geohash [Niemeyer2008], H3, or a plain equirectangular grid `floor(lat/Δ), floor(lng/Δ·cos φ)`), and keep a set of cells per session. An inverted index `cell → sessionIds` gives the candidates and a rough overlap length (shared cells × cell size). | Very fast and easy to keep incrementally. Its weakness is boundary flicker: a track running along a cell edge switches cells. The fix is to dilate the cells (look up the 8 neighbours) or to use cells about 2-3× the tolerance. tracematch rasterises tracks into about 100 m cells for section detection [tracematch]. |
| **Corridor / buffer matching** | For each resampled point of track A, find the distance to the nearest segment of track B. A point counts as "on B" if that distance is ≤ tolerance. Runs of on-B points become overlaps. A spatial grid over B's segments makes it about O(n). | This is the core of Strava-style segment matching: a buffer around the segment, plus the nearest points to the segment's start and end [StravaSupport], [StravaPatent]. tracematch's Average Minimum Distance is the averaged form of the same nearest-distance idea, computed both ways to detect subsets [tracematch]. Direction comes from whether B's matched index rises or falls along the run. |
| **Discrete Fréchet / DTW** | Aligns two point sequences in order and gives a single dissimilarity score. Discrete Fréchet uses the max-coupling distance [EiterMannila1994]; DTW uses the sum [SakoeChiba1978]. | O(n·m) time and memory per pair. It compares whole tracks, or intervals you already have. Finding sub-paths with it (subtrajectory clustering) is far harder [Buchin2011]. Runalyze uses DTW to decide whether two whole runs are the same route, with a quadratic penalty on deviations [Runalyze]. It fits best as a check on already-extracted intervals, not as the search. |
| **LCSS on snapped cells** | Snap both tracks to cell-key sequences, remove consecutive duplicates, and run a longest-common-subsequence (or common-substring) match with ε-tolerance equality, meaning neighbouring cells count as equal [Vlachos2002]. | O(n·m) on the short cell sequences, for example 400 × 400 for 10 km at 25 m cells. Running it on the reversed sequence handles the opposite direction. Results are as coarse as the cells, so the ends of an overlap are only known to within one cell. |
| **Map matching (HMM)** | Snaps both tracks to a road/path graph. Overlaps are then shared edge IDs [NewsonKrumm2009]; OSRM implements this. | Gives exact, clean boundaries at junctions. It needs a road graph, though, which is offline OSM data or a server. That breaks local-first and the no-runtime-deps engine, so it is listed only as a reference. |
| **Subtrajectory clustering** | Splits trajectories into line segments and clusters them, for example TRACLUS [Lee2007]. | Built for discovering frequent paths across a whole corpus, not for one session against the rest. It is relevant only if "fixed segments" later have to be discovered automatically. |

How open-source and existing tools do it:

- **GoldenCheetah**: route segments are created by hand from a user interval on the map, then matched against other rides ("Match new segments"). No algorithm documentation was found. The matching details are **unverified** (forum sources only [GCForum]).
- **Runalyze**: recurring routes, whole activities only. Candidates come from distance (±200 m or 4 %), start/end and bbox, then the shape is compared by DTW against a threshold that is not published [Runalyze].
- **intervals.icu**: routes over whole activities, with matching the developer calls "not very fuzzy" and a manual merge for duplicates. The algorithm is not published [IcuForum]. It appears to match both directions to the same route (a user report, **unverified**).
- **Strava**: user-defined fixed segments, matched with a buffer and the nearest start/end points, without interpolation [StravaSupport]. The patent describes defining and matching segments [StravaPatent].
- **tracematch** (Rust, open source): route matching by Average Minimum Distance, an R-tree for nearest-neighbour queries, and "frequent section detection" on about 100 m cells, with medoid consensus. The consensus polyline is a real activity's points, not an average [tracematch]. This is the closest open reference to "sections shared between many activities". Its numeric defaults were not checked (**unverified**).

## 2. Pipeline sketch for PaceVault

Everything runs in one worker, following the `personalBests.worker.ts` pattern with a zod contract. The open session's records are already in memory and go in through the message, or the worker reads them from IndexedDB.

1. **Candidates (coarse).**
   1. Load all `SessionGPS` (`getAllSessionGPS`). Drop the open session and, depending on Q3, other sports.
   2. Run the bbox prefilter against the open bbox padded by the tolerance (`hasBoundsOverlap`).
   3. Decode each polyline and resample it every *r* m (about 10 m). Map the points to grid cells of size *c* (about 25-50 m). Precomputed or cached, these are per-session cell sets plus an inverted index `cell → sessionIds`.
   4. For the open session's cells, dilated by one ring, count the shared cells per session. Keep sessions with `shared × c ≥ minOverlapMeters`.
2. **Match (fine), per candidate.**
   1. Resample the open track (from full records or the polyline) every *r* m.
   2. Build a small segment grid over the candidate's resampled polyline. For each open point, store the nearest distance, the candidate's index there, and whether it is on the candidate (distance ≤ **toleranceMeters**).
3. **Extract overlap intervals.**
   1. Walk the open points and join on-candidate points into runs. A run survives off-candidate stretches up to **maxGapMeters** (tunnels, dropouts, the far side of a roundabout).
   2. Keep a run only when its length is ≥ **minOverlapMeters**.
   3. Direction: the sign of the slope of the candidate's matched index along the run, rising for same direction and falling for reverse. A run whose slope changes sign splits there, which covers out-and-back routes and U-turns.
   4. Several passes of the candidate over one stretch (laps, an out-and-back over the same road): the nearest-vertex choice becomes ambiguous. Choose the candidate index that continues the current run (a monotonic constraint, as a small DP or greedy). Otherwise each pass becomes its own interval and the candidate can show several overlaps with the open session.
   5. Result per interval: `{ openStart, openEnd, otherSessionId, otherStart, otherEnd, direction }` in resampled-point indices.
4. **Map back to records.**
   - The open session: resample from full records and keep the record index per resampled point, so the mapping comes free.
   - The other session: its polyline has no record indices (see Repo facts). Either (a) load its records and repeat step 2 for that interval alone, which costs one IDB read per overlapping session, or (b) store a record index (or timestamp) per vertex at import (`SessionGPS` gains a field, a re-build of all sessions, a DB migration).
5. **Per-overlap metrics** come from records over `[start, end]`: elapsed time (`timestamp`), moving time (`timerTime`), distance (`distance` delta, or summed haversine), avg speed or pace, avg HR, avg power. Missing values stay missing, per root `CLAUDE.md` "0 is data". These are pure engine functions over index ranges.
6. **Cut-off (dynamic vs. common interval).** Pairwise runs differ in extent: B overlaps A on km 2-6 and C on km 3-8. Comparing B and C needs a common interval. A coverage profile handles that: for each open point, the set of sessions covering it. Segment boundaries go where that set changes (filtered by minimum length and a minimum number of sessions). Every session in a segment then has the same start and end on the open track, which is what a fair time comparison needs. This is the step where "dynamic segments" turn into something fixed, anchored to the open session.

Thresholds and where each one applies:

| Threshold | Step | Starting range (to tune on real data) | Why |
| --- | --- | --- | --- |
| `resampleMeters` *r* | 1.3, 2.1 | 5-10 m | Below the tolerance, so no gap opens between samples. |
| `cellMeters` *c* | 1.3 | 25-50 m | At least 2× the tolerance, so dilation by one ring covers the corridor. |
| `toleranceMeters` | 2.2 | 15-30 m | Smartphone GPS is typically within 4.9 m under open sky [GPSgov]. Watches under trees or between buildings do worse (**unverified**, no measured number). Opposite sides of a road add about 5-10 m, and DP simplification adds up to about 5.6 m (`gpsTrack.ts:12`). |
| `maxGapMeters` | 3.1 | 50-150 m | Bridges dropouts and short detours. Too large, and two separate overlaps merge. |
| `minOverlapMeters` | 1.4, 3.2 | 200-500 m | Below that, crossings and short shared junctions show up as noise. Strava warns that short segments match badly [StravaSupport]. |
| `minSessionsPerSegment` | 6 | 1-3 | How many other sessions a segment needs before it is shown. |

## 3. Cost estimate

All figures are **estimates, not measured**. They assume about 10 km per session, a mid-range phone, and JS that is about 3-5× slower than a desktop.

| Step | Work for N = 1000 sessions | Expected time |
| --- | --- | --- |
| `getAllSessionGPS` + bbox | 1000 rows of a few kB | 20-100 ms |
| Decode + resample + cells for **all** sessions (no precompute) | about 1000 × 1000 points = 1M points | 150-500 ms |
| Same with cell sets **precomputed** at import (inverted index in memory) | Read the index, then about 1000 lookups for the open session | < 50 ms (plus reading the stored sets, about 50-150 ms) |
| Corridor match per candidate | O(n + m) with the segment grid, about 2000 points | 0.5-2 ms per candidate; 200 candidates ≈ 100-400 ms |
| Records load for metrics (option 4a) | One IDB `get` per overlapping session, about 3.6k records per hour of activity, structured clone | 5-30 ms each; 100 sessions ≈ 0.5-3 s |
| Fréchet / DTW on whole tracks instead of the corridor | O(n·m) ≈ 1M cells per pair | 5-20 ms per pair; 200 candidates ≈ 1-4 s, plus memory per pair |

So candidates plus matching come out under about 1 s even without precompute. Loading other sessions' records for metrics dominates. Mitigations: stream results (show the overlap geometry first and fill in metrics as each record set loads), cap the number of compared sessions, or use option 4b.

**What can be done when:**

- **At import** (in `gpsBuild.worker.ts`, which already holds the full records): the resampled cell set per session, and a record index per simplified vertex (removes the second match in 4a, but not the records read). Both need DB version 5 and a re-build of existing sessions (the worker already re-builds from records).
- **On demand:** the inverted index (built in memory from the stored cell sets, cached in the worker for the app session), the corridor match, the intervals and the metrics.
- **Incremental:** adding a session adds its cells to the index; deleting removes them. Nothing pairwise is stored, so nothing has to be recomputed beyond invalidating cached results for open sessions (for example a React Query key that includes a session-set version).
- **Storage:** about 400-1000 cell keys per session as a packed `Int32Array` pair or string keys, so 1000 sessions take about 3-10 MB in IDB (**estimate**).

## 4. Options

| | A. Grid candidates + corridor match | B. Grid cells only (LCSS / shared-cell runs) | C. Bbox + DTW/Fréchet on whole tracks | D. Map matching to an OSM graph |
| --- | --- | --- | --- | --- |
| **Accuracy** | High. Boundaries are exact to one resample step, and direction and multiple passes are handled explicitly. | Medium. Boundaries are exact only to one cell (25-50 m), and the cell-edge flicker needs dilation. | High for "same whole route". It does not find partial overlaps unless a subpath variant is built (hard [Buchin2011]). | Highest. Boundaries fall on junctions. |
| **Speed (1000 sessions, phone)** | Under 1 s for geometry; metrics depend on records loading. | Fastest, tens to a few hundred ms. | 1-4 s and memory-heavy. | Depends on the graph; needs a large local graph or a server. |
| **Effort** | Medium: resample, grid, corridor, run extraction, direction, coverage cut. | Low to medium. | Medium; subpath detection is high effort. | High, and breaks local-first and the no-deps engine. |
| **GPS noise / simplification** | Robust through the tolerance plus resampling. The DP vertex gaps are handled by resampling. | Robust through cell size and dilation, at the cost of resolution. | DTW is robust; Fréchet is sensitive to single outliers. | Robust (HMM). |
| **Direction** | From the slope of the matched index, so it splits cleanly. | Reverse the sequence and run again. | Reverse the sequence and run again. | Edge direction. |
| **Fit for "segments" (sub-paths, cut-off)** | Direct: intervals plus a coverage profile. | Good for candidates; coarse cut-offs. | Poor: answers "same route?", not "where do they overlap?". | Good, but out of scope for local-first. |

**Prototype first: A, with B's grid as its candidate stage.** B is already step 1 of A, so A only adds the corridor match on the few candidates. A is the only option that gives sub-path intervals, direction and exact cut-offs, which the coverage-based segment boundaries (pipeline step 6) need. Strava's buffer matching and tracematch's nearest-distance approach work the same way [StravaSupport], [tracematch]. A first prototype can skip precompute (decode all polylines on demand) and add stored cell sets only if measurement shows the need.

## 5. Open questions for the owner

Per the task, no recommendation is given here beyond the prototype choice above.

1. **What is a segment?** (a) Pairwise maximal overlaps: each other session gets its own interval, and comparisons only hold between sessions with the same interval. (b) Coverage cuts on the open session: boundaries where the set of covering sessions changes, so every session in a segment has the same start and end. (c) Fixed user-defined segments, Strava-like, saved and matched later; still needs A for the matching.
2. **Direction.** (a) Same direction only. (b) Both directions, shown as separate segments. (c) Both directions merged into one segment, with direction as a per-effort attribute.
3. **Which sessions take part?** (a) Same sport only. (b) Sport family, for example run and trail run. (c) All sessions with GPS, regardless of sport.
4. **Precompute.** (a) None: decode polylines on demand and cache in the worker for the app session. (b) Store cell sets at import (DB version 5 with a re-build of existing sessions). (c) Option (b) plus a record index per polyline vertex, so metrics skip the second match.
5. **Metrics loading.** (a) Load the records of every overlapping session before showing anything. (b) Show the geometry first and stream metrics in. (c) Cap at the N most recent overlapping sessions per segment.
6. **Thresholds.** (a) Fixed defaults from the table in section 2, tuned once on the owner's data. (b) Per-sport defaults (swim, bike and run have different speeds and noise). (c) Exposed as a user setting, at least `minOverlapMeters`.
7. **Repeated passes within one session** (track laps, loops run several times). (a) Every pass is its own effort. (b) Only the best or first pass per session counts.

## Sources

- [Runalyze] Runalyze help, "Recurring routes": https://runalyze.com/help/article/recurring-routes. Also the glossary: https://runalyze.com/glossary/recurring-route
- [IcuForum] intervals.icu forum, "Activity route matching": https://forum.intervals.icu/t/activity-route-matching/89041. "Activity routes beta testing needed": https://forum.intervals.icu/t/activity-routes-beta-testing-needed/86792. Feature page: https://www.intervals.icu/features/routes/
- [StravaSupport] Strava support, "Segment Matching Issues": https://support.strava.com/hc/en-us/articles/216918187-Segment-Matching-Issues
- [StravaPatent] US9208175B2, "Defining and matching segments": https://patents.google.com/patent/US9208175
- [tracematch] tracematch crate docs: https://docs.rs/tracematch. Source and README: https://github.com/evanjt/tracematch
- [GCForum] golden-cheetah-users, "Leaderboard for routesegments": https://groups.google.com/g/golden-cheetah-users/c/7kJ0tCIHnyo/m/nxWy-BsHDAAJ
- [GPSgov] GPS.gov, "GPS Accuracy" (smartphones typically within 4.9 m under open sky): https://www.gps.gov/systems/gps/performance/accuracy/ (cited from memory, page not fetched in this research)
- [EiterMannila1994] T. Eiter, H. Mannila, "Computing Discrete Fréchet Distance", Tech. Report CD-TR 94/64, TU Wien, 1994.
- [SakoeChiba1978] H. Sakoe, S. Chiba, "Dynamic programming algorithm optimization for spoken word recognition", IEEE Trans. ASSP 26(1), 1978.
- [Vlachos2002] M. Vlachos, G. Kollios, D. Gunopulos, "Discovering Similar Multidimensional Trajectories", ICDE 2002.
- [Buchin2011] K. Buchin, M. Buchin, J. Gudmundsson, M. Löffler, J. Luo, "Detecting Commuting Patterns by Clustering Subtrajectories", IJCGA 21(3), 2011.
- [Lee2007] J.-G. Lee, J. Han, K.-Y. Whang, "Trajectory Clustering: A Partition-and-Group Framework", SIGMOD 2007.
- [NewsonKrumm2009] P. Newson, J. Krumm, "Hidden Markov Map Matching Through Noise and Sparseness", ACM SIGSPATIAL GIS 2009.
- [Niemeyer2008] G. Niemeyer, geohash.org, 2008 (public domain geocoding system).

Academic references are cited from memory, not re-fetched. All timing figures in section 3 are estimates, not measurements.
