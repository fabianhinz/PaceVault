# Session stats row with calorie estimate

**Status: DEFERRED — not implemented this round.** Design settled (round 3, variant C in `mockups/calories/index.html`).

Supersedes the deleted `plans/session-calories.md` (device figure). `plans/fit-data.md` is implemented: session `calories`, `movingTime`, `maxPower` and device fields are gone, so every stat here is derived from `records`.

## Context

- Summary rows: `SessionSummaryCard.tsx:19-21` (weather, training effect, laps). Training effect is computed on the fly from `records` + profile (`TrainingEffectCard.tsx:125-137`); the new row follows that pattern.
- Row component: `CollapsibleListItem` (`Collapsible.tsx:63-108`). Stat rhythm: `StatItem.tsx:14-37` (overline label, h3 value + caption unit, sub line, fixed `h-[80px]`).
- Derivations available: moving time `movingSeconds` (`src/lib/movingTime.ts:37`, used only by demo today); NP inside `calculateTSS` (`stress.ts:28-43`, IF = NP ÷ FTP at `:36`, not exported); session `normalizedPower` / `avgPower` (`engine/types.ts:45-46`); max power and work only from `records[].power`.
- `UserProfile` (`src/types/index.ts:17-28`): `gender`, thresholds (`ftp?` optional), no weight, no age. `store-user` at `version: 2` (`src/store/user.ts:75-76`), no `merge` option today.
- Engine reuse: `gradeAdjustedPaceFactor` (`normalize.ts:36-39`), `windowedGradients` (`gradient.ts:76`), 10 s gap rule `MAX_MOVING_PAIR_GAP_S` (`normalize.ts:10`, unexported).
- Running power is scored against cycling FTP (`src/parsers/fit.ts:172-175`); vendor-specific, no published metabolic efficiency.
- Research (accuracy): Keytel r = 0.77 on an independent sample (ages 19–45, 57–90 % HRmax, linear above ~90 bpm); cycling gross efficiency (GE) 18–23 %; net running cost ~1 kcal/kg/km, SD ~8 %. Wrist wearables are off by ≥ 27 % (Shcherbina et al. 2017, _J. Pers. Med._ 7(2):3, doi:10.3390/jpm7020003).
- Carbs (`plans/backlog.md:17-23`) will multiply energy per record by a CHO fraction, so the engine exposes energy per record.

## Decisions (settled)

### Calorie method (unchanged)

- **Gross energy** (includes resting metabolism), like device figures.
- **One method per session**, first that qualifies: cycling **power** → **heart rate**; running **speed + gradient** → **heart rate** (running power ignored). A method qualifies when its body inputs are set and its record inputs cover ≥ 90 % of active time (sum of `dt` over neighbours with 0 < dt ≤ 10 s). Uncovered intervals add nothing.
- **Formulas** (per interval ending at record i, `dt` in s):
  - Power: `power × dt / 0.21` J `[EttemaLoras2009]`, `[MoseleyJeukendrup2001]`. No body input. 0 W is covered and worth 0 J.
  - Running: `weight × (4.184 × dx × gradeAdjustedPaceFactor(g) + 1.162 × dt)` J `[Margaria1963]`, `[Fletcher2009]`, `[Strava2017]`, `[Minetti2002]`, `[ACSM2018]`. Needs distance on both records, `dx ≥ 0`, gradient defined. No elevation (treadmill) → uncovered → HR fallback; without HR, no estimate.
  - Heart rate: Keytel no-VO2max (kJ/min) `[Keytel2005]`: male `−55.0969 + 0.6309·HR + 0.1988·W + 0.2017·A`, female `−20.4022 + 0.4472·HR − 0.1263·W + 0.074·A`, `other` = mean. Clamped below at 1 kcal/kg/h.
- **Expected error** (range): power ±15 %, running ±15 %, heart rate ±25 %.
- **Computed on the fly** from `records` + profile. Nothing stored, no reprocess, no `SESSION_DERIVATION_VERSION` bump.

### Body data

- `UserProfile` top level: `weightHistory?: WeightEntry[]`, `birthYear?: number`. `WeightEntry = { date: number; kg: number }`, `date` = local midnight, one entry per day, sorted.
- Weight per session (`weightAt`): latest entry `≤ session.date`, else the earliest. Age = `year(session.date) − birthYear`.
- **No store version bump (owner decision, overrides `src/store/CLAUDE.md`)**: both fields optional, every v2 profile stays valid. `weightHistory` and `birthYear` are Zod-validated on hydration (invalid → field dropped, never throw).

### Row (variant C)

