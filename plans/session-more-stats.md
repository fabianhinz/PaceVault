# Session "More stats" row

**Replaces `plans/calorie-estimate.md`.** Its calorie research, formulas, body data, settings, engine design and tests carry over unchanged unless noted here. Its row design (variant C, stat strip, max power) is dropped. Visual source of truth: `mockups/session-stats/index.html` (the notes panel holds the copy drafts); the owner decisions below override the mockup where they differ (no loading state, decoupling from 60 min, peak value under 20 min).

Scope includes **dated histories for every body/threshold value** (weight, resting HR, max HR, FTP, threshold pace). Every session uses the values in effect on its date. The settings UI is settled: the current-values form first, then one "Profile history" chart row (see "Settings UI").

## Context

- Summary rows: `src/features/sessions/session/SessionSummaryCard.tsx:19-21` (weather, training effect, laps). Training effect is computed on the fly from `records` + profile (`src/features/sessions/session/TrainingEffectCard.tsx:129-138`); the new row does the same.
- Row: `CollapsibleListItem` (`src/components/ui/Collapsible.tsx:63-105`). Tile look: `src/components/ui/CardGrid.tsx:47`. Track look: `src/components/ui/SplitBar.tsx:23-31`. ⓘ: `MetricLabel` with `iconOnly` (`src/components/ui/MetricLabel.tsx:35-36`).
- Reusable pieces: moving time `movingSeconds` (`src/lib/movingTime.ts:37-58`); IF inside `calculateTSS` (`src/packages/engine/stress.ts:36`, not exported); HR zone bands `zoneScale` / `bandAt` (`src/lib/zoneColors.ts:114-137`, `:132-135`) with `HR_ZONE_DEFS` colours (`src/packages/engine/zoneDistribution.ts:4-10`); 10 s gap rule `MAX_MOVING_PAIR_GAP_S` (`src/packages/engine/normalize.ts:10`, unexported); `isMovingPair` (`normalize.ts:41-46`); GAP pair rule (`normalize.ts:56-68`) and `gradeAdjustedPaceFactor` (`normalize.ts:36-39`); peak windows `findPeakAverage` / `extractPeakPower` (`src/lib/records.ts:52-70`, `:77-89`); durations `formatRaceTime` (`src/lib/formatters.ts:72`), pace `formatPace` (`src/lib/formatters.ts:110`).
- `summarizeValues` (`src/lib/seriesSummary.ts:8`) averages per sample, so it is **not** used for any average here. Every average and total is weighted by `dt`.
- Records and stores are ready before the summary card renders (`src/pages/SessionDetailPage.tsx:49-51`, `src/main.tsx:25-32`), so the row needs no loading state.
- Smart recording: `e2e/fixtures/cycling.fit` has 1–9 s record intervals (1076 records, mostly 1–8 s) but no power or cadence. `e2e/fixtures/running.fit` is 1 Hz with cadence (avg 77.8 strides/min, about 156 spm), HR, GPS and running power.
- Stored NP and TSS:
  - NP is computed only when FTP is set at import (`src/parsers/fit.ts:172-185`), else the device value is stored (`src/parsers/fit.ts:220`).
  - On reparse, `reprocessSessions` takes the new NP (`src/features/sessions/reprocessSessions.ts:33`) but keeps the stored `tss` / `stressMethod` (`:38-39`).
  - `recomputeFromRecords` (`:72-88`) covers sessions without a stored FIT and touches neither NP nor TSS.
  - Thresholds today are single values (`src/types/index.ts:20-25`). The `store-user` key is at `version: 2` (`src/store/user.ts:75`). `e2e/helpers/seed.ts:71-83` writes flat v1 profiles.
  - CTL/ATL/TSB derive from the sessions store on render (`src/hooks/useMetrics.ts:13-15`), so corrected TSS flows through without a separate migration.
  - Personal bests are computed on demand in a worker and cached only in memory (`src/features/records/hooks/usePersonalBests.ts:48-55`).

## Decisions (settled)

### Row

- New `CollapsibleListItem`, the **last** row of `SessionSummaryCard`, after `LapsRow` (`SessionSummaryCard.tsx:21`). `data-testid="session-stats-row"`.
- Avatar: lucide `ChartNoAxesColumn`, 20 px, `shrink-0 text-text-secondary` (as `src/features/sessions/session/WeatherCard.tsx:150`).
- Primary: "More stats" / "Weitere Werte".
- Secondary: the topics of the visible cells, in this fixed order: Calories · Power · Stride · Zones · Decoupling (DE: Kalorien · Leistung · Schritt · Zonen · Drift). Moving time is not a topic. Topic per cell: calories → Calories; work, IF, VI, peak power, coasting → Power; step length → Stride; HR zones → Zones; decoupling → Decoupling.
- **No loading state.** There is no disabled skeleton branch; the row renders its cells right away from a synchronous `useMemo`.
- No visible cell (fewer than 2 records): the row is not rendered.

### Grid and cell

- `grid grid-cols-2 lg:grid-cols-3 gap-3`.
- **Tile class:** a shared `tileClass = 'rounded-xl border border-white/10 bg-white/5'` in `src/components/ui/Card.tsx`, next to `glassClass` (`:3`). Padding stays at each call site. It is used by:
  - `StatCell` (`p-3`);
  - `src/components/ui/CardGrid.tsx:47`;
  - `src/features/labs/WorkoutExpansionPanel.tsx:18`;
  - `src/features/trips/ManageTripDialog.tsx:44`;
  - `src/features/trips/TripFormDialog.tsx:114`.
- Cell `flex h-28 min-w-0 flex-col gap-1`, four slots, always rendered, so there is no layout shift:
  - label `h-4`: overline (truncate) + `MetricLabel size="sm" iconOnly`;
  - value `h-7`: h3 (tabular, truncate) + caption unit (`ml-1 font-normal`);
  - visual `h-6`;
  - sub `h-8`: two caption lines, `textTertiary`, `h-4` each, truncate.
- Visuals in the sport colour (`src/lib/tokens.ts:23-24`): range 50 % alpha, share/drift 75 %, peak bars 35 % with the highlighted bar 95 %. HR zones use the zone colours.
- Cell order (as in the mockup): Calories, Moving time, Work, Intensity, Variability, Peak power, Coasting, Step length, HR zones, Decoupling.

### Cells

Visibility is decided synchronously from session + records + profile. Missing data hides the cell; 0 is data.

| Cell | Value | Visual | Sub line 1 / line 2 | Shown when |
| --- | --- | --- | --- | --- |
| Calories | kcal, rounded to 10 | range bar: track ± 30 %, segment ± method error, tick = estimate | `1,310–1,770 kcal` / empty | a method qualifies |
| Calories (blocked) | `--` kcal | empty | accent link to `/settings` "Add your weight" or "Add weight & birth year" / empty | only body data blocks a method |
| Moving time | `1:58:40` | empty | "Elapsed …" / "Stopped …" | ≥ 2 records |
| Work | kJ | empty | "Avg {w} W" / empty | power records |
| Intensity | IF, 2 dp | empty | "NP {w} W" / "FTP {w} W" | `session.normalizedPower` + `thresholds.ftp > 0` |
| Variability | VI, 2 dp | empty | "NP {w} W" / "Avg {w} W" | `session.normalizedPower` + `session.avgPower > 0` |
| Peak power | 20 min peak, unit `W · 20m`; under 20 min the longest available window (`W · 5m`, …) | `PeakBars` | axis `5s 1m 5m 20m 60m` / "Line = FTP {w} W" or "Scaled to best" | power records and at least the 5 s window |
| Coasting | duration | share bar (coasting ÷ moving time) | "{n} % of moving time" / "0 W or 0 rpm" | power records and moving intervals |
| Step length | m, 2 dp | empty | "{spm} spm" / "Pace {pace}" | running, distance + cadence, steps > 0 |
| HR zones | dominant zone `Z2`, unit `46 %` | stacked zone bar | "Z4–Z5 {time}" / "Z1–Z2 {time}" | profile + HR records |
| Decoupling | `3.5` %, sign kept (`−0.8`) | drift bar 0–10 %, mark at 5 %, negatives clamp at 0 | `{ratio} {first}→{second}` / "Well paced" (< 5 %) or "Drifting" | HR + power (rides) or HR + distance (runs), and ≥ 60 min of counted data |

