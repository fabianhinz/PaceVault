# Map track intensity (BUILT, ready for review)

Mockup: `mockups/map-track-intensity/index.html` (variant V1, pill + popover).

## Context

Overview tracks are drawn by the `gps-tracks` PathLayer (`src/features/map/DeckGLOverlay.tsx:146-179`) with additive blending (`src/features/map/trackColors.ts:3-10`). Every track used a fixed alpha of 80, so single passes and hot spots could not be tuned. The width stays as it is: 8 m, highlight 12 m (`src/features/map/trackColors.ts:12-15`).

## Decisions

1. **Control:** V1 pill + popover, mirroring Color by (`src/features/sessions/session/ColorByControl.tsx:110-179`). The pill shows the `Contrast` icon, the current value and a chevron, with no title. The popover has the caption header "Intensity" and three radio rows, each with a title, a caption and a ramp swatch.
2. **Presets:** Faint 80, Warm 160 (default), Hot 255. Nothing below 80. Labels: EN Faint / Warm / Hot, DE Schwach / Warm / Heiß.
3. **Transient:** not persisted. Warm is selected again on reload.
4. **Where:** every view that draws the overview `gps-tracks` layer (dashboard, `/sessions` tabs, Labs outside Studio, trip pages). Hidden when there are no tracks, on a session page and in Studio.
5. **Map padding:** while the overview controls are shown, the bottom controls strip is reserved, the same as for an open session.
6. **Highlight:** hover is unchanged: the hovered track is drawn at 255 and all others at 0. No non-hover highlight exists on overview views, because `highlightedSessionId` comes either from hover (`src/lib/hooks/useMapHover.ts:5-8`) or from `/sessions/:id`, where the layer isn't drawn. So there is no extra branch for it.

## Approach

- **State:** `src/store/mapControls.ts:6` adds `TrackIntensity`. `:27-30` and `:73-76` add `trackIntensity` with `setTrackIntensity`, and `overviewMapControlsShown` with `setOverviewMapControlsShown`. The store is not persisted.
- **Mapping:** `src/features/map/trackColors.ts:18-24` holds `TRACK_INTENSITIES` and `trackIntensityAlpha` next to `trackModifiers`. `sportTrackColor` is now an RGB tuple (`:31-34`), because its alpha was no longer read.
- **Layer:** `src/features/map/DeckGLOverlay.tsx:75` reads the preset. `:152` maps it to alpha, `:170` adds it to `updateTriggers.getColor`, and `:188` adds it to the `useMemo` deps.
- **Visibility:**
  - `src/features/map/hooks/useOverviewMapControlsEffect.ts:5-10` sets `overviewMapControlsShown` to `tracks.length > 0`. `useMapTracks` already returns no tracks for an open session, Studio and reprocessing.
  - It is called at `src/features/map/DeckGLOverlay.tsx:83`, before `useMapCameraEffect` at `:104`. The flag is therefore set before the camera fit runs in the same commit.
- **Padding:** `hasMapControls` (`src/features/map/mapPadding.ts:13-15`) also returns true for `overviewMapControlsShown`.
- **UI:**
  - `src/features/map/OverviewMapControls.tsx:8-46` is the placement wrapper, a copy of `SessionMapControls`: fixed at the bottom centre on desktop, in `SheetAbove` on phone.
  - `src/features/map/TrackIntensityControl.tsx:53-115` is the pill and popover. The pill keeps a stable width by stacking all labels invisibly (`:68-75`).
  - The ramp swatch (`:28-51`) shows 1 to 10 additive passes per sport over the basemap, running on top and cycling below, as in the mockup.
- **Mount:** `src/components/layout/AppLayout.tsx:30`, inside `RouteContent`. It renders under `BottomSheetProvider` on phone, which `SheetAbove` needs, and inside `main` on desktop, the same place as `SessionMapControls`.
- **Messages:** `messages/en.json:682-688` and `messages/de.json:682-688` hold `ui_track_intensity*`. The captions are drafts for review.

## Tests

- **e2e:** `e2e/map.spec.ts:110-132`. The pill shows Warm on `/sessions`, choosing Hot updates it, and it is hidden on a session page.
- **No unit test:** the preset-to-alpha mapping is a pass-through (`tests/CLAUDE.md`).

## Verification

```bash
vp check
vp test -- --run
vp exec playwright test
vp build
```

By hand:

- Dashboard: the pill appears and Hot brightens the tracks.
- A session page and Studio: no pill.
- An empty filter: no pill.
- Phone: the pill sits above the sheet.
- The overview fit leaves room for the pill.
