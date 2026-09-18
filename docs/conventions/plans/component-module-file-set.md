---
id: component-module-file-set
tdr_reference: tdr/component-module-file-set.md
generated: 2026-09-17
---

# Each shared component gets a directory with a fixed file set and no index

Read `tdr/component-module-file-set.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`component-declaration-shape`](component-declaration-shape.md) — annotates every component `React.FC` first, so the move is a pure relocation rather than two edits to the same file.

## Changes

This is the largest change in the run: 36 modules under `src/components/ui/` become 36 directories, and every import of them across roughly 150 files is rewritten. Take one group per commit, in the order below — simple leaves first, compound families last — and run the full verification suite after each.

1. Move the nine simple leaf components.
   Files: `src/components/ui/{IconBadge,MetricLabel,ValueSkeleton,PageGrid,CardGrid,SlideIndicator,SheetBackdrop,PaceRange,StatItem}.tsx` → `src/components/ui/<camelCaseName>/<PascalCaseName>.tsx`, plus every importer
   Change: for each, create the directory named in camelCase after the component (`iconBadge/`) and move the implementation file into it unchanged, keeping its PascalCase name (R1, R2). Do **not** add an `index.ts` (R8) — importers address `@/components/ui/iconBadge/IconBadge.tsx`. Rewrite every importer.
   Check: `pnpm check && pnpm test -- --run && pnpm build` after each commit; `find src/components/ui -maxdepth 1 -name '*.tsx'` shrinks by nine.

2. Move the eight card and layout components.
   Files: `Card.tsx`, `CardHeader.tsx`, `ChartCard.tsx`, `ChartPreviewCard.tsx`, `ActionTile.tsx`, `ActionPromptCard.tsx`, `List.tsx`, `DataTable.tsx`
   Change: same treatment. Where two of these are one family — `Card` and `CardHeader` — put the secondary component in the primary's directory, in its own PascalCase file (R2's one-entry-point clause plus the secondary-component rule), rather than giving it a directory of its own.
   Check: `pnpm check && pnpm test -- --run && pnpm exec playwright test`.

3. Move the eight form and control components.
   Files: `Button.tsx`, `Input.tsx`, `Textarea.tsx`, `Label.tsx`, `Switch.tsx`, `Slider.tsx`, `ToggleButton.tsx`, `SegmentedControl.tsx`
   Change: same treatment.
   Check: `pnpm check && pnpm test -- --run && pnpm exec playwright test e2e/filters.spec.ts`.

4. Move the four remaining single-component modules.
   Files: `Banner.tsx`, `Typography.tsx`, `GaugeDial.tsx`, `ResponsivePopover.tsx`
   Change: same treatment. `Banner` and `Typography` both carry a variant class map in the implementation file; leave those maps where they are for now — the styles-module plan moves them once the directories exist.
   Check: `pnpm check && pnpm test -- --run && pnpm build`.

5. Move the six Radix compound families last.
   Files: `Dialog.tsx`, `Popover.tsx`, `Select.tsx`, `DropdownMenu.tsx`, `Tabs.tsx`, `Toast.tsx`
   Change: each exports several components (`DialogRoot`, `DialogContent`, …). The directory is named after the family in camelCase (`dialog/`), the primary component keeps the family name, and each other exported component goes in its own PascalCase file in the same directory, named after its exported symbol (`dialog/DialogRoot.tsx`, `dialog/DialogContent.tsx`). This is the one case where a directory holds several exported components, and it is why the one-component-per-file record exempts `src/components/ui/`. `Toast.tsx` also exports `ToastViewport`, which `src/main.tsx` mounts — check that importer specifically.
   Check: `pnpm check && pnpm test -- --run && pnpm exec playwright test`; `src/main.tsx` still mounts `ToastViewport`.
6. Relocate the store that is not a component.
   Files: `src/components/ui/toastStore.ts` → `src/components/ui/toast/toastStore.ts`
   Change: it is the state half of the `Toast` family, so it belongs in that family's directory under a descriptive camelCase name (R5 of the naming rules). Move `tests/components/ui/toastStore.spec.ts` to the mirrored path in the same change.
   Check: `pnpm test -- --run tests/components/ui`; `pnpm check`.

## Open items

Scope is `src/components/ui/` only. `src/components/charts/`, `src/components/layout/` and every component under `src/features/` keep their flat files — they are not a shared component catalogue and the file-set rules do not apply to them. This is a deliberate boundary, not an unfinished migration.

Three of this record's five filenames are introduced by later plans rather than here: `types.ts` by the props-types plan, `styles.ts` by the variant-style-maps plan, and the slot-props surface by its own. This plan establishes only the directories and the implementation files; R3, R6 and R7 in the TDR reference describe filenames those plans will create. Do not pre-create empty ones.

There is no `stories.tsx` in this file set. The convention this record was adapted from required a Storybook story per component; PaceVault has no Storybook, so that rule is Moot and is not carried.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
