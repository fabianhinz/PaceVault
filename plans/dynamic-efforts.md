# Dynamic efforts: auto-detected effort blocks as a lap source (PLAN, ready for review)

> Decisions are settled. Approach, Files, Tests and Verification follow below.

## Context

The laps picker offers Off / Device laps / Splits (`src/lib/lapSet.ts:6`, `src/features/sessions/session/LapsControl.tsx:118-146`). There is no detection from the record stream; device intervals only come from the lap `intensity` field (`src/lib/laps.ts:60`). New source: **Efforts**, detected automatically, no user tuning.

Compared in `mockups/dynamic-efforts/index.html`: threshold hysteresis (V1), change-point edges + threshold labels (V2), peaks only (V3), session-relative change-point (V4). **V2 won**: edges within 1–2 s on structured intervals, recognises warm-up / steady / cool-down, no false efforts on endurance rides when it is tied to thresholds. V4 and every session-relative reference found 14 fake efforts on an unstructured 3 h ride.

## Decisions (settled)

- **Algorithm: V2.** PELT change points on 5 s bins of the smoothed signal, then segment means labelled against the reference: work / rest / steady, plus leading/trailing low blocks ≥ 3 min as warm-up / cool-down. Same algorithm for rides and runs.
- **Signal and reference: thresholds only, never session-relative.**
  - Ride: power vs FTP → HR vs HR reserve → "No efforts found".
  - Run: grade-adjusted pace vs threshold pace → HR vs HR reserve → "No efforts found". Running power is ignored for now.
  - HR reserve is always available (rest/max HR are required, `src/lib/thresholdsAt.ts:6-7`); the HR _stream_ is optional (`src/packages/engine/types.ts:70`).
- **HR:** edges shifted ~30 s earlier for lag; result labelled "approx.".
- **Stops are bridged:** a stop or recording gap ≤ 2 min inside work, with work on both sides, does not split the block. Longer stops still break it. A recorded 0 W (coasting) stays 0.
- **Profile nudge:** when the better signal exists but its threshold is missing, the row says what it used and links to Settings, following `blockedBy` + `BLOCKER_LABELS` in `src/features/sessions/session/MoreStatsRow.tsx:52,73-90`.
  - "Add FTP for precise efforts" / "Add threshold pace for precise efforts".
  - No usable signal: disabled row "No efforts found", link still active.
- **Display:**
  - Name: "Efforts" / "Belastungen".
  - **Pill grammar for every lap source: `<count> <source>`.**
    - `12 Geräterunden` / `12 device laps` (today `12 Runden`, `ui_laps_pill_count`).
    - `6 Splits` / `6 splits` (today `1-km-Splits`, `ui_laps_pill_splits`).
    - `4 Belastungen` / `4 efforts`.
    - Off is unchanged.
    - No signal chip or pattern in the pill.
  - **Popover row:** one summary chip, then the nudge link. Lines are reserved, and the popover stays `w-80`.
  - **Review round 3 (2026-10-17), replacing the chip copy below.** The chip names its source by unit, following the intervals.icu convention:
    - Pattern form: `<count> × <avg moving time> · <value><unit>`.
    - Count form: `<count> <efforts> · <value><unit>`.
    - The value is the moving-time-weighted average of the detection signal over the work blocks: `290 W`, `3:58 /km` (grade-adjusted pace) or `168 bpm`.
    - No signal word and no `≈`.
    - The chip reads `4 × 4:01 · power` when the work blocks match within ±10 %, otherwise `5 efforts · heart rate ≈`.
    - DE: `4 × 4:01 · Leistung`, `5 Belastungen · Herzfrequenz ≈`.
  - **KISS: no per-effort details.** No detail line, no per-block W/bpm, and `LapAnalysis` stays pace-only. Tooltips stay as they are for laps today.
  - **Stepper unchanged:** `[⚑ ‹ Belastung 12 ›] [✕]`, name only. The name slot widens from `w-[72px]` to `w-[104px]` (`src/features/sessions/session/LapsControl.tsx:254`), so "Gleichmäßig 12" fits; this applies to all lap sources.
  - **Phone pill overflow:** no new logic. The bar already scrolls horizontally (`src/features/map/MapControlsBar.tsx:36`).
  - **Block duration is moving time.**
