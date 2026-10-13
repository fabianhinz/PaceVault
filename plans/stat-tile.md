# StatTile: one grid tile for every stat cell

## Context

- The More-stats cells stack 9 wrappers before any content (`src/features/sessions/session/StatCell.tsx:54-85`). Value and qualifier are pushed apart (`StatCell.tsx:76-81`), and Intensity hand-builds its own h3 (`src/features/sessions/session/MoreStatsRow.tsx:150-154`).
- Chart height is set in four places: `src/features/sessions/session/MeterBar.tsx:24`, `src/features/sessions/session/PeakBars.tsx:26`, `src/features/sessions/session/PeakPowerCell.tsx:28`, `src/features/sessions/session/HrZonesCell.tsx:34-35`.
- The trip and route stat grids use a second, similar tile:
  - `StatItem` (`src/components/ui/StatItem.tsx:6-36`), rendered by `src/features/trips/TripStatsGrid.tsx:63-69` and `src/features/studio/RouteStatsGrid.tsx:35`;
  - wrapped in tiles by `CardGrid` (`src/components/ui/CardGrid.tsx:46-50`).
- Design source: `mockups/stat-cell-layout/index.html`, variant C, with the owner's changes below. The wrapper analysis is in `mockups/stat-cell-layout/round1.html`.

## Decisions (settled)

### The tile

- One CSS-grid `StatTile` in `src/components/ui/StatTile.tsx`, used app-wide. It replaces `StatCell`, `StatValue`, `StatCaption`, `StatPair` (all in `StatCell.tsx`) and `StatItem`.
- Props:
  - `title`, `metricId?`, `relatedMetricIds?`, `active?`;
  - `value`, `unit?`, `lead?`;
  - `secondary?: { value: string; lead?: string; unit?: string }`;
  - `note?`, `children?`.
- `metricId` is optional because most trip and route tiles have no explanation.

### Rows: 16 / 28 / 32 px

- The content is 84 px; with `p-3` and the border the tile is 110 px, unchanged from today.
- Measured in headless Chromium at 12 px captions with 16 px lines, plus 12 px icons with a 4 px gap. Crumbs wrap only after a " · ".
- At **126 px** (phone) and **141 px** (desktop) alike:

| Case                                                                 | Result     |
| -------------------------------------------------------------------- | ---------- |
| Moving time crumbs, real demo maximum `/ 3:17:29 · ⟿ 13:11 · ⏸ 2:10` | 2 lines    |
| Real ride shown in the mockup                                        | 2 lines    |
| Run `/ 1:32:24 · ⏸ 0:00`                                             | 1 line     |
| Synthetic 10 h+ ride `/ 12:17:29 · ⟿ 1:02:13 · ⏸ 1:15:20`            | 2 lines    |
| `NP 124 W · Avg 118 W` / `NP 124 W · Ø 118 W`                        | 1 line     |
| Value `3:15:24` / `10:15:24`                                         | 57 / 66 px |
| `IF 0.59  VI 1.05` (EN and DE)                                       | 106 px     |
| `1,640 kcal ±15 %` (real maximum)                                    | 102 px     |
| `Z3 Threshold · 5:17`                                                | 106 px     |

- Every real case fits two lines in row 3, so row 3 is 32 px. The 48 px row from round 2 is dropped.

### Placement

- With `children` (chart cells), `note` sits on the value's baseline right after the value, and the chart fills row 3.
- Without `children` (text cells), `note` fills row 3: it wraps only at " · " and is clamped to 2 lines.
- Text is left-aligned.

### Moving time

- Crumbs: `/ {time}` (total time, `ui_more_stats_of_total` as today), then lucide `Wind` + coasting time (rides only), then lucide `Pause` + stopped time.
- The icons carry sr-only labels and tooltips, as `IconFact` does today (`MoreStatsRow.tsx:56-62`). No words "coast" or "stop". Runs use the `Pause` icon too, for consistency.

### Intensity

- "IF 0.59" and "VI 1.05" are equally large: `value` + `lead="IF"`, and `secondary={{ lead: 'VI', value }}`.
- `secondary` renders as a second h3 in the value row. A tile with `secondary` shows no inline note.

### Explanations

- Every ⓘ explains its tile's numbers and any icon or abbreviation shown. This needs copy changes for Moving time, Step length (spm), HR zones (the share), Peak power (the default window) and the DE decoupling verdicts; see Copy.

### Charts

