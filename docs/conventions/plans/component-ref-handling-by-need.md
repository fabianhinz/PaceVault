---
id: component-ref-handling-by-need
tdr_reference: tdr/component-ref-handling-by-need.md
depends_on: [library-type-narrowing]
generated: 2026-10-23
---

# A kit component accepts a ref when a consumer may need its DOM node

Read `tdr/component-ref-handling-by-need.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`library-type-narrowing`](library-type-narrowing.md) — its `packages/ui` items derive `Button`, `Textarea`, `Card`, `Input` and the Radix wrappers' props from `ComponentProps<…>`, which already carries `ref`; this plan only touches the components that map their props field by field.

## Changes

Run every item from the repo root. "Green" means `vp run check` and `vp run test` both pass. Adding an optional `ref` that is `undefined` unless a caller passes one changes no rendered output.

1. Let the field-mapped form controls accept a ref.
   Files: `packages/ui/src/components/Checkbox.tsx`, `packages/ui/src/components/Switch.tsx`, `packages/ui/src/components/Slider.tsx`, `packages/ui/src/components/RadioGroup.tsx`
   Change: add `ref?: Ref<T>` to each props interface and pass it to the Radix root: `CheckboxProps` (`Checkbox.tsx:5`) gets `ref?: Ref<HTMLButtonElement>` and `<CheckboxPrimitive.Root ref={props.ref} …>`; `SwitchProps` (`Switch.tsx:4`) `ref?: Ref<HTMLButtonElement>` on `<SwitchPrimitive.Root>`; `SliderProps` (`Slider.tsx:4`) `ref?: Ref<HTMLSpanElement>` on `<SliderPrimitive.Root>`; `RadioGroupItemProps` (`RadioGroup.tsx:22`) `ref?: Ref<HTMLButtonElement>` on `<RadioGroupPrimitive.Item>`. Import `type Ref` from `react`.
   Check: `rg -n "ref=\{props\.ref\}" packages/ui/src/components/Checkbox.tsx packages/ui/src/components/Switch.tsx packages/ui/src/components/Slider.tsx packages/ui/src/components/RadioGroup.tsx` prints four lines; green.

2. Confirm the derived-props components carry the ref through their spread.
   Files: `packages/ui/src/components/Button.tsx`, `packages/ui/src/components/Textarea.tsx`, `packages/ui/src/components/Card.tsx`, `packages/ui/src/components/Input.tsx`
   Change: after the library-type-narrowing items these props extend `ComponentProps<'button'>`, `ComponentProps<'textarea'>`, `ComponentProps<'div'>`, `ComponentProps<'input'>`. Delete the now-redundant explicit `ref?: React.Ref<…>` members at `Card.tsx:22` and `Input.tsx:9`; the rest spread already forwards `ref` to the outermost element (`<Comp {...rest}>`, `<textarea {...rest}>`, `<div {...domProps}>`, `<input {...rest}>`).
   Check: `rg -n "ref\?: React\.Ref" packages/ui/src` prints nothing; `rg -n "forwardRef" packages/ui/src` prints nothing; green.

## Open items

- `DialogCard` (`packages/ui/src/components/Dialog.tsx:86-89`) merges the ref Radix passes through `asChild` with its own `cardRef` (needed to measure the card for drag-to-dismiss). It is a module-local part, not a public component, so R3 is not applied to it; the merge stays.
- R2 has no violations: no layout-only component (`PageGrid`, `CardGrid`, `ValueSkeleton`, …) declares a ref.
- `ListItem`, `CollapsibleHeader`, `ActionTile` and `StatTile` render buttons but take no ref today; no consumer measures, focuses or anchors to them, so they are left without one. Add a ref when a consumer first needs the node.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
