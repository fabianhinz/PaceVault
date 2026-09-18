---
id: helpers-as-namespace-objects
tdr_reference: tdr/helpers-as-namespace-objects.md
generated: 2026-09-17
---

# Helpers exposed as one namespace object

Read `tdr/helpers-as-namespace-objects.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Classify every `src/lib/` helper module by R1 vs R2 and write the verdict down.
   Files: every module directly under `src/lib/`
   Change: for each module, list its exported function names and ask R1's question — would these names be ambiguous or collide as bare imports at a call site? `formatters.ts` (`formatDate`, `formatPace`, `formatDistance`) carries its topic in every name and stays loose under R2. `defaults.ts`, `validation.ts`, `records.ts` and `timeRange.ts` are the candidates to check, because a `validate`, a `reset` or a `parse` exported bare would say nothing. Produce a two-column list — module, verdict — before changing any code.
   Check: the list covers all 38 modules under `src/lib/` and names R1 or R2 for each.

2. Convert the modules the list marked R1.
   Files: the modules named in item 1's list, plus their importers
   Change: for each, make the exported functions module-local `const` declarations, add one exported plain object literal built from shorthand references to them, and rewrite every call site to `topic.member(...)`. The object's name is the module's basename (R3); it is the module's only exported value, with types allowed alongside (R4); it is built from shorthand references, not inlined literals (R5); and it carries no `as const`, `satisfies` or `Object.freeze` (R6).
   Check: for each converted module, `grep -n "^export" <module>` shows exactly one exported value; `pnpm check && pnpm test -- --run`.

3. Leave the loose-export modules alone and say so.
   Files: `src/lib/formatters.ts`, and every other module item 1 marked R2
   Change: no code change. Add nothing. R2 is the correct outcome for these, not an omission — a later reader must not "finish the job" by wrapping them.
   Check: `grep -c "^export const" src/lib/formatters.ts` still returns 18.

## Open items

The date/time surface of `src/lib/formatters.ts` is the one module where this record and the intl-namespace record disagree: R2 here says its names already carry their topic, while the intl record requires a single namespace object for the `Intl.*` surface. The intl record wins for that surface only. Execute the intl plan first if both are outstanding, then re-read item 3 — the numeric formatters (`formatPace`, `formatDistance`, `formatDuration`) stay loose either way.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
