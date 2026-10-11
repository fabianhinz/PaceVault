# Mobile map: sheet handle, lap fit, lap controls

## Context

Three settled fixes that all feed the map padding (`src/features/map/mapPadding.ts`), so they ship together.

- **P2 handle:** the sheet's drag area is the 24 px handle button (`src/lib/sheetPosition.ts:18`, rendered `src/components/ui/BottomSheet.tsx:119-133`). Too small to grab.
- **M2 lap zoom:** reproduced on the mobile project (evidence: scratchpad `m2-lap-zoom/` — `log.txt`, `lap.spec.ts`, `small.spec.ts`, `shots/`). The lap fit box on phones is ≈ 0.54·h − 291 − safeTop px: 844 → 165, 664 (iPhone Safari) → 69, 548 → 5, 520 → negative, and maplibre skips the fit ("Map cannot fit within canvas…"). Causes:
  - fixed 80 px margin on every side plus sheet plus 50 px controls inset (`mapPadding.ts:42-53`, `:60-67`), used by `useLapCameraEffect.ts:45`;
  - the fit ignores a raised sheet: `sheetFitHeight` caps the position at 0.5 (`sheetPosition.ts:79-80`).
- **M3 missed taps:** prev/next/X are `size-7` (28 px) `StepButton`s (`LapsControl.tsx:197-213`); X sits 5 px from next behind a separator (`:259-266`); the row is 38 px (`mapPadding.ts:15`, `SessionMapControls.tsx:38`); selecting a lap snaps `scrollLeft = scrollWidth` (`SessionMapControls.tsx:29-33`), so the X slides under the finger.
- `mapPadding` callers: lap fit (`useLapCameraEffect.ts:45`), session/override fit (`useMapCameraEffect.ts:28,47`, margin 80), overview (`:68`, margin 50), geolocation (`useGeolocationCameraEffect.ts:24`, margin 0).

## Decisions (settled)

- **Handle (variant C):** `HANDLE_HEIGHT` 24 → 48. The grip stays the same 40×4 bar centred in the taller button. No content dragging, no header redesign.
  - The peek row keeps its 66 px: `PEEK_HEIGHT` becomes `HANDLE_HEIGHT + 66` (114). At 42 px the two-line `SheetPeek` list item (icon tile + title + subtitle) would clip. Side effect: `peekOffset` −24 px, so the sheet at the middle position sits 12 px higher. The min-box clamp below covers it.
  - Every non-peek position shows 24 px less content. The session ⋮ menu (`SessionActionsMenu.tsx`) sits in the content right below the handle. They share an edge but do not overlap (the handle is a sibling above the scroller). Check it by hand at 390×664.
- **Fit fix 1 (phones):** the margin is capped at 24 px (`PHONE_FIT_MARGIN`). The bottom padding is clamped so the fit box keeps at least 120 px (`MIN_FIT_BOX`) of canvas height. The clamp lives in `mapPadding`, so it applies to **every** phone fit: lap, session open/override (`useMapCameraEffect.ts`) and overview. The session fit has the same failure at 520–548 px, so it is in scope. Geolocation (margin 0) is unchanged apart from the clamp. Desktop keeps its 80 px margin. The min-box clamp also runs there but never triggers at desktop heights.
- **Fit fix 2:** the lap fit uses the real sheet position, capped at 0.85 (`LAP_SHEET_CAP`), with the same 120 px minimum. Session/overview fits keep the 0.5 cap.
- **Interaction:** handle +24 (via `peekOffset`) and controls +6 (`MAP_CONTROLS_HEIGHT` 44) both enter `covered`. The clamp runs after everything is summed, so the 120 px floor holds whatever these constants are. Worked numbers (no safe areas, middle position): 664 → ~162 px box (was 69); 520 → ~84 px before the clamp → clamped to 120.
- **Lap controls (mockup variant B), desktop and mobile:**
  - The row is 44 px (`MAP_CONTROLS_HEIGHT` 38 → 44) and every target is 44×44.
  - Stepper pill `h-11`: flag, prev 44×44, name (72 px), next 44×44; separator removed.
  - X is its own round 44×44 floating button, 12 px after the stepper (row `gap-2` + `ml-1`), `text-text-secondary`.
  - While a lap is selected, Color-by collapses to a 44×44 round icon button (Layers icon only). It needs an accessible label, e.g. "Color by: HR zones", via a new message `ui_color_by_compact_label` with `{mode}`, in `en.json` and `de.json`.
  - The no-lap pills (Color-by, Laps) also get `h-11`.
  - The scroll jump is removed. The scroller stays, because the no-lap row can still overflow 390 px by ~25 px.
  - All surfaces use `FloatingPill` / `floatingPillClass` (→ `floatingClass`, §7).
- Out of scope: re-tap toggle, sticky touch hover (fix 3 declined), refitting when the sheet moves after a lap fit, and the `useIsDesktop` → `useDevice()` rename (a later `mobile-touch` plan does it; keep `useIsDesktop` / `DESKTOP_MEDIA_QUERY` here).

## Approach

**Sheet (P2)**

