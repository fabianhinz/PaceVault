# Profile history mini: tile = field

## Context

- Settings shows the thresholds in two cards today:
  - the form, `ThresholdsSection` (`src/features/settings/ThresholdsSection.tsx:137-151`), built from `ThresholdsFields` (`ThresholdsSection.tsx:24-128`) with one Save (`ThresholdsSection.tsx:144-148`);
  - the history, `ProfileHistoryChart` (`src/features/settings/ProfileHistoryChart.tsx:132-265`): a 256 px `ChartRow` (`ProfileHistoryChart.tsx:196`) with five tabs (`ProfileHistoryChart.tsx:165-189`), a monotone line (`ProfileHistoryChart.tsx:235`) and its own rail (`src/features/settings/ProfileHistoryRail.tsx:19-50`).
  - Both are stacked in `src/pages/SettingsPage.tsx:56-59`.
- Onboarding renders the same fields through `OnboardingThresholds` (`ThresholdsSection.tsx:130-135`, used at `src/pages/OnboardingPage.tsx:78` and `OnboardingPage.tsx:90`). There is no profile yet; the form runs in `create` mode and the profile is written by the profile gate on upload or import (`src/pages/OnboardingPage.tsx:28-29`, `src/features/settings/hooks/useThresholdsForm.ts:245-255`).
- W/kg is shown nowhere.
- History semantics: each value is a `DatedValue` list. `valueAt` holds a value until the next entry and falls back to the earliest entry before the first one (`src/packages/engine/datedValue.ts:6-16`). Saving writes only today's entry (`saveTodaysThresholds`, `src/store/user.ts:139-164`, at `todayMidnight`, `user.ts:94-98`) and replaces a same-day entry (`upsertDatedValue`, `datedValue.ts:18-24`). No backdating, no deleting.
- Onboarding and migrated profiles store their first values at date `0` (`useThresholdsForm.ts:179-182`, `user.ts:33`). The chart places those at the first session date, else `createdAt` (`src/lib/profileHistory.ts:31-34`).
- Design source: `mockups/profile-history-mini/round2.html`, variant A (round 1 for context: `mockups/profile-history-mini/index.html`).

## Decisions (owner, settled)

### From variant A (`round2.html:335-345`)

- The thresholds card holds gender and birth year as plain fields (`round2.html:321-325`), then six tiles in the order rest HR, max HR, FTP, pace, weight, W/kg (`round2.html:148`), 3 columns on desktop and 2 on phone (`round2.html:336`). The order is the same for everyone.
- Each tile: icon + overline title, current value with unit, a caption, and a step sparkline that holds each value until the next entry (`round2.html:292-303`, `round2.html:505-512`).
- Scrubbing a sparkline shows the entry in effect at the pointer (`round2.html:534-543`, changed by the owner): the big tile value and its unit switch to the scrubbed value, and the note shows the date of that entry. Pointer leave restores the current value and the resting note.
- W/kg is derived and not editable (`round2.html:298`). Without FTP or weight it shows `--` with "Add FTP" / "Add weight" / "Add FTP and weight" (`round2.html:228-234`, `round2.html:245`).
- Colours are the existing chart tokens (`round2.html:174-181`): HR `chartHr`, FTP `chartPower`, pace `chartPace`, weight `chartGrade`, W/kg `sportCycling` (`src/lib/tokens.ts:23`, `tokens.ts:27-28`, `tokens.ts:30`, `tokens.ts:34`). These are off the map, so CLAUDE.md §6 doesn't restrict them.
- **No toast at all.** Neither a tile save nor the card Save shows one. The outline that stays visible on the saved tile is the confirmation. The toast call (`useThresholdsForm.ts:213`), its import (`useThresholdsForm.ts:8`) and its two message keys go. `Toast.tsx` and `toastStore.ts` stay, because other features use them (`src/features/settings/DeleteAllDataDialog.tsx:13`, `src/features/sessions/hooks/useFileUpload.ts:6`).

### Owner changes and answers