- `MeterBar`, `PeakBars` and the zone bar become the chart child directly and take the hover/tap props.
- Chart height lives in one place: the 32 px third grid row of `StatTile`.

### Owner answers, round 2

- **Name:** `StatTile`.
- **Calories `±15 %` next to a 5-digit value:** it may truncate; no special handling.
- **Step length `159 spm`:** row 3, by the text-cell rule.
- **`data-stat`:** derived from `metricId`; tiles without a `metricId` (most trip and route tiles) get no hook. Intensity's hook follows its `metricId`: `intensityFactor` with FTP, `variabilityIndex` without.
- **`MetricLabel`:** unchanged. Its empty label span with `iconOnly` (`src/components/ui/MetricLabel.tsx:82-95`) stays; it has no visible effect.

### Clean-up

- Delete the dead code: `StatCell.tsx`, `StatItem.tsx`, `CardGrid`'s per-child tile wrapper, and the redundant wrappers.

## Approach

### `src/components/ui/StatTile.tsx` (new)

- **Root:** one `div` with `tileClass` (`src/components/ui/Card.tsx:5`), `p-3`, `grid grid-cols-[minmax(0,1fr)_auto] grid-rows-[16px_28px_32px] gap-y-1`, and `data-stat={metricId}` when `metricId` is set; tiles without one get no hook.
- **Row 1:**
  - title: `Typography overline`, `noWrap`, `text-text-primary` when `active`;
  - ⓘ when `metricId` is set: `MetricLabel` with `iconOnly`, `size="sm"`, `relatedMetricIds`, and `className="self-center"`. The prop exists at `src/components/ui/MetricLabel.tsx:16` and is applied at `MetricLabel.tsx:81`. This drops the `shrink-0` span at `StatCell.tsx:67`.
- **Row 2:** `col-span-2 flex items-baseline gap-3 min-w-0`.
  - h3 reading: `lead` caption (`mr-1`), the value, `unit` caption (`ml-1`), with `truncate` so free-text values (dates, file names) get an ellipsis instead of overflowing.
  - Optional second h3 reading from `secondary`.
  - Chart cells without `secondary`: `note` as `Typography caption textTertiary noWrap zeroMinWidth`.
- **Row 3:**
  - chart cell: `<div className="col-span-2 flex min-w-0 items-center">{children}</div>`, whose height comes from the grid row;
  - text cell: `note` as `Typography caption textTertiary`, `col-span-2 line-clamp-2`.
- **`Crumbs`** (exported from the same file): renders its items inline, each one `whitespace-nowrap`, joined by ` · ` so lines only break after a "·". Items are strings or `IconFact`.
- **`IconFact`:** moves from `MoreStatsRow.tsx:56-62` into this file, unchanged.

### `src/features/sessions/session/MoreStatsRow.tsx`

- Replace each `<StatCell>` with `<StatTile>`:
  - calories `:70`, `:87`;
  - moving time `:129`;
  - intensity `:157`, `:178`;
  - step length `:204`;
  - decoupling `:227`.
- Per cell:
  - **Calories:** kcal rounded to ten, `unit="kcal"`, `note="±15 %"`, children `MeterBar`.
  - **Calories, missing data:** `value="--"`, `unit="kcal"`, no children. `note` is the `Link` (`:78-80`); the `Typography` wrapper at `:77-81` goes.
  - **Moving time:**
    - `value={duration(movingS)}`, no children;
    - `note={<Crumbs items={[m.ui_more_stats_of_total(…), <IconFact icon={Wind} …/>?, <IconFact icon={Pause} …/>]} />}`;
    - replaces `:112-127` and `:134-137`; runs use the `Pause` icon instead of `m.ui_more_stats_stopped` (`:113`).
  - **Intensity with FTP:** `lead="IF"`, `secondary={{ lead: 'VI', value }}`, children `MeterBar`, `relatedMetricIds={['variabilityIndex']}`. Replaces `:148-155`.
  - **Intensity without FTP:** `lead="VI"`, no children, `note={<Crumbs items={[np, avg]} />}`. Replaces the `StatPair` at `:185-188`.
  - **Step length:** `unit="m"`, no children, `note={`${spm} spm`}`. It goes on row 3 (text-cell rule).
  - **Decoupling:** `unit="%"`, `note={verdict}`, children `MeterBar`.
- Delete the old `IconFact` (`:56-62`), `type LucideIcon` (`:3`), the `./StatCell.tsx` import (`:22`), and `Typography` (`:5`) if it ends up unused.

### `src/features/sessions/session/PeakPowerCell.tsx`

