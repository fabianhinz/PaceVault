# Mobile sheet: drag from the content, not only the handle

## Context
Users report that the sheet only reacts to the 24 px handle (`src/lib/sheetPosition.ts:17`). `dragListener={false}` (`src/components/ui/BottomSheet.tsx:94`) limits dragging to the handle's `onPointerDown` (`BottomSheet.tsx:115-118`). In summary mode the peek strip (`BottomSheet.tsx:154-166`) looks like part of the sheet but ignores drags, and in the bigger positions the whole content area does too. Free positioning (no snap points) stays as it is: it is a feature.

## Rules (settled)
- **Summary mode** = `position === 0 && peek.active`. The whole sheet drags, with mouse and touch. A tap without a drag behaves like a handle tap (`sheetTapTarget`, jumps to full).
- **Every other state** (position > 0, or position 0 without a peek, i.e. not-found / loading / error fallbacks) is **scroll-aware in both directions**, touch only:
  - swipe up while the sheet is not full → the sheet grows
  - swipe up while the sheet is full → the content scrolls
  - swipe down while the content is at `scrollTop` 0 → the sheet shrinks
  - swipe down while the content is scrolled → the content scrolls
  - a mostly horizontal swipe → native behaviour (charts, horizontal scrollers)
- The handle keeps working exactly as today.

## Approach
1. **Gesture decision** (`src/lib/sheetGesture.ts`, new): `resolveContentGesture({ dx, dy, position, scrollTop })` returns `'sheet' | 'scroll'` following the rules above. Pure, no ternaries.
2. **Summary mode** in `BottomSheet.tsx`:
   - the content container (`BottomSheet.tsx:125`) gets `onPointerDown` → `draggedRef.current = false; dragControls.start(event)` and `onClick` → `handleTap`, both only in summary mode
   - in summary mode the container and the scroller get `touch-none`, so the invisible scroller underneath doesn't pan
3. **Scroll-aware drag** (`src/lib/hooks/useSheetContentDragEffect.ts`, new), attached to the sheet scroller from `SheetScrollContext`:
   - `pointerdown` (touch only, not in summary mode): remember the event and reset the decision
   - first `touchmove` (non-passive listener): call `resolveContentGesture` with the current position from `offsetToPosition(layout, y.get())` and the scroller's `scrollTop`
   - `'sheet'` → `preventDefault()` on this and every following `touchmove` of the gesture, and `dragControls.start(rememberedPointerDown)`. The drag starts at the touch origin, so the sheet follows the finger without a jump.
   - `'scroll'` → leave the gesture to the browser
   - Release goes through the existing `onDragTransitionEnd` → `handleDragSettled`, so momentum, the peek fade settle and persisting stay unchanged.
4. **Limitation (accepted unless you say otherwise):** no handoff inside one gesture. A swipe up that reaches full stops there; scrolling needs a new swipe. Apple Maps hands over mid-gesture, but that would mean driving `scrollTop` by hand after the browser has been blocked.

## Tests
- `tests/lib/sheetGesture.spec.ts`: one case per rule (up below full, up at full, down at top, down while scrolled, horizontal).
- `e2e/mobile/map.spec.ts`, extend the existing describe:
  - dragging the peek strip with `page.mouse` moves the sheet up from 0
  - tapping the peek strip jumps to full
  - a touch swipe up on the content at 0.5 grows the sheet (CDP `Input.dispatchTouchEvent`, the mobile project has `hasTouch`)

## Verification
```
vp check
vp test -- --run
vp exec playwright test
vp build
```
Then manually on an iOS PWA and Android Chrome: content swipes at 0.5, at full while scrolled and unscrolled, horizontal chart swipes, and summary drag and tap on every page with a peek.
