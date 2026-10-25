# Light palette: tokens, map, charts, migration size

Research for `light-theme` (status `exploring`). It informs the decision; it decides nothing. All contrast numbers are WCAG 2.x relative-luminance ratios, computed from the hex values (script logic: sRGB → linear → `(L1+0.05)/(L2+0.05)`). Thresholds: text 4.5:1 (WCAG 1.4.3), non-text UI and graphics 3:1 (WCAG 1.4.11) [W3C-143] [W3C-1411].

## 1. Summary

- **Most of the UI flips for free.** 198 semantic-token utility uses in 59 files (`bg-surface`, `text-text-*`, `bg-status-*`, …) read CSS variables; redefining those variables under a light selector changes them all.
- **The real work is the 111 raw `white`/`black` overlays in 55 files**, the white `rgba(...)`/`#fff` literals in chart SVGs, the JS mirror `tokens.ts` (24 app consumers) and the map.
- **The map is the riskiest part, for a technical reason, not a colour one:** tracks are drawn with additive blending (`apps/web/src/features/map/trackColors.ts:4-11`, used at `DeckGLOverlay.tsx:197` and `hooks/useOnboardingPreviewLayer.ts:57`). Additive blending on a near-white basemap saturates to white: tracks disappear. A light map needs a different blend mode, not only different colours.
- **`#4ade80` running green does not hold on voyager**: 1.64:1 at full opacity, 1.19:1 at the default `faint` alpha (80/255). Cycling `#f97316`: 2.65:1 full, 1.37:1 faint. Both need darker light-mode variants and a higher alpha floor.
- **Zone colours live in the engine** (`packages/engine/src/zones.ts:13-17`, `zoneDistribution.ts:8-49`); Z1–Z3 (`#60a5fa`, `#34d399`, `#fbbf24`) fall to 2.54 / 1.92 / 1.67 on white. A per-theme zone palette needs the colour mapping moved to the app first (which the TDR `engine-holds-domain-logic-only` already asks for).

## 2. Comparable products

| Product | What is known | Source |
| --- | --- | --- |
| Strava | Basemap is reduced and "lightened slightly" so the athlete's route stays in front; the route is a single orange line (`#FC4C02`), constant width, round caps/joins. A white casing is **unverified** (no source found). | [MAPBOX-STRAVA] (snippet; page returned 403 to fetch), [CROSLEY] (third-party reconstruction, treat values as unverified), [RUNMAG-STATMAPS] |
| Strava heatmap | Offers several heat colour ramps (hot, blue, purple, gray, bluered); started on a black basemap with a yellow-to-red ramp; satellite/winter styles added later. Whether ramps differ per basemap is **unverified**. | [OSMWIKI-STRAVA], [ANDROIDAUTH-HEATMAP] |
| Komoot | Route edge style encodes surface (solid edge = firm surface, dashed = loose). 2025 redesign changed palette/fonts; line colours not documented. Casing width **unverified**. | [BIKETRAILS-KOMOOT], [KOMOOT-REDESIGN] |
| Garmin Connect (app) | Dark is the default; Light / Dark / System theme picker since Sept 2023 (More → Settings → Theme). Track colour in the app **unverified**; Garmin devices have a user "Track Color" setting. | [WAREABLE-GARMIN] (search snippet; page 403), [GARMIN-MAPSETTINGS] |
| intervals.icu | Light is the default theme, dark was added later; users note dark uses "more vivid colours, especially on the fitness chart" and light-only bugs (hover, invisible sort arrows with background-coloured buttons). | [ICU-DARKMODE] |
| Light-map line rendering in general | A casing (a wider line drawn beneath the route) gives a border effect; subtractive blending "darkens overlapping objects … useful for highlighting density on light maps", where additive is the dark-map counterpart. | [MAPBOX-CASING], [RDECK] |
| Charts with CSS-variable colours | Recharts props take `fill="var(--color-x)"`; light/dark values are set on `:root` / `.dark`, so the chart switches with no JS. | [SHADCN-CHART] |

Pattern across the products: the track is the most saturated element on a muted basemap, drawn at full opacity in one strong hue; on light maps nobody relies on additive glow. Precise line widths and halos for Strava, Komoot and Garmin could not be sourced and stay **unverified**.

## 3. Token strategy

