---
id: variant-unions-with-default-resolvers
tdr_reference: tdr/variant-unions-with-default-resolvers.md
generated: 2026-09-17
---

# Variant unions with default resolvers

Read `tdr/variant-unions-with-default-resolvers.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Inventory the discrete choice props across the shared components.
   Files: every `.tsx` under `src/components/ui/`, `src/components/charts/` and `src/components/layout/`
   Change: list every prop whose type is a closed set of names the component itself understands — `variant`, `size`, `color`, `orientation`, `mode`, `kind`. For each, record whether the prop is optional, whether a default is applied, and where the default is applied. `Banner`'s `variant: BannerVariant` is required with no default; `Typography`'s `variant?: TypographyVariants` and `color?: Color` are optional and defaulted inside the body. Do not change code in this item.
   Check: the list names every discrete choice prop under those three directories, with its optionality and where its default lives.

2. Name every union type that is currently inline.
   Files: the components from item 1 whose union is written into the props interface
   Change: R1 requires a *named* string-literal union, never inlined into the props interface. Extract each inline member list into a named type. For components under `src/components/ui/`, the union belongs in that component's colocated types module — execute the component-directory plans first if you want to avoid moving it twice; otherwise declare it at the top of the component module and let the later plan move it.
   Check: no props interface under those directories contains an inline `'a' | 'b'` member list; `pnpm check`.

3. Add a `resolve<Prop>` function for every optional discrete choice prop.
   Files: the optional entries from item 1 — `src/components/ui/Typography.tsx` (`variant`, `color`) and every other optional variant prop the inventory found
   Change: export a `resolve<Prop>` function from the same module as the union, typed `(prop: Union | undefined) => Union`, whose body is a single `??` with the default literal (R3). Replace the current defaulting — a destructuring default, an inline `?? 'body1'`, or a fallback inside a lookup — with a call to the resolver at every consumption site (R4). The resolver is a shared export precisely so the render path and any class-map lookup default the same way.
   Check: `grep -nE "\\?\\? '(h1|h2|body1|textPrimary)'" src/components/ui` returns nothing; `pnpm check && pnpm test -- --run`.

4. Leave required props without a resolver.
   Files: `src/components/ui/Banner.tsx`, and every other required entry from item 1
   Change: no change. R2 makes a prop required when the component has no sensible default, and a required prop has nothing to resolve. Do not add a resolver, and do not make it optional to create one.
   Check: `git diff --stat` shows no change to the required-prop components for this item.

5. Choose the declaration form per union and keep resolvers total.
   Files: the unions from item 2
   Change: use the direct form `type Union = 'a' | 'b'` by default; use the const-array form only where the member list is also needed as a runtime value, and export the array then (R6). Keep each resolver total over its own union — it returns a union member, never a class string, a number or a token; map a resolved member to values with a `Record<Union, T>` lookup keyed by the resolver's output (R5). Where a component accepts a subset of another's union, derive it with `Extract<BaseUnion, 'a' | 'b'>` and give the derived type its own resolver (R7).
   Check: `pnpm check && pnpm test -- --run`.

## Open items

R1's ban on TypeScript enums is already enforced by `erasableSyntaxOnly` in `tsconfig.app.json`; that is recorded as the rule's `enforcedBy` and needs no tooling proposal.

Feature components are deliberately out of scope. This record governs the shared component surface, where a variant prop is a contract several call sites depend on. A one-off mode flag inside a single feature component is not a variant union and does not earn a resolver.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
