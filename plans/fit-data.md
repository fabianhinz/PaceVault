# FIT data: drop stored-but-unused fields

## Context

- `parseFitFile` stores more than the app reads. Each field below is written in `src/parsers/fit.ts` and typed in `src/packages/engine/types.ts`, but nothing in `src/` reads it (grep, 2026-10-11). The only exceptions are its own fallback (`reprocessSessions.ts`), demo data and test factories.
  - Session: `calories` (`fit.ts:256`, `types.ts:50`), `movingTime` (`fit.ts:201,259`, `types.ts:53`), `deviceTss`/`deviceIf`/`deviceFtp` (`fit.ts:261-263`, `types.ts:55-57`), `min/max/avgAltitude` (`fit.ts:265-267`, `types.ts:60-62`), `maxPower` (`fit.ts:251`, `types.ts:46`).
  - `movingTime`: its only read is `reprocessSessions.ts:89`, which falls back to itself. `deriveMovingTimeFromLaps` (`sessionDerivation.ts:48-51`) has no other caller.
  - `maxPower`: its only read is `reprocessSessions.ts:86`, also a self-fallback. The power rail takes its max from the records (`railRange.ts`). `RecordDerivedFields.maxPower` (`sessionDerivation.ts:7,64`) only feeds it.
  - Lap (`fit.ts:113,117-129`, `types.ts:94,98-104,107-108,110`): `totalElapsedTime`, `avgSpeed`, `maxSpeed`, `totalAscent`, `min/max/avgAltitude`, `avgHr`, `avgCadence`, `maxCadence`, `repetitionNum`. `avgHr`/`avgCadence`/`maxSpeed`/`totalAscent` only feed the dead `LapAnalysis` fields below. The input `total_elapsed_time` stays required: it is the `endTime` fallback (`fit.ts:106`).
- `LapAnalysis` (`src/lib/laps.ts:3-18`) is built in `analyzeLaps` (`:55-70`) and `computeDynamicLaps` (`src/lib/dynamicLaps.ts:107-120`). Consumers (`LapStrip`, `LapsRow`, `LapsControl`, `LapBands`, `lapSummary.ts`) read only `lapIndex`, `paceSecPerKm`, `distance`, `movingTime`, `intensity`, `isInterval` and `isPartial`. Never read: `avgHr`, `minHr`, `maxHr`, `avgCadence`, `timerTime`, `elevationGain` and `maxSpeed`.
- `LapSet.enrichments` (`src/lib/lapSet.ts:32,49,68`) is set and never read. That makes `LapRecordEnrichment`, `filterRecordsByLap`, `enrichLapFromRecords` and `enrichAllLaps` (`laps.ts:109-191`) and `DynamicLapResult.enrichments` (`dynamicLaps.ts:34,68,76,123,143`) dead code.
- `FitUserProfile` (`fit.ts:28-32`) and `ParsedFitResult.fitUserProfile` (`:38`) are never set or read.
- `UnsupportedSportError` (`fit.ts:48-56`) is exported, but nothing imports it, catches it by type or reads `fitSport`. Only `crashReport.ts:15` reads `error.name`, and it does so generically.
- Calories: intervals.icu-generated FITs (no original file, `src/lib/intervals.ts:119`) carry no `total_calories`, and the device figure isn't comparable across devices. `plans/calorie-estimate.md` replaces it with an engine estimate.
- Persistence: sessions live in `store-sessions` (v3, `src/store/sessions.ts:93-97`) and laps in the IDB `session-laps` store (`src/lib/db.ts:12-14`). Neither is read through a Zod schema, and `session-records` holds none of these fields.

## Decisions (settled)

- **Pure cleanup.** Device calories are not shown. `total_calories` is dropped like the other fields. No new FIT fields: device TE, VO2max and running dynamics are out of scope, and so are carbs (`plans/backlog.md`).
- **Kept because they are read:** session `avgSpeed`, `maxSpeed`, `maxHr`, `avgPower`, `avgCadence`, `normalizedPower`, `elevationLoss`, `subSport`, `avgPace`; lap `totalMovingTime` (`laps.ts:49`, pace), `minHr`/`maxHr` (`detectIntervals`, `laps.ts:99-100`), `intensity`, `distance`, `totalTimerTime`.
- **No persist bump, no migrate.** The shape is only narrowed. Stale keys in stored JSON are inert because nothing reads them and no schema rejects them. A reparse drops them anyway, since `mergeReparsedSession` spreads the fresh fields (`reprocessSessions.ts:30-46`) and laps are rewritten (`:64-72`). `SESSION_DERIVATION_VERSION` stays 2.
- **`UnsupportedSportError` → plain `Error`** with the same message, the same pattern as the required-field throws.
- **`enumStr`, `fitRecordSchema`, `fitLapSchema` stay exported.** `tests/CLAUDE.md` asks for Zod fallbacks on file input to be tested, at the lowest level. `tests/parsers/fitSchemas.spec.ts` does exactly that.

