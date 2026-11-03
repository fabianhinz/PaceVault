# UI audit: segments mockup (round 4) against the app

Source read: `tools/workbench/backlog/session-segments/mockup/index.html` (round 4). Mockup lines are given as `mockup:<line>`. App references were checked against the current tree. Severity: **must** means it breaks an app rule or misdraws an existing component, **should** means it departs from an existing pattern, **nit** means a wireframe detail.

## Findings

### Map pill and stepper

| id | Where in the mockup | What the app does instead | Suggested fix | Severity |
| --- | --- | --- | --- | --- |
| F1 | Segment stepper puts ✕ inside the pill behind a separator (`.sep`, mockup:380-385, 1003). The existing lap stepper is redrawn the same way (mockup:999). | The lap stepper is one pill `[Flag ‹ name ›]`, and Clear is a **separate** 44 px round `PvFloatingPill` with `ml-1` (`apps/web/src/components/sessions/session/LapStepper.tsx:30-35`, `:72-79`). | Draw both steppers as `[icon ‹ label ›]` plus a separate round ✕ pill, and reuse `LapStepper`'s structure for `SegmentStepper`. | must |
| F2 | Step buttons are 30 px circles (`.pill .ib`, mockup:364-372). | `StepButton`: 44 px hit area with a 36 px hover circle, `disabled:opacity-30` (`apps/web/src/components/sessions/session/StepButton.tsx:20-29`). | Reuse `StepButton` as it is. | should |
| F3 | ‹ › wrap around (5 → 1, mockup:1133). | Lap stepping stops at the ends and disables the button (`apps/web/src/lib/analysis/laps.ts:664-676`, `LapStepper.tsx:40`, `:64`). Escape clears the selection (`LapStepper.tsx:22`). | Stop at the ends, disable ‹ on 1 and › on N, and add Escape to clear. | should |
| F4 | The label `Segment 2/5` has a variable width (mockup:1003). | The lap label has a fixed width, centred and tabular (`w-104px text-center tabular-nums`, `LapStepper.tsx:50`), and shows no total (`Lap 3`). | Use a fixed width so the pill does not jump while stepping. Whether "/5" stays is a copy choice; laps leave it out. | nit |
| F5 | Pill at rest: `[Spline] Segments 5`, no chevron, and a click selects segment 1 directly (mockup:1009, 1136-1138). | Every pill in the bar (Map view, Color by, Laps) has a `ChevronDown` 14 px tertiary and opens a `PvResponsivePopover` with a heading (`LapsControl.tsx:40-57`, `MapViewControl.tsx:19-49`). The label is a count phrase built from a plural pair, `13 splits` (`LapsControl.tsx:15-20`, `lapLabels.ts:42-65`). | Either keep the pattern (chevron + popover listing the segments, picking one turns the pill into the stepper) or record the direct-select pill as a deliberate exception. The label becomes `5 segments` through a `_one`/`_other` pair. | should |
| F6 | With a lap or segment selected, only Map view collapses to an icon (mockup:996). Color by stays `◐ Speed ▾` (mockup:997). | With a lap selected, **both** Map view and Color by collapse to 44 px icon pills (`MapViewControl.tsx:29-36`, `ColorByControl.tsx:66-75`). | Collapse Color by as well. This also frees width for Q13 at 390 px. | must |
| F7 | Pill paddings: 14 px sides, no backdrop blur (mockup:105-118). | `PvFloatingPill`: `px-3 py-2` on `FLOATING_PILL_CLASS` (`bg-surface/85 backdrop-blur-xl … shadow-floating`), with hover on an inset `before:` circle (`packages/ui/src/components/pvFloatingPill/PvFloatingPill.tsx:11-13`, `packages/ui/src/lib/surfaces.ts:5-15`). | Use a 12 px side padding and the floating surface. | nit |
| F8 | Loading pill: icon + skeleton label + skeleton count (mockup:1004-1005). Empty pill: tertiary `Segments 0`, still a pill (mockup:1006-1007). | No pill in the bar has a loading or an empty state. Laps with source off shows the plain `Laps` label (`LapsControl.tsx:16`). | See "New patterns" N1. | should |

