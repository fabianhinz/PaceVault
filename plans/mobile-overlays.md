# Mobile overlays: floating card

## Context

On phone, every overlay looks weak. The phone branch of `ResponsivePopover` (`src/components/ui/ResponsivePopover.tsx:56-64`) and every modal dialog render through `DialogContent` (`src/components/ui/Dialog.tsx:20-47`) as a full-width sheet with rounded top corners (`Dialog.tsx:29`). Its problems:

- Over `backdrop-blur-xl` with no dimming (`Dialog.tsx:12`), the sheet and the blurred backdrop are nearly the same grey. The only edge is `border-white/10`, and the downward shadow of `floatingClass` (`src/components/ui/Card.tsx:9`) falls off-screen.
- Padding is uneven. Top is 16, sides 24 and bottom max(24, safe area): `p-4` from `ResponsivePopover.tsx:59` is overridden by `Dialog.tsx:30-31`. Map pick has 8 (`src/features/map/MapPickPopup.tsx:34-36`) and the filter has 0 (`src/components/layout/Dock.tsx:93`).
- The whole sheet scrolls (`Dialog.tsx:28`). The title scrolls away and nothing signals more content. There is no visible title (`ResponsivePopover.tsx:60` is `sr-only`), no grabber and no close button.

Four variants were compared in `mockups/mobile-overlays/index.html`: 1 today, 2 padding + edge, 3 header + scroll area, 4 floating card. **Variant 4 won.** On phone the overlay becomes a real floating card with all four edges visible over a dimmed map. It gets a fixed header and a body that alone scrolls. The full-width, rounded-top look stays reserved for the app's own `BottomSheet`, so an overlay and the sheet no longer look alike.

## Decisions (settled)

- **Phone only.** The breakpoint is `lg`, the same as `DESKTOP_MEDIA_QUERY` (`src/lib/hooks/useDevice.ts:3`). Desktop popovers and the centred desktop dialog keep today's look.
- **Card shape:** `floatingClass` stays unchanged, plus `rounded-3xl flex flex-col overflow-hidden`. No safe-area padding inside, because the card's position already keeps it clear of the notch and the home indicator.
- **One central sizing rule.** `DialogContent` owns placement and size for every phone overlay. No overlay passes a height. The old `h-[50dvh]` / `landscape:h-[75dvh]` (`src/features/map/MapPickPopup.tsx:35`) and the filter's fixed `h-[252px]` (`src/features/filters/FilterList.tsx:60`) both go.
  - **Height hugs the content**, up to a cap. There is no fixed height and no minimum.
  - **Bottom edge** sits on the dock line: `DOCK_ROW_BOTTOM_CSS` (`src/lib/dockGeometry.ts:6`). That is `max(12px, safe-bottom − 6px)`, the same line the dock row sits on (`src/components/layout/Dock.tsx:81`).
  - **Top cap** is the top gap of the `BottomSheet` at its full position: `max(safe-top + 12px, 8 % of the viewport height)` (`src/lib/sheetPosition.ts:21-22`, `sheetPosition.ts:26-29`). The card never reaches higher than the app's own sheet can.
  - **Side edges** follow the safe area like the dock row does (`Dock.tsx:82`), with the mockup's 8 px minimum: `max(0.5rem, env(safe-area-inset-left/right))`. In landscape this clears the notch on whichever side it is.
  - **Width** is capped at `32rem` and centred. This is the same width as the desktop dialog (`src/components/ui/Dialog.tsx:34`). In portrait it has no effect (390 − 16 < 512); in landscape the card doesn't stretch across 844 px.
  - **Landscape placement:** always centred, whichever side the trigger is on (the ⋮ at the right edge, the pills in the middle). There is no per-overlay or per-trigger placement; one rule for every overlay.
  - **Viewport unit:** `dvh`. In standalone PWA mode there is no browser chrome, so `100dvh` is the full screen and `env()` carries the notch and home-indicator insets. This matches `readSheetLayout` (`sheetPosition.ts:97-102`), which uses `window.innerHeight` plus the same insets. Nothing depends on `display-mode`.
  - **CSS** (phone, on `DialogContent`):
    ```
    style: --sheet-bottom: DOCK_ROW_BOTTOM_CSS; --sheet-top: SHEET_TOP_GAP_CSS
    fixed bottom-(--sheet-bottom) mx-auto max-w-lg
    left-[max(0.5rem,env(safe-area-inset-left))] right-[max(0.5rem,env(safe-area-inset-right))]
    max-h-[calc(100dvh-var(--sheet-top)-var(--sheet-bottom))]
    ```
    `SHEET_TOP_GAP_CSS` = `max(calc(env(safe-area-inset-top) + 12px), 8dvh)`. It is built from the constants at `sheetPosition.ts:21-22` and exported next to them, the way `DOCK_ROW_BOTTOM_CSS` is built from the dock constants.
  - **Resulting cap on an iPhone 14-class screen:**
    - portrait 390×844 (safe area 47 top / 34 bottom): top 67.5, bottom 28, so the card is at most 748 px tall;
    - landscape 844×390 (safe area 47 left / 47 right / 21 bottom): top 31, bottom 15, so at most 344 px tall and 512 px wide, centred.
  - **Inside the card**, the header, the filter input and the footer are `shrink-0`. The body is `min-h-0 shrink`, so it only takes space the cap leaves over.
  - **Map pick:** hugs. Two sessions give a small card. With 23 sessions the card reaches the cap (748 portrait, 344 landscape) and the body scrolls with fades; the header and subtitle stay.
  - **Filter:** the list is `min-h-0 shrink basis-[252px]`. Portrait has room, so it stays 252 px, as today. In landscape it shrinks to what fits (about 225 px: 344 minus grabber, header and input) and scrolls. Either way its height depends only on the viewport, never on the tiles, so typing still moves nothing (`e2e/helpers/filters.ts:44-70`).
  - **Long ⓘ explanations:** hug up to the cap. In portrait most fit. Long chains with related metrics and landscape scroll in the body under the fixed header.
