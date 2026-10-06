# Colour by: one central control for map track and charts

## Context
- The zone distribution card (`src/features/sessions/session/OverviewTab.tsx:30-50`) shows HR/Power/Pace zone shares as bars. Its `seconds` are record counts, not seconds (`src/packages/engine/zoneDistribution.ts:19-20`, `:61-81`).
- The same card owns the map track colouring: a switch in its footer (`src/features/sessions/charts/ZoneColorListItem.tsx`) sets `zoneColorMode` in `src/store/mapFocus.ts`, and the active tab picks HR/Power/Pace (`src/features/sessions/charts/ZoneDistributionChart.tsx:131-135`). That coupling is hidden.
- Zone colours are shared: `HR_ZONE_DEFS`, `POWER_ZONE_DEFS` (`src/packages/engine/zoneDistribution.ts:31`, `:90`) and the running pace zones from `computeRunningZones` (`src/packages/engine/zones.ts`). The map blends smoothly between zone midpoints (`createZoneScale`, `src/features/map/zoneColoredPath.ts:28-46`).

## Decisions (settled)
- The zone distribution card goes.
- **Control: one floating "Color by" pill on the map** that merges trigger and legend: `◧ HR zones ▮▮▮▮▮ ▾` (layers icon, mode name, colour scale). In Sport color mode it collapses to `◧ Color by ▾`. Tapping opens the picker via the existing `src/components/ui/ResponsivePopover.tsx` (popover on desktop, bottom-sheet dialog on phone): a "Color by" header and radio rows Sport color | Heart rate | Power | Pace | Wind, each with a subtitle saying what it colours ("Track in the sport color", "Z1–Z5 · map + Heart Rate chart", "Head / cross / tail · map only") and its scale swatch on the right; unavailable rows stay visible, disabled, with the reason ("Set FTP in profile", "No power data", "No weather data", "Loading weather…"). Copy: layers icon as in Garmin Connect; "Color by" and "Sport color" are ours. US spelling like the existing messages (`ui_studio_color_label`, `ui_sport_color_title`). Nothing is rendered below the session tabs.
- **Placement** (toasts may overlap the pill on desktop; accepted, they disappear on their own):
  - Desktop: centred horizontally on the visible map strip between the dock (`src/components/layout/Dock.tsx:176-180`) and the content column (40 %, `src/components/layout/AppLayout.tsx:66-76`), 24 px from the bottom; the picker opens upwards.
  - Phone: the pill is portalled to `body` (outside the sheet, so its glass blur sees the map) and shares the sheet's `y` motion value, so it travels with the sheet (drag, momentum, snap) and stays visible in every sheet position. `BottomSheet` gets an `above?: ReactNode` slot, filled via `MobileSheet`.
  - The map leaves room for the pill when fitting the track: `mapSidePadding` (`src/features/map/mapSidePadding.ts:11-20`) adds the pill's height plus its margin to `bottom`, on desktop and on phone (on top of the sheet height).
  - The sheet already uses `backdrop-filter`, so a blurred child outside its box likely won't blur the map (nested backdrop root, unverified): give the pill a more opaque background instead of relying on blur.
- The control drives **both** the map track and the charts: selecting HR colours the map track **and only the HR chart line** by HR zone; Power and Pace work the same for their own chart. Other charts keep their normal colour. **No per-chart switches.**
- **Wind** colours the **map track only** by head / cross / tail wind; no chart changes. The three wind bucket chips in the weather row (`src/features/sessions/session/WeatherChips.tsx:76-108`) stay as they are.
- **Blended colours**, the same blend as the map today (no hard zone steps).
- The choice is **remembered** across sessions. If the remembered mode isn't available for a session (missing threshold or data), that session shows Sport color.
- `compute*ZoneDistribution` and `ZoneBucket` are deleted from the engine.

