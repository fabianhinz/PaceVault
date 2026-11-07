# Map tiles: how the basemap and terrain are built, and what Voyager needs

Findings from a code walkthrough with the owner (2026-11-07). They inform Q2, Q5, Q10 and Q11. They decide nothing. Paths are relative to `apps/web/src/components/mapBackground/`.

## 1. Two tile providers

| Layer           | Provider   | Tiles                                                                          | When                                    | Service-worker cache                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------ | --------------------------------------- | ------------------------------------------------------ |
| 2D basemap      | CARTO      | Vector `carto.streets` `.mvt`, maxzoom 14, overzoomed to 20 (`mapStyle.ts:15-19`) | Always                                  | `carto-tiles`; glyphs and sprites in `carto-assets`    |
| 3D terrain (DEM) | Mapterhorn | `.webp`, `terrarium` encoding, 512 px, maxzoom 16 (`mapStyle.ts:23-35`)        | Only session scene with 3D on (`index.tsx:25-28`) | `mapterhorn-dem`                                       |

The caches are configured in `apps/web/vite.config.ts:37-76` (CacheFirst, 30 days).

- **The CARTO style ships in the repo.** `darkMatter.style.json` and `voyager.style.json` are copies of CARTO's styles. `createStyle` (`mapStyle.ts:71-78`) swaps the source for a direct `{z}/{x}/{y}.mvt` URL instead of `tiles.json`, so the map draws offline from cached tiles. If `VITE_CARTO_API_KEY` is set, `?key=…` is added to every CARTO URL.
- **The style is fixed today.** `index.tsx:44` passes `STYLE_BY_MAP_STYLE.dark`. `MapStyleId` has one member, `'dark'`, and Voyager is commented out with a TODO (`mapStyle.ts:12-13`, `:63-67`, `:82-83`).

## 2. How 3D gets its look

- **The DEM colours are never shown.** MapLibre reads each pixel as a height (`R × 256 + G + B / 256 − 32768` m). The colours are only data.
- **Terrain adds no colour of its own.** `useMapTerrainEffect.ts:26-44` adds two sources from the same `terrainDemSource`: `terrain-dem` for `setTerrain`, and `terrain-hillshade-dem` for a `hillshade` layer. MapLibre recommends separate sources for these two. The hillshade layer goes under the first `transportation` (road) layer.
- **The CARTO layers are laid over the 3D surface.** Fill and line layers, including the hillshade, are drawn into an image per tile and laid over the surface. Labels and icons are placed upright at terrain height instead. So 2D and 3D draw the same CARTO style, and only the ground differs.
- **The hillshade only shades.** `TERRAIN_HILLSHADE_PAINT` (`mapStyle.ts:37-42`) sets shadow and accent to `tokens.mapShadow` `#000000`, highlight to `tokens.mapHillshadeHighlight` `#ffffff1a`, and exaggeration to 0.6. On the dark map it can only darken (shadows) or lift by about 10 % (highlight).

## 3. What adding Voyager needs

**Works as is**

- Voyager has the same `carto` source, 93 layers and 49 `transportation` layers as Dark Matter (checked with `jq`). Uncommenting it in `mapStyle.ts` and adding `'voyager'` to `MapStyleId` is enough for the tiles.
- Same tiles, so the offline cache already covers it. Voyager's sprites (`/gl/voyager-gl-style/`) match the `carto-assets` pattern.
- The hillshade still finds its insertion point (`useMapTerrainEffect.ts:12-16`).

**Needs work**

1. **2D track blending.** deck.gl draws the 2D tracks with `ADDITIVE_BLEND` (`trackColors.ts:4-11`). It's used at `hooks/useTrackLayers.ts:100` and `hooks/useOnboardingPreviewLayer.ts:61`. Additive blending on a light basemap saturates toward white, and the tracks vanish. This is the same finding as `light-palette.md` § 1, with updated paths. → Q2, Q5.
2. **3D track blending is already plain alpha.** In 3D, MapLibre line layers draw the session track (`hooks/useTerrainLineEffect.ts:52-80`) with normal alpha blending. Additive blending doesn't apply there. Only the colours, casing and dimming need light variants. → Q9, Q11.
3. **The lap dimming darkens.** Unselected laps are darkened RGB × `LAP_DIMMED_BRIGHTNESS` 0.8 (`trackColors.ts:33`, `lapPath.ts:16-19`). On Voyager, darkening moves the dimmed laps toward the roads and labels instead of fading them. → Q11.
4. **The hillshade paint is dark-only.** The black shadow still reads on Voyager. The `#ffffff1a` highlight is invisible on a light ground. The paint needs one value set per style. → Q10.
5. **Switching style while 3D is on.** This is likely but unverified. A style change makes react-map-gl swap the whole style. That can drop the sources and layers we add at runtime: terrain, hillshade and the 3D track lines. `useMapTerrainEffect` only re-runs when `[map]` changes (`useMapTerrainEffect.ts:44`), which doesn't happen on a style switch, so it wouldn't add them back. This matters as soon as the theme can change while the map is open, for example "follow the phone" (Q3 (a), Q4 (a)). Fix: remount `SessionTerrain` when the style changes, or re-add the layers on `style.load`. This belongs in `tech.md`, not in an owner question.
6. **Choosing the style.** No store field holds the map style yet. If the map follows the UI theme (Q2 (a)), the style comes from the theme. If it's a separate setting (Q2 (c)), it needs its own persisted field.