- `StatTile`: `value={watts(pick.watts)}`, `unit="W"`, `note={peakWindow(pick.seconds)}`, `active`.
- Pass `rail.railProps` to `PeakBars` and delete the rail div at `:28-35`.

### `src/features/sessions/session/PeakBars.tsx`

- The root (`:26`) becomes `flex h-full w-full items-end gap-1` and spreads a new `railProps` prop.
- Bars become a percentage of the row: `peakScale(props.watts, 100)` with a `%` height. Delete `BAR_HEIGHT_PX` (`:8`).

### `src/features/sessions/session/HrZonesCell.tsx`

- `StatTile`: `value={pick.zone.zone}`, `active`. Default `note` is `${percent} %`; when selected it is `<Crumbs items={[zoneName, duration]} />`. Replaces `:18-23` and `:31-32`.
- Delete the rail div at `:34`. The track at `:35` (`h-4`) becomes the chart child and takes `rail.railProps`.

### `src/features/sessions/session/MeterBar.tsx`

- The root (`:24`) becomes the track: `relative h-1.5 w-full rounded-full bg-white/5`, without `overflow-hidden`, so the taller tick and mark aren't clipped.
- Delete the inner track div at `:25`. Tick and mark (`:31-42`) get `top-1/2 -translate-y-1/2`.

### `src/features/sessions/session/StatCell.tsx`

- Delete the file.

### `src/components/ui/CardGrid.tsx`

- `:47-49` renders the children directly instead of wrapping each in a `tileClass p-3` div, because `StatTile` is its own tile. The `collapsedRows` slicing at `:17-22` stays.

### `src/features/trips/TripStatsGrid.tsx` (`:62-70`) and `src/features/studio/RouteStatsGrid.tsx` (`:34-36`)

- `StatItem` becomes `StatTile`, with `label` passed as `title`.
- No notes and no charts: row 3 stays empty, just as `StatItem`'s fixed 80 px left room below the value.

| Grid  | Tile                      | `title`                   | `value` / `unit` | `metricId` |
| ----- | ------------------------- | ------------------------- | ---------------- | ---------- |
| Trip  | Sessions (`:28`)          | `ui_stat_sessions`        | count            | —          |
| Trip  | Total distance (`:29-33`) | `ui_stat_total_distance`  | `formatDistance` | —          |
| Trip  | Total duration (`:34-38`) | `ui_stat_total_duration`  | `formatDuration` | —          |
| Trip  | Load (`:39-44`)           | `ui_trip_stat_load`       | TSS              | `tripLoad` |
| Trip  | Dates (`:45`)             | `ui_trip_stat_dates`      | date range       | —          |
| Trip  | Elevation (`:48-57`)      | `ui_stat_elevation`       | `+N` / `m`       | —          |
| Route | Distance (`:11-15`)       | `ui_studio_stat_distance` | `formatDistance` | —          |
| Route | Imported (`:19-23`)       | `ui_studio_stat_imported` | `formatDate`     | —          |
| Route | Source (`:24-28`)         | `ui_studio_stat_source`   | file name        | —          |

- Route Source: drop the `block truncate` span at `:27`; `StatTile`'s value already truncates.

### `src/components/ui/StatItem.tsx`

- Delete; it has no other callers.

### `CLAUDE.md`

- `CLAUDE.md:30`: replace `StatItem` with `StatTile` in the "Reuse UI components" list.

### Visual changes in the trip and route grids

- Tile content grows from 80 px to 84 px (+4 px).
- Values stay on one line. A long date range on Trip "Dates" that wraps to two lines today now ends in an ellipsis.
- The trip-load ⓘ looks the same: `tripLoad` has no short label, so `StatItem` showed only the icon too.

### Copy (`messages/en.json`, `messages/de.json`)

Re-read both files right before editing; a parallel agent edits filter keys there.

**Removed:**

- `ui_more_stats_stopped` (`en.json:477`, `de.json:477`); runs now use the `Pause` icon.

**Unchanged:**

- `ui_more_stats_of_total` `/ {time}` (`:474`), plus `ui_more_stats_coasting` (`:475`) and `ui_more_stats_stopped_label` (`:476`), which stay as icon labels and tooltips.

**Explanation changes:**

