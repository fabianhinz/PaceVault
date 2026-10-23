# UX research: 3D view of the session map

Scope: how a 3D view of the session map on `/sessions/:id` could look and behave. Research only; nothing here is decided.

Repo facts this research builds on (verified 2026-10-23):

- One shared map behind every route; pitch and rotate are off: `apps/web/src/features/map/MapBackground.tsx:86-88` (`dragRotate`, `pitchWithRotate`, `touchPitch` all `false`). Note: `plan.md` cites `:85-87`, which is one line off.
- deck.gl overlay is keyed by input type: `overlaid` on fine pointers, `interleaved` on touch (`apps/web/src/features/map/MapBackground.tsx:93-94`). In `overlaid` mode deck draws above the whole basemap, in `interleaved` it depth-tests against it; a lifted 3D path behaves differently in the two.
- Map pills: `apps/web/src/features/sessions/session/SessionMapControls.tsx:24-37` renders `ColorByControl` and `LapsControl` in `MapControlsBar` (`apps/web/src/features/map/MapControlsBar.tsx:21-43`: portal centred over the map area on desktop, horizontally scrolling `SheetAbove` row on phone). Pills are 44 px high (`apps/web/src/features/map/mapPadding.ts:14`).
- `ColorByControl` already collapses to an icon-only pill while a lap is selected (`apps/web/src/features/sessions/session/ColorByControl.tsx:125-135`), so the row has a known width squeeze on phone.
- Chart hover sets `hoveredPoint` as `[lng, lat]` (`apps/web/src/store/mapFocus.ts:14-15`, set at `apps/web/src/features/sessions/charts/SessionChartsExplorer.tsx:175`); the dot is drawn at `apps/web/src/features/map/DeckGLOverlay.tsx:352-371`. In a lifted 3D path the dot needs a z value too, or it sits on the ground under the line.
- Detail track, lap hover and selected-lap layers are `PathLayer`s with 2D positions (`apps/web/src/features/map/DeckGLOverlay.tsx:202-274`).
- `SessionRecord.elevation` is optional (`packages/engine/src/types.ts:76`): missing stays missing, 0 m is a valid altitude.
- No DEM/terrain source in the vendored style; terrain needs a fourth external service (`apps/web/CLAUDE.md:28`).

## 1. Comparable products

| Product | Entry point | Camera | Terrain vs flat | Vertical exaggeration | Phone vs web | Sources |
| --- | --- | --- | --- | --- | --- | --- |
| **Strava: 3D map layer** | Map-layer switch "3D" top right of any activity map, routes and record tab | Free tilt/rotate with gestures; web heatmap: Ctrl+click-drag rotates | Real terrain (DEM); since the in-house engine from FATMAP tech | Not documented (unverified) | Mobile since 2022; web heatmaps since 2021; paywall status contradicts across sources (unverified) | [1], [2], [3], [4] |
| **Strava: Flyover** | Play button on the activity map (also routes, segments) | Automated follow camera; pinch zoom and scroll adjust the angle, **Re-Center** snaps back; pause/play, speed, scrubbable progress bar | Real terrain (FATMAP, per reader comment; unverified in article) | Not documented | App only, "not yet available on the Strava website"; subscribers only | [5], [6] |
| **Garmin Connect: 3D Maps** | Inside activity, course and Garmin Trails review (exact control not described; unverified) | Not described (unverified) | 3D topographic terrain | Not documented | Mobile app; Connect+ ($6.99/mo) since Nov 2025 | [7], [8] |
| **Komoot: 3D maps** | "3D" icon on the right edge of the web planner; same spot then shows "2D" to go back | A short hint at the top on entry explains rotate and tilt; free orbit | Real terrain, works with all map styles incl. satellite | Not documented | Desktop web only, no app; Premium | [9], [10], [8] |
| **Suunto app** | 3D maps for planning and reviewing (2021); 3D animation: open activity, press play (2022) | Automated playback; shared links carry the animation | Real terrain | Not documented | App; links viewable on a large screen | [11] |
| **Relive** | Separate product: a generated short 3D video per activity | Automated cinematic camera, user picks orientation, speed, quality; photos and max-speed/high-point callouts | Satellite terrain | Not documented (unverified) | App first; video shared everywhere | [6], [12], [13] |
| **FATMAP (now Strava)** | 3D as the app's default view (unverified) | Free orbit (unverified); FATMAP tech now powers Strava 3D/Flyover | Real terrain | No public setting found (unverified) | App and web (unverified) | [3], [14] |
| **COROS app** | 2D/3D toggle on the activity map; later "3D Flyover" playback with photos and (Sept 2025) video clips | Toggle + playback | Track draped on terrain; styles Outdoor, Satellite, Winter, Dark | Not documented | App | [15], [16], [17] (support page returned 403; claims from search excerpts, unverified) |
| **Ride with GPS** | 3D on any route or activity | "tilt, rotate and pan" with gestures | Terrain; OSM-based map types only | Not documented | Web and mobile, also during navigation | [8] |
| **intervals.icu** | No 3D activity map found | n/a | n/a | n/a | n/a | [18] (absence; unverified) |
| **SportsTrackLive (reference for a player UI)** | 3D player for activities | Follow, first-person, free camera; compass and gyroscope control; altitude and speed graphs beside it | Terrain | n/a | Web | [19] |

