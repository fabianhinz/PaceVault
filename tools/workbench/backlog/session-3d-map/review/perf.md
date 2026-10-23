# 3D session map: performance, app vs mockup embed

Measured 2026-10-23 on the `feat/3d-map` working tree. The app is the production build, the comparison is `mockup/embed.html`, and both use the same Lechlauf Ultra FIT file. Nothing in the repo was changed for this.

## Setup

| | |
|---|---|
| Machine | Apple M5 (macOS), real GPU |
| Browser | Playwright 1.58.2 Chromium (`channel: 'chromium'`, HeadlessChrome 145), `--use-angle=metal --enable-gpu --ignore-gpu-blocklist` |
| GPU renderer (`UNMASKED_RENDERER_WEBGL`) | `ANGLE (Apple, ANGLE Metal Renderer: Apple M5, Unspecified Version)` |
| Context | 390×844, deviceScaleFactor 3, isMobile, hasTouch, locale en-US; rAF runs at 120 Hz (8.3 ms frames) |
| CPU | CDP `Emulation.setCPUThrottlingRate` 1×, 4×, 6× (only the CPU is throttled; the M5 GPU is not) |
| Network | none during page load; DevTools "Fast 4G" (165 ms RTT, 8.1 Mbit/s down, 1.35 Mbit/s up) from the 3D tap until the map is idle |
| App | `vp build` in `apps/web`, served by `vp preview --port 4175`. One persistent profile: onboarding seeded as in `e2e/helpers/seed.ts`, the FIT imported through Settings › Data. The default lap source is **54 splits** |
| Embed | `tools/workbench` served statically on :8766 (`no-store`), `/backlog/session-3d-map/mockup/embed.html`. maplibre-gl 5.18.0 and deck.gl 9.2.9 come from the CDN, data from `data/tracks.js` (2.1 MB, every record). It has **60 device laps** |
| Cache states | **cold**: Cache Storage (except the precache) and the HTTP cache are cleared before the run. **warm**: runs on the same profile without clearing. In the app the Mapterhorn and Carto tiles go through the service worker (`CacheFirst`, `apps/web/vite.config.ts:65-74`). CDP network emulation on the page does **not** throttle service-worker fetches, so the app's cold 3D entry fetched its DEM tiles at full speed. The embed has no service worker, and its cold runs show the real Fast 4G cost |
| Runs | for each target × rate: 3 cold runs (load and 2D→3D only) and 3 warm runs (all scenarios). Tables show the median. Lap switches are the median of 5 switches × 3 runs |

### How each number was obtained

- An init script installs a `PerformanceObserver({type:'longtask'})`, a continuous rAF timestamp log, a capture-phase `touchstart` timestamp log, and the map handle. In the app the handle comes through the React fiber, as in `e2e/helpers/map.ts` `exposeMap`. In the embed it comes from wrapping `maplibregl.Map`. On the map it logs `render`, `idle` and `move` (with pitch), and wraps `setFeatureState` to timestamp it.
- **Load → idle**: `performance.now()` of the last map `idle` event, after `page.goto` of the session page or embed, followed by 2 s with no map render.
- **2D → 3D**: t0 is the `touchstart` timestamp of the "3D" radio tap (real taps via Playwright `tap()`). The first tilted frame is the first `move` with pitch ≠ 0, then pitch reaches 30, then the last `idle`. "Dropped frames" counts rAF intervals over the 8.3 ms frame in the 800 ms after the first tilted frame. Main-thread busy is the CDP `Performance.getMetrics` `TaskDuration` delta.
- **Lap switch**: 5 taps on "next lap". For each tap: the `TaskDuration` delta over 1.6 s (this includes the lap fit animation), the rAF frame that contains the tap, the time to the first `setFeatureState` (3D), the time to the stepper label change, and the time to the first map `render` after that. "rAF frames to highlight" is the number of rAF ticks between the tap and that render.
- **Gestures**: CDP `Input.dispatchTouchEvent`, 40 moves × 16 ms. Pan is one finger. Pinch is two fingers spreading 60 → 200 px. Tilt is two fingers moving up 70 px. Rotate is two fingers twisting about 45°. Frame p50 and p95 come from rAF intervals.
- **Chart scrub**: 61 CDP `mouseMoved` events across the first chart (HR in the app, the first chart row in the embed). The figure is the `TaskDuration` delta divided by the number of moves.
- **Profiles**: CDP `Profiler` at a 100 µs sampling interval, 4×, around the 3D entry, one 3D lap switch and a 31-move 3D scrub. A 6× profile covers a 3D pinch and pan. App frames are resolved through the build's source maps. Profiles cover the main thread only (GeoJSON tiling runs in MapLibre's worker and is not in them).

