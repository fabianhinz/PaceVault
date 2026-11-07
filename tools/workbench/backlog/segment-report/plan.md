---
title: Segment report
status: exploring
created: 2026-11-05
type: feature
areas: [app]
next: 'Parked until session-segments is accepted; then owner reviews the first wireframes and answers Q1–Q8'
---

# Report tab on the segment page with analyses across all passes

## Idea

The segment page compares one pass against the best only (`apps/web/src/components/segments/SegmentDetail.tsx:39`, `SegmentChartsExplorer`). A Report tab on the segment page adds analyses that look at all passes of the segment at once.

Research: `research/report-analyses.md`. First wireframes: `mockup/index.html` (variants L1 Progress, L2 Standing, L3 Body, L4 Splits, L5 Full report).

## Open questions

- **Q1** · open · Tab structure on the segment page? (a) `Passes · Report` tabs under the header, floating `PvTabsList` as on the dashboard (b) no tabs, the report cards follow the explorer on one page (c) a small segmented control in the strip card's header
- **Q2** · open · Which time does the report use? (a) wait for R80 and use moving time (b) elapsed now, as the strip does, and switch with R80 (c) both, moving time shown below elapsed
- **Q3** · open · Axes on the Pass times trend? (a) none, as on the old scatter (b) year labels on x, only best and median labels on y (c) full axes
- **Q4** · open · Analyses that read records (efficiency, splits)? (a) computed in a worker when the Report tab opens, skeleton until done (b) per-pass summaries stored at match time, matcher version bump (c) not in v1
- **Q5** · open · Conditions (temperature, wind) need weather for up to 100 sessions? (a) only passes with cached weather, the rest `--` (b) fetch on tab open (c) not in v1
- **Q6** · open · Segments with 1 pass (and 2–3)? (a) Report tab disabled below 2 passes (b) tab always on, note "The report needs at least 2 passes", sections that need more show `--` (c) tab hidden with 1 pass
- **Q7** · open · Dashboard filters? (a) the report follows the filter like the rest of the segment page (b) always every pass
- **Q8** · open · Tapping a pass in the report? (a) switches to Passes with that pass selected (b) opens its session (c) nothing, read-only