What the field converges on:

- **Two separate things**: a persistent 3D map mode (toggle on the map: Strava layer switch, Komoot icon, COROS 2D/3D) and a **flyover/playback** (play button: Strava, Suunto, COROS, Relive). Nobody merges them into one control.
- **Every product with 3D has real terrain.** None found draws a lifted 3D line over a flat basemap. A flat-basemap 3D path would be PaceVault's own pattern with no direct precedent (fallback precedent: the side-on elevation profile everyone already shows as a chart).
- **The toggle sits on the map, top or side, and swaps its label** (3D ↔ 2D, Komoot). Tilt/rotate after entry are gestures; Komoot teaches them with a transient hint.
- **Flyover is phone-first and paywalled**; Strava has no flyover on the web. Exaggeration is never exposed as a user setting in the fitness apps found (only in GIS/hiking tools such as HiiKER [20]).
- **Re-center** (Strava) is the escape hatch once the camera has been moved freely.

## 2. Generic UI patterns

Data basis without DEM: per-record `elevation` lifts the deck.gl path (`[lng, lat, z]`), basemap stays flat. "Exaggeration" below means the factor on `(elevation - min elevation)`; at true scale a 150 m climb over 20 km is barely visible at the zoom a whole session fits in (unverified until tried on real data).

| Pattern | Data availability | Fit on 390 px with the sheet | Conflicts with lap click/hover and chart sync | Glanceability | Effort | Risks |
| --- | --- | --- | --- | --- | --- | --- |
| **P1. 3D toggle pill** next to Color by / Laps | Needs any non-missing `elevation`; pill disabled with a reason (like Color by's `noGps`) when none | One more pill in a row that already scrolls horizontally; icon-only fits (44 px), labelled "3D"/"2D" fits EN and DE | None by itself; lap picking on a lifted `PathLayer` still works; `hoveredPoint` needs z | High: one tap, state visible on the pill | Low (toggle + camera ease to a preset pitch + z in path data) | Shared map must return to pitch 0 / bearing 0 on leaving the session; `fitBounds` with pitch frames differently (top of the track recedes) |
| **P2. Pitch/bearing compass** (MapLibre `NavigationControl` with `visualizePitch`, or own button) | n/a (camera only) | Needs a corner spot not covered by the sheet or the header; phone has little free map area | None; clicking it resets bearing (and pitch) | Medium: shows north and tilt; meaningless while flat | Low (built into MapLibre [21]) | New floating control in a place no other page uses; "same place at every width" rule forces a spot that works on both layouts |
| **P3. Two-finger tilt / right-drag rotate only** (no button) | n/a | Nothing to fit | Phone: two-finger vertical drag (tilt) vs pinch zoom vs sheet drag; desktop: right-drag and Ctrl-drag are free today | Low: invisible, needs a hint (Komoot shows one on entry [10]) | Lowest (`touchPitch`, `dragRotate`, `pitchWithRotate` flags) | Undiscoverable; enabling it on the shared background leaks pitch into other routes unless scoped to the session page |
| **P4. Flyover / playback scrubber** tied to the chart cursor | Needs GPS + timestamps (always present) and elevation for z | Scrubber + play/pause need a full row; on phone it competes with the pills row or replaces it | Strong overlap: the chart cursor already moves the dot; playback would drive the same cursor, so chart hover and playback fight over one state; lap selection would have to clamp playback to the lap | High while playing, nothing at rest | High (camera path smoothing, frame loop, timeline state, chart cursor sync) | Phone performance with long rides; camera path through records with GPS jitter; field shows it as a separate feature from 3D mode |
| **P5. Side-on "curtain" profile** (vertical wall from ground to path, optionally coloured by the Color-by mode) | Elevation only | No extra control if bundled with P1 | None for lap selection (curtain follows the lap path); chart dot sits on top of the curtain | High: reads as "elevation on the map" in one glance, even at shallow tilt | Medium (deck.gl `SolidPolygonLayer`/`PathLayer` pairs or a custom wall mesh; z per vertex) | Gaps where elevation is missing must break the wall (0 m is a wall to sea level, missing is a gap); dense walls can cover the basemap labels in `overlaid` mode |
| **P6. Preset camera angles** (segmented: Top / Tilted / Side) | n/a for Top; elevation for the others | 3-way segment is ~150 px; popover from one pill (like Color by) fits better | "Side" auto-rotates bearing to the track's main axis: chart hover dot and lap clicks remain valid | High: fixed, repeatable views, no gesture skill needed | Medium (bearing from the track's principal axis, padding per preset) | "Side" for loops (start = finish) has no obvious axis; DE labels longer ("Draufsicht", "Seitenansicht") |

