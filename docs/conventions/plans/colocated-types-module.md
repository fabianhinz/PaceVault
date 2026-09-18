---
id: colocated-types-module
tdr_reference: tdr/colocated-types-module.md
generated: 2026-09-17
---

# A feature's shared vocabulary lives in a colocated types.ts

Read `tdr/colocated-types-module.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Find the declarations that two or more siblings in one directory already share.
   Files: every directory under `src/features/`, `src/lib/`, `src/components/charts/` and `src/components/layout/`
   Change: for each directory, list the types, unions and `as const` tables it declares and which sibling modules import them. Produce the list of declarations with two or more in-directory consumers — those are the R1 candidates. A declaration with one consumer stays in that module and must not be moved (R7). Do not change code in this item.
   Check: the list names, for each candidate, its current module, the directory, and the siblings that import it.

2. Move each multi-consumer declaration into its directory's `types.ts`.
   Files: for each candidate from item 1 — its current module, a new or existing `types.ts` in the same directory, and every importer
   Change: create `types.ts` beside the modules that read it (R2 — lowercase, one per directory, never a `types/` subdirectory or a parent's). Move the declaration in, delete it from the implementation module, and rewrite every importer's specifier. Where the declaration is an `as const` table plus the union derived from it, move both together (R4, R6) — the type cannot leave the value behind.
   Check: for each new `types.ts`, `grep -c "^export" types.ts` matches the number of declarations moved; `pnpm check && pnpm test -- --run`.

3. Enforce the leaf rule on every `types.ts` created or touched.
   Files: every `types.ts` under `src/`
   Change: a `types.ts` imports from external packages, from `src/packages/engine/types.ts`, and from other `types.ts` modules — never from a sibling implementation module in its own directory (R3). It carries no functions, no classes and no side effects (R4). Where a moved declaration dragged an import of a sibling implementation module with it, invert that edge: the implementation imports the type, not the other way round.
   Check: R3's detection grep returns nothing; `pnpm check`.

4. Give a nested sub-surface its own `types.ts` rather than growing its parent's.
   Files: `src/features/sessions/session/`, `src/features/sessions/laps/`, `src/features/sessions/charts/`, `src/features/studio/markers/`, `src/features/studio/charts/`
   Change: where item 1 found shared vocabulary inside one of these nested directories, it goes in that directory's own `types.ts`, not in `src/features/sessions/types.ts` (R5). The parent's `types.ts` may compose the children's; the children never reach up.
   Check: no nested directory's shared type sits in an ancestor's `types.ts`; `pnpm check && pnpm test -- --run`.

## Open items

`src/packages/engine/types.ts` is governed by `src/packages/engine/CLAUDE.md`, which already fixes its rule — core domain types there, derived types colocated with their computing module. That is the same shape as R1 and R6 and is not restated or overridden here; the engine directory is out of this record's scope.

A component's own props type is not this record's subject. For feature components it stays in the component module; for `src/components/ui/` it moves to a per-component types module under the separate props-types record. Do not collapse those two rules into this one.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
