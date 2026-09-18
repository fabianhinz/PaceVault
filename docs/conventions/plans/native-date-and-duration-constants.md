---
id: native-date-and-duration-constants
tdr_reference: tdr/native-date-and-duration-constants.md
generated: 2026-09-17
---

# Native Date with composed millisecond duration constants

Read `tdr/native-date-and-duration-constants.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Add the shared duration-constant module.
   Files: new `src/lib/duration.ts`
   Change: create a module exporting `MS_PER_SECOND = 1000`, `MS_PER_MINUTE = 60 * MS_PER_SECOND`, `MS_PER_HOUR = 60 * MS_PER_MINUTE` and `MS_PER_DAY = 24 * MS_PER_HOUR`, each defined by composition from the one below it so the unit is readable at the declaration. Add `tests/lib/duration.spec.ts` asserting each constant's value, per `tests/CLAUDE.md`, which requires tests for every change under `src/lib/`.
   Check: `pnpm test -- --run tests/lib/duration.spec.ts` passes.

2. Replace the inline day conversions in the time-range helper.
   Files: `src/lib/timeRange.ts`
   Change: line 29's `now - days * 24 * 60 * 60 * 1000` becomes `now - days * MS_PER_DAY`. Line 43's `(new Date(range.to).getTime() - new Date(range.from).getTime()) / (24 * 60 * 60 * 1000)` becomes the same subtraction divided by `MS_PER_DAY` — which is already R4's shape, so only the divisor changes.
   Check: `grep -n "60 \* 60 \* 1000" src/lib/timeRange.ts` returns nothing; `pnpm test -- --run tests/lib/timeRange.spec.ts` passes.

3. Replace the inline conversions in the dev-data generator.
   Files: `src/features/dashboard/generateDevData.ts`
   Change: line 267's `entry.dayOffset * 24 * 60 * 60 * 1000` becomes `entry.dayOffset * MS_PER_DAY`, and `randomBetween(6, 20) * 3600 * 1000` becomes `randomBetween(6, 20) * MS_PER_HOUR`.
   Check: `grep -n "3600 \* 1000\|60 \* 60 \* 1000" src/features/dashboard/generateDevData.ts` returns nothing; `pnpm check`.

4. Sweep for remaining bare duration literals passed as timeouts, intervals or cache lifetimes.
   Files: all of `src/`
   Change: run R3's detection signal. For every `setTimeout`, `setInterval`, debounce delay, React Query `staleTime`/`gcTime` or IndexedDB expiry receiving a bare numeric literal, bind it to a named module-scope constant whose name carries the unit (`WEATHER_CACHE_MS`, `THRESHOLD_DEBOUNCE_MS`). A value under a second stays a plain number in its named constant; only a second or more goes through `MS_PER_*` (R2). `src/features/settings/ThresholdsSection.tsx` has a hand-rolled debounce whose delay is the likely first hit.
   Check: R3's grep returns no unnamed literal; `pnpm check && pnpm test -- --run`.

5. Confirm no date library has crept in and no `Date` is mutated.
   Files: `package.json`, all of `src/`
   Change: none expected. Confirm `package.json` lists no `date-fns`, `dayjs`, `luxon` or `moment` (R1), and that R5's grep finds no `set*` mutator call on a `Date` instance.
   Check: `grep -nE "date-fns|dayjs|luxon|moment" package.json` returns nothing; R5's grep returns nothing.

## Open items

None.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
