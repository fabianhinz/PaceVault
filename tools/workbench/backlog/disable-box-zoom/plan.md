---
title: No box zoom
status: exploring
created: 2026-10-23
type: chore
areas: [app]
next: 'Built in session-3d-map review round 2 (R3, boxZoom off on the shared map); owner closes it once session-3d-map is accepted'
size: small
---

# Disable Shift + drag box zoom on the map

## Idea

Shift + left-drag draws a rectangle and zooms into it: MapLibre's `boxZoom`, on by default because `MapGL` in `apps/web/src/features/map/MapBackground.tsx:71-92` does not set it. Turn it off (`boxZoom={false}`) on the shared map. Owner: "this shift+left click and drag to highlight an area and zoom in, this is something i want to disable in the map (looks like a default)".

## Open questions
