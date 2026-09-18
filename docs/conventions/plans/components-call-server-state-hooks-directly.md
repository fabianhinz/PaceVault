---
id: components-call-server-state-hooks-directly
tdr_reference: tdr/components-call-server-state-hooks-directly.md
generated: 2026-09-17
---

# Components call remote-state hooks directly

Read `tdr/components-call-server-state-hooks-directly.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`one-server-call-per-hook-module`](one-server-call-per-hook-module.md) — creates `src/queries/`, which this record's hooks are called from.

## Changes

1. Confirm the one consumer calls the query hook in its own body.
   Files: `src/features/sessions/session/WeatherChips.tsx`
   Change: after the query module has moved to `src/queries/sessionWeather.ts`, `WeatherChips` imports `useSessionWeather` from there and calls it in its own body (R1). Check that no intermediate feature hook was introduced during the move whose whole body is one call to it and a return of the result — that is R2's violation and it is the easiest thing to add by accident while relocating a module.
   Check: `grep -rn "useSessionWeather" src` shows the declaration in `src/queries/` and the call in `WeatherChips.tsx`, and nothing between them; `pnpm check`.

2. Audit the feature hooks that sit in front of local data reads.
   Files: `src/features/sessions/session/hooks/`, `src/features/map/hooks/`, `src/features/studio/hooks/`
   Change: this record governs remote-state hooks, but the same shape appears around IndexedDB reads. For each feature hook, apply R3's test: does it derive, filter, flatten or reshape the data; coordinate more than one call; inject ambient arguments every caller would otherwise repeat; memoise a computed result; or encapsulate non-trivial enable/retry conditions? `useSessionDetailPath` and `useStudioRoutePoints` most likely earn their place on the first or fourth ground. Anything that passes none of the five tests and exists only to pin arguments is deleted and its callers call through (R5).
   Check: each remaining wrapper hook can be pointed at one of R3's five grounds; `pnpm check && pnpm test -- --run`.

3. Keep any surviving wrapper in the shape of its neighbours.
   Files: the wrappers item 2 kept
   Change: R4 — one exported `use*` per file, named for what it yields rather than for the call it makes. `useSessionDetailPath` names what it yields; a hook named `useGetSessionRecords` would not.
   Check: `pnpm check`; each wrapper's name is a noun phrase for its result.

## Open items

This record has almost nothing to govern today: there is one remote call and one consumer. Its value is as a standing answer to a question that recurs — "should I wrap this query hook in a feature hook?" — whose default answer is no, and whose exceptions are R3's five grounds.

Item 2 deliberately applies R3's test to hooks fronting *local* IndexedDB reads as well, even though the rule is written about remote state. The shape and the failure mode are identical; treat the verdicts there as advisory rather than as violations of this record.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
