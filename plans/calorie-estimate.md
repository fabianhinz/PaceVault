# Calorie estimate (own, research-based)

Supersedes the deleted `plans/session-calories.md` (device figure). Depends on `plans/fit-data.md`, which deletes `total_calories` / `session.calories` from parsing (`src/parsers/fit.ts:256`, `src/packages/engine/types.ts:50`, `src/features/dashboard/generateDevData.ts:360`).

## Context

- Session detail summary rows: `SessionSummaryCard.tsx:19-21` (weather, training effect, laps). Training effect is computed on the fly from `records` + profile in the card (`TrainingEffectCard.tsx:126-137`), nothing stored on the session. Calories follow the same pattern.
- `UserProfile` (`src/types/index.ts:17-28`) has `gender` (`'male' | 'female' | 'other'`, `engine/types.ts:7`), HR thresholds, FTP; no weight, no age. Store `store-user` is at `version: 2` (`src/store/user.ts:76-77`). Profile UI: `ThresholdsSection.tsx` (used in Settings and Onboarding), profile is only created once rest + max HR are valid (`:57-97`).
- Reusable engine code: `gradeAdjustedPaceFactor` (`normalize.ts:36-39`, Strava-shaped effort curve), `windowedGradients` (`gradient.ts:76`), 10 s gap rule `MAX_MOVING_PAIR_GAP_S` (`normalize.ts:10`, unexported).
- Running power is scored against cycling FTP today (`src/parsers/fit.ts:203-207`); running power values differ by vendor (Stryd vs Garmin) and have no published metabolic efficiency.
- Research (accuracy): Keytel HR equations r = 0.77 on an independent sample, developed on ages 19–45 at 57–90 % HRmax, linear only above ~90 bpm; cycling gross efficiency (GE) 18–23 % between people; net running cost ~1 kcal/kg/km, SD ~8 % between runners. Wrist wearables are off by ≥ 27 % (Shcherbina et al. 2017, _J. Pers. Med._ 7(2):3, doi:10.3390/jpm7020003), so a ±15–25 % estimate is on par with devices.
- Carbs (`plans/backlog.md:17-23`) will multiply energy per record by a CHO fraction by intensity, so the engine exposes energy per record, not just a total.

## Decisions (settled)

- **Gross energy** (includes resting metabolism), like device figures. Keytel and GE-based numbers are gross by construction; running adds resting energy explicitly.
- **One method per session**, first that qualifies:
  - Cycling: **power** → **heart rate**.
  - Running: **speed + gradient** → **heart rate**. Running power is ignored (vendor-specific, no efficiency).
  - A method qualifies when its body inputs are set and its record inputs cover ≥ 90 % of active time (sum of `dt` over neighbouring records 0 < dt ≤ 10 s). Uncovered intervals add nothing (no imputation). Nothing qualifies → no estimate, no row.
- **Formulas** (per interval ending at record i, `dt` in s):
  - Power: `power × dt / 0.21` J. GE 0.21 = middle of 18–23 % `[EttemaLoras2009]`, `[MoseleyJeukendrup2001]`. No body input needed. 0 W is a covered interval worth 0 J.
  - Running: `weight × (4.184 × dx × gradeAdjustedPaceFactor(g) + 1.162 × dt)` J. 4.184 J/kg/m = net 1 kcal/kg/km `[Margaria1963]`, `[Fletcher2009]`; grade via existing GAP curve `[Strava2017]`, `[Minetti2002]`; 1.162 J/kg/s = resting 1 kcal/kg/h (1 MET) `[ACSM2018]`. Covered needs distance on both records, `dx ≥ 0`, gradient defined. Missing elevation (treadmill) → uncovered → HR fallback.
  - Heart rate: Keytel no-VO2max mixed model (kJ/min) `[Keytel2005]`: male `−55.0969 + 0.6309·HR + 0.1988·W + 0.2017·A`, female `−20.4022 + 0.4472·HR − 0.1263·W + 0.074·A`; `other` = mean of both (gender = 0.5 in the published mixed form). Clamped below at resting 1 kcal/kg/h (Keytel: below flex HR, EE ≈ resting).
