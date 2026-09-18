---
id: component-declaration-shape
tdr_reference: tdr/component-declaration-shape.md
generated: 2026-09-17
---

# Component declaration shape and file naming

Read `tdr/component-declaration-shape.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Annotate every component `React.FC`, starting with the shared components.
   Files: `src/components/ui/*.tsx`, `src/components/charts/*.tsx`, `src/components/layout/*.tsx`
   Change: each component is currently `export const X = (props: XProps) => …` with no annotation; two files in the repo already use `React.FC`. Add the annotation: `export const X: React.FC<XProps> = (props) => …`. A component that takes no props is annotated bare `React.FC`; one that takes only children is annotated `React.FC<PropsWithChildren>` (R2). Do this directory by directory so each commit is reviewable.
   Check: R1's detection grep reports no unannotated component under `src/components/`; `pnpm check && pnpm test -- --run`.

2. Annotate the feature components.
   Files: every `.tsx` under `src/features/`
   Change: same treatment, one feature directory per commit. `src/features/sessions/` is the largest and is best taken last.
   Check: R1's grep reports nothing under `src/features/`; `pnpm check`.

3. Annotate the page components.
   Files: every `.tsx` under `src/pages/`, plus `src/App.tsx`
   Change: same treatment. Page components are mounted by React Router from `src/App.tsx` rather than by a file-path convention, so they are ordinary components under R4 and R5 — named exports matching their filenames, not default exports.
   Check: R1's grep returns nothing across all of `src/`; `pnpm check && pnpm build && pnpm exec playwright test`.

4. Confirm the props-interface and props-parameter rules hold everywhere.
   Files: all `.tsx` under `src/`
   Change: R2 wants a named `interface <ComponentName>Props` declared in the same module directly above the component and not exported; R3 wants the parameter named `props` and its fields read through it, never destructured in the parameter list. Most of the codebase already does both. Fix the exceptions found by R2's and R3's signals — `src/components/ui/Banner.tsx` and `src/components/ui/Typography.tsx` both destructure inside the body, which R3 permits, but check whether either destructures in the parameter list.
   Check: R2's and R3's greps return nothing; `pnpm check`.

5. Reconcile filenames with exported component names.
   Files: any `.tsx` the R4/R5 signal reports
   Change: one exported component per file, named after the file in PascalCase (R4, R5). The compound families in `src/components/ui/` — `Dialog.tsx` exporting `DialogRoot`, `Popover.tsx` exporting `PopoverRoot`, `Select.tsx` exporting `SelectRoot`, `DropdownMenu.tsx` exporting `DropdownMenuRoot`, `Toast.tsx` exporting `ToastViewport`, `SlideIndicator.tsx` exporting `useSlideIndicator` — are not fixed here; the component-directory plan restructures them and resolves the naming there. Fix any file outside `src/components/ui/` whose filename and export disagree.
   Check: R4's loop reports only the `src/components/ui/` compound families; `pnpm check && pnpm test -- --run`.

## Open items

R6 (a feature directory's entry component in `index.tsx`, named for the directory) is dropped: it contradicts the index-module record adopted in this same run, which gives a directory of peers no index at all and requires importers to address the declaring module. That record wins; feature entry components keep their own PascalCase filenames.

R8 (a route module declaring a module-local const and `export default`ing it on the last line) is Moot: React Router v7 resolves routes from the component tree in `src/App.tsx`, so no framework reads a default export from a file path here. Page components are ordinary named exports under R4.

R2's interface-not-exported clause applies to feature components only. For `src/components/ui/`, the props type moves to a per-component types module under the props-types record — that record wins for that directory, and the two do not overlap anywhere else.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