### Map layers

| id | Where in the mockup | What the app does instead | Suggested fix | Severity |
| --- | --- | --- | --- | --- |
| F9 | In segment mode the base track drops to 45 %, and every unselected segment gets a permanent white casing at 55 % (mockup:835-841). | A lap draws nothing until it is selected: one white casing plus the track colour (`apps/web/src/components/mapBackground/hooks/useLapLayers.ts:81-111`), and a hover preview of 3 px white (`:63-79`). The base track is never dimmed. A white casing at 55 % renders grey, and grey is banned on the map (`apps/web/CLAUDE.md:52`). | Draw the selected segment only, like a lap. Mark unselected segments, if needed, with a hover preview only, or with a non-grey treatment checked against §3. | must |
| F10 | Clicking a band always selects it (mockup:1140-1142), and nothing happens on hover. | A click on the track **toggles** the lap (a second click clears it), and hover sets `hoveredLapIndex` (`apps/web/src/components/mapBackground/hooks/useDetailLayers.ts:51-63`). | Clicking toggles and hovering previews, the same as laps. | should |
| F11 | The selected band always uses the sport colour (mockup:840). | The selected lap takes the per-point track colour of the active Color by mode, `getColor: (d) => d.color` (`useLapLayers.ts:100`). | Note in the mockup that the band follows Color by (zones, speed, …). | nit |

### Summary row

