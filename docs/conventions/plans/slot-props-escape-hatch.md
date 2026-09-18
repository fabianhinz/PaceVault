---
id: slot-props-escape-hatch
tdr_reference: tdr/slot-props-escape-hatch.md
depends_on: [component-module-file-set, library-type-narrowing]
generated: 2026-09-17
---

# One slotProps object is the escape hatch to inner parts

Read `tdr/slot-props-escape-hatch.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`component-module-file-set`](component-module-file-set.md) — creates the per-component directories whose `types.ts` these declarations go in.
- [`library-type-narrowing`](library-type-narrowing.md) — adds the `ComponentPropsOmitSafe` helper that R3 types each entry with.

## Changes

1. Replace the one existing part-configuring prop.
   Files: `src/components/ui/dataTable/types.ts`, `src/components/ui/dataTable/DataTable.tsx`, plus every caller passing `rowClassName`
   Change: `rowClassName?: (row: T) => string` configures one inner part through a top-level prop, which is R1's violation. Replace it with a single optional `slotProps` object carrying a `row` key, typed from the element `DataTable` renders for a row with the keys `DataTable` itself sets removed (R2, R3). Spread the consumer's entry last on that part (R4), and where `DataTable`'s own handler must run regardless, set it after the spread and call the consumer's from inside it.
   Check: `grep -rn "rowClassName" src` returns nothing; `pnpm check && pnpm exec playwright test e2e/sessions.spec.ts`.

2. Audit the catalogue for other one-off part props.
   Files: every `src/components/ui/<component>/types.ts`
   Change: run R1's signal. Any prop matching `<part><Attribute>` or `<part>Props` — a `labelVariant`, a `contentClassName`, a `triggerProps` — is a drip that belongs behind the one named door. Collapse each into the component's `slotProps` object under a key naming the part.
   Check: R1's grep returns nothing; `pnpm check && pnpm test -- --run`.

3. Name the keys by part, with `root` reserved.
   Files: the `slotProps` declarations from items 1 and 2
   Change: R2 — keys are camelCase and name the part. `root` is reserved for the outermost rendered element. Name an inner key after the component it configures where that is unambiguous within this component, and after the part's role where two parts would collide or the component type does not identify the part. A key is never the exported component's own name and never PascalCase.
   Check: every key in every `slotProps` type is camelCase and names a part, not a component; `pnpm check`.

4. Confirm each declared key has a spread site.
   Files: the components from items 1 and 2
   Change: R5 — every declared key must be spread onto a part; a key with no spread site is a promise the component does not keep. Read each implementation against its `slotProps` type.
   Check: each key in the type appears as a spread in the implementation; `pnpm check && pnpm build`.

5. Do not add `slotProps` where it is not owed.
   Files: every other component under `src/components/ui/`
   Change: no change. R5 — `slotProps` is owed only when the component renders structure a caller cannot otherwise reach. It is not owed by a component that is a single element whose props it already extends (`IconBadge`, `MetricLabel`, `ValueSkeleton`), nor by a Radix wrapper whose configurable surface is the primitive's own slot API relayed through. R6 — keep `slots` and `slotProps` distinct: `slots` supplies or replaces the element rendered at a position, `slotProps` configures the element the component already renders; a props bag never sits under `slots`.
   Check: `grep -rln "slotProps" src/components/ui` lists only the components from items 1 and 2.

## Open items

The convention this was adapted from scopes itself to a published component library, where a caller cannot patch the component and every added prop is a versioned promise. PaceVault's catalogue is in-repo — a caller *can* just edit the component, and often should. The rule is adopted anyway because the failure mode it prevents is already visible (`rowClassName`), and because a component with many call sites is expensive to change even in-repo. But the bar for "owed" is genuinely higher here than in a published library: prefer changing the component to opening a hatch, and reach for `slotProps` only when several unrelated callers each need a different configuration of the same inner part.

This plan governs `src/components/ui/` only. Feature components have one or two call sites each and should be changed rather than parameterised.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
