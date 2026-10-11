# Filter query: typos, dates, durations, name search, stable layout

**Runs before `plans/mobile-touch.md`.** This plan owns the parser, the criteria/store shape and everything inside `FilterList`. `mobile-touch.md` owns the container around it (`Dock.tsx` card → `ResponsivePopover` dialog, `useDismiss`, Escape in the sheet) and the fine-pointer swap in `FilterList.tsx`. See "Interaction with mobile-touch".

## Context

- Parser: a word scan in `src/lib/filterGrammar.ts`: `tokenize` (`:92`), classify loop (`:255-314`), bare-number guesses (`:217-244`), readings with 0 matches dropped (`:363`). Sports match by exact word or prefix only (`:121-128`), so `runing`, `cyclng`, `biking` and `radfahrt` give nothing.
- Probe results (`2026-10-11`, ~2,900 synthetic sessions):
  - `today`, `heute`, `yesterday`, `this week`, `diese woche` and `this month` → nothing.
  - `since march` / `seit märz` → March only, not March until now.
  - `1:30` → `last 30 days · about 1 km`, …; `1h30` → `about 30 km · about 1 h`.
  - `2 h 30 min` → `about 30 min` (the second duration overwrites the first, `:273`).
  - `10 mi` → `about 10 min` (`mi` prefix-matches `min`, `:115-117`).
  - `1 year` → `about 1 km || about 1 h || last day`.
  - `last 2 years` → `last 2 days || weeks || months`.
- `m` is metres of climb (`:38`). `mo` is months (`:41`). Hard caps: `UNIT_LIMITS` (`:77-82`) and `RELATIVE_LIMITS` (`:84`) silently drop explicit values too.
- "Not understood" and "no sessions match" both end as an empty tile list (`FilterList.tsx:63-89`). Nothing tells the user which one happened.
- Layout shift: in the mobile card the list is `max-h-[252px]` (`FilterList.tsx:60`) and the card is bottom-anchored above the dock (`Dock.tsx:82-93`). When the list shrinks, the card shrinks and the input at its top moves down. On desktop the rail card is full height (`Dock.tsx:58-68`, `sizing="fill"`), so the input stays put today.
- `FilterCriteria` (`savedFilters.ts:13-19`) has one sport, one time and approximate distance, duration and elevation. It has no name. `filterKey` is at `:71-78`.
- `TrainingSession.name` is optional (`engine/types.ts:38`). It is stored only from intervals.icu or the file name (`parsers/fit.ts:221`). The "Morning Run" title is computed at display time (`sessionTitleFormatter.ts:50-56`) and is never stored.
- Store: auto-save keeps up to 15 filters (`store/filters.ts:77-86`), persist `version: 3` (`:115`). `migrateFilters` (`:40-55`) currently resets the saved filters on every migration.

## Decisions (settled)

- **Variant A, parser only.** The UI keeps today's interpretation tiles. No chips, no builder, no autocomplete, no hint row with examples. No comparisons, ranges, OR or NOT.
- **Placeholder** (`ui_filter_builder_placeholder`):
  - EN `e.g. ride this month 50 km`
  - DE `z. B. Rad diesen Monat 50 km`
  - Both show a sport, the new date phrase and a unit, and both fit the 256 px rail.
- **Feedback row** under the input, shown only when there is something to say:
  - `Did you mean {word}?`, with `{word}` a button that replaces the typo in the input. Typos are suggested, never auto-corrected.
  - `Not understood: {words}`.
  - Suggestions come first. Both share one truncated line.
- **Two empty states in the list:**
  - Words read, 0 sessions: "No sessions match" plus `filterName` of the first reading.
  - Nothing read: "Not understood" plus a one-line help text.
