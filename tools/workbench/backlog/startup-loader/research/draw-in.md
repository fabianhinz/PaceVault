# Research: track draw-in choreography (TripsLayer)

Scope: how the whole library draws in on the overview map after the startup loader fades, with deck.gl `TripsLayer` (`@deck.gl/geo-layers` 9.2), and how the onboarding preview moves to the same layer. Research only; the owner decides. Sources are numbered [n] at the end.

## What TripsLayer actually does (9.2 source, [1])

These facts constrain every variant below:

- `TripsLayer extends PathLayer`. It adds one per-vertex float attribute (`timestamps`, `size: 1`, so **float32**) and three uniforms: `currentTime`, `trailLength`, `fadeTrail` [1].
- Fragment shader: `if (vTime > currentTime || (fadeTrail && vTime < currentTime - trailLength)) discard;` and with `fadeTrail` the alpha is multiplied by `1 - (currentTime - vTime) / trailLength` [1]. With `fadeTrail: false` the drawn prefix stays at full alpha, which is a plain draw-in.
- `currentTime` is **one global clock** for all paths. Stagger, per-track duration and easing are not props: they have to be **baked into each track's timestamps** (`t_i = start + duration * easeInverse(cum_i / length)`).
- `vTime` is interpolated linearly between two vertices [1], so baked easing is piecewise linear per segment. With the simplified tracks (5 m tolerance, `packages/engine/src/gps.ts:70`) that is not visible.
- The head is a fragment-level cut, so it ends flat mid-segment (no round cap at the moving head). At overview zoom tracks render at `widthMinPixels: 1` (`apps/web/src/features/map/DeckGLOverlay.tsx:178`), so the head shape is not visible.
- Docs: timestamps are float32, "raw unix epoch time can not be used"; check with `Math.fround(t)` [2]. `currentTime` and `trailLength` "support transitions" [2], so deck's transition manager can run the clock (`transitions: { currentTime: { duration, easing, onEnd } }`) without a React re-render per frame (stated by the docs, not tested here).
- The official example drives `currentTime` from a JS animation (`popmotion` `animate`, `onUpdate: setTime`) [3]; Google's and CARTO's examples do the same with rAF + modulo loop [4][5]. None shows a one-shot draw-in of many routes; all are looping taxi trails.

Repo facts that matter:

- `SessionGPS` holds only `encodedPolyline`, `pointCount`, `bounds` (`packages/engine/src/types.ts:135-140`): **no per-point recording time** survives the GPS build. Real-time timestamps would need a data change.
- On touch devices the overlay is interleaved (`apps/web/src/features/map/DeckGLOverlay.tsx:420`), so every animation frame also repaints the MapLibre basemap. The draw-in should not run longer than it must.
- The onboarding layer is drawn under the tracks (`apps/web/src/features/map/DeckGLOverlay.tsx:424-426`); both use `ADDITIVE_BLEND` (`apps/web/src/features/map/trackColors.ts:4-11`). Additive blending is order-independent, so the draw order of draw-in vs. `gps-tracks` does not change the final pixels.

## 1. Comparable products

| Product                                  | How many routes appear                                                                                                   | Verified?                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Strava personal heatmap                  | Static heatmap of all own activities; time-range, colour and sport filters, 3D mode. No draw-in animation is described.  | Feature [6][7]; "no animation" is unverified (absence in the sources only)       |
| Strava global heatmap (3D)               | Static tiles draped on terrain.                                                                                          | [8]                                                                              |
| Strava Year in Sport                     | Animated recap of graphics and stats; 2023 edition used a polyline as a visual motif, not a map of all routes.           | [9]; whether a recent edition draws all routes on a map is unverified            |
| Strava Flyover                           | Single activity: full orange line already visible, a dot moves along it in a 3D camera flight, ~1 min per hour.          | [10]                                                                             |
| Relive                                   | Single activity: 3D flyover video, the line grows with the camera, photos pinned along the route.                        | [11][12]                                                                         |
| Relive "your year" (2016)                | Personalised film with an avatar riding through scenery; not a map of routes.                                            | [13]                                                                             |
| Komoot                                   | Animated direction markers along a single tour on the Discover map; no multi-route draw-in found.                        | [14]; recap animation unverified                                                 |
| Wandrer                                  | Static map colouring travelled (blue) vs. untravelled (red) roads; no draw-in.                                           | [15]                                                                             |
| Jonathan O'Keeffe "Strava multiple ride mapper" | Draws **all activities in chronological order**; users say it adds ~5 activities per frame, too fast to follow, no speed control. | [16] (forum report)                                                         |
| CityStrides LifeMap "Re-Run"             | Replays "your life's activities" on the LifeMap; users asked for a speed slider and said a single activity "just flashed on". | [16][17]; exact choreography unverified                                     |
| deck.gl / Google / CARTO trips examples  | Thousands of taxi trips, looping clock, `trailLength` 180, fading comet trails; all trips share one clock.               | [3][4][5]                                                                        |