- **Bridging tolerance:** 2:00 + 10 s slack, because smart recording measures a 2:00 stop as 2:01.
- **DE wording:** sport-specific. Rides use Einfahren / Ausfahren, runs use Einlaufen / Auslaufen.
  - Missing power/HR shows `--`, recorded 0 shows `0`.
- **Empty result:** disabled row "No efforts found", same pattern as the device row (`ui_laps_device_none`).
- **Nudge wording, two variants (settled):**
  - When blocks are found from a fallback signal: "Add FTP / threshold pace for precise efforts".
  - When no blocks are found and `limitedBy` is set: "Add FTP / threshold pace to detect efforts".
- **No user tuning controls.** Defaults (windows, thresholds, min lengths, PELT penalty) are taken from the mockup notes panel.
- **Settled on 2026-10-17 (former open questions):**
  - Summary-card laps row: counts work blocks only, and avg / fastest / slowest are taken over work blocks only. The strip is unchanged.
  - Strip: no hatched bridge overlay and no warm-up / cool-down legend. `cellColor` is the only change.
  - A stored `efforts` source on a session without efforts stays `efforts`: the row is checked and disabled with "No efforts found", and the pill reads "Laps". There is no fallback to `off`.

## Open

None. All questions answered on 2026-10-17.

- Follow-up (not this feature): per-block W/bpm via `LapAnalysis` (`src/lib/laps.ts:3-11`).

## Approach

### 1. Engine: `src/packages/engine/effortDetection.ts`

Port of the mockup `detect()` (`mockups/dynamic-efforts/index.html:296-515`), pure.

```ts
export type EffortSignal = 'power' | 'pace' | 'hr';
export type EffortLimiter = 'ftp' | 'thresholdPace';
export type EffortKind = 'work' | 'rest' | 'steady' | 'warmup' | 'cooldown';
export interface EffortThresholds { restHr: number; maxHr: number; ftp?: number; thresholdPace?: number } // thresholdPace sec/km
export interface EffortBlock { kind: EffortKind; start: number; end: number; startIndex: number; endIndex: number; movingTime: number } // s since first record, record indices, s
export interface EffortDetection { blocks: EffortBlock[]; signal: EffortSignal | null; limitedBy: EffortLimiter | undefined }
export const detectEfforts = (records: SessionRecord[], sport: Sport, thresholds: EffortThresholds, gradients?: Array<number | undefined>): EffortDetection
```

- `ResolvedThresholds` (`src/lib/thresholdsAt.ts:5-13`) is structurally assignable to `EffortThresholds`. The engine imports nothing from lib.
- Never throws. Fewer than 2 records, no usable signal, or a failed guard returns `blocks: []`. `signal: null` means no usable signal. `limitedBy` is set whenever a better signal was skipped for a missing threshold, also when blocks are found.
- Breaks (gaps, stops) never appear as blocks. Bridged stops sit inside a work block. `movingTime` excludes break seconds. Recorded `0` W stays `0`, and a missing value is `NaN` internally, never `0`.
- **Layout** (per engine CLAUDE.md): imports, exported types/interfaces, exported constants, unexported helpers, exported `detectEfforts`.
- **Constants** (exported, from the mockup `DEF` at `index.html:330-336` and the notes panel):
  - `EFFORT_SIGNAL_DEFAULTS: Record<EffortSignal, { minWork; enter; steady }>`:
    - power: `{ 30, 0.88, 0.75 }` (× FTP)
    - pace: `{ 60, 0.88, 0.82 }` (× threshold speed)
    - hr: `{ 120, 0.80, 0.70 }` (× HR reserve above rest)
  - `EFFORT_SIGNAL_ORDER: Record<Sport, EffortSignal[]>`: cycling `['power','hr']`, running `['pace','hr']`.
  - `EFFORT_BIN_S = 5`, `EFFORT_MIN_SEGMENT_BINS = 6` (30 s), `EFFORT_PENALTY_K = 4` (β = 4 · σ² · ln n), `EFFORT_DROPOUT_BINS = 3` (15 s).
  - `EFFORT_EDGE_SEARCH_S = 5` (refine edges ±5 s on the 5 s trace), `EFFORT_HR_SHIFT_S = 30`.
  - `EFFORT_MAX_BRIDGE_S = 130` (2:00 + 10 s), `EFFORT_ABSORB_S = 20`, `EFFORT_MIN_STEADY_S = 300`, `EFFORT_MIN_WARMUP_S = 180`.
  - `EFFORT_MIN_COVERAGE = 0.5`, `EFFORT_MAX_WORK_SHARE = 0.8`, `EFFORT_MIN_WORK_BLOCKS = 2`, `EFFORT_MIN_CONTRAST = 1.15`.
  - The mockup's 30 / 15 / 10 s smoothing windows (`DEF.*.cls`) only draw the inspector trace and are not ported.