| id | Where in the mockup | What the app does instead | Suggested fix | Severity |
| --- | --- | --- | --- | --- |
| F12 | The neighbouring rows are drawn as `Weather` / `Training effect` / `Laps` / `More stats` with a summary underneath (mockup:1068-1072), which makes a label-first `Segments` row look consistent (mockup:1063). | Real rows lead with the result. Weather: `Cloudy 9–11 °C` (`WeatherCard.tsx:88-93`). TE: `Aerobic label · anaerobic label` (`TrainingEffectCard.tsx:68`). Laps: `13 splits · avg 4:51 /km` (`lapLabels.ts:175-182`). Only More stats uses a title (`MoreStatsRow.tsx:286`). | Draw the neighbours with real copy, and give the Segments row a result primary such as `5 segments · 2nd of 15 on segment 2`, with the secondary carrying the best time or the trend. | must |
| F13 | Avatar box 40 px (`.avatar`, mockup:410-417). | The avatar slot of a secondary list item is `size-30px` (`packages/ui/src/components/pvListItemHeader/PvListItemHeader.tsx:13-16`). Icon avatars are 20 px `text-text-secondary` (`MoreStatsRow.tsx:285`). | Use a 30 px slot with the 20 px icon. | nit |
| F14 | Secondary line in tertiary (`xs t3`, mockup:1017, 1063). | `caption` defaults to `textSecondary` (`packages/ui/src/components/pvTypography/PvTypography.tsx:13`), and `PvListItemHeader` uses it unchanged (`PvListItemHeader.tsx:63-67`). | Use the secondary colour. | should |
| F15 | The whole header row gets `white/5` on hover. The chevron is ▾/▴ (mockup:407-409, 1061). | Only the trailing box hovers (`p-1.5 rounded-lg group-hover:bg-white/10`), and the icon is a `ChevronRight` 16 px that rotates 90° when open (`packages/ui/src/components/pvCollapsibleHeader/PvCollapsibleHeader.tsx:27-32`). | Use `PvCollapsibleListItem` unchanged. | nit |
| F16 | "None" scenario: no chevron, but full opacity and the copy `No overlaps · 980 sessions checked` (mockup:1030, 1059-1061). | A disabled row is `opacity-45`, has no chevron and uses `cursor-default` (`packages/ui/src/components/pvCollapsibleListItem/PvCollapsibleListItem.tsx:18-35`, `PvListItemHeader.tsx:43`). Its primary states the state and its secondary gives the hint (`Laps off` / `Choose device laps or splits…`, `lapLabels.ts:159-161`). | Make the row `disabled`, with primary `No segments` and secondary saying why: a fact, no count teaser. | should |
| F17 | Loading row: avatar + `Segments` + inline skeleton secondary, and a skeleton body when expanded (mockup:1031, 1039-1040). | The only async row (Weather) renders a single 52 px pulse block, `h-52px animate-pulse bg-white/5`, in place of the whole row (`WeatherCard.tsx:69-71`). Inline skeletons are `PvInlineSkeleton` (`packages/ui/src/components/pvInlineSkeleton/PvInlineSkeleton.tsx:11`). | Pick one. Either follow Weather (a whole-row block, no expand while loading), or use `PvInlineSkeleton` in the secondary and keep the row `disabled` until done. A skeleton body behind an expandable row has no precedent. | should |
| F18 | Expanding the row selects segment 1 (mockup:1143-1145), and the open state is driven from outside (the "Row expanded" extra). | `PvCollapsibleListItem` keeps its own `useState(false)`, so it cannot start open and cannot be controlled (`PvCollapsibleListItem.tsx:16`). Expanding Laps selects no lap (`LapsRow.tsx:28-36`). | Keep expansion free of side effects. Show segment 1's data without selecting it on the map, or require a selection. A controlled API is a kit change (N3). | should |
| F19 | A second stepper `‹ 2/5 ›` inside the row body, beside the map stepper (mockup:1043, 1046). | Laps has a single stepper on the map. Inside the row, laps are picked by clicking the strip, which toggles (`LapStripDetail.tsx:82-99`). "Same action, same place" (`apps/web/CLAUDE.md:46`). | Select from the chart instead (click a segment in a strip of segments, LapStrip style), or put the stepper in the header's `trailing` slot (`PvCollapsibleHeader.tsx:8`, `:28`). Avoid two styles of stepper for one state. | should |
| F20 | A numbered white-ring badge `.nb` before the segment label (mockup:237-247, 1045). | Laps are named in text only (`Lap 3`, `lapLabels.ts:291-306`). No numbered circle exists in the app. | Drop it and use the text label. | nit |
| F21 | CTA `.cta` is hand-built: 6×12 padding, 8 px radius, tile background, weight 500, trailing `›` (mockup:429-444, 1051). | `PvButton variant="secondary" size="sm"`: `bg-white/5 border-white/10 hover:bg-white/10 px-3 py-1.5 rounded-lg`, `subtitle1` text (`packages/ui/src/components/pvButton/PvButton.tsx:13-14`, `:21`, `:28`). No app button carries a `›` glyph. | Use `PvButton` secondary sm, labelled `Show 15 passes`. If anything trails, a lucide `ChevronRight` 16 px rather than the glyph. | should |

### Chart in the row