- **No save-row label.** The pending summary "Gewicht -- → 52 · Änderungen zählen ab heute" (`round2.html:327`, `round2.html:329-333`) and the idle hint "Click a value to change it" (`round2.html:337`) are both gone.
- **Tile group title + subtitle instead of a hint.** The tile group gets its own title, "Your values over time" / "Deine Werte im Verlauf", and a short subtitle, "Tap a value to change it from today on." / "Tipp auf einen Wert, um ihn ab heute zu ändern."
- **Editing uses the overlay pattern from `plans/mobile-overlays.md`.** Clicking a tile opens a dialog: `DialogContent` + `DialogHeader` / `DialogBody` / `DialogFooter`, with the grabber and the central sizing on phone, both built into `DialogContent` by mobile-overlays; this plan adds no `SheetGrabber` by hand. On desktop it is the centred dialog, not a popover. The inline input in the tile (`round2.html:295-296`) is dropped.
- **Confirm saves immediately.** In Settings, the dialog's Save writes today's entry for that one value, the dialog closes and the tile keeps its outline. The card's Save button moves up next to gender and birth year, the only fields it still covers. On phone it sits right-aligned under the stacked fields. A divider separates that group from the tiles.
- **Onboarding tiles:** no date notes, since every value has only its first entry. Rest HR and Max HR are required, so their tile titles get the same asterisk as the old required label (`src/components/ui/Label.tsx:19-23`).
- **Sparkline height:** 32 px, the `StatTile` chart row.
- **One date format for every note** (owner, after an overflow repro at 390 px: relative captions and long scrub dates truncated): at rest and while scrubbing, `Intl.DateTimeFormat(getLocale(), { dateStyle: 'short' })`, output used as-is, e.g. `9/22/25` / `22.09.25`. No relative dates, no delta.
- **A date note only for an actual change:** a value with a single entry (entered once, in onboarding or first saved in Settings) shows no date; from its second entry on, the note is the date of the latest entry. Scrubbing still shows the date of the entry in effect.
- **Date-`0` values:** dated at the first session's date, else the profile's `createdAt` (the existing `displayDate`, `profileHistory.ts:31-34`).
- **W/kg has no back-fill:** it starts at the first date where both FTP and weight really have an entry.
- **The outline after a save stays** (as in the mockup, `round2.html:290`). It clears on the next edit or when the card unmounts.
- **Onboarding uses the tiles and the dialog too.**
- **Reuse `StatTile`** from `plans/stat-tile.md`: the caption is its inline `note` next to the value, and the sparkline is its chart row.
- **Sparkline:** hand-built SVG from a pure, unit-tested path function.
- **Race estimator:** `PaceEstimatorDialog` opens stacked on top of the pace dialog, and its result fills the pace input.

### Settled earlier, by variant A

- Step line, not smooth (`round2.html:507`).

## Dependencies and implementation order

1. **`plans/mobile-overlays.md`** builds `DialogHeader`, `DialogBody`, `DialogFooter`, `SheetGrabber`, the phone sizing rule and the grabber drag. None exist yet: `src/components/ui/Dialog.tsx:5-67` exports only Root, Trigger, Overlay, Content, Title and Description. It also migrates `PaceEstimatorDialog` (`src/features/settings/PaceEstimatorDialog.tsx:62-104`).
2. **`plans/stat-tile.md`** builds `StatTile`, which doesn't exist yet (`src/components/ui/StatItem.tsx` is still there).
3. **`plans/studio-route-export.md`** (studio export; no shared code with this plan, but it comes before it in the build order).
4. **This plan.** It extends `StatTile` with four optional props (see below).

The four plans run one after another in this order. All four edit `messages/en.json` and `messages/de.json` (mobile-overlays adds the grabber key `ui_sheet_drag_close`), so re-read both right before editing.

## Approach

### W/kg series: `src/packages/engine/wattsPerKg.ts` (new, pure)

- `wattsPerKgHistory(ftp: DatedValue<number>[], weight: DatedValue<number>[]) => DatedValue<number>[]`:
  - empty when either list is empty;
  - `start` = the later of the two earliest dates;
  - one entry per distinct date ≥ `start` where FTP **or** weight has an entry, sorted, value `valueAt(ftp, d) / valueAt(weight, d)`. From `start` on, both histories have a real entry at or before `d`, so `valueAt`'s earliest-entry fallback never kicks in (no back-fill).
