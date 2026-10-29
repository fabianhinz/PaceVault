---
title: Light theme
status: exploring
created: 2026-10-25
type: feature
areas: [ui, app]
next: 'Owner reviews the mockup and answers Q1–Q12'
---

# A light theme that stays readable outdoors on a phone

## Idea

The app is dark mode only (`packages/ui/CLAUDE.md:4`, tokens in `packages/ui/src/theme.css`, dark basemap in `apps/web/src/features/map/MapBackground.tsx:77`). In sunlight on a phone the dark UI is hard to read. A light (white) theme with high contrast should fix that. Owner: research first, then several mockups; no questions before a mockup exists.

## Open questions

- **Q1** · open · Which light palette? (a) C sunlight: white, near-black text #0a0b0f, darker 700/800 accents, solid #8b8f9a borders (b) A pure white: white page and cards, #111318 text, 1 px #e5e7eb borders (c) B off-white page #f5f4f0 with white cards, no borders.
- **Q2** · open · Map in the light theme? (a) follows the UI: CARTO voyager, darker track colours, multiply blending (b) light UI over the dark map as today (c) separate map setting.
- **Q3** · open · How is the theme chosen? (a) Settings › Display: System / Light / Dark (b) (a) plus a one-tap sun/moon button in the header (c) (a) plus "Auto (sun)": light between sunrise and sunset from the last known position.
- **Q4** · open · Default on a fresh install? (a) follow the phone (b) light (c) dark as today.
- **Q5** · open · Overlapping tracks on a light map? (a) multiply blending: overlaps darken (b) plain alpha with a higher floor (c) full-opacity lines without heat.
- **Q6** · open · Order of work? (a) first a pixel-identical dark-only refactor that replaces the ~111 raw `white/N` classes with overlay tokens, then the light theme (b) one item.
- **Q7** · open · Lift the dark theme's grey text to the outdoor targets too? (a) separate item (b) in this item (c) no.
- **Q8** · open · Surfaces in the light theme? (a) opaque white (as C) (b) translucent white 85–94 % with blur (A, A over the dark map) (c) today's 55 % glass with light values.
- **Q9** · open · Casing of the selected session/lap track on voyager? (a) dark casing in the sport hue (#14532d / #7c2d12) (b) white halo with a 1 px dark edge (c) no casing.
- **Q10** · open · Hillshade on the light 3D map (voyager draped on terrain, `apps/web/src/features/map/mapStyle.ts:36-41`)? (a) warm brown shadow #5a4a3a, lower exaggeration (b) black as today (c) off.
- **Q11** · open · Unselected laps while one lap is selected, on voyager? (a) lower opacity (≈ 0.45) instead of darkening (b) lighten toward the land colour (c) darken RGB × 0.8 as today (`apps/web/src/features/map/lapPath.ts:9-14`).
- **Q12** · open · Sky/horizon in the 3D view? (a) a sky per theme (light: #d3e3eb → #f4f1ea with fog) (b) light only, dark stays without sky (c) none, as today.