| id | Where in the mockup | What the app does instead | Suggested fix | Severity |
| --- | --- | --- | --- | --- |
| F22 | The key (`● this session ○ best … faster ↑`) sits **above** the chart as text glyphs. The trend caption with `╌╌` is a separate row (mockup:1048-1049). | Keys sit **below** the chart as `flex flex-wrap gap-3 text-xs text-text-tertiary` with `LegendDot` (a 2 px rounded-xs square) or `LegendLine` (a 14 px line, dashed for comparisons) (`apps/web/src/components/sessions/session/LapStripDetail.tsx:108-114`, `LegendDot.tsx:9-17`, `apps/web/src/components/dashboard/LegendLine.tsx:10-18`, `VolumeChart.tsx:157-168`). | Move the key under the scatter and use `LegendDot` for this session and best, and `LegendLine dashed` for the trend, with its value in the label. | should |
| F23 | Trend line in white at 50 % (mockup:855, 897). | A comparison or "before" line uses `tokens.textTertiary`, 1.5 px, dash `5 4` (`VolumeChart.tsx:126-135`). | Use `tokens.textTertiary` (same dash, same width). | should |
| F24 | Hard-coded colours: other passes `#b0b4be`, best `#facc15`, axis `rgb(255 255 255 / .12)`, labels `#8b8f9a` (mockup:908-919). | Charts read `tokens.*` and `chartTheme`: tick `tokens.textTertiary` at the 2xs size, axis `tokens.border` (`apps/web/src/lib/colors/chartTheme.ts:95-99`). `#b0b4be` is not a token. | Map each colour to a token (or add one per the theme-token TDR). Ticks already match `chartTheme.tick` in value. | should |
| F25 | Best is yellow (`--color-yellow-400`), both as a ring in the scatter and as a tag (mockup:328-331, 647, 916). | `yellow-400` is the `status-warning` token (`packages/ui/src/theme.css:85`). The app has no "best" colour: personal bests on the records page are plain text (`apps/web/src/components/records/SportRecordsCard.tsx:58-64`). | Mark best without a status colour: a ring in `text-primary` or white, and a neutral chip. A dedicated "best" token would be a new rule (N4). | should |
| F26 | Static SVG: no hover and no readout of a dot (mockup:899-921). | Small session charts link hover to the map and the stores (`LapStripDetail.tsx:42-46`, `:92-97`). Recharts charts hide the tooltip and read out on a rail (`apps/web/src/components/charts/chartHover.ts:5`). | Hover a dot to show date and time in a readout line (rail style), and click to open or select that pass. Leave it out only by decision. | should |

### Passes dialog

