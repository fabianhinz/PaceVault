---
id: library-type-narrowing
tdr_reference: tdr/library-type-narrowing.md
generated: 2026-09-17
---

# Component props are derived from the component value and narrowed with a safe omit helper

Read `tdr/library-type-narrowing.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Add the safe omit helper.
   Files: new `src/types/componentProps.ts`, new `tests/types/componentProps.spec.ts`
   Change: declare `ComponentPropsOmitSafe<C, K extends keyof ComponentProps<C>>`, constraining the key parameter to keys the source props actually have, so a Radix upgrade that renames a prop turns a stale omission into a type error instead of a silent no-op. A plain `Omit<>` accepts any string and cannot do that. Add a spec that fails to compile — or asserts via a type-level test — when a non-existent key is passed.
   Check: `pnpm check` passes; passing a bogus key to the helper in a scratch file produces a type error.

2. Replace every `Omit<>` over a component's props with the helper.
   Files: every module the R2 signal reports under `src/components/` and `src/features/`
   Change: `Omit<ComponentProps<typeof X>, 'a' | 'b'>` becomes `ComponentPropsOmitSafe<typeof X, 'a' | 'b'>`. Leave `Omit<>` alone wherever the source is *not* a component's props — a domain model, an IndexedDB record shape, a parsed FIT payload. R5 makes that the correct and expected form, and it is the majority of the `Omit<>` uses in this codebase; `Omit<TrainingSession, 'id' | 'createdAt'>` in the store modules is exactly that case and must not be routed through the helper.
   Check: R2's grep returns nothing; `pnpm check && pnpm test -- --run`.

3. Derive from the component value, never from a restated alias.
   Files: `src/components/ui/Tabs.tsx` and every other wrapper the R1 signal reports
   Change: `Tabs.tsx` already does this correctly — `React.ComponentProps<typeof TabsPrimitive.Root>`. Apply the same form anywhere a wrapper restates a primitive's fields by hand or imports a separately published props alias. Compose `Pick`, `Partial` and `Required` *over* the derived type rather than over a restated alias (R3).
   Check: no props type under `src/components/ui/` restates a Radix primitive's fields; `pnpm check`.

4. Normalise the children typing.
   Files: every component under `src/components/` and `src/features/`
   Change: a component whose only prop is children is typed `React.FC<PropsWithChildren>` (R6) — do not spell the object out inline. A props interface that carries other members declares `children` as an ordinary member typed `ReactNode` (R7); do not wrap the interface in `PropsWithChildren<>` and do not `extends PropsWithChildren`. `src/components/ui/StatItem.tsx` and its neighbours already declare `children`-adjacent props as `ReactNode` and are the shape to match.
   Check: `grep -rn "PropsWithChildren<" src` returns nothing; `pnpm check`.

5. Type each slot-props entry from the slot's own component.
   Files: any component that exposes a `slotProps` object
   Change: R4 — each entry is typed from the component that receives it, with the keys the wrapper owns removed via the helper. This item has nothing to do until the slot-props plan introduces those objects; execute it after that plan, or leave it as a no-op and record that.
   Check: no `slotProps` entry is typed as a hand-written object literal; `pnpm check`.

## Open items

Item 5 has no work to do until the slot-props plan has run. If you are executing this plan first, complete items 1–4 and note item 5 as deferred; the slot-props plan's own changes will type their entries through the helper from the start.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