Takeaways: no comparable product draws a whole personal library in as an intro. The closest is the chronological replay (O'Keeffe, CityStrides), and its user complaint is the pace: with many activities a chronological order turns into "many per frame". Single-activity products (Relive, Flyover) grow one line with the camera, which does not transfer to thousands of tracks. The comet-trail look is the deck.gl house style for "many moving things", not for "a map building up".

## 2. Patterns

Scale columns: 10 tracks vs. 3,000 tracks (~1–1.5 M vertices, estimate from simplified tracks; not measured).

| Pattern                                                  | 10 tracks                                              | 3,000 tracks                                                             | 390 px phone                                                        | GPU / memory                                                                 | Effort                                  | Risks                                                                                                   |
| -------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **T1 Timestamps = cumulative distance (m)** (plan's line) | Long ride dominates, short runs finish instantly       | Total time = longest track / speed; a few 200 km rides leave a long tail | Short runs are one pixel and "pop"                                  | +4 B/vertex                                                                  | Low (cumulative already in `previewDrawIn.ts:36-48`) | Duration unbounded unless capped; needs a speed or a per-track scale anyway                          |
| **T2 Normalised 0–1 per track, baked start + duration + easing** | Every track visibly draws, like onboarding today | Same total time regardless of library; overlapping routes draw in parallel | Fine                                                              | +4 B/vertex                                                                  | Low                                     | Short and long tracks draw at very different ground speeds (reads as "all at once")                    |
| **T3 Real recording time**                               | Most "true"                                            | Same tail problem as T1, worse (multi-hour rides)                        | –                                                                   | +4 B/vertex                                                                  | High: not stored (`types.ts:135-140`)   | Needs a GPS data change and re-backfill; out of scope unless the owner wants it                       |
| **S0 All at once** (no stagger)                          | Calm, uniform                                          | One synchronous bloom; reads as a fade-in with direction                 | Fine                                                                | –                                                                            | Lowest                                  | Looks mechanical with few tracks                                                                        |
| **S1 Seeded random stagger** (today's onboarding)        | Lively, each route noticeable                          | Becomes a uniform shimmer; individual starts invisible                   | Fine                                                                | –                                                                            | Low (reuse `createSeededRandom`)        | None notable                                                                                            |
| **S2 Chronological by session date**                     | Tells a story only if dates span time                  | O'Keeffe effect: dozens per frame [16]; reads as random unless slow      | Fine                                                                | –                                                                            | Low (sessions store has dates)          | Needs ≥5–10 s to be legible with large libraries; one-day imports collapse to S0                       |
| **S3 By distance from viewport centre (ripple)**         | Barely noticeable                                      | Outward wave; dense home cluster lights first                            | Wave crosses a phone screen fast                                    | –                                                                            | Low (start point or bbox centre vs. camera centre) | Libraries with two far regions start in empty space between them                                  |
| **D Total duration** 1.5 s / 2.5 s / 4 s                 | 1.5 s feels abrupt for 10                              | 4 s is long on every reload (Q6: every page reload)                       | –                                                                   | Every frame repaints basemap on touch (interleaved, `DeckGLOverlay.tsx:420`) | –                                       | Longer = more battery and more risk of dropped frames                                                  |
| **F0 `fadeTrail: false`** (pure draw-in)                 | Clean                                                  | Clean                                                                    | Fine                                                                | 1 layer                                                                      | Lowest                                  | `trailLength` unused                                                                                    |
| **F1 Comet head**: second TripsLayer, `fadeTrail: true`, short `trailLength`, higher alpha, on top of F0 | Visible bright heads | Thousands of bright heads add to white in dense areas (additive) | Heads 1 px; little visible | 2nd layer: +1× vertex buffers and +1 draw during the draw-in | Medium | Heads in sport colour at full alpha may wash out to white, against the §3 heat-ramp rule |
| **H1 No swap: `gps-tracks` becomes a TripsLayer**, clock parked past the end | No jump possible | No jump, no rebuild | – | +4 B/vertex permanently | Low–medium (merge `transitions` with the hover ones, `DeckGLOverlay.tsx:55,186`) | Picking attributes when toggling `pickable` (unverified whether deck regenerates them); every later data change also rebuilds timestamps |
| **H2 Swap to a pre-built hidden `gps-tracks`** (`visible: false` during draw-in, flip at `onEnd`) | Invisible swap if colour, alpha, width match | Same | – | 2× vertex buffers during draw-in | Medium | Building `gps-tracks` after the swap instead of before would cost one long frame (attribute generation for ~1 M vertices, estimate); the TripsLayer must show `trackIntensityAlpha[trackIntensity]` to match |
| **H3 Cross-fade** (draw-in alpha down, `gps-tracks` `opacity` up, sum constant) | Smooth | Smooth | – | 2× buffers and 2× draw during the fade | Medium | With additive blend, a constant opacity sum gives constant brightness only if both layers are identical; any mismatch shows a pulse. Whether layer `opacity` transitions is unverified |
| **J Onboarding two-pass jitter**                         | Two rows per demo route in the same TripsLayer data, each with its own baked start/duration; heat still builds | n/a (onboarding only) | Same as today | 38 rows, negligible | Low: `buildPreviewPasses` keeps jitter + stagger, only `slicePath` and the rAF loop go | Real libraries need no jitter: real overlaps build heat already |

Precision: T2 in milliseconds (0–5,000) or T1 in metres (≤ 300 km) are both far inside float32's 24-bit mantissa (resolution ≈ 0.0005 ms resp. ≈ 0.03 m). Only epoch time (T3 raw) breaks [2].

Upload time: computing cumulative distance for ~1 M vertices is one haversine per vertex in JS (tens of ms on desktop, unmeasured on phones); it can run behind the loader, next to `decodeCached` (`apps/web/src/features/map/hooks/types.ts:8-15`), or in the GPS worker. The GPU upload happens on the first frame the layer exists, so creating the layer while the loader still covers the map hides that frame.

"One frame of nothing": only possible with a swap where the old layer leaves the `layers` array before the new one has buffers (H2 done late) or with a `currentTime` that starts above 0 on the first frame. H1 and H2-prebuilt avoid it.

## 3. Shortlist

Each variant names its timestamps (T), stagger (S), trail (F) and hand-off (H). Time axis: 0 = loader gone.

**V1 Bloom** (T2, S0, F0, H1, ~1.5 s, global easeOutCubic): everything grows at once, then is simply the map.

```
0 s ───────────────────── 1.5 s
all  ████████████████████▶ done → pickable on (same layer)
```

Rationale: cheapest and shortest on every reload; looks identical at 10 and 3,000 tracks.

**V2 Scatter** (T2, S1, F0, H1; onboarding values scaled: stagger ~1.0 s, 0.8–1.4 s per track, easeOutCubic baked): today's onboarding feel, one technique for both.

```
0 s ─────────── 1.0 ──────── 2.4 s
a ██████████▶
b    ████████████▶
c       ██████████▶
…            (start seeded-random over 0–1.0 s)
z           ████████████▶ done → pickable on
```

Rationale: the onboarding moves over 1:1 (two passes = two rows), and returning users see the same motion they saw at onboarding.

**V3 Ripple** (T2, S3 by start-point distance to the camera centre, F0, H1, ~2–2.5 s): the library spreads outward from the middle of the view.

```
           ░ ░ ▒ ▒ ▓ █ ▓ ▒ ▒ ░ ░        start time by distance:
t=0.0  ·      centre tracks begin       centre ── 0 s
t=1.0  ·      ring 2 begins             edge   ── ~1.2 s
t=2.4  ·      edges done → pickable on
```

Rationale: strongest sense of "your map building up" for one home region; weaker for libraries split across far regions.

**V4 Timeline** (T2, S2 oldest → newest, F0, H1, ~3–4 s, short per-track duration ~0.6 s): history accumulates in recording order.

```
2019 ▶▶▶ 2020 ▶▶▶▶ 2021 ▶▶▶▶▶ … 2026 ▶ done
0 s ──────────────────────────── 3.5 s
```

Rationale: the only variant with a meaning beyond decoration; comparable products (O'Keeffe, CityStrides) do this, but at thousands of tracks it reads as random unless slow [16].

**V5 Comets** (V2 + F1 head layer, `trailLength` ~0.25 s, H1 for the base layer, head layer removed at the end): bright heads race ahead, the trail stays.

```
base (F0)  ████████████▶
head (F1)            ▓▒░  ← short fading bright segment at the front
end: head layer removed, base stays as gps-tracks
```

Rationale: most "alive" for small libraries; costs a second layer and risks white wash-out at 3,000 tracks.

**V6 Ground speed** (T1 cumulative metres at one speed, capped: tracks longer than the cap get a scaled clock, S1 small stagger, F0, H1, ~2.5 s): every route draws at the same ground speed, long rides keep going.

```
5 km run   ██▶
20 km run  ████████▶
120 km ride████████████████████▶ (capped at 2.5 s)
```

Rationale: matches the plan's current wording ("cumulative distance"); physically honest, but the length mix decides the look.

**Would test first: V2 Scatter with H1.** It is the smallest change from the onboarding the owner already approved, covers the onboarding move in the same step, has no swap (no jump, no blank frame) and no extra layer; V1 is the fallback if 3,000 tracks on a phone drop frames, V3/V4 only change the stagger key, so they can be tried on the same code.

## 4. Open questions

- **OQ1 Timestamp basis:** (a) normalised per track (T2, all tracks finish in the same window); (b) cumulative distance at one ground speed with a cap (T1, the plan's wording); (c) real recording time (needs a GPS data change, out of scope today).
- **OQ2 Stagger order:** (a) seeded random, as in onboarding; (b) chronological by session date; (c) outward from the map centre; (d) none, all at once.
- **OQ3 Total duration on every reload:** (a) ~1.5 s; (b) ~2.5 s (close to today's 1 s flight plus settle); (c) ~4 s (onboarding length). Same value for 10 and 3,000 tracks, or scaled by library size?
- **OQ4 Trail look:** (a) plain draw-in (`fadeTrail: false`); (b) plus bright comet heads (second layer, wash-out risk in dense areas).
- **OQ5 Hand-off:** (a) `gps-tracks` itself becomes a TripsLayer and stays one (no swap, +4 B/vertex permanently); (b) separate draw-in layer, swap to a pre-built hidden `gps-tracks`; (c) cross-fade.
- **OQ6 Onboarding parity:** (a) onboarding keeps its own timing (4.2 s, two passes) on the shared layer; (b) onboarding uses the same choreography and timing as the startup draw-in, keeping only the two-pass jitter.
- **OQ7 Alpha during the draw-in:** (a) the user's `trackIntensity` alpha, so the last frame equals the final map; (b) a fixed alpha (onboarding uses `faint`, `useOnboardingPreviewLayer.ts:51`) with a jump or fade to the user's intensity at the end.
- **OQ8 Phone check:** acceptable to decide on a desktop look and verify frame rate on a mid-range phone with a large library afterwards (V1 as fallback), or measure first? (The owner skipped measuring for the library choice, plan "Likely approach".)

## Sources

1. deck.gl 9.2 TripsLayer source: https://github.com/visgl/deck.gl/blob/9.2-release/modules/geo-layers/src/trips-layer/trips-layer.ts and https://github.com/visgl/deck.gl/blob/9.2-release/modules/geo-layers/src/trips-layer/trips-layer-uniforms.ts
2. deck.gl TripsLayer docs: https://deck.gl/docs/api-reference/geo-layers/trips-layer
3. deck.gl trips example (9.2): https://github.com/visgl/deck.gl/blob/9.2-release/examples/website/trips/app.tsx
4. Google Maps + deck.gl TripsLayer example: https://developers.google.cn/maps/documentation/javascript/examples/deckgl-tripslayer
5. CARTO TripsLayer example: https://docs.carto.com/google-maps/examples/advanced-examples/trips-layer
6. BikeRadar, Strava personal heatmap update: https://www.bikeradar.com/news/strava-personal-heatmap/
7. Android Authority, how to use Strava's personal heatmap: https://www.androidauthority.com/how-to-use-personal-heatmap-strava-3234626
8. Mapbox blog, Strava activities in 3D mode: https://www.mapbox.com/blog/3-billion-strava-activities-mapped-in-3d-mode
9. Hello Monday, Strava Year in Sport 2023: https://hellomonday.com/work/strava-year-in-sport-2023
10. DC Rainmaker, Strava Activity Flyover: https://dcrainmaker.com/2023/11/launches-activity-flyover.html
11. TechCrunch, Relive: https://techcrunch.com/2017/05/02/relive
12. road.cc, Strava flyover 3D video maps: https://www.road.cc/content/tech-news/strava-introduces-flyover-3d-video-maps-305103
13. road.cc, Relive your year: https://road.cc/index.php/news/174018-relive-your-year-strava-personalised-animated-film/
14. BikePerfect, Komoot Discover map: https://www.bikeperfect.com/news/komoot-launches-new-discover-features-with-a-new-industry-leading-map-interface-and-location-specific-personalized-tours
15. Wandrer FAQ: https://wandrer.earth/faq
16. CityStrides forum, mapping progress visualisation: https://community.citystrides.com/t/mapping-progress-visualization/20977
17. CityStrides, updates on March 17, 2021: https://community.citystrides.com/t/updates-on-march-17-2021/22682
