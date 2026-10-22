---
title: First-fit fixes
status: idea
created: 2026-10-22
type: bug
areas: [app]
next: 'Owner decides: plan directly (item-plan)'
---

# Camera, onboarding and GPS-worker fixes from the first-fit notes

## Idea

Three bugs found on 2026-10-21 next to the startup loader (spun off from `startup-loader`, Q20): overview, trip and session fits set no `maxZoom`, so zero-area bounds (an indoor session with a GPS lock) zoom to MapLibre's 22 (`apps/web/src/features/map/hooks/useMapCameraEffect.ts:57-69`); Delete all data doesn't reset the onboarding store, so a second onboarding resumes at the old step; a GPS worker error leaves the map without tracks until a reload (`apps/web/src/features/map/hooks/useGpsBackfill.ts:51-54`).

## Open questions
