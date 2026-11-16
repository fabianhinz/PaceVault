# Fatigue resistance on the segment Report tab

Question: can the v1 Report tab (plan.md "Scope cut after round 1": sticky session item, Pass times, Efficiency) also answer "am I slower on this segment when I reach it tired?", and how?

## 1. What the term means

- **Science: durability.** Maunder et al. (2021) define durability as "the time of onset and magnitude of deterioration in physiological-profiling characteristics over time during prolonged exercise" [1]. "Fatigue resistance" is used as a synonym in coaching [2]. The usual field measure is **power output after a given amount of prior work in kJ**: Spragg et al. split pro power profiles into fresh (< 2000 kJ) and fatigued (> 2000 kJ) [3]; an amateur study used 1000 kJ of prior work before a 5- and 20-min test [4]; declines grow beyond ~20 kJ/kg in pros [5]. A 2025 systematic review notes kJ ignores intensity: 10–20 % power loss after 2.5–15 kJ/kg of hard work, less after the same work done easy [6].
- **Runs:** durability is measured as HR-to-speed (or grade-adjusted speed) decoupling over the course of a long run; in marathon field data it starts around 25–27 km and is driven more by the speed drop than by HR drift [7], [8].
- **Tools:** intervals.icu draws power curves "after N kJ" (precomputed per kJ breakpoint; kJ/kg asked for, not offered) [9], [10]. WKO "Stamina" scores the flat tail of the power-duration curve beyond ~1 h, most people 75–85 % [11]. Xert "Durability" models the decay of maximal power available against total work (kJ) or carbs used, and needs 2–3 h rides with a late maximal effort [12], [13]. No documented durability feature found for Golden Cheetah, Runalyze, Garmin, Coros or Stryd; Stryd pods are used in studies as the speed source [8].
- **Aerobic decoupling (Pw:HR / Pa:HR)** is related but different: output per heartbeat in the second half of one steady session against the first half, ≤ 5 % = good aerobic endurance (Friel) [14]. It is **within one session**; durability is about **performance after prior work**. PaceVault already computes decoupling per session (`packages/engine/src/decoupling.ts:139`, `aerobicDecoupling`, rides ≥ 1 h).

None of these is defined per segment. A segment gives something they lack: the **same course** ridden fresh and tired, so the prior-work effect is not mixed with course changes.

## 2. Mapping to a segment with many passes

Per pass, the load **before the pass started in its session** is the x value; pass performance is the y value.

| Form                                                                                             | Answers for the user                                                    |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| A. Scatter: x = moving time before the pass, y = pass moving time                                | "How much slower am I here after 1 h, 2 h, 3 h in the saddle?"          |
| B. Scatter: x = kJ before the pass (power), y = pass moving time                                 | Same, in the unit the science uses; rides only, power only.             |
| C. Fresh vs late buckets (e.g. first 30 min vs after 90 min, or < 500 vs > 1000 kJ), two medians | "Late in a ride I'm X s (Y %) slower here", one number, no chart skill. |
| D. Durability ratio per pass over date: pass efficiency ÷ the session's first-30-min efficiency  | "Is my fatigue resistance improving over the seasons?" (a trend).       |
| E. Scatter: x = session TSS before the pass (`stressFromRecords` on the prefix)                  | Same as A/B but intensity-aware; needs FTP/HR thresholds in the worker. |

y could also be efficiency (W/bpm, m/beat) instead of moving time; it is closer to decoupling (output per heartbeat drops with fatigue) but needs HR on both the pass and, for D, the session start.

## 3. Data and pitfalls

- **Power:** B and the W/bpm variant need power on the whole prefix of the session, not just the pass; passes with power gaps (coverage < 90 %, the rule `energy.ts` uses as `MIN_ENERGY_COVERAGE`) get no dot. Moving time before the pass exists for every session with records.
- **Runs:** running kJ (Stryd) is rare and not comparable to cycling kJ; moving time (or distance) before the pass works for runs as for rides. Short run segments (< 2 min) mostly measure pacing, not fatigue.
- **No spread:** a segment always ridden in the first 10 min of every ride (the climb out of the village) puts every dot at the left edge: no answer, just a vertical stripe. Same for a segment that is the last stretch home. A minimum spread is needed, e.g. prior moving time spans ≥ 60 min **and** ≥ 3 passes on each side of the midpoint.
- **Confounders:** direction of the ride (outbound fresh vs homebound tired with other wind), pacing intent (an easy roll home looks like fatigue), café stops before the pass (partial recovery; moving time counts the stop as nothing), afternoon heat (HR drift is heat as much as fatigue), group vs solo, traffic. The chart shows the association, never the cause; the caption must say "before the pass", not "fatigue".
- **HR lag:** HR needs 1–3 min to settle; on short passes W/bpm is mostly lag. Pass time is not affected.
- **How many passes:** with 2–4 passes a scatter is noise; buckets need ≥ 3 per bucket for a median that one bad day does not move (the same "absorbs outliers" argument as the rolling median of 5, `research/trend-line.md` §2).

