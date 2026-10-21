---
title: 3D session map
status: idea
created: 2026-10-19
type: feature
areas: [app]
next: 'Owner decides: explore the UI or plan directly'
---

# 3D map on the session details page

## Idea

A 3D map on the session details page. Today pitch and rotate are off (`apps/web/src/features/map/MapBackground.tsx:85-87`), and the map is the one shared background for every route. 3D terrain needs DEM tiles, a fourth external service beyond the three `apps/web/CLAUDE.md` allows; without it only a 3D path from record elevation (deck.gl) is possible.

## Open questions
