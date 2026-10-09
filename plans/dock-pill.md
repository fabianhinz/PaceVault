# Dock: floating pill on the phone, icon rail on desktop, filter field

Mockup: `mockups/dock/index.html` (variant B4c, rail "icons only", active state "slide").

## Context

- Today the dock is a vertical glass card on the left (desktop, `src/components/layout/Dock.tsx:131`) with 4 tabs (`:30-35`) plus Filter and Orten, and a full-width bottom bar on the phone with a ⋮ that opens Filter/Orten, and Filter opening the list as a second reveal layer (`src/components/layout/DockRevealPanel.tsx:16`).
- Labels use an ad-hoc `text-[10px]` (`Dock.tsx:163`, `:178`, `:199`, `:226`, `:239`). The active tab is marked only by brighter text (the old sliding indicator was removed as buggy).
- Variants compared: refined current, floating pill, top bar, filter as primary field, Orten on the map, nav in the content column; then four pill sub-variants and three desktop alignments. Chosen: the floating pill where the pill turns into the filter field (B4), with the desktop list flush with the rail (B4c).

## Decisions (settled)

### Phone

- A **floating row** inset 12 px from the sides, above the bottom edge: **Orten** circle · **tab pill** (4 icon-only tabs) · **Filter** circle. The sheet runs underneath.
- **Tapping Filter** cross-fades the tab pill and the Filter circle into **one search field in the same box** (the row doesn't grow); Orten stays. The filter list appears as a **floating card above the row** (12 px inset, 24 px radius) showing only the rows — the field is their input.
- The card sizes to its content, **at most 4.5 rows** (254 px); while typing it shrinks to the suggestions.
- **Typing:** the row rides on top of the soft keyboard (`visualViewport`), the card above it. Verify on an iPhone.
- No ⋮ anymore; no second reveal layer.

### Desktop

- **Icon rail** without labels and **without tooltips** (icons carry an `aria-label`), 12 px from the window edge, two segments: the 4 tabs, then Filter and Orten (rail 50 × 284 px, round 40 px items, 24 px radius).
- The **filter list card** opens 12 px to the right of the rail (`--spacing-3`, same as the rail's distance to the edge), **flush with the rail's top and bottom** (284 px), and grows out of the rail's edge. Its content is the agreed list (borderless input + permanent line, 48 px rows, accent zoom row, dashboard placeholder, 15 newest filters).

### Both

- **Active tab: a sliding highlight** (muted accent) that moves between tabs in 250 ms. Its position is computed from the fixed item sizes, never measured from the DOM, so it cannot drift (the reason the old indicator was buggy).
- **Filter button closed state:** badge dot while a filter is active; the whole circle in accent while a chart zoom is active.
- **Orten** keeps its three states (off, tracking, error) and badge.
- Labels in the dock, where any remain, use Typography `caption` instead of `text-[10px]`.
- Escape: first clears typed text, then closes the list. Opening the list never changes the dock's size; nothing shifts on hover, Orten or filter changes.

## Approach

- `src/components/layout/Dock.tsx`: rebuild as the phone row (pill + two circles) and the desktop rail; remove the ⋮ menu path, `revealStack` layers beyond the list, `dockItemMiniClass`/`dockItemMaxiClass`/`revealItemClass` (`:44-51`).
- Sliding highlight: a small shared component in `src/components/ui/` that positions from index × fixed item size (desktop vertical, phone horizontal in % of the pill).
- Filter field on the phone: `src/features/filters/FilterList.tsx` gets the option to use an input outside itself (the pill field) and to size to content with a 4.5-row cap; desktop replaces `h-[358px]` (`FilterList.tsx:86`) by rail height.
- `DockRevealPanel.tsx` is replaced by the floating card (phone) / side card (desktop) or removed if unused.
- Sheet bottom space: `DOCK_HEIGHT = 57` (`src/lib/sheetPosition.ts:21`) becomes the floating row's footprint (about 88 px incl. inset); check the peek position.
- Keyboard: a hook on `visualViewport` that lifts the phone row while the field is focused.
- Captions inside `Button`: pin to `font-normal` like `src/components/ui/StatItem.tsx:28`, since `Button` sets `font-medium` (`src/components/ui/Button.tsx:46`).

## Removal

- ⋮ menu, its messages (`ui_dock_more_actions`, `ui_dock_close_menu`) if unused, the dock label spans, `DockRevealPanel` if unused, any CSS only the old dock used.

## Open

- Keyboard behaviour on a real iPhone.

## Tests

- Lib/unit: the highlight position for each index (desktop and phone) if it is computed in a pure helper.
- E2E: update dock-related specs (`e2e/filters.spec.ts`, `e2e/mobile/*`, navigation): switching tabs, opening the list via the Filter button (desktop) and the field (phone), Escape order.

## Verification

`vp check`, `vp test -- --run`, `vp exec playwright test`, `vp build`; by hand on desktop and 390 px: no layout shift on tab switch, hover, Orten and filter states; the highlight sits exactly on the active tab after navigation and reload; card flush with the rail; phone card height cap; sheet peek above the floating row; iPhone keyboard.