- **Expected error** (shown as range): power ±15 %, running ±15 %, heart rate ±25 %. Known bias: running cost on walked flat sections is overestimated (walking costs ~half per km); steep hiking is close.
- **Profile: `weightHistory?: WeightEntry[]` and `birthYear?: number`** at the top level of `UserProfile` (body data, not thresholds). `WeightEntry = { date: number; kg: number }`, `date` = local midnight (unix ms), at most one entry per day, kept sorted by date. Birth year, because it never goes stale and old sessions use the age at the time (`year(session.date) − birthYear`; ±1 year ≈ 0.2 kJ/min, negligible).
- **Weight per session:** the latest entry with `date ≤ session.date` (an entry on the session's day counts). Before the first entry → the earliest entry: weight changes slowly, and "no estimate" would blank all history for a user who enters their weight today.
- **No store version bump (owner decision, overrides the `src/store/CLAUDE.md` bump rule):** both fields are optional and every v2 profile is already valid. Stored `weightHistory` is validated with Zod on hydration instead (invalid → field dropped, never throw).
- **Treadmill / no elevation:** running falls back to HR; without HR, no estimate (owner).
- **Computed on the fly** in the row from `records` + profile, like training effect. Nothing stored, no reprocess, no `SESSION_DERIVATION_VERSION` bump; weight/birth-year edits show immediately.
- **Placement:** session detail only, row between training effect and laps.
- **Wording:** primary `≈ 860 kcal` (rounded to 10), secondary `From power · 730–990 kcal` / `From pace & gradient · …` / `From heart rate · …`. Info popover via `MetricLabel` (`metricId: 'calories'`): method order, error per method, sources. Missing body input that blocked an estimate (empty `weightHistory` or no `birthYear`) → disabled row "Add your weight and birth year in settings for a calorie estimate". Otherwise missing data → no row.

## Approach

- `src/packages/engine/normalize.ts:10`: export `MAX_MOVING_PAIR_GAP_S`.
- New `src/packages/engine/energy.ts`:
  - Constants: `CYCLING_GROSS_EFFICIENCY = 0.21`, `RUNNING_NET_COST_J_PER_KG_M = 4.184`, `RESTING_J_PER_KG_S = 4184 / 3600`, `MIN_ENERGY_COVERAGE = 0.9`, `ENERGY_UNCERTAINTY: Record<EnergyMethod, number> = { power: 0.15, running: 0.15, heartRate: 0.25 }`, Keytel coefficients — each with `@see`.
  - Types: `EnergyMethod = 'power' | 'running' | 'heartRate'`; `EnergyBody { weightKg?: number; age?: number; gender: Gender }`; `EnergySeries { method; joules: Array<number | null> }` (one entry per record, `null` = uncovered, index 0 always `null`); `EnergyEstimate { method; kcal; lowKcal; highKcal }`.
  - `recordEnergySeries(records, sport, body, gradients = windowedGradients(records)): EnergySeries | undefined` — walks the method order, returns the first series with coverage ≥ 0.9. Carbs reuse this.
  - `estimateSessionEnergy(records, sport, body): EnergyEstimate | undefined` — sums the series, J → kcal (÷ 4184), range = kcal × (1 ± uncertainty).
  - `WeightEntry` type + `weightAt(history: WeightEntry[], date: number): number | undefined` — latest entry `≤ date`, else the earliest; `undefined` for an empty history. Does not assume sorted input.
- `src/types/index.ts:17-28`: `weightHistory?: WeightEntry[]; birthYear?: number` (`WeightEntry` imported from `engine/energy.ts`).
- `src/store/user.ts`:
  - actions `saveWeightEntry(date, kg)` (replaces an entry on the same day, re-sorts), `deleteWeightEntry(date)`, `setProfileBirthYear(birthYear: number | undefined)` — draft assignment, like `setProfileGender`. Editing an entry's date = delete + save.
  - `weightHistorySchema = z.array(z.object({ date: z.number().finite(), kg: z.number().positive() }))`; persist `merge` option safeParses `profile.weightHistory` of the persisted state and drops the field on failure. No `version` change.
- `ThresholdsSection.tsx` (Settings + Onboarding):
  - birth year input (1920 – current year − 10), optional, debounced like FTP (empty clears).
  - "Weight" block: list of entries, newest first, each `date · kg` with a ghost icon `Button` (lucide `Trash2`) to delete and tap-to-edit filling the form; below, `Input type="date"` (default today) + `Input type="number"` kg (30–200) + `Button` "Save". Reuses `Input`, `Label`, `Button`; no new UI component.
  - Before a profile exists, keep birth year and entries in local state and pass them in `tryCreateProfile` (`:57-97`).
- New `src/features/sessions/session/EnergyRow.tsx`: `useUserStore` profile → `EnergyBody` (`weightKg = weightAt(weightHistory ?? [], session.date)`, age from `birthYear` and session year) → `useMemo(estimateSessionEnergy)`. Static row (padding of disabled `CollapsibleListItem`, `ListItemHeader variant="secondary"`, lucide `Flame`), plus `<MetricLabel metricId="calories" iconOnly />`. `data-testid="energy-row"`.
- `SessionSummaryCard.tsx:20`: render `<EnergyRow session records />` after `TrainingEffectCard`.
- `src/lib/explanations.ts`: `'calories'` in `MetricId` (`:3-26`) and `METRIC_EXPLANATIONS` (`:242`).
- `messages/en.json` + `de.json`: `ui_calories_value` (`≈ {kcal} kcal`), `ui_calories_range` (`{method} · {low}–{high} kcal`), `ui_calories_method_power|running|heart_rate`, `ui_calories_no_body`, `ui_thresholds_weight`, `ui_thresholds_weight_date`, `ui_thresholds_weight_save`, `ui_thresholds_weight_delete` (aria-label), `ui_thresholds_birth_year`, `ui_thresholds_min_kg`, `ui_thresholds_max_kg`, `ui_thresholds_birth_year_range`, `exp_calories_{shortLabel,friendlyName,oneLiner,range}`.
- `generateDevData.ts:36-42, 236-245`: `PERSONA` gets `birthYear = 1992` and a `weightHistory` of two entries (61 kg 90 days ago, 60 kg 30 days ago), passed to `setProfile`, so demo sessions show the estimate.
- `SOURCES.md`: Validation Summary rows for `energy.ts` (GE power → kcal; running net cost × GAP curve + resting; Keytel HR) and bibliography keys:
  - `[EttemaLoras2009]` Ettema, G. & Lorås, H.W. (2009). "Efficiency in cycling: a review." _Eur. J. Appl. Physiol._, 106(1), 1–14. doi:10.1007/s00421-009-1008-7
  - `[MoseleyJeukendrup2001]` Moseley, L. & Jeukendrup, A.E. (2001). "The reliability of cycling efficiency." _Med. Sci. Sports Exerc._, 33(4), 621–627. doi:10.1097/00005768-200104000-00017
  - `[Margaria1963]` Margaria, R. et al. (1963). "Energy cost of running." _J. Appl. Physiol._, 18(2), 367–370. doi:10.1152/jappl.1963.18.2.367
  - `[Fletcher2009]` Fletcher, J.R., Esau, S.P. & MacIntosh, B.R. (2009). "Economy of running: beyond the measurement of oxygen uptake." _J. Appl. Physiol._, 107(6), 1918–1922. doi:10.1152/japplphysiol.00307.2009
  - `[Keytel2005]` Keytel, L.R. et al. (2005). "Prediction of energy expenditure from heart rate monitoring during submaximal exercise." _J. Sports Sci._, 23(3), 289–297. doi:10.1080/02640410470001730089
  - `[ACSM2018]` already listed (1 MET ≈ 1 kcal/kg/h).
- Out of scope: carbs, weight charts/trends, running power, dashboard/list/trip totals, the FTP-for-running-power issue (`fit.ts:203-207`).

## Tests

- New `tests/engine/energy.spec.ts` (records 1 s apart, gradients passed explicitly):
  - power: 3601 records at 210 W → 860.4 kcal, method `power`, range 731.4–989.5.
  - power with 0 W records → covered, contribute 0 (not skipped).
  - running flat: 70 kg, 3 m/s for 1000 s, g = 0 → 210 + 19.44 = 229.4 kcal.
  - running uphill: same at g = 0.10 (factor 1.43674) → 301.7 + 19.44 = 321.2 kcal.
  - Keytel male 150 bpm, 70 kg, 35 y, 60 min → 867.8 kcal; female 150 bpm, 60 kg, 35 y → 597.8 kcal; `other` 150 bpm, 60 kg → 718.6 kcal.
  - Keytel clamp: female 60 bpm, 60 kg, 35 y (1.44 kJ/min) → 60 kcal/h resting.
  - fallback: cycling with power on 85 % of time → `heartRate`; running without elevation → `heartRate`.
  - missing: running without weight → `undefined`; HR without birth year → `undefined`; cycling without power and HR → `undefined`; a 30 s gap adds no energy.
- `weightAt` (same file): empty → `undefined`; session before the first entry → earliest kg; between two entries → the earlier one; after the last → last; entry on the session's day (midnight ≤ start) → that entry; unsorted input.
- `tests/store/userStore.integration.test.ts`: persisted `weightHistory` with an invalid entry (e.g. `kg: "70"`) → field dropped, rest of the profile kept; valid history survives hydration unchanged; `saveWeightEntry` on an existing day replaces instead of duplicating.
- `tests/lib/explanations.spec.ts:4-28`: add `'calories'` to `ALL_METRIC_IDS` (behaviour changed on purpose).
- No migration test (no version bump, owner decision).

## Verification

`vp build` (paraglide keys) → `vp check`, `vp test -- --run`, `vp exec playwright test`, `vp build`. By hand: demo data → session detail shows "≈ … kcal" with method + range under training effect; delete all weight entries in settings → hint row; add an older lower weight → older sessions' kcal drop, newer unchanged; a cycling session with power and no weight/birth year still gets the power estimate.
