# Filter list: compact rows, command-palette header, accent zoom row, 15 newest filters

Follows `plans/saved-filters.md` and `plans/user-feedback-fixes.md`. Mockup: `mockups/filter-density/index.html` (agreed).

## Context

- Rows and input are 62 px (`src/components/ui/ActionTile.tsx:43-61`, `src/components/ui/Input.tsx:15`); users find them too big.
- The list scrolls inside the panel padding, so rows are cut at an inner line under the input (`src/features/filters/FilterList.tsx:96`).
- The zoom row looks like any selected filter (`FilterList.tsx:148`, `zoomTile` in `src/lib/savedFilters.ts:233-253`), although it comes from the chart, not from the list.
- Rows have a ⋮ menu with Bearbeiten/Löschen and a long press (`src/features/filters/FilterRow.tsx:7-28`, `:52`, `src/lib/hooks/useLongPress.ts`); the store has `saveBuilderFilter(criteria, editingId)` and `deleteSavedFilter` (`src/store/filters.ts:120-140`). New filters are appended at the end (`:133`).
- Variants compared in the mockup: row density (62/48/40 px, menu list), scroll behaviour (plain, divider, fade, half-row peek, sticky input), header patterns (command palette, iOS search, field + line), zoom emphasis (white row, accent row, chip, banner). Chosen: compact cards, command-palette header, accent zoom row.

## Decisions (settled)

### Layout

- **Compact cards:** filter rows and suggestion tiles 48 px high, two lines (title `subtitle1`, description `caption`), radius 10 px, 6 px gap, icon 18 px.
- **Header like a command palette:** borderless input with a leading search icon, 12 px on all sides, a **permanent** full-width line under it. No visible label (`aria-label` stays).
- **Scrolling:** the list scrolls below the line; its 12 px padding sits inside the scroll area, so rows run to the panel's outer edge at the bottom. The dock does not grow.

### Zoom row

- **Accent row** at the top of the list while a chart zoom is active: blue tint (accent at ~16 %, accent border), icon `ZoomOut` (same as the chart's reset pill, `src/components/ui/ChartsCard.tsx:27`).
- Two lines: **title = day and month** of the range (e.g. "27. Sep. – 7. Okt.", "28. Dez. – 14. Feb."), **description = year(s) + the other criteria** (e.g. "2026 · Laufen", "2025–2026 · Laufen · ca. 10 km"), via Intl with `getLocale()`. The title never wraps; the description gets "…" if needed.
- **Click unselects** (clears the zoom), like an active filter row; no ×.
- **Placeholder** when no zoom is active, **desktop (mouse) only and only while the dashboard is open** (the only page with zoomable charts): dashed accent row, not clickable, "Genauer hinsehen?" / "Zieh über ein paar Tage" (EN "Take a closer look?" / "Drag across a few days"). On the phone there is never a zoom row (charts don't zoom by touch).
- Hidden while typing (suggestions replace the list).

### List behaviour

- The list holds the **15 newest filters, newest at the top**, ordered by creation. A 16th filter deletes the oldest.
- Using a filter does not move it. Picking a suggestion that already exists selects that row (no duplicate, no move).
- The three defaults are seeded once on first start and then behave like any other filter (they drop off after 15 newer ones).
- **No editing, no deleting:** the ⋮ menu, long press, Bearbeiten and Löschen are removed. A row only toggles on click.
- Store: persisted shape unchanged apart from order/cap; migration keeps the 15 newest (current array order = creation order, newest last → reverse and cap).

## Removal

- `FilterRow`'s menu, `useLongPress.ts` (only used there), `deleteSavedFilter`, the `editingId` path in `saveBuilderFilter` and `FilterList` (`:28`, `:89-91`, `:105`), messages for edit/delete/actions and the edit label (`ui_filter_edit`, `ui_filter_actions`, `ui_filter_builder_label_edit`, delete texts), the reserved menu slot in `ActionTile`, the `row` size in `Input` if unused afterwards, the zoom-row texts that become unused.

## Tests

- Store: a new filter goes to the top; the 16th drops the oldest; an existing filter is selected, not moved or duplicated; migration v4 → v5 keeps the 15 newest, newest first.
- Lib: zoom row title/description (same year, across years).
- E2E: update `e2e/filters.spec.ts` (no edit/delete; new filter appears at the top; zoom row toggles; placeholder on desktop only).

## Verification

`vp check`, `vp test -- --run`, `vp exec playwright test`, `vp build`; by hand on desktop and 390 px: row and header sizes match the mockup, list scrolls to the panel edge, dock height unchanged, zoom row and placeholder, no layout shift.
