# Mobile bottom sheet replacing MobileMapFab

## Context
On mobile, `MobileMapFab` (src/components/layout/MobileMapFab.tsx:11-18) toggles `mobileMapActive`, which slides `<main>` off-screen (src/components/layout/AppLayout.tsx:48) and fades the map (AppLayout.tsx:28-34). Map and content are mutually exclusive, and the toggle isn't what mobile users expect. Replace it with a draggable bottom sheet (Apple/Google Maps pattern): the map stays visible behind, and the content lives in a sheet with a grabber and physics-based snapping. Desktop (`lg:` / `useIsDesktop`, 1024px) is unchanged. The onboarding branch (AppLayout.tsx:60-62) stays outside the sheet.

## Sketch
```
  PEEK                 HALF                 FULL
 map ~85%            map ~50%            content ~92%
 ───━━━───           ───━━━───           ───━━━───
 fixed strip         list scrolls        list scrolls
 [ Dock ]            [ Dock ]            [ Dock ]   ← fixed z-50, unchanged
```

## Decisions (confirmed)
- Snaps: peek / half / full. Peek is a fixed sheet-owned strip (grabber plus a small px height), not a page header.
- Only the grabber/handle drags the sheet. The body scrolls natively at every snap, with no scroll handoff.
- Tapping the grabber toggles half ↔ full. Peek is reachable only by dragging down.
- Physics: `motion` (`motion/react`), new dependency.
- The snap persists across reloads and is kept on route changes. The map-pick popup leaves it alone.
- The Dock and its reveal panels stay as they are (they already overlay). The sheet uses the static closed Dock height.
- Card expand (`useExpandCard`) is removed on mobile for all three users.

## Approach
1. **Dependency**: `vp add motion`.
2. **Store** (`src/store/layout.ts`):
   - Replace `mobileMapActive` / `toggleMobileMap` with `mobileSheetSnap: 'peek' | 'half' | 'full'` (default `'half'`) and the action `snapMobileSheet(snap)`.
   - Persist `version: 4`. The migration maps `mobileMapActive === true` → `'peek'` and anything else → `'half'`, deletes the old key, and validates with a Zod enum (fallback `'half'`).
3. **Snap math** (`src/lib/sheetSnap.ts`): `resolveSnap(points, y, velocityY)` takes the px offsets per snap, returns the next snap in the direction of a fling above the threshold, and otherwise the nearest. No ternaries.
4. **Primitive** (`src/components/ui/BottomSheet.tsx`):
   - A `motion.div` with `drag="y"`, `dragListener={false}`, `useDragControls` started from the handle's `onPointerDown`, `dragConstraints` between the full and peek offsets, `dragElastic`, and `useMotionValue` for y. `onDragEnd` calls `resolveSnap`, then `animate(y, target, spring)`, then `onSnapChange`.
   - Snap px offsets are derived from `innerHeight`, the Dock height and `env(safe-area-inset-bottom)`, and recomputed on resize. The initial y comes synchronously from the hydrated snap, so there's no spring-in on first paint.
   - The handle is a button with a paraglide aria-label per state (expand / collapse).
   - The body is `overflow-y-auto overscroll-contain` and carries the safe-area left/right padding currently on `<main>` (AppLayout.tsx:44-45).
   - Expose the scroll element through a small context (`useSheetScrollElement`) for consumers.
5. **AppLayout**: on `!isDesktop`, render `DemoBanner` + `<Outlet/>` inside `BottomSheet` with `data-layout="main"` and `data-sheet-snap`. Remove the mobile map fade (AppLayout.tsx:28-34) and translate (AppLayout.tsx:48). Lock document overscroll on mobile. Remounting across the 1024px breakpoint is accepted.
6. **Scroll consumers**:
   - `src/features/sessions/SessionList.tsx:46`: on mobile, use `useVirtualizer({ getScrollElement })` with the sheet scroller and a `scrollMargin` measured relative to it. Keep `useWindowVirtualizer` on desktop.
   - `src/components/layout/Dock.tsx:96`: on mobile, reset the sheet scroller instead of `window.scrollTo`.
   - `src/components/ui/Tabs.tsx:15`: check that the sticky `top-6` works inside the sheet (likely `top-0` on mobile).
7. **Map camera**: in `src/features/map/hooks/useMapCameraEffect.ts:18` and `src/features/map/hooks/useGeolocationCameraEffect.ts`, align the breakpoint to 1024px. On mobile, use bottom padding equal to the visible sheet height for the current snap plus the Dock, for `fitBounds`/`flyTo`.
8. **Expand off on mobile**: hide the expand button / disable `useExpandCard` on `!isDesktop` in `src/components/ui/ChartPreviewCard.tsx:38-45`, `src/features/map/MapPickPopup.tsx:26` and `src/features/sessions/laps/LapPickPopup.tsx:115`. Mobile always renders `'compact'`.
9. **Delete dead code**:
   - `MobileMapFab.tsx`, its import and render in `Dock.tsx:27,185`
   - `src/components/ui/ToggleButton.tsx` (its only user is the FAB)
   - `ui_dock_show_map`/`ui_dock_hide_map` in `messages/en.json` + `messages/de.json`
   - `SessionsPickPopup.tsx:4,37-42`, which becomes `onNavigate={props.onClose}`

   Add the handle aria-label messages to both language files.

## Tests
- `tests/store/layout.spec.ts`:
  - `snapMobileSheet`
  - migrations from v1/v2/v3: `mobileMapActive: true` → peek, otherwise half
  - a garbage value → half
  - drop `mobileMapActive` from `beforeEach`
- `tests/lib/sheetSnap.spec.ts`: nearest snap, fling up/down, clamping at the ends.
- `e2e/mobile/map.spec.ts` (rewrite):
  - default `data-sheet-snap="half"`
  - tapping the handle toggles half ↔ full
  - dragging the handle with `page.mouse` reaches peek
  - the snap survives a reload
  - no expand button on mobile
  - the session list renders rows past the first screen inside the sheet

## Verification
```
vp check
vp test -- --run
vp exec playwright test
vp build
```
Then check manually on an iOS PWA: flicks, safe areas (top at full, landscape), body scrolling at every snap, map padding at half and peek.