- **Peak power:**
  - Five slots (5 s, 1 m, 5 m, 20 m, 60 m).
  - The value is the 20 m peak with its bar highlighted. On rides with less than 20 min of power data, the value is the longest available window, and that window's bar is highlighted.
  - Slots for windows longer than the ride stay empty and keep their axis labels.
  - Bar height uses a log scale, `24·ln(p/lo)/ln(hi/lo)` px, with `hi` = best bar and `lo` = half the lower of (weakest bar, FTP).
  - The FTP line is dashed `border-white/30`, on the same scale, clamped to the top of the slot. Without FTP the scale is computed without it and there is no line.
  - If the best bar is 0 W, every bar is 0 px high.
- **Coasting:** a moving interval (`isMovingPair`) counts when record i has 0 W, or 0 rpm where cadence is recorded. Cadence is optional; power records are required.
- **Decoupling:**
  - Hidden below 60 min (3600 s) of counted data (the intervals the ratio uses, see `decoupling.ts`).
  - Ratio: Pw:HR on rides (W per bpm); GAP:HR on runs with gradients (grade-adjusted m/min per bpm); Speed:HR on runs without gradients, e.g. on a treadmill (m/min per bpm). The m/min unit matches the mockup's ~1.3 figures.
- **HR zones:** use the app's HR thresholds (Karvonen bands, `zoneColors.ts:97-103`). HR below Z1 counts as Z1 (`bandAt`, `zoneColors.ts:133`). A tie for the dominant zone goes to the lower zone.
- **Step length:** Σ distance ÷ Σ steps over moving pairs, with steps = 2 × cadence × dt / 60. "spm" is the time-weighted step cadence. Pace is moving pace (session distance ÷ moving time). A recorded 0 cadence counts as 0 steps.

### Explanations

- Every cell has an ⓘ. New `MetricId`s: `calories`, `movingTime`, `decoupling`, `work`, `intensityFactor`, `variabilityIndex`, `peakPower`, `coasting`, `stepLength`. HR zones use `trainingZones`.
- `trainingZones` now covers HR and pace zones: new oneLiner and range text, same friendlyName and shortLabel, `sports: ['all']`. It also appears at `src/pages/LabsPage.tsx:80-85` (title, ⓘ, subtitle) and `src/features/labs/LabsPeek.tsx:14` (friendlyName). The new oneLiner still fits as a one-line subtitle.
- `duration` stays the TSS fallback (`messages/en.json:333-336`).

### Calorie estimate (from `plans/calorie-estimate.md`, unchanged)

- Gross energy, one method per session, first that qualifies: cycling power → heart rate; running speed + gradient → heart rate. A method qualifies when its body inputs are set and its record inputs cover ≥ 90 % of active time (sum of `dt` over neighbours with 0 < dt ≤ 10 s).
- Formulas, error bands (power ±15 %, running ±15 %, heart rate ±25 %) and Keytel coefficients as in the old plan.
- Body data:
  - Weight is a dated history (see "Dated thresholds").
  - `birthYear?: number` stays a plain value. Age = year(session date) − birth year.
- The old plan's `weightHistory` / `WeightEntry` / `weightAt` and its "no user-store version bump" are replaced by the generic pattern below.
- Settings UI for weight and birth year: part of the Thresholds form (see "Settings UI").
- Calories are computed on the fly; nothing calorie-related is stored. The derivation bump below comes from fix 1, not from calories.

### Dated thresholds

- **One generic pattern:** `DatedValue<T> = { date: number; value: T }` (date = local midnight, unix ms; one entry per day; sorted ascending).
  - `valueAt(history, date)` returns the latest entry ≤ `date`, else the earliest, else `undefined`.
  - Because of the fallback, a single entry applies to every session regardless of its date.
- **Dated values:** `weight`, `restHr`, `maxHr`, `ftp`, `thresholdPace`.
  - `restHr` and `maxHr` are required: a profile always has at least one entry for each.
  - `ftp`, `thresholdPace` and `weight` are optional: no history means unset.
  - **Gender stays a plain value; birth year stays a plain optional value.**
- **Every computation that reads a threshold resolves it for the session's date** through one resolver, `thresholdsAt(profile, date)`. The read sites are listed under Approach → "Threshold resolution".
- **Labs (coach plan) uses today's values:** `thresholdsAt(profile, Date.now())`. It plans the coming week.
- **Edit rules:**
  - **Only today:** a change always creates today's entry (local midnight). A second change on the same day replaces today's entry. There is no backdating.
  - **Append-only:** entries are never deleted.
  - **No clearing:** once set, an optional value (FTP, threshold pace, weight) can be changed but not cleared. Birth year can still be cleared.
  - **No recalculation after edits:** entries only start today, so no stored session changes through an edit. New imports and syncs resolve thresholds for their session's date. A session recorded earlier the same day picking up the new value is accepted. There is no "recompute after history edit" path; the version-3 recompute for the NP fix (fix 2) stays.
- **Migration and onboarding:** the existing single values become the first entry of each history, dated at the epoch (`date: 0`). Onboarding's first entries use the same date.
  - Why this is safe: `valueAt` falls back to the earliest entry, so a lone entry covers every session whatever its date. The date only matters once a second entry exists.
  - The epoch date makes the first value cover everything before the first real change, so every existing session resolves to exactly the values it used before.
  - `store-user` bumps from 2 to 3.
- The demo persona gets body data.

### Settings UI (settled; `mockups/profile-history/index.html`, being finalized to match)

**Form first.** The Thresholds card (`src/features/settings/ThresholdsSection.tsx:254-354`) comes first and is the main content.
- Fields in the mockup's order, two-column rows: gender + birth year, then resting HR + max HR, then FTP + threshold pace, then weight.
- One explicit "Save" / "Cancel" footer (`border-t border-white/10 mt-4 pt-3 flex justify-end gap-2`) covers the whole form, gender and birth year included. Nothing saves on change: the debounce (`DEBOUNCE_MS`, `:20`, `:53-56`) and the instant gender save (`:225`) are removed.
- Save writes today's entry for each changed dated value, plus gender and birth year. Cancel restores the stored values. Both buttons are disabled until something changes.
- A set optional value can't be emptied: the field shows "Required" (`ui_thresholds_required`) and Save stays disabled.
- Validation: the existing range checks and error copy (`:105-170`), plus weight 30–200 kg and birth year from 1920 to current year − 10.
- After Save, a toast "Thresholds saved" / "Changes count from today. Earlier sessions keep their values."

**History second.** Below the form sits a `ChartsCard` (`src/components/ui/ChartsCard.tsx:15-21`, `zoomReset={null}`) with one `ChartRow` (`ChartsCard.tsx:47-76`): "Profile history" / "How your baselines changed over time", `height="h-64"`, with a rail. This follows `src/features/dashboard/PerformanceChart.tsx:46-50`.
- **Value tabs:** FTP · Pace · Rest HR · Max HR · Weight, as in the `LoadChart` group-by tabs (`src/features/dashboard/LoadChart.tsx:195-215`, `TabsTrigger` `src/components/ui/Tabs.tsx:24-31`).
  - Desktop: inside the chart column, above the plot (`LoadChart.tsx:195-199` layout).
  - Phone: above the rail, through a new optional `above` slot on `ChartRow`, rendered before the rail grid (`ChartsCard.tsx:62-68`).
  - The selected tab is local state, default FTP. A value with no history (unset FTP, pace or weight) gets a disabled tab.
  - Icons and colours from the mockup:

    | Value | Icon | Colour |
    | --- | --- | --- |
    | FTP | `Zap` | `tokens.chartPower` |
    | Pace | `Timer` | `tokens.chartPace` |
    | Rest HR | `HeartPulse` | `tokens.chartHr` |
    | Max HR | `Heart` | `tokens.chartHr` |
    | Weight | `Weight` | `tokens.chartGrade` |

