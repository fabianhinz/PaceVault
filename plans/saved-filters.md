# Filters: saved filter list in the dock, builder dialog

Mockup: `mockups/saved-filters/index.html` (final). Earlier explorations (panels, command bar with list/tokens, tile grids, dock shortcuts) were rejected.

## Context

- Filters today live in three separate dock entry points: sport and time range as reveal panels (`src/components/layout/Dock.tsx:188-248`, `:304-343`, `src/components/layout/DockFilterOptions.tsx`), advanced filters in a dialog (`src/components/layout/AttributeFilterDialog.tsx`).
- Store: `src/store/filters.ts` (`timeRange` incl. `custom` + `customRange` from chart zoom, `sportFilter`, `attributeFilters`, persisted v2). Attribute filters are fuzzy targets (`src/lib/attributeFilters.ts:41-62`); time ranges in `src/lib/timeRange.ts`.
- The same filtering is duplicated in `TrainingSummaryCard.tsx:24-40`, `useMapTracks.ts:73-79`, `SessionList.tsx:39-50`, `useFilteredMetrics.ts:26`.
- Goal: simple, flexible custom filters instead of many buttons.

## Decisions (settled)

### Dock list

- The dock's single **Filter** item replaces the sport, time-range and advanced items. On desktop it opens a **reveal panel** (existing `DockRevealPanel` motion) with a **single-column, scrollable list** of filters (5 rows visible, scrolls inside; the dock bar doesn't grow). The list is **240 px** wide (was 288 px); titles never truncate, long descriptions get an ellipsis, the full name is the row's accessible name and tooltip.
- Rows are compact `ActionTile` rows (icon, title, description). **Clicking a filter applies it and closes the list**; the active filter shows ActionTile's selected look; clicking the active one clears it. The collapsed Filter item shows the `IconBadge` dot when a filter is active.
- **Three defaults** ship with the app: letzte 7 Tage, letzte 30 Tage, dieses Jahr (all sports). They behave like saved filters: editable and deletable, no way to bring them back.
- The user's saved filters follow; the **last row is "+ Neuer Filter"** (dashed add look).
- Every filter row has a **⋮ menu** (ghost icon `Button` → `DropdownMenu`, as `StudioActionsMenu`): **Bearbeiten** (opens the builder prefilled) and **Löschen** (immediate, no undo). Desktop: ⋮ on hover/focus; phone: always visible, long press also opens it. The menu slot is always reserved (no reflow).
- Phone: the Filter item stays behind ⋮; its reveal shows the same list.
- Chart drag-zoom applies its time range directly (outside the list); if it matches no filter, only the dot shows.

### Builder dialog

- Only **"+ Neuer Filter"** and **⌘K / Ctrl+K** open it (desktop dialog / phone bottom sheet with close button, existing `Dialog` placement unchanged). "Bearbeiten" opens it as "Filter bearbeiten", prefilled.
- Content: `Label` + `Input` ("Filter beschreiben", placeholder e.g. "z. B. laufen 30 tage 10 km") and a reserved slot below for **up to 3 dynamic ActionTiles** showing the filter(s) the text describes, live. Ambiguous text ("10") shows the plausible interpretations; nothing understood → no tile, no error text.
- **Selecting a dynamic tile applies the filter, closes the dialog and saves it** to the list (name generated from its parts, e.g. "Laufen · letzte 30 Tage · ca. 10 km"); an identical filter is selected instead of saved twice. When editing, it replaces the filter in place.
- Grammar: sport lauf/run → Laufen, rad/bike/ride → Radfahren; time: letzte N Tage/Wochen/Monate (last N …), dieses/letztes Jahr, a year, a month ("sep"), "sep–okt"; numbers **always approximate** ("ca. 10 km" / "about 10 km", "ca. 1 h", "ca. 500 Hm"; distance ±15 % ≥ 0.5 km, duration ±20 % ≥ 10 min, elevation ±25 % ≥ 150 m; "ca", "etwa", "about", "~" optional); several criteria combine. Only interpretations with at least one matching session; no counts anywhere.

### Implementation

- Grammar as a pure `src/lib/filterGrammar.ts` (text → filter interpretations), keyword synonyms in code (not Paraglide); labels via Paraglide and Intl.
- Store: saved filters (list incl. the three seeded defaults, active filter id or ad-hoc zoom range), persisted with version bump + migration from v2 (today's sport/range/attribute state becomes the active ad-hoc filter or is dropped — decide in implementation, report). Time model `{ kind: 'relative', amount, unit } | { kind: 'range', from, to, source } | null`. One shared `matchesFilters()` replaces the four duplicated filters.
- `ActionTile` (`src/components/ui/ActionTile.tsx:17-34`): compact row variant, dashed "add" look, reserved trailing menu slot (`text-zinc-500` on the selected white row). Long press on rows is new.
- No library needed for the builder (no combobox list anymore).
- **Focus ring**: remove `ring-offset-2` app-wide (Input, Select, Textarea, Button, RadioGroup).
- Remove: `DockFilterOptions.tsx`, `AttributeFilterDialog.tsx`, the sport/time/advanced dock items and reveal layers, unused messages.

### Follow-up decisions

- **Upgrade**: v2 sport/range/attribute state is dropped (no ad-hoc filter is created from it); only the Load grouping survives.
- **Ranges end today**: a range reaching into the future is clamped to today.
- **Relative days** count whole days including today ("last 7 days" = today and the 6 days before).
- **Deleting the active filter** clears it.
- **Names**: no thousands separator in generated names.
- **Time model** gains `{ kind: 'calendarYear', yearsAgo }` for "this year" / "last year", so the default keeps meaning the current year after New Year.

## Open

- Keeping the phone builder sheet above the soft keyboard (`visualViewport`) — verify on a device.

## Tests

- `filterGrammar`: interpretations per input (EN/DE synonyms, numbers → kinds, months, years, relative ranges, combined criteria), approximate tolerances.
- `matchesFilters`: per kind and combined.
- Store: seeded defaults, save/edit/delete, duplicate detection, migration v2 → v3.
- E2E: open the list, apply a default (list closes, dot shows), create "laufen 30 tage" via the builder → saved and active, edit it, delete it.

## Verification

`vp check`, `vp test -- --run`, `vp exec playwright test`, `vp build`; by hand on desktop and 390 px (real phone keyboard): list, apply/clear, builder, edit, delete, no layout shift.
