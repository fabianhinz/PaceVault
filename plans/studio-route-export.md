# Studio: export the whole route as GPX

## Context

Users keep sessions they want to repeat as studio routes ("Edit in studio"). Studio can only export segments between split markers (`src/features/studio/markers/StudioTrackPickPopup.tsx:71-85`); without a split the button is disabled. The session page exports the whole track from its ⋮ menu (`src/features/sessions/session/SessionActionsMenu.tsx:47-52`).

The studio keeps every parsed point in IndexedDB (`src/packages/gpx/routeGeometry.ts:100`); only the map polyline is simplified (`src/packages/gpx/routeGeometry.ts:105`). A whole-route export is lossless.

## Dependencies

- **After `plans/mobile-overlays.md`.** That plan turns the studio ⋮ menu (`src/features/studio/StudioActionsMenu.tsx`) into the shared `ActionsMenu` (`src/components/ui/ActionsMenu.tsx`), which is the floating card on phone and the `DropdownMenu` on desktop. The Export row is added there as one more `items` entry, not as a `DropdownMenuItem`.

## Decisions

- **Placement:** ⋮ menu on the studio detail page, and the map popup. Without splits, the popup button exports the whole route instead of showing the disabled "Add a split to export segments".
- **POIs:** every `point_of_interest` marker becomes a `<wpt>` with `<name>` (label) and `<desc>` (description, when set), placed via `pointAtRouteDistance` (`src/packages/gpx/routeCut.ts:45`).
- **Gaps:** one `<trkseg>` per source segment (`ParsedGpxPoint.seg`, `src/packages/gpx/parseGpx.ts:8`), for both whole-route and segment exports. Fixes today's segment export, which bridges gaps with a straight line (`src/packages/gpx/buildGpx.ts:51`).
- **Filename:** the route name, `${route.name}.gpx` (segments keep `${route.name} - segment ${index}.gpx`).
- **Segment POIs:** a segment export includes the POIs whose `distanceM` lies inside the segment.
- **Popup label without splits:** new key `ui_studio_export_route`, EN "Export whole route", DE "Ganze Strecke exportieren", next to `ui_studio_export_segment` (`messages/en.json:154`, `messages/de.json:154`). `ui_studio_export_needs_split` (`messages/en.json:155`, `messages/de.json:155`) is deleted: its only caller is `src/features/studio/markers/StudioTrackPickPopup.tsx:41`, which this plan replaces.

## Approach

1. `src/packages/gpx/buildGpx.ts`
   - `GpxPoint` gets optional `seg?: number`; `buildGpxString` closes and opens a `<trkseg>` whenever `seg` changes. The session export sets no `seg` and stays one segment.
   - New optional `waypoints?: GpxWaypoint[]` (`{ lat, lon, ele?, name, desc? }`), written as `<wpt>` before `<trk>` (GPX 1.1 order), names escaped.
2. `src/lib/gpxExport.ts`
   - `toGpxPoint` carries `seg`.
   - New `buildRouteGpx(points, markers, metadata)`: all points plus POI waypoints.
   - `buildRouteSegmentGpx` also takes markers and keeps the POIs inside `[startM, endM]`.
3. `src/features/studio/hooks/useStudioSegmentExport.ts` → `useStudioRouteExport.ts`, returning `exporting`, `exportRoute(route)`, `exportSegment(route, startM, endM, index)`. Shared busy state, error toast, `downloadFile`.
4. `src/features/studio/StudioActionsMenu.tsx`: a `FileDown` entry with `m.ui_btn_export_gpx()` in the `ActionsMenu` `items`, between Edit and Delete, `disabled` while exporting. It shows up in both the desktop dropdown and the phone card.
5. `src/features/studio/markers/StudioTrackPickPopup.tsx`: without splits the button calls `exportRoute` with `m.ui_studio_export_route()` in place of `m.ui_studio_export_needs_split()` (line 41), and `!hasSplits` leaves its `disabled` condition (line 76).
6. Messages EN/DE per `messages/CLAUDE.md`: add `ui_studio_export_route`, delete `ui_studio_export_needs_split`.

## Verification

- `tests/packages/gpx/buildGpx.spec.ts`: multiple `<trkseg>` on `seg` change; single segment without `seg`; `<wpt>` before `<trk>` with escaped name/desc. The existing case at `tests/packages/gpx/buildGpx.spec.ts:25` uses `toMatchSnapshot()` (`tests/packages/gpx/__snapshots__/buildGpx.spec.ts.snap`, one entry). Its input has no `seg` and no waypoints, so the snapshot must stay byte-identical; a diff there is a regression of the session export, not a snapshot to update. The new cases assert on the string directly, so they add no snapshots.
- `tests/lib/gpxExport.spec.ts`: `buildRouteGpx` keeps all points, maps POIs to waypoints at the right distance, ignores split markers; `buildRouteSegmentGpx` keeps only POIs inside the segment.
- `e2e/studio.spec.ts`: export from the ⋮ menu → download named `<route name>.gpx` containing `<trkpt>` and a `<wpt>` for a seeded POI; popup without splits exports the whole route.
- `vp check`, `vp test -- --run`, `vp exec playwright test`, `vp build`.