- `src/lib/sheetPosition.ts:17-18`: `HANDLE_HEIGHT = 48`, `PEEK_CONTENT_HEIGHT = 66`, `PEEK_HEIGHT = HANDLE_HEIGHT + PEEK_CONTENT_HEIGHT`; `:37` → `peekContentHeight: PEEK_CONTENT_HEIGHT`.
- `BottomSheet.tsx` needs no change (it reads `layout.handleHeight` / `peekContentHeight`).
- `sheetFitHeight(layout, position, cap = MIDDLE_POSITION)` (`sheetPosition.ts:79-80`): the cap becomes a parameter.

**Fit padding (M2)**

- New pure `src/features/map/fitPadding.ts`. It takes `{ canvasHeight, insets: MapPadding, margin }` and returns the `MapPadding` with bottom clamped to `max(0, canvasHeight − top − MIN_FIT_BOX)`. It holds `MIN_FIT_BOX = 120` and `PHONE_FIT_MARGIN = 24`. No DOM or store access, and no ternaries.
- `mapPadding.ts`:
  - `mapPadding(margin, options?: { sheetCap?: number })`.
  - `phoneInsets(sheetCap)` passes the cap to `sheetFitHeight`.
  - On phones the margin becomes `Math.min(margin, PHONE_FIT_MARGIN)`.
  - The result goes through `fitPadding` with `window.innerHeight`.
  - `MAP_CONTROLS_HEIGHT = 44` (`:15`).
- `useLapCameraEffect.ts:45`: `mapPadding(MAP_FIT_MARGIN, { sheetCap: LAP_SHEET_CAP })`, with `LAP_SHEET_CAP = 0.85` local to the hook.
- `useMapCameraEffect.ts` / `useGeolocationCameraEffect.ts`: no call-site change. They pick up fix 1 through `mapPadding`.

**Lap controls (M3)**

- `src/features/sessions/session/SessionMapControls.tsx`: delete the `scroller` ref, the effect at `:29-33` and the `hasSelectedLap` selector at `:22`, plus the now-unused `useRef` / `useEffect` imports if nothing else uses them. Row height comes from the new `MAP_CONTROLS_HEIGHT`.
- `LapsControl.tsx`:
  - `StepButton` (`:192-213`) becomes `size-11 -my-px` (covers the pill's 1 px border → 44×44 box), keeping the hover circle.
  - `LapStepper` (`:215-268`) returns the stepper group (`h-11 gap-0 pl-3 pr-0`, no separator) plus a sibling X: `FloatingPill` `size-11 justify-center p-0 ml-1 text-text-secondary`, `aria-label={m.ui_lap_clear()}`, `data-testid="lap-stepper-clear"`.
  - The Laps `FloatingPill` (`:303`) gets `h-11`.
- `ColorByControl.tsx`: subscribe to `useMapFocusStore((s) => s.selectedLapIndex !== null)` directly (colocation rule). When true, the trigger is `FloatingPill` `size-11 justify-center p-0` with only `<Layers size={16} />` and `aria-label={m.ui_color_by_compact_label({ mode: PILL_LABEL[effective]() })}`. Otherwise the full pill gets `h-11`.
- `FloatingPill.tsx`: unchanged. Height goes in via `className`, because `ChartsCard` zoom-reset also uses it.
- `messages/en.json`, `messages/de.json`: add `ui_color_by_compact_label` ("Color by: {mode}" / "Färben nach: {mode}"). Run `vp build` before `vp check` so Paraglide regenerates.

## Tests

- `tests/features/map/fitPadding.spec.ts` (new):
  - regression "lap fit keeps a visible box on short phones": at 520 and 548 the box is exactly 120;
  - at 664 the unclamped box (>120) is untouched;
  - bottom never goes negative when `canvasHeight < top + 120`.
- `tests/lib/sheetPosition.spec.ts`:
  - update `:50-54` → "caps the fit at the given sheet position": default cap 0.5 is unchanged, and with cap 0.85 a position of 1 fits like 0.85 and is higher than 0.5;
  - peek content stays 66 px with the taller handle.
- `e2e/mobile/map.spec.ts`: extend with a session test at 390×664 (`test.use({ viewport })` in a describe), reusing the fit-capture idea from scratchpad `small.spec.ts`:
  - tap a lap band on the chart, wait for the camera to settle;
  - the projected lap bounds lie inside the visible box (below the top inset, above the controls row);
  - prev/next/X bounding boxes are ≥ 44×44;
  - the scroller's `scrollLeft` is unchanged after selecting the lap (no jump).
- `e2e/sessions.spec.ts:152,160`: `lap-stepper-clear` is no longer inside `lap-stepper`, so query it from `page`. After the lap is selected, `color-by-pill` has the accessible name /color by/i.

## Verification

`vp build`, `vp check`, `vp test -- --run`, `vp exec playwright test`.

Check by hand on a phone (or 390×664 devtools):

- the handle is easy to grab and the ⋮ menu is still tappable right below it;
- the peek summary is not clipped;
- a lap tap zooms into the lap at the middle and raised sheet positions;
- the lap row fits without scrolling, and X never moves under the finger;
- desktop lap row looks right at 44 px.
