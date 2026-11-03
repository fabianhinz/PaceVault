# Research: split and cap coverage chunks (Q24)

Scope: inform Q24. The owner decides. Settled rules this must fit: same sport, same direction, the open session leads, one pass per session per segment (its best), all-or-nothing results, detection in a worker when the session opens (plan Q1, Q3, Q8, Q9, Q12).

Terms: *lead* = the open session. *Bin* = a 10 m resample step on the lead (`overlap-detection.md` §2). *Coverage set* of a bin = the other sessions whose corridor match covers it. *Pass* = one other session over one segment.

## 0. What the current rule does and why it breaks

Rule today (plan Q1 a): cut wherever the coverage set changes, keep every chunk with ≥ 1 other session. It has three failure modes. They pull in opposite directions: one needs more cuts, two need fewer.

**F1. One giant segment.** 40 other runs of the same 12 km home loop give one 12 km chunk. You see your loop time, which the session list already tells you. Nothing about *where* you were faster.

**F2. Arbitrary cuts from one deviation, frayed ends.** One run takes a 400 m detour at km 6. Five runs start their watch 150 m down the road. Two stop 200 m early. Every one of these changes the set:

```text
km     0    1    2    3    4    5    6    7    8    9   10   11   12
lead   |==========================================================|
count  35|40 .......................... 39 |40 ............... |38
cuts     ^0.15                       ^6.0 ^6.4               ^11.8
chunks [a][            b  5.85 km  40x  ][c][      d  5.4 km 40x ][e]
        35x                              39x                      38x
        150 m                            400 m                    200 m
```

You get 5 segments. Three are noise (a, c, e). The two real ones are cut at km 6 only because of one detour. The cut moves when the next detour happens somewhere else.

**F3. Confetti from noisy partial overlaps.** On a lead that crosses many routes, short shared stretches, GPS drift out of the corridor and staggered starts give many short chunks with small counts:

```text
km     0    1    2    3    4    5    6    7    8
lead   |==========================================|
commute(6x)  |----------|                              shares km 1.0-3.0
drift (2 of the 6)  .. ||..                             leave corridor 40 m at km 2.1
cross  (1x)              |-|                           120 m at km 3.2
loop B (3x)                   |---------------|        starts at 4.0 / 4.2 / 4.5
count  0  |6 ....|4|6 ..|0|1|0| 1 |2 |3 .......|0
chunks    [1.1][.04][.9]   [.12] [.2][.3][ 2.5 ]       7 chunks, 4 of them < 300 m
```

A useful rule makes F1 finer and F2/F3 coarser at the same time. It must also be deterministic: the same lead and the same set of sessions always give the same cuts.

## 1. Two observations that shape every option

1. **Where the cut positions come from decides stability.** A cut taken from the lead's own data (distance marks, turns, climbs) never moves when sessions are imported. A cut taken from coverage (where others join or leave) can move with every import. Re-opening the same session with the same data is deterministic either way. Only stability across imports differs.
2. **Shorter segments mean more passes per segment.** A pass needs the session to cover the whole segment (`segment-model.md` §2 C). The km 6 detour in F2 removes that run from a whole-loop segment, but not from a "km 0–2" slice. Splitting loses no data. It counts partial sessions where they did ride. That only works with a tolerant membership rule: a session counts when it covers **≥ 95 % of the segment and both ends** (within `maxGapMeters`, about 50 m). Otherwise GPS drift drops passes.

## 2. Options

Each option is one tool. The shortlist in §3 combines them.