- **How the dock and BottomSheet behave in landscape today** (the card stays consistent with them):
  - The dock row spans the full width between `max(0.75rem, safe-left/right)` (`Dock.tsx:82`), on the same bottom line.
  - `BottomSheet` is full width with `max(1.5rem, safe-left/right)` content padding (`src/components/ui/BottomSheet.tsx:147`). Its height comes from `computeSheetLayout` (`sheetPosition.ts:25-40`), which subtracts the top gap and the dock footprint, with no orientation branch.
  - The card reuses both lines (top gap, dock line), so in every orientation it covers exactly the range the sheet can occupy.
- **Scrim:** the same `bg-black/40 backdrop-blur-sm` behind every phone overlay, Laps and Color by included. It replaces `backdrop-blur-xl` on phone only; desktop keeps `backdrop-blur-xl`. Tapping the scrim closes the overlay, as today. There is no per-overlay scrim prop.
- **Layout top to bottom:**
  - **Grabber:** `h-5` row with the `BottomSheet` handle (`src/components/ui/BottomSheet.tsx:133`). Tapping it closes the overlay. Dragging it moves the card down with the finger, and only downwards. On release, the card dismisses when it was pulled past 30 % of its height or flicked down faster than 500 px/s; otherwise it springs back. The drag starts on the grabber only, as on the `BottomSheet`, so scrolling the body never drags the card.
  - **Header**, fixed: optional icon (16 px, `text-text-tertiary`), the title as Typography `title`, an optional caption subtitle, and ✕ on the right. The ✕ is a 44 px touch target (ghost `Button`, `size-11 p-0`, 16 px icon), matching the dock and lap-stepper controls (`e2e/mobile/map.spec.ts:422-427`). Padding `pl-5 pr-2 pb-1`; the 44 px row sets the height.
  - **Body:** the only scroller (`min-h-0 shrink overflow-y-auto overscroll-contain px-5 pb-5`). Fade masks (24 px top, 32 px bottom) show only on an edge where more content is hidden.
  - **Footer**, optional, for dialog actions: `grid grid-cols-2 gap-2 px-5 pt-1 pb-5`, buttons `w-full`.