- **Steps (helpers):**
  1. **1 s grid** from `timestamp` (rounded). A gap ≤ `MAX_MOVING_PAIR_GAP_S` (10 s, reused from `normalize.ts:4`) holds the closing record's values, the same semantics as `powerPerSecond`. Longer gaps, and `speed === 0` runs > 10 s, are breaks. Each grid second keeps its record index for `startIndex` / `endIndex`.
  2. **Signal pick** in `EFFORT_SIGNAL_ORDER`. A signal needs ≥ 50 % coverage of non-break seconds. Power without `ftp` sets `limitedBy = 'ftp'` and moves on; pace without `thresholdPace` sets `'thresholdPace'` and moves on. Pace signal = `speed × gradeAdjustedPaceFactor(gradient ?? 0)` (reuse `normalize.ts:54`), compared against threshold speed `1000 / thresholdPace`. HR is read 30 s ahead (`x[i] = hr[i + 30]`). `gradients` defaults to `windowedGradients(records)` (`gradient.ts:76`, like `calculateGAP` `normalize.ts:65-68`), and is computed only once pace is the chosen signal.
  3. **PELT** (`@see [Killick2012]`) per contiguous non-break run on 5 s bin means. Cost is the Gaussian mean shift; minimum segment is 6 bins; pruning is implemented properly (no `R.includes` scan as in the mockup). σ = median|Δbin| / (0.6745 · √2) (`@see [Hampel1974]`). NaN runs of ≥ 3 bins become their own segment (labelled rest); shorter NaN bins take the neighbour's value.
  4. **Label** segment means: ≥ `enter` is work, ≥ `steady` is steady, otherwise rest (NaN is rest). HR references are `restHr + k · (maxHr − restHr)` (`@see [Karvonen1957]`). Power `steady` 0.75 is the Coggan Z2/Z3 boundary (`@see [CogganAllen2010]`).
  5. **Postprocess** (mockup `postprocess`, `index.html:443-452`):
     - merge neighbours of the same kind;
     - bridge breaks ≤ 130 s that have work on both sides, absorbing non-work pieces < 20 s next to the break;
     - work with moving time < `minWork` becomes rest;
     - non-work pieces < 20 s between work blocks become work;
     - steady < 300 s becomes rest;
     - refine work / non-work edges to the mid-level crossing of the 5 s trace within ±5 s;
     - a leading or trailing non-work run ≥ 180 s up to a break becomes warm-up / cool-down.
  6. **Guards** that return `blocks: []`:
     - work > 80 % of moving time;
     - fewer than 2 work blocks;
     - work mean < 1.15 × mean of the other blocks.
- **Reuse:**
  - `MAX_MOVING_PAIR_GAP_S` and `gradeAdjustedPaceFactor` from `normalize.ts`, and `windowedGradients` from `gradient.ts`.
  - **Not** `powerPerSecond` (`normalize.ts:19-31`): it drops time alignment, while the grid needs a value per elapsed second, and it only covers power.
  - **Not** `movingSeconds` (`src/lib/movingTime.ts:37`): it lives in lib, so the engine can't import it. The engine's moving time is its own break mask.

### 2. Lib

