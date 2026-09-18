---
id: variant-style-maps-in-styles-module
tdr_reference: tdr/variant-style-maps-in-styles-module.md
depends_on: [component-module-file-set]
generated: 2026-09-17
---

# Variant class maps live in a styles module

Read `tdr/variant-style-maps-in-styles-module.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`component-module-file-set`](component-module-file-set.md) — creates the per-component directories this plan puts a `styles.ts` into.

## Changes

1. Move the Banner variant map into its component's styles module.
   Files: `src/components/ui/banner/Banner.tsx` → new `src/components/ui/banner/styles.ts`
   Change: `variantClasses` maps `BannerVariant` to a two-key object of container and icon class strings — more than one declaration per member, so it is a *block* and R1 puts it in `styles.ts`. Move it there, type it `Record<BannerVariant, BannerVariantClasses>` with the entry type declared beside it, rename it `variantStyles` per R8's `<prop>Styles` shape, and import it into the implementation.
   Check: `grep -n "variantClasses" src/components/ui/banner/Banner.tsx` returns nothing; `pnpm check && pnpm build` and a visual check of each banner variant.

2. Move the Typography maps into its styles module.
   Files: `src/components/ui/typography/Typography.tsx` → new `src/components/ui/typography/styles.ts`
   Change: `variants` maps each variant to an element, a class string and a default colour — a block — and moves. `colorMap` maps a colour name to a single class string, which under R2 is a *single value* and would normally stay at the point of use; but it is consumed alongside `variants` in the same lookup, so keep the two together in `styles.ts` and say so in the commit. Name them `variantStyles` and `colorStyles`.
   Check: `grep -n "const variants\|const colorMap" src/components/ui/typography/Typography.tsx` returns nothing; `pnpm check` and a visual check of the type scale.

3. Do not create a styles module for a component that has no variant block.
   Files: every other directory under `src/components/ui/`
   Change: no change. R2 — a union selecting a *single* value stays an indexed lookup at the point of use and creates no `styles.ts`; the absence of a styles module is the correct outcome, not an omission. Most of the catalogue has no variant union at all.
   Check: `find src/components/ui -name styles.ts` lists only the directories from items 1 and 2, plus any the audit in item 4 adds.

4. Audit the rest of the catalogue for variant blocks hiding in implementations.
   Files: every `src/components/ui/<component>/<Component>.tsx`
   Change: run R4's signal. Any `Record<SomeUnion, …>` of class blocks declared in a `.tsx` moves to that component's `styles.ts`. A `.tsx` may import and index such a map; it must not declare one.
   Check: R4's grep returns nothing; `pnpm check && pnpm test -- --run && pnpm exec playwright test`.

5. Key each map exhaustively and consume it through the resolver.
   Files: the styles modules from items 1, 2 and 4
   Change: R5 — key the record exhaustively by the union, never widened to `string` and never partial with a runtime fallback. R7 — consume it in the component by indexing with the prop's `resolve<Prop>` helper when the prop is optional, and with the prop directly when it is required; do not rebuild the block conditionally in the component body. The resolvers come from the variant-union plan.
   Check: deleting a member from `BannerVariant` fails `pnpm check` in `styles.ts`; `pnpm check && pnpm build`.

## Open items

This record is adapted away from a CSS-in-JS mechanism onto Tailwind. Where the original mapped a union to a block of CSS declarations typed by a shared style-resolver alias, the adapted form maps a union to a block of Tailwind class strings typed by a `Record<Union, T>` with a locally declared entry type. There is no shared resolver alias in this project and R3 of the original — which required one — is not carried; R6's theme-function entry shape is Moot for the same reason.

R9's secondary content clause is carried: a `styles.ts` may also hold class-derivation helpers and the constants those use, and needing one of those is a valid reason for the module to exist even without a variant block.

Scope is `src/components/ui/` only, as with the rest of the catalogue rules. A variant map inside a feature component stays where it is.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