- New `CollapsibleListItem` in `SessionSummaryCard` between training effect and laps, flame avatar, `data-testid="session-stats-row"`.
- **Collapsed**: primary `1,540 kcal` (rounded to 10) or `-- kcal`; secondary `Moving 1:58:40 · 1,350 kJ · Max 812 W` (only parts that exist).
- **Expanded**: a divided strip of stats (all in one line on desktop, 2 per line on phone). Each stat only when its data exists (0 is data, missing is missing):

  | Stat              | Value                                                         | Needs                 |
  | ----------------- | ------------------------------------------------------------- | --------------------- |
  | Calories          | top line range `1,310–1,770`, small range bar, `1,540 kcal ⓘ` | a qualifying method   |
  | Moving time       | `1:58:40`, sub `Elapsed 2:14:05`                              | ≥ 2 records           |
  | Work              | `1,350 kJ` (Σ power·dt, same coverage rule)                   | power records         |
  | Max power         | `812 W`                                                       | power records         |
  | Intensity factor  | `0.79` (NP ÷ FTP)                                             | NP + `thresholds.ftp` |
  | Variability index | `1.16` (NP ÷ avg power)                                       | NP + avg power > 0    |

- Calorie stat: kcal at the same size as the other values; only a small `MetricLabel metricId="calories" size="sm" iconOnly` after "kcal" (popover: method order, error per method, sources). No method label, no caption. Range bar: track = estimate ± 30 %, segment = ± method error, tick = estimate.
- **Missing body data** (method blocked by weight/birth year): `-- kcal`, top line is an accent link to `/settings`, "Add your weight" or "Add weight & birth year". Other stats still show.
- **No calorie data** (nothing qualifies): `-- kcal`, empty top line, no bar. Other stats still show.
- **No layout shift**: every stat cell reserves the label, meter, value and sub slots in all states.

### Settings (KISS)

- `ThresholdsSection` gets one grid row: "Weight (kg)" and "Birth year". No date picker, edit, delete, history dialog or helper text.
- Weight: prefilled with the latest entry; a valid value (30–200), debounced like FTP, is saved as **today's** entry, replacing today's if present. Clearing the field changes nothing.
- Birth year: 1920 – current year − 10, debounced; empty clears.

## Approach

- `normalize.ts:10`: export `MAX_MOVING_PAIR_GAP_S`.
- `stress.ts`: export `intensityFactor(np, ftp): number | undefined` (`undefined` for `ftp <= 0`), used by `calculateTSS` (`:36`) and the row.
- New `src/packages/engine/energy.ts`:
  - Constants with `@see`: `CYCLING_GROSS_EFFICIENCY = 0.21`, `RUNNING_NET_COST_J_PER_KG_M = 4.184`, `RESTING_J_PER_KG_S = 4184 / 3600`, `MIN_ENERGY_COVERAGE = 0.9`, `ENERGY_UNCERTAINTY = { power: 0.15, running: 0.15, heartRate: 0.25 }`, Keytel coefficients.
  - Types `EnergyMethod`, `EnergyBody { weightKg?; age?; gender }`, `EnergySeries { method; joules: Array<number | null> }` (index 0 `null`), `EnergyEstimate { method; kcal; lowKcal; highKcal; uncertainty }`, plus `blockedBy?: 'weight' | 'weightAndAge'` when only body data is missing.
  - `recordWorkSeries(records)`: power·dt per covered interval (shared by work and the power method).
  - `recordEnergySeries(records, sport, body, gradients = windowedGradients(records))`, `estimateSessionEnergy(records, sport, body)`.
  - `sessionWorkKj(records)`, `sessionMaxPower(records)`, `variabilityIndex(np, avgPower)` — `undefined` when no power / avg power ≤ 0.
  - `WeightEntry`, `weightAt(history, date)`.