## Results

### 1. Session page load → map idle (ms)

| | app 1× | embed 1× | app 4× | embed 4× | app 6× | embed 6× |
|---|---:|---:|---:|---:|---:|---:|
| cold: last idle | 2210 | 646 | 3724 | 1137 | 4887 | 1129 |
| cold: longest task | 193 | 0 | 827 | 154 | 1164 | 204 |
| warm: last idle | 2265 | 526 | 3519 | 989 | 4249 | 1300 |
| warm: longest task | 192 | 0 | 614 | 208 | 1212 | 237 |

The two are not comparable one to one. The app boots the whole SPA, reads the records from IndexedDB, decodes them and builds the charts. The embed has everything precomputed in `tracks.js`. The page load is 2D and the item does not change it. The app's 0.6–1.2 s load task at 4–6× is a separate topic (see Adjacent).

### 2. 2D → 3D (ms)

| | app 1× | embed 1× | app 4× | embed 4× | app 6× | embed 6× |
|---|---:|---:|---:|---:|---:|---:|
| warm: tap → first tilted frame | 598 | 283 | 859 | 653 | 1187 | 910 |
| warm: tap → pitch 30 | 1231 | 1225 | 1482 | 1584 | 1858 | 1837 |
| warm: tap → map idle | 1565 | 1701 | 1737 | 2130 | 2554 | 2439 |
| warm: longest task | 69 | 149 | 305 | 493 | 545 | 748 |
| warm: longest frame | 75 | 233 | 325 | 575 | 567 | 834 |
| warm: dropped frames in the 800 ms tilt | 3 | 5 | 18 | 20 | 24 | 4 |
| warm: main-thread busy tap → idle | 769 | 808 | 1783 | 2048 | 2621 | 2449 |
| cold: tap → first tilted frame | 582 | 282 | 792 | 768 | 1157 | 877 |
| cold: tap → map idle | 1559 | 3533 | 1953 | 4046 | 2419 | 4248 |
| cold: longest task | 86 | 147 | 329 | 619 | 474 | 723 |

3D → 2D (warm), app vs embed: tap → pitch 0 takes 765 vs 1155 ms at 1× and 793 vs 1237 ms at 6×. The longest task is 0–68 ms in the app and 0–112 ms in the embed. Going back to 2D is not a problem.

### 3. Lap switch, "next lap" ×5

| 3D | app 1× | embed 1× | app 4× | embed 4× | app 6× | embed 6× |
|---|---:|---:|---:|---:|---:|---:|
| main-thread busy per switch, incl. 800 ms fit (ms) | 307 | 252 | 869 | 869 | 1154 | 941 |
| frame containing the tap (ms) | 25 | 17 | 58 | 58 | 134 | 83 |
| frame p95 in 1.5 s (ms) | 8.7 | 9.0 | 16.1 | 9.3 | 33.3 | 17.4 |
| longest task (ms) | 0 | 0 | 50 | 0 | 111 | 62 |
| tap → setFeatureState (ms) | 16 | 22 | 21 | 28 | 40 | 32 |
| tap → first map render with highlight (ms) | 39 | 38 | 75 | 70 | 151 | 94 |
| rAF frames tap → highlight | 3 | 4 | 3 | 3 | 2 | 3 |