- `LapSource` (`src/lib/lapSet.ts:6`) gets `'efforts'`; `LAP_SOURCES` (`src/store/mapPreferences.ts:22`) gets `'efforts'`.
  - **No persist version bump:** the persisted shape is unchanged, and `lapSourceSchema = z.enum(LAP_SOURCES)` (`:60`) only widens. Stored values still parse, and an unknown value falls back per field (`:74-75`).
  - An older build reading `efforts` falls back to `splits`, which is harmless.
- `LapSet` (`lapSet.ts:24-29`) gets `efforts?: { signal: EffortSignal; limitedBy: EffortLimiter | undefined }`, set only on effort sets.
- New `src/lib/effortLaps.ts`:
  - `buildEffortLapSet(records, sport, thresholds: ResolvedThresholds | undefined): { set: LapSet | null; signal: EffortSignal | null; limitedBy: EffortLimiter | undefined }`. With `thresholds === undefined` (no profile) it returns all-empty. This is where `limitedBy` comes back even without blocks.
  - Block → `LapSpan` `{ lapIndex: i, startRecord: startIndex, endRecord: endIndex }`; bands via `lapBands(records, spans)` (`src/lib/lapRanges.ts:42`).
  - Block → `LapAnalysis`:
    - `movingTime` = engine `movingTime`, so moving time follows the engine's own stop detection, including bridged stops (decision "block duration is moving time");
    - `distance` = record distance diff; `paceSecPerKm` = `movingTime / distance × 1000` when both > 0, as in `src/lib/dynamicLaps.ts:72-75`;
    - `intensity` from `KIND_INTENSITY`: work `'active'`, rest `'rest'`, steady `'steady'`, warmup `'warmup'`, cooldown `'cooldown'`;
    - `isInterval: kind === 'work'`, `isPartial: false`;
    - `hrRecoveries: []`.
  - `effortWorkCount(set)` = analysis with `isInterval`.
  - `effortPattern(set): { count: number; movingTime: number } | undefined`: ≥ 2 work blocks, each within ±10 % of their mean moving time (mockup `effortCaption`, `index.html:592-596`).
- `buildLapSet` (`lapSet.ts:48-64`) gets a 5th parameter `effortContext: { sport: Sport; thresholds: ResolvedThresholds | undefined }`; `if (source === 'efforts') return buildEffortLapSet(records, effortContext.sport, effortContext.thresholds).set;` before the splits path.

### 3. Thresholds and where the set is built

- `useSessionLapsEffect` (`src/features/sessions/session/hooks/useSessionLapsEffect.ts`):
  - also select the opened session's `date` (next to `sport`, `:12-14`);
  - `const thresholds = useThresholdsAt(date ?? 0)` (`src/lib/hooks/useThresholdsAt.ts:5`, same `?? 0` as `src/features/sessions/hooks/useSessionTitle.ts:12`);
  - pass `{ sport, thresholds }` to `buildLapSet` (`:27`) and add `thresholds` to the memo deps (`:28`).
- It stays on the main thread, synchronous in `useMemo`, as decided in `plans/session-detail-load-perf.md` ("laps stay on the main thread"). Today laps cost ~84 ms dev (`computeDynamicLaps` 59, `lapBands` 24). Effort detection only runs when the source is `efforts`, or once while the picker is open. The result is synchronous, so the mockup's "Detecting…" state isn't needed.
- Picker: `LapsControl` gets `date` (`src/features/sessions/session/SessionMapControls.tsx:31` passes `props.session.date`), and `LapsPicker` calls `useThresholdsAt(props.date)`. The effort result is memoised like `splitSet` (`LapsControl.tsx:101-104`):
  - when `source === 'efforts' && current`, it reuses `current` + `current.efforts`;
  - otherwise it calls `buildEffortLapSet` (needed for the chip, the swatch and `limitedBy`).

### 4. UI