| id | Where in the mockup | What the app does instead | Suggested fix | Severity |
| --- | --- | --- | --- | --- |
| F27 | Pass cards use the glass surface (`surface/55` + blur, mockup:284-294) inside a floating dialog. | Selectable rows inside a dialog are `TILE_CLASS` with padding at the call site (`packages/ui/CLAUDE.md:24`, `apps/web/src/components/trips/ManageTripDialog.tsx:56-60`). | Build each pass row on `TILE_CLASS p-3` with `hover:bg-white/10`. | must |
| F28 | "This session" gets a sport-coloured border (`.pcard.mine`, mockup:298-300). | The current or checked row in a dialog list is marked with `bg-white/10` (`ManageTripDialog.tsx:59`). No card has a coloured outline. | Use `bg-white/10` plus the chip (F29). | should |
| F29 | Tags `This session` / `Best` are full pills tinted 18 % in the sport colour or yellow (mockup:318-331). | `PvChip`: caption, `rounded bg-white/10 px-1.5 py-0.5`, neutral (`packages/ui/src/components/pvChip/PvChip.tsx:16`). A status in a dialog header is a chip (`apps/web/CLAUDE.md:46`, `packages/ui/src/components/pvDialog/PvDialogHeader.tsx:23`). | Use `PvChip` for both tags. | should |
| F30 | The header is a hand-built row with a 32 px ✕ circle, plus two meta lines (mockup:1082-1084). | `PvDialogHeader` takes `title`, `subtitle`, `chip` and `actions` (`PvDialogHeader.tsx:7-13`). The only list popup with a close button uses `PvButton variant="ghost" size="icon"` with `X` 16 px, on desktop only (`apps/web/src/components/mapBackground/MapPickPopup.tsx:37-51`). | Title `Segment 2`, subtitle = segment meta, chip = `15 passes`, actions = ghost icon ✕. Move `Fastest first · Pace along the segment` into the body above the list. | should |
| F31 | Phone dialog: 16 px padding, ✕ top right, no grabber (mockup:487-497). | On phone `PvDialogCard` renders a 48 px grabber that closes on tap or drag (`packages/ui/src/components/pvDialog/PvDialogCard.tsx:88-100`). Header and body use `px-5` and the body `pb-5` (`PvDialogHeader.tsx:18`, `PvDialogBody.tsx:17`). | Draw the grabber and 20 px insets. Whether ✕ also shows on phone is open: the rule wants Close top right at every width (`apps/web/CLAUDE.md:46`), while `MapPickPopup` hides it on phone. | should |
| F32 | Desktop scrim `black/40` + `blur(8px)` (mockup:462-468). | On `lg` the overlay is transparent with `backdrop-blur-xl`; `SCRIM_CLASS` applies on phone only (`packages/ui/src/components/pvDialog/PvDialogOverlay.tsx:10-11`). | Desktop: no tint, blur-xl. | nit |
| F33 | The list scrolls in its own `.dlist` with a thin scrollbar. The scope line sits under the list with no footer (mockup:498-507, 1085-1086). | `PvDialogBody` scrolls with `scroll-fade` (`PvDialogBody.tsx:12-18`). Every existing dialog has a `PvDialogFooter` with buttons (`ManageTripDialog.tsx:69-76`, `DeleteSessionDialog.tsx:58-65`). | Put the list in `PvDialogBody`. Either drop the footer (N5) or add one with a single `Close` secondary button. | should |
| F34 | Pass card layout is a custom 4-column grid: badge, title + caption, sparkline, time + gap (mockup:345-361, 970-974). | `SessionHeader` already renders badge + title (`subtitle1`) + caption, with a right-hand `children` slot (`apps/web/src/components/sessions/SessionHeader.tsx:23-37`). Right-aligned value + caption with a `PvValueSkeleton` while loading is the records pattern (`SportRecordsCard.tsx:53-65`). | Compose `SessionHeader` + sparkline + a value column. Use `PvValueSkeleton` for the pending time and gap instead of the ad-hoc `sk(40)` / `sk(30)` (mockup:962, 967). | should |
| F35 | Card caption in tertiary (`xs t3`, mockup:973). | The session caption is `caption` in the default `textSecondary` (`SessionHeader.tsx:32`). | Use the secondary colour. | nit |
| F36 | Pass cards do nothing on click (mockup:970). | `SessionItem` opens the session and highlights it on the map on hover (`apps/web/src/components/sessions/SessionItem.tsx:16-30`). | Decide: open that session (the SessionItem behaviour) or stay inert. A card that looks like `SessionItem` but cannot be clicked reads as broken. | should |
| F37 | Sparkline colour follows the pass (sport / grey / yellow) for every metric (mockup:944-946). | Session charts colour a metric by its token: pace `chartPace` cyan, HR `chartHr` red, power `chartPower` blue, speed `chartSpeed` green (`packages/ui/src/lib/tokens.ts:45-52`). | Either use the metric token and mark this session or best by the chip only, or keep the identity colours and say so in decisions. In both cases no raw hex. | should |

### Copy and number formats