| 2D | app 1× | embed 1× | app 4× | embed 4× | app 6× | embed 6× |
|---|---:|---:|---:|---:|---:|---:|
| main-thread busy per switch (ms) | 195 | 189 | 559 | 601 | 764 | 730 |
| frame containing the tap (ms) | 9 | 9 | 17 | 16 | 33 | 25 |
| tap → first map render after commit (ms) | 21 | 27 | 33 | 35 | 48 | 47 |

The highlight lands in the first map render after the React commit. That is 2–3 rAF ticks after the tap: the tap's own task, the commit, then the render. In 3D the app matches the embed at 1× and 4×. At 6× the tap frame is about 50 ms longer (134 vs 83 ms) because of the React and chart work that runs around the lap change.

### 4. Gestures (frame-time ms; 120 Hz rAF, so 8.3 means every frame)

| | app 1× | embed 1× | app 4× | embed 4× | app 6× | embed 6× |
|---|---:|---:|---:|---:|---:|---:|
| pan 3D p50 / p95 | 8.3 / 9.3 | 8.3 / 9.0 | 8.4 / 33.1 | 8.4 / 24.7 | 16.6 / 41.8 | 9.1 / 25.6 |
| pinch 3D p50 / p95 | 8.3 / 8.8 | 8.3 / 9.0 | 8.3 / 16.8 | 8.3 / 16.0 | 16.9 / 49.9 | 8.3 / 17.4 |
| tilt 3D p50 / p95 | 8.3 / 8.8 | 8.3 / 25.0 | 8.4 / 24.8 | 8.3 / 17.5 | 17.0 / 42.2 | 8.4 / 24.4 |
| rotate 3D p50 / p95 | 8.3 / 8.9 | 8.3 / 9.0 | 8.7 / 33.5 | 8.4 / 25.1 | 16.5 / 42.3 | 8.7 / 25.6 |
| frames > 33 ms per gesture, 3D (pan/pinch/tilt/rotate) | 0/0/0/0 | 0/0/3/0 | 4/4/2/9 | 1/0/0/2 | 22/28/24/21 | 4/2/1/2 |
| pan 2D p50 / p95 | 8.3 / 8.7 | 8.3 / 8.9 | 8.3 / 9.2 | 8.3 / 9.2 | 8.4 / 16.7 | 8.3 / 9.3 |

### 5. Chart scrub (61 cursor moves)

| | app 1× | embed 1× | app 4× | embed 4× | app 6× | embed 6× |
|---|---:|---:|---:|---:|---:|---:|
| **3D: main-thread ms per move** | **81** | 26 | **276** | 89 | **446** | 127 |
| 3D: frame p95 (ms) | 208 | 33 | 842 | 142 | 1284 | 200 |
| 3D: longest task (ms) | 230 | 0 | 934 | 148 | 1410 | 204 |
| 3D: long tasks | 26 | 0 | 41 | 44 | 49 | 61 |
| 2D: main-thread ms per move | 10 | 14 | 26 | 53 | 45 | 77 |
| 2D: frame p95 (ms) | 8.7 | 9.1 | 41.7 | 42.2 | 67.3 | 83.3 |

## Profile findings (app, 4×)

**Entering 3D:** 2.27 s busy in a 3.8 s window. The longest task is about 300 ms.
- About 296 ms (inclusive) is in the `setData` effect at `apps/web/src/features/map/hooks/useTerrainLineEffect.ts:142-146`. About 266 ms of that is MapLibre `setData` → `_updateWorkerData` → `sendAsync`, the structured clone of the ~37,800 segment features to the worker. About 50 ms is `buildTerrainLineSegments` (`apps/web/src/features/map/terrainLine.ts:55`) with its two `toCss` strings per segment (`terrainLine.ts:38`).
- About 60–75 ms is a second record load and path build. `SessionTerrain` calls `useSessionDetailPath` again (`apps/web/src/features/map/SessionTerrain.tsx:30`, while `DeckGLOverlay.tsx:85` already holds the path), which reads IndexedDB and decodes with `recordCodec.ts` (48 ms) and rebuilds through `zoneColoredPath.ts` (8 ms).
- About 75 ms is the per-frame terrain ease (`apps/web/src/features/map/terrainCamera.ts:270`, `jumpTo` once per frame).
- The rest is MapLibre's first terrain and hillshade render (`_render` 1.1 s inclusive across the window, `getTerrainData` 97 ms, shader compile `getShaderParameter` 45 ms).
- **The DEM settle wait always runs into its 500 ms timeout, even with warm tiles.** A probe logged `isSourceLoaded('terrain-dem')` every rAF and found it first true only at about 670 ms after the tap, 30 ms *after* the tilt had started (at 4×: 736 ms vs 706 ms). The service worker cache held 81 Mapterhorn tiles at the time. `whenTerrainSettled` (`apps/web/src/features/map/terrainCamera.ts:117`, condition at `terrainCamera.ts:110-115`) therefore always resolves `false` through the timeout (`terrainCamera.ts:12`, awaited at `apps/web/src/features/map/hooks/useMapCameraEffect.ts:166`). That is why the app's tap → first tilted frame is about 300 ms later than the embed's at 1×, and the tilt then uses the median record elevation instead of the DEM.

