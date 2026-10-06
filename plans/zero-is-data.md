# 0 is data, missing is missing

## Context
Hovering one compact session chart makes the circle in the other charts drift away from the cursor line. Cause: the chart preparation drops every record whose value is 0, so the series have different lengths. In a real 11-hour ultra HR kept 37,809 points, power 18,174. Recharts syncs by index, so index N lands at a different position in each chart.

The same mistake runs through statistics, zones, PBs and laps (in that ultra: avg power 231 W without zeros vs 111 W with them). The opposite mistake sits in the FIT parser: missing values silently become 0 (`?? 0`) or the whole record/lap array silently becomes `[]`.

## Rules (settled)
- Missing data = missing key, `null` or `undefined`. **0 is a value.**
- Fields the app reads and cannot work without **throw** when missing (session `start_time`, `sport`, `total_timer_time`; lap `start_time`, `timestamp`, `total_elapsed_time`, `total_timer_time`; record `timestamp`). Activity and File ID messages, laps and records themselves are not required. Everything else is optional and stays `undefined`, never 0.
- Files missing required messages (e.g. a crashed watch: records but no session/lap) are **rejected** with a clear error.
- Power above `MAX_VALID_POWER` is kept and counted as recorded; only the sensor warning stays.
- Pace/GAP are `null` only at speed 0 (division by zero).
- Existing sessions get new stored values only through the **manual re-import** (`src/features/settings/hooks/useReimport.ts`); no migration.
- The rules go into `CLAUDE.md` §2.

## Order
### 1. Types (`src/packages/engine/types.ts`)
- `TrainingSession.distance` (`:42`) → optional (treadmill, strength, no GPS)
- `SessionLap.distance`, `avgSpeed` (`:98-99`) → optional
- `startTime`, `endTime`, `totalElapsedTime`, `totalTimerTime` stay required, because the parser now guarantees them

### 2. Parser (`src/parsers/fit.ts`)
Required, throw when missing:
| Message | Fields | Today |
| --- | --- | --- |
| Session (≥ 1) | `start_time`, `sport`, `total_timer_time` | `sport`/`start_time` already throw (`:201-212`); durations fall back `?? 0` (`:246`, `:264`) |
| Lap (if present) | `start_time`, `timestamp`, `total_elapsed_time`, `total_timer_time` | `= 0` / `?? 0` (`:128-146`) |
| Record (if present) | `timestamp` (→ `elapsed_time`, computed by fit-file-parser) | `?? 0` (`:112`) |

Optional, `undefined` instead of 0:
- lap `total_distance`, `avg_speed` (`:148-149`)
- session distance: last defined record distance → `fitSession.total_distance` → `undefined` (`deriveDistanceFromRecords`, `:68-77`)

Silent fallbacks become errors:
- `fitRecordsSchema` / `fitLapsSchema` failure → throw instead of `[]` (`:215-226`)

Errors follow the existing format `Failed to parse FIT file "<name>": <what is missing>`.

### 3. Consumers: optional fields + "0 is data"
Handle `session.distance` (~18 sites) and `lap.distance` / `lap.avgSpeed` (~9 sites) being missing. In the same files, stop treating 0 as missing:
| Where | Change |
| --- | --- |
| `src/parsers/fit.ts:83`, `:92` (`deriveAvg/MaxFromRecords`) | count every defined value, including 0 |
| `src/parsers/fit.ts:239` (`hasPowerRecords`) | power is defined |
| `src/packages/engine/normalize.ts:14-38` (NP) | zeros count in the 30-s window; missing values are skipped |
| `src/packages/engine/normalize.ts:67-109` (GAP) | skip speed 0; missing elevation/distance no longer count as 0 (`:85`, `:95`) |
| `src/packages/engine/zoneDistribution.ts:55`, `:143` | 0 counts (lowest zone) |
| `src/packages/engine/zoneDistribution.ts:195` | pace zones: speed > 0 |
| `src/packages/engine/stress.ts:118` | `avgHr !== undefined` |
| `src/lib/validation.ts:89-91` (`filterValidPower`) | delete |
| `src/lib/records.ts:78-80` (peak power) | zeros stay in the windows |
| `src/lib/records.ts:106` | distance defined, including 0 |
| `src/lib/laps.ts:370-377` (`enrichLapFromRecords`) | every defined value; no 0.5 cut for `minSpeed` |
| `src/lib/dynamicLaps.ts:49`, `:61` | HR/cadence including 0 |
| `src/features/map/zoneColoredPath.ts:87-94` | zone colour for every defined value; pace at speed > 0 |
| `src/features/sessions/session/SessionStatsGrid.tsx:113`, `:126`, `:147`, `:149`, `:172` | show the tile when the value is defined, not when it's truthy |

Not affected: division guards (`src/lib/laps.ts:79`, `:183`, `:189`, `src/lib/dynamicLaps.ts:45`, `src/parsers/fit.ts:279`, `src/lib/lapChartData.ts:51`, `:64`).

### 4. Charts (`src/lib/chartData.ts`), the drift fix
- every `prepare*Data` returns exactly one point per record; the value is `null` when it's missing
- `preparePowerData`: no `filterValidPower`; `preparePaceData`/`prepareGAPData`: `null` at speed 0
- point types: `number | null`; every session `Line`/`Area` gets `connectNulls`

### 5. Rules in `CLAUDE.md` §2

## Effect on existing sessions
Charts, zones, laps and PBs are computed from the records and change right away. The stored `avgPower`, `maxPower`, `avgCadence`, NP and TSS change after a manual re-import.

## Tests
- `tests/parsers/fit.spec.ts`: one throw case per required field/message; optional fields `undefined`; avg/max including 0
- `tests/lib/chartData.spec.ts`: every series has `records.length` points; 0 stays 0; missing → `null`; pace `null` at speed 0
- NP, zones, peak power, lap enrichment, dynamic laps: one case each with zeros
- `tests/engine/validation.spec.ts`, `tests/engine/stressPipeline.integration.test.ts`: drop the `filterValidPower` parts
- `tests/lib/chartData.integration.test.ts`: synthetic 6-hour ride with stops and missing power; every chart series has the same length

## Verification
`vp check`, `vp test -- --run`, `vp exec playwright test`, `vp build`. Manually: load a long session with stops, hover each chart between 02:00 and 18:00; the circle stays on the line in every chart.