Cross-cutting observations:

- **Shared background**: whatever enables 3D has to reset on route change (`useMapCameraEffect`/`useSessionFitBounds` own the camera today, `apps/web/src/features/map/hooks/`). P3 is the hardest to scope because it changes interaction flags on the global map.
- **Desktop overlay mode**: in `overlaid` mode a lifted path and curtain are drawn above labels and other tiles; in `interleaved` (touch) they are depth-tested. Both look acceptable over a flat basemap, but they differ, which matters for screenshots and review.
- **Map colours**: the curtain is a new map surface; it would reuse the track colour at low alpha (no grey/blue per `apps/web/CLAUDE.md` §3). A neutral grey wall is ruled out by that rule.
- **Missing elevation**: per-record gaps split the 3D path and the curtain; a session without any elevation disables the toggle and shows the reason, like `ColorByControl`'s unavailable reasons (`apps/web/src/features/sessions/session/ColorByControl.tsx:54-65`).

## 3. Shortlist

Legend: `[≡ Color by ▾]` `[⋮ Laps ▾]` are today's pills; `▓` content column / glass sheet; `/\/` lifted track; `|||` curtain; `●` chart-hover dot. Desktop: map background with pills centred over the map area, content column ~40 % right. Phone 390 px: map on top, pills row above the glass bottom sheet.

### V1. "3D" toggle pill + fixed tilt + curtain

Rationale: the field's common entry (map toggle, label swaps 3D ↔ 2D) with the least new surface; the curtain makes record elevation readable over a flat basemap.

```text
Desktop                                                 ┌──────────────────────┐
┌───────────────────────────────────────────────────────┤ ▓ Session header   ⋮ │
│        tilted 60°, bearing kept                       │ ▓ Charts  ●          │
│            /\/\___                                    │ ▓ Laps               │
│        ___/|||||||\__/\●                              │ ▓ Stats              │
│   ____/||||||||||||||||\____                          │ ▓                    │
│                                                       │ ▓                    │
│     [≡ Color by ▾] [⋮ Laps ▾] [⛰ 3D]                  │ ▓                    │
└───────────────────────────────────────────────────────┴──────────────────────┘

Phone 390
┌──────────────────────────────┐
│        /\/\___               │
│    ___/|||||||\_●            │
│ __/||||||||||||||\___        │
│ [≡ Color by ▾][⋮ Laps ▾][⛰ 3D]│  ← pills row (scrolls if lap selected)
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓ Session header            ⋮ │
│▓ Charts …                    │
└──────────────────────────────┘
```

