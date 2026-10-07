# Session summary: grouped summary card, grouped charts card, no stats card

Mockup: `mockups/session-summary/index.html` (final, solution-only).

## Context

- Today the session page shows header, `NoGpsBanner`, `WeatherCard`, the map pills and `SessionOverview` (`src/pages/SessionDetailPage.tsx:55-64`). `SessionOverview` holds the training effect card, the charts and the stats card at the bottom.
- The stats card (`src/features/sessions/session/SessionStatsGrid.tsx`) mostly repeats the header (distance, duration are in the subtitle, `src/features/sessions/hooks/useSessionTitle.ts:29`). Its unique content: TSS, pacing trend, recovery, sensor warnings.
- Variants compared: separate cards, one grouped card, a desktop strip, a 2D plane glyph, warnings in the header. Chosen: one grouped card with ListItem-style rows (calm, scannable, one colour accent per row), plus the charts as a second grouped card.
- Bugs found and fixed here:
  - Sensor warnings are stored as English sentences at import (`src/lib/validation.ts:45-75`, `src/packages/engine/types.ts:66`, written at `src/parsers/fit.ts:241`) — untranslatable.
  - Training effect is computed with the current CTL instead of the CTL on the session's date (`src/features/sessions/session/TrainingEffectCard.tsx:53`), so old sessions' TE drifts with fitness.

## Decisions (settled)

### Page

- Order: header → sensor warning banner (if any) → `NoGpsBanner` (if any) → **summary card** → **charts card**. No stats card.
- Map pills row ("Color by" + "Laps"): on the phone it scrolls horizontally when it doesn't fit (no scrollbar, edge fade); centred when it fits.

### Summary card (one glass card, rows split by `border-white/10`)

- Each row is a collapsible ListItem (`src/components/ui/List.tsx:15-40` look): avatar = 30 px mini glyph (the only colour in the row), primary `body1` (text-sm, text-primary), secondary `caption` (text-xs, text-secondary), chevron on the right. Rows open independently and always start collapsed. **Desktop and phone expand inline** (no dialog).
- **Disabled rows**: no chevron, no hover, not openable, `aria-disabled`, visibly muted.
- **Weather row** (existing `WeatherCard` content): "Cloudy 14–15 °C" / "Rain from 7:00 PM"; open = rose + head/cross/tail split + hourly table **without the "From" row**. Loading skeleton / hidden without weather as today.
- **Training effect row**: avatar = mini arcs (GaugeDial look). Primary = today's two labels "Maintaining · No Effect"; secondary "Aerobic 2.8 · Anaerobic 0.0 · TRIMP 81" (TSS value + method short label). Open = today's gauges unchanged (numbers, labels, ⓘ), labels at today's 12 px; long labels ("STARK VERBESSERND") wrap to two lines, centred; then today's footer exactly (divider + summary sentence as `caption`). No profile: row disabled, "Duration-Based Load 40" / "Set max & resting HR in your profile" (may wrap).
- **Laps row**: avatar = mini lap strip. Over **all laps exactly as recorded** (warm-up, recovery, partial split included), no trend: primary "14 splits · avg 5:59 /km" (rides km/h), secondary range "5:48–6:14 /km"; interval device laps add "· recovery 28 bpm". Open = larger strip + fastest/slowest lap (plain text, no pointer events, no outline) + HR recovery ⓘ on interval device laps.
  - Hover a strip bar = preview like hovering a chart band (band tint, map highlight); click = select like clicking a band. Chart ↔ strip sync both ways.
  - Disabled with a nudge: laps Off ("Laps off" / "Choose device laps or splits in the Laps control"); fewer than 2 laps ("1 split" / "Choose a shorter split distance", device: "Choose splits in the Laps control").
- Pacing trend is dropped (first→last drift misleads on real data).

### Laps control

- Default source **Splits per sport**: running 1 km, cycling 5 km; reset per session (nothing remembered).
- Splits distance via a **slider** (look of `src/components/ui/Slider.tsx`) inside the checked Splits row: running 0.5–10 km in 0.5 km steps, cycling 1–50 km in 1 km steps, capped at the session length; live label; bands and Laps row update while sliding. Replaces the 0.4/1/2/5 km chips.
- Checked row subtitle shows only the count: "14 splits" / "14 laps" ("1 split" / "1 lap").
- **Lap selection = Laps pill becomes the stepper** "⚑ ‹ Lap 4 › | ✕" (no floating peek, no "--"); ✕/Esc restores the pill. ‹ › never move.
- Selected lap band on charts and strip: **white** outline (matches the map casing); hover = light white tint.