## Approach

- `src/parsers/fit.ts`:
  - Delete `FitUserProfile` (`:28-32`) and `fitUserProfile?` (`:38`).
  - Replace the `UnsupportedSportError` class (`:48-56`) with an inline `throw new Error(...)` at `:172`.
  - Drop the lap fields at `:113,117-123,126-127,129` (keep `minHr`, `maxHr`, `intensity`).
  - Drop the session fields `maxPower` (`:251`), `calories` (`:256`), `movingTime` (`:259`, plus `:201` and the `deriveMovingTimeFromLaps` import `:15`), and `:261-263,265-267`.
- `src/parsers/fitSchemas.ts:47-58,61-62,64`: drop the unused lap inputs (`avg/max_speed` and their enhanced variants, `total_ascent`, all altitude fields, `avg_heart_rate`, `avg_cadence`, `max_cadence`, `repetition_num`).
- `src/packages/engine/types.ts`: drop the session fields `:46,50,53,55-57,60-62` and the lap fields `:94,98-104,107-108,110`.
- `src/packages/engine/sessionDerivation.ts`: delete `deriveMovingTimeFromLaps` (`:48-51`) and `maxPower` (`:7,64`).
- `src/features/sessions/reprocessSessions.ts:5,86,89`: drop the `maxPower` and `movingTime` lines and the import.
- `src/lib/laps.ts`: `LapAnalysis` keeps `lapIndex`, `paceSecPerKm`, `distance`, `movingTime`, `intensity`, `isInterval`, `isPartial`. Trim `analyzeLaps` to match, and delete `:109-191` (the enrichment code). Drop `SessionRecord` from the import.
- `src/lib/dynamicLaps.ts`: drop the `enrichments` plumbing, the dead fields (`:95,103-105,110-113,115,117,119`) and the helpers `roundedAverage`, `maxOf`, `elevationGainOf` (`:38-58`).
- `src/lib/lapSet.ts:5,7,32,49,68`: drop `enrichments`.
- `src/features/dashboard/generateDevData.ts:311-318,356,360`: drop `maxPower` and `calories`. This file goes away with `plans/demo-data.md`; until then it must still typecheck.
- `src/lib/factories/records.ts`: in `makeLaps` (`:262-279`) and `makeLapsFromRecords` (`:304-371`), drop the deleted lap fields and their computations. Keep `hrs` for `minHr`/`maxHr`.

## Affects other plans

- `calorie-estimate.md`: adds the calories row back, fed by the engine estimate rather than `session.calories`.
- `demo-data.md`: it mirrors `fit.ts:242-275`, so it must not set `calories`, `movingTime`, altitudes, `maxPower` or device TSS. Unlike its list, lap `totalMovingTime` **stays** because it drives lap pace (`laps.ts:49`).
- `backlog.md:19` still links `plans/session-calories.md`, which should now point to `calorie-estimate.md`. Not edited here.

## Tests

No new tests: this is pure deletion. Existing tests whose subject goes away are updated or deleted (`tests/CLAUDE.md`):

- `tests/parsers/fitLaps.spec.ts`:
  - Drop the deleted-field asserts (`:40,44-47,50-51,53`) and the fixture keys (`:11,14-18,20`).
  - Delete the tests at `:56`, `:106` and `:128`, the `repetitionNum` asserts `:156-157`, and the `movingTime derivation` describe (`:161-185`).
- `tests/parsers/fitRequiredFields.spec.ts:98-102`: drop the `avgSpeed` assert and rename the test to "lap distance undefined when missing".
- `tests/parsers/fitSchemas.spec.ts`: delete "accepts enhanced fields" (`:133`) and trim the deleted keys from "accepts a full lap" (`:98`).
- `tests/engine/lapsAnalysis.spec.ts`: drop the enrichment imports (`:5-7`), `avgSpeed` (`:20`) and the describes `filterRecordsByLap`/`enrichLapFromRecords`/`enrichAllLaps` (`:149-329`).
- `tests/engine/dynamicLaps.spec.ts`:
  - Drop the `enrichments` asserts (`:10,17,24`).
  - Delete the tests at `:71`, `:82`, `:90`, `:108`, `:117` and `:126`, and the describe at `:136-148`.
- `tests/lib/lapSummary.spec.ts:9-18`: drop the deleted `LapAnalysis` keys from the factory.
- `tests/features/sessions/reprocessSessions.integration.test.ts:141,152`: drop `movingTime`.
- `tests/factories/sessions.ts:19`: drop `calories`.

## Verification

`vp check`, `vp test -- --run`, `vp exec playwright test`, `vp build`. Afterwards, `grep -rn "calories\|deviceTss\|repetitionNum\|Altitude\|enrichments\|fitUserProfile\|UnsupportedSportError" src tests` should return nothing. By hand: open a session with device laps and one with splits. Lap pace, the interval HR recovery and the lap bands are unchanged.