| Key                                                   | EN new                                                                                                                                                                                                                       | DE new                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exp_movingTime_range` (`:428`)                       | `The time after the slash is your total time, start to finish without a break. On rides, the wind icon is coasting — still moving but not pedalling, 0 W or 0 rpm. The pause icon is your stopped time: total minus moving.` | `Die Zeit nach dem Schrägstrich ist deine Gesamtzeit — von Start bis Ziel ohne Pause. Beim Radfahren steht das Wind-Symbol fürs Rollen: in Bewegung, aber ohne zu treten, also 0 W oder 0 rpm. Das Pause-Symbol zeigt deine Standzeit — Gesamtzeit minus Zeit in Bewegung.` |
| `exp_stepLength_oneLiner` (`:447`)                    | `How far you travel with each step — your speed divided by your cadence, which sits next to it in steps per minute (spm).`                                                                                                   | `Wie weit du mit jedem Schritt kommst — dein Tempo geteilt durch deine Kadenz, die daneben in Schritten pro Minute (spm) steht.`                                                                                                                                            |
| `exp_trainingZones_range` (`:384`), sentence appended | `The share next to a zone is the part of your session you spent in it.`                                                                                                                                                      | `Der Anteil neben einer Zone zeigt, wie viel deiner Einheit du darin verbracht hast.`                                                                                                                                                                                       |
| `exp_peakPower_range` (`:444`), sentence replaced     | `Hover or tap a bar to see its watts.` → `You start on your best 20 minutes — hover or tap a bar to see another window.`                                                                                                     | `Fahr über einen Balken oder tipp drauf, um die Watt zu sehen.` → `Du startest bei deinen besten 20 Minuten — fahr über einen Balken oder tipp drauf, um ein anderes Fenster zu sehen.`                                                                                     |
| `exp_decoupling_range` (`:432`), DE only              | —                                                                                                                                                                                                                            | `Unter 5 %: gleichmäßig — deine Grundlage hat gehalten. 5–10 %: du driftest spürbar. Über 10 %: die Einheit war länger als deine Ausdauer. Unter 0 %: du bist effizienter geworden.`                                                                                        |

- Why the DE decoupling change: the tile's verdicts are "Gleichmäßig" and "Driftet"; the range text still says "gut eingeteilt".
- Calories (`:424` explains ±15 %), IF (`:435-436`) and VI (`:439-440`) already explain what the tiles show; no change.

## Tests (per `tests/CLAUDE.md`)

- **Unit:** no new tests. `buildMoreStats`, `pickPeak`, `pickZone` and `peakScale` are unchanged (`tests/lib/moreStats.spec.ts:37-150`), and `StatTile` and `Crumbs` are React components (no render tests).
- **E2E, `e2e/sessions.spec.ts`:** no copy changes; four selectors change and one line goes (table below).
  - `:265` `/\/ \d/` still matches.
  - `:266` `'Stopped'` and `:267` `'Coasting'` still pass, because the icon labels are sr-only text in the DOM and `toContainText` reads `textContent`.
  - The zone toggle at `:270-290` still holds: the selected time appears in the note and the share disappears.
  - Selector changes, since `data-stat` now comes from `metricId`:

    | Line           | Today                            | New                                                                 |
    | -------------- | -------------------------------- | ------------------------------------------------------------------- |
    | `:262`, `:263` | `[data-stat="step"]`             | `[data-stat="stepLength"]`                                          |
    | `:264`         | `[data-stat="moving"]`           | `[data-stat="movingTime"]`                                          |
    | `:268`         | `[data-stat="coasting"]` count 0 | delete the line; no `coasting` metric exists, so it can never match |
    | `:270`         | `[data-stat="zones"]`            | `[data-stat="trainingZones"]`                                       |
    | `:296`         | `[data-stat="calories"]`         | unchanged                                                           |

- **E2E, trips and studio:** run as-is; no `StatItem`-specific selectors exist.

## Verification

- `vp check`
- `vp test -- --run`
- `vp exec playwright test`
- `vp build`
- Visual check: a temporary Playwright script with its own `webServer` on a free port (not 5173), demo data via the onboarding test-data tile (as in `scripts/readme/capture.readme.ts`).
  - More stats: a ride and a run at 1440×900 and 390×844, in EN and DE: default, hover peek, selected segment, selected again.
  - A trip page and a studio route at both sizes.
  - Assert equal tile heights per grid.
  - Assert no value or crumb element in More stats has `scrollWidth > clientWidth`, and no clamped note has `scrollHeight > clientHeight`.
  - Open the Moving time ⓘ and check the new copy.
  - Compare against `mockups/stat-cell-layout/index.html` variant C, then delete the script and screenshots.

## Open questions

None.