## Approach
### Shared blend
- Move the colour scale out of `src/features/map/zoneColoredPath.ts` into `src/lib/zoneColors.ts` (e.g. `zoneColorScale(mode, thresholds)` returning `value → colour` plus the zone midpoints in the metric's chart unit). Map and charts both use it, so a value gets the same colour on both.
- Units: HR in bpm (via HR reserve), power in W (via FTP), pace in sec/km on the map and min/km on the chart.

### Zone-coloured line
- When the control matches the chart (HR ↔ HR chart, Power ↔ Power chart, Pace ↔ Pace chart), the line's `stroke` becomes a vertical `linearGradient` (`objectBoundingBox`). The line's bounding box spans the min and max of the plotted values (`zoom.zoomedData`), so stop offsets are `(max − v) / (max − min)`, flipped for the reversed pace axis.
- Stops at both ends plus every zone midpoint inside the range reproduce the map's piecewise-linear blend exactly.
- When all values are equal (bounding box height 0, gradient not rendered), use the solid colour of that value.
- Bucketing, zoom and hover sync stay unchanged; only the stroke changes.
- Rail: on hover, the zone label (e.g. "Z3 Tempo") under the value, in its colour, **only in the chart that is currently coloured**; the other charts' rails show no zone label.

### Wind track
- Engine: `src/packages/engine/windExposure.ts` already classifies each GPS segment (loop at `:103`, sectors ±45°, pauses > 30 s and segments < 1 m skipped). Extract that per-segment classification into an exported function (e.g. `classifyWindSegments(records, wind, sessionStartMs)` → `'head' | 'cross' | 'tail' | undefined` per record) and let `computeWindExposure` reuse it, so chips and track can never disagree.
- Colours come from the shared zone palette (`src/packages/engine/zoneDistribution.ts:31-36`, `src/packages/engine/zones.ts:13-17`), used on the track and as solid fills in the bucket chips (`WeatherChips.tsx:76-108`, replacing their gradients):
  - tailwind: green `#34d399` (helps)
  - crosswind: yellow `#fbbf24` (neutral)
  - headwind: red `#ef4444` (hurts)
  - The chips keep their `/40` fill alpha; slightly lighter than the track is accepted.
- Skipped segments (pause, < 1 m, no wind sample) use the same faint fallback as zone mode (`FALLBACK_COLOR`, `src/features/map/zoneColoredPath.ts:26`), not the sport colour, so tailwind green never competes with the running green and every colouring mode treats missing values the same way. Faint is intended: grey means "no data". In Sport color mode the whole track stays the sport colour.
- Availability: weather loaded with at least one wind sample and ≥ 2 GPS points. While weather is still loading, a remembered Wind shows Sport color and switches to Wind once it arrives.

### Control and state
- `zoneColorMode: ZoneColorMode | null` in `mapFocus` is replaced by a persisted store, e.g. `src/store/sessionColoring.ts` (`store-session-coloring`, version 1, idbStorage, `skipHydration`): `colorMode: 'sport' | 'hr' | 'power' | 'pace' | 'wind'`, action `setSessionColorMode(mode)`.
- The effective mode per session = stored mode if available, else `'sport'`. Availability: HR needs maxHr + restHr and HR data, Power needs FTP and power data, Pace needs threshold pace, pace data and running.
- The pill stays visible even when only Sport color is available, so the reasons in the picker can be read.
- `useSessionDetailPath`, `DeckGLOverlay` and the HR/Power/Pace charts read the effective mode.
- New messages: `ui_color_by` ("Color by" / "Färben nach"), `ui_color_by_sport` ("Sport color" / "Sportfarbe"), one subtitle and one unavailable reason per mode, `ui_color_by_wind` ("Wind" / "Wind").

### Removal
- Delete `ZoneDistributionChart.tsx`, `ZoneColorListItem.tsx`, the card in `OverviewTab.tsx`, and `useZoneData` (its threshold checks move to the availability helper).
- Engine: delete `computeHrZoneDistribution`, `computePowerZoneDistribution`, `computePaceZoneDistribution` and `ZoneBucket` from `src/packages/engine/zoneDistribution.ts`; keep `HR_ZONE_DEFS` and `POWER_ZONE_DEFS`. Delete the matching cases in `tests/engine/zoneDistribution.spec.ts`. Update the `ZoneBucket` example in `src/packages/engine/CLAUDE.md:4`; `SOURCES.md:16-17` stays (the zone defs still cite Karvonen and Coggan).
- Unused messages: `ui_chart_title_zones`, `ui_zone_color_title`, `ui_zone_color_desc`; the zone tab labels are reused by the chips.

## Tests
- `zoneColors`: same colour for a value on map and chart; stops reproduce the blend; reversed pace; flat values; missing thresholds → mode unavailable.
- `sessionColoring` persist store: default `'sport'`, version 1; unavailable mode falls back to Sport color.
- `classifyWindSegments`: head / cross / tail per segment, pauses and tiny segments undefined; `computeWindExposure` percentages unchanged on the existing test cases.
- E2E: extend `e2e/sessions.spec.ts`: pick HR, the HR line and the track are zone-coloured; reload and open another session, HR is still selected.

## Verification
`vp check`, `vp test -- --run`, `vp exec playwright test`, `vp build`. Manually: zone colours on HR/Power/Pace in compact and expanded mode, zoom, hover sync, the pill on desktop and mobile (sheet drag).
