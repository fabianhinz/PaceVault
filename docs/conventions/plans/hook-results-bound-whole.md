---
id: hook-results-bound-whole
tdr_reference: tdr/hook-results-bound-whole.md
generated: 2026-09-17
---

# Bind a hook's result whole and read through the name

Read `tdr/hook-results-bound-whole.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Rename the three `result` bindings.
   Files: `src/features/labs/hooks/useCoachPlan.ts:33`, `src/features/labs/hooks/useRacePredictor.ts:9`, `src/features/settings/PaceEstimatorDialog.tsx:33`
   Change: each binds a `useMemo` return to `const result`. R2 forbids a stand-in name — the binding must read as a noun a reader can follow from every use below it. Rename each after the thing it holds: the coach-plan memo to `plan` (or whatever its members describe), the race-predictor memo to `prediction`, the pace-estimator memo to `estimate`. Update every read in the same file.
   Check: `grep -rn "const result = " src` returns nothing; `pnpm check && pnpm test -- --run`.

2. Sweep for any other stand-in binding name.
   Files: all of `src/`
   Change: run R2's detection grep for `const data =`, `const value =` and `const res =` bound to a hook call. Rename each after what it holds.
   Check: R2's grep returns nothing.

3. Confirm no hook result is destructured at the binding.
   Files: all of `src/`
   Change: none expected — no call site in `src/` currently destructures a project hook's return. Run R1's grep and confirm it stays clean. Note that `const [searchParams, setSearchParams] = useSearchParams()` and `const [, startTransition] = useTransition()` are React Router's and React's own fixed pairs and fall under R5's carve-out; they are not violations and must not be "fixed".
   Check: R1's grep returns only the R5 carve-out lines listed above.

## Open items

None.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
