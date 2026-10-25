---
id: domain-error-subclasses
tdr_reference: tdr/domain-error-subclasses.md
depends_on: [authenticated-fetch-and-response-parsing, exhaustive-record-maps-over-branching, mirrored-spec-layout]
generated: 2026-10-23
---

# Error subclasses declared at the throw site, caught by type at the boundary

Read `tdr/domain-error-subclasses.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`authenticated-fetch-and-response-parsing`](authenticated-fetch-and-response-parsing.md) — introduces the failed-response error type in lib/intervals.ts that this plan's error class merges into
- [`exhaustive-record-maps-over-branching`](exhaustive-record-maps-over-branching.md) — item 4 applies its exhaustive-map rule (R2, R9) to the intervals error message once item 2 has typed the code
- [`mirrored-spec-layout`](mirrored-spec-layout.md) — renames `apps/web/tests/store/userStore.integration.test.ts` to `apps/web/tests/store/user.integration.spec.ts`, the spec item 5 extends

## Changes

`apps/web/src` declares no `Error` subclass today. The one failure a consumer branches on — the intervals.icu error code — travels as the message of a bare `Error` (`throw new Error(result.code)`) and is read back with `err.message as IntervalsErrorCode`. Every item's Check includes `vp run check` clean and `vp run test` green.

1. Give the intervals.icu request failure a type that carries its code (R2, R3, R4, R5, R6, R7).
   Files: `apps/web/src/lib/intervals.ts` (after `classify`, around `:26`), `apps/web/src/features/intervals/hooks/useIntervalsKeyCheck.ts:6-10`, `apps/web/src/features/intervals/runIntervalsSync.ts:53-56`.
   Change: in `lib/intervals.ts`, the module that owns the intervals.icu operations, declare the class and the one helper that throws it:

   ```ts
   export class IntervalsRequestFailedError extends Error {
     public readonly code: IntervalsErrorCode;

     constructor(code: IntervalsErrorCode, options?: ErrorOptions) {
       super(`intervals.icu request failed: ${code}`, options);
       this.name = 'IntervalsRequestFailedError';
       this.code = code;
     }
   }

   export const intervalsDataOrThrow = <T>(result: IntervalsResult<T>): T => {
     if (!result.ok) throw new IntervalsRequestFailedError(result.code);
     return result.data;
   };
   ```

   `intervalsDataOrThrow` is the only throw site of the class. `verifyIntervalsKeyOrThrow` becomes `async (apiKey: string) => intervalsDataOrThrow(await verifyIntervalsKey(apiKey))`; in `runIntervalsSync.ts` the `if (!listed.ok) { …markIntervalsKeyInvalid(); throw new Error(listed.code); }` block keeps its `markIntervalsKeyInvalid()` branch and the activities come from `intervalsDataOrThrow(listed)`. If the authenticated-fetch plan has already replaced the `{ ok, code }` results with a thrown error type carrying the `Response`, add `code` (from the shared `classify(status)`) to that class instead of declaring a second one.
   Check: `rg -n "throw new Error\((result|listed)\.code\)" apps/web/src` → nothing; `rg -n "throw new IntervalsRequestFailedError" apps/web/src` → one hit, in `apps/web/src/lib/intervals.ts`.

2. Branch on the type at the form boundary instead of parsing the message (R9).
   Files: `apps/web/src/features/intervals/IntervalsConnectionForm.tsx:64-67,86-88,123-126`, `apps/web/tests/lib/intervals.spec.ts`.
   Change: `const code = keyCheck.error.message as IntervalsErrorCode; if (code === 'unauthorized') …` → `const error = keyCheck.error; if (error instanceof IntervalsRequestFailedError && error.code === 'unauthorized') check = { kind: 'rejected' }; else check = { kind: 'failed', message };` with `message` = `errorMessage(error.code)` for an `IntervalsRequestFailedError` and `m.ui_intervals_error_generic()` otherwise (`errorMessage` is today's `IntervalsConnectionForm.tsx:28`, unchanged). The two `catch (err)` blocks become `let message: string = m.ui_intervals_error_generic(); if (err instanceof IntervalsRequestFailedError) message = errorMessage(err.code);` (`:87` passes it to `setError`, `:125` to `finishImport`). Both `as IntervalsErrorCode` casts are deleted. Add a test to `apps/web/tests/lib/intervals.spec.ts`: `intervalsDataOrThrow({ ok: false, code: 'rate-limited' })` throws an `IntervalsRequestFailedError` whose `code` is `'rate-limited'` and whose `name` is `'IntervalsRequestFailedError'`.
   Check: `rg -n "message as IntervalsErrorCode" apps/web/src` → nothing; the new test passes; with an invalid key in `vp dev`, the connection form still shows the "key rejected" state (human check).

3. Pass the decoder failure as `cause` instead of folding its message into a new one (R8).
   Files: `apps/web/src/parsers/fit.ts:128-137`.
   Change: the `catch (err)` block that builds `errorDetail` from `err.message` and throws ``new Error(`Failed to parse FIT file "${fileName}": ${errorDetail}`)`` becomes:

   ```ts
   } catch (err) {
     throw new Error(`Failed to parse FIT file "${fileName}": the decoder rejected it`, { cause: err });
   }
   ```

   The catch site (`apps/web/src/features/sessions/hooks/useFileUpload.ts:64-66`) logs the whole error, so the decoder's message stays visible through `cause`. The FIT parser keeps throwing for missing required data (owner, Q24), so this item applies.
   Check: `rg -n "errorDetail" apps/web/src/parsers/fit.ts` → nothing; `apps/web/tests/parsers/fitRequiredFields.spec.ts` passes unchanged.

4. Replace the intervals.icu error chain with an exhaustive message map (R2 and R9 of `tdr/exhaustive-record-maps-over-branching.md`).
   Files: new `apps/web/src/microcopy/intervals.ts`, `apps/web/src/features/intervals/IntervalsConnectionForm.tsx`
   Change: Starts from the form as item 2 of this plan leaves it: every `errorMessage(…)` call sits behind an `instanceof IntervalsRequestFailedError` guard and receives `error.code` / `err.code`, and any other error already gets `m.ui_intervals_error_generic()` there. New module:

   ```ts
   import { m } from '@pacevault/i18n/messages.js';
   import type { IntervalsErrorCode } from '@/lib/intervals.ts';

   export const MESSAGE_BY_INTERVALS_ERROR: Record<IntervalsErrorCode, () => string> = {
     unauthorized: m.ui_intervals_error_key,
     'rate-limited': m.ui_intervals_error_rate_limited,
     network: m.ui_intervals_error_network,
     failed: m.ui_intervals_error_generic,
   };
   ```

   Delete `errorMessage` (`IntervalsConnectionForm.tsx:28-33`) and replace each call with `MESSAGE_BY_INTERVALS_ERROR[<code>]()` (the key-check branch at `:64-67` and the two `catch` blocks at `:86-88` and `:123-126`). The map is indexed without fallback; `failed` states the generic text the old chain's last line returned. The non-intervals path keeps its `m.ui_intervals_error_generic()` default, so every error the form receives today still shows a message. Drop the form's now-unused `IntervalsErrorCode` import.
   Check: `rg -n "errorMessage|IntervalsErrorCode" apps/web/src/features/intervals/IntervalsConnectionForm.tsx` prints nothing; `rg -n "MESSAGE_BY_INTERVALS_ERROR\[" apps/web/src/features/intervals/IntervalsConnectionForm.tsx` prints three lines, each inside an `IntervalsRequestFailedError` branch; `vp check` passes (a missing code fails the `Record`); `vp test -- --run tests/lib/intervals.spec.ts` (from `apps/web/`) passes (its `IntervalsRequestFailedError` case pins the code the map is indexed with); `apps/web/e2e/intervals.spec.ts` "a rejected key shows in the status line and blocks the import" (`:157`) passes.

### Threshold validation (Q23, Q27)

Owner decision (Q23, Q26, Q27): thresholds are validated where they are entered and stored, defensively: nothing gets worse for a user. An invalid stored entry is dropped like a malformed one; the profile and its other entries stay. The engine is not changed and stays silent on broken input, as today.

5. Validate thresholds where the profile stores them (behaviour change accepted by the owner, Q23, Q27).
   Files: `apps/web/src/store/user.ts`, `apps/web/tests/store/user.integration.spec.ts`
   Change: the store accepts today any number in a threshold history: `datedNumberSchema` (`user.ts:56`) is `z.object({ date: z.number(), value: z.number() })`, `validEntries` (`:58-65`) keeps every entry that passes it, and `saveTodaysThresholds` (`:141-172`) writes whatever it is given. Use the schema names the zod-schema-naming plan left, if it ran first.
   - Hydration drops invalid entries the way `validEntries` drops malformed ones. The `thresholds` object of `profileSchema` (`:73-79`) moves out as `thresholdsSchema` and gains `.transform(withoutInvalidThresholds)`, and `weight` (`:80`) drops its non-positive entries the same way. Module-local `withoutInvalidThresholds` removes from `thresholdHr`, `ftp` and `thresholdPace` every entry whose `value` is not above 0. It removes from `restHr` and `maxHr` every entry whose `value` is not above 0, every `maxHr` entry at or below the rest HR in effect on its date, and every `restHr` entry at or above the max HR in effect on its date (`valueAt` from `@pacevault/engine/datedValue.ts`). An entry of `restHr` or `maxHr` is removed only while another entry of that history remains, so neither required history ever ends up empty because of these checks and `requiredHistorySchema` (`:68`) fails exactly where it fails today. Every other entry, field and the profile itself stay; `parsePersistedProfile` (`:88-94`) never returns `null` because of an invalid threshold.
   - The store actions refuse invalid new input: `saveTodaysThresholds` returns without a change when any value in `changes` is not a finite number above 0, or when today's resulting max HR (`changes.maxHr`, else `valueAt(profile.thresholds.maxHr, date)`) is not above today's resulting rest HR (the same with `restHr`). `setProfile` (`:118-125`) returns without a change when a threshold entry of `data.thresholds` is not above 0 or a max HR entry is at or below the rest HR in effect on its date. Both callers (`apps/web/src/features/settings/hooks/useThresholdsForm.ts:228`, `apps/web/src/features/demo/loadDemoData.ts:25`) pass valid profiles today, so neither changes behaviour.
   Check: new cases in `user.integration.spec.ts`, built with its `rehydrateFrom` helper (`:15` today): a version-4 profile with `ftp: [{ date: 0, value: 0 }, { date: 5_000, value: 250 }]` hydrates with `ftp` equal to `[{ date: 5_000, value: 250 }]` and every other field unchanged; one with `thresholdPace: [{ date: 0, value: -1 }]` hydrates with `thresholdPace` equal to `[]`; one with `restHr: [{ date: 0, value: 48 }]` and `maxHr: [{ date: 0, value: 186 }, { date: 5_000, value: 40 }]` hydrates with `maxHr` equal to `[{ date: 0, value: 186 }]`; one with `restHr: [{ date: 0, value: 60 }]` and `maxHr: [{ date: 0, value: 60 }]` hydrates as a profile (not `null`) with both histories unchanged; after `setProfile` with a valid profile, `saveTodaysThresholds({ ftp: 0 })` and `saveTodaysThresholds({ maxHr: <today's rest HR> })` each leave `profile.thresholds` equal to its value before the call. Every existing case passes unchanged; `vp run check` clean; `vp run test` green.

6. Close the one Settings path that saves without the form's check.
   Files: `apps/web/src/features/settings/hooks/useThresholdsForm.ts`, new `apps/web/tests/features/settings/hooks/useThresholdsForm.spec.ts`
   Change: the form already rejects every invalid threshold: `rangeFor` (`useThresholdsForm.ts:102-142`) bounds rest HR to 30–100, max HR to 120–230, FTP to 50–500 W and weight to 30–200 kg; `numberError` (`:150-166`) rejects a max HR at or below the rest HR (`m.ui_thresholds_max_hr_greater`) and a rest HR at or above the max HR (`m.ui_thresholds_rest_hr_less`); `parsePaceInput` (`apps/web/src/lib/formatters.ts:104-113`) accepts 2:30–9:00 /km only; the edit dialog disables Save while `fieldErrorFor` reports an error (`apps/web/src/features/settings/ThresholdEditDialog.tsx:45-48`, `:84`), and onboarding saves only a `valid` form (`useThresholdsForm.ts:303`). The one path that relies on its caller is `saveField` (`:288-293`), which writes whatever parses: it now returns `undefined` without saving when `fieldErrorFor(field, value, stored) !== ''`. No new copy, toast or UI state.
   Check: `useThresholdsForm.spec.ts`, one `describe(fieldErrorFor.name, …)`, pins `fieldErrorFor('ftp', '0', values)` → `m.ui_thresholds_min_watts({ value: '50' })`, `fieldErrorFor('maxHr', '60', values)` with `restHr: '60'` → `m.ui_thresholds_max_hr_greater()`, `fieldErrorFor('restHr', '190', values)` with `maxHr: '190'` → `m.ui_thresholds_rest_hr_less()`, `fieldErrorFor('thresholdPace', '0:00', values)` → `m.ui_thresholds_pace_format()`, and `''` for a valid value of each; `vp run check` clean; `vp run test` green.

## Open items

- R1 (throw only `Error` instances): every `throw` in `apps/web/src` already throws `new Error(…)`; the tooling plan arms `typescript/only-throw-error` to keep it that way.
- R10 (delete unused subclasses): none exist besides the one item 1 adds, which has both a throw site and `instanceof` consumers.
- The bare `throw new Error(…)` sites in `apps/web/src/parsers/fit.ts:141-170` (missing required FIT data), `apps/web/src/lib/thresholdsAt.ts:26`, `apps/web/src/lib/archive.ts:51` and the demo/debug modules are failures every caller treats identically, so R2 keeps them bare; the FIT ones stay throws (owner, Q24: no outcome unions).

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