- Pros: one tap; same pill, same place at every width; no new corner control; chart dot and lap selection keep working (with z added); low effort.
- Cons: fixed angle may hide parts of a loop behind the curtain; no rotate means one side is always "back"; flat basemap with a floating wall has no precedent in comparable apps.

### V2. V1 + rotate/tilt gestures and a compass that resets

Rationale: Strava/Komoot/RWGPS behaviour (free orbit after entry) with Strava's Re-Center as the way back.

```text
Desktop                                                 ┌──────────────────────┐
┌───────────────────────────────────────────────────────┤ ▓ Session header   ⋮ │
│                                                 (⊼)   │ ▓ Charts             │
│          ___/\/\                                 ↑    │ ▓ Laps               │
│     ____/|||||||\__●                         compass  │ ▓                    │
│  __/||||||||||||||||\___   right-drag: rotate/tilt    │ ▓                    │
│                                                       │ ▓                    │
│     [≡ Color by ▾] [⋮ Laps ▾] [⛰ 2D]                  │ ▓                    │
└───────────────────────────────────────────────────────┴──────────────────────┘

Phone 390
┌──────────────────────────────┐
│                         (⊼)  │ ← compass, only while 3D
│     ___/\/\__●               │   two-finger drag: tilt / twist: rotate
│ ___/||||||||||\___           │
│ [≡ Color by ▾][⋮ Laps ▾][⛰ 2D]│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓ Session header            ⋮ │
└──────────────────────────────┘
```

- Pros: lets the user look around the back of a climb; compass doubles as orientation and reset; matches what users know from Strava/Komoot.
- Cons: a new floating control whose corner must be free on both layouts (header/peek on desktop, safe area on phone); two-finger tilt vs pinch vs sheet drag on phone; gestures need a one-time hint (Komoot pattern) or stay undiscovered.

### V3. Camera presets in a pill popover (Top / Tilted / Side)

Rationale: reuse the `ResponsivePopover` + radio pattern of Color by, no gestures; "Side" is a map-sized elevation profile.

```text
Desktop                                                 ┌──────────────────────┐
┌───────────────────────────────────────────────────────┤ ▓ Session header   ⋮ │
│                         ┌───────────────┐             │ ▓ Charts             │
│   side view             │ View          │             │ ▓                    │
│      _/\/\_●___         │ ( ) Top       │             │ ▓                    │
│   __/||||||||||\__/\__  │ ( ) Tilted    │             │ ▓                    │
│  /||||||||||||||||||||\ │ (•) Side      │             │ ▓                    │
│                         └───────────────┘             │ ▓                    │
│     [≡ Color by ▾] [⋮ Laps ▾] [⛰ Side ▾]              │ ▓                    │
└───────────────────────────────────────────────────────┴──────────────────────┘

Phone 390 (popover becomes a bottom sheet drawer like Color by)
┌──────────────────────────────┐
│   _/\/\_●___                 │
│ _/||||||||||\__/\__          │
│[≡ Color by][⋮ Laps][⛰ Side ▾]│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓ View                        │
│▓ ( ) Top  ( ) Tilted (•) Side│
└──────────────────────────────┘
```

