# Mobile touch: tab shadow, overlays as sheets, no hover on touch

**Runs after `plans/mobile-map.md` and `plans/filter-query.md`.**

- mobile-map changes `LapsControl.tsx`, `SessionMapControls.tsx`, `mapPadding.ts` and `sheetPosition`. Here those files only get the `useIsDesktop` → `useDevice` import swap (`SessionMapControls.tsx:4,19`, `mapPadding.ts:4`). Apply it on top of the mobile-map result. `ResponsivePopover` gets new optional props only, so `LapsControl`'s use of it keeps working.
- filter-query owns everything inside `FilterList` (fixed-height list area, feedback row, empty states) and changes `useFilterBuilder.ts`. Line refs into those two files are pre-filter-query, so they are given by symbol below. This plan only touches the container around `FilterList` and its fine-pointer query.

## Context

- `TabsList` uses `floatingClass` (`src/components/ui/Tabs.tsx:3,15`) but is only sticky from `lg` (`Tabs.tsx:16`). Below `lg` it scrolls away, so the floating shadow (`Card.tsx:5-6`) has no reason to be there.
- Mobile filter: an inline `floatingClass` card above the dock bar (`Dock.tsx:82-93`), toggled by `useDockList` (`Dock.tsx:17-43`). Outside clicks are handled by `useDismiss` (`:23`) and Escape by the keydown listener in `useFilterBuilder` (two-step: clear text, then close).
- Map pickers: `SessionsPickPopup` and `StudioRoutesPickPopup` → `MapPickPopup` → `MapPopupShell`. On desktop the shell is a portal positioned with `usePopupPosition`; on mobile it is a hand-built sheet with `SheetBackdrop`. `StudioTrackPickPopup.tsx:53` uses `MapPopupShell` directly, so the shell, `usePopupPosition` and `SheetBackdrop` keep one user after this plan.
- Radix Popover 1.1.15 exports `PopoverAnchor`, which takes `virtualRef` (a `{ getBoundingClientRect }` object). That anchors the popover at the tap point without a DOM trigger.
- `useIsDesktop` only checks width (`useIsDesktop.ts:3-5`). `FilterList` runs its own fine-pointer `matchMedia` query (its constant, the hook call and the use site).
- Hover-driven effects on touch:
  - Chart → map circle: the chart sets `hoveredPoint` (`SessionChartsExplorer.tsx:155-171`, `RouteChartsExplorer.tsx:62-77`; touch events wired in `chartHover.ts:9-12`), and the map draws it at `DeckGLOverlay.tsx:335-354`.
  - The lap strip uses `onPointerEnter` (`LapStrip.tsx:264`), which also fires on a tap and leaves the hover stuck.
  - `useMapHover` is gated by width only (`useMapHover.ts:17`).

## Decisions (settled)

- **M1:** below `lg`, `TabsList` has no shadow. Everything else stays as it is, and the other `floatingClass` users keep their shadow.
- **M4 filter:** desktop rail unchanged. On mobile the filter opens in `ResponsivePopover`, which below `lg` is the Radix Dialog bottom sheet. Backdrop tap and Escape close it.
- **M4 picker:** `MapPickPopup` moves to `ResponsivePopover` on both layouts. Desktop shows a Popover anchored at the tap point; mobile shows the Dialog bottom sheet.
- **M5:** `useIsDesktop` is replaced by `useDevice()` → `{ isDesktop, pointerFine }`. When `pointerFine` is false, three hover effects are off: the chart→map circle, the lap strip hover and the list→map hover. The map's own lap hover (`DeckGLOverlay.tsx:115-122`) stays. So do chart crosshair and tooltip scrubbing, which run through `useChartHoverStore`, and the chart→lap highlight. Tailwind `hover:` is already gated, so no change there.

## Approach

### M1: tab shadow

