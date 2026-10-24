---
id: index-modules-are-not-barrels
tdr_reference: tdr/index-modules-are-not-barrels.md
depends_on: [engine-holds-domain-logic-only]
generated: 2026-10-23
---

# An index module is a real module, never a re-export barrel

Read `tdr/index-modules-are-not-barrels.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`engine-holds-domain-logic-only`](engine-holds-domain-logic-only.md) — deletes the engine's formatter strategy and moves the track encoder out, so items 6–7 list only what is left.

## Changes

Run every item from the repo root. "Clean `vp check`" means `vp run -F @pacevault/i18n compile && vp check` finishes with no error.

1. Stop forwarding engine types through the app's type registry.
   Files: `apps/web/src/types/index.ts`, `apps/web/src/store/user.ts`
   Change: Delete the re-export block `export type { Gender, FormStatus, InjuryRisk, RunningZoneName, RaceDistance } from '@pacevault/engine/types.ts';` (`apps/web/src/types/index.ts:10-16`); keep the `import type { … }` at lines 2-8, which the declarations below it use. The only module that obtains one of those names through the registry is `apps/web/src/store/user.ts:6` (`import type { Gender, UserProfile } from '@/types/index.ts';`): split it into `import type { Gender } from '@pacevault/engine/types.ts';` and `import type { UserProfile } from '@/types/index.ts';` (or `@/types.ts` if item 2 already ran).
   Check: `rg -n "^export (type )?\{" apps/web/src/types` prints nothing; clean `vp check`.

2. Replace the `types/` directory index with a plain module.
   Files: `apps/web/src/types/index.ts` → `apps/web/src/types.ts`; importers: `apps/web/src/store/user.ts`, `apps/web/src/store/coachPlan.ts`, `apps/web/src/lib/thresholdsAt.ts`, `apps/web/src/lib/coachingMessages.ts`, `apps/web/src/lib/sessionStress.ts`, `apps/web/src/lib/groupSteps.ts`, `apps/web/src/lib/prescription.ts`, `apps/web/src/lib/fitParseProfile.ts`, `apps/web/src/lib/hooks/useMetrics.ts`, `apps/web/src/features/intervals/runIntervalsImport.ts`, `apps/web/src/features/sessions/recomputeTrainingLoad.ts`, `apps/web/src/features/sessions/reprocessSessions.ts`, `apps/web/src/features/demo/buildDemoDataset.ts`, `apps/web/src/features/sessions/hooks/useFileUpload.ts`, `apps/web/src/features/labs/WorkoutExpansionPanel.tsx`, `apps/web/src/features/settings/ThresholdsSection.tsx`, `apps/web/src/features/labs/WeeklyPlanTimeline.tsx`, `apps/web/src/features/labs/workoutDisplay.ts`, `apps/web/src/features/labs/WorkoutCard.tsx`, `apps/web/src/features/settings/hooks/useThresholdsForm.ts`, `apps/web/src/features/labs/hooks/useCoachPlan.ts`, `apps/web/tests/store/coachPlan.spec.ts`, `apps/web/tests/lib/prescription.spec.ts`, `apps/web/tests/lib/coachingMessages.spec.ts`, `apps/web/tests/factories/profiles.ts`, `apps/web/tests/features/demo/buildDemoDataset.spec.ts`, `apps/web/tests/lib/groupSteps.spec.ts`
   Change: `apps/web/src/types/` is a directory of declarations nobody renders, so it gets no index. Move `apps/web/src/types/index.ts` to `apps/web/src/types.ts` with its contents unchanged and delete the empty directory. Rewrite every `from '@/types/index.ts'` to `from '@/types.ts'` (27 import lines; the list above is the current set, re-run the check to catch any added since).
   Check: `test ! -e apps/web/src/types` succeeds; `rg -n "@/types/index" apps/web` prints nothing; `find apps/web/src apps/web/tests -name 'index.ts' -o -name 'index.tsx'` prints nothing except entry modules created by the component-declaration-shape plan (each declaring its own component); clean `vp check`; `vp run test` passes.

3. Use the `@/` alias for every cross-directory import in `features/map`.
   Files: `apps/web/src/features/map/MapBackground.tsx`, `apps/web/src/features/map/hooks/useOnboardingPreviewCameraEffect.ts`, `apps/web/src/features/map/hooks/useOnboardingPreviewLayer.ts`, `apps/web/src/features/map/hooks/useGeolocationCameraEffect.ts`, `apps/web/src/features/map/hooks/useOnboardingPreviewRoutes.ts`, `apps/web/src/features/map/hooks/useSessionDetailPath.ts`, `apps/web/src/features/map/hooks/useMapCameraEffect.ts`, `apps/web/src/features/map/hooks/useMapTerrainEffect.ts`, `apps/web/src/features/map/hooks/useTerrainLapStateEffect.ts`, `apps/web/src/features/map/hooks/useTerrainLineEffect.ts`, `apps/web/src/features/map/hooks/useTerrainOrbitEffect.ts`, `apps/web/src/features/map/hooks/useTerrainTrackPickingEffect.ts`
   Change: Rewrite each `'../<path>'` specifier to its `@/` form, keeping the imported names: `MapBackground.tsx:12-17` `'../studio/markers/StudioMarkerPins.tsx'` → `'@/features/studio/markers/StudioMarkerPins.tsx'`, same for `StudioTrackPickPopup.tsx`, `StudioRoutesPickPopup.tsx`, `'../studio/hooks/useStudioMapPopup.ts'`, `'../studio/hooks/useStudioRoutesPopup.ts'`, `'../sessions/SessionsPickPopup.tsx'` → `'@/features/sessions/SessionsPickPopup.tsx'`; in `features/map/hooks/*` every `'../fitPadding.ts'`, `'../mapPadding.ts'`, `'../previewDrawIn.ts'`, `'../trackColors.ts'`, `'../zoneColoredPath.ts'`, `'../lapPath.ts'`, `'../mapStyle.ts'`, `'../terrainLine.ts'`, `'../terrainCamera.ts'` → `'@/features/map/<same file>'` (the line carrying the specifier: `useOnboardingPreviewCameraEffect.ts:7-8`, `useOnboardingPreviewLayer.ts:6,12`, `useGeolocationCameraEffect.ts:4`, `useOnboardingPreviewRoutes.ts:4`, `useSessionDetailPath.ts:17-18`, `useMapCameraEffect.ts:24-27,40`, and in the 3D hooks `useMapTerrainEffect.ts:4`, `useTerrainLapStateEffect.ts:6,12-13`, `useTerrainLineEffect.ts:10,19`, `useTerrainOrbitEffect.ts:4`, `useTerrainTrackPickingEffect.ts:7-8`).
   Check: `rg -n "from '\.\./" apps/web/src/features/map` prints nothing; clean `vp check`.

4. Use the `@/` alias for the remaining cross-directory imports.
   Files: `apps/web/src/features/intervals/hooks/useIntervalsSync.ts`, `apps/web/src/features/studio/hooks/useStudioMapPopup.ts`, `apps/web/src/features/studio/hooks/useGpxImport.ts`, `apps/web/src/features/sessions/session/HrZonesCell.tsx`, `apps/web/src/features/sessions/hooks/useTrainingLoadRecomputeEffect.ts`, `apps/web/src/features/sessions/hooks/useSessionReprocessingEffect.ts`
   Change: `useIntervalsSync.ts:5` `'../runIntervalsSync.ts'` → `'@/features/intervals/runIntervalsSync.ts'`; `useStudioMapPopup.ts:6` `'../markers/StudioTrackPickPopup.tsx'` → `'@/features/studio/markers/StudioTrackPickPopup.tsx'` (or the `@/features/studio/types.ts` path if the colocated-types plan already moved that type); `useGpxImport.ts:4` `'../createStudioRoute.ts'` → `'@/features/studio/createStudioRoute.ts'`; `HrZonesCell.tsx:7` `'../charts/zoneLabel.ts'` → `'@/features/sessions/charts/zoneLabel.ts'`; `useTrainingLoadRecomputeEffect.ts:5` `'../recomputeTrainingLoad.ts'` → `'@/features/sessions/recomputeTrainingLoad.ts'`; `useSessionReprocessingEffect.ts:5` `'../reprocessSessions.ts'` → `'@/features/sessions/reprocessSessions.ts'`.
   Check: `rg -n "from '\.\./" apps/web/src apps/web/tests` prints nothing; clean `vp check`.

5. (packages/ui) Drop the exports nothing imports, including the type export list.
   Files: `packages/ui/src/components/Dialog.tsx`, `packages/ui/src/components/SegmentBar.tsx`, `packages/ui/src/lib/dockGeometry.ts`, `packages/ui/src/components/DataTable.tsx`
   Change: `Dialog.tsx:21` `export const DialogOverlay` → `const DialogOverlay` (its only reader is `DialogContent` at `:126`); `SegmentBar.tsx:1` `export interface SegmentBarSegment` → `interface SegmentBarSegment`; `dockGeometry.ts:2` `export const DOCK_STACK_GAP` → `const DOCK_STACK_GAP` (read only at `:9`, `:11`); delete `DataTable.tsx:23` `export type { Field, DataTableProps };` (R2: exports are written at the declaration, and nothing imports either type).
   Check: `rg -n "\b(DialogOverlay|SegmentBarSegment|DOCK_STACK_GAP|DataTableProps)\b" apps tools --glob '!node_modules' --glob '!tools/workbench/backlog/**'` prints nothing; `rg -n "^export type \{" packages/ui/src` prints nothing; `vp run check` and `vp run test` pass.

6. (packages/engine) Drop `export` from the engine types nothing outside their module imports.
   Files: `packages/engine/src/decoupling.ts`, `packages/engine/src/effortDetection.ts`, `packages/engine/src/sessionDerivation.ts`, `packages/engine/src/stress.ts`, `packages/engine/src/trainingEffect.ts`
   Change: remove the `export` keyword, nothing else: `decoupling.ts:5` `DecouplingRatio`; `effortDetection.ts:34` `EffortDetection`, `:40` `EffortSignalDefaults`; `sessionDerivation.ts:4` `RecordDerivedFields`; `stress.ts:7` `StressSummary`, `:22` `HrThresholds`, `:24` `SessionStress`, `:31` `HrReserveSample`; `trainingEffect.ts:37` `TrainingEffectThresholds`. Constants are not touched here; the behavioural-constants plan unexports them. Re-check each name first with `rg -nw <Name> apps packages tools --glob '!node_modules' --glob '!tools/workbench/backlog/**'`: a name that shows up outside its own module keeps its `export`.
   Check: the `rg -nw` above prints only the declaring module for each of the nine names; `vp run check` and `vp run test` pass.

7. (packages/engine) Drop the parameters no caller passes.
   Files: `packages/engine/src/effortDetection.ts`, `packages/engine/src/gps.ts`, `packages/engine/src/decoupling.ts`, `packages/engine/src/energy.ts`, `packages/engine/tests/decoupling.spec.ts`, `packages/engine/tests/energy.spec.ts`
   Change: `detectEfforts` (`effortDetection.ts:667-672`) loses its optional `gradients` parameter (no caller passes it: `apps/web/src/lib/effortLaps.ts:68` and every spec call use three arguments); `:701` `const perRecord = gradients ?? windowedGradients(records);` → `const perRecord = windowedGradients(records);`. `densestClusterBounds` (`gps.ts:236-239`) loses `radiusDeg = 0.25` (its only caller, `apps/web/src/features/map/hooks/useMapCameraEffect.ts:87`, passes one argument); add `const CLUSTER_RADIUS_DEGREES = 0.25;` at the top of `gps.ts` and read it at the two uses (`:256`, `:269`). `aerobicDecoupling` (`decoupling.ts:101`) and `estimateSessionEnergy` (`energy.ts:176`) turn `gradients = windowedGradients(records)` into a required `gradients: Array<number | undefined>`: their app caller (`apps/web/src/lib/moreStats.ts:154,179`) already passes it, only specs relied on the default; every spec call that passed three arguments now passes `windowedGradients(records)` as the fourth, computed from the same records it hands in (`decoupling.spec.ts:34,40,45,55,59,64,69`; `energy.spec.ts:23,35,44,67,72,77,82,93,98,104,114,121,129,137` — the calls at `:52` and `:58` already pass gradients). Drop the `windowedGradients` import from `decoupling.ts` and `energy.ts` if nothing else in them reads it.
   Check: `rg -n "gradients\?:|= windowedGradients\(records\)\)|radiusDeg" packages/engine/src` prints nothing; `vp run check` and `vp run test` pass with the same test count.

8. (tools/docs) Drop the message parameters no caller passes and the hand-built script directory.
   Files: `tools/docs/banner/capture.ts`
   Change: every call of `t` passes one argument (`rg -n "\bt\('[a-z_]+'," tools/docs/banner` prints nothing), so `const t = (key: string, params: Record<string, string> = {}) => {` (`:26`) becomes `const t = (key: string) => {`, and the `let text = value;` / `for (const [name, replacement] of Object.entries(params)) { … }` / `return text;` block (`:29-33`) becomes `return value;` after the existing `if (typeof value !== 'string') throw …` guard. `const scriptDir = dirname(fileURLToPath(import.meta.url));` (`:14`) is deleted; `repoRoot` (`:15`) and `OUT_DIR` (`:16`) read `import.meta.dirname` instead of `scriptDir`, as `tools/docs/banner/run.ts:23` and `tools/docs/playwright.config.ts:11` already do. Remove the `import { fileURLToPath } from 'node:url';` line (`:5`); `dirname` stays imported for `:19`.
   Check: `rg -n "scriptDir|fileURLToPath|params" tools/docs/banner/capture.ts` prints nothing; `vp check` from `tools/docs/` is clean; `vp run docs:banner --locale de` writes `docs/banners/de_banner.png` without error.

### tools/workbench

Line numbers are today's. The hook entry files `tools/workbench/scripts/statusGuard.ts`, `indexHook.ts` and `workerGitGuard.ts` keep their paths (`.claude/settings.json` runs them by path and is not edited by any plan). Every workbench item ends with the workbench check below.

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

9. (tools/workbench) Add the `@scripts/` and `@site/` aliases and use them for every cross-directory import (R4, R8).
   Files: `tools/workbench/tsconfig.json`, `tools/workbench/site/tsconfig.json`, `tools/workbench/vitest.config.ts`, `tools/workbench/.dependency-cruiser.cjs`; importers: `tools/workbench/site/src/actions/index.ts`, `tools/workbench/site/src/pages/index.astro`, `tools/workbench/site/src/lib/board.ts`, `tools/workbench/site/src/lib/vocabulary.ts`, `tools/workbench/site/src/app/{AnswerDialog,Board,CheckRow,Columns,ItemCard,ItemPanel,MockupPane,NeedsYou,PlanPane,QuestionRow,ReviewPane,TechPane,WriteCard}.tsx`, `tools/workbench/site/src/app/icons.tsx`, `tools/workbench/site/src/app/useBoardChangedEffect.ts`, `tools/workbench/site/src/app/useWrite.ts`, every spec under `tools/workbench/tests/`
   Change: the workbench has two source roots that import each other by `../../../`: `@scripts/*` names `tools/workbench/scripts/*` and `@site/*` names `tools/workbench/site/src/*`.
   - `tools/workbench/tsconfig.json` `compilerOptions` gains `"paths": { "@scripts/*": ["./scripts/*"], "@site/*": ["./site/src/*"] }`; `tools/workbench/site/tsconfig.json` `compilerOptions` gains `"paths": { "@scripts/*": ["../scripts/*"], "@site/*": ["./src/*"] }` (Astro takes its import aliases from these `paths`). `vitest.config.ts` gains `resolve: { alias: { '@scripts': path.resolve(__dirname, 'scripts'), '@site': path.resolve(__dirname, 'site/src') } }` with `import path from 'node:path';`, the form `apps/web/vitest.config.ts` uses. `.dependency-cruiser.cjs` `options` gains `enhancedResolveOptions: { alias: { '@scripts': require('node:path').join(__dirname, 'scripts'), '@site': require('node:path').join(__dirname, 'site/src') } }`, so `vp run workbench:deps` resolves the aliased imports to the same files.
   - Rewrite every specifier that leaves its folder: `'../../../scripts/frontmatter.ts'` → `'@scripts/frontmatter.ts'` (and `check.ts`), `'../lib/board.ts'` → `'@site/lib/board.ts'` (and `vocabulary.ts`, `writeBack.ts`, `devPlugin.ts`), `'../actions/index.ts'` → `'@site/actions/index.ts'`, `'../scripts/tech.ts'` → `'@site/scripts/tech.ts'`, `'../app/Board.tsx'` and `'../styles/board.css'` in `index.astro` → `'@site/app/Board.tsx'`, `'@site/styles/board.css'`; in the specs `'../scripts/<x>.ts'` → `'@scripts/<x>.ts'` and `'../site/src/<x>'` → `'@site/<x>'`, including the dynamic `import(…)` calls and the `typeof import(…)` types. Same-folder `./x.ts` imports stay.
   - Two modules keep relative specifiers because they load while Astro reads its own config, before the aliases exist: `tools/workbench/site/astro.config.mjs` (`./src/lib/devPlugin.ts`) and `tools/workbench/site/src/lib/devPlugin.ts` (`../../../scripts/frontmatter.ts`). Node runs the scripts directly (`node scripts/<x>.ts`), so modules under `scripts/` import only same-folder modules and never an alias (they do today).
   Check: `rg -n "from '\.\./|import\('\.\./|import '\.\./" tools/workbench/site/src tools/workbench/tests` prints only the `devPlugin.ts` line; before and after the item run `tools/workbench/node_modules/.bin/depcruise --config tools/workbench/.dependency-cruiser.cjs --output-type json tools/workbench/site/src tools/workbench/scripts` from the repo root, reduce each output to the sorted list of `source → resolved` pairs with `jq -r '.modules[] | .source as $s | .dependencies[] | "\($s) → \(.resolved)"' | sort`, and `diff` the two lists, which must print nothing; workbench check, board check, suite.

10. (tools/workbench) Stop forwarding the vocabulary through the board model (R3).
   Files: `tools/workbench/site/src/lib/board.ts`, `tools/workbench/tests/board.spec.ts`
   Change: delete `board.ts:40-41` (the comment and `export { REASON_TAB, TYPE_COLOR } from './vocabulary.ts';`). `board.spec.ts` imports `import { REASON_TAB, TYPE_COLOR } from '@site/lib/vocabulary.ts';` at the top (the module has no state and no node import, so it needs no reload after `vi.stubEnv`) and reads `TYPE_COLOR` and `REASON_TAB` directly instead of `loaded.board.TYPE_COLOR` (`:106-107`) and `loaded.board.REASON_TAB` (`:146`).
   Check: `rg -n "export \{.*\} from|export \*" tools/workbench/site tools/workbench/scripts` prints nothing; suite.

11. (tools/workbench) Drop the exports nothing outside their module imports.
   Files: `tools/workbench/scripts/{workerGitGuard,cleanup,statusGuard,frontmatter,deps,interfaces,changedFiles}.ts`, `tools/workbench/site/src/app/useWrite.ts`, `tools/workbench/site/src/app/useBoard.ts`, `tools/workbench/site/src/scripts/tech.ts`, `tools/workbench/site/src/actions/index.ts`, `tools/workbench/site/src/lib/devPlugin.ts`, `tools/workbench/site/src/lib/writeBack.ts`, `tools/workbench/site/src/lib/board.ts`
   Change: remove the `export` keyword, nothing else, from: `workerGitGuard.ts` `isGitWrite`; `cleanup.ts` `CleanupItem`, `FolderChanges`, `Deletions`; `statusGuard.ts` `hookInputSchema`, `HookInput`; `frontmatter.ts` `ITEM_TYPES`, `sectionTokens`, `DECISION_KIND`, `Question`, `TechPaths`, `TechEntry`, `PAST_READY`; `deps.ts` `Cruise`, `DepsGraph`, `Layer`, `Violation`, `Boundary`, `BOUNDARY_RULES`, `ComponentGraph`, `boundaryOf`, `boundaryLine`, `CRUISE_ARGS`; `interfaces.ts` `InterfaceFiles`, `ChangedInterfaceFile`, `ChangedInterfaceFiles`; `changedFiles.ts` `FileStatus`, `GitChanges`; `useWrite.ts` `WriteName`, `WriteInput`; `useBoard.ts` `boardQueryOptions`; `tech.ts` `SectionControl`; `actions/index.ts` `Change`, `FolderChange`; `devPlugin.ts` `QuestionJson`, `questionsJson`, `changedPath`; `writeBack.ts` `quote`; `board.ts` `escapeHtml`, `stripSections`, `LIFTED`, `Deps`, `readDeps`, `ItemView`, `findingsOf`, `modulesActualHtml`, `componentsActualHtml`, `filesPlannedHtml`, `filesActualHtml`, `interfacesActualHtml`. `frontmatter.ts` `CheckHeading` stays exported and gains its reader: `statusGuard.ts:115` `heading: typeof PLAN_CHECKS | typeof DECISIONS` → `heading: CheckHeading` (`import { …, type CheckHeading } from './frontmatter.ts'`). Exports only specs read stay (`decideWorker`, `MESSAGE`, `selectDeletions`, `AREAS`, `checkDecisions`, `DepsInput`, `layerOf`, `toDepsGraph`, `toComponentGraph`, `cruiseRoots`, `changedInterfaceFiles`, `extractInterfaces`, `renderInterfaces`, `parseChanges`, `serverModulePath`, `readItem`, `needsYou`). Re-check each name first with `rg -nw <Name> tools/workbench/scripts tools/workbench/site tools/workbench/tests`: a name read outside its module keeps its `export`.
   Check: the `rg -nw` above prints only the declaring module for each listed name, apart from the same word inside a string or comment (`'Boundary check'`); workbench check; suite.

## Open items

- `packages/ui`: R4 and R8 (the `@/` alias, no `../`) do not apply — the kit ships raw source and imports itself by relative path (`packages/ui/CLAUDE.md` § Rules, recorded in the TDR's Context). R1, R3 and R5 already hold there: no `index.*`, no `export … from`. The Radix re-bindings (`export const DialogRoot = DialogPrimitive.Root;`, same in `Select.tsx`, `Popover.tsx`, `DropdownMenu.tsx`) declare a kit component under the kit's own name and are not forwarding statements.
- `packages/engine`: R4 and R8 do not apply (relative imports inside packages, `packages/engine/CLAUDE.md`); R1–R3 and R5 already hold — the package exports `"./*": "./src/*"`, has no `index.*` and no `export … from`. Items 6–7 carry the root rule "Delete dead code" (`CLAUDE.md` §2) for the engine, as item 5 does for the kit.
- `tools/docs`: R1–R3 and R5 already hold (no `index.*`, no `export … from`); R4 and R8 have no subject (the package has no path alias and imports its own modules by relative path). Item 8 carries the root rule "Delete dead code" (`CLAUDE.md` §2) for the tool; this plan's TDR does not govern `tools/docs`.
- R6 (job directory entrypoints) and R7 (file-path routing adapters) do not apply: `apps/web` has no job containers and routes through React Router declared in code, not through file-path routing.
- `index.tsx` entry modules for directories rendered as a unit are introduced by the component-declaration-shape plan (R6 there); each declares its entry component and re-exports nothing, which is what R1/R5 here require.
- `tools/workbench`: R1–R3 hold after items 10–11; `site/src/actions/index.ts` is the actions entry Astro requires by that name and declares the actions itself. R4 and R8 bind it through `@scripts/` and `@site/` (item 9); `scripts/` imports only same-folder modules because Node runs the scripts and hooks directly, and `site/astro.config.mjs` and `site/src/lib/devPlugin.ts` keep relative specifiers because they load before Astro has read its aliases. The hook entry files keep their paths.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
