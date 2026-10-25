---
id: variant-unions-with-default-resolvers
tdr_reference: tdr/variant-unions-with-default-resolvers.md
depends_on: [exhaustive-record-maps-over-branching, component-declaration-shape]
generated: 2026-10-23
---

# Discrete choice props are named unions with one inline default

Read `tdr/variant-unions-with-default-resolvers.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`exhaustive-record-maps-over-branching`](exhaustive-record-maps-over-branching.md) — renames the class maps to `CLASSES_BY_*` and keys `Toast`'s map by the union; the inline defaults below index those maps. It also already declares `ToastVariant` and `ListItemHeaderVariant`.
- [`component-declaration-shape`](component-declaration-shape.md) — its `packages/ui` item turns the wrappers' destructuring defaults into `props.x ?? <default>` reads at the single read (`Button.tsx:33-34`, `Input.tsx:25`), which is already the target form of R3; item 2 only checks it.

## Changes

Run every item from the repo root. "Green" means `vp run check` and `vp run test` both pass. No item changes a default member or adds a function, so rendered output is unchanged.

1. Name the inline choice unions.
   Files: `packages/ui/src/components/Card.tsx`, `packages/ui/src/components/Toast.tsx`, `packages/ui/src/components/ListItemHeader.tsx`, `packages/ui/src/components/DropdownMenu.tsx`, `packages/ui/src/components/DataTable.tsx`, `packages/ui/src/components/SlidingHighlight.tsx`
   Change: keep a union an earlier plan already declared (`ToastVariant`, `ListItemHeaderVariant`) and add only the missing ones: `Card.tsx:19` `variant?: 'default' | 'compact'` → `type CardVariant = 'default' | 'compact';` above the interface and `variant?: CardVariant`; `Toast.tsx:18` → `export type ToastVariant = 'default' | 'success' | 'error' | 'warning';` beside `ToastItem` and `variant?: ToastVariant` (the exhaustive-record-maps plan may already have introduced it — reuse it); `ListItemHeader.tsx:6` → `type ListItemHeaderVariant = 'primary' | 'secondary';`, `variant: ListItemHeaderVariant`; `DropdownMenu.tsx:27` `& { variant?: 'default' | 'danger' }` → `type DropdownMenuItemVariant = 'default' | 'danger';` used in that intersection; `DataTable.tsx:10` → `type FieldPriority = 'primary' | 'secondary';`, `priority?: FieldPriority`; `SlidingHighlight.tsx:7` → `type HighlightAxis = 'x' | 'y';`, `axis: HighlightAxis`.
   Check: `rg -n "^\s+[a-zA-Z]+\??:\s*'[^']+'\s*\|" packages/ui/src/components` prints nothing; green.

2. Keep one inline default per optional choice prop; no resolvers.
   Files: `packages/ui/src/components/ActionTile.tsx` (rename); check only: `Button.tsx`, `Card.tsx`, `Input.tsx`, `Typography.tsx`, `Toast.tsx`, `DropdownMenu.tsx` (all under `packages/ui/src/components/`)
   Change: the defaults already sit inline once per prop (R3, R4) after component-declaration-shape item 16; nothing is wrapped in a function and no read is added:
   - `ActionTile.tsx`: rename the union `RowLook` (`:17`, read at `:11`, `:19`, `:26`, `:33`) → `ActionTileLook` (R1, named for its component). `:66` `const look = props.look ?? 'solid';` already binds the default once for its four reads (`:69`, `:70`, `:82`, `:87`) and stays.
   - `Card.tsx:27` `const variant = props.variant ?? 'default';` binds once and stays.
   - `Typography.tsx:54` `variants[props.variant ?? 'body1']` (single read) and `Toast.tsx:41` `t.variant ?? 'default'` (single read of a toast item field; the exhaustive-record-maps plan renames the map it indexes) stay.
   - `Button.tsx` and `Input.tsx`: confirm component-declaration-shape item 16 left `props.variant ?? 'primary'` / `props.size ?? 'md'` / `props.variant ?? 'field'` at the single map lookup, with `variant` and `size` stripped from `rest` under `_`-prefixed names and no destructuring default (`Button.tsx:33-34`, `Input.tsx:25` today). If one of them reads the prop at a second place, bind it once at the top (`const variant = props.variant ?? 'primary';`, R4).
   - `DropdownMenu.tsx:34` compares against the non-default member (`=== 'danger'`), which does not depend on the default, so it gets no `??` (R4); after component-declaration-shape item 16 it reads `props.variant === 'danger'`.
   Check: `rg -n "(variant|size|look) = '|const resolve[A-Z][A-Za-z]*(Variant|Size|Look) =" packages/ui/src/components` prints nothing; `rg -n "RowLook" packages/ui/src` prints nothing; `rg -c "props\.(variant|size|look) \?\? '" packages/ui/src/components` prints at most one count per prop and component (Button 2 — variant and size —, Card 1, Input 1, Typography 1, ActionTile 1); green.

3. (tools/docs) Name the shot fit union.
   Files: `tools/docs/banner/page/Banner.tsx`
   Change: `Shot`'s `fit` prop is typed inline as `'cover' | 'contain'` (in `ShotProps` after the component-declaration-shape plan, inline at `:48` before it), and the exhaustive-record-maps plan keyed `CLASSES_BY_SHOT_FIT` by the same inline union. Declare `type ShotFit = 'cover' | 'contain';` directly above `ShotProps` (or above `Shot`), type the prop `fit: ShotFit` and the map `Record<ShotFit, string>`. `fit` stays required: both callers pass it and there is no default (R2), so it gets no default (R3). The union is module-local; the unit-length plan moves it with `Shot` into its own module.
   Check: `rg -n "'cover' \| 'contain'" tools/docs/banner` prints only the `ShotFit` declaration; `vp check` from `tools/docs/` is clean.

## Open items

- R2: the `'default'` members of `CardVariant`, `ToastVariant` and `DropdownMenuItemVariant` name a real look (standard padding, the neutral toast border, the neutral menu item), not "nothing passed", so they stay; `undefined` is the absent case and defaults to them. If the owner reads `'default'` as an absent-case member, removing it is a type-only change (no caller passes `'default'` today except `ActionsMenu.tsx:66`) but leaves no member for the inline default; not part of this plan (follow-up: backlog item conventions-follow-ups).
- Q4/Q25 (owner, 2026-10-25): no `resolve<Name>Variant` functions; the default is applied inline as `props.variant ?? '…'`, once per prop and component. The earlier module-local resolvers of item 2 are dropped.
- `Typography`'s `color` default comes from the variant's config (`defaultColor`), not from a literal; it is not a choice-prop default and stays as it is. `ListItemHeader.variant` and `Banner.variant` are required and get no default (R2).
- R7: no component accepts a subset of another component's union today.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