| Option | How | Effort | Risk |
| --- | --- | --- | --- |
| **(a) Same names, light values under a selector** | Keep `@theme` (not `@theme inline`, so utilities emit `var(--color-…)`; today's file uses plain `@theme`, `packages/ui/src/theme.css:7`). Add `[data-theme=light] { --color-surface: …; … }` in `@layer base`, plus `@custom-variant light (&:where([data-theme=light], [data-theme=light] *));` for rare one-off overrides [TW-DARKMODE]. Opacity modifiers (`bg-surface/55`) compile to `color-mix()` over the variable, so they switch too. | Low: one block of ~60 declarations in `theme.css`. | Low. Trap: do **not** flip the `gray-*` scale itself (cheap "invert" trick): `gray-*` is also used as an absolute colour (`index.css` scrollbar, `index.html:21` `text-gray-100`, `Label.tsx:13` `text-gray-300`), and sport/status must not invert. Redefine only the semantic tokens. |
| **(b) Semantic overlay tokens replace `white/N`** | New tokens, e.g. `--color-overlay-subtle` (dark `rgb(255 255 255 / 0.05)`, light `rgb(0 0 0 / 0.04)`), `--color-overlay` (white/10 → black/0.06), `--color-overlay-strong` (white/15–20 → black/0.10), `--color-border-subtle` (white/10 → black/0.08 or `#e5e7eb`), `--color-on-accent` (`#fff` in both), `--color-scrim` (black/40 both), `--color-shadow-floating`. Dark values written as `rgb(255 255 255 / 0.05)` keep the TDR "no pixel changes" rule exact (`#ffffff0d` would be 5.1 %, not 5 %). | Medium: 111 class edits in 55 files, mostly mechanical (§6). Can land as a dark-only, pixel-identical refactor **before** any light value exists. | Low–medium: mechanical, but each site needs a judgement (hover state vs. divider vs. selected fill) to map to the right semantic token. Five classes of use cover >80 % of hits. |
| **(c1) JS mirror as per-theme records** | `tokens.ts` becomes `tokensByTheme: Record<Theme, {...}>` plus a `useThemeTokens()` hook reading the theme from the store; module-level constants built from tokens (`TERRAIN_HILLSHADE_PAINT` `mapStyle.ts:36-41`, `statusFill` `lib/statusColors.ts:13`, `sportTrackColor` `trackColors.ts:32`, `ZONE_PALETTES`) become functions of the theme. | Medium–high: 24 consumer files, plus every memoised deck.gl layer must depend on the theme. | Medium: a missed `useMemo` dependency leaves a layer in the old colours until reload. |
| **(c2) Charts read CSS variables directly** | Recharts/SVG get `stroke="var(--color-chart-hr)"` strings instead of hex [SHADCN-CHART]; no hook, no re-render. JS keeps hex only where a real colour value is needed (deck.gl RGB arrays, MapLibre paint, d3 interpolation `scaleLinear().range([...])` in `lib/zoneColors.ts:43-46`, console styling). | Low per chart (~16 chart files). | Low for strokes/fills. Not usable where JS computes with the colour (d3 blends, gradients built in JS, deck.gl). |
| **(c3) Read CSS vars at runtime** | `getComputedStyle(document.documentElement).getPropertyValue('--color-x')` on theme change, converted to RGB for deck.gl. | Low code, one helper. | Medium: needs a re-read trigger on theme switch and a parser from CSS colour strings to RGB arrays (how `var()`/`color-mix()` chains come back from a custom property is browser-dependent; not verified here). Removes the second source of truth but drops testability (jsdom has no Tailwind cascade). |

Judgement: (a) + (b) are the foundation and low-risk; (b) can ship first as a dark-only refactor. For JS, a mix of (c2) for Recharts strokes/fills and (c1) for map, deck.gl and d3 scales keeps `tokens.ts` as the single JS source and avoids DOM reads.

Other theme-bound places outside the token files:

- `apps/web/index.html:2` `class="dark"`, `:11` `theme-color`, `:18` body background, `:21` `text-gray-100`.
- PWA manifest `theme_color`/`background_color` = `SURFACE_BASE` (`apps/web/vite.config.ts:83-84`, `packages/ui/src/lib/colors.ts:1`). The manifest is static; the launch splash keeps one colour. Status-bar colour can follow the theme with two `<meta name="theme-color" media="(prefers-color-scheme: …)">` tags or a JS update of the tag; `apple-mobile-web-app-status-bar-style` `black-translucent` (`index.html:12`) gives white status-bar text, unreadable over a light page.
- `apps/web/src/features/map/map-attribution.css:1-17`: black chip with white text (fine on both, heavy on light); `filter: invert(1)` on the button.
- Workbench board and README banner also import `tokens`/`theme.css` (`tools/workbench/site/src/lib/board.ts`, `tools/workbench/scripts/frontmatter.ts`, `tools/docs/banner/page/banner.css`): they stay dark unless chosen otherwise.

## 4. Palette proposals

Three characters. Reference: today's dark theme on `#111318` gives text-primary 15.01, tertiary 5.75, quaternary 3.00, border 1.26, accent 5.05.

Columns: contrast against the page (`surface-base`) and against a card (`surface`, `#ffffff` in all three). Role: **text** needs 4.5, **ui** (lines, fills, icons, tracks) needs 3, **deco** is never the only carrier of information. ⚠ marks a miss.

### Shared ideas behind all three

- Light values are the Tailwind 600/700 steps of today's 400/500 hues: same hue identity, darker so they hold on white. This mirrors intervals.icu's observation that dark themes carry "spicier" colours than light ones [ICU-DARKMODE].
- `status-*` (text) and `status-*-strong` (fills) swap roles: on dark the light shade is the text and the saturated one the fill; on light both darken and the text shade is the darker one.
- Surfaces separate by border and shadow, not by luminance steps (page/card in A is 1.00).
- `text-quaternary` stays decorative in A and B (3.2:1); in C it becomes readable (6.19).

### A: pure white

| Token | Hex | page | card | role |
| --- | --- | --- | --- | --- |
| surface-base | `#ffffff` | – | – | surface |
| surface-sunken | `#f3f4f6` | – | 1.10 sep. | surface |
| surface | `#ffffff` | – | – | surface |
| surface-elevated | `#ffffff` | – | – | surface (+ shadow) |
| surface-overlay | `#f3f4f6` | – | 1.10 sep. | surface |
| border | `#e5e7eb` | 1.24 | 1.24 | deco (same as dark today) |
| text-primary | `#111318` | 18.58 | 18.58 | text |
| text-secondary | `#3a3e48` | 10.70 | 10.70 | text |
| text-tertiary | `#5c616e` | 6.19 | 6.19 | text |
| text-quaternary | `#8b8f9a` | 3.23 | 3.23 | deco |
| accent | `#2563eb` | 5.17 | 5.17 | text (white on it: 5.17) |
| accent-hover | `#1d4ed8` | 6.70 | 6.70 | text |
| accent-strong | `#1e40af` | 8.72 | 8.72 | text |
| accent-muted | `#2563eb1f` | – | – | fill |
| status-success / -strong | `#15803d` / `#16a34a` | 5.02 / 3.30 | 5.02 / 3.30 | text / ui |
| status-warning / -strong | `#854d0e` / `#a16207` | 6.85 / 4.92 | same | text / ui |
| status-danger / -strong | `#dc2626` / `#ef4444` | 4.83 / 3.76 | same | text / ui |
| status-info | `#2563eb` | 5.17 | 5.17 | text |
| status-neutral | `#5c616e` | 6.19 | 6.19 | text |
| *-muted fills | same hue at `1f` (12 %) | – | – | fill |
| sport-running | `#16a34a` | 3.30 | 3.30 | ui |
| sport-cycling | `#ea580c` | 3.56 | 3.56 | ui |
| chart-fitness / power | `#2563eb` | 5.17 | 5.17 | ui |
| chart-fatigue / gap | `#db2777` | 4.60 | 4.60 | ui |
| chart-form | `#a16207` | 4.92 | 4.92 | ui (`#ca8a04` would be 2.94 ⚠) |
| chart-hr | `#dc2626` | 4.83 | 4.83 | ui |
| chart-speed | `#16a34a` | 3.30 | 3.30 | ui |
| chart-grade | `#7c3aed` | 5.70 | 5.70 | ui |
| chart-cadence | `#d97706` | 3.19 | 3.19 | ui |
| chart-elevation | `#6d28d9` | 7.10 | 7.10 | ui |
| chart-climb | `#8b5cf6` | 4.23 | 4.23 | ui |
| chart-pace | `#0891b2` | 3.68 | 3.68 | ui |
| precip-rain | `#2563eb` | 5.17 | 5.17 | ui |
| precip-freezing | `#0891b2` | 3.68 | 3.68 | ui |
| precip-snow | `#64748b` | 4.76 | 4.76 | ui (white snow is invisible on white) |
| precip-thunderstorm | `#d97706` | 3.19 | 3.19 | ui |

### B: off-white page, white cards

Warm page tone chosen to sit next to the voyager land colour `#fbf8f3`. Cards are white, so the card column equals A; the page column drops ~10 %. Changed from A where the page value missed its threshold.

| Token | Hex | page | card | role |
| --- | --- | --- | --- | --- |
| surface-base | `#f5f4f0` | – | 1.10 sep. | surface |
| surface-sunken | `#ebe9e4` | – | 1.21 sep. | surface |
| surface / surface-elevated | `#ffffff` | – | – | surface |
| surface-overlay | `#f0eee9` | – | 1.16 sep. | surface |
| border | `#e2e0da` | 1.20 | 1.32 | deco |
| text-primary | `#16181d` | 16.14 | 17.76 | text |
| text-secondary | `#3a3e48` | 9.72 | 10.70 | text |
| text-tertiary | `#5c616e` | 5.63 | 6.19 | text |
| text-quaternary | `#8b8f9a` | 2.94 | 3.23 | deco |
| accent / hover / strong | `#2563eb` / `#1d4ed8` / `#1e40af` | 4.70 / 6.09 / 7.93 | 5.17 / 6.70 / 8.72 | text |
| status-success / -strong | `#15803d` / `#15803d` | 4.56 / 4.56 | 5.02 / 5.02 | text / ui (A's `#16a34a`: 2.99 ⚠ on page) |
| status-warning / -strong | `#854d0e` / `#a16207` | 6.23 / 4.47 | 6.85 / 4.92 | text / ui |
| status-danger / -strong | `#b91c1c` / `#ef4444` | 5.88 / 3.42 | 6.47 / 3.76 | text / ui (A's `#dc2626`: 4.39 ⚠ on page) |
| status-info / neutral | `#2563eb` / `#5c616e` | 4.70 / 5.63 | 5.17 / 6.19 | text |
| sport-running | `#15803d` | 4.56 | 5.02 | ui (A's `#16a34a`: 2.99 ⚠ on page) |
| sport-cycling | `#ea580c` | 3.23 | 3.56 | ui |
| chart-* | as A, except speed `#15803d` (4.56), cadence `#b45309` (4.56) | ≥ 3.35 | ≥ 3.68 | ui (charts sit on cards; page column matters only for page-level sparklines) |
| precip-* | as A, except thunderstorm `#b45309` (4.56) | ≥ 3.35 | ≥ 3.68 | ui |

### C: high-contrast "sunlight"

Built for glare: near-black text, 700-step accents, borders that pass 3:1 so tiles stay outlined when the screen washes out.

| Token | Hex | page = card (`#ffffff`) | role |
| --- | --- | --- | --- |
| surface-base / surface / elevated | `#ffffff` | – | surface |
| surface-sunken | `#eceef1` | 1.16 sep. | surface |
| surface-overlay | `#e5e7eb` | 1.24 sep. | surface |
| border | `#8b8f9a` | 3.23 | ui (visible outline) |
| text-primary | `#0a0b0f` | 19.67 | text |
| text-secondary | `#252830` | 14.74 | text |
| text-tertiary | `#3a3e48` | 10.70 | text |
| text-quaternary | `#5c616e` | 6.19 | text (now readable) |
| accent / hover / strong | `#1d4ed8` / `#1e40af` / `#1e3a8a` | 6.70 / 8.72 / 10.36 | text (white on accent 6.70) |
| status-success / -strong | `#166534` / `#15803d` | 7.13 / 5.02 | text / ui |
| status-warning / -strong | `#854d0e` / `#a16207` | 6.85 / 4.92 | text / ui |
| status-danger / -strong | `#b91c1c` / `#dc2626` | 6.47 / 4.83 | text / ui |
| status-info / neutral | `#1d4ed8` / `#3a3e48` | 6.70 / 10.70 | text |
| sport-running / cycling | `#15803d` / `#c2410c` | 5.02 / 5.18 | ui |
| chart-fitness / power | `#1d4ed8` | 6.70 | ui |
| chart-fatigue / gap | `#be185d` | 6.04 | ui |
| chart-form | `#a16207` | 4.92 | ui |
| chart-hr | `#b91c1c` | 6.47 | ui |
| chart-speed | `#15803d` | 5.02 | ui |
| chart-grade | `#6d28d9` | 7.10 | ui |
| chart-cadence | `#b45309` | 5.02 | ui |
| chart-elevation | `#5b21b6` | 8.98 | ui |
| chart-climb | `#7c3aed` | 5.70 | ui |
| chart-pace | `#0e7490` | 5.36 | ui |
| precip-rain / freezing | `#1d4ed8` / `#0e7490` | 6.70 / 5.36 | ui |
| precip-snow / thunderstorm | `#475569` / `#b45309` | 7.58 / 5.02 | ui |

Trade-off: C loses the dark theme's colour "punch" (700 steps are muddier); A/B keep the brighter 600 steps but leave borders and quaternary text faint in sunlight.

### Overlay tokens (strategy b), light values for all characters

| Token | Replaces | Dark (exact today) | Light |
| --- | --- | --- | --- |
| overlay-subtle | `bg-white/5`, `fill-white/5` | `rgb(255 255 255 / 0.05)` | `rgb(0 0 0 / 0.04)` |
| overlay | `bg-white/10`, hover `white/10` | `rgb(255 255 255 / 0.10)` | `rgb(0 0 0 / 0.06)` |
| overlay-strong | `bg-white/12`, `/15`, `/20` | per alpha | `rgb(0 0 0 / 0.10)` |
| border-subtle | `border-white/10`, `divide-white/10`, `stroke-white/10` | `rgb(255 255 255 / 0.10)` | A/B `rgb(0 0 0 / 0.08)`; C uses `border` |
| border-strong | `border-white/20`, `/30`, `/40` | per alpha | `rgb(0 0 0 / 0.20)` (C: `#8b8f9a`) |
| on-accent | `text-white` on accent | `#ffffff` | `#ffffff` |
| knob | `bg-white` (Switch/Slider thumbs) | `#ffffff` | `#ffffff` + `border` (else invisible on white) |
| scrim | `bg-black/40` | `rgb(0 0 0 / 0.40)` | `rgb(0 0 0 / 0.30)` |
| shadow-floating | `shadow-[0_8px_24px_rgb(0_0_0/0.4)]` | as today | `0 8px 24px rgb(0 0 0 / 0.12)` |

## 5. Map and tracks on voyager

Voyager colours (from the vendored `apps/web/src/features/map/voyager.style.json`): land `#fbf8f3`, parks/landcover `rgba(197,225,178,…)` (pale green), water `#b0d0d6`, motorway/trunk fill `#FFE9A5` with `#fbdb98` casing (pale yellow-orange), minor roads white, paths `#d7d7d7`.

**Colour clashes on voyager.** Running green shares its hue with parks; cycling orange shares its hue with major roads. Both basemap features are pale (1.26–1.34:1 against land), so a dark, saturated track still separates by luminance, but not a light one.

**Track contrast against land `#fbf8f3` (normal alpha blending):**

| Colour | alpha 80 (`faint`) | 160 (`warm`) | 255 (`hot`, highlighted) |
| --- | --- | --- | --- |
| `#4ade80` running today | 1.19 | 1.39 | 1.64 |
| `#16a34a` green-600 | 1.42 | 2.02 | 3.11 |
| `#15803d` green-700 | 1.54 | 2.50 | 4.73 |
| `#f97316` cycling today | 1.37 | 1.86 | 2.65 |
| `#ea580c` orange-600 | 1.46 | 2.17 | 3.36 |
| `#c2410c` orange-700 | 1.59 | 2.67 | 4.89 |

**Overlap ramp (4 stacked passes at alpha 80):** normal blend green-700 1.54 → 2.15 → 2.75 → 3.26, orange-700 1.59 → 2.26 → 2.89 → 3.45. Subtractive/multiply-style blend (`dst × (1 − a·(1 − src))`) green-600 1.43 → 1.95 → 2.59 → 3.35, orange-600 1.47 → 2.03 → 2.63 → 3.24. Both build a darkening "ink" ramp instead of today's brightening heat ramp; multiply keeps the hue cleaner and is what rdeck recommends for density on light maps [RDECK]. Additive (today) is unusable: it adds to an already near-white destination.

**Proposal (light map):**

| Element | Today (dark) | Light proposal | Notes |
| --- | --- | --- | --- |
| Running track | `[74,222,128]` `#4ade80` | `#15803d` (C) or `#16a34a` (A/B) | rule "sport colours stay apart at every overlap stage" holds by hue; luminance between the pair is 1.03–1.08, same situation as today |
| Cycling track | `[249,115,22]` `#f97316` | `#c2410c` (C) or `#ea580c` (A/B) | |
| Blend | additive `ADDITIVE_BLEND` | multiply/subtractive, or plain alpha | needs a per-theme `parameters` value in `DeckGLOverlay.tsx:197` and `useOnboardingPreviewLayer.ts:57` |
| Intensity alphas | 80 / 160 / 255 (`trackColors.ts:21-25`) | raise floor, e.g. 140 / 200 / 255 | at 80 no colour reaches 2:1 on voyager |
| Width | 8 / 12 px (`trackColors.ts:13-16`) | unchanged | |
| Casing (highlighted / lap) | white `[255,255,255,255]` (`DeckGLOverlay.tsx:54-55`), scale 1.6 | white casing is invisible on land (≈1.05:1). Use a dark tint of the sport hue: running `#14532d` (8.60), cycling `#7c2d12` (8.85), or a white inner halo **plus** a 1 px dark outer edge | casing separates the track from parks and yellow roads; it is not grey, so the map rule holds |
| Pick circle | white 13/25 alpha (`DeckGLOverlay.tsx:352,355`) | `rgb(0 0 0 / 0.05)` fill, `/0.10` line | |
| Geo accuracy disc | white 18/38 alpha (`trackColors.ts:40-41`) | accent blue at 12–20 % | invisible otherwise |
| Geo dot | `[80,140,255]` + white ring (`trackColors.ts:42-43`) | keep, or `#2563eb` (4.88 vs 3.03) | blue is allowed for the live dot (`apps/web/CLAUDE.md` §3) |
| Hillshade shadow / accent | `#000000` (`tokens.mapShadow`, `mapStyle.ts:36-41`) | warm brown `#5a4a3a`, lower exaggeration | **unverified**: black hillshade over a cream map tends to look dirty; needs a screenshot check |
| Hillshade highlight | `#ffffff1a` | `#ffffff59` or off | white highlights are near-invisible on cream |
| Dot stroke | `#00000050` | keep | works on both |
| Studio routes (`features/studio/routeColors.ts:9-14`) | -400 steps (amber `#fbbf24` 1.58, fuchsia `#e879f9` 2.32) | 600/700 steps: fuchsia `#c026d3` (4.45), emerald `#059669` (3.56), amber `#d97706` (3.01), violet `#7c3aed` (5.38), orange `#ea580c` (3.36), rose `#e11d48` (4.43) | keys are persisted, values are not: per-theme values need no store migration |
| Zone colours (detail map + charts) | `#60a5fa #34d399 #fbbf24 #f97316 #ef4444` (2.54 / 1.92 / 1.67 / 2.80 / 3.76 on white) | `#2563eb #059669 #d97706 #ea580c #dc2626` (5.17 / 3.77 / 3.19 / 3.56 / 4.83) | Z1 is blue on the map today (allowed for zones per §3) |
| Wind colours (`lib/zoneColors.ts:38-42`) | `#34d399 #fbbf24 #ef4444` | `#059669 #d97706 #dc2626` | |
| Attribution chip | black/60 + white text | white/80 + `text-secondary` | `map-attribution.css` |

Alternative basemap: CARTO positron (grey-white) gives tracks more room than voyager (no yellow roads, no green parks) but is grey; the "no grey" rule applies to tracks, not the basemap. Not vendored today.

## 6. Migration size

| Category | Files | Occurrences | Notes |
| --- | --- | --- | --- |
| Token definitions | 3 | ~60 tokens | `packages/ui/src/theme.css`, `packages/ui/src/lib/tokens.ts`, `packages/ui/src/lib/colors.ts` |
| Shell / PWA | 3 | 6 | `apps/web/index.html:2,11,12,18,21`, `apps/web/vite.config.ts:83-84` |
| Semantic utilities (switch for free) | 59 | 198 | no edit needed with strategy (a) |
| Surface classes in `Card.tsx` | 1 | 6 classes, used at 47 sites | `glassClass`, `tileClass`, `floatingClass`, `floatingLgClass`, `scrimClass`, `overlayClass` (`packages/ui/src/components/Card.tsx:3-15`); one edit fixes 47 sites |
| Raw `white`/`black` utilities | 55 (28 `packages/ui/src/components`, 27 `apps/web/src`, of which 12 in `features/sessions/session`) | 111 | `bg-white/10` 34, `border-white/10` 23, `bg-white/5` 27, `bg-white` 3, `text-white` 3, `border-white/20–40` 7, `stroke`/`fill`/`divide` 6, rest single |
| Raw palette shades | 4 | 21 | `Banner.tsx:15-27` (amber/blue/emerald/red -200 text on -500/10 glass: dark-only tints), `Button.tsx:16` `active:bg-blue-700`, `ActionTile.tsx:38-53` `zinc-900/500`, `Label.tsx:13` `text-gray-300` |
| White literals in chart SVG | 5 | ~25 | `features/sessions/session/LapStrip.tsx:17-22,114,162,171,179,231,242-256`, `components/charts/LapBands.tsx:31-35,52,62-64`, `features/settings/ThresholdSparkline.tsx:68,75,82`, `features/dashboard/LoadChart.tsx:101`, `features/labs/WorkoutExpansionPanel.tsx:66` (`#888`) |
| `tokens.ts` JS consumers | 24 app files | ~120 reads | ~16 chart components (Recharts), 2 map, `lib/statusColors.ts`, `lib/chartTheme.ts`, `lib/debug/pvDebug.ts`, others |
| Map + deck.gl | 11 | – | `mapStyle.ts`, `MapBackground.tsx:77`, `trackColors.ts`, `DeckGLOverlay.tsx`, `hooks/useOnboardingPreviewLayer.ts`, `hooks/useTerrainLineEffect.ts`, `terrainLine.ts`, `zoneColoredPath.ts`, `TrackIntensityControl.tsx`, `map-attribution.css`, `features/studio/routeColors.ts` (+ studio popups that read deck.gl) |
| Engine zone colours | 2 engine + 1 app | 18 hex | `packages/engine/src/zones.ts`, `zoneDistribution.ts`, `apps/web/src/lib/zoneColors.ts` |
| Backdrop blur | 4 | 10 | `Card.tsx`, `Banner.tsx`, `Dialog.tsx:26`, `NewerVersionOverlay.tsx:15`; blur needs no change, the tint under it does |

Rough total: ~110 files touched once, ~350 edits; about 60 % mechanical class replacement.

**Riskiest spots**

1. **Additive track blending** (`trackColors.ts:4-11`): wrong for light by construction; the heat-ramp semantics change (brighten → darken). Visual check needed with many overlapping tracks.
2. **Zone colours in the engine**: per-theme values cannot live in a pure package; moving the colour mapping to `apps/web/src/lib` touches every zone consumer (detail map, zone charts, ZoneGradient, labs).
3. **JS-built constants and memoised layers**: `TERRAIN_HILLSHADE_PAINT`, `statusFill`, `ZONE_PALETTES`, `sportTrackColor` are module-level; deck.gl layers memoise on data. A theme switch without reload needs every one to depend on the theme; switching only at reload is the simpler first step.
4. **`LapStrip` / `LapBands`**: lap intensity is encoded as white alpha steps (0.18–0.95); on light these become black alpha steps and need visual re-tuning, not a 1:1 swap.
5. **Banner tints and glass**: `-200` text on `/10` tinted glass is unreadable on white; the four banner looks need light variants.
6. **Switch/Slider thumbs and `ActionTile` selected state** (`bg-white` + `text-zinc-900`): selected = white tile is the dark theme's inversion trick; on a white page it reads as unselected.
7. **Status bar**: `black-translucent` + static manifest colour; the installed PWA's splash stays dark.

## 7. Open questions for the owner

1. **Which character?** (C) sunlight / (A) pure white / (B) off-white + white cards. Recommendation: C, since outdoor readability is the stated goal; A as the "calm" alternative to mock next to it.
2. **How is the theme chosen?** Manual toggle in settings, persisted / follow system (`prefers-color-scheme`) / both (System, Light, Dark like Garmin Connect [WAREABLE-GARMIN]). Recommendation: System + manual override.
3. **Does the map follow the UI theme?** Light UI + voyager / light UI over the dark map (no track work at all) / separate map style setting. Recommendation: follow the theme, but keep a mock of "light UI over dark map": it is the cheapest outdoor win and avoids the blending rework.
4. **Overlap ramp on a light map:** multiply (darkening ink ramp) / plain alpha with a higher floor / full-opacity lines without heat. Recommendation: multiply; decide after a screenshot with dense track overlap.
5. **Sport colours on light:** darker 600/700 variants (identity by hue) / keep `#4ade80` and `#f97316` with a dark casing (identity by swatch). Recommendation: darker variants; the bright swatches fail 3:1 even with a casing on small UI chips.
6. **Order of work:** land the overlay tokens (strategy b) as a dark-only, pixel-identical refactor first / do everything in one item. Recommendation: refactor first; it shrinks the light-theme diff to values.
7. **Workbench board and README banner:** stay dark / follow. Recommendation: stay dark (out of scope).

## Sources

- [W3C-143] WCAG 2.2 Understanding 1.4.3 Contrast (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- [W3C-1411] WCAG 2.2 Understanding 1.4.11 Non-text Contrast: https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
- [TW-DARKMODE] Tailwind CSS v4, Dark mode (`@custom-variant`): https://tailwindcss.com/docs/dark-mode
- [SHADCN-CHART] shadcn/ui Chart, theming with CSS variables: https://ui.shadcn.com/docs/components/chart
- [MAPBOX-STRAVA] Mapbox blog, Outdoor map design and styling with Strava (search snippet; direct fetch returned 403): https://blog.mapbox.com/outdoor-map-design-and-styling-with-strava-133929a40398
- [CROSLEY] Strava design guide (third-party, unverified values): https://blakecrosley.com/fr/guides/design/strava
- [RUNMAG-STATMAPS] Running Magazine, Strava #statmaps: https://runningmagazine.ca/?p=75340
- [OSMWIKI-STRAVA] OpenStreetMap wiki, Strava (heatmap colour parameters): https://wiki.openstreetmap.org/wiki/Strava
- [ANDROIDAUTH-HEATMAP] Android Authority, Strava global heatmap: https://www.androidauthority.com/strava-global-heatmap-3231112/
- [BIKETRAILS-KOMOOT] Komoot route planning guide (surface edge styles): https://biketrailspfannenstiel.ch/auskunft/wie-plane-ich-eine-radtour-mit-komoot/
- [KOMOOT-REDESIGN] Komoot newsroom, modern design: https://newsroom.komoot.com/254252-komoot-unveils-modern-design-as-part-of-ambitious-product-roadmap/
- [WAREABLE-GARMIN] Wareable, Garmin Connect light/dark mode (search snippet; direct fetch returned 403): https://www.wareable.com/garmin/garmin-connect-how-to-change-light-dark-mode
- [GARMIN-MAPSETTINGS] Garmin device manual, Map Settings (Track Color): https://www8.garmin.com/manuals/webhelp/GUID-C001C335-A8EC-4A41-AB0E-BAC434259F92/EN-US/GUID-60C3B7A5-51ED-4E4D-A2DC-8578234EF279.html
- [ICU-DARKMODE] intervals.icu forum, Dark Mode implemented: https://forum.intervals.icu/t/implemented-dark-mode-for-intervals-icu/402?page=2
- [MAPBOX-CASING] Mapbox Navigation SDK, route casing colour: https://docs.mapbox.com/android/navigation/api/2.9.2/libnavui-maps/com.mapbox.navigation.ui.maps.route.line.model/-route-line-color-resources/route-casing-color.html
- [RDECK] rdeck (deck.gl R wrapper) manual, blending modes: https://milesmcbain.r-universe.dev/rdeck/doc/manual.html