- `src/components/ui/Card.tsx:5-6`: split the string into a private `floatingSurface` (bg, blur, border). Then `floatingClass = \`${floatingSurface} shadow-[…]\`` and a new export `floatingLgClass = \`${floatingSurface} lg:shadow-[…]\`` (surface that floats only from `lg`). Both are full class literals, so Tailwind's scanner picks them up.
- `Tabs.tsx:3,15`: use `floatingLgClass`.
- `CLAUDE.md` §7: add one line: "sticky only from `lg`: `floatingLgClass`".

### `useDevice` (M5 base)

- New `src/lib/hooks/useDevice.ts`: `DESKTOP_MEDIA_QUERY`, `FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)'`, `useDevice = () => ({ isDesktop: useMediaQuery(…), pointerFine: useMediaQuery(…) })`. Delete `useIsDesktop.ts`.
- Call sites use `const device = useDevice()` and `device.isDesktop`, with no destructuring:
  - `AppLayout.tsx:57`, `Dock.tsx:98`, `ResponsivePopover.tsx:20`, `Toast.tsx:17`
  - `MapPopupShell.tsx:19`, `usePopupPosition.ts:59`, `SessionMapControls.tsx:19`
- `mapPadding.ts:4,56`: it is not a hook, so it keeps `window.matchMedia(DESKTOP_MEDIA_QUERY)` and only changes the import to `useDevice.ts`.
- `FilterList.tsx` (after filter-query.md, locate by content): drop its own fine-pointer query and use `useDevice().pointerFine`. Nothing else in `FilterList` changes; the list area, feedback row and empty states stay as filter-query left them.

### M5: hover off on touch

- `useMapHover.ts:17-35`: gate on `device.pointerFine` instead of `isDesktop`, and update the doc comment.
- `SessionChartsExplorer.tsx:155-171` and `RouteChartsExplorer.tsx:62-77`: call `setHoveredPoint` only when `device.pointerFine`, and add it to the `useCallback` deps. The chart-hover store, the clear path and `setHoveredLap` stay as they are.
- `LapStrip.tsx:217,264`: `LapStripDetail` reads `useDevice()`. It sets `onPointerEnter` and `onPointerLeave` only when `pointerFine`. `onClick` (select) stays.
- `DeckGLOverlay.tsx`: no change. The layer stays empty because the store is never written.

### `ResponsivePopover` (shared by both M4 parts)

- `src/components/ui/Popover.tsx`: export `PopoverAnchor = PopoverPrimitive.Anchor`.
- `ResponsivePopover.tsx:8-17`: make `trigger` optional and add two optional props:
  - `anchor?: { x: number; y: number }`: desktop renders `<PopoverAnchor virtualRef={…}>`, where the ref's `getBoundingClientRect` returns `DOMRect.fromRect({ x, y, width: 0, height: 0 })` (`useMemo` on x/y), in place of the trigger.
  - `collisionPadding?`: forwarded to `PopoverContent`.
- Without a trigger, Dialog and Popover render no Trigger. Existing callers are unchanged.

### M4 filter (mobile)

- `Dock.tsx:82-93`: remove the inline card. `DockBar` renders `<ResponsivePopover open={list.open} onOpenChange={…} title={m.ui_dock_filter()} className="p-0">` with no trigger, containing `<FilterList open sizing="content" …>`.
- Height: after filter-query.md, `sizing="content"` is fixed (input row + `h-[252px]` list area), so the sheet height is constant and the input never moves (owner requirement). No extra `max-h`, height or scroll wrapper around `FilterList`; the only cap is `DialogContent`'s own `max-h-[85dvh]`. The feedback row's suggestion button is inside the portalled dialog, so tapping it is an inside click. `DockFilterButton` keeps its `onClick`/`aria-expanded` (`DockItems.tsx:118-138`). `DockBar` only renders below `lg`, so this is always the Dialog path.
- `useDismiss` (`Dock.tsx:23`) moves into the rail only. On the bar, clicks inside the portalled dialog would count as "outside" `DockBar` and close it.
- Escape in the dialog closes it in one step: Radix handles it before the builder's two-step listener (in `useFilterBuilder`) runs. On the rail the two-step Escape (clear text, then close) stays.

### M4 picker

