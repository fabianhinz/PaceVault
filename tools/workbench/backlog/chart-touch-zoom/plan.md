---
title: Touch chart zoom
status: idea
created: 2026-11-03
type: feature
areas: [app, ui]
next: 'Owner decides: explore the UI or plan directly'
---

# Zoom the charts on touch devices

## Idea

Charts can only be zoomed by a mouse drag today (`apps/web/src/components/sessions/charts/SessionChartsExplorer.tsx:351`), so phone users cannot zoom, and cannot "Save as segment" from a range (session-segments Q99, deferred). Idea: range handles sitting on both ends of each chart's x axis that touch users drag to narrow the range, like `research/range-handles-reference.png`.

## Open questions
