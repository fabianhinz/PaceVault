---
id: component-ref-handling-by-need
tdr_reference: tdr/component-ref-handling-by-need.md
generated: 2026-09-17
---

# Ref handling is decided by consumer need, not component shape

Read `tdr/component-ref-handling-by-need.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Confirm the `forwardRef` backlog is empty and record it.
   Files: all of `src/`
   Change: no change. `grep -rn "forwardRef" src` returns nothing, so R5's migration backlog does not exist here — this project was written after React 19 made `ref` an ordinary prop. Re-run the grep and confirm before moving on; if a `forwardRef` has appeared since this plan was written, migrate it to a plain `ref` prop as part of this item.
   Check: `grep -rn "forwardRef" src` returns nothing.

2. Decide, per shared component, whether it meets R1.
   Files: every component under `src/components/ui/`
   Change: for each, answer R1's question — could a consumer plausibly need the underlying DOM node to focus it, scroll it, measure it, or anchor a positioning layer to it? Anything rendering or wrapping a focusable interactive element (`Button`, `Input`, `Textarea`, `Select`, `Switch`, `Slider`, `ToggleButton`), anything whose purpose is to be positioned or anchored (`Popover`, `ResponsivePopover`, `SheetBackdrop`), and anything a consumer scrolls or measures (`List`, `DataTable`, `CardGrid`) says yes. Pure arrangement and decoration (`PageGrid`, `IconBadge`, `MetricLabel`, `ValueSkeleton`, `SlideIndicator`) says no. Write the verdict per component before changing code.
   Check: the list covers every component under `src/components/ui/` and names yes or no for each.

3. Add the `ref` prop where item 2 said yes.
   Files: the components marked yes, and their props types
   Change: declare `ref?: Ref<T>` as an ordinary optional field alongside the rest of the props, with `T` the DOM element type of the component's outermost element, and pass the value straight through to that element's own `ref` — never wrapped, renamed, conditionally reassigned, or re-derived (R3). Use `Ref<T>`, never `RefObject<T>`, `MutableRefObject<T>` or an indexed lookup into another component's props (R4). Where the component already spreads a Radix primitive's props, the primitive may already carry `ref` through that spread — check before declaring a duplicate.
   Check: `pnpm check`; for one such component, pass a `useRef` from a spec or a page and confirm `.current` is the expected element.

4. Remove any ref surface from the components item 2 marked no.
   Files: the components marked no
   Change: R2 wants no `ref` field on the props type, no ref-related import, and a plain function-component declaration. Delete any ref plumbing that exists on a component that exists only to arrange or decorate its children.
   Check: `grep -n "Ref<" src/components/ui/<each-no-component>.tsx` returns nothing; `pnpm check && pnpm test -- --run`.

5. Apply the same judgement to feature components that are anchored or measured.
   Files: `src/features/map/MapPopupShell.tsx`, `src/features/sessions/SessionsPickPopup.tsx`, `src/features/sessions/laps/LapPickPopup.tsx`, `src/features/studio/markers/StudioTrackPickPopup.tsx`
   Change: these are positioned relative to a map or a chart, which is exactly R1's anchor case. Give each a `ref?: Ref<HTMLDivElement>` passed straight to its outermost element if a caller measures or positions it; leave it alone if the positioning is computed entirely inside the component.
   Check: `pnpm check && pnpm exec playwright test e2e/studio.spec.ts`.

## Open items

None.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