- **Shared `Chip`** (`src/components/ui/Chip.tsx`): `<Typography variant="caption" as="span">` with `rounded bg-white/10 px-1.5 py-0.5` + `className`. The class string already appears twice, in `src/components/ui/Dialog.tsx:160-162` and `src/components/ui/MetricLabel.tsx:29-31`; the efforts row is the third use. Both existing sites switch to `Chip`.
- **Pill grammar** (`LapsControl.tsx:25-29`): `pillLabel(source, set)`:
  - off / no set: `ui_laps`;
  - efforts: `lapCountLabel(effortWorkCount(set), 'efforts')`;
  - device / splits: `lapCountLabel(set.analysis.length, source)`.
  - The `splitDistance` parameter is dropped (`:318` call updated), so `splitKm` + `kmFmt` (`lapLabels.ts:8`, `:27`) become dead code and are deleted.
- **`lapCountLabel`** (`lapLabels.ts:31-38`): efforts branch `ui_laps_efforts_one` / `ui_laps_efforts_count`.
  - The device branch keeps `ui_laps_pill_count` / `ui_laps_pill_one`, now reading "12 device laps".
  - This also changes the device desc when selected (`LapsControl.tsx:109`) and the summary row primary (`lapLabels.ts:81`), which stays consistent.
- **Efforts row** (`LapsControl.tsx:118-186`): fourth row after Splits, title `ui_laps_efforts`, swatch `LapSwatch set={effortSet}`, `disabled: effortSet === null`.
  - **Caption line** (reserved `h-5`): `Chip` with `effortChipLabel` (`truncate`), or a plain caption `ui_laps_efforts_none`.
  - **Nudge line** (reserved `h-4`, `pr-2 pb-2 pl-10 text-xs truncate`) sits **outside** `RadioGroupItem`, like the slider at `:179-181`, so the link stays clickable on the disabled row.
    - It holds `<Link to="/settings" className="text-accent hover:underline">{LIMITER_LABELS[limitedBy][found ? 'precise' : 'detect']()}</Link>` when `limitedBy` is set.
    - `LIMITER_LABELS: Record<EffortLimiter, { precise: () => string; detect: () => string }>` sits in `LapsControl.tsx`, following `BLOCKER_LABELS` (`src/features/sessions/session/MoreStatsRow.tsx:52-56`, Link at `:86-88`).
  - No width degradation (signal icon / short link): the mockup space check shows the real strings fit (desktop text column 178 px, phone 224 px); `truncate` is the safety net. The popover stays `lg:w-80` (`:314`).
  - `onValueChange` (`:151-159`): `efforts` closes the popover like off / device.
- **`effortChipLabel(set, signal)`** in `lapLabels.ts`:
  - summary = `ui_laps_efforts_pattern({ count, duration })` (duration via `duration()` `src/features/sessions/session/statFormat.ts:10`) when `effortPattern` matches, else `lapCountLabel(workCount, 'efforts')`;
  - then `ui_laps_efforts_chip` or `ui_laps_efforts_chip_approx` (hr) with `SIGNAL_LABELS[signal]()`.
- **Stepper** (`LapsControl.tsx:219-281`): name slot `w-[72px]` → `w-[104px]` (`:254`), for all sources. `LapStepper` gets `sport` (`:303`), and `lapName` (`:258`) gets the set.
- **`lapName`** (`lapLabels.ts:116-120`) → `lapName(set, lapIndex, source, sport)`. For efforts, the name comes from the lap's `intensity`, plus an ordinal counted over earlier laps of the same intensity in `set.analysis`:
  - active → `ui_effort_work_label`;
  - rest → `ui_effort_rest_label`;
  - steady → `ui_effort_steady_label`;
  - warmup / cooldown → `ui_effort_warmup_ride|run` / `ui_effort_cooldown_ride|run` by sport.
  - Other callers: `LapsRow.tsx:62` (`LapExtreme` gets `set`, `:50-55`, `:74-85`).
- **`cellColor`** (`src/features/sessions/session/LapStrip.tsx:16-22`): `if (lap?.intensity === 'steady') return 'rgba(255,255,255,.45)';` before the non-active case at `:19` (mockup `index.html:711`).
- **Summary row** (`LapsRow.tsx`, `lapsRowLabels`): `'efforts'` with no set → disabled, `ui_laps_efforts_none` / `ui_laps_row_device_hint`. Counting and extremes follow Q1.

### 5. Messages (EN / DE)

Changed:

| Key                  | EN                    | DE                     |
| -------------------- | --------------------- | ---------------------- |
| `ui_laps_pill_count` | `{count} device laps` | `{count} Geräterunden` |
| `ui_laps_pill_one`   | `1 device lap`        | `1 Geräterunde`        |

Deleted: `ui_laps_pill_splits` (splits pill now uses `ui_laps_splits_count` / `ui_laps_splits_one`).

New:

| Key                                          | EN                                       | DE                                                     |
| -------------------------------------------- | ---------------------------------------- | ------------------------------------------------------ |
| `ui_laps_efforts`                            | `Efforts`                                | `Belastungen`                                          |
| `ui_laps_efforts_count`                      | `{count} efforts`                        | `{count} Belastungen`                                  |
| `ui_laps_efforts_one`                        | `1 effort`                               | `1 Belastung`                                          |
| `ui_laps_efforts_none`                       | `No efforts found`                       | `Keine Belastungen erkannt`                            |
| `ui_laps_efforts_pattern`                    | `{count} × {duration}`                   | `{count} × {duration}`                                 |
| `ui_laps_efforts_chip`                       | `{summary} · {signal}`                   | `{summary} · {signal}`                                 |
| `ui_laps_efforts_chip_approx`                | `{summary} · {signal} ≈`                 | `{summary} · {signal} ≈`                               |
| `ui_laps_effort_signal_power`                | `power`                                  | `Leistung`                                             |
| `ui_laps_effort_signal_pace`                 | `pace`                                   | `Pace`                                                 |
| `ui_laps_effort_signal_hr`                   | `heart rate`                             | `Herzfrequenz`                                         |
| `ui_laps_efforts_precise_ftp`                | `Add FTP for precise efforts`            | `FTP eintragen für genaue Belastungen`                 |
| `ui_laps_efforts_precise_threshold_pace`     | `Add threshold pace for precise efforts` | `Schwellentempo eintragen für genaue Belastungen`      |
| `ui_laps_efforts_detect_ftp` (Q3)            | `Add FTP to detect efforts`              | `FTP eintragen, um Belastungen zu erkennen`            |
| `ui_laps_efforts_detect_threshold_pace` (Q3) | `Add threshold pace to detect efforts`   | `Schwellentempo eintragen, um Belastungen zu erkennen` |
| `ui_effort_work_label`                       | `Work {number}`                          | `Belastung {number}`                                   |
| `ui_effort_rest_label`                       | `Rec {number}`                           | `Erholung {number}`                                    |
| `ui_effort_steady_label`                     | `Steady {number}`                        | `Gleichmäßig {number}`                                 |
| `ui_effort_warmup_ride`                      | `Warm-up`                                | `Einfahren`                                            |
| `ui_effort_warmup_run`                       | `Warm-up`                                | `Einlaufen`                                            |
| `ui_effort_cooldown_ride`                    | `Cool-down`                              | `Ausfahren`                                            |
| `ui_effort_cooldown_run`                     | `Cool-down`                              | `Auslaufen`                                            |

### 6. SOURCES.md (`src/packages/engine/SOURCES.md`)

- Validation Summary (after `:36`):
  - `effortDetection.ts` | PELT change points (Gaussian mean-shift cost) on 5 s bins | `[Killick2012]` | Standard algorithm
  - `effortDetection.ts` | Noise σ from the MAD of bin differences | `[Hampel1974]` | Standard robust estimator
  - `effortDetection.ts` | HR reference as % of heart-rate reserve | `[Karvonen1957]` | Matches published method
- Bibliography (after `:67`):
  - `[Killick2012]` Killick, R., Fearnhead, P. & Eckley, I.A. (2012). "Optimal detection of changepoints with a linear computational cost." _JASA_, 107(500), 1590–1598. doi:10.1080/01621459.2012.737745.
  - `[Hampel1974]` Hampel, F.R. (1974). "The influence curve and its role in robust estimation." _JASA_, 69(346), 383–393. doi:10.1080/01621459.1974.10482962.