## 4. Cost

- **Worker:** the efficiency worker already loads every session's records once and caches them per session (`apps/web/src/lib/analysis/segmentPassAverages.ts:28`, `averagesOfPasses`). Adding the prefix load there costs one extra pass over records that are already in memory: no new I/O, no storage, no matcher bump.
- **Engine:** one pure function beside `segmentPassAverages` (`packages/engine/src/segments.ts:611`), e.g. `segmentPassLoadBefore({ records, startTimestampSec })` → `{ movingSecBefore, workKilojoulesBefore }`: moving time = sum of `activeDurationSec` over `isMovingPair` pairs (`packages/engine/src/recordPairs.ts:5`, `:17`) with timestamp < pass start; work = Σ power × activeDurationSec / 1000, `undefined` below 90 % power coverage. Distance before = `distance` at the pass start record.
- **Contract:** two nullable fields on `passAveragesSchema` (`apps/web/src/lib/workers/segmentPassAveragesContract.ts:18`).
- **E (TSS before):** `stressFromRecords` (`packages/engine/src/stress.ts:235`) on the prefix works but needs FTP and HR thresholds sent to the worker; more weight than v1 needs.
- **D:** needs efficiency of the session's first 30 min per pass: same loop, one more window; the chart is a second date trend.
- **Chart:** the existing layout is date-based (`apps/web/src/components/segments/report/trendChart.ts:59`, `xRatioOf`, horizontal scroll at ≥ 9 px per pass). A/B need a numeric x (0 … max prior time) and no scroll; the dot tones (`TrendDotTone`, `trendChart.ts:18`), y labels and dot buttons can be reused. C is a small text row or two dashes, no new layout.

## 5. Fit with v1

- Colours as the other charts: selected white, best amber, others muted sport colour; tapping a dot selects the pass (shared selection, Q8).
- **No rolling median** over prior work (passes ordered by x are not a time series); instead two short dashed lines at the fresh and late bucket medians, each spanning its bucket, with the gap as the y label ("+35 s late").
- x labels: "0", "1 h", "2 h", "3 h" (moving time). Section title "Fatigue" / "Ermüdung"; caption "Pass time by moving time before the pass" / "Durchgangszeit nach Bewegungszeit vor dem Durchgang".
- 390 px: x spans the card width, no scroll; 140 px plot height as the trends (`trendChart.ts:3`). 100 passes cluster but stay tappable at 6 px dots only if spread; dense clusters at x = 0 overlap.

## 6. Recommendation

**A + C combined, moving time as x for every sport**: a scatter of pass moving time against moving time before the pass, with the fresh (first 30 min) and late (after 90 min) medians as dashes and the difference as the one number. One axis for rides and runs, no power or HR needed, every pass gets a dot, the number answers the question without reading the scatter. kJ (B) is the science's unit, but it drops runs and every no-power ride and makes the axis differ by segment; it can follow later as a toggle. With too little spread the section shows its title and "All passes start at a similar point in the session" in place of the chart (or is left out; see FQ3).

Worked example used below: a 4 km climb, 20 passes. 9 passes on the way out, 10–25 min into the ride (~150 kJ), moving time median 9:00, 1.45 W/bpm; 8 passes on the way home, 2:00–2:40 into the ride (~1500–1900 kJ), median 9:35, 1.32 W/bpm; 3 passes at ~1 h.

## 7. Options for the owner (recommendation first)

**FQ1 · Which fatigue chart in v1?** Context: the science measures "performance after prior work" (kJ for rides, decoupling for runs); a segment gives the same course fresh and tired.

(a) **Scatter over moving time before the pass, fresh and late medians as dashes (recommended).** Rides and runs alike, every pass a dot. Example: dots left at 10–25 min around 9:00, right at 2–2:40 h around 9:35; y label "+35 s late". A segment always ridden in the first 10 min has no answer (FQ3).

