---
id: domain-error-subclasses
tdr_reference: tdr/domain-error-subclasses.md
depends_on: [authenticated-fetch-and-response-parsing, outcome-unions-over-exceptions, exhaustive-record-maps-over-branching]
generated: 2026-10-23
---

# Error subclasses declared at the throw site, caught by type at the boundary

Read `tdr/domain-error-subclasses.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`authenticated-fetch-and-response-parsing`](authenticated-fetch-and-response-parsing.md) — introduces the failed-response error type in lib/intervals.ts that this plan's error class merges into
- [`outcome-unions-over-exceptions`](outcome-unions-over-exceptions.md) — turns the FIT required-field failure into a return value, which settles whether the FIT `cause` item applies
- [`exhaustive-record-maps-over-branching`](exhaustive-record-maps-over-branching.md) — item 4 applies its exhaustive-map rule (R2, R9) to the intervals error message once item 2 has typed the code

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

   The catch site (`apps/web/src/features/sessions/hooks/useFileUpload.ts:64-66`) logs the whole error, so the decoder's message stays visible through `cause`. If the outcome-unions plan has already turned this failure into an outcome member, this item is moot.
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

## Open items

- R1 (throw only `Error` instances): every `throw` in `apps/web/src` already throws `new Error(…)`; the tooling plan arms `typescript/only-throw-error` to keep it that way.
- R10 (delete unused subclasses): none exist besides the one item 1 adds, which has both a throw site and `instanceof` consumers.
- The bare `throw new Error(…)` sites in `apps/web/src/parsers/fit.ts:141-170` (missing required FIT data), `apps/web/src/lib/thresholdsAt.ts:26`, `apps/web/src/lib/archive.ts:51` and the demo/debug modules are failures every caller treats identically, so R2 keeps them bare; whether the FIT ones become outcome members is the outcome-unions plan's decision.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
