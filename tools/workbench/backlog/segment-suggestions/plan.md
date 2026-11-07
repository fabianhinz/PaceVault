---
title: Segment suggestions
status: exploring
created: 2026-11-03
type: feature
areas: [app, engine]
next: 'Parked until session-segments is accepted; then owner reviews the first wireframes and answers Q1–Q11'
---

# Suggest segments to create

## Idea

With user-created segments (session-segments Q95) every segment is made by hand, which gets repetitive. Suggest stretches the user rides often (e.g. from the overlap detection researched in `research/overlap-detection.md` and its `research/detect-bench/`, moved here from `session-segments`) so they can be saved as segments in one step. Spun off from `session-segments`.

Entry point: a primary action button under the Segments tab's empty-state card (`apps/web/src/components/segments/SegmentsEmpty.tsx:7-17`), like "Create tour" under the Tours card (`apps/web/src/components/trips/TripsTab.tsx:22-35`). Owner: "the primary action button i want for the \"segment suggestions\" item in the workbench"

Carried over from `session-segments` R50: measure segment matching on real data (first save, Segments tab after an import, desktop and phone; cold run with `localStorage.setItem('pv:debug:segments','cold')`, warm with `'log'`, read `copy(pvDebug.segmentMetrics())`; method in `research/matching-metrics.md` §4) and decide whether the debug surface (`window.pvSegmentMetrics`, the console log, `pv:debug:segments`) stays. Owner: "lets revisit this once we tackle the segment suggestion item"

Research: `research/suggestions.md`. First wireframes: `mockup/index.html` (variants A review dialog, B map review, C one by one, D inline in tab; extra E: detection in the background).

## Open questions

- **Q1** · open · How are suggestions presented? (a) review dialog with checkboxes and map thumbnails (b) map review with numbered markers, list in the column (c) one by one, a card with prefilled name, Skip and Save (d) inline rows in the Segments tab under the empty card
- **Q2** · open · When does detection run? (a) on button press with progress, cached until sessions or segments change (b) on press, never cached (c) in the background after each import, the button shows the count ("Review 15 suggestions")
- **Q3** · open · The button once segments exist? (a) stays below the list, like "Create tour" (b) smaller secondary button above the list (c) only in the empty state (d) suggestions always inline under the segments, no button
- **Q4** · open · Accepting and naming? (a) batch save, names prefilled from source session + km range ("Evening Run · km 0.6–3.0") (b) one name dialog per save (existing SegmentNameDialog) (c) batch save with a neutral name ("Running · 2.4 km")
- **Q5** · open · Adjust start and end before saving? (a) no, save as found (b) open the source session's charts with the range preselected (c) drag handles on the map
- **Q6** · open · Dismissed suggestions? (a) remembered and never suggested again (b) hidden until the next run (c) remembered, with "Show dismissed"
- **Q7** · open · Direction? (a) each direction is its own suggestion (b) one per stretch in the more frequent direction (c) one counting both directions, saved in the more frequent one
- **Q8** · open · Minimums, ranking and count? (a) ≥ 3 passes, ≥ 300 m running / 1 km cycling, ranked by passes × length × recency, top 15 + show more (b) the same, every result listed (c) only stretches with a pass in the last 12 months
- **Q9** · open · Stretches at the usual start (home street)? (a) like any stretch (b) ranked down (c) first and last ~300 m of every session left out
- **Q10** · open · Overlapping and nested stretches? (a) no two suggestions share more than 20 % of their length (b) nested allowed, partial overlaps not (c) all allowed, ranked
- **Q11** · open · Detect on stored polylines or full records? (a) polylines only, ~0.3–0.7 s desktop / 1–4 s phone (estimate), pass counts approximate until saved (b) full records, exact counts, about +1.6 s desktop / +5–8 s phone, memory risk