| # | Option | What it does | Fixes | Stability across imports | Interpretable ("why here?") | Times comparable | Worker cost | Effort |
|---|---|---|---|---|---|---|---|---|
| O1 | **Max length, equal slices of the chunk** | A chunk longer than `maxSegmentMeters` (2 km run, 5 km ride) is cut into `ceil(L / max)` equal parts. | F1 | Low: slices are anchored to the chunk, so they shift when the chunk does. | Medium ("every ~2 km") | Yes, and the slices have similar lengths, so pace across slices is comparable too | O(chunks) | Low |
| O2 | **Distance lattice of the lead** | Cut at fixed multiples of the lead's own distance (every 1 km / 2 km run, 5 km ride). Coverage then only decides which lattice cells are segments. | F1, partly F2 | **High**: positions come from the lead alone | High ("km 4–6") | Yes | O(bins) | Low |
| O3 | **Turns on the lead** | Candidate cuts where the lead's heading changes ≥ 60° within 50 m (`initialBearingDegrees`, `packages/engine/src/geodesy.ts:34`, smoothed over ±30 m). Of these, keep the ones nearest a target spacing. | F1 | High | High ("from the turn at the bridge") | Yes; Strava advises against starting at intersections because stop time lands in the segment [StravaGood]. Cut 20–30 m *after* the turn. | O(bins) | Medium (smoothing, picking among many turns in town) |
| O4 | **Climbs as their own segments** | `detectClimbs` (`packages/engine/src/climbs.ts:144`) on the lead's records. The start and end of each climb are cuts, so the climb is a segment. | F1 where there are hills | High | Very high ("the climb") | Yes | Already computed for the session | Low. Running rules need ≥ 15 % to enter and ≥ 40 m gain (`climbs.ts:32-46`), so a flat Karlsruhe loop may have none. Not enough alone. |
| O5 | **Stops on the lead** | Cut where the lead stood still (traffic light). | — | High | Medium | Worse: the lead's stop is not the others' stop | O(records) | Low. **Not recommended** as a cut source. Moving time handles stops better. |
| O6 | **Hysteresis on coverage** | Cut only where the count changes by ≥ `max(2, 20 %)` *and* holds for ≥ 200 m. Short dips (drift, a detour by 1 of 40) do not cut. | F2, F3 | Medium | Medium ("your routes split here") | Yes | O(bins) | Low |
| O7 | **Change points on coverage (PELT)** | Run `peltChangePoints` (`packages/engine/src/changePoints.ts:26`) on the coverage count per bin, with `minBins` = min length / 10 m and a penalty `beta`. It gives the fewest cuts that still explain the count profile [Killick2012]. | F2, F3 | Medium | Low-medium ("statistically a change") | Yes | O(bins) to O(bins²), 1200 bins: trivial | Low; the engine already has it |
| O8 | **Min length + min passes, merge into neighbours** | A chunk < `minSegmentMeters` (300 m run / 1 km ride, `overlap-detection.md` §2) or with < `minPasses` is merged into the neighbour whose set is most similar (Jaccard). If neither neighbour is ≥ 0.5 similar, it is dropped and becomes a gap. Membership is recomputed with the 95 % rule. | F2, F3 | Medium | Medium | Yes | O(chunks) | Low |
| O9 | **Snap coverage cuts to lead anchors** | Coverage cuts (O6/O7) move to the nearest anchor (turn, climb end or lattice mark) within 150 m. | F2 jitter | Higher than O6/O7 | High | Yes | O(cuts) | Low on top of O2/O3 |
| O10 | **Anchor atoms** | Cut the lead into *atoms* between anchors (O2 + O3 + O4), about 300 m–1 km each. Compute membership per atom. Join neighbouring atoms whose sets are near-identical (Jaccard ≥ 0.9) up to `maxSegmentMeters`. | F1, F2, F3 | **High** (atoms are fixed; imports only change the joins) | High | Yes | O(bins + atoms²) | Medium |
| O11 | **Whole-route segment** | If ≥ 1 other session covers ≥ 95 % of the lead (start and end within ~100 m, distance within 2–4 %), add one extra segment "Whole route". It overlaps the slices. | F1 (the loop time) | High | Very high | Yes, the comparison intervals.icu and Runalyze offer [IcuRoutes], [Runalyze] | O(1) on the coverage | Low. It is an extra, overlapping segment. The stepper order and "Segment 1" naming need a rule. |
| O12 | **Hierarchy: chunk + sub-segments** | The maximal overlap is the parent; slices are its children. | F1 | As the child rule | High | Yes | Low | Medium-high in the UI: the flat stepper (Q4, Q17) would need two levels. **Not recommended** for v1. O11 covers the one parent that matters (the whole loop). |
| O13 | **Top-k most travelled** | After splitting, show only the k segments with the highest passes × length, for example k = 8. | Too many segments | Medium (the ranking changes with imports) | Medium | n/a | O(segments log) | Low. A cap on the count, not a splitting rule. Combines with any option. |
| O14 | **Score-optimal partition** | Dynamic programming over the anchor positions that maximises Σ (passes × min(length, cap)) − penalty per segment. | F1, F2, F3 | Medium | Low ("the optimiser chose it") | Yes | O(anchors²) | Medium. Listed for completeness. Hard to explain. |

How others handle granularity:

