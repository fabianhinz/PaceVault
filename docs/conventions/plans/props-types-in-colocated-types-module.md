---
id: props-types-in-colocated-types-module
tdr_reference: tdr/props-types-in-colocated-types-module.md
depends_on: [component-module-file-set]
generated: 2026-09-17
---

# Props types live in the component's colocated types module

Read `tdr/props-types-in-colocated-types-module.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`component-module-file-set`](component-module-file-set.md) — creates the per-component directories this plan puts a `types.ts` into; without it there is nowhere for these modules to go.

## Changes

1. Move each component's props interface into its own `types.ts`.
   Files: every `src/components/ui/<component>/<Component>.tsx` that declares a props interface, plus a new `types.ts` beside each
   Change: move the `interface <Component>Props` declaration out of the implementation module into a sibling `types.ts`, export it there (R3), and have the implementation import it with a type-only import (R9). Keep the name exactly matching the exported component identifier, character for character (R2). A component that accepts no props declares no props type and is owed no types module (R1).
   Check: `grep -rn "^interface [A-Z][A-Za-z]*Props" src/components/ui/*/*.tsx` returns nothing; `pnpm check && pnpm build`.

2. Move the variant unions in with them.
   Files: `src/components/ui/banner/types.ts`, `src/components/ui/typography/types.ts`, and any other component whose union is declared in the implementation
   Change: `BannerVariant`, `TypographyVariant` and `Color` are declared in their implementation files today. They are part of the public type surface and move into the same `types.ts` as the props type. The variant-resolver record puts the matching `resolve<Prop>` functions there too; if you are running both plans, do this move once and add the resolvers in the same edit.
   Check: `grep -n "type.*Variant" src/components/ui/*/*.tsx` returns nothing; `pnpm check`.

3. Stop implementation modules from exporting prop types.
   Files: every `src/components/ui/<component>/<Component>.tsx`
   Change: R4 — an implementation module exports no prop type. A prop type for a private, non-exported sub-component inside the implementation may be declared inline, but must not be exported.
   Check: `grep -rn "^export interface\|^export type" src/components/ui/*/*.tsx` returns nothing; `pnpm check`.

4. Narrow third-party props types by name, not by hand.
   Files: the Radix wrappers under `src/components/ui/{dialog,popover,select,dropdownMenu,tabs,toast}/`
   Change: R5 — to narrow a props type that already has a name, use `Omit` or `Pick` on that name. R6 — to derive props from a component *value*, use the project's `ComponentPropsOmitSafe<typeof Component, ExcludedKeys>` helper; never hand-roll it as `Omit<ComponentProps<typeof C>, …>`, as `Parameters<typeof C>[0]`, or as a bare `ComponentProps<typeof C>` where keys need removing. The helper comes from the props-narrowing plan; execute that first or add it here.
   Check: `grep -rn "Omit<ComponentProps<\|Parameters<typeof" src/components/ui` returns nothing; `pnpm check`.

5. Verify each types module stays a type-only leaf.
   Files: every `src/components/ui/*/types.ts`
   Change: the module must remain erasable — type declarations, the variant unions, and the small `resolve<Prop>` functions the variant record puts there. No component, no JSX, no import of its own implementation module. That last edge would be a cycle back through the component and is the reason R9's type-only import matters.
   Check: `pnpm check && pnpm build && pnpm exec playwright test`.

## Open items

Scope is `src/components/ui/` only. Feature components and the components under `src/components/charts/` and `src/components/layout/` keep their props interface declared in the component module directly above the component — that is the component-declaration record's R2, and the two rules do not overlap because they govern different directories. A reader must not generalise this record outward.

R7 and R8 of the convention this was adapted from governed a styling-state key that reached styled parts through a separate channel. There is no such channel here — Tailwind classes are resolved in the component — so both rules are Moot and are not carried.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