**Lap switch in 3D:** 1.02 s busy in 1.86 s, almost all of it the 800 ms fit animation. That is MapLibre terrain rendering (`_render` 614 ms, `getTerrainData` 72 ms, `jumpTo` 68 ms) and the ease step (`terrainCamera.ts:270`, 69 ms). The lap state itself is small: `useTerrainLapStateEffect` takes 2.6 ms and `updatePaintArrays` 10 ms. React and charts add about 50 ms (`SessionChartsExplorer.tsx` memo 14–16 ms, `railRange.ts` 12 ms, `movingTime.ts` 10 ms, reselect 35 ms self).

**Chart scrub in 3D:** this is the outlier. The profile is 11.1 s busy for 31 moves. MapLibre `Style.prepare` → `coalesceChanges` → `SourceCache.setFeatureState` → `updatePaintArrays` accounts for **9.1 s** (`readFields`, `getPositions` and `evaluate` re-reading every changed feature's geometry in every tile, once per layer that reads feature state). The trigger is `useTerrainLapStateEffect` (`apps/web/src/features/map/hooks/useTerrainLapStateEffect.ts:47-54`). The chart cursor changes `hoveredLapIndex` (`apps/web/src/features/sessions/charts/SessionChartsExplorer.tsx:172`) on almost every move, because with 54 laps the cursor crosses a lap almost every step. Each change runs `removeFeatureState` on the whole source (line 49) and then re-marks the selected lap *and* the hovered lap segment by segment (lines 52-53). In the next frame MapLibre re-evaluates the paint arrays for all those features. The embed does the same feature-state work, but only as a diff (old lap off, new lap on, `mockup/maps.js:575-599`, never the selected lap again). Its `updatePaintArrays` takes 1.7 s for the same 31 moves, about 5× less.

**3D gestures (6× pinch and pan):** about 2.3 s busy in 3.1 s for both targets. Shared costs dominate: MapLibre terrain render, `getTerrainData`, `uniformMatrix4fv`, and `readPixels` at 180 ms (MapLibre's terrain coordinate readback for `unproject` during touch moves, a synchronous GPU stall). The app adds the deck.gl `MapboxOverlay`, which keeps redrawing every frame in 3D with no layers (about 85 ms in luma.gl's state tracker, plus `deck-utils` and `setProps`), and about 30 ms of React. This fits the app's higher count of frames over 33 ms at 6×. At 1× and 4× the two are close.

## Shared vs mockup-only costs

| Cost | App | Embed |
|---|---|---|
| Terrain and hillshade render per frame, `getTerrainData`, `readPixels` on touch | yes | yes (same MapLibre 5.18) |
| Structured clone of ~37,800 segment features to the GeoJSON worker on entering 3D | yes (~266 ms at 4×) | yes (~420 ms `sendAsync` at 4×, plus the UI re-render) |
| Per-frame `jumpTo` ease with elevation (3D fits) | yes | yes |
| Feature-state lap highlight on the 37,800-feature source | yes, **full reset + re-mark on every hover change** | yes, diff only |
| deck.gl overlay still redrawing in 3D | yes | yes (layers `[]`) |
| Second record load + path build on entering 3D | **app only** (~60–75 ms at 4×) | no |
| 500 ms DEM settle timeout before the tilt | **app only** (always hit) | no (tilt starts at ~280 ms) |
| Parsing the 2.1 MB `tracks.js` data script; unbundled CDN maplibre-gl + deck.gl `dist.min.js` (no tree shaking, no SW cache, `no-store` on the local scripts) | no | **mockup only** |
| Full UI re-render on every state change (`PV.setLocal` → `render` → `renderUi` + `M.update`): the 3D click handler is one 530 ms task at 4×, `ensureTrack` 453 ms | no | **mockup only** |
| DOM rail and statistics repaint on every chart move (`restReading`/`stats` 780 ms of the 3.7 s scrub profile) | no | **mockup only** |
| Cold DEM tiles over the network (Fast 4G: idle 3.5–4.2 s cold vs 1.7–2.4 s warm) | yes in real use (the SW caches repeats; not throttled in this setup) | yes, no SW |

What this means for the iPhone report: the embed's lag on the phone comes from the shared terrain rendering plus mockup-only costs (data script parse, re-render on every change, DOM repaint while scrubbing, no tile cache). The app avoids the mockup-only costs and matches or beats the embed on 3D entry, lap switches and 2D. It is clearly worse in one scenario, chart scrubbing in 3D: 3–4× the embed's main-thread cost and frames up to 0.9–1.4 s at 4–6×. That would read as "really laggy" on a phone. A note on throttling: an iPhone 17's CPU is closer to the M5 than 4–6× suggests, but its GPU, the 3× fill and thermal limits are not emulated here. So the GPU-bound terrain costs (`readPixels`, terrain render) may weigh more on the phone than these numbers show.

## Suggestions (ranked, not implemented)

1. **Stop the full feature-state reset on hover** (`apps/web/src/features/map/hooks/useTerrainLapStateEffect.ts:47-54`). Split it into a selected effect and a hovered effect, each clearing only its previous lap's segments and marking only the new lap's, as the mockup does. Better still, draw the hover preview from its own small GeoJSON source holding one lap's sub-path (a white 3 px line needs no per-segment colours, and a few frames of `setData` lag are fine for a hover preview). *Expected:* 3D scrub goes from 276 to ≤ 90 ms per move at 4× with the diff (embed level), and to roughly 2D level (~26 ms) with a separate hover source. This removes the 0.9–1.4 s frames.
2. **Fewer, longer features on the 3D track** (`terrainLine.ts:55`, `useTerrainLineEffect.ts:142-146`). Merge consecutive segments with the same colour into one LineString, cut at lap boundaries, with the id → lap index. Features drop from ~37,800 to colour runs × laps (54 for sport colour, a few thousand for zone colours). That shrinks the worker clone, the geojson-vt tiling and every feature-state update. *Expected:* the 3D entry long task drops by about 250 ms at 4×, and lap highlights become a handful of `setFeatureState` calls. *Trade-off:* picking (`pickTerrainLineVertex`/`nearestLineVertex`, `terrainLine.ts:104-162`) uses the feature id as the vertex and would have to project onto the path instead. Needs a plan decision.
3. **Fix the DEM settle condition** (`terrainCamera.ts:110-144`). `isSourceLoaded` on the terrain source is false until the tilt is under way, so the 500 ms wait is always spent in full. Options: check the DEM tile under the centre (`queryTerrainElevation` once the `terrain` event fired), start the tilt at once and correct the elevation during the ease, or lower the timeout. *Expected:* tap → first tilted frame about 300–500 ms sooner (app 598 → ~300 ms at 1×), and the tilt uses real DEM heights instead of the median.
4. **Reuse the detail path in 3D** instead of a second `useSessionDetailPath` (`SessionTerrain.tsx:30`). Share it through the query cache or the store. *Expected:* about 60–75 ms less in the 3D entry task at 4× (about 100 ms at 6×). This is the plan's "second record load in 3D" risk, now measured.
5. **Pause the deck.gl overlay in 3D** (unmount it, or skip its redraw while `terrain` is on, `MapBackground.tsx:98-106`). *Expected:* a few ms per frame during 3D gestures at 6× (about 85 ms per 3 s gesture in the profile), so fewer frames over 33 ms.
6. **Precompute the segment colour strings once per path** (`toCss`, `terrainLine.ts:38`) or pass numeric colours. *Expected:* about 20–30 ms off the entry task at 4×. This becomes unnecessary if suggestion 2 is done.

## Adjacent (outside this item)

- App session page load at 4–6×: one task of 0.6–1.2 s (2D, unchanged by this item). The load was not profiled.
- Lap switches in both modes run about 50 ms of chart and rail recomputation (`SessionChartsExplorer.tsx`, `railRange.ts`, `movingTime.ts`, reselect) per switch.

## Round 2 (after fixes)

Measured 2026-10-23 after the R1–R7 fixes, same machine and method as above: production build (`vp build`, `vp preview --port 4175 --strictPort`), Playwright Chromium on the M5 GPU (`--use-angle=metal`), iPhone-like context (390×844, DPR 3, isMobile, hasTouch), Lechlauf Ultra FIT imported through Settings › Data, 54 splits, CDP CPU throttling **4×**, warm tile cache, 3 runs (lap switches: 5 per run), medians. The tables show the final build (R7 hand-over included); an earlier run of the same build without R7 is in brackets and shows the run-to-run spread (the 2D scrub, unchanged code, moved from 24 to 31 ms). The service worker was forced onto the new bundle before measuring. One method change: the scrub targets the widest chart (the HR chart) scrolled to the centre of the sheet, with the 61 `mouseMoved` events in its upper third (the phone's bottom nav covers its lower part). The scripts lived in the session scratchpad only.

### 3D chart scrub (61 moves, 4×)

| | round 1 | round 2 |
|---|---:|---:|
| 3D: main-thread ms per move | 276 | **30.8** (26.6) |
| 3D: longest task (ms) | 934 | **50** (0) |
| 3D: long tasks | 41 | **1** (0) |
| 3D: frame p95 (ms) | 842 | **41.6** (34.2) |
| 2D: main-thread ms per move (reference) | 26 | 31.1 (24.4) |
| 2D: frame p95 (ms) | 41.7 | 42 (33.8) |

3D scrubbing now costs what 2D costs. Causes removed: the lap hover is one small `setData` on its own source instead of a feature-state reset and re-mark of the whole track, the cursor dot is a `Marker` moved by `setLngLat` from a store subscription (no React render, no GeoJSON `setData`), and `DeckGLOverlay` no longer subscribes to the cursor or the hovered lap while 3D is on.

### 2D → 3D tap (4×)

| | round 1 | round 2 |
|---|---:|---:|
| tap → first tilted frame (ms) | 859 | **438** (405) |
| tap → pitch 30 (ms) | 1482 | **1129** (1098) |
| tap → map idle (ms) | 1737 | **1522** (1298) |
| longest task (ms) | 305 | **60** (63) |
| main-thread busy tap → idle (ms) | 1783 | **1489** (1300) |

The track source now holds 54 features (one per lap with the sport colour) instead of ~37,800, the records are not loaded a second time, and the deck.gl overlay is not mounted in 3D. The DEM settle check now resolves before its cap: a probe logged `isSourceLoaded('terrain-dem')` true 241 ms after the tap at 1× and 521 ms at 4× (tiles from the service worker), then the tilt starts; in round 1 it always ran into the 500 ms timeout. The remaining wait is the DEM tile decode itself; the tilt's first frame then waits ~150 ms for the first terrain render.

### 3D lap switch, "next lap" ×5 (4×)

| | round 1 | round 2 |
|---|---:|---:|
| main-thread busy per switch, incl. 800 ms fit (ms) | 869 | 829 (793) |
| frame containing the tap (ms) | 58 | **8.3** (8.2) |
| frame p95 in 1.5 s (ms) | 16.1 | **9.4** (9.3) |
| longest task (ms) | 50 | 53 (52) |
| tap → setFeatureState (ms) | 21 | **4.4** (4) |
| tap → first map render with highlight (ms) | 75 | **64.6** (62.5) |

The pitch-aware fit (R1) projects 64 sampled track points plus the four outermost ones per iteration (≤ 3 iterations), about 38 ms at 4× inside the fit; with 1,000 samples it was ~470 ms, almost all DEM height lookups (`getTerrainData`).

### R1 framing (lap close and lap fit after the fixes)

Track box = every track vertex projected with `map.project` (terrain on) after the fit ease ended. Free area = canvas minus the fit padding.

| | zoom | track box (px) | free area (px) |
|---|---:|---|---|
| desktop 1512×860, 30°, bearing 0, lap closed | 11.79 (round 1: 11.07) | x 142–827, y 108–668 | x 142–827 (panel at 907), y up to the pills at 776 |
| desktop, 30°, lap 21 selected | 15.66 | x 144–828, y 132–658 | same |
| desktop, 60°, bearing 40, lap closed | 12.73 | x 172–817, y 129–664 | same |
| desktop, 60°, bearing 40, lap 21 selected | 16 (max zoom) | x 362–680, y 129–727 | same |
| phone 390×844, 30°, lap closed | 11.01 | x 24–366, y 26–282 | above the pills at 307 (sheet half open) |
| phone, 30°, lap 21 selected | 14.99 | x 25–365, y 19–277 | same |

The track fills the free area on the limiting side and stays clear of the desktop panel and the phone sheet. The desktop zooms are 0.3–0.4 higher than the investigation's estimates (11.46 and 12.37): the box above, measured on the rendered terrain, touches the free-area edges, so the estimates left a margin on top of the fit padding.

### 3D → 2D

After 3D → 2D the deck.gl overlay mounts again and draws the 2D track (checked on the phone, interleaved, and three round trips on desktop, overlaid; the deck canvas exists only in 2D).

### R7: no frame without a track while switching

A probe sampled every map `render` and every animation frame during 2D → 3D and 3D → 2D (two round trips each, desktop overlaid at 1×, phone interleaved at 4×) and recorded whether MapLibre had rendered track features (`queryRenderedFeatures` on the 3D line layer) and whether deck.gl held a loaded `session-detail` layer on a live canvas. Result: **0 frames without a track** in every switch. Into 3D, MapLibre draws its first track frame at render 8 (desktop) or 3 (phone); deck.gl keeps the 2D track until then and leaves 2–3 renders later. Back to 2D, the MapLibre track stays until deck.gl reports its first draw (3–5 renders with both).

### R8: deck.gl stays attached in 3D (after the R8 fix)

Unmounting the deck.gl overlay in 3D (R5b) broke 2D after a round trip: the memoised layer instances, finalised when the overlay or its layers went away, were handed to deck.gl again and failed to initialise (`deck.gl: assertion failed`, then draws against a program of another WebGL context). Every remount on desktop also created a WebGL context that was never released, so Chrome dropped the oldest context ("Too many active WebGL contexts") after about six round trips in dev and about fifteen in production. The overlay now stays attached for the map's lifetime and gets an empty layer list while 3D owns the track, with fresh layer clones on every render.

Same setup, 4×, 3 runs, medians: 2D → 3D first tilted frame 473 ms, pitch 30 at 1161 ms, longest task 72 ms; 3D scrub 29.3 ms per move, no long task, frame p95 41.5 ms (2D scrub 26.0 ms); 3D lap switch tap frame 8.4 ms, tap → highlight 67 ms, longest task 56 ms. 3D one-finger pan at 6× (40 moves × 16 ms): frame p50 8.5 ms, p95 24.4 ms, 1 frame over 33 ms (round 1: 16.6 / 41.8 ms, 22 frames). The empty overlay's per-frame cost is not separately measurable within the run-to-run spread. The empty-frame probe (R7) still finds 0 frames without a track in both directions, in dev (StrictMode) and production, desktop and phone, and 12 quick round trips (back to 2D 120 ms after choosing 3D) show no WebGL warning or error.
