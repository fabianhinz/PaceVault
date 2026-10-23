# 3D session map: technical options

Research for `session-3d-map` (status `exploring`). Informs the owner's decision; decides nothing.
Versions verified in `node_modules/.pnpm`: maplibre-gl 5.18.0, react-map-gl 8.1.0 (`@vis.gl/react-maplibre` 8.1.0), @deck.gl/core|layers|mapbox 9.2.9, luma.gl 9.2.6, @maplibre/maplibre-gl-style-spec 24.4.1. Not installed: `@deck.gl/geo-layers`, `@deck.gl/extensions`, `@deck.gl/mesh-layers`, `@deck.gl/maplibre`.

Paths below abbreviate `node_modules/.pnpm/<pkg>@<ver>…/node_modules/<pkg>/` as `<pkg>/`.

## 1. Options with verification

### a. Pitched 2D (enable pitch/bearing, track stays flat)

- Today pitch and rotate are off: `apps/web/src/features/map/MapBackground.tsx:86-88` (`dragRotate={false}`, `pitchWithRotate={false}`, `touchPitch={false}`).
- MapLibre 5.18 default `maxPitch` is 60 (`maplibre-gl/dist/maplibre-gl.d.ts:10842-10845`); above 60 is "experimental" (`maplibre-gl.d.ts:11523`). `CameraOptions.pitch` exists (`maplibre-gl.d.ts:8173`), and `FitBoundsOptions` extends `FlyToOptions` → `CameraOptions` (`maplibre-gl.d.ts:8287`), so `fitBounds(bounds, { pitch, bearing, padding })` type-checks. Whether the fit accounts for the pitched frustum (the far edge shrinks) must be checked in a spike; the bounds are 2D, so anything with height is not in them anyway.
- deck.gl follows pitch/bearing in both modes: `getViewState` reads `map.getPitch()`, `getBearing()`, `getPadding()` (`@deck.gl/mapbox/src/deck-utils.ts:230-240`).
- No new deps, no new service. Flat track on a tilted flat map: honest, but adds little information.

### b. 3D path from record elevation (deck.gl only)

- `PathLayer` accepts 3D positions: `PathGeometry = Position[]` (`@deck.gl/layers/dist/path-layer/path.d.ts:2-5`), `Position` is `[x, y]` or `[x, y, z]` in metres. Today the path is built `[lng, lat]` only (`apps/web/src/features/map/zoneColoredPath.ts:12-16,50-60`).
- `billboard?: boolean` on PathLayer: "If `true`, extrude the path in screen space (width always faces the camera). If `false`, the width always faces up (z)." (`@deck.gl/layers/dist/path-layer/path-layer.d.ts:42-47`). For a 3D ribbon `billboard: true` keeps it readable on steep sections. ScatterplotLayer has the same prop (`@deck.gl/layers/dist/scatterplot-layer/scatterplot-layer.d.ts:63`) for the hovered-point dot.
- **Exaggeration** is a data transform: `z = (elevation − baseline) × k`, computed in the path builder. No layer prop scales z for PathLayer (only polygon/column layers have `elevationScale`, `@deck.gl/layers/dist/solid-polygon-layer/solid-polygon-layer.d.ts:39`).
- **Shadow line**: a second PathLayer with the same `[lng, lat]` at z = 0, dimmed (e.g. existing `dimmedColor`). Cheap; anchors the floating line to the basemap.
- **Curtain / wall** options on our installed layers:
  - `SolidPolygonLayer`/`PolygonLayer` with vertical quads (`[lng1,lat1,0] → [lng2,lat2,0] → [lng2,lat2,z2] → [lng1,lat1,z1]`): **does not work as is**. Polygons are tessellated in xy (earcut); a vertical quad has zero xy area, so it yields no triangles. (Reasoning from the tessellator design, not tested; a spike would confirm.)
  - `SolidPolygonLayer` with `extruded: true`, one thin footprint polygon (≈1–2 m wide strip) per segment and `getElevation` = segment height (`solid-polygon-layer.d.ts:15,39,45`): works with stock layers. Top is stepped per record (1 s ≈ 3–10 m apart, invisible at session zoom). 10 800 small polygons ≈ 10 800 × 8 vertices: fine.
  - `LineLayer` vertical "comb" (`[lng,lat,0] → [lng,lat,z]`) every n-th record: trivial, lighter look.
  - `ColumnLayer` (installed, `@deck.gl/layers/dist/column-layer`) per record with `diskResolution: 4`: works, heavier.
  - A custom luma.gl triangle-strip layer or `SimpleMeshLayer` (`@deck.gl/mesh-layers`, not installed): cleanest wall, M–L effort.
