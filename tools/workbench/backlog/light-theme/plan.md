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

The app is dark mode only (`packages/ui/CLAUDE.md:4`, tokens in `packages/ui/src/theme.css`, dark basemap in `apps/web/src/components/mapBackground/index.tsx:44`). In sunlight on a phone the dark UI is hard to read. A light (white) theme with high contrast should fix that. Owner: research first, then several mockups; no questions before a mockup exists.

Map tile pipeline (CARTO 2D, Mapterhorn 3D) and what the Voyager style needs: `research/map-tiles.md` (2026-11-07).

## Open questions

- **Q1** · answered 2026-11-07 · Which light palette? (a) C sunlight: white, near-black text #0a0b0f, darker 700/800 accents, solid #8b8f9a borders (b) A pure white: white page and cards, #111318 text, 1 px #e5e7eb borders (c) B off-white page #f5f4f0 with white cards, no borders. → (b) A pure white. Owner: "A pure white"
- **Q2** · answered 2026-11-07 · Map in the light theme? (a) follows the UI: CARTO voyager, darker track colours, multiply blending (b) light UI over the dark map as today (c) separate map setting. → (a) follows the UI: CARTO voyager. Owner: "Follows the UI"
- **Q3** · answered 2026-11-07 · How is the theme chosen? (a) Settings › Display: System / Light / Dark (b) (a) plus a one-tap sun/moon button in the header (c) (a) plus "Auto (sun)": light between sunrise and sunset from the last known position. → (a) Settings › Display only, as a PvListItem with a PvSelect (System / Light / Dark) next to the language row (`apps/web/src/components/settings/index.tsx:65-81`); no header button, no Auto (sun). Owner: "settings, similar to our language selection"
- **Q4** · answered 2026-11-07 · Default on a fresh install? (a) follow the phone (b) light (c) dark as today. → (a) follow the phone (System). Owner: "Follow the phone"
- **Q5** · answered 2026-11-07 · Overlapping tracks on a light map? (a) multiply blending: overlaps darken (b) plain alpha with a higher floor (c) full-opacity lines without heat. → (a) multiply blending. Owner: "Multiply: overlaps darken"
- **Q6** · answered 2026-11-07 · Order of work? (a) first a pixel-identical dark-only refactor that replaces the ~111 raw `white/N` classes with overlay tokens, then the light theme (b) one item. → (a) refactor step first, pixel-identical in dark, then the light theme (both steps in the worktree). Owner: "Refactor step first"
- **Q7** · answered 2026-11-07 · Lift the dark theme's grey text to the outdoor targets too? (a) separate item (b) in this item (c) no. → (b) in this item. Owner: "In this item"
- **Q8** · answered 2026-11-07 · Surfaces in the light theme? (a) opaque white (as C) (b) translucent white 85–94 % with blur (A, A over the dark map) (c) today's 55 % glass with light values. → (a) opaque white. Owner: "Opaque white"
- **Q9** · answered 2026-11-07 · Casing of the selected session/lap track on voyager? (a) dark casing in the sport hue (#14532d / #7c2d12) (b) white halo with a 1 px dark edge (c) no casing. → (b) white halo with a 1 px dark edge. Owner: "White halo + 1 px dark edge"
- **Q10** · answered 2026-11-07 · Hillshade on the light 3D map (voyager draped on terrain, `apps/web/src/components/mapBackground/mapStyle.ts:37-42`; today's `#ffffff1a` highlight is invisible on a light ground)? (a) warm brown shadow #5a4a3a, lower exaggeration (b) black as today (c) off. → (a) warm brown #5a4a3a, highlight #ffffff59, exaggeration 0.35. Owner: "Warm brown, softer"
- **Q11** · answered 2026-11-07 · Unselected laps while one lap is selected, on voyager? (a) lower opacity (≈ 0.45) instead of darkening (b) lighten toward the land colour (c) darken RGB × 0.8 as today (`apps/web/src/components/mapBackground/lapPath.ts:16-19`, `trackColors.ts:33`). → (a) lower opacity ≈ 0.45. Owner: "Lower opacity ≈ 0.45"
- **Q12** · answered 2026-11-07 · Sky/horizon in the 3D view? (a) a sky per theme (light: #d3e3eb → #f4f1ea with fog) (b) light only, dark stays without sky (c) none, as today. → (a) a sky per theme. Owner: "Sky per theme"
- **Q13** · answered 2026-11-07 · Sport colours in the light theme (today running #4ade80 and cycling #f97316, 1.64:1 and 2.65:1 on the voyager land colour, research/light-palette.md §1)? (a) darker 600/700 variants per theme (running #16a34a/#15803d, cycling #ea580c), identity by hue (b) keep today's bright swatches everywhere and add a dark casing. → (a) darker 600/700 variants (palette A: running #16a34a, cycling #ea580c). Owner: "Darker variants"
- **Q14** · answered 2026-11-07 · Workbench board and README banner (both import `packages/ui/src/theme.css` / `tokens.ts`)? (a) stay dark, out of scope (b) follow the theme. → (a) stay dark, out of scope. Owner: "Stay dark"
- **Q15** · answered 2026-11-07 · How much are the dark theme's greys lifted (follow-up to Q7; today secondary gray-300, tertiary gray-400, quaternary gray-500, `packages/ui/src/theme.css:72-74`)? (a) one step lighter each: gray-200 / gray-300 / gray-400 (b) only tertiary and quaternary (c) only quaternary. → (a) one step lighter each. Owner: "One step lighter"
- **Q16** · answered 2026-11-07 · Chart, zone, precipitation and wind colours in the light theme? (a) take the palette A values from research/light-palette.md §4 and §6 (zones #2563eb #059669 #d97706 #ea580c #dc2626, wind #059669 #d97706 #dc2626) (b) a separate questionnaire first. → (a) take the research values. Owner: "Take research values"
- **Q17** · answered 2026-11-07 · What happens when the theme changes while the app is open (Settings or a System change)? (a) switch live, every memoised map layer depends on the theme (b) reload the page. → (b) reload on switch. Owner: "Reload on switch"