- **Chart:**
  - A Recharts `ComposedChart` with a numeric time `XAxis` (first and last date ticks) and `YAxis` with 3 ticks and `DASHBOARD_Y_AXIS_WIDTH`, as `PerformanceChart.tsx:73-91`.
  - Domain: from the earliest entry across the five values to today, at least 30 days wide (as in the mockup's `rangeOf`).
  - **Epoch-dated entries** (migrated or onboarding, `date: 0`) are drawn at the **first session date**, or at `profile.createdAt` when there are no sessions yet. This is display only: `valueAt` and the rail resolve as before.
  - **No drag-to-zoom:** no `useChartZoom`, no `ReferenceArea` selection, no reset pill.
  - Line:
    - `type="monotone"`, `strokeWidth={2}`, in the value's colour;
    - it ends at the last entry, with nothing drawn on to today; with one entry it is a single dot.
    - The smooth curve between entries is a purely visual interpolation the owner accepts; sessions still resolve with step semantics through `valueAt`.
  - Dots:
    - every entry gets one, filled in the series colour, r 3.5, with a thin dark ring (`stroke={tokens.surface}`, `strokeWidth={1.5}`);
    - the hovered entry gets Recharts' `activeDot`, r 4 with a white ring.
  - `RechartsTooltip {...hoverOnlyTooltip}` (`src/lib/chartHover.ts:5`).
- **Hover and touch** move the rail through `chartHoverHandlers` (`src/lib/chartHover.ts:15`) and `useChartHoverStore` (`src/store/chartHover.ts:12`) in a new hover group `profile-history`. Clicking does nothing.
- **Rail** (`StatRail`, `src/components/ui/StatRail.tsx:31-41`, without the note slot):
  - header: "latest" (`ui_rail_latest`) or the hovered date (`formatDashboardDate`, `src/features/dashboard/dashboardDate.ts:11`);
  - value plus unit: the value **in effect** on the hovered date (latest entry ≤ date, via `valueAt`), not a point on the curve; without hover, today's value;
  - second line: min–max over the whole history;
  - no note.
- **Onboarding** (`src/pages/OnboardingPage.tsx:72`): the same form without the history card. Its note reads "These values count for all your sessions. You can change them later in Settings." Save creates the profile through `tryCreateProfile` (`ThresholdsSection.tsx:57-97`) with `[{ date: 0, value }]` histories.

### Bug fixes in this plan

1. **Smart recording.**
   - NP (`normalize.ts:13-33`) and the peak windows (`records.ts:52-70`, `:77-89`) treat each sample as one second.
   - Both move to a shared 1 Hz resampling. Each interval (t₍ᵢ₋₁₎, tᵢ] with 0 < dt ≤ 10 s contributes `round(dt)` seconds of record i's power. Gaps over 10 s and records without power contribute nothing, so segments are joined as today.
   - NP needs ≥ 30 s of samples.
   - Peaks: a window longer than the available seconds yields no value. A real 0 W peak is kept; personal bests still ignore peaks ≤ 0.
2. **Stored sessions after fix 1:**
   - `SESSION_DERIVATION_VERSION` goes from 2 to 3 (`src/packages/engine/sessionDerivation.ts:12`), and outdated sessions are reprocessed.
   - Reparse refreshes NP, and **TSS is recomputed from the corrected NP**.
     - The recompute applies to sessions whose stored `stressMethod` is `'tss'`, the only TSS that depends on NP. It applies both to sessions with a stored FIT and to sessions without one.
     - It uses the thresholds in effect on each session's date (`thresholdsAt(profile, session.date)`).
     - If the recompute no longer yields `'tss'` (no profile, no FTP, no NP), the stored `tss` / `stressMethod` stay.
     - TRIMP and duration sessions keep their stored TSS.
   - CTL/ATL history shifts for affected rides; the owner accepts this.
3. **Time-weighted averages.** `avgPower` and `avgCadence` (`sessionDerivation.ts:29-36`) and the zoomed-range averages (`src/lib/railRange.ts:105`, `:107`) are weighted by dt under the same interval rule as fix 1. They ride along with the bump.
4. **Running cadence unit.** FIT running cadence is strides/min. Running cadence is shown as steps/min (× 2) with unit "spm" everywhere it appears: chart series, chart tooltip name, rail reading, rail avg/max. Step length uses steps/min. Cycling stays rpm.
5. **Colour tokens.** `chartCadence`, `chartElevation`, `chartPace`, `chartGap` (`src/lib/tokens.ts:32-33`, `:35-36`) are missing from `src/index.css:72-79`, so `text-chart-cadence` (`TrainingEffectCard.tsx:45`) gets no colour. The CSS tokens get added. `borderSubtle` (`tokens.ts:7`) also has no CSS token and is never read anywhere, so it is deleted as dead code.
6. **Dead code.** `pacingTrend` is removed: `src/lib/explanations.ts:15`, `:135-142`, `:254`; `messages/en.json:368-371`; `messages/de.json:368-371`; `tests/lib/explanations.spec.ts:16`. `createDefaultProfile` (`src/lib/defaults.ts:3-15`) is imported only by tests (`tests/lib/defaults.spec.ts`, `tests/store/userStore.integration.test.ts:4`, `:83`), so it is deleted with those tests rather than migrated to the new shape.

Out of scope: NP without FTP, device values, new FIT parsing, climbs, grade split, best efforts, max power.

## Approach

### Engine (`src/packages/engine/`)

- `normalize.ts`
  - Export `MAX_MOVING_PAIR_GAP_S` (`:10`).
  - New `activeSeconds(previous, current): number`: dt when 0 < dt ≤ 10 s, else 0. `isMovingPair` (`:41-46`) uses it.
  - New `powerPerSecond(records): number[]` (the resampling from fix 1).
  - `calculateNormalizedPower` (`:13-33`): rolling 30 s mean over `powerPerSecond`. `@see [CogganAllen2010]` stays.
- `sessionDerivation.ts`
  - `SESSION_DERIVATION_VERSION = 3` (`:12`).
  - New exported `timeWeightedMean(records, field: 'power' | 'cadence'): number | undefined`: Σ(value·dt) ÷ Σdt over intervals with `activeSeconds > 0` and record i's field defined; `undefined` when Σdt = 0.
  - `deriveAvgFromRecords` (`:29-36`) returns `Math.round(timeWeightedMean(...))`.
- `stress.ts`
  - Export `intensityFactor(np, ftp): number | undefined` (`undefined` for `ftp <= 0`). `calculateTSS` uses it (`:36`).
  - New `variabilityIndex(np, avgPower): number | undefined` (`undefined` for `avgPower <= 0`). It moves here from the old plan's `energy.ts` to sit next to IF.
  - Both `@see [CogganAllen2010]`.
- New `datedValue.ts`: `DatedValue<T>`, `valueAt(history, date)` and `upsertDatedValue(history, entry)`, which replaces a same-day entry and re-sorts. There is no remove, because history is append-only.
- New `energy.ts`, as in the old plan (constants, `EnergyMethod`, `EnergyBody`, `EnergySeries`, `EnergyEstimate` with `blockedBy`, `recordWorkSeries`, `recordEnergySeries`, `estimateSessionEnergy`, `sessionWorkKj`), with three changes:
  - it uses `activeSeconds` for coverage;
  - `sessionMaxPower` and `variabilityIndex` are dropped;
  - `WeightEntry` / `weightAt` are dropped in favour of `datedValue.ts`.
- New `decoupling.ts`
  - Exported constants: `DECOUPLING_WELL_PACED_PCT = 5` (`@see [Friel-Decoupling]`), `DECOUPLING_SCALE_PCT = 10`, `DECOUPLING_MIN_SECONDS = 3600`, `MIN_GRADIENT_COVERAGE = 0.9`.
  - Exported types: `DecouplingRatio = 'powerHr' | 'gapHr' | 'speedHr'` and `Decoupling { ratio; firstHalf; secondHalf; pct }`.
  - `aerobicDecoupling(records, sport, gradients = windowedGradients(records)): Decoupling | undefined | null`.
  - Rides: intervals with `activeSeconds > 0` and record i `hr` + `power`; output = power.
  - Runs: `isMovingPair` intervals with `hr`, distance on both ends and dx ≥ 0; output = dx / dt × 60 m/min. The ratio is `gapHr` when gradients cover ≥ 90 % of those seconds: output × `gradeAdjustedPaceFactor(g)`, and intervals without a gradient are skipped, as in the GAP pair rule (`normalize.ts:56-68`). Otherwise `speedHr`.
  - Returns `undefined` when the counted seconds are below `DECOUPLING_MIN_SECONDS`.
  - Halves split by cumulative counted seconds; an interval belongs to the half it ends in. Ratio per half = Σ(output·dt) ÷ Σ(hr·dt). pct = (first − second) ÷ first × 100.
  - Returns `null` when the first-half ratio is ≤ 0.
- New `cadence.ts`
  - `STEPS_PER_STRIDE = 2`; `stepsPerMinute(strideCadence)`.
  - `coastingSeconds(records): number | undefined`: Σ dt over `isMovingPair` intervals where record i has `power === 0`, or `cadence === 0` when cadence is defined. `undefined` when no record has power.
  - `stepLength(records): { metres; stepsPerMinute } | undefined | null`: `undefined` without cadence or distance, `null` when Σ steps = 0.
- `zoneDistribution.ts`: new `secondsInZones(records, zoneIndexAt: (hr: number) => number, zoneCount): number[]`. Σ `activeSeconds` per zone of record i's `hr`. The caller passes the classifier, so the engine stays free of `src/lib`.
- `SOURCES.md`
  - Validation Summary (`:8-30`):
    - change the `normalize.ts` NP row (`:13`) to "30 s rolling over 1 Hz resampled power";
    - add rows `stress.ts` IF and VI (`[CogganAllen2010]`), `energy.ts` (power / running / Keytel, keys from the old plan), `decoupling.ts` Pw:HR / GAP:HR (`[Friel-Decoupling]`, `[Strava2017]`), `zoneDistribution.ts` time in HR zones (`[Karvonen1957]`).
  - App-Specific Logic (`:61-63`): `cadence.ts` coasting rule and step length (definition, no published formula), `decoupling.ts` half split by counted time and the 60 min minimum, `sessionDerivation.ts` time-weighted means.
  - Bibliography (`:34-55`):
    - the old plan's `[EttemaLoras2009]`, `[MoseleyJeukendrup2001]`, `[Margaria1963]`, `[Fletcher2009]`, `[Keytel2005]`;
    - `[Friel-Decoupling]` Friel, J. "Aerobic Endurance and Decoupling." TrainingPeaks. <https://www.trainingpeaks.com/blog/aerobic-endurance-and-decoupling/> (open the link before adding it, see Verification).

### Reprocessing (`src/features/sessions/reprocessSessions.ts`)

- `reparseFit` (`:47-60`): passes `toFitParseProfile(profile)` (now a resolver, see "Threshold resolution") to `parseFitFile`, so the reparse uses the thresholds in effect on the session's date.
- `mergeReparsedSession` (`:28-45`): when `stored.stressMethod === 'tss'` and `reparsed.stressMethod === 'tss'`, take `reparsed.tss` and `reparsed.stressMethod`. Otherwise keep the stored values (`:38-39`). NP already comes from `...reparsed` (`:33`).
- `recomputeFromRecords` (`:72-88`) takes the profile (call site `:95`).
  - It resolves `thresholdsAt(profile, session.date)`. When `session.stressMethod === 'tss'` and the resolved `ftp > 0`, it calls `calculateSessionStress(records, session.duration, session.avgHr, restHr, maxHr, gender, ftp)` (`src/packages/engine/stress.ts:96-104`).
  - If the result is `'tss'`, it sets `tss`, `stressMethod` and `normalizedPower` from it; otherwise everything stays as stored.
  - `avgPower` / `avgCadence` (`:82-83`) pick up the time-weighted derivation automatically.

### Lib (`src/lib/`)

- `records.ts`
  - `findPeakAverage` (`:52-70`) returns `number | undefined` (`undefined` when the window is longer than the series).
  - `extractPeakPower` (`:77-89`) becomes exported and reads `powerPerSecond(records)`. It keeps 0 W peaks and skips `undefined`.
  - `extractSessionPeaks` (`:155-160`) filters peaks ≤ 0, so personal bests behave as before.
- `railRange.ts`: `avgPower` (`:120`) and `avgCadence` (`:124`) come from `timeWeightedMean(inRange, …)`. `maxCadence` (`:125`) stays on `summarizeValues` (`:107`).
- `movingTime.ts`: `sessionMovingTime(records): { movingS; elapsedS } | undefined`. Moving = last `movingSeconds` value; elapsed = last − first timestamp; `undefined` below 2 records.
- New `moreStats.ts`, pure: `buildMoreStats(session, records, profile): MoreStats`, one optional field per cell (`undefined` = hidden), plus `moreStatsTopics(stats): MoreStatsTopic[]` in the fixed order.
  - Gradients computed once (`windowedGradients`), shared by energy and decoupling.
  - Takes the resolved `thresholdsAt(profile, session.date)`, not the raw profile.
  - Body: resolved weight, age from `birthYear`, gender.
  - HR zones: `zoneScale('hr', resolved)` (`zoneColors.ts:114`), classifier `scale.bands.indexOf(scale.bandAt(hr))` (`:132`), colours `band.color`.
  - IF/VI and the peak FTP line from `session.normalizedPower`, `session.avgPower` and the resolved `ftp`.
  - Peaks: from `extractPeakPower`, plus `highlight` = index of the 20 m window, or of the longest window present when the ride is shorter.
  - Coasting share = `coastingSeconds` ÷ `sessionMovingTime().movingS`, so the copy "% of moving time" matches the moving time cell.
  - Step length only for `sport === 'running'`.
  - Literal constants here: the ratio display names `Pw:HR`, `GAP:HR`, `Speed:HR` and the peak window labels (`5s 1m 5m 20m 60m`, also used in the unit `W · {label}`).
- `chartData.ts:67`: cadence channel returns `stepsPerMinute(r.cadence)` when `options.isRunning` (`:46-50`).
- `explanations.ts`
  - `MetricId` (`:3-26`) and `METRIC_EXPLANATIONS` (`:242-266`): add the nine ids. Sports: `calories`, `movingTime`, `decoupling` → all; `work`, `intensityFactor`, `variabilityIndex`, `peakPower`, `coasting` → cycling; `stepLength` → running.
  - `trainingZones` (`:144-151`) → `sports: ['all']`.
  - Remove `pacingTrend`.
- `tokens.ts:7`: delete `borderSubtle`.

### Threshold resolution

- New `src/lib/thresholdsAt.ts`: `thresholdsAt(profile, date): ResolvedThresholds`, returning `{ restHr; maxHr; ftp?; thresholdPace?; weightKg?; age?; gender }`. It is structurally a `ZoneThresholds` (`src/lib/zoneColors.ts:7-12`), so zone code takes it unchanged.
- New `src/lib/hooks/useThresholdsAt.ts`: `useThresholdsAt(date)` = `useUserStore((s) => s.profile)` + `useMemo(() => profile && thresholdsAt(profile, date))`.
- `src/lib/fitParseProfile.ts:11-18`: `toFitParseProfile(profile)` returns a resolver `(date) => FitParseProfile`. `parseFitFile` (`src/parsers/fit.ts:105-114`) takes the resolver and calls it with `sessionDate` (`:148`) before the stress calculation (`:172-185`).
- Every read site switches to the resolved values:

| Read site | Today | Resolves at |
| --- | --- | --- |
| `src/parsers/fit.ts:175`, `:181-183` (TSS / TRIMP at import) | flat `userProfile` | session date (resolver) |
| `src/features/sessions/hooks/useFileUpload.ts:63` (upload) | `toFitParseProfile(profile)` | session date (resolver) |
| `src/features/intervals/runIntervalsImport.ts:59` (intervals.icu import, profile from `runIntervalsSync.ts:46`) | `toFitParseProfile(profile)` | session date (resolver) |
| `src/features/sessions/reprocessSessions.ts:55` (reparse), `:72-88` (recompute) | `toFitParseProfile(profile)` / none | session date |
| `src/features/sessions/session/TrainingEffectCard.tsx:133-135` (training effect) | `profile.thresholds` | `session.date` |
| `src/features/sessions/charts/SessionChartsExplorer.tsx:114` (HR / power / pace zone scales, `:115-126`) | `profile?.thresholds` | `session.date` |
| `src/features/sessions/session/hooks/useSessionColorModes.ts:11` (colour-by availability, `:27`) | `profile?.thresholds` | `session.date` |
| `src/features/map/hooks/useSessionDetailPath.ts:78` (zone-coloured track) | `profile.thresholds` | `session.date` |
| `src/features/sessions/hooks/useSessionTitle.ts:12`, `:19` (zone label in session titles) | `profile?.thresholds` | `session.date` |
| `src/features/sessions/session/hooks/useMoreStats.ts` (new: IF, peak FTP line, HR zones, calories) | n/a | `session.date` |
| `src/features/labs/hooks/useCoachPlan.ts:34` (coach plan, pace zones) | `profile?.thresholds.thresholdPace` | today |
| `src/features/settings/ThresholdsSection.tsx:26-33` (form prefill) | `profile?.thresholds` | today (tile values); full histories for the charts |

- Not threshold reads (unchanged): `src/components/ui/MetricLabel.tsx:23` (`showMetricHelp`), the profile-exists checks at `src/features/settings/DeleteAllDataDialog.tsx:32`, `src/features/intervals/hooks/useIntervalsSync.ts:14`, `src/features/intervals/IntervalsConnectionForm.tsx:42`, and `src/pages/SettingsPage.tsx:38`.
- Engine functions keep taking plain numbers (`calculateSessionStress`, `calculateTrainingEffect`, `computeRunningZones`). Only the callers resolve.

### Store and types

- `src/types/index.ts:17-28`:
  - `thresholds: { restHr: DatedValue<number>[]; maxHr: DatedValue<number>[]; ftp?: DatedValue<number>[]; thresholdPace?: DatedValue<number>[] }`;
  - `weight?: DatedValue<number>[]` and `birthYear?: number` at the top level;
  - `gender` stays a plain value (`:19`).
- `src/store/user.ts`:
  - `updateThresholds` (`:55-60`) is replaced by `saveTodaysThresholds(changes: Partial<Record<ThresholdKey, number>>)`. It writes `{ date: todayMidnight, value }` through `upsertDatedValue` for each changed key (key ∈ `restHr | maxHr | ftp | thresholdPace | weight`).
  - There is no remove action and no way to clear a value.
  - `setProfileBirthYear(birthYear | undefined)`;
  - all actions assign on the draft like `setProfileGender` (`:48-53`);
  - `setProfile` (`:39-46`) takes the new shape.
  - Persist (`:71-77`): `version: 3` and a `migrate` that wraps each flat v1/v2 value as `[{ date: 0, value }]`.
  - A Zod `safeParse` on hydration drops invalid entries, per CLAUDE.md. There is no special handling for a history left empty.
- `src/store/user.ts`: `setProfileGender` (`:48-53`) and `setProfileBirthYear` are called only from the form's Save, together with `saveTodaysThresholds`.
- `src/features/settings/ThresholdsSection.tsx`: the form from "Settings UI".
  - Local form state holds every field. "Save" calls `saveTodaysThresholds` with the changed dated keys, plus `setProfileGender` and `setProfileBirthYear` when those changed. "Cancel" resets the form state.
  - The range validation (`:105-170`) stays, with weight (30–200 kg) and birth year (1920 to current year − 10) added.
  - The debounce helper (`:20`, `:53-56`) and the instant gender save (`:225`) are removed.
  - Field order per the mockup: gender + birth year, resting HR + max HR, FTP + threshold pace, weight, in the existing two-column grid (`:270`, `:298`).
  - `tryCreateProfile` (`:57-97`) builds `[{ date: 0, value }]` histories on the onboarding Save.
- New `src/features/settings/ProfileHistoryChart.tsx`: the `ChartsCard` + `ChartRow` with value tabs, `ProfileHistoryRail` and the Recharts plot. Rendered by `src/pages/SettingsPage.tsx` right after `ThresholdsSection` (`:56`), not on onboarding.
- New `src/features/settings/ProfileHistoryRail.tsx`: `useChartHoverX('profile-history')` (`src/store/chartHover.ts:26`) → `StatRail` without `noteSlot`, one row (value, unit, `secondary` = min–max). `SeriesRail` (`src/components/charts/ChartRail.tsx:20-51`) always sets `noteSlot`, so it isn't reused.
- New `src/lib/profileHistory.ts` (pure): `profileHistorySeries(history, { firstSessionDate, createdAt, today })` → points `{ date, value }` for every entry (no point at today; epoch entries placed at the first session date, else `profile.createdAt`), the min–max, and the domain.
- `src/components/ui/ChartsCard.tsx:35-76`: `ChartRow` gets an optional `above?: ReactNode` slot, rendered at the top of the body (`:62`), for the phone tabs.
- Onboarding reuses `ThresholdsSection` (`src/pages/OnboardingPage.tsx:72`) without the history card, plus the onboarding note.

### UI

- `src/components/ui/Card.tsx`: export `tileClass = 'rounded-xl border border-white/10 bg-white/5'` after `glassClass` (`:3`). Replace the hand-copied string with `cn(tileClass, …)` at:
  - `src/components/ui/CardGrid.tsx:47` (keeps `p-3`);
  - `src/features/labs/WorkoutExpansionPanel.tsx:18` (keeps `mt-3 p-4 space-y-3`);
  - `src/features/trips/ManageTripDialog.tsx:44` (keeps `cursor-pointer p-3`, hover and checked states);
  - `src/features/trips/TripFormDialog.tsx:114` (keeps `flex cursor-pointer items-center gap-3 p-3 text-left`, hover).
- `CLAUDE.md` §7 Surfaces (`CLAUDE.md:104-107`): the implementer adds one bullet: "**Tile** (a bordered block inside a content surface: stat cells, grid tiles, selectable rows in dialogs): `tileClass`, padding at the call site."
- New `src/components/ui/SegmentBar.tsx`: the stacked `h-1.5 rounded-full bg-white/5` bar from `SplitBar.tsx:23-31`, with segments `{ key, value, className?, color? }`. It is used by `SplitBar` and by the HR zones cell (2 places).
- New feature components in `src/features/sessions/session/` (single use, so not in `ui/`):
  - `MoreStatsRow.tsx`: `useMoreStats`, the `CollapsibleListItem` (avatar, primary, topics as secondary, no disabled branch), the grid, and the cells in the settled order. The calorie link is a router `Link to="/settings"`.
  - `StatCell.tsx`: the four-slot cell on `tileClass`. Props `label`, `metricId`, `value`, `unit?`, `visual?`, `lines: [ReactNode, ReactNode]`.
  - `MeterBar.tsx`: one track for three visuals (range, share, drift), so there is no separate RangeBar / ShareBar / DriftBar.
    - Props `sport`, `fill: { from?: number; to: number }`, `tick?: number`, `mark?: number`, `alpha: 50 | 75`, as fractions 0–1.
    - Sport colour via the classes `bg-sport-running/50`, `bg-sport-cycling/75`, and so on.
  - `PeakBars.tsx`: `PeakBars` (log scale, FTP line, `highlight` index, empty slots for missing windows) and `PeakAxis` (all five labels, always, for sub line 1).
- New `src/features/sessions/session/hooks/useMoreStats.ts`: `useUserStore((s) => s.profile)` + `useMemo(() => buildMoreStats(...))`.
- `SessionSummaryCard.tsx:21`: `<MoreStatsRow session records />` after `LapsRow`.
- Formatting: `Intl.NumberFormat(getLocale())` for kcal / kJ / W (0 dp), IF / VI / step length (2 dp), decoupling (1 dp, `signDisplay: 'negative'`), shares (0 dp). Durations via `formatRaceTime`, pace via `formatPace`. Units (`kcal`, `kJ`, `W`, `W · 20m` and other windows, `m`, `%`, `spm`) are literal.
- Running cadence (fix 4):
  - `src/features/sessions/charts/SessionChartsExplorer.tsx:461`: unit `spm` when `isRunning` (`:99`), else `rpm`.
  - `:465-466` and `:473`: rail avg/max pass through `stepsPerMinute` when running. These read `stats.avgCadence` / `stats.maxCadence` from `:211-212` and from `railRange.ts:124-125`.
  - The reading at `:472` comes from the chart rows, which are already doubled.
  - `src/features/sessions/charts/CadenceChart.tsx:18-23`: new `seriesName` prop used at `:78`. The explorer passes `ui_chart_series_cadence_running` for runs at `:286-290`.
- `src/features/settings/ThresholdsSection.tsx` and the new profile-history components: see Store and types.
- `src/index.css:72-79`: `--color-chart-cadence: #f59e0b`, `--color-chart-elevation: #8b5cf6`, `--color-chart-pace: #06b6d4`, `--color-chart-gap: var(--color-pink-500)`.

### Demo

- `src/features/demo/buildDemoDataset.ts`:
  - persona `:35-41` gets `birthYear: 1992` and a weight history (61 kg 90 days and 60 kg 30 days before the newest demo session);
  - profile type `:52-56` and profile `:247-256` switch to the dated shape. Each threshold's first entry is dated `0`. FTP gets a second entry (200 → 210 W, 60 days before the newest session), so the demo shows per-date resolution;
  - demo stress (`buildDemoDataset.ts:139-147`) resolves the persona's FTP at each session's date;
  - applied via `src/features/demo/loadDemoData.ts:24`.
- Demo sessions are built with `SESSION_DERIVATION_VERSION` (`buildDemoDataset.ts:177`), so they pick up 3 automatically.

### Messages (`messages/en.json` + `messages/de.json`)

New keys, EN / DE (copy from the mockup unless marked *draft*):

| Key | EN | DE |
| --- | --- | --- |
| `ui_more_stats_title` | More stats | Weitere Werte |
| `ui_more_stats_topic_calories` | Calories | Kalorien |
| `ui_more_stats_topic_power` | Power | Leistung |
| `ui_more_stats_topic_stride` | Stride | Schritt |
| `ui_more_stats_topic_zones` | Zones | Zonen |
| `ui_more_stats_topic_decoupling` | Decoupling | Drift |
| `ui_more_stats_calories` | Calories | Kalorien |
| `ui_more_stats_moving` | Moving time | In Bewegung |
| `ui_more_stats_zones` | HR zones | HF-Zonen |
| `ui_more_stats_decoupling` | Decoupling | Drift |
| `ui_more_stats_work` | Work | Arbeit |
| `ui_more_stats_intensity` | Intensity | Intensität |
| `ui_more_stats_variability` | Variability | Variabilität |
| `ui_more_stats_peaks` | Peak power | Spitzen |
| `ui_more_stats_coasting` | Coasting | Rollen |
| `ui_more_stats_step` | Step length | Schritt |
| `ui_more_stats_elapsed` | Elapsed {time} | Gesamt {time} |
| `ui_more_stats_stopped` | Stopped {time} | Standzeit {time} |
| `ui_more_stats_zones_hard` | Z4–Z5 {time} | Z4–Z5 {time} |
| `ui_more_stats_zones_easy` | Z1–Z2 {time} | Z1–Z2 {time} |
| `ui_more_stats_well_paced` | Well paced | Gut eingeteilt |
| `ui_more_stats_drifting` | Drifting | Spürbare Drift |
| `ui_more_stats_avg_power` | Avg {watts} W | Ø {watts} W |
| `ui_more_stats_np` | NP {watts} W | NP {watts} W |
| `ui_more_stats_ftp` | FTP {watts} W | FTP {watts} W |
| `ui_more_stats_ftp_line` | Line = FTP {watts} W | Linie = FTP {watts} W |
| `ui_more_stats_scaled_to_best` | Scaled to best | Relativ zum Bestwert |
| `ui_more_stats_coast_share` | {percent} % of moving time | {percent} % der Fahrzeit |
| `ui_more_stats_coast_rule` | 0 W or 0 rpm | 0 W oder 0 rpm |
| `ui_more_stats_pace` | Pace {pace} | Tempo {pace} |
| `ui_more_stats_add_weight` | Add your weight | Gewicht eintragen |
| `ui_more_stats_add_weight_birth_year` | Add weight & birth year | Gewicht & Geburtsjahr eintragen |
| `ui_chart_series_cadence_running` | Cadence (spm) *draft* | Kadenz (spm) *draft* |

Settings copy from `mockups/profile-history/index.html:231-275` (the file is being finalized; re-check the strings at implementation). Existing keys stay as they are: `ui_thresholds_ftp`, `ui_thresholds_threshold_pace`, `ui_thresholds_resting_hr`, `ui_thresholds_max_hr`, `ui_thresholds_gender`, `ui_thresholds_required`, `ui_rail_latest` (`messages/en.json:25-41`, `:573`). *Draft* marks text not in the mockup.

| Key | EN | DE |
| --- | --- | --- |
| `ui_thresholds_weight` | Weight (kg) | Gewicht (kg) |
| `ui_thresholds_birth_year` | Birth year | Geburtsjahr |
| `ui_thresholds_save` | Save | Speichern |
| `ui_thresholds_cancel` | Cancel | Abbrechen |
| `ui_thresholds_saved_title` | Thresholds saved | Schwellenwerte gespeichert |
| `ui_thresholds_saved_desc` | Changes count from today. Earlier sessions keep their values. | Änderungen zählen ab heute. Frühere Einheiten behalten ihre Werte. |
| `ui_thresholds_onboarding_note` | These values count for all your sessions. You can change them later in Settings. | Diese Werte gelten für alle deine Einheiten. Ändern kannst du sie später in den Einstellungen. |
| `ui_thresholds_min_kg` | Min {value} kg *draft* | Min. {value} kg *draft* |
| `ui_thresholds_max_kg` | Max {value} kg *draft* | Max. {value} kg *draft* |
| `ui_thresholds_birth_year_range` | Between {min} and {max} *draft* | Zwischen {min} und {max} *draft* |
| `ui_profile_history_title` | Profile history | Verlauf deiner Werte |
| `ui_profile_history_subtitle` | How your baselines changed over time | Wie sich deine Grundwerte verändert haben |
| `ui_profile_history_tab_ftp` | FTP | FTP |
| `ui_profile_history_tab_pace` | Pace | Tempo |
| `ui_profile_history_tab_rest_hr` | Rest HR | Ruhepuls |
| `ui_profile_history_tab_max_hr` | Max HR | Max. Puls |
| `ui_profile_history_tab_weight` | Weight | Gewicht |

- Rail: the header reuses `ui_rail_latest` ("latest" / "aktuell"). The second line is a literal `{min}–{max}` with the unit, formatted with `Intl.NumberFormat(getLocale())`; pace uses `formatPaceInput`.
- Units (`W`, `/km`, `bpm`, `kg`) are literal.

`{pace}` is `formatPace` output, which already carries " /km".

Explanations: `exp_<id>_shortLabel`, `_friendlyName`, `_oneLiner`, `_range` for each new id, with copy exactly as in the mockup (`mockups/session-stats/index.html:190-239`):

- `calories`: kcal · Calories / Kalorien
- `movingTime`: Moving / Bewegt · Moving Time / Zeit in Bewegung
- `decoupling`: Pw:HR · Aerobic Decoupling / Aerobe Entkopplung
- `work`: kJ · Work / Arbeit
- `intensityFactor`: IF · Intensity Factor / Intensitätsfaktor
- `variabilityIndex`: VI · Variability Index / Variabilitätsindex
- `peakPower`: Peak · Peak Power / Bestleistung
- `coasting`: Coasting / Rollen · Coasting / Rollen
- `stepLength`: Step / Schritt · Step Length / Schrittlänge

Changed: `exp_trainingZones_oneLiner` and `exp_trainingZones_range` (`messages/en.json:374-375`, `messages/de.json:374-375`) take the mockup's generalized text (`index.html:202-203`).

Removed: `exp_pacingTrend_shortLabel`, `_friendlyName`, `_oneLiner`, `_range` in both files.

The old plan's `ui_stats_*` keys are not created.

## Affects other code

- `plans/calorie-estimate.md`: superseded (the owner's session deletes it).
- **Derivation bump 2 → 3:**
  - every stored session is reprocessed once on next start, with the progress overlay;
  - `tss` sessions get a corrected NP and TSS, at the FTP in effect on their date;
  - `avgPower` / `avgCadence` become time-weighted for every session. Values for 1 Hz files shift slightly, because the first record no longer counts;
  - CTL/ATL/TSB, the dashboard load charts and session TSS change for affected rides;
  - the guarded storage marker moves to 3 (`src/lib/guardedSessionsStorage.ts:22-27`), so an older tab stops writing.
- `e2e/helpers/seed.ts:127`, `:167`, `:236` and `tests/factories/sessions.ts:24` use the constant, so they follow automatically.
- **Dated thresholds:**
  - Session titles, zone colours, training effect, colour-by availability and the map track now follow the session's date. With single-entry histories nothing visibly changes.
  - The dashboard (CTL/ATL/TSB, `src/hooks/useMetrics.ts:13-15`) reads stored TSS, so it changes only through the reprocess or new imports.
  - Labs keeps today's threshold pace (`useCoachPlan.ts:34`).
  - Onboarding creates one-entry histories dated `0` (`OnboardingPage.tsx:72` → `ThresholdsSection.tsx:57-97`).
  - Settings: a threshold edit never touches stored sessions; it only affects sessions imported or synced afterwards whose date is today or later.
  - The debounced autosave in `ThresholdsSection` is replaced by Save/Cancel.
- Profile shape users:
  - `e2e/helpers/seed.ts:71-83` (flat v1 profile, goes through the new `migrate`);
  - `tests/factories/profiles.ts`;
  - `src/features/demo/buildDemoDataset.ts:52-56`, `:247-256`;
  - `src/lib/fitParseProfile.ts:11-18`;
  - every `parseFitFile` caller in tests (`tests/parsers/*`, `tests/features/sessions/reprocessSessions.integration.test.ts:63`) passes the resolver.
- Personal bests for smart-recording rides change on the next worker run. They are not stored, so nothing needs migrating.
- Chart rail: NP (`SessionChartsExplorer.tsx:208`) and avg power/cadence (`:207`, `:211`) show the reprocessed stored values. Zoomed-range values (`src/lib/railRange.ts:120-121`, `:124`) use the fixed functions directly.
- The Labs zones subtitle (`LabsPage.tsx:85`) shows the new generalized oneLiner.
- `TrainingEffectCard.tsx:45` gets its orange text colour back.
- Tiles: four existing call sites switch to `tileClass` with the same look (see UI).
- `src/components/ui/SplitBar.tsx:23-31` renders through `SegmentBar`, with the same look.
- Existing tests whose behaviour changes on purpose:
  - `tests/engine/normalize.spec.ts:16-19`: rename "fewer than 30 records" to "less than 30 s of power". It still passes, because 29 records 1 s apart give 28 s.
  - `tests/parsers/fit.spec.ts:56-80`: the `deriveAvgFromRecords` cases use `timestamp: 0` for every record (`:12-14`), which gives no dt. Give them spaced timestamps and assert the time-weighted results; add one smart-recording case (records 1 s and 4 s apart).
  - `tests/parsers/fitRequiredFields.spec.ts:103-112`: the recorded zero has to sit on a record that ends an interval, since the first record no longer counts. Use records `elapsed_time` 0 / 1 / 2 with power 200 / 0 / 200 and cadence 90 / 0 / 90. Expected values stay `avgPower` 100 and `avgCadence` 45.
  - `tests/features/sessions/reprocessSessions.integration.test.ts:59-95` ("keeps its TSS") stays valid: its stored method is `'duration'`, which keeps its TSS.
  - `tests/features/sessions/reprocessSessions.integration.test.ts:131-154` stays valid: running records without power give TRIMP, not `'tss'`, so its TSS of 55 stays.
  - `tests/lib/explanations.spec.ts:4-28`: add the nine ids, remove `pacingTrend`.
  - `tests/store/userStore.integration.test.ts:19-30` (`updateThresholds`) moves to `saveTodaysThresholds`; `:83` onward (`createDefaultProfile`) and `tests/lib/defaults.spec.ts` are deleted with the dead helper.

## Tests

Engine and lib units (`tests/engine/`, `tests/lib/`), records spaced 1 s apart unless noted, gradients passed explicitly:

- `tests/engine/normalize.spec.ts` (extend): **regression "NP on a smart-recording ride matches the same ride at 1 Hz"**. A 1 Hz series and the same series sampled every 5 s (each record holds the last 5 s) give equal NP. Also: a 30 s gap adds no samples.
- `tests/parsers/fit.spec.ts` (update, see Affects): **regression "average power on smart recording is weighted by time"**: 100 W for 1 s then 300 W over a 4 s interval → 260 W, not 200.
- `tests/engine/computePbsForSessions.spec.ts` (extend): **regression "peak windows on smart recording count seconds, not samples"**. Records every 4 s for 10 min: the 5 min peak exists and the 20 min peak does not. Also: a 0 W-only ride gives no personal best.
- New `tests/engine/energy.spec.ts`: the old plan's cases, without max power and VI.
- New `tests/engine/stress.spec.ts`: IF 209 / 265 → 0.79, FTP 0 → `undefined`; VI 209 / 180 → 1.16, avg 0 → `undefined`.
- New `tests/engine/decoupling.spec.ts` (sessions ≥ 60 min unless noted):
  - steady 200 W with HR rising 140 → 147 in the second half → pct ≈ 4.8, `powerHr`;
  - HR falling → negative pct;
  - a run with gradients → `gapHr`; the same run without elevation → `speedHr`;
  - a 59 min ride → `undefined`;
  - a ride without power → `undefined`;
  - a first half at 0 W → `null`.
- New `tests/engine/cadence.spec.ts`:
  - coasting counts 0 W while moving, and 0 rpm where cadence is recorded; a power-only ride (no cadence) still counts its 0 W intervals;
  - stopped intervals (speed 0) and a 30 s gap don't count;
  - no power → `undefined`;
  - step length at 3 m/s and 85 strides/min → 1.06 m at 170 spm; no cadence → `undefined`; all-zero cadence → `null`.
- New `tests/engine/zoneDistribution.spec.ts`: `secondsInZones` weights by dt on smart recording and skips a 30 s gap.
- `tests/lib/movingTime.spec.ts` (extend): `sessionMovingTime` with a timer pause → moving < elapsed; one record → `undefined`.
- New `tests/lib/moreStats.spec.ts` (branching hiding rules):
  - ride without FTP → no `intensityFactor`, peaks without FTP;
  - ride without power → no Power cells or topic;
  - 45 min ride → 60 m peak `undefined`, 20 m highlighted, no decoupling;
  - 12 min ride → 20 m and 60 m `undefined`, value and highlight on 5 m;
  - run → step length, no Power topic;
  - `profile` null → no HR zones;
  - 0 W-only ride → work 0 and coasting shown;
  - topics come out in the fixed order.
- `tests/lib/railRange.spec.ts` (extend): zoomed avg power on smart-recording records is weighted by time.
- `tests/lib/chartData.spec.ts` (extend): **regression "running cadence chart shows steps per minute"**: running 85 → 170, cycling 85 → 85.
- New `tests/lib/tokens.spec.ts`: **regression "every colour token has a CSS theme variable"**. Read `src/index.css` with `?raw`; for each `tokens` key, `--color-<kebab>` exists and resolves (one `var()` hop) to the same hex.
- `tests/lib/explanations.spec.ts`: id list update.
- New `tests/engine/datedValue.spec.ts`: `valueAt` on an empty history, before the first entry, between entries, after the last, on the same day, with unsorted input; `upsertDatedValue` replaces a same-day entry.
- New `tests/lib/thresholdsAt.spec.ts`: FTP 250 until 1 March then 270 → a 28 February session resolves 250, a 1 March session resolves 270; no `ftp` history → `ftp` undefined; age from `birthYear`.
- New `tests/lib/profileHistory.spec.ts`: `profileHistorySeries` returns one point per entry and none at today; a single entry gives a single point; an epoch entry lands on the first session date, or on `profile.createdAt` without sessions; min–max covers the whole history; the domain is at least 30 days wide.

Integration:

- `tests/store/userStore.integration.test.ts` (extend):
  - **persist `migrate`**: a flat v2 profile (and a flat v1 one, as `e2e/helpers/seed.ts:71-83` writes) becomes `[{ date: 0, value }]` histories carrying the same values, and a session from any date resolves to them; an unrecognised shape survives;
  - an invalid history entry is dropped and the rest is kept;
  - `saveTodaysThresholds` twice on the same day leaves one entry for today with the second value, and older entries are untouched.
- `tests/parsers/fitThresholds.integration.test.ts` (new, one flow): a profile with FTP 200 until a date and 300 after → a FIT ride dated before gets TSS at 200 W, not 300.
- `tests/features/sessions/reprocessSessions.integration.test.ts` (extend), one test per flow:
  - **"reprocessing a TSS ride recomputes NP and TSS from its FIT"**: stored `stressMethod: 'tss'` with a stale `tss` / `normalizedPower` and a power FIT, with an FTP history whose second entry postdates the session → both equal a fresh `parseFitFile` at the FTP in effect on the session's date.
  - **"reprocessing a TSS ride without a stored FIT recomputes NP and TSS from its records"**: stored `'tss'` and smart-recording power records → `tss` / `normalizedPower` equal `calculateSessionStress` on those records.
  - "a TSS ride keeps its stored TSS when the profile has no FTP" (the failure the user would see as a dropped load).

E2E:

- `e2e/sessions.spec.ts` (extend). The `beforeEach` uploads both fixtures with a profile that has no FTP and no body data (`:7-10`, `e2e/helpers/seed.ts:91-100`). New test "more stats row lists its topics and sends missing body data to settings":
  - open the running.fit session (about 77 min, so decoupling shows);
  - collapsed `session-stats-row` shows "Calories · Stride · Zones · Decoupling";
  - expand → the step length cell contains "spm", and the cadence rail unit reads "spm";
  - the calories cell shows "Add your weight" → click → URL `/settings`.

- `e2e/onboarding.spec.ts` (extend; there is no settings spec), test "changing FTP in settings saves it as today's entry". The seed profile is the flat v1 one, so this also covers the migrate.
  - On `/settings`, `getByLabel('FTP (watts)')` → fill 280.
  - `getByRole('button', { name: 'Save' })` becomes enabled → click.
  - The toast shows "Thresholds saved".
  - In `getByRole('region', { name: 'Profile history' })`, `getByRole('tab', { name: 'FTP' })` → click, and the rail (`getByTestId('stat-rail')`) shows "latest" and "280".
  - Reload → the field still reads 280.
  - Change it to 290 and click `getByRole('button', { name: 'Cancel' })` → the field reads 280 again and Save is disabled.

## Verification

1. `vp build` (generates the paraglide keys)
2. `vp check`
3. `vp test -- --run`
4. `vp exec playwright test`
5. `vp build`

Before adding `[Friel-Decoupling]` to `SOURCES.md`, open <https://www.trainingpeaks.com/blog/aerobic-endurance-and-decoupling/> and confirm the title, author and the 5 % threshold. If the page doesn't match, cite the page that does.

By hand:

- **Reprocess:** start with existing data at version 2. The progress overlay runs once.
  - A smart-recording power ride with FTP set shows a changed NP and TSS.
  - The dashboard CTL curve shifts for those dates.
  - TRIMP sessions keep their TSS.
- **Demo data:**
  - A ride over 60 min shows calories, moving time, work, IF, VI, peak bars with the FTP line, coasting, zones and decoupling.
  - A run shows step length and GAP:HR.
  - Check desktop (3 columns) and phone width (2 columns), collapsed and expanded, at 1512×860 and 1440×800, with no shift between states.
  - The row never shows a skeleton.
- **Short ride:** under 60 min, no decoupling cell. Under 20 min, the peak value names its window (`W · 5m`), that bar is highlighted, and the empty slots keep their labels.
- **Profile without FTP** (e.g. the e2e seed): Intensity is hidden and the peak bars lose the line ("Scaled to best").
- **No weight:** calories show "Add your weight" and the link opens settings. Entering a weight and saving makes calories appear for every session: the lone entry covers all dates through the fallback to the earliest entry.
- **Settings:**
  - the form comes first, with rows gender + birth year, resting HR + max HR, FTP + threshold pace, weight;
  - Save/Cancel are enabled only after a change, gender and birth year included, and nothing saves without Save;
  - a set FTP can't be emptied (Save disabled);
  - a second Save on the same day replaces today's entry instead of adding a dot.
- **Profile history:**
  - the value tabs switch the series;
  - the line is smooth, has a dot (r 3.5, dark ring) on every entry and ends at the last entry; a migrated value's first dot sits at the first session date; the hovered entry shows the r 4 white-ringed active dot;
  - hover (desktop) and touch (phone) move the rail: the header shows the date, the value is the one in effect that day, and the second line is the min–max;
  - there is no drag-to-zoom and no reset pill, and clicking does nothing;
  - on the phone the tabs sit above the rail;
  - check at 1512×860 / 1440×800 and phone width.
- **Per-date thresholds (demo):** a ride before the demo FTP step shows IF and the peak FTP line at 200 W; a ride after it shows 210 W.
- **Migration:** a profile saved before this change (v2) loads with its values intact, and the settings form still shows them.
- **Running cadence:** the chart and rail read about 160–180 spm.
- **Training effect:** the orange label is coloured.
- **Tiles:** the four refactored tiles (Labs workout panel, both trip dialogs, CardGrid) look unchanged.
- **Copy:** EN/DE matches the mockup, including every ⓘ popover.

## Open questions

None.