- **Strava**: segments are made by hand. Minimum length is reported as 300 m, raised to 500 m [ZwiftInsiderMin] (**unverified**, one blog, not Strava docs). Short segments match badly. Strava advises avoiding intersections and tight switchbacks as start or end [StravaGood]. Auto-generated climb segments exist; road.cc reports flat ones caused by altitude glitches [RoadccSilly] (**unverified** how they are generated). No documented auto-splitting rule.
- **Garmin Connect**: hand-made segments, nothing documented on granularity (`segment-model.md` §1).
- **intervals.icu / Runalyze / Strava matched runs**: whole route only (O11), no sub-segments [IcuRoutes], [Runalyze], [StravaMatched].
- **Golden Cheetah**: hand-made route segments, no automatic split found (**unverified**).
- **tracematch**: frequent-section detection on ~100 m cells. Neighbouring cells merge while their track sets are "mutually near-identical and agree on pass class". It cuts at forks and usage changes only where the diverging branch is itself section-worthy, with an adaptive support floor and a minimum length. **No maximum length**: a long corridor stays one section [tracematch]. That is O6/O8/O10 without O1/O2, so F1 stays in tracematch. Numeric defaults are not in the README (**unverified**, in `src/sections/unified.rs`).

Takeaway: nobody documents a max-length rule for automatic segments. The products that are dynamic either keep long corridors whole (tracematch) or compare whole routes only (intervals.icu, Runalyze). Splitting long overlaps is something PaceVault would add. The safest building blocks for it come from the lead itself (O2, O3, O4), because they are stable and easy to explain.

## 3. Shortlist (combined strategies)

Thresholds below are starting values to tune on the owner's zip of real overlaps (plan Q14).

| | Running | Cycling |
|---|---|---|
| `minSegmentMeters` | 300 | 1000 |
| `maxSegmentMeters` (S1/S2 cap, S2 lattice) | 2000 | 5000 |
| `minPasses` per segment | 1 (owner: "≥ 1 other session") | 1 |
| Membership | ≥ 95 % covered, both ends within 50 m | same |
| Hysteresis (S1) | count change ≥ max(2, 20 %), held ≥ 200 m | held ≥ 500 m |

### S1. Clean the coverage, then slice evenly (O6 + O8 + O1)

Smooth the coverage profile (O6), merge or drop short and thin chunks (O8), then cut each chunk longer than the cap into equal slices (O1). This is the smallest change to today's rule.

```text
40x home loop (F2 data)
km     0    1    2    3    4    5    6    7    8    9   10   11   12
count  35|40 ....................... 39 |40 ................ |38
O6     .. detour 1 of 40 < 20 %, end fray < 20 %: no cut .....
O8     [a 150 m] < 300 m -> merged into b
chunk  [==================== 12 km, 40 passes* =================]
O1     |  1  |  2  |  3  |  4  |  5  |  6  |      12 / 2 km = 6 equal slices
       0     2     4     6     8    10    12
       * the detour run counts on 1-3 and 5-6; on slice 4 only if
         it still covers >= 95 %, otherwise 39 passes there

noisy partial overlap (F3 data)
count  0  |6 ....|4|6 ..|0|1|0| 1 |2 |3 .......|0
O6     drift dip 6->4 for 40 m: no cut
O8     cross 120 m < 300 m: dropped (gap); 4.0-4.5 stagger merged
       into loop B (Jaccard 0.67 with B's set)
segs      [ 1  2.0 km 6x ]       [ 2   3.0 km 3x  ]
```

- Stability: good on re-open. Across imports, slice borders shift when the chunk ends move: one new run that turns off at km 9 makes the chunk 9 km, so the slices become 4 × 2.25 km.
- Interpretable: "about every 2 km". It does not say where the route goes.
- Effort: low. Everything works on the coverage array the matcher already builds.

### S2. Distance lattice of the lead, coverage decides presence (O2 + O8 + O6)

Cut the lead at every `maxSegmentMeters` of its own distance (0, 2, 4, … km). A lattice cell is a segment when ≥ 1 session covers ≥ 95 % of it. Coverage cuts inside a cell are ignored. A cell with partial coverage at a route end is trimmed to the covered part if that part is still ≥ `minSegmentMeters`, otherwise it is dropped.

