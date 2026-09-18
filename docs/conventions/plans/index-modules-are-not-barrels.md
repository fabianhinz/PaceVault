---
id: index-modules-are-not-barrels
tdr_reference: tdr/index-modules-are-not-barrels.md
generated: 2026-09-17
---

# An index module is a real module, never a re-export barrel

Read `tdr/index-modules-are-not-barrels.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Remove the re-export block from the one index module in the tree.
   Files: `src/types/index.ts`, plus every module importing `Gender`, `FormStatus`, `InjuryRisk`, `RunningZoneName` or `RaceDistance` from `@/types`
   Change: `src/types/index.ts` declares `UserProfile` of its own — so R1 holds — but lines 8–15 re-export five engine types it does not declare. Delete that `export type { … } from '@/packages/engine/types.ts'` block. Keep the `import type { … }` above it, which the module genuinely needs for its own declarations. Then rewrite every importer that was reaching those five names through `@/types` to import them from `@/packages/engine/types.ts` directly (R4).
   Check: `grep -n "export type {" src/types/index.ts` returns nothing; `grep -rn "Gender\|FormStatus\|InjuryRisk\|RunningZoneName\|RaceDistance" src tests | grep "@/types"` returns nothing; `pnpm check && pnpm test -- --run`.

2. Confirm no other index module exists and none is a barrel.
   Files: the whole of `src/`
   Change: none expected. `src/types/index.ts` is currently the only `index.ts`/`index.tsx` under `src/`, and there is no `export *` anywhere. Run both detection signals and confirm they stay clean after item 1.
   Check: `find src -name "index.ts" -o -name "index.tsx"` lists only `src/types/index.ts`; `grep -rn "export \*" src` returns nothing.

3. Decide whether `src/types/` should keep its index filename.
   Files: `src/types/index.ts`
   Change: after item 1 the module declares `UserProfile` and nothing else, and `src/types/` holds no other module. R5 gives a directory an `index` only when the directory is rendered or entered as a unit, which a type module is not. Either rename it to `src/types/userProfile.ts` and rewrite the importers, or flatten it to `src/userProfile.ts` and delete the directory. Pick one and carry it through; do not leave an `index.ts` whose only justification is that it was there first.
   Check: `find src -name "index.ts"` returns nothing; `pnpm check && pnpm test -- --run && pnpm build`.

## Open items

R6 (job-directory entrypoints) and R7 (framework route modules) are Moot here: PaceVault has no job runner, and React Router resolves routes from `src/App.tsx` rather than from a file-path convention, so there are no framework-owned route modules for R7 to govern. Neither rule is carried in the TDR reference.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