- **Inner padding is 20 px everywhere.** The per-overlay overrides go away: `MapPickPopup.tsx:34-36` and `Dock.tsx:93`.
- **The header replaces the in-content titles on phone:**
  - the caption rows in `src/features/sessions/session/LapsControl.tsx:313-316` and `src/features/sessions/session/ColorByControl.tsx:143-146`;
  - map pick's `CardHeader` (`MapPickPopup.tsx:40-48`).
    On desktop they stay.
- **Filter sheet:** "Filter" header (filter icon). The search input sits fixed under the header, full-bleed with its `border-b`. The list was a fixed `h-[252px]` (`src/features/filters/FilterList.tsx:60`); it now follows the central rule above, with fade masks.
- **Session actions menu on phone** (`src/features/sessions/session/SessionActionsMenu.tsx:27-57`) becomes the floating card via `ResponsivePopover`, titled "Session actions":
  - `h-12` rows with 18 px icons for Manage trip, Edit route in Studio and Export GPX;
  - a divider, then Delete in `text-status-danger`;
  - picking a row closes the card, then runs the action or opens its dialog, as the dropdown does today;
  - desktop stays the `DropdownMenu`.
- **Icons from the mockup:** Laps uses `Flag`, Color by `Layers`, Filter `Funnel`. The other overlays have no icon.
- **New surface role:** a "Scrim" bullet in CLAUDE.md §7. The card itself is still the Floating role.

## Approach

### `src/components/ui/Card.tsx`

- Add `export const scrimClass = 'bg-black/40 backdrop-blur-sm';` next to `floatingClass` (`Card.tsx:9`).

### `src/components/ui/SheetGrabber.tsx` (new)

- Extract the handle `<span className="h-1 w-10 rounded-full bg-white/30" />` from `BottomSheet.tsx:133` as `SheetGrabber`. Use it in `BottomSheet.tsx:133` and in the dialog grabber, which makes two call sites.

### Shared drag: `src/lib/sheetDrag.ts` (new) and `src/lib/hooks/useGrabberDrag.ts` (new)

The `BottomSheet` drag is spread over `BottomSheet.tsx:41-45` (spring, momentum), `BottomSheet.tsx:59-60` (drag controls, tap-vs-drag ref), `BottomSheet.tsx:84-89` (tap ignored after a drag), `BottomSheet.tsx:101-117` (`motion.div` drag props) and `BottomSheet.tsx:125-128` (drag starts from the handle). The card needs the same pieces, so they move to shared code and the `BottomSheet` uses them as well.

- **`src/lib/sheetDrag.ts`** (pure, no React):
  - `SHEET_SPRING` and `SHEET_MOMENTUM`, moved from `BottomSheet.tsx:41` and `BottomSheet.tsx:45`;
  - `shouldDismiss(metrics: { offset; velocity; height }) => boolean`: true when `offset > 0.3 * height` or `velocity > 500`, written with `if`, no ternaries (§2). The thresholds are named constants.
- **`src/lib/hooks/useGrabberDrag.ts`:**
  - returns `{ dragControls, onHandlePointerDown, wasDragged, dragProps }`;
  - wraps `useDragControls`, the tap-vs-drag ref (`BottomSheet.tsx:60`, `BottomSheet.tsx:108-110`, `BottomSheet.tsx:125-128`) and the common `motion` props (`drag="y"`, `dragListener={false}`, `dragControls`, `dragElastic`, `dragTransition={SHEET_MOMENTUM}`, `onDragStart`);
  - each caller still adds its own `dragConstraints` and settle handler.
- **`BottomSheet.tsx`:** switches to `useGrabberDrag` and `SHEET_SPRING`. Its behaviour is unchanged (positions, settle and peek logic stay in `sheetPosition.ts`).

### `src/index.css`

- Add `@utility scroll-fade`: a `mask-image` linear gradient driven by `--fade-top` / `--fade-bottom` (default `0px`). `[data-fade-top]` sets 24 px and `[data-fade-bottom]` sets 32 px.

### `src/lib/scrollFade.ts` (new) and `src/lib/hooks/useScrollFadeEffect.ts` (new)

- `scrollFadeEdges(metrics: { scrollTop; scrollHeight; clientHeight }) => { top: boolean; bottom: boolean }` with 1 px tolerance. It is pure, with no ternaries (§2).
- `useScrollFadeEffect(ref)` listens to `scroll` and to a `ResizeObserver` on the element and its content. Content can grow without scrolling, for example the split slider in Laps, filter tiles or weather loading. It toggles `data-fade-top` / `data-fade-bottom`. It returns nothing, hence the `Effect` suffix (§3).

