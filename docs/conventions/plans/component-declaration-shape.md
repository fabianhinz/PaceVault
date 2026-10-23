---
id: component-declaration-shape
tdr_reference: tdr/component-declaration-shape.md
generated: 2026-10-23
---

# Component declaration shape and file naming

Read `tdr/component-declaration-shape.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

Today 190 components in `apps/web/src` are declared as unannotated arrows (`export const X = (props: …) =>` or `= () =>`); only `SportsRecords` and `DeckGLOverlay` carry an annotation, and that one is `React.FC`. 82 of them type props with an inline object literal (`(props: { … })`), and `TrainingEffectCard` uses a `type` alias. Items 3–11 bring one directory batch each to the target shape:

```tsx
import type { FC } from 'react';

interface SportBadgeProps {
  sport: Sport;
  size?: 'sm' | 'md';
}

export const SportBadge: FC<SportBadgeProps> = (props) => {
```

For every component in the batch: annotate `: FC<XProps>` (`: FC` with no props, `: FC<PropsWithChildren>` when children is the only prop), turn an inline props literal into a non-exported `interface <ComponentName>Props` declared directly above the component, keep the `props` parameter name, and import `type FC` (and `type PropsWithChildren` where used) from `react`. Module-local components get the same shape. Run every item from the repo root; "clean `vp check`" means `vp run -F @pacevault/i18n compile && vp check` finishes with no error. The batch check is the same two commands with the batch's paths:

- `rg -n "^\s*(export )?const [A-Z][a-zA-Z0-9]* = \((props\b|\) =>)" -g '*.tsx' <paths>` prints nothing (every component is annotated);
- `rg -n "\(props: \{|FC<\{|React\.FC" -g '*.tsx' <paths>` prints nothing (no inline props, no `React.FC`).

1. Rename the hook module that carries a component-style name.
   Files: `apps/web/src/components/charts/ZoneGradient.tsx` → `apps/web/src/components/charts/useZoneLineStroke.tsx`; importers `apps/web/src/features/sessions/charts/HrChart.tsx`, `apps/web/src/features/sessions/charts/PaceChart.tsx`, `apps/web/src/features/sessions/charts/SpeedChart.tsx`, `apps/web/src/features/sessions/charts/PowerChart.tsx`
   Change: The module's only export is the hook `useZoneLineStroke` (it returns JSX `<defs>`), so a PascalCase filename wrongly announces a component. Rename the file to the hook's name (lowerCamelCase `.tsx` is reserved for exactly this case) and rewrite the four imports from `@/components/charts/ZoneGradient.tsx` to `@/components/charts/useZoneLineStroke.tsx`. Where the hook finally lives is the hook-directory-placement plan's call; this item only fixes the name.
   Check: `test ! -e apps/web/src/components/charts/ZoneGradient.tsx`; `rg -n "ZoneGradient" apps/web` prints nothing; clean `vp check`.

2. Replace the one `type` props alias with an interface.
   Files: `apps/web/src/features/sessions/session/TrainingEffectCard.tsx`
   Change: `type TrainingEffectCardProps = { … };` (`:119`) becomes `interface TrainingEffectCardProps { … }` with the same members, directly above `TrainingEffectCard`.
   Check: `rg -n "^(export )?type [A-Za-z]*Props\b" -g '*.tsx' apps/web/src` prints nothing; clean `vp check`.

3. Batch `apps/web/src/components/` (charts, layout and the app-bound components; 27 components, 9 inline props).
   Files: every `.tsx` under `apps/web/src/components/`
   Change: As described above. Children-only components here: `FallbackActions`, `DockCircle` (`FC<PropsWithChildren>`).
   Check: the two batch commands with `apps/web/src/components`; clean `vp check`.

4. Batch app shell, pages and debug triggers (`App`, 10 page-module components, `CrashTrigger`, `DebugCrashTrigger`).
   Files: `apps/web/src/App.tsx`, every `.tsx` under `apps/web/src/pages/`, `apps/web/src/lib/debug/CrashTrigger.tsx`, `apps/web/src/lib/debug/DebugCrashTrigger.tsx`
   Change: As described above (inline props in `StudioDetailPage.tsx:33` and `TripDetailPage.tsx:40` become `StudioDetailProps` / `TripDetailProps`).
   Check: the two batch commands with `apps/web/src/App.tsx apps/web/src/pages apps/web/src/lib/debug`; clean `vp check`.

5. Batch `features/dashboard`, `features/filters`, `features/intervals`, `features/labs`, `features/map`, `features/records` (30 components, 9 inline props).
   Files: every `.tsx` under those six directories
   Change: As described above; `DeckGLOverlay: React.FC<DeckGLOverlayProps>` (`features/map/DeckGLOverlay.tsx:66`) and `SportsRecords: React.FC` (`features/records/SportsRecords.tsx:8`) become `FC<DeckGLOverlayProps>` / `FC`.
   Check: the two batch commands with `apps/web/src/features/{dashboard,filters,intervals,labs,map,records}`; clean `vp check`.

6. Batch `features/onboarding` (19 components, 10 inline props).
   Files: every `.tsx` under `apps/web/src/features/onboarding/`
   Change: As described above; `CardBody` becomes `FC<PropsWithChildren>`.
   Check: the two batch commands with `apps/web/src/features/onboarding`; clean `vp check`.

7. Batch `features/sessions` top level and `features/sessions/charts`.
   Files: every `.tsx` directly under `apps/web/src/features/sessions/` and under `apps/web/src/features/sessions/charts/`
   Change: As described above (e.g. `SportBadge` at `features/sessions/SportBadge.tsx:6` gets `SportBadgeProps`).
   Check: the two batch commands with `apps/web/src/features/sessions/*.tsx apps/web/src/features/sessions/charts`; clean `vp check`.

8. Batch `features/sessions/session`.
   Files: every `.tsx` under `apps/web/src/features/sessions/session/`
   Change: As described above; `AvatarFrame` becomes `FC<PropsWithChildren>`; `LapStrip` (`LapStrip.tsx:298`, `(props: { set: LapSet | null; size: 'avatar' | 'detail' })`) gets `LapStripProps`.
   Check: the two batch commands with `apps/web/src/features/sessions/session`; clean `vp check`.

9. Batch `features/settings` (15 components, 3 inline props).
   Files: every `.tsx` under `apps/web/src/features/settings/`
   Change: As described above.
   Check: the two batch commands with `apps/web/src/features/settings`; clean `vp check`.

10. Batch `features/studio` (18 components, 16 inline props).
    Files: every `.tsx` under `apps/web/src/features/studio/` (including `charts/` and `markers/`)
    Change: As described above (e.g. `StudioColorPicker` at `features/studio/StudioColorPicker.tsx:5` gets `StudioColorPickerProps`).
    Check: the two batch commands with `apps/web/src/features/studio`; clean `vp check`.

11. Batch `features/trips` (10 components, 8 inline props).
    Files: every `.tsx` under `apps/web/src/features/trips/`
    Change: As described above.
    Check: the two batch commands with `apps/web/src/features/trips`; clean `vp check`.

12. Give the directories rendered as a unit an `index.tsx` entry named for the directory.
    Files: `apps/web/src/features/onboarding/OnboardingFlow.tsx` → `apps/web/src/features/onboarding/index.tsx`, `apps/web/src/features/filters/FilterList.tsx` → `apps/web/src/features/filters/index.tsx`, `apps/web/src/features/intervals/IntervalsConnectionForm.tsx` → `apps/web/src/features/intervals/index.tsx`, `apps/web/src/features/records/SportsRecords.tsx` → `apps/web/src/features/records/index.tsx`; importers `apps/web/src/pages/OnboardingPage.tsx`, `apps/web/src/components/layout/Dock.tsx`, `apps/web/src/features/onboarding/OnboardingStep.tsx`, `apps/web/src/features/settings/IntegrationsCard.tsx`, `apps/web/src/pages/SessionsPage.tsx`
    Change: Each of these four feature directories is mounted from outside through exactly one component. Move that component into the directory's `index.tsx` and rename it for the directory: `OnboardingFlow` → `Onboarding`, `FilterList` → `Filters`, `IntervalsConnectionForm` → `Intervals`, `SportsRecords` → `Records` (props interfaces renamed to match: `FiltersProps`, `IntervalsProps`). Importers name the directory's index: `import { Onboarding } from '@/features/onboarding/index.tsx';` and so on, with the JSX tags renamed. The other modules of each directory stay as they are; the index declares the entry component and re-exports nothing. Directories with several components mounted from outside (`dashboard`, `labs`, `map`, `sessions`, `settings`, `studio`, `trips`) get no index.
    Check: `ls apps/web/src/features/{onboarding,filters,intervals,records}/index.tsx` lists four files; `rg -n "\b(OnboardingFlow|FilterList|IntervalsConnectionForm|SportsRecords)\b" apps/web/src apps/web/tests apps/web/e2e` prints nothing (the word boundaries leave the e2e helpers `openFilterList`/`closeFilterList`, which name a UI action, alone); clean `vp check`; `vp run e2e` passes.

13. (packages/ui) Annotate the kit's form-control components with `FC` and named props interfaces.
   Files: `packages/ui/src/components/Button.tsx`, `Checkbox.tsx`, `Input.tsx`, `Label.tsx`, `RadioGroup.tsx`, `Select.tsx`, `Slider.tsx`, `Switch.tsx`, `Tabs.tsx`, `Textarea.tsx`, `DropdownMenu.tsx`, `Popover.tsx`, `HelperText.tsx` (all under `packages/ui/src/components/`)
   Change: every component declared in these files becomes `export const X: FC<XProps> = (props) =>` (module-local ones without `export`), `import type { FC } from 'react'`. An inline props literal or intersection becomes a non-exported `interface XProps` directly above it (`HelperText.tsx:5`, `DropdownMenu.tsx:27`). A pure pass-through wrapper with no props of its own is annotated `FC<ComponentProps<typeof Primitive.Part>>` without an interface (`SelectTrigger`, `SelectContent`, `SelectItem`, `TabsList`, `TabsTrigger`, `TabsContent`, `Tabs`, `PopoverContent`, `DropdownMenuContent`). The Radix re-bindings (`SelectRoot`, `SelectValue`, `PopoverRoot`, `PopoverTrigger`, `PopoverAnchor`, `DropdownMenuRoot`, `DropdownMenuTrigger`) are values, not arrow components, and stay as they are.
   Check: `rg -n "^\s*(export )?const [A-Z][a-zA-Z0-9]* = \((props\b|\) =>)" <these files>` prints nothing; `rg -n "\(props: \{|FC<\{|React\.FC" <these files>` prints nothing; `vp run check` and `vp run test` pass.

14. (packages/ui) Annotate the kit's layout and data components.
   Files: `packages/ui/src/components/Card.tsx`, `CardGrid.tsx`, `CardHeader.tsx`, `ActionPromptCard.tsx`, `PageGrid.tsx`, `ChartsCard.tsx`, `StatTile.tsx`, `StatRail.tsx`, `ListItemHeader.tsx`, `List.tsx`, `Collapsible.tsx`, `DataTable.tsx` (all under `packages/ui/src/components/`)
   Change: same shape as the previous item. Inline props become interfaces: `ChartsCard.tsx:22` (`ZoomResetPillProps`), `StatTile.tsx:37` (`IconFactProps`), `:47` (`WrappingCrumbsProps`), `:62` (`CrumbsProps`). `type` aliases become interfaces where they are plain object shapes: `List.tsx:6,15`; `CardHeader.tsx:4` and `StatTile.tsx:13-24` are unions/intersections and stay `type CardHeaderProps`/`type StatTileProps` (an interface cannot express them). `DataTable` is generic: it stays `export const DataTable = <T,>(props: DataTableProps<T>): ReactElement =>` (an `FC<…>` annotation cannot carry a type parameter).
   Check: the two greps of the previous item over these files print only the `DataTable` line; `vp run check` and `vp run test` pass.

15. (packages/ui) Annotate the remaining kit components.
   Files: `packages/ui/src/components/ActionTile.tsx`, `ActionsMenu.tsx`, `Banner.tsx`, `BottomSheet.tsx`, `Chip.tsx`, `Dialog.tsx`, `ExternalLink.tsx`, `FloatingPill.tsx`, `GaugeDial.tsx`, `IconBadge.tsx`, `IconTile.tsx`, `InlineSkeleton.tsx`, `ResponsivePopover.tsx`, `SegmentBar.tsx`, `SegmentedControl.tsx`, `SheetAbove.tsx`, `SheetGrabber.tsx`, `SheetPeek.tsx`, `SlidingHighlight.tsx`, `SplitBar.tsx`, `Toast.tsx`, `Typography.tsx`, `ValueSkeleton.tsx` (all under `packages/ui/src/components/`)
   Change: same shape. Inline props become interfaces: `ActionsMenu.tsx:27` (`SheetRowProps`), `Chip.tsx:5`, `Dialog.tsx:195` (`DialogBodyProps`), `:213` (`DialogFooterProps`), `ResponsivePopover.tsx:26` (`PointAnchorProps`), `ActionTile.tsx:33` (`RowContentProps`, its own members instead of `ActionTileProps & { look }`); `type` aliases become interfaces: `GaugeDial.tsx:3,71`, `SegmentedControl.tsx:7`. Components without props are annotated bare `FC` (`SheetGrabber`, `ValueSkeleton`); children-only ones `FC<PropsWithChildren>` (`SheetAbove`, `BottomSheetProvider` if it is still in `BottomSheet.tsx`).
   Check: the two greps over these files print nothing; `vp run check` and `vp run test` pass.

16. (packages/ui) Read props through `props`, keeping only the strip-destructure the kit allows.
   Files: `packages/ui/src/components/Button.tsx`, `Banner.tsx`, `Input.tsx`, `Label.tsx`, `Textarea.tsx`, `Select.tsx`, `Tabs.tsx`, `DropdownMenu.tsx`, `Popover.tsx` (all under `packages/ui/src/components/`)
   Change: these wrappers destructure props and then read the destructured locals. Rewrite each to the form `Card.tsx:26` and `Typography.tsx:43` already use: the destructure only strips the wrapper's own props from what is forwarded (`const { variant: _variant, className: _className, …, ...rest } = props;`) and every read goes through `props.x`. A destructuring default becomes `props.x ?? <default>` at the single read (`Button.tsx:33-36` `variant = 'primary'`, `size = 'md'`, `asChild = false`, `loading = false`; `Input.tsx:25` `variant = 'field'`; `DropdownMenu.tsx:9` and `Popover.tsx:13` `sideOffset = <value or its constant>`). Order of attributes and of the spread stays as it is, so the rendered element receives the same props.
   Check: `rg -n "const \{[^}]*\} = props" packages/ui/src/components` shows only destructures whose every field except `...rest` is renamed to an `_`-prefixed name; `vp run check` and `vp run test` pass; `vp run e2e` passes.

17. (tools/docs) Annotate the banner page components and give each a props interface (R1, R2, R3).
   Files: `tools/docs/banner/page/Banner.tsx`
   Change: the seven arrow components of the banner page are unannotated and type their props inline. Add `import type { FC, ReactNode } from 'react';` (merged into the existing `react` import) and give each the target shape, with a non-exported interface directly above it:
   - `FitText` (`:25`): `interface FitTextProps { children: ReactNode; className?: string; }`, `const FitText: FC<FitTextProps> = (props) => {` (`React.ReactNode` becomes the imported `ReactNode`).
   - `Shot` (`:48`): `interface ShotProps { file: string; fit: 'cover' | 'contain'; className?: string; }` (or `fit: ShotFit` if the variant-unions plan already named it), `const Shot: FC<ShotProps> = (props) =>`.
   - `StepCaption` (`:67`): `interface StepCaptionProps { step: number; label: string; }`.
   - `FrameShots` (`:80`): `interface FrameShotsProps { frame: BannerFrame; }`.
   - `FlowCard` (`:92`): `interface FlowCardProps { flow: BannerFlow; index: number; }` — or `{ flowKey: FlowKey; index: number; }` if the exhaustive-record-maps plan already keyed the flows.
   - `Tile` (`:127`): `interface TileProps { tile: BannerTile; }` — or `{ tileKey: TileKey; }` after that plan.
   - `Banner` (`:141`): takes no props, so `export const Banner: FC = () => {`.
   Bodies, markup and the `props` parameter stay as they are; types only. Splitting the module into one component per file is the unit-length plan's item (R4 there as R5), which runs after this one.
   Check: `rg -n "= \(props: \{|React\.ReactNode" tools/docs/banner/page` prints nothing; `rg -n "^(export )?const [A-Z]\w*: FC" tools/docs/banner/page/Banner.tsx` prints seven lines; `vp check` from `tools/docs/` is clean.

### tools/workbench

The board island's components (`tools/workbench/site/src/app/*.tsx`) are declared `(props: XProps) =>` with a `type` alias or an inline object type today. Only the declarations change; markup, props and behaviour stay. The two children-only `Empty` components (`PlanPane.tsx:24`, `ReviewPane.tsx:34`) get their `FC<PropsWithChildren>` under the library-type-narrowing plan. Splitting the modules that declare several components is the unit-length plan's work (R4, R5 there); this item gives every component its shape where it sits.

**Workbench check.** Save this script outside the repo (for example as `wb-probe.sh` in your scratch directory). Before the item run `bash <path>/wb-probe.sh <dir>/before`, after it `bash <path>/wb-probe.sh <dir>/after`; `diff -r <dir>/before <dir>/after` must print nothing. It feeds representative inputs to the three hooks and the CLI entry points and records each one's stdout, stderr and exit code; it writes nothing into the repo.

```bash
set -u
OUT="$1"
REPO="$(git rev-parse --show-toplevel)"
WB="$REPO/tools/workbench/scripts"
FIX="$(mktemp -d)/fix"
ITEM="$FIX/tools/workbench/backlog/demo"
mkdir -p "$ITEM/review" "$OUT"
printf -- '---\ntitle: Demo\nstatus: planned\ncreated: 2026-10-23\ntype: chore\nareas: [workbench]\nnext: Go\n---\n\n## Real-data checks\n\n- [ ] One\n\n## Open questions\n\n- **Q1** · open · Pick? (a) x (b) y\n' > "$ITEM/plan.md"
printf -- '## Agent decisions\n\n- [ ] **(scope) Keep it.** Agent: fits.\n' > "$ITEM/review/decisions.md"
P="$ITEM/plan.md"
D="$ITEM/review/decisions.md"
N="$FIX/tools/workbench/backlog/fresh/plan.md"
edit() { printf '{"tool_name":"Edit","tool_input":{"file_path":"%s","old_string":"%s","new_string":"%s"}}' "$1" "$2" "$3"; }
write() { printf '{"tool_name":"Write","tool_input":{"file_path":"%s","content":"%s"}}' "$1" "$2"; }
shell() { printf '{"tool_name":"Bash","tool_input":{"command":"%s"},"cwd":"%s"}' "$1" "$FIX"; }
run() {
  printf '%s' "$3" | (cd "$REPO" && WB_ROOT="$FIX/tools/workbench/backlog" node "$WB/$2" ${4:-}) >"$OUT/$1.out" 2>"$OUT/$1.err"
  echo $? >"$OUT/$1.code"
  perl -pi -e "s|\Q$FIX\E|FIX|g" "$OUT/$1.out" "$OUT/$1.err"
}
run sg-ready statusGuard.ts "$(edit "$P" 'status: planned' 'status: ready')"
run sg-skip statusGuard.ts "$(edit "$P" 'status: planned' 'status: in-dev')"
run sg-back statusGuard.ts "$(edit "$P" 'status: planned' 'status: idea')"
run sg-text statusGuard.ts "$(edit "$P" 'next: Go' 'next: Go on')"
run sg-tick statusGuard.ts "$(edit "$P" '- [ ] One' '- [x] One')"
run sg-size statusGuard.ts "$(edit "$P" 'next: Go' 'next: Go\nsize: small')"
run sg-new-idea statusGuard.ts "$(write "$N" '---\ntitle: F\nstatus: idea\ncreated: 2026-10-23\nnext: Go\n---\n')"
run sg-new-planned statusGuard.ts "$(write "$N" '---\ntitle: F\nstatus: planned\ncreated: 2026-10-23\nnext: Go\n---\n')"
run sg-dec-tick statusGuard.ts "$(edit "$D" '- [ ] **(scope)' '- [x] **(scope)')"
run sg-dec-kindless statusGuard.ts "$(edit "$D" 'Agent: fits.' 'Agent: fits.\n- [ ] **Other.** Agent: why.')"
run sg-dec-bare statusGuard.ts "$(edit "$D" '- [ ] **(scope) Keep it.** Agent: fits.' '- [~] **(scope) Keep it.** Agent: fits.')"
run sg-dec-pointer statusGuard.ts "$(edit "$D" '- [ ] **(scope) Keep it.** Agent: fits.' '- [~] **(scope) Keep it.** Agent: fits. Superseded by: Q2')"
run sg-sed statusGuard.ts "$(shell "sed -i '' s/Go/On/ tools/workbench/backlog/demo/plan.md")"
run sg-redirect statusGuard.ts "$(shell 'echo x > tools/workbench/backlog/demo/review/decisions.md')"
run sg-rm statusGuard.ts "$(shell 'rm -rf tools/workbench/backlog/demo')"
run sg-find statusGuard.ts "$(shell 'find tools/workbench/backlog -name x -delete')"
run sg-cd statusGuard.ts "$(shell 'cd tools/workbench/backlog/demo && rm plan.md')"
run sg-read statusGuard.ts "$(shell 'cat tools/workbench/backlog/demo/plan.md')"
run sg-other statusGuard.ts '{"tool_name":"Read","tool_input":{"file_path":"x"}}'
run sg-bad statusGuard.ts 'not json'
run wg-sub-commit workerGitGuard.ts '{"tool_name":"Bash","tool_input":{"command":"git commit -m x"},"agent_id":"a"}'
run wg-sub-reset workerGitGuard.ts '{"tool_name":"Bash","tool_input":{"command":"git -C . reset --hard"},"agent_type":"item-worker"}'
run wg-sub-status workerGitGuard.ts '{"tool_name":"Bash","tool_input":{"command":"git status"},"agent_id":"a"}'
run wg-owner-commit workerGitGuard.ts '{"tool_name":"Bash","tool_input":{"command":"git commit -m x"}}'
run wg-bad workerGitGuard.ts 'not json'
run ih-plan indexHook.ts "{\"tool_input\":{\"file_path\":\"$P\"}}"
run ih-decisions indexHook.ts "{\"tool_input\":{\"file_path\":\"$D\"}}"
run ih-other indexHook.ts '{"tool_input":{"file_path":"/tmp/x.md"}}'
run ih-bad indexHook.ts 'not json'
run check-cli check.ts ''
run deps-usage deps.ts ''
run deps-missing deps.ts '' zz-no-such-item
run interfaces-usage interfaces.ts ''
run interfaces-missing interfaces.ts '' zz-no-such-item
```

**Board check** (items that touch `site/`): with the board on `http://localhost:4321` (reuse a running board, `lsof -iTCP -sTCP:LISTEN -P | grep :4321`; start one with `vp run workbench` only when none runs, and stop it afterwards), before the item run `vp -C tools/workbench exec playwright screenshot --viewport-size=1512,860 --wait-for-timeout=3000 http://localhost:4321 <dir>/board-before.png`, after it the same into `<dir>/board-after.png`, and compare with `uv run --no-project --with pillow python -c "import sys;from PIL import Image,ImageChops;print(ImageChops.difference(Image.open(sys.argv[1]).convert('RGBA'),Image.open(sys.argv[2]).convert('RGBA')).getbbox())" <dir>/board-before.png <dir>/board-after.png`, which must print `None`. Then open an item with all four tabs, walk Mockup, Plan, Tech (Planned | Actual switch, Full screen) and Review, open Answer… on a question and close it, and confirm by eye that nothing looks or behaves differently.

**Suite**: `vp check` from `tools/workbench/` is clean, `vp run -F @pacevault/workbench check` passes (astro sync + astro check), and `vp test -- --run` from `tools/workbench/` passes 66 tests (13 spec files today; a later item that splits a spec changes the file count, never the test count).

18. (tools/workbench) Annotate the board components with `FC` and a non-exported props interface (R1, R2, R3).
   Files: `tools/workbench/site/src/app/{AnswerDialog,Board,CheckRow,Columns,ItemCard,ItemPanel,MockupPane,NeedsYou,Panel,PlanPane,Prose,QuestionRow,ReviewPane,Stage,TechPane,WriteCard}.tsx`, `tools/workbench/site/src/app/icons.tsx`
   Change: every component becomes `const X: FC<XProps> = (props) =>` (`export const` where it is exported today) with `import type { FC } from 'react'`, its props an `interface XProps` declared directly above it and not exported. `type XProps = { … }` aliases become interfaces with the same members (`ColumnProps`, `ColumnsProps` in `Columns.tsx`; `ItemPanelProps`; `PanelProps`; `ItemCardProps`; `NeedsYouProps`; `StageProps`; `CheckRowProps`; `AnswerProps` in `AnswerDialog.tsx` is renamed `AnswerFormProps` after its component). Inline parameter types become named interfaces: `FlakyRowProps` (`NeedsYou.tsx:21`), `MockupPaneProps`, `ProseProps`, `InlineProps`, `PlanPaneProps`, `SectionProps` (`PlanPane.tsx:12` and, separately, `ReviewPane.tsx:14`, each in its module), `QuestionRowProps`, `FillProps`, `StatusIconProps`, `TypeIconProps` (`icons.tsx`), `FindingRowProps`, `SectionsProps`, `ReviewPaneProps`, `AnswerDialogProps`, `TechPaneProps`, `WrittenProps`. A member typed `ReactNode` that is the component's children stays an ordinary `children: ReactNode` member. Components without props are annotated bare `FC`: `BoardPage` and `Board` (`Board.tsx`), `Ring` (`icons.tsx:7`), `WriteCard`. Props keep being read through `props.`.
   Check: `rg -n "= \(props: " tools/workbench/site/src/app` prints nothing; `rg -n "^(export )?type \w+Props = " tools/workbench/site/src/app` prints nothing; `rg -n "^export (interface|type) \w+Props" tools/workbench/site/src/app` prints nothing; workbench check; board check; suite.

## Open items

- `tools/docs`: R4 (one component per module) and R5 for the banner page are carried out by the unit-length-discipline plan (its `tools/docs` item splits `Banner.tsx` into one module per component beside a shared `bannerLocale.ts`). R6 has no subject (the page is mounted by `main.tsx`, not through an index); `main.tsx` is the entry module R7 allows.

- `packages/ui`: R4 (one component per module) and R5 (file naming) are carried out by the component-directory-and-file-naming plan, which splits the 15 multi-component kit modules while moving them into `pv<Name>/` directories; R6 (`index.tsx` entry) does not apply to the kit. A Radix re-binding (`export const DialogRoot = DialogPrimitive.Root`) is a value, not an arrow component, and is not annotated.
- R4 (exactly one component per module, no module-local sibling components; owner decision) and the PascalCase file-to-export match of R5 for the three modules that export several components (`components/ErrorFallbacks.tsx`, `components/layout/DockItems.tsx`, `components/charts/ChartRail.tsx`) are carried out by the unit-length-discipline plan, which splits all 29 multi-component modules; this plan only shapes declarations, so it applies to whichever modules exist when it runs.
- R8 (route modules default-export their component) does not apply: React Router routes here mount named exports, and default exports are not used anywhere in the app.
- `tools/workbench/tests/deps.spec.ts:19-22,66` (`tools/workbench/tests/scripts/deps.spec.ts` once the mirrored-spec plan has moved it) names `apps/web/src/features/onboarding/OnboardingFlow.tsx` as fixture data for the dependency-graph tool; it reads no real file, so item 12 leaves it alone.
- `tools/workbench`: R4, R5 and R7 (`icons.tsx`) are carried out by the unit-length-discipline plan, which splits the nine board modules that declare several components. R6 is not applied to `site/src/app/`: Astro mounts the island by file (`site/src/pages/index.astro` → `site/src/app/Board.tsx`).

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
