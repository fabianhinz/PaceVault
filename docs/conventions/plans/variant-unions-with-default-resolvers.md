---
id: variant-unions-with-default-resolvers
tdr_reference: tdr/variant-unions-with-default-resolvers.md
depends_on: [exhaustive-record-maps-over-branching, component-declaration-shape]
generated: 2026-10-23
---

# Discrete choice props are named unions resolved by one default function

Read `tdr/variant-unions-with-default-resolvers.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`exhaustive-record-maps-over-branching`](exhaustive-record-maps-over-branching.md) — renames the class maps to `CLASSES_BY_*` and keys `Toast`'s map by the union; the resolvers below index those maps. It also already declares `ToastVariant` and `ListItemHeaderVariant`.
- [`component-declaration-shape`](component-declaration-shape.md) — its `packages/ui` item turns the wrappers' destructuring defaults into `props.x ?? <default>` reads, which item 2 replaces with resolvers.

## Changes

Run every item from the repo root. "Green" means `vp run check` and `vp run test` both pass. Each resolver returns the same member the current inline default does, so rendered output is unchanged.

1. Name the inline choice unions.
   Files: `packages/ui/src/components/Card.tsx`, `packages/ui/src/components/Toast.tsx`, `packages/ui/src/components/ListItemHeader.tsx`, `packages/ui/src/components/DropdownMenu.tsx`, `packages/ui/src/components/DataTable.tsx`, `packages/ui/src/components/SlidingHighlight.tsx`
   Change: keep a union an earlier plan already declared (`ToastVariant`, `ListItemHeaderVariant`) and add only the missing ones: `Card.tsx:19` `variant?: 'default' | 'compact'` → `type CardVariant = 'default' | 'compact';` above the interface and `variant?: CardVariant`; `Toast.tsx:18` → `export type ToastVariant = 'default' | 'success' | 'error' | 'warning';` beside `ToastItem` and `variant?: ToastVariant` (the exhaustive-record-maps plan may already have introduced it — reuse it); `ListItemHeader.tsx:6` → `type ListItemHeaderVariant = 'primary' | 'secondary';`, `variant: ListItemHeaderVariant`; `DropdownMenu.tsx:27` `& { variant?: 'default' | 'danger' }` → `type DropdownMenuItemVariant = 'default' | 'danger';` used in that intersection; `DataTable.tsx:10` → `type FieldPriority = 'primary' | 'secondary';`, `priority?: FieldPriority`; `SlidingHighlight.tsx:7` → `type HighlightAxis = 'x' | 'y';`, `axis: HighlightAxis`.
   Check: `rg -n "^\s+[a-zA-Z]+\??:\s*'[^']+'\s*\|" packages/ui/src/components` prints nothing; green.

2. Resolve the optional choice props through one function each.
   Files: `packages/ui/src/components/Button.tsx`, `packages/ui/src/components/Card.tsx`, `packages/ui/src/components/Input.tsx`, `packages/ui/src/components/Typography.tsx`, `packages/ui/src/components/Toast.tsx`, `packages/ui/src/components/ActionTile.tsx`, `packages/ui/src/components/DropdownMenu.tsx`
   Change: add a module-local resolver per optional union prop and read the prop only through it:
   - `Button.tsx`: `const resolveButtonVariant = (variant?: ButtonVariant): ButtonVariant => variant ?? 'primary';` and `const resolveButtonSize = (size?: ButtonSize): ButtonSize => size ?? 'md';`; replace the `props.variant ?? 'primary'` / `props.size ?? 'md'` reads (a destructuring default `variant = 'primary'`, `size = 'md'` if component-declaration-shape has not rewritten it yet) with `resolveButtonVariant(props.variant)` / `resolveButtonSize(props.size)` when indexing the maps; `variant` and `size` stay stripped from `rest`.
   - `Card.tsx:27` `props.variant ?? 'default'` → `resolveCardVariant(props.variant)` with `const resolveCardVariant = (variant?: CardVariant): CardVariant => variant ?? 'default';`.
   - `Input.tsx` `props.variant ?? 'field'` (or the destructuring default `variant = 'field'` at `:25`) → `resolveInputVariant(props.variant)` (`?? 'field'`), `variant` stays stripped from `rest`.
   - `Typography.tsx:54` `props.variant ?? 'body1'` → `resolveTypographyVariant(props.variant)` (`?? 'body1'`).
   - `Toast.tsx:41` `t.variant ?? 'default'` → `resolveToastVariant(t.variant)` (`?? 'default'`).
   - `ActionTile.tsx`: rename the union `RowLook` → `ActionTileLook`; `:66` `props.look ?? 'solid'` → `resolveActionTileLook(props.look)` (`?? 'solid'`).
   - `DropdownMenu.tsx:34` `variant === 'danger'` reads the raw prop → `resolveDropdownMenuItemVariant(props.variant) === 'danger'` (`?? 'default'`).
   Check: `rg -n "(variant|size|look) = '|props\.(variant|size|look) \?\? '|\.variant \?\? '" packages/ui/src/components` prints nothing; `rg -n "const resolve[A-Z][A-Za-z]+ = " packages/ui/src/components` prints eight lines; green.

3. (tools/docs) Name the shot fit union.
   Files: `tools/docs/banner/page/Banner.tsx`
   Change: `Shot`'s `fit` prop is typed inline as `'cover' | 'contain'` (in `ShotProps` after the component-declaration-shape plan, inline at `:48` before it), and the exhaustive-record-maps plan keyed `CLASSES_BY_SHOT_FIT` by the same inline union. Declare `type ShotFit = 'cover' | 'contain';` directly above `ShotProps` (or above `Shot`), type the prop `fit: ShotFit` and the map `Record<ShotFit, string>`. `fit` stays required: both callers pass it and there is no default (R2), so it gets no resolver (R3). The union is module-local; the unit-length plan moves it with `Shot` into its own module.
   Check: `rg -n "'cover' \| 'contain'" tools/docs/banner` prints only the `ShotFit` declaration; `vp check` from `tools/docs/` is clean.

## Open items

- R2: the `'default'` members of `CardVariant`, `ToastVariant` and `DropdownMenuItemVariant` name a real look (standard padding, the neutral toast border, the neutral menu item), not "nothing passed", so they stay; `undefined` is the absent case and resolves to them. If the owner reads `'default'` as an absent-case member, removing it is a type-only change (no caller passes `'default'` today except `ActionsMenu.tsx:66`) but leaves no member for the resolver to return; not part of this plan (follow-up: backlog item conventions-follow-ups).
- R3 resolvers are module-local rather than exported from a `types.ts`: a component module exports only its component (`react/only-export-components` in the root `vite.config.ts`, component-declaration-shape), and no second module reads these props. They move to the directory `types.ts` only if that changes.
- `Typography`'s `color` default comes from the variant's config (`defaultColor`), not from a literal, so it gets no resolver. `ListItemHeader.variant` and `Banner.variant` are required (no default) and get none either.
- R7: no component accepts a subset of another component's union today.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