- Pros: repeatable, screenshot-stable views; no gesture discovery; consistent with existing pill popovers; the pill label states the current view.
- Cons: "Side" needs a computed bearing (track's main axis) and is ambiguous for loops and out-and-backs; three DE labels are long; still no free look-around.

### V4. Flyover playback bar bound to the chart cursor

Rationale: the field's second pattern (Strava, Suunto, COROS, Relive); here the playhead *is* the existing chart cursor, so charts, laps and map stay in one timeline.

```text
Desktop                                                 ┌──────────────────────┐
┌───────────────────────────────────────────────────────┤ ▓ Session header   ⋮ │
│      follow camera behind ●                           │ ▓ Charts  ┊ ← cursor │
│              ___/\●                                   │ ▓ ~~~~~~~~┊~~~~~~~   │
│        _____/||||||\____                              │ ▓ Laps               │
│                                                       │ ▓                    │
│  [▶] ━━━━━━━━━━●──────────── 1:12:40  [1× ▾]          │ ▓                    │
│     [≡ Color by ▾] [⋮ Laps ▾] [⛰ 3D]                  │ ▓                    │
└───────────────────────────────────────────────────────┴──────────────────────┘

Phone 390
┌──────────────────────────────┐
│        ___/\●                │
│  _____/||||||\___            │
│ [▶] ━━━━━●───────── 1:12 [1×]│ ← replaces/extends the pills row
│ [≡ Color by][⋮ Laps][⛰ 3D]   │
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓ Charts ~~~~┊~~~~            │
└──────────────────────────────┘
```

- Pros: unique tie-in no comparable product has (playhead = chart cursor = map dot); clamping to a selected lap gives "replay this climb".
- Cons: highest effort (frame loop, smoothed follow camera, timeline state); playback and chart hover fight over `hoveredPoint`; a second row above the sheet costs ~56 px of map on phone; no data shown at rest.

### V5. Tilt by gesture only, path lifts automatically once pitched

Rationale: zero new UI; 3D appears only for users who tilt.

```text
Desktop                                                 ┌──────────────────────┐
┌───────────────────────────────────────────────────────┤ ▓ Session header   ⋮ │
│   (flat until right-drag / Ctrl-drag tilts)           │ ▓ Charts             │
│        ___/\/\___●                                    │ ▓                    │
│   ____/||||||||||\____     pitch > 0 → path lifts     │ ▓                    │
│                                                       │ ▓                    │
│     [≡ Color by ▾] [⋮ Laps ▾]                         │ ▓                    │
└───────────────────────────────────────────────────────┴──────────────────────┘

Phone 390
┌──────────────────────────────┐
│ two-finger drag up/down tilts│
│    ___/\/\__●                │
│ [≡ Color by ▾] [⋮ Laps ▾]    │
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓ Session header            ⋮ │
└──────────────────────────────┘
```

- Pros: no pill, no copy, no layout change; smallest diff.
- Cons: invisible; no way back except gesturing flat (or a compass, which turns it into V2); gesture conflicts with the sheet and pinch on phone; pitch leaking into other routes of the shared map.

### V6. V1 with real terrain (needs a DEM service, owner decision)

Rationale: what every comparable product does; the curtain is replaced by the track draped on (or slightly above) terrain.

```text
Desktop                                                 ┌──────────────────────┐
┌───────────────────────────────────────────────────────┤ ▓ Session header   ⋮ │
│      /\      /\/\        terrain hillshade            │ ▓ Charts             │
│   __/  \_/\_/    \__●___  track draped on terrain     │ ▓                    │
│  /                      \__                           │ ▓                    │
│     [≡ Color by ▾] [⋮ Laps ▾] [⛰ 3D]                  │ ▓                    │
└───────────────────────────────────────────────────────┴──────────────────────┘

Phone 390: as V1, terrain instead of curtain.
```

- Pros: matches user expectations from Strava/Komoot/Garmin; terrain shows context (valleys, ridges) the track alone cannot.
- Technical basis: MapLibre terrain from a `raster-dem` source with an `exaggeration` value [22].
- Cons: fourth external service (privacy, availability, offline cache size, licence); terrain elevation and recorded elevation disagree (barometric vs DEM), so the track floats or sinks; terrain hillshade colours must avoid grey/blue on the map, which conflicts with typical hillshade styling.

### Which to test first

**V1** first: it is the smallest variant that answers the core open question, whether a lifted path plus curtain over a flat basemap reads as 3D at all, with no DEM and no gesture work, and V2, V3 and V4 all build on its toggle and z-data.

## 4. Open questions for the owner

1. **Terrain or flat?** (a) flat basemap, path lifted from record elevation, no new service (V1–V5); (b) DEM terrain as a fourth external service (V6), lazily loaded and cached like CARTO; (c) flat now, terrain as a later item.
2. **Elevation cue on a flat basemap**: (a) lifted path + curtain to the ground; (b) lifted path only; (c) curtain only at shallow tilt. Sub-question: curtain in the track's Color-by colour at low alpha, or in the sport colour.
3. **Camera freedom**: (a) fixed tilt only (V1); (b) free rotate/tilt with gestures + compass reset (V2); (c) presets (V3); (d) gestures only (V5).
4. **Vertical exaggeration**: (a) fixed factor chosen by the app (e.g. scaled so the session's elevation range takes a set share of its horizontal extent); (b) a user setting; (c) true scale. No comparable fitness app exposes a setting.
5. **Flyover**: (a) not in this item; (b) in this item, bound to the chart cursor (V4); (c) separate backlog item after 3D mode ships.
6. **Entry label and icon**: (a) pill shows "3D" when flat and "2D" when in 3D (Komoot); (b) pill always "3D" with a pressed state; (c) icon-only. Applies at every width.
7. **Leaving the session**: (a) always back to flat on route change (3D is per visit); (b) remember 3D per device for the next session (persisted map preference).
8. **No elevation in the session**: (a) pill disabled with a reason in a tooltip/popover; (b) pill hidden. (The "same place" rule favours (a).)

## 5. Sources

1. Cycling Weekly, "Strava's latest update adds 3D maps to its mobile apps": <https://cyclingweekly.com/news/stravas-latest-update-adds-3d-maps-to-its-mobile-apps>
2. BikeRadar, "Strava adds 3D maps to mobile app": <https://www.bikeradar.com/news/strava-3d-maps>
3. TechRadar, Strava map rendering overhaul (FATMAP tech): <https://www.techradar.com/health-fitness/strava-has-added-four-new-features-users-will-love-including-a-massive-map-rendering-overhaul>
4. Bikerumor, Strava heatmaps in 3D ("Show 3D Terrain", Ctrl+click-drag): <https://bikerumor.com/2021/04/26/strava-heatmaps-expand-up-into-3d-giving-a-whole-new-ride-perspective/>
5. Strava Support, "Flyover": <https://support.strava.com/hc/en-us/articles/19900004650125-Flyover>
6. DC Rainmaker, "Strava launches activity flyover": <https://dcrainmaker.com/2023/11/launches-activity-flyover.html>
7. Notebookcheck, "Garmin announces new 3D maps feature for some users": <https://www.notebookcheck.net/Garmin-announces-new-3D-maps-feature-for-some-users.1165744.0.html>
8. the5krunner, "Ride with GPS 3D Maps: Wider Access Than Garmin, Komoot": <https://the5krunner.com/2026/09/17/ride-with-gps-3d-maps/>
9. BIKE Magazin, "Route planning with Komoot: new 3D maps feature": <https://www.bike-magazin.de/en/bike-computer/route-planning-with-komoot-new-3d-maps-feature/>
10. TOUR Magazin, "3D maps in Komoot Premium": <https://www.tour-magazin.de/en/tours/route-planning-3d-maps-in-komoot-premium/>
11. Suunto, "Play your adventures back in 3D in Suunto app": <https://us.suunto.com/blogs/blog/play-your-adventures-back-in-3d-in-suunto-app/>
12. TechCrunch, "Meet Relive": <https://techcrunch.com/2017/05/02/relive/>
13. Esri ArcNews, "With 3D maps athletes relive their global adventures": <https://www.esri.com/esri-news/arcnews/winter18articles/with-3d-maps-athletes-relive-their-global-adventures>
14. Marathon Handbook, "Strava releases Flyover" (FATMAP acquisition): <https://marathonhandbook.com/strava-flyover/>
15. COROS Support, "3D Map" (403 when fetched): <https://support.coros.com/hc/en-us/articles/4416359298964-3D-Map>
16. COROS Support, "January 2022 Firmware Update": <https://support.coros.com/hc/en-us/articles/19898172749332-January-2022-Firmware-Update>
17. COROS, "Your favorite features of 2025": <https://coros.com/au/stories/latest-news/c/2025-top-features>
18. intervals.icu forum (no 3D map found; absence, unverified): <https://forum.intervals.icu/t/activity-skyline-chart-on-the-calendar/59341/49>
19. SportsTrackLive, "3D player overview": <https://docs.sportstracklive.com/player-3d/overview>
20. HiiKER, "What is Elevation Exaggeration?": <https://support.hiiker.app/?p=3338>
21. MapLibre GL JS, "Display map navigation controls" (`visualizePitch`): <https://maplibre.org/maplibre-gl-js/docs/examples/display-map-navigation-controls/>
22. MapLibre, "3D terrain" (raster-dem + exaggeration): <https://maplibre.org/news/2022-05-20-terrain3d/>
