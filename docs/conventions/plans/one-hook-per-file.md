---
id: one-hook-per-file
tdr_reference: tdr/one-hook-per-file.md
generated: 2026-09-17
---

# One hook per module, module named after the hook

Read `tdr/one-hook-per-file.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Reconcile the two modules whose basename does not match their exported hook.
   Files: `src/lib/hooks/useHydrated.ts` (exports `useStoresHydrated`), `src/features/map/hooks/useGpsBackfill.ts` (exports `useGPSBackfill`)
   Change: R3 requires the exported hook's name to equal the basename exactly. Rename the file to match the export in both cases — `useHydrated.ts` becomes `useStoresHydrated.ts`, `useGpsBackfill.ts` becomes `useGPSBackfill.ts` — unless the *export* is the wrong name, in which case rename the export instead and keep the file. Pick one direction per module; do not leave the pair mismatched. Update every importer and any mirrored spec path in the same change.
   Check: the R3 detection loop in the TDR reference reports no mismatch; `pnpm check && pnpm test -- --run`.

2. Confirm no module exports a second hook.
   Files: all of `src/`
   Change: none expected — no module under `src/` currently exports more than one `use*` symbol. Run R1's detection loop and confirm it stays clean after every other plan in this run has moved hooks around.
   Check: the R1 loop prints no file.

3. Confirm no hook is declared inside a component module.
   Files: all `.tsx` under `src/`
   Change: run R2's detection grep. For any `.tsx` whose purpose is to export a component but which also declares a `use*` function at module top level, move that hook into its own module under the directory that owns its concept, and import it back.
   Check: R2's grep returns nothing; `pnpm check && pnpm test -- --run`.

## Open items

R6's carve-out for context accessor hooks is inert today: `grep -rn "createContext" src` returns nothing, so no provider module exists to be exempt from R1 and R3. The rule is carried in the TDR reference so it is in place for the first context anyone adds.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