```text
40x home loop
km     0    1    2    3    4    5    6    7    8    9   10   11   12
lattice|         |         |         |         |         |         |
segs   [ 1  40x ][ 2  40x ][ 3  39x ][ 4  40x ][ 5  40x ][ 6  38x ]
                                ^ detour run misses km 6.0-6.4 -> not in 3 or 4?
                                  km 6 is a lattice mark: the detour sits in cell 4
                                  (6-8), so cell 3 keeps 40, cell 4 has 39
       end fray (2 stop at 11.8): cell 6 (10-12) -> 38x

noisy partial overlap (marks at 0, 2, 4, 6, 8 km)
km     0    1    2    3    4    5    6    7    8
lattice|         |         |         |         |
cell   0-2: covered 1.0-2.0 by 6x  -> trimmed to 1.0-2.0   seg 1  1.0 km 6x
       2-4: covered 2.0-3.0 by 6x  -> trimmed to 2.0-3.0   seg 2  1.0 km 6x
            (cross 3.2, 120 m: < 300 m, dropped)
       4-6: stagger 4.0/4.2/4.5 -> 4.0-6.0 covered by 1x,  seg 3  2.0 km 1x
            4.5-6.0 by 3x; trimming picks the longest       (or 1.5 km 3x: needs a rule)
       6-8: covered 6.0-7.0 by 3x  -> trimmed to 6.0-7.0   seg 4  1.0 km 3x
       the 6x commute (km 1-3) is cut at km 2 by the lattice alone
```

- Stability: **highest**. Imports change pass counts and whether a cell exists, never where a cut is.
- Interpretable: "km 4–6", which also gives a free label for Q10 (a).
- Downside: the 6x commute overlap (km 1–3) is split at km 2 only because of the lattice. A cut can land in a junction or a turn, but the time is interpolated at the cut (`segment-model.md` §2), so a cut in the middle of a straight is harmless.
- Effort: low.

### S3. Whole route + anchor atoms (O11 + O10 with O2/O3/O4 anchors + O8) — recommended to test first

1. **Whole route** (O11): if any other session covers ≥ 95 % of the lead, the first segment is "Whole route", with every such session as a pass.
2. **Anchors** on the lead: climb starts and ends (O4), turns ≥ 60° (O3, cut 25 m after), and distance marks every `maxSegmentMeters` as a fallback (O2) where no other anchor lies within 1 km.
3. **Atoms** = the stretches between neighbouring anchors. Atoms shorter than `minSegmentMeters` join their shorter neighbour.
4. **Membership** per atom with the 95 % rule. Neighbouring atoms whose pass sets have Jaccard ≥ 0.9 join, up to `maxSegmentMeters`. Atoms with no pass are gaps.

```text
40x home loop (turns T at 1.7, 4.1, 7.9 and 10.2 km; climb C 5.0-5.9 km)
km     0    1    2    3    4    5    6    7    8    9   10   11   12
anchors          T         T    C=C       T          T         (no anchor gap > 2 km)
       [WHOLE ROUTE  12 km  37x (detour run and 2 early stops < 95 %)  ]
segs   [ 1  1.7 40x][ 2 2.4 40x ][3 .9][ 4 .9 C ][ 5  2.0 39x ][6 2.3 ][7 1.8 38x]
                                 40x    40x       detour inside 6.0-7.9
       labels: "Start - turn 1", "Climb", ... (Q10 c)

noisy partial overlap (turns at 1.0, 3.0, 4.6, 7.0 km, no climb)
anchors     T         T       T            T
       no whole-route segment (nobody covers >= 95 % of the 8 km)
segs        [ 1  2.0 km 6x  ]   [ 2  2.4 km 3x (4.6-7.0) ]
       the cross (120 m) is not an atom of its own; 3.0-4.6 has < 95 % coverage
       by every session -> gap; 4.0-4.6 stagger -> only 4.6-7.0 counts all 3
```

- Stability: high. Anchors come from the lead. Imports only change which neighbouring atoms join and the pass counts.
- Interpretable: "from the turn to the climb", "the climb", "whole route". Q10 (c), a label from the route itself, falls out of this.
- Comparability: whole-route times for the "is my loop getting faster" question; segment times for "where".
- Cost: turns and atoms are O(bins). `detectClimbs` already runs for the session view.
- Effort: medium. It needs turn detection (new, about 40 lines in the engine) and the join step.
- Risks: in a town with many turns, too many anchors. The join step (Jaccard ≥ 0.9 up to the cap) absorbs most of them, and the 1 km fallback spacing only fills gaps. "Whole route" overlaps the other segments, so the stepper needs a rule (first, or a separate entry).

### S4. Change points on coverage + equal slices (O7 + O8 + O1, optional O13)

`peltChangePoints` on the per-bin count picks the few cuts that matter. O8 cleans up the rest. O1 slices long chunks. O13 caps the list at k.

```text
40x home loop
count  35|40 ....................... 39 |40 ................ |38
PELT   cost of a 1-step dip over 40 bins < beta -> no cut
segs   [ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ]      as S1 (one 12 km chunk, 6 slices)

noisy partial overlap
count  0  |6 ....|4|6 ..|0|1|0| 1 |2 |3 .......|0
PELT   cuts at 1.0, 3.0, ~4.2, 7.0 (drift dip and cross absorbed, minBins 30)
segs      [ 1 2.0 km 6x ]   [ 2 2.8 km 2x ]       stagger lands at the PELT cut
```

