---
id: visible-copy-arrives-as-props
tdr_reference: tdr/visible-copy-arrives-as-props.md
depends_on: [boolean-names-without-is-prefix]
generated: 2026-10-23
---

# Every text the kit renders arrives as a prop

Read `tdr/visible-copy-arrives-as-props.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`boolean-names-without-is-prefix`](boolean-names-without-is-prefix.md) — renames `ZoomResetPill`'s `isZoomed` prop to `zoomed` at the same three call sites item 1 edits; running it first keeps the two edits from colliding.

## Changes

Run every item from the repo root. "Green" means `vp run check` and `vp run test` both pass. Items 1–5 pass exactly the message the kit rendered before, so every rendered string and accessible name is unchanged. Item 6 changes what assistive technology announces for the radio items (owner-accepted).

1. Give the zoom-reset pill a `label` prop.
   Files: `packages/ui/src/components/ChartsCard.tsx`, `apps/web/src/features/sessions/charts/SessionChartsExplorer.tsx`, `apps/web/src/features/studio/charts/RouteChartsExplorer.tsx`, `apps/web/src/features/dashboard/DashboardZoomReset.tsx`
   Change: `ZoomResetPill` (`ChartsCard.tsx:22`) gains a required `label: string` and renders `<span>{props.label}</span>` instead of `<span>{m.ui_chart_reset_zoom()}</span>` (`:28`); drop the `m` import (`:3`). The three call sites (`SessionChartsExplorer.tsx:590`, `RouteChartsExplorer.tsx:172`, `DashboardZoomReset.tsx:8`) add `label={m.ui_chart_reset_zoom()}`, importing `m` from `@pacevault/i18n/messages.js` where the file does not already.
   Check: `rg -n "m\." packages/ui/src/components/ChartsCard.tsx` prints nothing; `rg -n "label=\{m\.ui_chart_reset_zoom\(\)\}" apps/web/src` prints three lines; green.

2. Give the bottom sheet its handle labels as props.
   Files: `packages/ui/src/components/BottomSheet.tsx`, `apps/web/src/components/layout/AppLayout.tsx`
   Change: `BottomSheetProps` (`BottomSheet.tsx:46`) gains required `expandLabel: string` and `collapseLabel: string`; the handle's `aria-label` (`:113-115`) becomes `sheetTapTarget(props.position) === 1 ? props.expandLabel : props.collapseLabel`; drop the `m` import (`:16`). `AppLayout.tsx:49` passes `expandLabel={m.ui_sheet_expand()}` and `collapseLabel={m.ui_sheet_collapse()}`.
   Check: `rg -n "m\." packages/ui/src/components/BottomSheet.tsx` prints nothing; green; `vp run e2e` passes (the sheet handle is located by its accessible name).

3. Give the dialog's grab handle its label as a prop, forwarded through every kit wrapper.
   Files: `packages/ui/src/components/Dialog.tsx`, `packages/ui/src/components/ResponsivePopover.tsx`, `packages/ui/src/components/ActionsMenu.tsx`; `DialogContent` call sites `apps/web/src/features/onboarding/OnboardingFlow.tsx`, `apps/web/src/features/trips/DeleteTripDialog.tsx`, `apps/web/src/features/trips/ManageTripDialog.tsx`, `apps/web/src/features/trips/TripFormDialog.tsx`, `apps/web/src/features/settings/ThresholdEditDialog.tsx`, `apps/web/src/features/studio/DeleteStudioRouteDialog.tsx`, `apps/web/src/features/settings/PaceEstimatorDialog.tsx`, `apps/web/src/features/settings/DeleteAllDataDialog.tsx`, `apps/web/src/features/sessions/session/DeleteSessionDialog.tsx`, `apps/web/src/features/studio/markers/StudioMarkerDialog.tsx`, `apps/web/src/features/studio/StudioRouteFormDialog.tsx`, `tools/workbench/site/src/app/AnswerDialog.tsx`; `ResponsivePopover` call sites `apps/web/src/components/MetricLabel.tsx`, `apps/web/src/components/layout/Dock.tsx`, `apps/web/src/features/map/TrackIntensityControl.tsx`, `apps/web/src/features/sessions/session/LapsControl.tsx`, `apps/web/src/features/map/MapPickPopup.tsx`, `apps/web/src/features/sessions/session/ColorByControl.tsx`, `apps/web/src/features/sessions/session/MapViewControl.tsx`; `ActionsMenu` call sites `apps/web/src/features/sessions/session/SessionActionsMenu.tsx`, `apps/web/src/features/studio/StudioActionsMenu.tsx`
   Change: `DialogCard` (`Dialog.tsx:46`) takes `closeLabel: string` beside its motion props and sets `aria-label={props.closeLabel}` on the close handle (`:99`, was `m.ui_sheet_drag_close()`); `DialogContentProps` (`:116`) gains required `closeLabel: string`, stripped from `contentProps` with the existing rest-destructure and passed as `<DialogCard closeLabel={props.closeLabel}>`; drop the `m` import (`:12`). `ResponsivePopoverProps` (`ResponsivePopover.tsx:9`) and `ActionsMenuProps` (`ActionsMenu.tsx:22`) each gain required `closeLabel: string`, forwarded to `<DialogContent closeLabel={props.closeLabel}>` and `<ResponsivePopover closeLabel={props.closeLabel}>`. Every listed call site passes `closeLabel={m.ui_sheet_drag_close()}` (importing `m` where needed; `tools/workbench` already depends on `@pacevault/i18n`).
   Check: `rg -n "m\." packages/ui/src` prints nothing; `rg -c "closeLabel=\{m\.ui_sheet_drag_close\(\)\}" apps/web/src tools/workbench/site/src` totals at least 21 (one per rendered `DialogContent`, `ResponsivePopover` and `ActionsMenu` in the listed files) and `rg -n "<(DialogContent|ResponsivePopover|ActionsMenu)\b" apps/web/src tools/workbench/site/src` shows no element without it; green; `vp run e2e` passes.

4. Key the actions menu by an id, not by its label.
   Files: `packages/ui/src/components/ActionsMenu.tsx`, `apps/web/src/features/sessions/session/SessionActionsMenu.tsx`, `apps/web/src/features/studio/StudioActionsMenu.tsx`
   Change: `ActionsMenuItem` (`ActionsMenu.tsx:14`) gains `id: string`; `key={item.label}` (`:65`, `:91`, `:97`) → `key={item.id}`. Each item built in the two call sites gets a stable id naming its action (`'rename'`, `'delete'`, … — the identifier the item's `onSelect` already stands for). Ids are unique within one menu, as the labels were, so React reconciles the same elements.
   Check: `rg -n "key=\{item\.label\}" packages/ui/src` prints nothing; green.

5. Drop the kit's dependency on the message package and rewrite the docs that described it.
   Files: `packages/ui/package.json`, `pnpm-lock.yaml`, `packages/ui/CLAUDE.md`, `packages/ui/README.md`
   Change: from the repo root run `vp remove @pacevault/i18n --filter @pacevault/ui`. `packages/ui/CLAUDE.md:9` "Fixed texts come from `m` in `@pacevault/i18n/messages.js` (never paraglide paths of the app); dock and sheet geometry live in `src/lib/`." → "The kit authors no copy: every visible text and accessible name — including those of controls the kit renders itself — arrives as a prop (`label`, `closeLabel`, …), filled by the consumer from its own `m.*` messages; dock and sheet geometry live in `src/lib/`."; delete `:36` (`vp run -F @pacevault/i18n compile …`). `packages/ui/README.md:20` "Fixed texts come from `@pacevault/i18n`; there is no provider." → "The kit holds no copy; texts arrive as props. There is no provider."; `:25` drop the parenthesised compile hint.
   Check: `rg -n "@pacevault/i18n" packages/ui` prints nothing; `vp check` from `packages/ui/` passes without a prior i18n compile; `vp run check` and `vp run test` pass.

6. Make the primary-element accessible names required on `Checkbox`, `Slider` and `RadioGroupItem`.
   Files: `packages/ui/src/components/Checkbox.tsx`, `packages/ui/src/components/Slider.tsx`, `packages/ui/src/components/RadioGroup.tsx`; call sites `apps/web/src/features/sessions/session/LapsControl.tsx`, `apps/web/src/features/map/TrackIntensityControl.tsx`, `apps/web/src/features/sessions/session/ColorByControl.tsx`, `apps/web/src/features/sessions/session/MapViewControl.tsx`, `apps/web/src/features/trips/ManageTripDialog.tsx`, `tools/workbench/site/src/app/AnswerDialog.tsx`, `tools/workbench/site/src/app/CheckRow.tsx`; `apps/web/e2e/sessions.spec.ts`
   Change: `'aria-label'?: string` becomes `'aria-label': string` in `CheckboxProps` (`Checkbox.tsx:9`), `SliderProps` (`Slider.tsx:12`) and `RadioGroupItemProps` (`RadioGroup.tsx:27`). Every call site in the repo (`rg -n "<(Checkbox|Slider|RadioGroupItem)\b" apps tools --glob '*.tsx'`):
   - Already labelled, unchanged: `LapsControl.tsx:86` `Slider` (`m.ui_laps_split_distance()`), `CheckRow.tsx:55` `Checkbox` (`tickLabel`).
   - `LapsControl.tsx:210` `RadioGroupItem` (laps source rows) → `aria-label={item.title}` (the row's visible `m.ui_laps_off()` / `m.ui_laps_device()` / `m.ui_laps_splits()`).
   - `LapsControl.tsx:234` `RadioGroupItem value="efforts"` → `aria-label={m.ui_laps_efforts()}`.
   - `TrackIntensityControl.tsx:100` → `aria-label={INTENSITY_LABEL[candidate]()}`.
   - `ColorByControl.tsx:160` → `aria-label={MODE_LABEL[option.mode]()}`.
   - `MapViewControl.tsx:62` → `aria-label={LABEL_BY_MAP_VIEW[option]()}` (the row's visible title; `e2e/map.spec.ts:162` picks the radio by `^2D`/`^3D`, which the title-only name still matches).
   - `ManageTripDialog.tsx:46` → `aria-label={trip.name}` (data, not copy: the trip's own name, which `TripHeader` shows).
   - `AnswerDialog.tsx:48` (workbench) → `aria-label={`(${entry.id}) ${entry.text}`}` (the option's own text, read from the plan file: data, not a message).
   New message keys: none — each label is the message or data value the row already shows as its title. Behaviour change (owner-accepted): the radios' accessible name is now the title alone, where today it is computed from the whole content (title plus caption).
   Check: `vp check` passes (a missing label is a type error); `rg -n -U "<(Checkbox|Slider|RadioGroupItem)\b[^>]*>" apps tools --glob '*.tsx'` shows `aria-label` in every element. New behaviour pinned in e2e: in `apps/web/e2e/sessions.spec.ts:69` the laps radio is located with `{ name: 'Off', exact: true }` and at `:86` the colour-by radio with `{ name: 'Heart rate', exact: true }` (exact names pin the title-only accessible name; today's name also carries the caption); `vp run e2e` passes.

## Open items

- R6 is adapted: the kit stops authoring accessible names for its own controls as well (owner decision), so the sheet handle and the dialog grab handle take required label props instead of reading `m.*` inside the kit.
- Wordless symbols stay in the kit as markup, not copy: the `·` crumb separator (`StatTile.tsx:53,68`), the required marker `*` (`Label.tsx:21`), the `#` index header (`DataTable.tsx:35`).
- R3 borderline names kept: `primary`/`secondary` on `ListItem`, `ListItemHeader` and `CollapsibleListItem` name the line's role in the item, `header` on `StatRail` and `chip` on `DialogHeader` name the element they fill.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