### `src/lib/sheetPosition.ts`

- Export `SHEET_TOP_GAP_CSS` = `` `max(calc(env(safe-area-inset-top) + ${FULL_TOP_GAP_MIN}px), ${FULL_TOP_GAP_RATIO * 100}dvh)` ``, next to the constants at `sheetPosition.ts:21-22`. `computeSheetLayout` (`sheetPosition.ts:25-40`) is unchanged.

### `src/components/ui/Dialog.tsx`

- **`DialogOverlay` (`Dialog.tsx:7-18`):** `cn(scrimClass, 'lg:bg-transparent lg:backdrop-blur-xl', …)`. The `fade-in` animation stays.
- **`DialogContent` (`Dialog.tsx:20-47`), phone classes:**
  - replace `overflow-y-auto` (line 28), `inset-x-0 bottom-0 w-full max-h-[85dvh] rounded-t-2xl` (line 29) and the `max-lg:p*` safe-area paddings (lines 30-31);
  - with the central sizing rule's classes (see Decisions) plus `flex flex-col overflow-hidden rounded-3xl`;
  - `style={{ '--sheet-bottom': DOCK_ROW_BOTTOM_CSS, '--sheet-top': SHEET_TOP_GAP_CSS }}`;
  - drop the base `p-6` on phone.
- **`DialogContent`, desktop:**
  - keeps `lg:block lg:p-6 lg:overflow-y-auto lg:rounded-xl`;
  - adds `lg:right-auto lg:bottom-auto lg:mx-0` beside the existing `lg:inset-x-auto lg:left-1/2` (lines 33-34) so the phone insets don't leak. `lg:max-w-[min(32rem,…)]` (line 34) and `lg:max-h-[calc(100dvh-25rem)]` already override the phone cap;
  - keeps the slide/zoom animations.
- **`DialogContent`, grabber and drag:**
  - `DialogPrimitive.Content asChild` wraps a `motion.div` with `useGrabberDrag().dragProps`, `dragConstraints={{ top: 0 }}` (downwards only) and `dragElastic={{ top: 0, bottom: 0.08 }}`;
  - drag is enabled only below `lg`, via `useDevice().isDesktop`;
  - the grabber row is a `DialogPrimitive.Close` (`lg:hidden`, `aria-label` = `m.ui_btn_close()`) holding `SheetGrabber`. It handles `onPointerDown={onHandlePointerDown}`, and its `onClick` calls `event.preventDefault()` when `wasDragged()`, so a drag never also counts as a tap (the same rule as `BottomSheet.tsx:84-89`);
  - `onDragEnd(_, info)`: if `shouldDismiss({ offset: info.offset.y, velocity: info.velocity.y, height })`, animate `y` to the card height plus its bottom offset with `SHEET_SPRING`, set `data-dismissed`, then close the dialog by calling `.click()` on the grabber's `Close` ref. This works for controlled and uncontrolled roots alike (`MetricLabel`'s `ResponsivePopover` is uncontrolled, `src/components/ui/MetricLabel.tsx:98`). Otherwise spring `y` back to 0;
  - `data-[dismissed]:animate-none` skips the CSS slide-out, because the card has already left the screen;
  - the CSS enter animation and motion's inline `transform` don't overlap, because drag can only start after the card is open.
- **New `DialogHeader` component** (`title`, `subtitle?`, `icon?: LucideIcon`):
  - renders `DialogTitle`, the caption subtitle and a ghost ✕ `Button` (`size-11 p-0`, 16 px icon) wrapped in `DialogPrimitive.Close` (`lg:hidden`);
  - on phone: `flex shrink-0 items-center justify-between gap-2 pl-5 pr-2 pb-1`;
  - on desktop: no padding and no ✕, so the title looks as today.
- **New `DialogBody` component:**
  - on phone, the scroller with `scroll-fade` and `useScrollFadeEffect`;
  - from `lg`: `lg:contents`, so the desktop layout is unchanged;
  - takes `className`.
