---
id: library-type-narrowing
tdr_reference: tdr/library-type-narrowing.md
depends_on: [component-declaration-shape]
generated: 2026-10-23
---

# Component props are derived from the component value

Read `tdr/library-type-narrowing.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`component-declaration-shape`](component-declaration-shape.md) — introduces the `FC<XProps>` annotation and the named `<Component>Props` interfaces this plan's changes extend; until it has run, most props here are still inline literals with no `FC` to annotate.

## Changes

Run every item from the repo root; "clean `vp check`" means `vp run -F @pacevault/i18n compile && vp check` finishes with no error.

1. Type children-only components as `FC<PropsWithChildren>`.
   Files: `apps/web/src/components/ErrorFallbacks.tsx` (or `apps/web/src/components/FallbackActions.tsx` once the unit-length plan has split it out), `apps/web/src/components/layout/DockItems.tsx` (or `apps/web/src/components/layout/DockCircle.tsx`), `apps/web/src/features/onboarding/OnboardingStep.tsx` (or `apps/web/src/features/onboarding/CardBody.tsx`), `apps/web/src/features/sessions/session/LapStrip.tsx` (or `apps/web/src/features/sessions/session/AvatarFrame.tsx`)
   Change: Four components take nothing but `children`: `FallbackActions` (`ErrorFallbacks.tsx:25-29`, a one-member `FallbackActionsProps` interface), `DockCircle` (`DockItems.tsx:108`, `(props: { children: ReactNode })`), `CardBody` (`OnboardingStep.tsx:373`), `AvatarFrame` (`LapStrip.tsx:154`). Declare each as `const FallbackActions: FC<PropsWithChildren> = (props) => (…)` (exported where the module exports it), delete `FallbackActionsProps`, and import `type FC, type PropsWithChildren` from `react`; drop a now-unused `ReactNode` import.
   Check: `rg -n "props: \{ children: ReactNode \}|interface FallbackActionsProps" apps/web/src` prints nothing; `rg -n "FC<PropsWithChildren>" apps/web/src` lists the four components; clean `vp check`.

2. Derive the dialog wrappers' open state from the kit dialog.
   Files: `apps/web/src/features/trips/DeleteTripDialog.tsx`, `apps/web/src/features/trips/ManageTripDialog.tsx`, `apps/web/src/features/trips/TripFormDialog.tsx`, `apps/web/src/features/studio/DeleteStudioRouteDialog.tsx`, `apps/web/src/features/studio/StudioRouteFormDialog.tsx`, `apps/web/src/features/sessions/session/DeleteSessionDialog.tsx`, `apps/web/src/features/settings/PaceEstimatorDialog.tsx`, `apps/web/src/features/settings/DeleteAllDataDialog.tsx`
   Change: Each wrapper restates `open: boolean; onOpenChange: (open: boolean) => void;` and passes them to the kit's `DialogRoot` (`@pacevault/ui/components/Dialog.tsx:18`, the Radix dialog root). Remove the two restated members and extend the props interface from the component value instead, e.g. `interface DeleteTripDialogProps extends Required<Pick<ComponentProps<typeof DialogRoot>, 'open' | 'onOpenChange'>> { tripId: string; tripName: string; onDeleted?: () => void; }` with `import type { ComponentProps } from 'react';`. `Required<>` keeps both members mandatory as today. Same shape for `ManageTripDialogProps`, `TripFormDialogProps`, `DeleteStudioRouteDialogProps`, `StudioRouteFormDialogProps`, `DeleteSessionDialogProps`, `PaceEstimatorDialogProps` (`PaceEstimatorDialog.tsx:25`), `DeleteAllDataDialogProps` (`DeleteAllDataDialog.tsx:27`).
   Check: `rg -n "onOpenChange: \(open: boolean\) => void" apps/web/src` prints nothing; `rg -n "Pick<ComponentProps<typeof DialogRoot>, 'open' \| 'onOpenChange'>" apps/web/src` lists eight interfaces; clean `vp check`.

3. (packages/ui) Derive the Radix wrappers' props from the wrapped part.
   Files: `packages/ui/src/components/Dialog.tsx`, `Select.tsx`, `DropdownMenu.tsx`, `Popover.tsx`, `Label.tsx`, `ResponsivePopover.tsx`, `Tabs.tsx` (all under `packages/ui/src/components/`)
   Change: replace each imported props alias with `ComponentProps<typeof <Part>>` (`import type { ComponentProps } from 'react'`): `Dialog.tsx:21` `DialogPrimitive.DialogOverlayProps` → `ComponentProps<typeof DialogPrimitive.Overlay>`; `:46` `HTMLMotionProps<'div'>` → `ComponentProps<typeof motion.div>`; `:116` `extends DialogPrimitive.DialogContentProps` → `extends ComponentProps<typeof DialogPrimitive.Content>`; `:225`, `:235` → `typeof DialogPrimitive.Title` / `.Description`; `Select.tsx:9,27,48` → `typeof SelectPrimitive.Trigger` / `.Content` / `.Item`; `DropdownMenu.tsx:8,27` → `typeof DropdownMenuPrimitive.Content` / `.Item`; `Popover.tsx:12` → `typeof PopoverPrimitive.Content`; `Label.tsx:4` `extends LabelPrimitive.LabelProps` → `extends ComponentProps<typeof LabelPrimitive.Root>`; `ResponsivePopover.tsx:7,17-19` drop the `PopoverContentProps` import and type `side`, `align`, `collisionPadding` via `Pick<ComponentProps<typeof PopoverContent>, 'side' | 'align' | 'collisionPadding'>` extended by `ResponsivePopoverProps`, and `open`/`onOpenChange` via `Pick<ComponentProps<typeof PopoverRoot>, 'open' | 'onOpenChange'>` (R3); `Tabs.tsx:5,10,24,38` `React.ComponentProps<…>` → `ComponentProps<…>` imported from `react`. The derived types also carry `ref`, which the existing rest spreads already forward at runtime.
   Check: `rg -n "Primitive\.[A-Za-z]+Props\b|HTMLMotionProps|PopoverContentProps|React\.ComponentProps" packages/ui/src` prints nothing; `vp run check` and `vp run test` pass.

4. (packages/ui) Derive the intrinsic-element wrappers' props from the element.
   Files: `packages/ui/src/components/Card.tsx`, `Banner.tsx`, `Button.tsx`, `ActionTile.tsx`, `Input.tsx`, `Textarea.tsx` (all under `packages/ui/src/components/`)
   Change: `Card.tsx:17` and `Banner.tsx:6` `extends React.HTMLAttributes<HTMLDivElement>` → `extends ComponentProps<'div'>`; `Button.tsx:8` `extends React.ButtonHTMLAttributes<HTMLButtonElement>` → `extends ComponentProps<'button'>`; `ActionTile.tsx:13` `buttonProps?: ButtonHTMLAttributes<HTMLButtonElement>` → `buttonProps?: ComponentProps<'button'>`; `Input.tsx:8` → `extends ComponentProps<'input'>`; `Textarea.tsx:4` → `extends ComponentProps<'textarea'>`. `Card` and `Banner` keep `children` as a plain `ReactNode` member (R7).
   Check: `rg -n "HTMLAttributes<|ButtonHTMLAttributes|InputHTMLAttributes|TextareaHTMLAttributes" packages/ui/src` prints only `Typography.tsx` (see Open items); `vp run check` and `vp run test` pass.

5. (packages/ui) Compose the field-mapped controls' props over the Radix part instead of restating them.
   Files: `packages/ui/src/components/Switch.tsx`, `Slider.tsx`, `RadioGroup.tsx`, `Checkbox.tsx` (all under `packages/ui/src/components/`)
   Change: `SwitchProps` (`Switch.tsx:4`) → `interface SwitchProps extends Required<Pick<ComponentProps<typeof SwitchPrimitive.Root>, 'checked' | 'onCheckedChange'>>, Pick<ComponentProps<typeof SwitchPrimitive.Root>, 'disabled' | 'className'> {}`; `SliderProps` (`Slider.tsx:4`) → `Required<Pick<…Root, 'value' | 'onValueChange' | 'min' | 'max' | 'step'>>` plus `Pick<…Root, 'disabled' | 'className' | 'aria-label'>`; `RadioGroupProps` (`RadioGroup.tsx:5`) → `Pick<ComponentProps<typeof RadioGroupPrimitive.Root>, 'value' | 'onValueChange' | 'className'>` plus `children: ReactNode`; `RadioGroupItemProps` (`:22`) → `Required<Pick<…Item, 'value'>>` plus `Pick<…Item, 'disabled' | 'className' | 'aria-label'>` plus `children: ReactNode`; `CheckboxProps` (`Checkbox.tsx:5`) keeps its own `checked: boolean` and `onCheckedChange: (checked: boolean) => void` (narrower than Radix's `CheckedState`, R1 allows a deliberate own surface) and picks `'disabled' | 'aria-label' | 'className'` from `ComponentProps<typeof CheckboxPrimitive.Root>`. Required/optional stays as it is today for every member.
   Check: `vp run check` passes; `rg -n "^\s+(checked|onCheckedChange|value|onValueChange|min|max|step|disabled|className)\??:" packages/ui/src/components/Switch.tsx packages/ui/src/components/Slider.tsx packages/ui/src/components/RadioGroup.tsx` prints nothing; `vp run test` passes.

6. (packages/ui) Type the children-only kit component as `FC<PropsWithChildren>`.
   Files: `packages/ui/src/components/SheetAbove.tsx`
   Change: `SheetAbove.tsx:6` `(props: { children: ReactNode })` → `export const SheetAbove: FC<PropsWithChildren> = (props) =>`; drop the unused `ReactNode` import. (`BottomSheetProvider` gets the same type in the context-provider-accessor-pairs plan.)
   Check: `rg -n "props: \{ children" packages/ui/src` prints nothing; `vp run check` and `vp run test` pass.

### tools/workbench

7. (tools/workbench) Type the board's children-only components as `FC<PropsWithChildren>` (R6).
   Files: `tools/workbench/site/src/app/PlanPane.tsx`, `tools/workbench/site/src/app/ReviewPane.tsx`
   Change: `const Empty = (props: { children: ReactNode }) => (` (`PlanPane.tsx:24`, `ReviewPane.tsx:34`) → `const Empty: FC<PropsWithChildren> = (props) => (`, with `import type { FC, PropsWithChildren } from 'react'` merged into each module's React import; the body stays. The unit-length plan later moves both into one shared module.
   Check: `rg -n "props: \{ children: ReactNode \}" tools/workbench/site/src` prints nothing; `vp check` from `tools/workbench/` is clean; `vp run -F @pacevault/workbench check` passes.

## Open items

- `packages/ui`: R2 (a safe omit helper) is closed — there is no `Omit` over a component's props anywhere in the workspace, so a helper would be exported code nothing imports (root `CLAUDE.md`, delete dead code). Wrappers that strip their own props before forwarding use the rest-destructure `packages/ui/CLAUDE.md` allows. The TDR's Context states this.
- `packages/ui`: `Typography` (`packages/ui/src/components/Typography.tsx:32`) keeps `HTMLAttributes<HTMLElement>`: it renders a different element per variant or `as` prop, so no single `ComponentProps<'tag'>` describes it.
- R4 (slot prop maps) does not apply: no component in this workspace takes `slotProps`.
- `RouteErrorFallback` (`apps/web/src/components/ErrorFallbacks.tsx:58`) is typed with `FallbackProps` from `react-error-boundary`. That is the library's contract for implementing a fallback component, not the props of a component value the app wraps, so R1 does not ask for a `ComponentProps<typeof …>` derivation; it stays.
- Interfaces that carry `children` among other members (`StudioRouteHeader`, `TripHeader`, `SessionHeader`, `MapPickPopup`, `MapControlsBar`, `DockSegment`, `StepButton`) already declare `children: ReactNode` as a plain member and conform to R7.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
