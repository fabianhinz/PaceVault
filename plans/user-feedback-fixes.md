# User feedback: zoom row, inline filter input, volume for all time, GAP chart, rail shift, iOS pills

Follows `plans/saved-filters.md`, `plans/dashboard-volume.md` and `plans/gradient-gap-vam.md` after user tests.

## Context

- A dashboard chart zoom sets a time range on the active filter (`setDashboardChartRange`, `src/store/filters.ts`), but the filter list shows nothing for it; only the dock dot and the "Zoom zurücksetzen" pill.
- The builder is a separate dialog behind "+ Neuer Filter" and ⌘K (`src/features/filters/FilterBuilderDialog.tsx`); users find the nesting unnecessary.
- The Volume row is hidden without an active filter (all time), so distance, duration and elevation over time are not visible at all.
- The GAP row draws pace and GAP (`src/features/sessions/charts/GradeAdjustedPaceChart.tsx:74-91`, pace line since the MVP); pace already has its own row.
- The GAP rail shifts on the first hover: at rest it shows "Ø" + value, while hovering it shows time + value + "Ø 7:57", adding a line.
- iOS: the session map pill row does not scroll horizontally; its scroll container is `pointer-events-none` (`src/features/sessions/session/SessionMapControls.tsx:66`), which WebKit doesn't scroll. Android and devtools emulation work.

## Decisions (settled)

### Zoom row

- While a chart zoom is active, a **temporary row at the top** of the filter list shows it: title is the zoomed range (Intl, e.g. "3. Mär – 15. Apr"), description "Zoom" plus the other active criteria (e.g. "Zoom · Laufen"). It looks selected.
- Clicking it clears the zoom (same as the reset pill). It disappears once cleared and is never saved; no ⋮ menu.

### Inline filter input

- The builder dialog goes away. The **input sits at the top of the filter list** (`Label` + `Input`, same placeholder); tiles for what was typed (up to 3, same grammar and rules) appear **directly below the input**, above the saved filters, in a reserved slot (no layout shift).
- Selecting a tile applies, saves and closes the list as before. The "+ Neuer Filter" row is removed.
- **⌘K / Ctrl+K is dropped.**
- **Bearbeiten** fills the input with the filter's text; the selected tile replaces that filter in place.
- Phone: the same list in the dock reveal behind ⋮.

### Volume for all time

- Without an active time range, the Volume row shows the **cumulative total over the whole history** (first to last session), without the dashed comparison line.
- With a comparison, the legend's "Davor" entry carries the comparison range (e.g. "Davor · 3.–9. Okt 2025", Intl).
- One fixed subtitle for all cases: "Aufsummiert über den Zeitraum" / "Added up over the range"; the comparison-only subtitles (`ui_volume_subtitle_one/other/last_year`) are removed.

### GAP chart

- The GAP row shows **only GAP**; the pace line is removed.

### Rail layout shift

- Fix the GAP rail so nothing moves between rest and hover (reserve the secondary line); check every session and dashboard rail for the same shift.

### iOS pill scrolling

- Bug fix: the pill row scrolls on iOS while the map stays usable around it (container takes touches, only as tall as the pill row). Verify on an iPhone.

## Open

- Phone soft keyboard with the inline input (device check).

## Removal

- `FilterBuilderDialog.tsx`, `useFilterBuilderShortcutEffect.ts`, the "+ Neuer Filter" row and its messages, the GAP chart's pace line.

## Tests

- Regression: "volume row shows the whole history when no time filter is active".
- Store/lib: the zoom row's description from the active criteria (if it carries logic).
- E2E: update `e2e/filters.spec.ts` (inline input instead of dialog and ⌘K; zoom row appears and clears).

## Verification

`vp check`, `vp test -- --run`, `vp exec playwright test`, `vp build`; by hand on desktop and 390 px: zoom row, inline input, edit, no layout shift in list and rails; on an iPhone: pill row scrolls.

## Round 2 (after review)

- **Typing in the filter input:** the saved filters (and the zoom row) disappear while there is text; up to 3 suggestion tiles appear in their place with a dashed outline (no fill, muted icon). Picking one resets the input, makes the new filter active and shows the saved list again, with the new filter in it.
- **The list stays open** after picking a suggestion, a saved filter or the zoom row; it closes only via the dock item, Escape or a click outside.
- **Zoom row title always shows the year**, short Intl format (e.g. "27. Sep. – 7. Okt. 2026").
- Volume rail keeps "Dieser Zeitraum" without a comparison.
- Chart transition animations stay.
- **Filter input:** no visible label (accessible name via `aria-label`), same height as the filter rows below.

### Bugs from review

- **Dock grows:** opening the filter list makes the dock taller (since the inline input; `DockRevealPanel` went to `max-h-[28rem]`). The dock keeps its height; the list scrolls inside it.
- **Volume metric switch shifts the layout:** switching to Höhenmeter adds the coverage note ("Zeitraum: aus 231 von 439 Einheiten") below the chart, and the y-axis labels get cut ("00.000" instead of "100.000"). Reserve the note's line; size the y-axis for the widest label.
- **Gaps in the cumulative line:** on Höhenmeter the line is missing at the start and breaks between days. Once a value was recorded, the cumulative total carries forward over days without a recorded value; before the first recorded value the line stays empty (missing, not 0).
- **iOS: hover line not in sync** across Load, Volume and Performance on touch, while the session charts sync. Use the same shared hover mechanism as the session charts.