### Sensor warnings

- One `Banner variant="warning"` like `NoGpsBanner`, listing all warnings of the session as translated sentences. **Computed from the records at display time** (no stored strings, no migration; old sessions translate automatically).

### Charts card

- All session charts in one glass card, one row per chart: ListItem title line (avatar = chart icon in its chart colour, title, ⓘ as today), then rail + chart. Always expanded: no chevron, no collapse, no hover on the title.
- Zoom (desktop drag) unchanged; while zoomed a glass "⊖ Reset zoom" chip sits at the top-right of the charts card, absolutely positioned on the first title line (no layout shift). The rail top slot stays empty.

## Approach

- `src/components/ui/Collapsible.tsx`: ListItem-style header (avatar, primary, secondary, trailing), `disabled` state; reuse for all summary rows.
- `src/components/ui/MetricLabel.tsx:52`: new option to always show the short label (used in the TE detail on phones).
- New `SessionSummaryCard` in `src/features/sessions/session/` composing weather / training effect / laps rows; `WeatherCard.tsx` becomes a row (drop the `ResponsivePopover` phone path, `WeatherCard.tsx:132-190`); `WeatherHourlyTable.tsx:106-108` drop the direction row; `TrainingEffectCard.tsx` becomes a row (keep gauges + footer; label wrapping centred).
- Laps row + lap summary: `src/lib/lapSummary.ts` (count, average, range over all laps), `src/lib/lapSet.ts:8` default per sport, `src/lib/dynamicLaps.ts:7` drop `SPLIT_DISTANCES_M` in favour of per-sport slider ranges.
- `src/features/sessions/session/LapsControl.tsx:134`: slider instead of chips; pill stepper; remove `LapPeek.tsx` (used in `SessionMapControls.tsx:8`); pill row horizontal scroll (`SessionMapControls.tsx:28`).
- `src/components/charts/LapBands.tsx:27`, `:56-58`: white outline/tint instead of `tokens.accent`.
- Charts card: `src/features/sessions/charts/SessionChartsExplorer.tsx` renders rows inside one card instead of a `ChartPreviewCard` per chart; `ZoomResetChip` (`src/components/ui/ZoomResetChip.tsx`, used at `SessionChartsExplorer.tsx:457`) positioned inside the card. Studio (`RouteChartsExplorer.tsx:173`) and dashboard (`DashboardZoomReset.tsx`) keep the chip but get the same non-shifting placement.
- Sensor warnings: `validateRecords` returns codes + values; new `SensorWarningBanner` (computed from records, i18n en/de); stop writing `sensorWarnings` at import (`src/parsers/fit.ts:241`, `:319`) and remove the field (`src/packages/engine/types.ts:66`) incl. `generateDevData.ts`.
- Training effect CTL: use the CTL of the session's date from `useMetrics().history` (`src/hooks/useMetrics.ts:9`) instead of `current`.

## Removal

- `SessionStatsGrid.tsx` (+ messages), `detectProgressiveOverload` and its tests if unused afterwards, `LapPeek.tsx`, the chips/`SPLIT_DISTANCES_M`, the weather dialog path, `CardGrid` if unused, `sensorWarnings` field, unused messages.

## Tests

- Regression: "sensor warnings stay English in the German UI" — warnings computed from records produce codes; banner text comes from messages.
- Regression: "training effect of an old session changes when fitness changes" — TE uses the CTL of the session date.
- Lap summary over all laps (count, average, range incl. warm-up/recovery/partial).
- E2E (`e2e/sessions.spec.ts`): rows collapsed → open TE inline on phone → laps row shows "{n} splits"; laps Off disables the row; selecting a lap turns the pill into the stepper.

## Verification

`vp check`, `vp test -- --run`, `vp exec playwright test`, `vp build`. By hand at desktop and 390 px: inline expand of all rows, disabled rows, slider ranges per sport, stepper, reset-zoom chip without layout shift, warnings banner in DE, German "STARK VERBESSERND" wrapping.