- It works on raw dates, so two date-`0` entries start at `0`. FTP at `0` with weight first entered on 2026-03-08 starts on 2026-03-08.
- It is business logic, so it lives in the engine (CLAUDE.md §2 "Pure engine").

### Date note: `src/lib/formatters.ts`

- `formatShortDate(timestamp: number) => string`: a module-level `Intl.DateTimeFormat(getLocale(), { dateStyle: 'short' })` next to the other date formatters, output used as-is (memory rule "Format with Intl"). A thin wrapper, so no unit test (`tests/CLAUDE.md`).

### `src/lib/profileHistory.ts`

- Keep `displayDate` (`profileHistory.ts:31-34`), `profileHistorySeries` (`profileHistory.ts:36-46`) and `profileHistoryDomain` (`profileHistory.ts:48-58`).
  - The domain is shared by all six sparklines (`round2.html:221-226`) and is at least 30 days wide.
  - Add the mockup's 7 % right pad past today (`round2.html:225`) as a second value in the return, so the "today" mark and the last dot sit inside the box.
- Move `firstSessionDateOf` here from `ProfileHistoryChart.tsx:119-125`, unchanged.
- Add `sparklinePath(points, domain, box) => { line: string; lastDot: { x: number; y: number } | undefined; todayX: number }`:
  - the step path from `round2.html:496-512`: `M x y`, then `H x V y` per entry, then `H` to the right edge;
  - min = max pads the y-range so the line stays inside the box (`round2.html:501`);
  - empty points give `line: ''` and no dot.
- Delete `PROFILE_HISTORY_HOVER_GROUP` (`profileHistory.ts:3`) and `profileHistoryRows` (`profileHistory.ts:60-76`). The chart and rail were their only users, and scrubbing becomes local state in each tile.

### `src/components/ui/StatTile.tsx` (extend what stat-tile builds)

- Add four optional props:
  - `icon?: { icon: LucideIcon; color: string }`: a 12 px icon before the row-1 title, in that colour (`round2.html:288`);
  - `onClick?: () => void`: the root renders as a `button type="button"` with `text-left hover:bg-white/10 cursor-pointer` (`round2.html:298-299`); without it, the root stays a `div`. `onClick` and `metricId` never go together: the ⓘ from `metricId` is a button itself (`MetricLabel`), and a button inside the root button is invalid HTML. `StatTileProps` enforces it as a discriminated union, `{ metricId?: MetricId; relatedMetricIds?: MetricId[]; onClick?: never } | { onClick: () => void; metricId?: never; relatedMetricIds?: never }`, so passing both is a type error. The threshold tiles have no `metricId`;
  - `style?: React.CSSProperties` for the after-save outline (`box-shadow: 0 0 0 1px <color>aa`, `round2.html:290`);
  - `required?: boolean`: appends `<span aria-hidden className="ml-0.5">*</span>` to the title, the same markup as `src/components/ui/Label.tsx:19-23`.
- Nothing else changes. The chart row stays 32 px (stat-tile "Chart height lives in one place"), so the sparkline is 32 px tall instead of the mockup's 24 px. With `children` set, `note` sits inline after the value on its baseline, as the owner chose.

### `src/features/settings/ThresholdSparkline.tsx` (new)

- An SVG at the full size of the row, using `sparklinePath`. It draws:
  - the path at 1.5 px in the tile colour;
  - a dashed "today" mark;
  - a 2 px dot at the last value;
  - a halo on the new dot while the tile is `fresh` (`round2.html:520-528`);
  - with no history, a dashed baseline (`round2.html:492-494`).
- Pointer move scrubs: it reports the date under the pointer to its parent (`onScrub(date | null)`) and shows a guide line. Pointer leave reports `null`.
- `onClick` calls `event.stopPropagation()`, so scrubbing never opens the editor (`round2.html:546`). On a touch device a tap on the sparkline therefore doesn't open the editor; the value line and title do.

### `src/features/settings/ThresholdTiles.tsx` (new)