- **New `DialogFooter` component:**
  - on phone: `grid shrink-0 grid-cols-2 gap-2 px-5 pt-1 pb-5 [&>*]:w-full`;
  - on desktop: `lg:mt-4 lg:flex lg:justify-end lg:gap-2`;
  - takes `className`.
- **`DialogTitle` (`Dialog.tsx:49-57`):** `text-base font-medium lg:text-lg lg:font-bold`, so the phone header uses the `title` style and desktop is unchanged.
- **`DialogDescription` (`Dialog.tsx:59-67`):** `max-lg:mt-0`. On phone it is the first child of the body.

### `src/components/ui/ResponsivePopover.tsx`

- **New props** (`ResponsivePopover.tsx:9-21`):
  - `subtitle?: string` (map pick);
  - `icon?: LucideIcon` (Laps, Color by, Filter);
  - `bleed?: boolean` (filter: the body drops its padding and its own scroll (`flex flex-col overflow-hidden`), so the child draws full-bleed rows and scrolls its own list).
- **No size prop.** Sizing is central (see Decisions).
- **`footer` is not added.** No overlay that goes through `ResponsivePopover` has actions; the actions menu is a list of rows, and dialogs use `DialogFooter` directly.
- **Phone branch (`ResponsivePopover.tsx:56-64`):**
  - `DialogContent` > `DialogHeader title subtitle icon` > `DialogBody` > children;
  - the `sr-only` title (line 60) and `cn('p-4', props.className)` (line 59) go away;
  - `className` now only reaches the desktop `PopoverContent` (line 48).

### Overlays that change (phone)

- **`src/features/map/MapPickPopup.tsx:23-50`:**
  - pass `subtitle`;
  - drop the `max-lg:*` classes (lines 35-36), including the `50dvh` / `75dvh` heights, keeping `flex flex-col overflow-hidden p-2` and the `lg:` classes for desktop;
  - render `CardHeader` (lines 40-48) only when `device.isDesktop`;
  - the list div (line 49) gets `min-h-0 overflow-y-auto` only on desktop, because on phone `DialogBody` scrolls.
  - This changes all three pick popups: `src/features/sessions/SessionsPickPopup.tsx:25`, `src/features/studio/markers/StudioTrackPickPopup.tsx:52`, `src/features/studio/markers/StudioRoutesPickPopup.tsx:25`.
- **`src/components/layout/Dock.tsx:87-96`:**
  - replace `className` (line 93) with `bleed` and `icon={Funnel}`.
- **`src/features/filters/FilterList.tsx`:** for `sizing === 'content'` (phone only, `Dock.tsx:95`):
  - the root (line 37) gets `min-h-0` so it can shrink inside the card;
  - the input row (line 38) gets `px-5`;
  - the list (lines 53-61) drops `h-[252px]` (line 60) for `min-h-0 shrink basis-[252px]`, and gets `px-5 py-3`, `scroll-fade` and `useScrollFadeEffect(builder.listRef)`;
  - `sizing === 'fill'` (desktop rail, `Dock.tsx:72`) stays as is.
- **`src/features/sessions/session/LapsControl.tsx:297-326`:**
  - pass `icon={Flag}`;
  - the caption row (lines 313-316) becomes desktop-only (`max-lg:hidden`).
- **`src/features/sessions/session/ColorByControl.tsx:115-176`:**
  - pass `icon={Layers}`;
  - the caption row (lines 143-146) becomes `max-lg:hidden`.
- **`src/features/sessions/session/SessionActionsMenu.tsx:18-73`:**
  - branch on `useDevice().isDesktop`: desktop keeps the `DropdownMenu` (lines 27-58) unchanged;
  - on phone, `ResponsivePopover` uses the same ghost ⋮ trigger (lines 29-31), `title={m.ui_session_actions()}` and controlled `open`;
  - the body is a `role="menu"` list of `role="menuitem"` buttons (`flex h-12 items-center gap-3 rounded-lg px-3 text-sm hover:bg-white/10`, 18 px icons), with Delete after a `h-px bg-white/10` divider;
  - keep the same `disabled` rules (lines 34, 40, 48);
  - the rows are local to this file; extract them to `src/components/ui/` only when a second menu needs them (§2);
  - `role="menuitem"` keeps the existing selectors working on both branches (`e2e/sessions.spec.ts:200-201`, `e2e/records.spec.ts:30-31`).
