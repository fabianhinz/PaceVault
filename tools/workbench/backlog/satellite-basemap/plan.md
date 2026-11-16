---
title: Satellite basemap
status: idea
created: 2026-11-07
type: feature
areas: [app]
next: 'Owner decides: research providers first (terms, offline, cost), then explore'
---

# Satellite imagery as a basemap option

## Idea

Offer satellite imagery as an alternative basemap to CARTO's vector map (`apps/web/src/components/mapBackground/index.tsx:44`); CARTO has no satellite tiles. Candidates: MapTiler Satellite, Esri World Imagery, Mapbox Satellite, Google Map Tiles API (EOX Sentinel-2 cloudless is free but about 10 m per pixel, too coarse for trails). A fifth external service must be opt-in or lazy under the local-first rule (`apps/web/CLAUDE.md:28`), and most providers forbid long-term caching, so satellite likely works online only. Needs research on terms, offline caching, cost and MapLibre compatibility first.

## Open questions