| id | Where in the mockup | What the app does instead | Suggested fix | Severity |
| --- | --- | --- | --- | --- |
| F38 | Hand-built `dur()`, `delta()` and `" /km"` (mockup:781-806). | `formatRaceTime` (`apps/web/src/lib/format/formatters.ts:230-237`), `formatPace` (`:264`) and `lapPaceLabel` (`apps/web/src/components/sessions/session/lapLabels.ts:67-70`). No signed duration exists. | Use these. A signed duration (`+0:12` / `−0:12`) needs a new formatter mode in `formatters.ts` (N6). | should |
| F39 | Dates use a hard-coded `en-GB` / `de-DE`. Time `07:12` is written out (mockup:789-794, 1014). | `formatDate(value, 'date' \| 'hour-minute')` with `getLocale()` (`formatters.ts:15-35`). | Use `formatDate`. | nit |
| F40 | Ordinals `2nd` / `2.` (mockup:801-805). | `formatters.ts` has no ordinal; plurals go through `formatPlural` (`formatters.ts:190-201`). | Rephrase without an ordinal (`Rank 2 of 15`, `Platz 2 von 15`), or add an ordinal mode to `formatters.ts` (N6). | should |
| F41 | Distances with two decimals and an ad-hoc range: `1.42–5.10 km` (mockup:787-788, 807). | Distances render as `formatDistance` (one decimal, `formatters.ts:247-253`) or `formatUnit(…, 'kilometer')`. Ranges go through `formatUnitRange` (`formatters.ts:163`). | Use `formatUnitRange` with one decimal, the same precision as the session caption. | nit |
| F42 | Counts in copy without plural pairs (`Show ${n} passes`, `${n} segments`, mockup:1029, 1051). Instructional body text (`Step through them here or on the map`, mockup:1042). | Counts use `_one` / `_other` pairs (`packages/i18n/CLAUDE.md:15`). Copy states facts (`:22`). The laps hint style is short and imperative (`Choose splits in the Laps control`). | Use plural pairs. Shorten the hint to a fact plus an action, e.g. `No segment selected`. | nit |

## New patterns without precedent

- **N1 · Loading and empty states for a map pill.** No pill in the bar loads or stays empty.
  - (a) Hide the Segments pill until detection is done, and hide it with 0 segments (recommended: the bar stays stable and the row shows the state).
  - (b) A skeleton label inside `PvFloatingPill`, plus a `disabled` pill for 0.
  - (c) Show `Segments` with a small `LoaderCircle` (the `PvButton` loading icon, `PvButton.tsx:69`).
- **N2 · Scatterplot (date × time) with a trendline.** The app has a hand-drawn SVG strip (`LapStripDetail`) and Recharts area and line charts, but no scatter.
  - (a) A hand-drawn SVG modelled on `LapStripDetail` (recommended: small, and hover/click to the store is already solved there).
  - (b) A Recharts `ScatterChart` with `chartTheme`.
  Either way it lives in `components/sessions/session/`, and moves to the kit only on second use.
- **N3 · Controlled or default-open `PvCollapsibleListItem`.** Needed only if expanding is tied to the selection (F18).
  - (a) Keep it uncontrolled with no side effect on expand (recommended).
  - (b) Add optional `open` / `onOpenChange` to the kit.
- **N4 · A "best" marker colour.** Yellow is the warning token today.
  - (a) Neutral marker: white ring plus a `PvChip` (recommended).
  - (b) A new `--color-best` token in `theme.css` and `tokens.ts` with a written rule.
- **N5 · A read-only list dialog without a footer.** Every existing dialog has footer buttons.
  - (a) Header ✕ via `PvDialogHeader actions` (ghost icon) and no footer (recommended; matches `MapPickPopup` and the ✕ rule).
  - (b) A footer with one `Close` secondary button.
- **N6 · Formatter modes.** Signed duration (gap to best) and an ordinal rank.
  - (a) Add `formatSignedRaceTime` to `formatters.ts` and rephrase the rank as `Rank 2 of 15` (recommended).
  - (b) Add both a signed duration and an ordinal mode via `Intl.PluralRules({ type: 'ordinal' })`.
- **N7 · Sparkline in a session card.** No mini line chart exists inside list cards.
  - (a) A small SVG component next to the dialog, with shared y-scale and tokens (recommended).
  - (b) A kit `PvSparkline` now (premature: one consumer).
- **N8 · Pill that selects on click instead of opening a popover** (F5).
  - (a) Chevron + popover with the segment list, as every other pill does (recommended).
  - (b) Keep direct select and record it as a deliberate exception.
- **N9 · Permanently marked unselected stretches on the map** (F9).
  - (a) Selected only, plus hover preview, as laps do (recommended).
  - (b) A non-grey marker for unselected segments, checked against `apps/web/CLAUDE.md` §3.