- App-Specific Logic (after `:79`): one `effortDetection.ts` row with the work / steady factors (0.88 / 0.82 / 0.80, 0.75 / 0.82 / 0.70), penalty 4 · σ² · ln n, min lengths, bridging 130 s + 20 s absorption, dropout 15 s, guards and the 30 s HR shift ("App heuristic, tuned on synthetic scenarios in the mockup").

## Files

**Create:**

- `src/packages/engine/effortDetection.ts`
- `src/lib/effortLaps.ts`
- `src/components/ui/Chip.tsx`
- `tests/packages/engine/effortDetection.spec.ts`
- `tests/lib/effortLaps.spec.ts`

**Modify:**

- `src/lib/lapSet.ts:1-6,24-29,48-64`: `'efforts'`, `LapSet.efforts`, `effortContext` param + branch.
- `src/store/mapPreferences.ts:22`: `'efforts'` in `LAP_SOURCES`.
- `src/features/sessions/session/hooks/useSessionLapsEffect.ts:1-8,12-14,24-28`: session date, `useThresholdsAt`, pass context.
- `src/features/sessions/session/SessionMapControls.tsx:31`: pass `date`.
- `src/features/sessions/session/LapsControl.tsx`:
  - `:1-23`: imports `Link`, `Chip`, `useThresholdsAt`, effort lib;
  - `:25-29`: `pillLabel`, plus `LIMITER_LABELS` / `SIGNAL_LABELS`;
  - `:31-35`: `date` prop;
  - `:87-104`: effort result memo;
  - `:118-186`: efforts row, chip line, nudge line, `onValueChange`;
  - `:219,254,258`: stepper `sport`, `w-[104px]`, `lapName`;
  - `:303,318`: call sites.
- `src/features/sessions/session/lapLabels.ts:8,27`: delete `kmFmt` / `splitKm`. `:31-38`: efforts count. `:65-114`: efforts in `lapsRowLabels` (Q1). `:116-120`: `lapName` with set + sport. New `effortChipLabel`.
- `src/features/sessions/session/LapsRow.tsx:50-65,67-85,115-120`: `lapName` with set; efforts handling (Q1, Q4).
- `src/features/sessions/session/LapStrip.tsx:16-22`: steady case.
- `src/components/ui/Dialog.tsx:160-162`, `src/components/ui/MetricLabel.tsx:29-31`: use `Chip`.
- `messages/en.json:694-727`, `messages/de.json:694-727`: keys above.
- `src/packages/engine/SOURCES.md:36,67,79`: rows above.
- `e2e/sessions.spec.ts:114,155,164`: pill text (see Tests).

**Delete:** no files. Deleted code: `splitKm`, `kmFmt` (`lapLabels.ts`), key `ui_laps_pill_splits`.

## Tests

- `tests/packages/engine/effortDetection.spec.ts`: synthetic 1 Hz records built in the spec from segments of power / HR / speed with seeded noise; profile FTP 250, rest 50, max 190, threshold pace 255 s/km.
  - **5×4 min intervals:** power ride. Expect 5 work blocks, each start / end within ±5 s of the truth, a warm-up and a cool-down, `signal: 'power'`.
  - **Endurance ride:** 3 h at 0.6–0.8 FTP over rolling hills with coasting 0 W. Expect `blocks: []`.
  - **Race / TT:** 60 min at ~0.98 FTP. Expect `blocks: []` (work share guard).
  - **Traffic light:** a 2:00 stop (speed 0, sparse smart recording) inside a work block. Expect one work block across the stop, with `movingTime` ≈ elapsed − 120 s. A 2:30 stop splits the block.
  - **HR-only ride:** no power. Expect `signal: 'hr'`, and each work start within ±20 s of the truth with a 30 s lag τ. Without the shift the edges would be ~30 s late.
  - **Missing threshold:**
    - power + HR, no FTP: blocks from HR, `limitedBy: 'ftp'`;
    - power only, no FTP: `blocks: []`, `signal: null`, `limitedBy: 'ftp'`.