- Stability: like S1. PELT cuts can move a few bins when the count profile changes.
- Interpretable: weakest of the four ("statistics put the cut here"). The rest is S1.
- Effort: low. It reuses `changePoints.ts:26`; only `beta` needs tuning.
- Only worth it over S1 if hysteresis (O6) proves too brittle on real data.

### Comparison

| | S1 clean + slice | S2 lattice | S3 whole + atoms | S4 PELT + slice |
|---|---|---|---|---|
| Fixes F1 / F2 / F3 | yes / yes / yes | yes / yes / yes | yes / yes / yes | yes / yes / yes |
| Cut stable across imports | medium | **high** | high | medium |
| "Why here?" | "every ~2 km" | "km 4–6" | "turn to climb", "whole route" | "statistical change" |
| Loop time on its own | no | no | **yes** | no |
| Label for Q10 | km range | km range | route-derived | km range |
| Effort | low | low | medium | low |

## 4. Open questions for the owner

- **Q24a · Strategy.** (a) **S3 whole route + anchor atoms (recommended)**: the most stable and easiest to explain, the whole loop gets its own time, and it gives Q10 a label from the route; (b) S2 distance lattice: the simplest stable option; (c) S1 clean + equal slices: the smallest change to today's rule; (d) S4 change points + slices.
- **Q24b · Max segment length.** (a) **2 km running / 5 km cycling (recommended)**: a 12 km loop gives about 6 segments, which fits a stepper; (b) 1 km / 2 km: finer, but a 12 km loop gives 12 steps; (c) no cap, split only at turns and climbs: this keeps F1 on straight routes.
- **Q24c · Whole-route segment.** (a) **yes, as the first segment when ≥ 1 session covers ≥ 95 % of the lead (recommended)**; (b) no, segments only; (c) yes, shown in the summary row only, not in the stepper. Note: it overlaps the other segments on the map.
- **Q24d · Membership tolerance.** (a) **≥ 95 % covered and both ends within 50 m (recommended)**: drift does not drop passes; (b) 100 % (strict): honest, but GPS drops passes; (c) ≥ 80 % (Strava's "tight" match level, `segment-model.md` §1): more passes, but times are less comparable.
- **Q24e · Cap on the number of segments.** (a) **none in v1, tune on real data (recommended)**; (b) top-k by passes × length (O13), k = 8; (c) top-k by passes only.
- **Q24f · Min length and min passes.** (a) **300 m / 1 km and ≥ 1 pass (recommended; keeps the Q1 rule)**; (b) 500 m / 1.5 km (Strava's reported minimum) and ≥ 2 passes; (c) settable per sport.

## Sources

- [tracematch] evanjt/tracematch README, section detection: https://github.com/evanjt/tracematch (numeric defaults in `src/sections/unified.rs`, not checked, **unverified**)
- [StravaGood] Strava support, "How do I create good segments": https://support.strava.com/en-us/articles/15401997-how-do-i-create-good-segments-on-strava
- [ZwiftInsiderMin] Zwift Insider, "Strava minimum segment length": https://zwiftinsider.com/strava-minimum-segment-length/ (300 → 500 m, **unverified** against Strava docs)
- [RoadccSilly] road.cc, "Silly small Strava segments": https://road.cc/?p=22237 (**unverified** how Strava generates segments)
- [StravaMatched] Strava support, "Matched Runs": https://support.strava.com/hc/en-us/articles/216918597-Matched-Runs
- [IcuRoutes] intervals.icu routes: https://www.intervals.icu/features/routes/ and https://forum.intervals.icu/t/activity-route-matching/89041
- [Runalyze] Runalyze help, "Recurring routes": https://runalyze.com/help/article/recurring-routes
- [Killick2012] R. Killick, P. Fearnhead, I. Eckley, "Optimal detection of changepoints with a linear computational cost", JASA 107(500), 2012 (already in `packages/engine/SOURCES.md`).
- Repo: `packages/engine/src/changePoints.ts:26`, `packages/engine/src/climbs.ts:144`, `packages/engine/src/climbs.ts:32-46`, `packages/engine/src/gradient.ts:80`, `packages/engine/src/geodesy.ts:22`, `packages/engine/src/geodesy.ts:34`, `packages/engine/src/bounds.ts:48`, `apps/web/src/lib/analysis/gpsTrack.ts:12`.

All thresholds are starting values, not measured. The ASCII examples are made up to show the mechanics, not taken from real data.