- **Interleaved vs overlaid**: interleaved sets `depthWriteEnabled: true, depthCompare: 'less-equal'` (`@deck.gl/mapbox/src/deck-utils.ts:99-113`); MapboxLayer defaults to `renderingMode: '3d'` (`@deck.gl/mapbox/src/mapbox-layer.ts:35`), so deck shares MapLibre's depth buffer. Without terrain the basemap is at z = 0, so a path with z ≥ 0 is never occluded; both modes look the same except interleaved has no MSAA ("deck.gl layers receive no multisampling", deck.gl MapboxOverlay docs), which shows more on thin elevated lines. Our coplanar lap layers (`lap-casing`, `lap-selected`, `lap-hover`, `apps/web/src/features/map/DeckGLOverlay.tsx:226-274`) get the same 3D positions, so their ordering stays as today.
- **Is floating honest?** Absolute metres above sea level over a basemap drawn at sea level put a valley ride at 500 m × k in the air: not honest. A **relative baseline** (z = 0 at the session's lowest valid elevation) makes the lowest point touch the ground and the height read as "climb above the lowest point". The basemap still has no relief, so the shape says nothing about the terrain beside the track; the legend has to say "height above lowest point ×k".

### c. MapLibre terrain (`raster-dem` + `setTerrain`, hillshade)

- API in 5.18: `setTerrain(options: TerrainSpecification | null)` and `getTerrain()` (`maplibre-gl.d.ts:12110,12119`); `TerrainSpecification = { source, exaggeration? }` (`@maplibre/maplibre-gl-style-spec/dist/index.d.ts:957-971`); `RasterDEMSourceSpecification.encoding?: "terrarium" | "mapbox" | "custom"` (`index.d.ts:1171`); `HillshadeLayerSpecification` with `hillshade-method` `standard|basic|combined|igor|multidirectional` (`index.d.ts:2687,2815`); `ColorReliefLayerSpecification` (`index.d.ts:2818`); `queryTerrainElevation(lngLat): number | null`, "multiplied by that exaggeration value" (`maplibre-gl.d.ts:9013-9021`); `setCenterClampedToGround` (`maplibre-gl.d.ts:8492`); `setSky` (`maplibre-gl.d.ts:7267`, `SkySpecification` `index.d.ts:874`).
- **DEM sources** (checked 2026-10-23):

  | Source | URL / format | Key | CORS | Tile size (sample z10) | Licence / attribution |
  | --- | --- | --- | --- | --- | --- |
  | Mapterhorn | `https://tiles.mapterhorn.com/{z}/{x}/{y}.webp`, Terrarium, 512 px WebP, z0–17 (mapterhorn.com/data-access) | none mentioned | `access-control-allow-origin: *`, `cache-control: max-age=604800` (measured) | 63.5 KB | Open data, per-source licences in `download.mapterhorn.com/attribution.json` (e.g. BEV Austria CC-BY-4.0); no single attribution string found. Usage policy: not stated (Cloudflare-sponsored). PMTiles downloadable for self-hosting. |
  | AWS Terrain Tiles (Tilezen/Joerd) | `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`, Terrarium PNG (256 px per Joerd `formats.md`) | none (`--no-sign-request`) | `Access-Control-Allow-Origin: *` on GET (measured) | 118 KB | Per-source attribution list (USGS, Copernicus EU-DEM, Kartverket CC-BY-4.0, …) in `tilezen/joerd/docs/attribution.md`. Data mostly 30 m+ outside the US. |
  | MapTiler Terrain RGB | MapTiler Cloud | **API key** required | yes | not measured | MapTiler terms; not checked further (key and account conflict with the app's "no accounts" model). |

  Any of them is a **fourth external service** (`apps/web/CLAUDE.md` §2, "Local-first absolute rule") and needs the owner's decision.
- **Offline**: a `CacheFirst` runtime cache like `carto-tiles` (`apps/web/vite.config.ts:37-50`) only covers areas already viewed with terrain on. A pitched session view at z12–14 pulls an estimated 20–60 DEM tiles (≈1.5–7 MB at the measured sizes; estimate, not measured). Offline in an uncached area: terrain must be off or degrade; what MapLibre draws with missing DEM tiles needs a spike. Bundling DEM (PMTiles) is not realistic for a global app.
- **deck.gl 9.2 on MapLibre terrain**:
  - deck's camera syncs to the terrain: `if (map.getTerrain?.()) centerCameraOnTerrain(map, viewState)`, MapLibre branch sets `viewState.position = [0, 0, map.transform.elevation]` (`@deck.gl/mapbox/src/deck-utils.ts:242-245,286-291`).
  - deck docs: "Mapbox/MapLibre's terrain features are partially supported … the deck.gl data with z=0 are rendered at the sea level and not aligned with the terrain surface" (deck.gl `api-reference/mapbox/overview`). The newer `@deck.gl/maplibre` docs say "deck.gl layers are not draped over MapLibre terrain". `@deck.gl/maplibre` first ships with 9.4.0 (npm registry, 2026-09); we are on 9.2.9.
  - `_TerrainExtension` (`@deck.gl/extensions`, experimental) needs a **deck** layer with `operation: 'terrain'` or `'terrain+draw'` as its source, e.g. `TerrainLayer` (deck.gl `extensions/terrain-extension` docs). It does not read MapLibre's terrain. In `drawLayer` the overlay already passes `operation.includes('terrain')` layers through (`@deck.gl/mapbox/src/deck-utils.ts:144`), but that only helps a deck-side terrain source.
  - **So the existing 2D `session-detail` PathLayer does not drape.** Interleaved (touch): it is drawn at sea level with depth test against the terrain, so it is hidden wherever terrain is above 0 m (i.e. nearly everywhere). Overlaid (fine pointer): separate canvas, no depth, the line is drawn at sea level and slides against the relief under pitch. Both are wrong.
  - Ways to put the track on the terrain: (1) z from `queryTerrainElevation` per vertex, recomputed when DEM tiles load (values change as tiles refine; null until loaded); (2) z from record elevation with the same `exaggeration` (record and DEM disagree by metres to tens of metres: the line sinks into or floats above the surface); (3) draw the session track as a native MapLibre `line` layer (GeoJSON source), which MapLibre drapes on terrain automatically; per-record colour then needs `line-gradient` with `lineMetrics` over `line-progress` stops (10 800 stops is heavy) or per-segment features, and lap picking moves from deck to `queryRenderedFeatures`. All three are L effort.
- Hillshade alone (no `setTerrain`, map stays flat) gives terrain context in 2D for the same DEM tiles. Its colours must follow `apps/web/CLAUDE.md` §3 (no grey/blue on the map); `hillshade-shadow-color`/`highlight-color` can be warm/dark, but a "no grey" hillshade is a design question.

### d. deck.gl-native 3D: `TerrainLayer` + `_TerrainExtension` (+ `MVTLayer`, `TripsLayer`)

Rewritten after the owner's pushback: this is the path deck.gl itself offers for "track on real terrain", and it is worth a fair look. Package internals below were read from the 9.2.9 tarballs (`@deck.gl/geo-layers`, `@deck.gl/extensions`, downloaded to the scratchpad, not installed).

- **How it fits together** (official example `examples/website/terrain-extension/app.tsx` in visgl/deck.gl: Tour de France stages on terrain): a `TerrainLayer` with `operation: 'terrain+draw'` draws the relief mesh and acts as the terrain source; every layer that should follow it gets `extensions: [new _TerrainExtension()]`. The example uses **Mapterhorn** as `elevationData` (`https://tiles.mapterhorn.com/{z}/{x}/{y}.webp`, Terrarium decoder `rScaler 256, gScaler 1, bScaler 1/256, offset -32768`) and a satellite raster as `texture`, rendered by a standalone `DeckGL`, with no MapLibre at all.
- **Draw modes** (`extensions/dist/terrain/terrain-extension.d.ts:8`, logic `terrain-extension.js:28-36`): `terrainDrawMode?: 'offset' | 'drape'`; if unset, layers with `extruded` or an `instancePositions` attribute get `'offset'`, others `'drape'`. So `PathLayer` (attribute `positions`, no `instancePositions`) drapes automatically: our `session-detail`, lap casing/selected/hover would lie on the relief, z ignored. `ScatterplotLayer` (`instancePositions`) gets `'offset'`: the hover dot sits on the terrain surface, so it **does not need a z** in the store.
- **TerrainLayer** (deck.gl docs, `geo-layers/dist/terrain-layer/terrain-layer.js`): `elevationData` URL template → tiles through an internal `TileLayer`, mesh by Martini (`meshMaxError`, default 4 m), `texture` optional (`color` if none), mesh drawn by `SimpleMeshLayer` from **`@deck.gl/mesh-layers`** (a peer dependency of geo-layers, not installed). Parsing runs in a **web worker loaded from a CDN (unpkg) by default** (`terrain-layer.js:33`: "Supply url to local terrain worker bundle. Only required if running offline and cannot access CDN"). That is an extra external call: we would set `loadOptions: { terrain: { worker: false } }` or bundle the worker ourselves. Same for `MVTLayer`'s `MVTWorkerLoader`.
- **Where the basemap comes from** (the decisive question):
  1. *MapLibre flat underneath, deck TerrainLayer inside our `MapboxOverlay`*: works mechanically (the overlay passes `operation.includes('terrain')` layers through, `@deck.gl/mapbox/src/deck-utils.ts:144`), but the opaque mesh covers MapLibre's roads, water and labels. The open RFC visgl/deck.gl#10758 states exactly this: "Apps either add a deck `TerrainLayer` on top, which covers MapLibre's own roads and labels, or query the elevation of each object on the CPU, which doesn't work for paths and polygons."
  2. *CARTO vector tiles via `MVTLayer`, draped*: `MVTLayer` reads our CARTO tile URL (same service, no new one); it renders through `GeoJsonLayer` sublayers styled by accessors on `f.properties.layerName` / `f.properties.class` (deck.gl MVTLayer docs). **It does not read a MapLibre style JSON**: the colours of `darkMatter.style.json` would have to be re-coded as accessors (water, landuse, roads by class, buildings), and there are no labels, sprites or symbol collision. A road/water/landuse "silhouette" basemap on the relief is realistic; a labelled one is not. MVT polygons/lines drape (no `instancePositions`).
  3. *Texture*: a raster tile URL as `texture`. CARTO serves raster basemaps too, but that is a different endpoint than the vector tiles we use (and cache), so it needs a check of the "CARTO" rule and a new SW cache entry; untested.
  4. *No basemap*: dark mesh with lighting; terrain shape only. Honest and simplest.
- **`TripsLayer`** (`geo-layers/dist/trips-layer/trips-layer.d.ts:12-26`): a `PathLayer` subclass with `getTimestamps`, `currentTime`, `trailLength`, `fadeTrail`. `currentTime` can be driven from the chart cursor time (`SessionChartsExplorer.tsx:173-176` already has it), giving a "replay up to here" trail. Works with or without terrain (as a PathLayer subclass it drapes). Small (≈1 KB gz). Camera following is not part of it: a flyover needs our own camera animation (MapLibre `easeTo`/`flyTo` per frame or deck's `FlyToInterpolator` in a standalone Deck).
- **Mount options**: (i) inside the existing `MapboxOverlay` over a flat MapLibre (basemap 1), camera stays MapLibre's, `maxPitch` 60; (ii) a standalone `Deck` (`MapView`, `maxPitch` up to 89 as in the example) replacing the map on the session page in 3D mode, basemap 2/3/4. (ii) is what the official example does; (i) is where the RFC says it falls short.
- **deck.gl 9.4 + `@deck.gl/maplibre`**: 9.4 (2026-09-05, deck.gl "What's new") forks `@deck.gl/maplibre` from `@deck.gl/mapbox`, adds MapLibre v6 support, and extends TerrainLayer/TerrainExtension to `GlobeView`. **Nothing makes deck layers follow MapLibre terrain**: the `@deck.gl/maplibre` docs say "deck.gl layers are not draped over MapLibre terrain", and RFC #10758 (opened 2026-09-29, open) demos the gap on "MapLibre 6.11.2 and deck.gl 9.4.0" and depends on new MapLibre custom-layer hooks (maplibre/maplibre-gl-js#8588). 9.3 (2026-04-13) added a `TerrainController`. Upgrading changes none of the conclusions here; it would be its own item.
- **Bundle (estimate)**: both packages declare `"sideEffects": false`, so only what we import is bundled. Gzip of the relevant 9.2.9 `dist` modules (scratchpad measurement, `gzip -9` over the module files): TerrainExtension ≈ 7.6 KB, TerrainLayer + its mesh wrapper ≈ 4.9 KB, TileLayer + Tileset2D ≈ 11.7 KB, TripsLayer ≈ 1 KB, MVTLayer ≈ 4.8 KB. Transitive: `@deck.gl/mesh-layers` (+ `@luma.gl/gltf`, `@loaders.gl/gltf`), `@loaders.gl/terrain` (+ `@mapbox/martini`, `@loaders.gl/images`), for MVT `@loaders.gl/mvt` (+ `pbf`, `@loaders.gl/gis`). Not measured; my estimate for TerrainLayer + TerrainExtension + TripsLayer is **≈ 60–120 KB gz**, plus ≈ 30–60 KB with MVTLayer. `h3-js` (65 KB gz, bundlephobia) and the 3D-tiles loaders are not pulled in when only these layers are imported. Lazy-loading on the session page is possible. Bundlephobia could not build the deck packages; a `vp build` measurement in a spike branch is needed for a real number.
- **Maturity** (GitHub search `TerrainExtension` in visgl/deck.gl, 2026-10-23): 28 issues/PRs, 11 open. Open bugs relevant here: #10850 (2026-10-11) "drape: draped layers never settle, and every cover draws every feature", #10335 "offset mode renders at wrong elevation on the first frame", #10334 (OrbitController pan with offset layers), #10206 (ScatterplotLayer artefacts in MapLibre interleaved + globe). Closed history includes "v9.0 TerrainExtension picking wrong object" (#8760), "Pick invalid / corrupt pick index … SolidPolygonLayer with a TerrainExtension" (#9764, 2025), "Interleaved Mapbox overlay does not work with terrain elevation" (#8091). One official example (`terrain-extension`), plus `google-3d-tiles` using it. Still exported with the underscore (`_TerrainExtension`), docs call it experimental.
- **Picking on terrain**: the extension has its own picking pass (`terrain-picking-pass.js`); `info.coordinate` for a draped path is resolved on the terrain (via `pickable: '3d'` depth). Past bugs (#8760, #9764) show this area has broken before; spike it with our lap picking.
- **Interleaved (touch) vs overlaid (desktop)**: TerrainLayer inside the MapboxOverlay in interleaved mode shares MapLibre's depth buffer; the mesh then depth-occludes nothing of MapLibre (MapLibre is flat at z = 0 and drawn first) but covers it in colour. In a standalone Deck the mode question disappears (one canvas, deck owns events), which also removes the current `key={pointerFine ? 'overlaid' : 'interleaved'}` split (`MapBackground.tsx:94`) for that view.

### e. Other

- **Globe projection** (`setProjection`, `maplibre-gl.d.ts:7265`): irrelevant at session zoom.
- **Sky / fog** (`setSky`, `SkySpecification` with `sky-color`, `horizon-color`, `fog-color`, `atmosphere-blend`): only matters near the horizon; with `maxPitch` 60 little sky shows. Worth a dark sky colour if pitch > 50 is allowed, otherwise skip.
- **Buildings (fill-extrusion)**: CARTO `carto.streets` tiles.json declares `building` with `render_height`, `render_min_height`, `hide_3d`, `colour` (fetched 2026-10-23; values not sampled), source maxzoom 14. Our style draws buildings flat (`darkMatter.style.json` layers `building`, `building-top`, from line 1678) in grey. Visible only from z ≈ 15; session fits are usually z 11–14. Low value for sport tracks; scope creep.
- **Camera on the elevated track** (`calculateCameraOptionsFromTo`, `maplibre-gl.d.ts:8876`): could build a fly-along later; out of scope.

### f. Custom renderer: react-three-fiber (three.js)

Added on the owner's request ("fancy" approaches with good arguments). Not installed today: no `three` or `@react-three/*` in `node_modules/.pnpm`.

- **Versions (npm registry, 2026-10-23)**: `three` 0.186.1; `@react-three/fiber` 9.8.2, peers `react >=19 <19.4`, `three >=0.156` (our React is 19.2.4, so it fits; fiber 9.0.0, the first React 19 major, shipped 2025-02-19); `@react-three/drei` 10.7.9, peers `react ^19`, `@react-three/fiber ^9`; `@react-three/test-renderer` 9.1.1, peers `react ^19`, `@react-three/fiber >=9`.
- **Bundle (bundlephobia, min+gzip of the whole package)**: three 185 KB, fiber 58 KB (without three), drei 521 KB (tree-shakeable; only imported helpers count, plus their deps such as `three-stdlib`/`meshline`). Realistic delta for three + fiber + a few drei helpers: ≈ 250–300 KB gz, lazy-loadable on the session page only. Estimate; a real build measurement is needed. Today the map stack (maplibre-gl + deck.gl) is already the largest chunk.
- **Mount option 1: three inside MapLibre (shared GL context)**
  - MapLibre 5.18 `CustomLayerInterface`: `id`, `type: "custom"`, `renderingMode?: "2d" | "3d"` (default `"2d"`), `render(gl, options)`, `prerender?`, `onAdd?(map, gl)` (`maplibre-gl/dist/maplibre-gl.d.ts:6772-6815`). `CustomRenderMethodInput` passes `modelViewProjectionMatrix` and `defaultProjectionData` (`maplibre-gl.d.ts:6596-6699`). `render` must assume nothing about GL state and draws with premultiplied-alpha blending (`maplibre-gl.d.ts:6786-6800`); three must call `renderer.resetState()` around each frame (the documented three-on-MapLibre pattern; MapLibre example "Add a 3D model using three.js").
  - **react-three-map** 1.0.1 (published 2026-07-18, MIT, ~320 GitHub stars): "a bridge to use `react-three-fiber` inside `react-map-gl`"; `import { Canvas } from "react-three-map/maplibre"`; peers `maplibre-gl >=4`, `react-map-gl >=8`, `@react-three/fiber >=8.13`, `three >=0.133` (registry), so our versions are inside its ranges; MapLibre 5 support is not stated explicitly in the README. Canvas props `latitude`, `longitude`, `altitude`, `frameloop`, `overlay` ("Render on a separated canvas"); helpers `Coordinates`, `NearCoordinates`, `coordsToVector3`. It ignores r3f's `gl`, `camera`, `dpr` ("we leave a lot of the render and camera control to the map"). One maintainer; small project.
  - Consequence: a **third** renderer in the same map (MapLibre + deck.gl + three), each managing its own GL state on one context in interleaved mode, or a third canvas in overlay mode ("ThreeJS will always render on top"). The camera stays MapLibre's, so three adds geometry and shading, not camera freedom.
- **Mount option 2: standalone `<Canvas>` replacing the map on the session page (3D mode only)**
  - The shared `MapBackground` stays mounted underneath (hidden or faded) so leaving 3D returns to the exact 2D state; the r3f canvas owns the screen area of the map.
  - Geometry: track as a ribbon/tube (`TubeGeometry` along a `CatmullRomCurve3`, or drei `<Line>`, which wraps `Line2`/`LineMaterial` for wide lines with per-vertex colours), elevation curtain as one `BufferGeometry` triangle strip (no tessellation problem), local metric coordinates (east/north/up from the session centre).
  - Camera: drei `<CameraControls>` (smooth dolly/orbit/fit-to-box with damping) or `<OrbitControls>`; `<Bounds>` fits the camera to the scene. `<Html>` places DOM labels (start/finish, lap numbers) in 3D.
  - Basemap: (a) none, track over a dark ground plane with a grid: honest, no service; (b) a static texture of the session area: needs map tiles as an image; capturing MapLibre's canvas (`preserveDrawingBuffer` or `map.getCanvas().toDataURL()` after render) gives a flat snapshot of CARTO tiles, CARTO terms on derived images not checked; (c) the live MapLibre map underneath = mount option 1. With DEM tiles (c in §1) the ground plane could become a terrain mesh, again a fourth service.
- **What it buys over deck.gl `PathLayer` with z + extruded `SolidPolygonLayer`**:
  - Real lit geometry: tube/ribbon with normals, shading and shadows give a much stronger sense of slope and height than flat-shaded deck primitives (deck has `material` lighting on extruded polygons, `solid-polygon-layer.d.ts:55`, but no tubes or cast shadows).
  - A continuous curtain from one triangle strip; smooth orbit camera with damping and arbitrary pitch (no `maxPitch` 60 cap) in option 2.
  - Playback ("fly-along" / animated dot moving with chart time) is natural in an r3f render loop; deck can animate too, but camera paths are easier in three.
- **What it costs**:
  - Second (option 2) or third (option 1) rendering stack beside deck.gl and MapLibre, a second set of colour, width and hover rules to keep in sync with `trackColors.ts` and `apps/web/CLAUDE.md` §3.
  - Picking re-implemented: r3f raycasting gives the hit point on the mesh (`event.point`, `event.faceIndex`); mapping to a record index needs our own lookup (vertex/segment → `recordIndices`), then the existing `lapIndexAtRecord`. Lap casing/selected/hover and the chart hover dot (`apps/web/src/store/mapFocus.ts:14-15`, `[lng, lat]` only) re-drawn in three; the dot needs a z or a record index.
  - Camera fitting (`useMapCameraEffect.ts`, `mapPadding.ts`) does not apply in option 2; padding for the content column and bottom sheet must be rebuilt as a camera view offset (`camera.setViewOffset`) or drei `<Bounds margin>`.
  - Touch: option 2 owns its gestures (`<CameraControls>` touch config) and must not fight the bottom sheet; option 1 inherits MapLibre's gestures but runs inside interleaved mode next to deck.
  - Context loss/memory: one more WebGL context on phones in option 2 (browsers cap live contexts; MapLibre's stays alive underneath).
  - Testing: `@react-three/test-renderer` runs scene graphs in Vitest without WebGL (asserts on objects, props, events), fitting `apps/web/tests/jsdom`; real pixels only in Playwright. There are no `toHaveScreenshot` tests in `apps/web/e2e` today; WebGL screenshots in headless Chromium (SwiftShader) differ across GPU/driver setups, so e2e would assert on DOM state (toggle, labels via `<Html>`, data attributes), not pixels.

## 2. Integration impact

| Area | a. Pitched 2D | b. 3D path (+shadow/curtain) | c. MapLibre terrain | d. deck-native terrain | f. react-three-fiber |
| --- | --- | --- | --- | --- | --- |
| `MapBackground.tsx` | Make `dragRotate`, `pitchWithRotate`, `touchPitch` (`:86-88`) depend on the session route (`useMatch('/sessions/:id')` already at `:43`) | as a | as a, plus `raster-dem` source + `setTerrain` on enter, `setTerrain(null)` on leave; attribution in `attributionControl` (`:89`) | inside overlay: as a. Standalone Deck: MapLibre stays mounted but hidden/faded in 3D mode; a sibling Deck canvas takes the map area | standalone `<Canvas>`: same sibling pattern as d; react-three-map: a `<Canvas>` from `react-three-map/maplibre` inside `<MapGL>` next to `DeckGLOverlay` |
| `DeckGLOverlay.tsx` | none | `session-detail` (`:202-224`), lap layers (`:226-274`) and `hovered-point` (`:352-371`) get z; new shadow layer and optional curtain layer; `billboard: true` | track layers need z from DEM, or the track moves to a MapLibre `line` layer (picking rewrite) | add `TerrainLayer` (`operation: 'terrain+draw'`) and `extensions: [new _TerrainExtension()]` on track, lap and hover layers (inside overlay), or the same layers built for a standalone Deck (shared layer factory) | unchanged for 2D; a second implementation of track, laps and hover dot as three meshes |
| Path data | none | `DetailPath.path` (`zoneColoredPath.ts:12-16`) becomes `[lng, lat, z]`; baseline + smoothing + exaggeration in the builder | z sampled from `queryTerrainElevation` after tile load, or none (native line) | none (paths drape, z ignored) | local metric east/north/up coordinates from the session centre + per-vertex colours |
| Camera (`useMapCameraEffect.ts:57-69,141-147`) | `fitOptions` pass `pitch`/`bearing` for `session`/`lap`, and explicit `pitch: 0, bearing: 0` for `overview`/`trip`/`studio`, or pitch leaks into other routes | as a; elevated geometry is outside the 2D bounds, so tall walls can leave the top of the frame: add margin or fit on a projected box | as a; `centerClampedToGround` (default true) keeps the centre on the surface | inside overlay: as a. Standalone: own `viewState` + `WebMercatorViewport.fitBounds` with padding, `maxPitch` up to 89 | own camera: drei `<CameraControls>`/`<Bounds>`; padding via `camera.setViewOffset` or `<Bounds margin>` |
| Padding (`mapPadding.ts:21-58`) | unchanged values; under pitch the bottom sheet (phone) covers the near, large part of the map, so the fitted track sits small in the top half | as a | as a | as a; standalone Deck can reuse `mapPadding()` values for its `fitBounds` | rebuilt, values reusable |
| Picking (`DeckGLOverlay.tsx:116-125`, `lapPath.ts:21-38`) | unchanged; `info.coordinate` is the ground point, correct for a flat track | `info.coordinate` is unprojected at z = 0 (`@deck.gl/core/src/lib/picking/pick-info.ts:56-62`), offset from an elevated line by ≈ z·tan(pitch) → wrong lap near lap borders. Fix: `pickable: '3d'` (`@deck.gl/core/dist/types/layer-props.d.ts:117`), which turns on depth unprojection for hover and click (`@deck.gl/core/src/lib/deck.ts:987-990,1262-1272`); `nearestRecordIndex` then has to compare in 3D or ignore z. Overlaid mode forwards map events into `deck._onEvent` (`@deck.gl/mapbox/src/mapbox-overlay.ts:125-132,325-345`); interleaved mode registers no such forwarding (`mapbox-overlay.ts:138-158`) and relies on the Deck instance's own event handling on the shared canvas, so whether `pickable: '3d'` reaches both paths needs a spike | depends on track variant; native line → `queryRenderedFeatures` | extension has its own picking pass (`terrain-picking-pass.js`); `nearestRecordIndex` keeps working on `[lng, lat]` if `info.coordinate` lands on the terrain; history of picking bugs (#8760, #9764) → spike | r3f raycast `event.point`/`faceIndex` → own vertex-to-record lookup, then `lapIndexAtRecord` |
| Hovered point (`store/mapFocus.ts:14-15`: `hoveredPoint: [number, number] \| null`, `setHoveredPoint(point: [number, number])`; set in `SessionChartsExplorer.tsx:173-176`) | unchanged | the stored point has **no height**: either widen the store to `[lng, lat, z]` (or a record index) and look z up from the same smoothed/exaggerated series as the path, or look z up in the overlay by nearest record. Otherwise the dot sits on the ground under the floating line | the dot needs the DEM height (`queryTerrainElevation`), or it is hidden under the relief (interleaved) / slides (overlaid) | unchanged: `ScatterplotLayer` gets `'offset'` automatically and sits on the terrain | needs a record index or a z, as b |
| Labels (basemap symbols) vs raised track | n/a (flat) | today no layer sets `beforeId`, so deck layers are appended after all MapLibre layers (`@deck.gl/mapbox/src/resolve-layers.ts:67-69`): the track draws **over** labels in both modes. Overlaid (desktop) has no other choice (separate canvas on top). Interleaved (touch) could put the track under labels with `beforeId`, but a raised line under flat labels looks wrong under pitch; so a raised path stays over labels in both modes, and both modes look the same only as long as no `beforeId` is set | MapLibre labels sit on the terrain; deck track as in b | MapLibre labels covered by the mesh (overlay) or absent (standalone; MVTLayer has no labels) | react-three-map overlay mode: three always on top; shared-context mode: drawn after MapLibre, on top. Standalone: no labels |
| Shared background / route leave | reset pitch/bearing when the session route is left (easeTo or the next fit's explicit `pitch: 0`) and disable rotate handlers | as a | as a + `setTerrain(null)`, remove source | overlay: as a + drop TerrainLayer; standalone: unmount the Deck canvas, MapLibre unchanged | standalone: unmount `<Canvas>`; MapLibre unchanged |
| `MapControlsBar.tsx` | optional "2D / 3D" (tilt) pill; on phone the bar scrolls horizontally (`:32-42`), room exists | "2D / 3D" pill; optional exaggeration control; a compass/reset to north once bearing can change | same + terrain on/off (and its offline state) | same; optional replay control for `TripsLayer` | same; optional replay control |
| New deps / bundle | none | none | none (MapLibre already ships terrain) | `@deck.gl/geo-layers`, `@deck.gl/extensions`, `@deck.gl/mesh-layers` (+ loaders.gl terrain, gltf); est. 60–120 KB gz, +30–60 KB with MVTLayer | `three`, `@react-three/fiber`, selected `@react-three/drei` (+ `react-three-map` if inside MapLibre); est. 250–300 KB gz |
| New external service | no | no | **yes** (DEM) | **yes** (DEM; worker CDN unless disabled; texture source if raster) | no for track + plane; **yes** if terrain mesh |
| Phone performance (3 h ride ≈ 10 800 records) | none | PathLayer with 10 800 vertices ×2 (track + shadow) is trivial; extruded curtain ≈ 86 k vertices, fine for mid-range GPUs; interleaved has no MSAA, thin elevated lines alias | terrain mesh + DEM decode + hillshade per tile; noticeably heavier on mid-range phones, more GPU memory, extra network | terrain mesh + extension render passes (height map + draped cover textures per tile, #10850 "never settle" open) + MVT tiles: heaviest of the deck options | a 10 800-segment tube is ≈ 10 800 × 8 × 2 triangles, fine; lighting/shadows cost; standalone adds a second WebGL context |
| Effort | S | M (S without curtain) | L | L (standalone, no basemap: M–L) | L |

## 3. Data honesty

- **Source of elevation**: the parser stores `enhanced_altitude ?? altitude` rounded to 0.1 m (`apps/web/src/parsers/fit.ts:77`) in `SessionRecord.elevation?: number` (`packages/engine/src/types.ts:76`). Barometric devices are smooth but carry an offset (calibration, weather drift over long sessions); GPS-only altitude is noisy (vertical error typically several times the horizontal error, tens of metres jitter is common). The app cannot tell which one a file used.
- **Smoothing**: needed for a readable 3D line, more for GPS altitude. `rollingMean` (`apps/web/src/lib/trackSmoothing.ts:9-44`) already keeps `undefined` as missing and is time-based; an elevation window (e.g. 10–30 s) would be a new `TRACK_SMOOTHING_SEC` entry (`trackSmoothing.ts:1-7`). The engine's gradient code merges equal-distance runs (`packages/engine/src/gradient.ts:24-38`); the 3D line and the elevation chart should use the same smoothing so the two agree.
- **Vertical exaggeration**: needed. At session-fit zoom a 10 km route spans the screen; a 100 m climb is 1 % of that and invisible at ×1. Typical readable values are ×3 to ×5 (no source; to be tuned in a spike). The factor must be stated on the map ("Height ×3" chip or legend line), and the baseline too ("above the lowest point"), never implied as real terrain.
- **Baseline**: relative to the session minimum avoids the "500 m in the air" effect (§1b). Elevation 0 m and negative values (coast, Netherlands, Dead Sea) are valid data; a min-based baseline handles them without special cases. No `?? 0`.
- **Missing elevation**: indoor sessions, watches without altimeter, gaps. Options: whole session falls back to flat 2D when no record has elevation; gaps break the 3D path into segments (PathLayer takes several paths) and the shadow line stays continuous; or gaps are interpolated (invents data, conflicts with "missing is missing"). A session with GPS but zero elevation records gets no 3D toggle, or a disabled one with a reason.
- **Terrain variants (c, d)**: DEM and record elevation never agree exactly (DEM 1–30 m cells, record offset). Draping hides the record elevation entirely; placing the record line over the DEM shows the mismatch as sinking/floating. Either way the track height on terrain is the DEM's, not the device's.

## 4. Shortlist

### V1 Tilt only (pitched 2D)

```text
Desktop                                   390 px
+------+---------------------+-----------+ +------------------+
| dock |   ___________       | content   | |  map, tilted     |
|      |  /  ~~~track~~ \    | column    | |   /~~track~~\    |
|      | /_______________\   |           | |  /___________\   |
|      |  [Laps][HR][2D|3D]  |           | |[Laps][HR][2D|3D] |
+------+---------------------+-----------+ |==== sheet =======|
```

- Pros: no new data, no service, honest (flat stays flat), small change.
- Cons: little insight; under pitch the bottom sheet on phone hides more of the map.
- Tech: `MapBackground.tsx:86-88` route-bound, `fitOptions` with pitch + reset elsewhere, one pill. Deps none. Service no. Offline unchanged. Effort S.
- Risks: pitch leaking into other routes; `fitBounds` under pitch not framing well.

### V2 Floating 3D line + ground shadow

```text
Desktop                                   390 px
+------+---------------------+-----------+ +------------------+
| dock |        __/\         | content   | |      _/\_        |
|      |   ___/    \__       | column    | |   __/    \_      |
|      |  ...........  <-shadow          | |  ..........      |
|      | [Height x3 above lowest point]  | |[2D|3D][x3]       |
+------+---------------------+-----------+ |==== sheet =======|
```

- Pros: uses only own data; no deps; works offline; zone colours stay on the elevated line; the shadow keeps the map reference.
- Cons: floats over a flat map; without a curtain the height is hard to read at low pitch.
- Tech: `[lng, lat, z]` in `zoneColoredPath.ts`, baseline/smoothing/exaggeration, `billboard: true`, shadow PathLayer, `pickable: '3d'`, hovered point with z, V1 camera changes. Effort M.
- Risks: picking accuracy (spike `pickable: '3d'` in both modes), aliasing in interleaved mode, noisy GPS altitude.

### V3 Floating line + curtain (wall)

```text
Desktop                                   390 px
+------+---------------------+-----------+ +------------------+
| dock |        __/\         | content   | |      _/\_        |
|      |   ___/||||\__       | column    | |   __/||||\_      |
|      |  /||||||||||||\     |           | |  /|||||||||\     |
|      | [Height x3 above lowest point]  | |[2D|3D][x3]       |
+------+---------------------+-----------+ |==== sheet =======|
```

- Pros: height reads at any pitch; a familiar "elevation profile on the map" look; still own data only.
- Cons: more visual mass over the basemap; wall colour needs rules (zone colour at low alpha, additive blend? `apps/web/CLAUDE.md` §3); hides map beneath at steep pitch.
- Tech: V2 + extruded thin-strip `SolidPolygonLayer` per segment (vertical-quad polygons do not tessellate), or `LineLayer` comb as lighter variant. Effort M.
- Risks: polygon count on long rides (fine by estimate, measure on a phone), wall z-fighting with the line in interleaved mode.

### V4 Hillshade context (2D) without 3D terrain

```text
Desktop                                   390 px
+------+---------------------+-----------+ +------------------+
| dock | ░▒▓ relief ▒░ ~~~   | content   | | ░▒▓relief▒░      |
|      | ▒▓░ ~~~track~~~ ▒   | column    | |  ~~~track~~~     |
|      | [Laps][HR][Relief]  |           | |[Laps][Relief]    |
+------+---------------------+-----------+ |==== sheet =======|
```

- Pros: real terrain context; track stays a flat deck layer, so no draping problem; pitch optional.
- Cons: fourth service; shadow colours vs the "no grey on the map" rule; offline only where cached.
- Tech: `raster-dem` (Mapterhorn or AWS Terrarium) + `hillshade` layer inserted below roads in the style; SW `CacheFirst` cache; attribution. Effort M.
- Risks: licence/attribution text per source; tile volume on mobile data.

### V5 MapLibre 3D terrain + track on the surface

```text
Desktop                                   390 px
+------+---------------------+-----------+ +------------------+
| dock |   /\  /\/\   /\     | content   | |  /\ /\/\  /\     |
|      |  /  \/~~~~\_/  \    | column    | | / ~~~~\_/  \     |
|      | /___track on DEM_\  |           | |/__track_____\    |
|      | [2D|3D][x1.5][DEM]  |           | |[2D|3D][DEM]      |
+------+---------------------+-----------+ |==== sheet =======|
```

- Pros: the "real" 3D look; honest relief; MapLibre already in the bundle.
- Cons: fourth service; deck layers do not drape (sea-level / occluded today); the most invasive change; heaviest on phones; offline degrades.
- Tech: `setTerrain` + hillshade + sky; track either z from `queryTerrainElevation` (recomputed per DEM tile load) or moved to a native MapLibre `line` layer (lap picking and hover rebuilt on MapLibre). Effort L.
- Risks: deck/MapLibre terrain integration is "partially supported" in 9.2; `@deck.gl/maplibre` (9.4) may change this, an upgrade is its own item; tile volume; DEM/record mismatch.

### V6 deck-native 3D view: TerrainLayer + draped track (+ TripsLayer replay)

```text
Desktop                                   390 px
+------+---------------------+-----------+ +------------------+
| dock |  /\ /\/\  ^lit mesh | content   | |  /\ /\/\  /\     |
|      | / ~~~~\_/\  (dark,  | column    | | / ~~~~\_/  \     |
|      |/__track draped__\   |  roads    | |/_track draped_\  |
|      | [2D|3D][>replay][DEM]  via MVT) | |[2D|3D][>][DEM]   |
+------+---------------------+-----------+ |==== sheet =======|
```

- Pros: deck.gl's own answer to "track on terrain" (official example does exactly this with Mapterhorn); our PathLayers drape and the hover `ScatterplotLayer` offsets onto the surface without z data or store changes; one rendering stack we already know; `TripsLayer` gives a chart-driven replay for ≈1 KB; standalone mode removes the overlaid/interleaved split for this view; pitch up to 89.
- Cons: fourth service (DEM); MapLibre basemap is either covered (overlay) or replaced (standalone) — the basemap on the relief is a re-coded `MVTLayer` silhouette (no labels) or a plain dark mesh; `_TerrainExtension` is experimental with open bugs (#10850, #10335); worker loaders fetch from unpkg by default (must be turned off); camera fitting and padding re-done for a standalone Deck.
- Tech: add `@deck.gl/geo-layers`, `@deck.gl/extensions`, `@deck.gl/mesh-layers` at 9.2.9 (est. 60–120 KB gz, lazy on the session page); `TerrainLayer` (`operation: 'terrain+draw'`, Terrarium decoder, `loadOptions.terrain.worker: false`), `_TerrainExtension` on session/lap/hover layers, optional `MVTLayer` on the CARTO tile URL with colours ported from `darkMatter.style.json`, optional `TripsLayer` with `currentTime` from the chart cursor; SW `CacheFirst` for DEM tiles. Offline: falls back to 2D when no DEM tiles. Effort L (standalone with plain mesh and no MVT: M–L).
- Risks: extension bugs in picking and settling; GPU cost on mid-range phones (height-map and cover passes per tile); deck 9.4 does not change the MapLibre-terrain gap (RFC #10758 open), so the standalone shape is the stable one; re-coded basemap colours drift from the vendored style.

### V7 react-three-fiber 3D view (standalone canvas)

```text
Desktop                                   390 px
+------+---------------------+-----------+ +------------------+
| dock |      ___/‾\  lit    | content   | |     __/‾\        |
|      |  ___/ tube \__      | column    | |  __/ tube\__     |
|      | /|||curtain|||\ ____|           | | /|||||||||||\    |
|      | ::::: dark ground grid :::::    | |::: grid :::::    |
|      | [2D|3D][>replay][x3]            | |[2D|3D][>][x3]    |
+------+---------------------+-----------+ |==== sheet =======|
```

- Pros: the richest look: lit tube/ribbon with real shading and shadows, one-strip curtain, smooth damped orbit camera (drei `<CameraControls>`), `<Bounds>` fitting, `<Html>` labels, free pitch; playback natural in the render loop; no external service (track + ground plane from own data); `@react-three/fiber` 9.8.2 supports our React 19.2 (peer `>=19 <19.4`); scene logic testable in Vitest with `@react-three/test-renderer` 9.1.1.
- Cons: a second rendering stack and colour/hover rules beside deck.gl; picking, lap casing/selection, hover dot and camera padding re-implemented; no basemap (or a static snapshot) — the map context of the session disappears in 3D mode; ≈ 250–300 KB gz extra (estimate); a second WebGL context on phones; the r3f peer range (`<19.4`) can block React upgrades; pixel output not testable in Playwright beyond DOM state.
- Tech: `three` 0.186, `@react-three/fiber` 9.8, selected `@react-three/drei` 10.7 helpers (`Line`, `CameraControls`, `Bounds`, `Html`), lazy-loaded route chunk; scene in local metres from the session centre; same smoothed/exaggerated elevation series as V2; MapLibre stays mounted underneath. Integrating into MapLibre instead (`react-three-map` 1.0.1, one maintainer, MapLibre 5 not stated) keeps the basemap but gives up the camera freedom that is the main argument, and adds a third renderer to the map. Offline: fully. Effort L.
- Risks: largest code surface of all variants; behaviour parity with the 2D map (zone colours, laps, chart sync) is all hand-built; touch gesture conflicts with the bottom sheet; context loss on low-memory phones.

Not shortlisted: fill-extrusion buildings (e, irrelevant at session zoom); `react-three-map` inside MapLibre as its own variant (covered as a mount option in V7).

**Test first: V2** (V1 is a subset of it). No new service or dep, so it can be spiked without an owner decision on the external-service rule, and it answers the open look questions (floating vs honest, exaggeration, picking with `pickable: '3d'` in both deck modes) that V3, V5 and V6 also depend on. If the owner allows a DEM service, the next spike is V6 standalone with a plain mesh (no MVT), since it reuses our deck layers and is the shape deck.gl's own example uses.

## 5. Open questions

1. **Fourth external service (DEM tiles)?** Options: (a) no, stay with own data (V1–V3); (b) yes, Mapterhorn (no key, WebP 512, CORS, per-source licences, no stated usage policy); (c) yes, AWS Terrain Tiles (no key, PNG 256, older data, long attribution list); (d) decide later after a V2 spike.
2. **Scope of 3D**: (a) tilt only (V1); (b) floating line + shadow (V2); (c) + curtain (V3); (d) terrain on MapLibre (V4/V5); (e) deck-native terrain view (V6); (f) react-three-fiber view (V7).
3. **Height reference and exaggeration**: (a) above the session's lowest point, fixed ×k with a visible label; (b) same, user-adjustable ×k; (c) absolute above sea level (floats over valleys).
4. **3D default and persistence**: (a) off, toggled per visit; (b) remembered in the map preferences store (persisted, needs a store version + `migrate`); (c) on by default for sessions with elevation.
5. **Sessions without (or with partial) elevation**: (a) hide the 3D toggle; (b) show it disabled with a reason; gaps: (a) break the line, (b) interpolate (conflicts with "missing is missing").
6. **Rotation**: (a) pitch only, north stays up (no compass needed); (b) pitch + bearing, with a reset-to-north control.
7. **3D view inside the shared map or as its own canvas?** (a) inside the existing MapLibre + deck overlay (V1–V5, V6 overlay form): basemap and labels stay, camera limits (`maxPitch` 60) stay; (b) a standalone 3D canvas on the session page (V6 standalone, V7): free camera, own basemap (none, MVT silhouette or snapshot), the map context of the session is gone while in 3D.
8. **Basemap in a standalone 3D view** (only if 7b): (a) none, dark ground/mesh; (b) CARTO vector tiles re-coloured in `MVTLayer` (no labels); (c) a raster texture (CARTO raster endpoint, needs a check against the CARTO rule).
9. **Replay** (`TripsLayer` or an r3f animation driven by the chart cursor): (a) not now; (b) part of this item; (c) its own item.
10. **Third-party bundle budget**: (a) no new map deps (V1–V5); (b) deck add-ons, est. 60–120 KB gz lazy (V6); (c) three + r3f, est. 250–300 KB gz lazy (V7).

## 6. Sources

- deck.gl MapboxOverlay: <https://deck.gl/docs/api-reference/mapbox/mapbox-overlay>
- deck.gl @deck.gl/mapbox overview (terrain partially supported, z=0 at sea level): <https://deck.gl/docs/api-reference/mapbox/overview>
- deck.gl @deck.gl/maplibre overview ("not draped over MapLibre terrain"): <https://deck.gl/docs/api-reference/maplibre/overview>
- deck.gl using with MapLibre: <https://deck.gl/docs/developer-guide/base-maps/using-with-maplibre>
- deck.gl TerrainExtension: <https://deck.gl/docs/api-reference/extensions/terrain-extension>
- npm registry: <https://registry.npmjs.org/@deck.gl/geo-layers/9.2.9>, <https://registry.npmjs.org/@deck.gl/extensions/9.2.9>, <https://registry.npmjs.org/@deck.gl/maplibre>
- Mapterhorn: <https://mapterhorn.com/data-access/>, <https://mapterhorn.com/attribution/>, <https://download.mapterhorn.com/attribution.json>
- AWS Terrain Tiles: <https://registry.opendata.aws/terrain-tiles/>, <https://github.com/tilezen/joerd/blob/master/docs/formats.md>, <https://github.com/tilezen/joerd/blob/master/docs/attribution.md>
- CARTO tiles.json: <https://tiles.basemaps.cartocdn.com/vector/carto.streets/v1/tiles.json>
- Lonboard PR on deck z=0 under terrain: <https://github.com/developmentseed/lonboard/pull/890>
- deck.gl What's new (9.2, 9.3, 9.4 release notes): <https://deck.gl/docs/whats-new>
- deck.gl TerrainLayer: <https://deck.gl/docs/api-reference/geo-layers/terrain-layer>; MVTLayer: <https://deck.gl/docs/api-reference/geo-layers/mvt-layer>
- deck.gl TerrainExtension example: <https://github.com/visgl/deck.gl/blob/master/examples/website/terrain-extension/app.tsx>
- RFC "Let TerrainExtension layers follow MapLibre terrain": <https://github.com/visgl/deck.gl/issues/10758>; open bugs <https://github.com/visgl/deck.gl/issues/10850>, <https://github.com/visgl/deck.gl/issues/10335>
- Package tarballs read (scratchpad): `@deck.gl/geo-layers@9.2.9`, `@deck.gl/extensions@9.2.9` (`dist/terrain/terrain-extension.{d.ts,js}`, `dist/terrain-layer/terrain-layer.js`, `dist/trips-layer/trips-layer.d.ts`, `dist/mvt-layer/mvt-layer.js`, `package.json` `sideEffects: false`)
- npm registry: <https://registry.npmjs.org/three>, <https://registry.npmjs.org/@react-three/fiber>, <https://registry.npmjs.org/@react-three/drei>, <https://registry.npmjs.org/@react-three/test-renderer>, <https://registry.npmjs.org/react-three-map>
- bundlephobia: <https://bundlephobia.com/package/three>, <https://bundlephobia.com/package/@react-three/fiber>, <https://bundlephobia.com/package/@react-three/drei>, <https://bundlephobia.com/package/h3-js>
- react-three-map: <https://github.com/RodrigoHamuy/react-three-map>
- Local: `maplibre-gl@5.18.0/dist/maplibre-gl.d.ts`, `@maplibre/maplibre-gl-style-spec@24.4.1/dist/index.d.ts`, `@deck.gl/mapbox@9.2.9/src/{deck-utils,mapbox-overlay,mapbox-layer}.ts`, `@deck.gl/core@9.2.9/src/lib/{deck,deck-picker}.ts`, `@deck.gl/layers@9.2.9/dist/{path-layer,solid-polygon-layer,scatterplot-layer}`