- `tests/lib/effortLaps.spec.ts`: `effortPattern`. Five work blocks within ±10 % → `{ count: 5, movingTime ≈ 240 }`. One block 20 % longer → `undefined` (the chip falls back to the count).
- No component tests. No persist test: no migration, and the store shape is unchanged. `tests/store/mapPreferences.spec.ts` still covers unknown values.
- **E2E updates** (`e2e/sessions.spec.ts`):
  - `:114` `/^(1|5) km splits$/` → `/^\d+ splits$/`;
  - `:155` `/km splits/` → `/^\d+ splits$/` (`:154` `not.toHaveText(defaultLabel)` still holds, since a longer split distance gives fewer splits);
  - `:164` same as `:114`.
  - `:61` (`/^\d+ splits · avg/`), `:72`, `:124`, `:146` are unaffected.
  - No other e2e asserts lap pill text (`e2e/map.spec.ts:42,97,133`, `e2e/mobile/map.spec.ts:489` only check visibility).
- No new e2e: the seeded demo sessions have no interval structure, so efforts are covered by the engine spec plus manual checks.

## Verification

1. `vp build` first (new message keys, then the Paraglide output), then `vp check`, `vp test -- --run`, `vp exec playwright test`, `vp build`.
2. Manual, desktop and 390 px, EN and DE:
   - **Interval ride with power + FTP:** the efforts row shows `5 × 4:01 · power` / `· Leistung`; the pill reads `5 efforts` / `5 Belastungen`; the swatch shows warm-up / steady / rest shades; chart bands line up with the efforts.
   - **Pill grammar:** device `12 device laps` / `12 Geräterunden`, splits `6 splits` / `6 Splits`, Off `Laps` / `Runden`; the phone bar scrolls instead of clipping.
   - **Remove FTP in Settings:** HR fallback, chip `… · heart rate ≈`, link "Add FTP for precise efforts" opens Settings.
   - **Power-only trainer ride without FTP:** disabled row "No efforts found" with an active link.
   - **Endurance ride:** "No efforts found", no link.
   - **Run without threshold pace:** the threshold pace nudge.
   - **Stepper:** steps through Work / Rec / Steady / warm-up names; "Gleichmäßig 12" fits in `w-[104px]`; ride vs run warm-up wording in DE.
   - **Popover:** stays `w-80`, chip and link don't wrap, lines don't jump between sessions.
3. A quick DevTools check of the laps hot path on a 3 h ride with `efforts` selected, against the ~84 ms dev laps baseline in `plans/session-detail-load-perf.md`.

## Delivery and acceptance

- **Review document (part of the implementation output):** `reviews/dynamic-efforts/index.html`. It is local only: one self-contained file plus screenshots in the same folder, not published and not committed.
  - Every UI or flow change is labelled (`C1`, `C2`, …) on a screenshot (desktop and 390 px; EN, plus DE where the copy changed) and explained in one or two lines: what changed, where (`path:line`), and why (which decision).
  - Changes without a UI (engine, store, migration) get one short labelled entry each, with what the owner can observe.
  - Screenshots come from the running app via the repo's Playwright, taken after the verification suite passes.
- **Acceptance:** the owner reviews the code and the review document. Only after the owner's explicit acceptance are `mockups/dynamic-efforts/`, `reviews/dynamic-efforts/` and this plan deleted. Nothing is cleaned up before that.

## Risks

- **PELT cost on long sessions:** 3 h is ~2160 bins, ~linear with pruning; an ultra of 10 h+ can drift towards quadratic. It runs on the main thread (per the load-perf decision). If it is too slow, it moves into a worker later.
- **Thresholds become a memo dependency:** a profile edit rebuilds the lap set for every source; it's cheap for device and splits.
- **Device-lap wording leaks:** "12 device laps" also shows in the summary row primary and the device row caption.
- **Stop detection needs `speed`:** an indoor ride without speed has no stops, only gaps > 10 s.
- **The HR shift is a fixed 30 s:** with 60–90 s lag, edges stay late; this is why the label says "≈".
- **`LapAnalysis.movingTime` for efforts uses the engine's break mask**, while band widths use `movingSeconds`. Small mismatches between a chip duration and a band width are possible, as with device laps today.
- **No chip degradation:** an unusually long string truncates with an ellipsis.
- **`efforts` persists per sport:** sessions without efforts show the "Laps" pill until the user switches (Q4).