- `src/lib/movingTime.ts`: `sessionMovingTime(records): { movingS; elapsedS } | undefined` (last `movingSeconds` value, last − first timestamp; `undefined` below 2 records).
- `src/types/index.ts:17-28`: `weightHistory?`, `birthYear?`.
- `src/store/user.ts`: `saveWeightEntry(date, kg)` (replaces same day, re-sorts), `setProfileBirthYear(birthYear | undefined)`, draft assignment like `setProfileGender` (`:48-53`). Persist `merge` safeParses `profile.weightHistory` / `profile.birthYear` (`weightHistorySchema = z.array(z.object({ date: z.number().finite(), kg: z.number().positive() }))`), drops a failing field. No `version` change.
- `ThresholdsSection.tsx`: new grid row after FTP/pace (`:298-320`), `Label` + `Input` like FTP (`:300-309`), same debounce (`DEBOUNCE_MS`, `:20`). Before a profile exists, pass both through `tryCreateProfile` (`:57-97`); the weight becomes today's entry.
- `src/components/ui/StatItem.tsx`: optional `reserveMeter` prop that reserves the 10 px meter slot so values line up with the calorie stat.
- New `src/components/ui/StatStrip.tsx`: grid with `border-l border-white/10` dividers, `grid-cols-2` on phone, one line from `md` (CSS only, no `useDevice`).
- New `src/features/sessions/session/CalorieStat.tsx`: StatItem rhythm with range top line / settings link, range bar, value + unit + `MetricLabel`.
- New `src/features/sessions/session/SessionStatsRow.tsx`: `useUserStore` profile → `EnergyBody` (`weightAt`, age), `useMemo` over records for energy, moving time, work, max power; IF/VI from `session.normalizedPower`, `session.avgPower`, `profile.thresholds.ftp`. Renders `CollapsibleListItem` + `StatStrip`.
- `SessionSummaryCard.tsx:20`: `<SessionStatsRow session records />` after `TrainingEffectCard`.
- `src/lib/explanations.ts`: `'calories'` in `MetricId` (`:3-26`) and `METRIC_EXPLANATIONS` (`:242`).
- `messages/en.json` + `de.json`: `ui_stats_kcal`, `ui_stats_no_kcal`, `ui_stats_moving`, `ui_stats_elapsed`, `ui_stats_work`, `ui_stats_max_power`, `ui_stats_intensity_factor`, `ui_stats_variability_index`, `ui_stats_add_weight`, `ui_stats_add_weight_birth_year`, `ui_thresholds_weight`, `ui_thresholds_birth_year`, `ui_thresholds_min_kg`, `ui_thresholds_max_kg`, `ui_thresholds_birth_year_range`, `exp_calories_{shortLabel,friendlyName,oneLiner,range}`.
- `src/packages/engine/SOURCES.md`: Validation Summary rows for `energy.ts`, bibliography keys:
  - `[EttemaLoras2009]` Ettema, G. & Lorås, H.W. (2009). "Efficiency in cycling: a review." _Eur. J. Appl. Physiol._, 106(1), 1–14. doi:10.1007/s00421-009-1008-7
  - `[MoseleyJeukendrup2001]` Moseley, L. & Jeukendrup, A.E. (2001). "The reliability of cycling efficiency." _Med. Sci. Sports Exerc._, 33(4), 621–627. doi:10.1097/00005768-200104000-00017
  - `[Margaria1963]` Margaria, R. et al. (1963). "Energy cost of running." _J. Appl. Physiol._, 18(2), 367–370. doi:10.1152/jappl.1963.18.2.367
  - `[Fletcher2009]` Fletcher, J.R., Esau, S.P. & MacIntosh, B.R. (2009). "Economy of running: beyond the measurement of oxygen uptake." _J. Appl. Physiol._, 107(6), 1918–1922. doi:10.1152/japplphysiol.00307.2009
  - `[Keytel2005]` Keytel, L.R. et al. (2005). "Prediction of energy expenditure from heart rate monitoring during submaximal exercise." _J. Sports Sci._, 23(3), 289–297. doi:10.1080/02640410470001730089
  - `[ACSM2018]` already listed.

## Affects other code

- Demo persona (`src/features/demo/buildDemoDataset.ts:35-41`, profile type `:52-56`, profile `:246-255`, applied via `loadDemoData.ts:24`): add `birthYear: 1992` and a `weightHistory` (e.g. 61 kg 90 days and 60 kg 30 days before the newest demo session) so demo sessions show estimates.
- `tests/lib/explanations.spec.ts:4-25`: add `'calories'` to `ALL_METRIC_IDS`.

Out of scope: carbs, weight charts/history UI, running power, dashboard/list/trip totals, FTP-for-running-power (`fit.ts:172-175`).

## Tests

- New `tests/engine/energy.spec.ts` (records 1 s apart, gradients passed explicitly):
  - power: 3601 records at 210 W → 860.4 kcal, range 731.4–989.5; 0 W records covered, worth 0.
  - running flat 70 kg, 3 m/s, 1000 s → 229.4 kcal; uphill g = 0.10 → 321.2 kcal.
  - Keytel male 150 bpm/70 kg/35 y/60 min → 867.8 kcal; female 60 kg → 597.8; `other` → 718.6; clamp female 60 bpm → 60 kcal/h.
  - fallback: cycling with power on 85 % → `heartRate`; running without elevation → `heartRate`.
  - missing: running without weight → `blockedBy: 'weight'`; HR without birth year → `blockedBy: 'weightAndAge'`; no power and no HR → `undefined`; a 30 s gap adds nothing.
  - work: 3601 × 210 W → 756 kJ; 0 W counts; no power → `undefined`.
  - max power: includes 0-only rides (→ 0); no power → `undefined`.
  - VI: NP 209 / avg 180 → 1.16; avg 0 → `undefined`.
  - IF (`stress.ts` export, tested here; TSS only has an integration test): 209 / 265 → 0.79; FTP 0 → `undefined`.
  - `weightAt`: empty, before first, between, after last, same day, unsorted.
- `tests/lib/movingTime.spec.ts`: `sessionMovingTime` with a timer pause → moving < elapsed; one record → `undefined`.
- `tests/store/userStore.integration.test.ts`: invalid `weightHistory` entry → field dropped, rest kept; valid history survives; `saveWeightEntry` on the same day replaces.
- `e2e/sessions.spec.ts` (extend): demo/fixture session → `session-stats-row` collapsed shows `kcal` + `Moving`; expand → calorie range + moving/elapsed visible; with weight/birth year cleared on an HR-only run → `-- kcal` + "Add weight & birth year" link navigates to `/settings`.
- No migration test (no version bump).

## Verification

`vp build` (paraglide keys) → `vp check`, `vp test -- --run`, `vp exec playwright test`, `vp build`. By hand: demo data → row under training effect, collapsed and expanded on desktop and phone width, no shift between states; settings weight saves as today's entry and recomputes kcal; a power ride without body data still shows kcal.