- Renders the six `StatTile`s for one source of values. It is used by Settings and Onboarding.
- Props:
  - `histories: Record<ThresholdTileKey, DatedValue<number>[]>`;
  - `fresh: ThresholdTileKey[]`;
  - `onEdit(key)`;
  - `mode: 'create' | 'update'`. In `create` scrubbing is off and Rest HR / Max HR pass `required`.
- `ThresholdTileKey` = `restHr | maxHr | ftp | thresholdPace | weight | wkg`.
- It reads `firstSessionDate` itself via `useSessionsStore` (as `ProfileHistoryChart.tsx:134` does); `src/features/CLAUDE.md` says to colocate store subscriptions.
- Per tile (`StatTile` props):
  - `title`: the tile title keys (i18n);
  - `icon`: per the colour list in Decisions; lucide `HeartPulse`, `Heart`, `Zap`, `Timer`, `Weight` as today (`ProfileHistoryChart.tsx:13`), plus `Gauge` for W/kg (`round2.html:180`);
  - `value` / `unit`: from `valueAt(history, today)`; `--` and no unit without history. While scrubbing, the value and unit of the entry in effect at the scrubbed date;
  - `note`: while scrubbing, `formatShortDate` of the entry in effect at the scrubbed date. Otherwise, with two or more entries, `formatShortDate` of the latest entry (with `displayDate` applied); with a single entry, nothing. Without history, the "Add …" caption on every tile (`round2.html:244-248`; Rest HR, Max HR and pace added by the owner), shown in onboarding next to the Rest HR / Max HR asterisk;
  - `children`: `ThresholdSparkline`;
  - `onClick`: `onEdit(key)` for every key except `wkg`;
  - `style`: the outline while `fresh` includes the key.
- Formatting: two `Intl.NumberFormat(getLocale(), …)` instances move from `ProfileHistoryChart.tsx:50-52`. A third has 2 decimals for W/kg (`round2.html:180`). Pace uses `formatPaceInput` (`src/lib/formatters.ts:115`).
- Grid: `grid grid-cols-2 lg:grid-cols-3 gap-2`, preceded by `<CardHeader title={m.ui_thresholds_tiles_title()} subtitle={m.ui_thresholds_tiles_subtitle()} />` (`src/components/ui/CardHeader.tsx:11-22`). It already renders a `title` heading over a `caption` subtitle with `mb-4` below (`CardHeader.tsx:37-42`), so it needs no new prop.

### `src/features/settings/ThresholdEditDialog.tsx` (new)

- One controlled dialog for the five editable values. Props:
  - `field: TextField | null` (`null` = closed);
  - `thresholds: ThresholdsForm`;
  - `onConfirm(field, value: string)`;
  - `onClose()`.
