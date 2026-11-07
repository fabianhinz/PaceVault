---
title: Terrain exaggeration
status: idea
created: 2026-11-04
type: feature
areas: [app]
next: 'Owner decides: explore the UI or plan directly'
---

# Control the 3D terrain exaggeration

## Idea

The 3D terrain is drawn with a fixed exaggeration of 1 (`apps/web/src/components/mapBackground/hooks/useMapTerrainEffect.ts:9`, applied at `:42`). The user picks it with a small slider control from 1 (lowest) to 3 (highest), built like the split distance control (`apps/web/src/components/sessions/session/SplitSlider.tsx:16`, `PvSlider`; reference `research/split-slider-reference.png`).

## Open questions