- **`src/components/ui/MetricLabel.tsx:98-118`:**
  - drop `className="space-y-3"` (line 101) and wrap the explanation bodies (lines 114-117) in `<div className="space-y-3">`, so spacing works in both branches.
- **Standalone dialogs:** title → `DialogHeader`, description and content → `DialogBody`, button row → `DialogFooter`. `DialogContent` stays.
  - `src/features/sessions/session/DeleteSessionDialog.tsx:39-71` (row at line 47)
  - `src/features/trips/DeleteTripDialog.tsx:20-38` (row at line 23)
  - `src/features/studio/DeleteStudioRouteDialog.tsx:28-39` (row at line 31)
  - `src/features/studio/StudioRouteFormDialog.tsx:44-68` (row at line 60)
  - `src/features/settings/DeleteAllDataDialog.tsx:61-103`: row at line 84 (`gap-3 pt-4`, so desktop moves to `mt-4 gap-2`)
  - `src/features/settings/PaceEstimatorDialog.tsx:62-104`: the row at line 95 sits inside the body column with `mt-2`; it moves out into `DialogFooter`
  - `src/features/trips/ManageTripDialog.tsx:36-65`: drop `flex flex-col overflow-y-hidden` (line 36) on phone. The inner scroller (line 40) becomes `lg:min-h-0 lg:flex-1 lg:overflow-y-auto`, because on phone `DialogBody` is the single scroller. Row at line 57.
  - `src/features/trips/TripFormDialog.tsx:84-152`: same treatment for the inner scroller (line 105). Row at line 144.
  - `src/features/studio/markers/StudioMarkerDialog.tsx:146-220`: the footer (lines 200-219) has Delete + Cancel + Save. On phone it becomes three columns for this dialog only: `DialogFooter className="max-lg:grid-cols-3"`, with Delete | Cancel | Save in one row. Without Delete (new marker, `isEdit` false at line 201), it falls back to the default two columns. Desktop keeps `justify-between` (Delete left, Cancel/Save right) through `lg:justify-between`.

### `CLAUDE.md` §7

- After the Tile bullet (`CLAUDE.md:107`), add: "**Scrim** (behind a modal overlay on phone): `scrimClass`." Also add a line: "On phone, modal overlays are an inset floating card built from `DialogContent` + `DialogHeader`/`DialogBody`/`DialogFooter`; never hand-build a sheet."

## Removal

- `sr-only` `DialogTitle` and `cn('p-4', props.className)` in `ResponsivePopover.tsx:59-60`.
- The `max-lg:` padding and safe-area classes in `Dialog.tsx:30-31`, `MapPickPopup.tsx:35-36` and `Dock.tsx:93`.
- The inline handle span in `BottomSheet.tsx:133`, replaced by `SheetGrabber`.

## Tests

- **Unit** `tests/lib/sheetDrag.spec.ts`: `shouldDismiss` for a short slow pull (springs back), a pull past 30 % of the height (dismisses), a short fast flick (dismisses), and an upward flick (springs back).
- **Unit** `tests/lib/scrollFade.spec.ts`: `scrollFadeEdges` at the top (bottom only), in the middle (both), at the end (top only), with no overflow (none), and at 1 px off the end (none). It branches and does arithmetic, so it qualifies under `tests/CLAUDE.md`.
- **E2E**, extending `e2e/mobile/map.spec.ts:269-291` ("tapping a track … opens the session picker"):
  - the picker box has `x ≈ 8`, `x + width ≈ 382`, and its bottom is ≤ `844 - 12`;
  - the ✕ (`getByRole('button', { name: /close/i })` inside the dialog) is at least 44×44 and closes it;
  - reopen the picker, drag the grabber 40 px down and release slowly: the picker stays open and returns to its box;
  - drag it 60 % of the card height down: the picker is hidden.
    Drag with `page.mouse` down/move/up on the grabber. Generalise the `dragHandle` helper (`e2e/mobile/map.spec.ts:44-54`) to take a locator rather than copying it. This replaces nothing; it is one journey.