- Built only from the mobile-overlays pieces, with no sizing of its own:
  - **`DialogContent`** overrides `onOpenAutoFocus` to focus the input; the default prevents focus (`Dialog.tsx:40`).
  - **`DialogHeader`**: `title` is the existing field label (`ui_thresholds_ftp` "FTP (watts)" etc., `messages/en.json:29-32`, `en.json:42`), and `icon` is the tile icon.
  - **`DialogBody`** holds the `Input`, labelled by the title, with a local draft starting at today's value. `type="number"` for the HR, FTP and weight dialogs; the pace dialog uses `type="text"`. `helperText` shows the field's error, computed with the same rules as `fieldError` (`useThresholdsForm.ts:139-149`), including rest < max HR against the other stored value (`useThresholdsForm.ts:130-135`).
  - **Pace dialog:** also shows the "Estimate from a race time" link, moved from `ThresholdsSection.tsx:93-106`. It opens `PaceEstimatorDialog` stacked on top (a second `DialogRoot` rendered inside the pace dialog's content). `onSave` writes `formatPaceInput(sec)` into the draft (`ThresholdsSection.tsx:119-125`), and the pace dialog stays open.
  - **`DialogFooter`**: `ui_btn_cancel` and `ui_btn_save` (`en.json:6-7`). Save is disabled while the draft is empty or has an error.
- It is a `<form>`, so Enter confirms. The form wraps `DialogBody` and `DialogFooter` and follows the mobile-overlays form rule: `flex min-h-0 flex-col`, so the body stays the only scroller. Escape, the scrim and the grabber close without changes (there is no ✕ on phone).

### `src/features/settings/hooks/useThresholdsForm.ts`

- **Validation:** export a per-field check, `fieldErrorFor(field, draft, stored)`, built on `fieldError` (`useThresholdsForm.ts:139-149`), so the dialog and the form share one set of rules.
- **Update mode (Settings):**
  - add `saveField(field, value)`. It calls `useUserStore.getState().saveTodaysThresholds({ [key]: parsed })`, with pace parsed by `parsePaceInput` and the field mapped to its `ThresholdKey` (`src/store/user.ts:10`). It returns the saved key for the outline and shows no toast;
  - `dirty` / `valid` / `save` cover only `gender` and `birthYear` (`useThresholdsForm.ts:228-230`, `useThresholdsForm.ts:207-214`). `saveChanges` stops calling `saveTodaysThresholds` with `datedChanges`, and the `toast(…)` call (`useThresholdsForm.ts:213`) and the `toast` import (`useThresholdsForm.ts:8`) are deleted.
- **Create mode (Onboarding):** there is no profile to write to yet, so confirming the dialog calls `setField(field, value)` (`useThresholdsForm.ts:237-239`). The profile gate still creates the profile with date-`0` entries (`useThresholdsForm.ts:184-205`), and `valid` stays all-field (rest and max HR required, `useThresholdsForm.ts:115-119`).
- **Delete what becomes dead:** `datedChanges` (`useThresholdsForm.ts:163-177`) and `DATED_NUMBER_FIELDS` (`useThresholdsForm.ts:24`), once update mode no longer uses them.

### `src/features/settings/ThresholdsSection.tsx`

- **`ThresholdsSection`** (`ThresholdsSection.tsx:137-151`):
  - `CardHeader` as today (`ThresholdsSection.tsx:142`);
  - **profile row**: gender and birth year (`ThresholdsSection.tsx:48-66`) plus the Save button in one row, `grid sm:grid-cols-[1fr_1fr_auto] items-end gap-3`. Below `sm` the fields stack and Save sits right-aligned under them (`justify-self-end`). Save keeps `disabled={!dirty || !valid}`; the old footer row (`ThresholdsSection.tsx:144-148`) goes;
  - a divider, `border-t border-white/10 my-4`;
  - `ThresholdTiles` with the store histories (`profile.thresholds.*`, `profile.weight`, and `wattsPerKgHistory` for W/kg) and `fresh` from local state. `saveField` adds its key, plus `wkg` when FTP or weight changed and W/kg exists (`round2.html:606`). Opening another editor clears `fresh`;
  - `ThresholdEditDialog`, confirming through `saveField`.
- **`OnboardingThresholds`** (`ThresholdsSection.tsx:130-135`):
  - the gender and birth-year fields without Save (`e2e/onboarding.spec.ts:18` expects no Save button), the divider, `ThresholdTiles` and the dialog, then the onboarding note (`ThresholdsSection.tsx:133`);
  - the histories come from the staged form, one entry each at `0` per filled field (the same shape `createProfile` writes), so the value line, W/kg and the "Add …" captions work before a profile exists;
  - `ThresholdTiles mode="create"`: no scrubbing, and an asterisk on Rest HR and Max HR;
  - the dialog confirms through `setField`; `fresh` stays empty.
- **`ThresholdsFields`** (`ThresholdsSection.tsx:24-128`) shrinks to the gender and birth-year fields. The rest/max/FTP/pace/weight inputs (`ThresholdsSection.tsx:67-116`) and `numberInput` for them go.

### `src/pages/SettingsPage.tsx`

- Delete the import (`SettingsPage.tsx:20`) and `<ProfileHistoryChart />` (`SettingsPage.tsx:58`). The wrapper at `SettingsPage.tsx:56-59` keeps only `ThresholdsSection`.

### Removal (dead after this change)

- `src/features/settings/ProfileHistoryChart.tsx` and `src/features/settings/ProfileHistoryRail.tsx` (both whole files).
- `PROFILE_HISTORY_HOVER_GROUP` and `profileHistoryRows` (`profileHistory.ts:3`, `profileHistory.ts:60-76`), with their tests (`tests/lib/profileHistory.spec.ts:85-115`).
- `datedChanges` and `DATED_NUMBER_FIELDS` in `useThresholdsForm.ts` (see above).
- `ui_profile_history_title` / `_subtitle` (`messages/en.json:51-52`, `messages/de.json:51-52`).
- These stay because other code uses them: `ui_rail_latest` (`src/features/dashboard/PerformanceChart.tsx:53`), `StatRail`, `ChartsCard`, `formatDashboardDate`, `useChartHoverStore`.

### Layout at 1440×800

- Estimated desktop card height:
  - header 44
  - profile row 64
  - divider 33
  - group title and subtitle 40
  - two tile rows: 2 × 110 + 8
  - total ≈ 410 px, against ≈ 300 (form) + ≈ 345 (chart card) today.
- The card fits the first viewport at 1440×800. Check it with a screenshot (Verification).

## i18n (`messages/en.json`, `messages/de.json`)

**Renamed** (the tabs are gone, and the strings become tile titles):

| Old key                                  | New key                      | EN      | DE        |
| ---------------------------------------- | ---------------------------- | ------- | --------- |
| `ui_profile_history_tab_rest_hr` (`:55`) | `ui_thresholds_tile_rest_hr` | Rest HR | Ruhepuls  |
| `ui_profile_history_tab_max_hr` (`:56`)  | `ui_thresholds_tile_max_hr`  | Max HR  | Max. Puls |
| `ui_profile_history_tab_ftp` (`:53`)     | `ui_thresholds_tile_ftp`     | FTP     | FTP       |
| `ui_profile_history_tab_pace` (`:54`)    | `ui_thresholds_tile_pace`    | Pace    | Tempo     |
| `ui_profile_history_tab_weight` (`:57`)  | `ui_thresholds_tile_weight`  | Weight  | Gewicht   |

**New** (proposed copy, warm and direct per `messages/CLAUDE.md`; "tap" covers clicking too, as in "Tap a value" elsewhere in fitness apps):

| Key                            | EN                                      | DE                                              |
| ------------------------------ | --------------------------------------- | ----------------------------------------------- |
| `ui_thresholds_tiles_title`    | Your values over time                   | Deine Werte im Verlauf                          |
| `ui_thresholds_tiles_subtitle` | Tap a value to change it from today on. | Tipp auf einen Wert, um ihn ab heute zu ändern. |
| `ui_thresholds_tile_wkg`       | W/kg                                    | W/kg                                            |
| `ui_thresholds_add_rest_hr`    | Add resting HR                          | Ruhepuls eintragen                              |
| `ui_thresholds_add_max_hr`     | Add max HR                              | Max. Puls eintragen                             |
| `ui_thresholds_add_ftp`        | Add FTP                                 | FTP eintragen                                   |
| `ui_thresholds_add_pace`       | Add pace                                | Tempo eintragen                                 |
| `ui_thresholds_add_weight`     | Add weight                              | Gewicht eintragen                               |
| `ui_thresholds_add_ftp_weight` | Add FTP and weight                      | FTP und Gewicht eintragen                       |

**Removed:** `ui_thresholds_saved_title` / `ui_thresholds_saved_desc` (`messages/en.json:45-46`, `messages/de.json:45-46`). Grep shows their only user is `src/features/settings/hooks/useThresholdsForm.ts:213`, and the only check for the text is `e2e/onboarding.spec.ts:77`; both go.

**Unchanged:** the field labels (`en.json:29-32`, `en.json:42`), `ui_thresholds_save` (`en.json:44`, the moved card button), `ui_btn_cancel` / `ui_btn_save` (`en.json:6-7`) and `ui_thresholds_onboarding_note` (`en.json:47`).

## Tests (per `tests/CLAUDE.md`)

- **Unit, new `tests/engine/wattsPerKg.spec.ts`:**
  - empty when FTP or weight is missing;
  - an FTP-only change, a weight-only change, and both on one day each give one entry;
  - **no back-fill**: FTP since 2024 and weight first on 2026-03-08 give a first entry on 2026-03-08;
  - both at date `0` start at `0`.
- **Unit, `tests/lib/profileHistory.spec.ts`:**
  - delete the `profileHistoryRows` block (`profileHistory.spec.ts:85-115`);
  - update the two `profileHistoryDomain` cases to the changed return: `tests/lib/profileHistory.spec.ts:72` and `profileHistory.spec.ts:81` assert `toEqual([from, today])` and gain the right pad;
  - add `sparklinePath`: a single entry is a flat line to the right edge; two entries step at the second date; min = max stays inside the box; empty gives no line.
- **No new store test:** the same-day replace is covered (`tests/store/userStore.integration.test.ts:34`) and the persisted shape doesn't change.
- **E2E helper, `e2e/helpers/thresholds.ts` (new):** `setThreshold(page, tileTitle, value)` clicks the tile, fills the dialog input and confirms. It replaces the `page.fill('#thresh-…')` calls in:
  - `e2e/onboarding.spec.ts:16-17`, `onboarding.spec.ts:56` and `onboarding.spec.ts:63`;
  - `e2e/zipUpload.spec.ts:17-18` and `zipUpload.spec.ts:32-33`;
  - `e2e/intervals.spec.ts:54-55`.
    The "thresholds gone" checks (`e2e/onboarding.spec.ts:11-12`, `onboarding.spec.ts:27`, `e2e/intervals.spec.ts:64`) switch to the Rest HR tile.
- **E2E, `e2e/onboarding.spec.ts:48-64`** ("upload button is disabled until thresholds are valid"): the invalid max HR at `onboarding.spec.ts:59-60` now happens inside the Max HR dialog. Typing `40` shows "Min 120 bpm" there and disables the dialog's Save; Cancel closes it, and the upload button stays disabled.
- **E2E, rewrite `e2e/onboarding.spec.ts:67-91`** ("changing FTP in settings saves it as today's entry"). It is the existing Settings journey, so it is updated rather than given a sibling:
  - seed and go to `/settings` as today (`onboarding.spec.ts:68-69`); Rest HR shows `50`;
  - click the FTP tile: a dialog titled "FTP (watts)" opens with the input focused. Type `280` and Save: the dialog closes, the FTP tile shows `280` with no date note (its first entry) and carries the outline. No toast appears; the toast assertion at `onboarding.spec.ts:76-78` goes;
  - the Profile history checks (`onboarding.spec.ts:80-84`) go with the chart;
  - W/kg shows `--` and "Add weight". Set Weight to `75`: W/kg shows `3.73`;
  - set Rest HR to `52`: its second entry, so the tile shows today's short date;
  - reload: the FTP tile still shows `280`, and the card Save is disabled. The `Cancel` count check (`onboarding.spec.ts:90`) stays.
- **E2E phone:** a `test.describe` in the same spec at 390×844. Opening a tile shows the floating card (x ≈ 8, right ≈ 382). Tapping the grabber ("Drag to close") closes it without changing the value. The card's geometry is already guarded by the mobile-overlays e2e; this only proves the editor uses it.

## Verification

```bash
vp check
vp test -- --run
vp exec playwright test
vp build
```

By hand: use a temporary Playwright script with its own `webServer` on a free port (not 5173) and demo data from the onboarding test-data tile. Delete the script and screenshots afterwards.

- **1440×800, EN and DE:**
  - the whole thresholds card is visible without scrolling;
  - the tiles have equal height;
  - no note has `scrollWidth > clientWidth`, including the scrub date next to a scrubbed value.
- **390×844:**
  - two tile columns; the profile row stacks, with Save right-aligned under it;
  - tapping a tile opens the floating card; scrubbing a sparkline doesn't open it;
  - from the pace dialog, the estimator opens on top and its result lands in the pace input.
- **Onboarding, FIT path and intervals path:** the tiles start at `--`; after Rest and Max HR are set, the upload or import button enables.
- **Mockup scenarios** (`round2.html:97-102`): a new user without weight, one entry each, two years of changes, no FTP. Compare against variant A.
- **Date notes** for a value with one entry (none) and for changes from today, last week, three months and two years ago, in EN and DE.
