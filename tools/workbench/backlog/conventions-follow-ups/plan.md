---
title: Conventions follow-ups
status: idea
created: 2026-10-23
type: chore
areas: [app, ui, engine, gpx, docs, workbench]
next: 'Collects open points during conventions-migration; owner decides afterwards: plan the follow-ups directly or split them'
---

# Bugs and API-shape follow-ups found while planning the conventions migration

## Idea

23 points left out of the conventions migration (`docs/conventions/plans/`): possible bugs (UTC date in the GPX export filename, route named after its first waypoint on re-import, non-token colours passed into kit props, a lap hover that may stay set after leaving 3D), the deferred engine throws, workbench hook and parser quirks, the `crashSignal` singleton, `DOMParser` in gpx, dead exports and a typeof guard in the 3D map code, and invisible API-shape changes (`null` vs `undefined`, `'default'` variant members, query-param keys).
Each point with what, user impact and options: `research/open-points.md`. Points that come up open or unsure while `conventions-migration` is implemented are added there too (owner, 2026-10-25).

## Open questions
