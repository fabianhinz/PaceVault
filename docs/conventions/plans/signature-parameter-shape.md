---
id: signature-parameter-shape
tdr_reference: tdr/signature-parameter-shape.md
generated: 2026-09-17
---

# One destructured options object once a signature takes more than one input

Read `tdr/signature-parameter-shape.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. List every multi-parameter callable in `src/` and classify each against R1 and the carve-outs.
   Files: all of `src/`
   Change: run R1's detection signal. For each hit, record whether it is a genuine violation, an R5 generic utility (a subject plus a comparator, a matcher, a ref), an R6 infrastructure handle threaded onward (an `AbortSignal`, an `IDBTransaction`), or an R8 signature imposed by a framework or callback contract (a Recharts formatter, a deck.gl accessor, an `Array.prototype.sort` comparator). Do not change code in this item. Expect the engine modules under `src/packages/engine/` to be the largest group and most of them to be genuine violations — `paceCalculator.ts`, `stress.ts`, `trainingEffect.ts` and `zoneDistribution.ts` all take several domain values positionally.
   Check: the list covers every hit and names R1, R5, R6 or R8 for each.

2. Convert the engine's multi-input functions to a single destructured options object.
   Files: the `src/packages/engine/` entries from item 1
   Change: replace two or more positional domain parameters with one destructured object parameter typed by an inline object type literal written immediately after the pattern (R3). Named domain fields go in the object whatever layer they sit in — that is exactly what R1 overrides. Introduce a named type only when a second declaration in the same module shares or derives from it. Update every call site and every spec in the same change; `tests/CLAUDE.md` requires the engine's tests to cover each change.
   Check: `pnpm check && pnpm test -- --run tests/engine`.

3. Convert the remaining `src/lib/` and feature-level violations.
   Files: the non-engine entries from item 1
   Change: same treatment. Where every field of the object is optional, make the whole parameter optional with `= {}` and mark each field optional (R4) — never seed values into the default object, and never swap the destructuring pattern for a `?`-marked named parameter.
   Check: `pnpm check && pnpm test -- --run`.

4. Leave the carve-outs alone and record them.
   Files: the R5, R6 and R8 entries from item 1
   Change: no change. Name them in the commit message so a later reader does not "finish the job". A signature is exempt under R8 only while an external caller dictates it — note which library dictates each one.
   Check: `git diff --stat` shows no edit to the listed files.

## Open items

This record's R1 asks for a **destructured** object parameter, while `CLAUDE.md` bans object destructuring for component props and for hook return values. Those are different populations and both rules stand: component props are named `props` and read through the name, hook results are bound whole, and plain functions, methods and hooks take one destructured options object. Item 1's classification must not treat a component or a hook-result binding as a hit — R1's detection signal exempts `.tsx` component declarations for that reason.

Hook *parameters* are in scope: a hook taking two or more inputs takes them as one destructured object, which does not conflict with the hook-result rule.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