- **E2E landscape**, same test or a `test.describe` with `viewport: { width: 844, height: 390 }` in `e2e/mobile/map.spec.ts`: the picker is ≤ 512 px wide, centred, and its top is ≥ the sheet top gap (31 px). Playwright cannot emulate `env(safe-area-inset-*)` reliably, so this checks the rule without insets.
- **Existing specs to re-run and adjust if they break:**
  - `e2e/mobile/map.spec.ts:196-238`: uses `getByRole('dialog', { name: 'Filter' })`, so the accessible name must stay "Filter" (now a visible `DialogTitle`). It closes via Escape and via a tap at `(195, 20)`, which now lands on the scrim and should still close. The dock box must stay unchanged (line 217); the card overlaps the dock but doesn't move it.
  - `e2e/mobile/map.spec.ts:240-246` → `e2e/helpers/filters.ts:44-70` (`expectFilterInputStaysPut`): input and list boxes must stay put while typing, so the fade attributes must not change layout.
  - `e2e/mobile/map.spec.ts:269-291`: the picker text "Sessions recorded near this location" moves into the header subtitle and is still inside the dialog. The close tap at `(track.x, 40)` hits the scrim.
  - `e2e/sessions.spec.ts:47-73`: 390×844 without touch, so it takes the phone path. It uses `laps-pill`, `getByRole('radio', { name: /^off/i })` and Escape. Line 66 expects no dialog after the inline toggle.
  - `e2e/sessions.spec.ts:162-187`: watches `[role="radiogroup"]` disconnecting. This runs on desktop, so it is unaffected; re-run anyway.
  - `e2e/mobile/map.spec.ts:78-157` (BottomSheet open, tap, drag, settle, peek): these guard the move to `useGrabberDrag` and must pass unchanged.
  - `e2e/map.spec.ts:69-88`: desktop picker via `[data-radix-popper-content-wrapper]`. Must be unchanged; this is the desktop guard.

## Verification

```bash
vp check
vp test -- --run
vp exec playwright test
vp build
```

By hand:

- **Phone 390×844** (DevTools, touch, iPhone safe area). Check each of:
  - session actions menu: the card with `h-12` rows and Delete set apart;
  - Delete session dialog, with its footer in two columns;
  - Laps with the split slider expanded, which grows the body and should bring in the bottom fade;
  - Color by;
  - map pick with many sessions: the body scrolls, the header stays, fades appear only where content is hidden;
  - a long ⓘ explanation (a stat with `relatedMetricIds`, `src/features/sessions/session/MoreStatsRow.tsx:162`);
  - the filter sheet: typing moves nothing;
  - Manage trip and Trip form, each with a single scroller.

  For each one: 8 px side gap, all four edges visible, card bottom on the dock line above the home indicator, scrim, grabber and a 44 px ✕ that closes. Also: a swipe down on the grabber dismisses, a short pull springs back, and scrolling the body never moves the card. StudioMarkerDialog in edit mode shows Delete | Cancel | Save in one row.

- **Phone landscape 844×390:** map pick with many sessions, the filter while typing, a long ⓘ explanation and the Delete dialog. Check that the card is 512 px wide and centred, its top never above the sheet's full position, and the body scrolls while the header and footer stay.
- **Safe areas and standalone.** Chrome DevTools can't emulate `env(safe-area-inset-*)`, and the rule doesn't read `display-mode`. Check these on the iOS Simulator (or a device) with the PWA installed to the home screen, which runs `display: standalone` from `vite.config.ts:129` with `viewport-fit=cover` from `index.html:8`:
  - portrait with the notch and home indicator;
  - landscape with the notch on the left and on the right: the card clears the notch side, with its bottom on the dock line.
- **Desktop ≥1024:** popovers (Laps, Color by, map pick at the click point, ⓘ) and the centred dialogs look exactly as before. That means the blur overlay, no ✕ or grabber, and the same titles and button rows (apart from the 4 px footer deltas noted under Standalone dialogs).

## Known limitations

- **iOS keyboard:** `dvh` doesn't shrink when the on-screen keyboard opens, so in landscape (and with a long list in portrait) the keyboard can cover the lower part of the filter card. Accepted: iOS scrolls the focused input into view, and the input sits at the top of the card. There is no `visualViewport` handling.

## Open questions

None. Every question is settled.