```
faster ┤ ·•·  ---          ·
       ┤  ··             · ·─── +35 s
slower ┤                ··  ·
       0     1 h     2 h     3 h   (moving time before the pass)
```

(b) **Same scatter over kJ before the pass when any pass has power, otherwise moving time** (mirrors the efficiency rule "power when any has it"). Example: x 0–2000 kJ, same shape. Runs and no-power rides fall back to time, so the axis unit changes per segment; passes with power gaps lose their dot.

(c) **No chart, one row: fresh vs late medians.** "First 30 min: 9:00 (9 passes) · after 90 min: 9:35 (8 passes) · +6 %". Cheapest, clearest; hides the 3 passes in between and gives nothing to tap.

```
First 30 min   9:00  ▮▮▮▮▮▮▮▮▮     9 passes
After 90 min   9:35  ▮▮▮▮▮▮▮▮      8 passes   +35 s (+6 %)
```

**FQ2 · y value?** (a) **moving time, as Pass times (recommended):** every pass has it, needs no HR, answers "slower when tired"; in the example +35 s. (b) **efficiency (W/bpm or m/beat), as the Efficiency chart:** closer to decoupling, separates "rode easy home" (both drop) from "tired" (only output per beat drops); in the example 1.45 → 1.32 (−9 %); passes without HR lose their dot, short passes suffer from HR lag.

**FQ3 · Segments with no spread in prior work?** Example: a climb at minute 5–12 of every ride, 30 passes all at the left edge. (a) **section shows its title and "All passes start at a similar point in the session" (recommended):** the user sees why there is no chart. (b) section left out below the spread rule (≥ 60 min span and ≥ 3 passes each side): calmer, but the section appears and disappears per segment and filter. (c) draw the stripe anyway: honest but reads as a broken chart. Runs behave the same (time axis); a run segment at km 1 of every run lands in (a).

## Sources

1. Maunder, Seiler, Mildenhall, Kilding, Plews (2021), "The Importance of 'Durability' in the Physiological Profiling of Endurance Athletes", Sports Med 51:1619–1628: https://www.proquest.com/docview/2555434891
2. CTS podcast, "The science of training your durability and fatigue resistance": https://trainright.buzzsprout.com/813266/episodes/15275108-the-science-of-training-your-durability-and-fatigue-resistance
3. Spragg et al., "The relationship between training characteristics and durability in professional cyclists across a competitive season", Eur J Sport Sci: https://www.aminer.org/pub/622341975aee126c0f0d34b2 ; Rouleur summary: https://www.rouleur.cc/blogs/rouleur-performance/the-stoicism-of-peak-performance-how-the-world-s-best-race-strong-from-january-to-october
4. "Enhanced durability predicts success in amateur road cycling" (2025): https://open.uni-marburg.de/entities/article/9a9ccafa-8da2-4bc5-b236-f5b052a6c763
5. "Reliability of the durability concept in professional cyclists: a field-based study": https://abacus.universidadeuropea.com/entities/publication/bc1f0ce3-31de-44e3-bff1-f0e16864177f/full
6. Systematic review, "Is intensity the most important factor in determining the amount of prior work accumulated that affects cyclists' acute durability?": https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12881052/
7. Hunter & Muniz-Pumares (2025), London Marathon decoupling: https://repository.londonmet.ac.uk/10900/1/ejsc.70073.pdf
8. Frontiers Sports Act Living (2025), marathon durability field data: https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2025.1571498/full
9. intervals.icu forum, "Fatigue resistance": https://forum.intervals.icu/t/fatigue-resistance/4396
10. intervals.icu forum, "Power curve after kj/kg": https://forum.intervals.icu/t/power-curve-after-kj-kg/93688
11. TrainingPeaks, "WKO4 training metrics: introducing Stamina": https://www.trainingpeaks.com/blog/wko4-training-metrics-introducing-stamina/
12. Xert help, "Durability Metric Setting": https://baronbiosys.zendesk.com/hc/en-us/articles/43770182120973-Durability-Metric-Setting
13. Xert forum, "Lets talk about DURABILITY": https://forum.xertonline.com/t/lets-talk-about-durability/47625
14. TrainingPeaks, "Aerobic endurance and decoupling" (Friel): https://www.trainingpeaks.com/blog/aerobic-endurance-and-decoupling/

Forum posts (9, 10, 13) are user and developer statements, not documentation; the Spragg publication year differs between sources (2022/2023).