- **No layout shift**, on mobile or desktop. The list area of `sizing="content"` gets a fixed height (`h-[252px]`, today's max). The feedback row lives inside that area, so the input never moves while typing, on suggestions, on not understood, on no match or with an empty field. Desktop keeps `fill`, and the row sits inside the flex-1 area there too.
- **Typos:** Damerau-Levenshtein distance against the sport and date keywords (DE + EN). The word needs 4+ letters. Allowed: 1 edit for 4–5 letters, 2 edits for 6+. A word found in a session name is never treated as a typo.
- **New synonyms:** real words get added instead of suggested: `biking`, `biken`, `cycle`, `radtour`, `radfahrt`, `rennrad`, `jogging`. So `biking` and `radfahrt` from the brief match directly. True typos (`runing`, `cyclng`, `laufn`, `radfaren`) get the suggestion.
- **Dates:**
  - `today`/`heute` and `yesterday`/`gestern`.
  - `this week`/`diese Woche` and `this month`/`diesen Monat`. Calendar periods, weeks start Monday.
  - `since <month> [year]`/`seit <Monat> [Jahr]`, also `since 2025`/`ab`/`from`. From day 1 of that month or year until now. The year is inferred like a month today (`:319-325`).
  - `last week / month / year` = rolling 7 / 30 / 365 days, so they dedupe against the default "last 7/30 days" filters. Same in German: `letzte Woche`, `letzten Monat`, `letztes Jahr`.
  - `last N years` (N ≥ 2) → relative years. `1 year` → 365 days.
  - Calendar year `2025`, month names and month ranges stay unchanged.
  - Persisted `calendarYear yearsAgo: 1` filters keep working. Their label becomes the year number (`2025`), because "last year" now means the rolling 365 days.
- **Durations:**
  - `h:mm` (`1:30`, `1:30 h`).
  - Compound forms (`1h30`, `1h30m`, `1 h 30`, `2 h 30 min`, `1 std 30 min`): an hour value followed by a number with an optional `min`/`m` adds up. `m` directly after an hour value means minutes. Anywhere else it means metres of climb, as today.
- **Second value for a taken slot:** the first value wins. The later phrase goes into "Not understood" (`1 h 90 min` → `about 1 h`, not understood `90 min`).
- **Miles:** `mi`, `mile(s)` and `meile(n)` are converted to km (×1.609, rounded to 0.1 km, label "about 16.1 km"). Only an exact unit word matches. `mi` never prefix-matches `min`.
- **Caps** (`UNIT_LIMITS`, `RELATIVE_LIMITS`) apply only to bare-number guesses. An explicit value is taken as long as it is > 0 and relative ranges stay ≤ 10 years. If nothing matches, that is "no match", not "not understood". `m` keeps its ≥ 50 floor because it is ambiguous.
- `10 km` stays "about 10 km" (`attributeFilters.ts:6-10` tolerances unchanged).
- **Name search (implicit):**
  - Each leftover word, after the grammar and a small stopword list (`in`, `im`, `the`, `and`, `und`, `mit`, `with`, `von`, `for`), becomes a name word if some recorded session's stored `name` contains it. The match is case- and accent-insensitive, as a substring.
  - Otherwise the word is a typo suggestion if one is close enough, or else "Not understood".
  - The criterion `name` holds the words in typed order. A session matches when its name contains all of them.
  - Fallback titles ("Morning Run") are not stored, so they are not searchable.
- **Saved filters keep `name`.**
  - `FilterCriteria.name: string | null` and `filterKey` include it.
  - Persist v3 → v4 with `migrate`: v3 state keeps its saved filters, active filter, grouping and metric, with `name: null` added. Each entry is validated with Zod and invalid entries are dropped. An empty result falls back to the defaults. The v1/v2 paths stay as they are.
- No new libraries. The parser stays in `src/lib` (it is filter UX, not domain logic), with arrow functions, named exports and no ternaries in `.ts`.

## Approach

### Time model: `src/lib/timeRange.ts`

- `FilterTimeUnit` (`:1`) gains `'year'`. `relativeStart` (`:33-46`) adds a year branch (`new Date(year - amount, month, day + 1)`).
- `FilterTime` (`:5-8`) gains two kinds:
  - `{ kind: 'calendar'; unit: 'day' | 'week' | 'month'; ago: number }` covers today, yesterday (`day`, 1), this week and this month.
  - `{ kind: 'since'; from: string }`.
- `unclampedRange` (`:48-57`):
  - `calendar`: start of the day, the Monday or the 1st, shifted back by `ago`; end at the end of that period. `resolveFilterRange` already clamps to today.
  - `since`: from `from` to the end of today.
- `src/lib/dashboardVolume.ts:65-69`: `calendar` and `since` count as calendar time, like month ranges.

### Criteria: `src/lib/savedFilters.ts`

- `FilterCriteria` (`:13-19`) and `emptyCriteria` (`:33-39`) get `name: string | null`. `isEmptyCriteria` (`:41-44`) checks it. `filterKey` (`:71-78`) appends it. `timeKey` (`:58-69`) handles `calendar` and `since`.
- `FilterSession` (`:28-31`) adds `'name'`. `matchesFilters` (`:80-100`) checks `criteria.name` with a shared `normalizeText` (lowercase, NFD, diacritics stripped) exported from `filterGrammar.ts` or a small `src/lib/normalizeText.ts`.
- `FilterPartKind` (`:26`) gets `'name'`. `filterParts` (`:180-209`) adds the name part (`m.ui_filter_name({ value })` → `“{value}”` / `„{value}“`).
- `timeLabel` (`:135-166`):
  - `calendar` → today / yesterday / this week / this month.
  - `since` → `m.ui_filter_since({ date })` with `{ month: 'long', year: 'numeric' }`, or the year alone when `from` is Jan 1.
  - Relative `year` → `ui_filter_last_years`.
  - `calendarYear yearsAgo: 1` → the year number. `ui_filter_last_year` is then unused and gets deleted.
- `src/features/filters/filterIcon.ts:5-10`: `name` → `TextSearch`.

### Parser: `src/lib/filterGrammar.ts` (split vocabulary into `src/lib/filterVocabulary.ts`)

- `filterVocabulary.ts`: `KEYWORDS` (`:21-58`) plus the new words: dates (`today`, `heute`, `yesterday`, `gestern`, `since`, `seit`, `ab`, `from`, `this`/`diese(n|s|m)`), years (`years`, `jahre`, `jahren`), miles, synonyms, stopwords. It also holds `MONTH_NAMES` (`:64-75`) and `editDistance` (Damerau, early exit above 2).
- `tokenize` (`:92-102`):
  - Strip quotes (`"“”„'`) so the name labels read back.
  - Keep `h:mm` as one token (do not split on `:`).
- `unitOf` (`:104-119`): add `mi` and `y` (years) as exact-only units. The prefix lookup never maps a word that is an exact unit of another kind (`mi`).
- Classify loop (`:255-314`):
  - Each token is either consumed or pushed to `leftover` (with its original spelling for the replacement).
  - New branches: `h:mm`; compound hours (look ahead after an `h` quantity); `today`/`yesterday`; `this|diese* week|month`; `since|seit|ab|from <month|year>`; `last N years`; number + year unit.
  - `last|letzte* week|month|year` → `relative 7/30/365 day`.
  - A slot that is already set sends the new phrase to `leftover`, instead of overwriting at `:268` and `:273`.
- Leftover classification, after the loop:
  - stopword → drop
  - word in some session name → `name`
  - `editDistance` within the threshold to a sport/date keyword → `suggestions`
  - else → `unknown`
- Caps (`:77-84`) move into `alternativesFor` (`:217-244`) only. The explicit paths use `> 0` and ≤ 10 years.
- `interpretFilterText` (`:347-372`) returns `FilterReading`:
  - `interpretations: FilterCriteria[]` (≤ 3, as today, only readings that match)
  - `understood: FilterCriteria | null` (first non-empty reading before the match check)
  - `unknown: string[]`
  - `suggestions: { word: string; replacement: string }[]`
- `GrammarSession` (`:11-14`) adds `'name'`.

### UI: `src/features/filters/`

- `hooks/useFilterBuilder.ts:13-16`: hold the `FilterReading` and expose `interpretations` from it. New `applySuggestion(s)` replaces the first case-insensitive whole-word `s.word` in `text` with `s.replacement` and keeps focus in the input.
- New `FilterFeedback.tsx`: one `h-8` row with `SpellCheck` + "Did you mean <button>{replacement}</button>?" and `CircleAlert` + `text-status-warning` "Not understood: …", truncating. Plus a small centered empty state (icon, title, description) for the two list states. It has one user, so it stays in the feature and is not added to `components/ui`.
- `FilterList.tsx:53-89`:
  - Wrap the list in a fixed-height column: `sizing="content"` → `h-[252px]`, `fill` → `min-h-0 flex-1`.
  - Inside: the feedback row (`shrink-0`, only when there are suggestions or unknowns), then the scroll list (`min-h-0 flex-1 overflow-y-auto`).
  - When `text !== ''` and there are no tiles, render the empty state: `understood !== null` → no match, else → not understood.
  - Keep `data-testid="filter-builder-tiles"` and `aria-live` on the tiles group, and put `aria-live="polite"` on the feedback row.

### Store: `src/store/filters.ts`

- `version: 4` (`:115`).
- In `migrateFilters` (`:40-55`), for `fromVersion === 3`, `safeParse` four Zod schemas next to the store:
  - `savedFilters`: array of `{ id, criteria }`. Each item is parsed on its own, failures are dropped and `name: null` is added.
  - `activeFilter`: criteria or null.
  - `loadChartGroupBy`.
  - `volumeChartMetric`: enum from `VOLUME_METRICS`.
- An empty saved list → `createDefaultSavedFilters()`.
- `setDashboardChartRange` (`:88-94`) needs no change, because `emptyCriteria` carries `name`.

### Messages: `messages/en.json`, `messages/de.json`

| key | en | de |
| --- | --- | --- |
| `ui_filter_builder_placeholder` | e.g. ride this month 50 km | z. B. Rad diesen Monat 50 km |
| `ui_filter_did_you_mean` | Did you mean {word}? | Meintest du {word}? |
| `ui_filter_not_understood` | Not understood: {words} | Nicht verstanden: {words} |
| `ui_filter_not_understood_title` | Not understood | Nicht verstanden |
| `ui_filter_not_understood_desc` | Try a sport, a date, a distance, a duration or a session name | Probier eine Sportart, ein Datum, eine Strecke, eine Dauer oder einen Namen |
| `ui_filter_no_match_title` | No sessions match | Keine passenden Einheiten |
| `ui_filter_today` / `_yesterday` | today / yesterday | heute / gestern |
| `ui_filter_this_week` / `_this_month` | this week / this month | diese Woche / diesen Monat |
| `ui_filter_since` | since {date} | seit {date} |
| `ui_filter_last_years` | last {count} years | letzte {count} Jahre |
| `ui_filter_name` | “{value}” | „{value}“ |

The `ui_filter_last_year` key gets deleted. Run `vp build` before `vp check` (Paraglide).

## Interaction with mobile-touch

- **This plan changes:** `filterGrammar.ts`, `filterVocabulary.ts`, `savedFilters.ts`, `timeRange.ts`, `dashboardVolume.ts`, `store/filters.ts`, `useFilterBuilder.ts`, `FilterList.tsx` (list area, feedback, empty states), `FilterFeedback.tsx`, `filterIcon.ts`, messages.
- **This plan leaves alone:** `Dock.tsx`, `DockItems.tsx`, `useDismiss`, the Escape listener (`useFilterBuilder.ts:25-41`), and the fine-pointer query in `FilterList.tsx:6,13,24`.
- **What `mobile-touch.md` must assume afterwards:**
  - `FilterList` with `sizing="content"` has a fixed height (input row + 252 px). The sheet must not add its own `max-h` or scroll around it. The dialog height is then constant, so the input in the sheet stays still.
  - The fine-pointer lines in `FilterList.tsx` have moved. Re-locate them by content.
  - The feedback row's suggestion button is inside the dialog, so clicks on it are inside clicks.
  - The new mobile e2e test (below) finds the input by label only. It must stay green once the card becomes a dialog. Measure after the sheet's open animation.

## Tests

- `tests/lib/filterGrammar.spec.ts`:
  - Adapt the existing cases to `FilterReading` (`.interpretations`) and `name: null`. Change `xyz` to expect `unknown: ['xyz']` and `understood: null`, and `bike 2 km` to expect `interpretations: []` with `understood` set.
  - "suggests the sport for a typo and never applies it": `runing`, `cyclng`, `laufn`, `radfaren` → suggestion, no sport set.
  - "reads synonyms": `biking`, `radfahrt`.
  - "reads calendar dates": `today`, `heute`, `yesterday`, `this week`, `diese woche`, `this month`, `diesen monat`, with `NOW` fixed.
  - "since a month runs until now": `since march`, `seit märz 2025`, `since nov` → previous year, `since 2025`.
  - "last week/month/year are rolling": `last week` = 7 days, `letzten monat` = 30, `last year` = 365, `last 2 years` = 2 years, `1 year` = 365 days.
  - "reads h:mm and compound durations": `1:30`, `1h30`, `1h30m`, `2 h 30 min` (regression: the second duration overwrote the first), `1 h 90 min` → `1 h` with `90 min` unknown.
  - "10 mi is miles, not minutes" (regression) → 16100 m.
  - "1 year is not the last day" (regression).
  - "leftover words search session names": sessions with names `Bad Herrenalb Trailrunning` and `Isar intervals`. `herrenalb` → name. `isar run` → name + sport. `herrenalb` is never suggested as a typo. `xyzzy` → unknown.
  - Round-trip list (`:111-126`) adds `calendar` (day/week/month), `since`, relative years, miles distance and a name filter, in both locales.
- `tests/store/filters.spec.ts`:
  - "v3 keeps saved filters and adds an empty name": a v3 state with 2 valid filters, 1 broken entry, an active filter and `volumeChartMetric`. The 2 survive with `name: null`, the broken one is dropped, and the active filter and metric are kept.
  - Add v3 unrecognised (`null`, `'broken'`) to the existing fallback case (`:146-155`).
- `e2e/filters.spec.ts`:
  - Add a named session to `beforeEach`.
  - New: "tells not understood apart from no match and keeps the input in place". Record the input box when empty, then fill `run` (tiles), `runing` (Did you mean → click → `running`), `xyzzy` (Not understood), `ride 5 km` (No sessions match) and a name word (tile with the name). After each step, `y` and `height` equal the first box (±1 px).
- `e2e/mobile/map.spec.ts`: new test "filter input stays in place while typing". Same states, input found via `getByLabel(/describe a filter/i)`, not via `[data-dock-card]`.

## Verification

`vp build` (Paraglide), `vp check`, `vp test -- --run`, `vp exec playwright test`, `vp build`.

By hand, on desktop and in phone emulation:
- type `runing` and tap the suggestion
- type `herrenalb` with an intervals.icu session
- `since march`, `1:30`, `10 mi`
- the input never moves between states
- an old saved filter list survives the reload, which runs the migration

## Affects other plans

- `plans/mobile-touch.md`:
  - `FilterList.tsx:6,13,24` and `useFilterBuilder.ts:25-41` line refs shift.
  - The sheet must keep `FilterList sizing="content"` at its fixed height (no extra max-h/scroll).
  - Its rewritten mobile filter test (`e2e/mobile/map.spec.ts:195`) sits next to the new input-stability test, which must keep passing with the dialog.
- `plans/demo-data.md:49`: "last year" in the grammar now means the last 365 days. A calendar "last year" is typed as the year (`2025`). Wording only.
- `plans/readme-banner.md:33,67`: "ride 90 days 50 km" still parses the same. Optional: a name word (`starnberger`) could now be shown.