- `MapPickPopup.tsx`: replace `MapPopupShell` with `<ResponsivePopover open onOpenChange={(o) => !o && props.onClose()} anchor={{ x, y }} side="right" align="start" collisionPadding={…} title={props.title}>`. Sizing:
  - desktop: `lg:w-[380px] lg:max-w-none lg:max-h-[300px] flex flex-col overflow-hidden p-2` (the Popover default is `max-w-xs p-4`)
  - mobile: `max-lg:h-[50dvh] max-lg:landscape:h-[75dvh]`, same as today
  - `CardHeader` and the X button stay.
- `collisionPadding`: extract the safe-zone body of `usePopupPosition.ts:60-85` (dock and main rects) into an exported `popupSafeZone(isDesktop)`. `MapPickPopup` turns it into `{ left: safe.left, top: safe.top, right: innerWidth - safe.right, bottom: innerHeight - safe.bottom }`, and `usePopupPosition` reuses it.
- Radix Popover's outside-dismiss replaces `useDismiss` (outside on desktop, Escape on both). The map stays non-interactive while the popup is open (`useMapPopupState.ts:22`), as it is today.
- `MapPopupShell.tsx`, `usePopupPosition.ts` and `SheetBackdrop.tsx` stay: `StudioTrackPickPopup` still uses them (see Open).

## Open

- Move `StudioTrackPickPopup` to `ResponsivePopover` as well? That would let us delete `MapPopupShell.tsx`, `SheetBackdrop.tsx`, `usePopupPosition.ts` and their two tests (`tests/features/map/hooks/computePopupPosition.spec.ts`, `usePopupPosition.integration.test.ts`). It is not in the M4 decision, so it is left out unless the owner says otherwise.

## Tests

- Unit: nothing new. The changes are wiring, and `computePopupPosition` keeps its spec.
- `tests/lib/useMapHover.integration.test.ts`: rename "on desktop" / "non-desktop viewports" to fine pointer / touch. The `matchMedia` stub already answers every query.
- `e2e/mobile/map.spec.ts`:
  - First assert the mobile project reports `matchMedia(FINE_POINTER_QUERY).matches === false`, so the touch emulation is real.
  - "switches tabs and opens the filter card…" (~`:195`, after filter-query.md locate by name): find the field and list through `page.getByRole('dialog')` instead of `[data-dock-card]`. Escape now closes in one step. The backdrop tap closes it. The dock box is unchanged.
  - filter-query's "filter input stays in place while typing" sits next to it and must keep passing inside the dialog: input found by `getByLabel(/describe a filter/i)`, boxes measured after the sheet's open animation.
  - "tapping a track…" (`:261`): the picker is `getByRole('dialog')`. It closes on a backdrop tap (existing) and on Escape. Keep the 500 ms still-open check, which guards against the ghost click.
  - New: "chart scrub on touch shows no map circle". On session detail, a touch drag across a chart (CDP `Input.dispatchTouchEvent`) must leave `useChartHoverStore` set (crosshair still works) while `useMapFocusStore.getState().hoveredPoint` stays `null`.
- `e2e/map.spec.ts`: new "track click opens the picker popover at the click point". Move `findTrackPoint` (`e2e/mobile/map.spec.ts:20`) to `e2e/helpers/`. Click a track, then the popover is visible, is not a modal sheet, and its box sits within a few px of the click point (one corner adjacent).
- `e2e/filters.spec.ts`: unchanged. It must still pass, which proves the desktop filter is untouched.

## Verification

`vp check`, `vp test -- --run`, `vp exec playwright test`, `vp build`. By hand, on a phone or in DevTools touch emulation:
- tabs have no shadow below `lg`
- the filter opens as a sheet, and the input does not move while typing (suggestion, not understood, no match, empty)
- a map tap opens the picker sheet
- chart scrubbing shows crosshair and tooltip but no map circle
- tapping the lap strip selects without a stuck hover

On desktop: filter rail unchanged, and the picker sits at the click point and stays clear of the dock and side panel.
