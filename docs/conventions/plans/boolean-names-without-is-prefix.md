---
id: boolean-names-without-is-prefix
tdr_reference: tdr/boolean-names-without-is-prefix.md
depends_on: [behavioural-constants-hoisted-upper-snake]
generated: 2026-10-23
---

# Booleans are named for the state, not with an interrogative prefix

Read `tdr/boolean-names-without-is-prefix.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`behavioural-constants-hoisted-upper-snake`](behavioural-constants-hoisted-upper-snake.md) — its engine items reorder and rename the declarations in `effortDetection.ts`, `gps.ts` and `energy.ts` that items 8–9 rename next; running it first keeps each engine edit on settled text.

## Changes

Every item's Check includes `vp run check` clean and `vp run test` green; renames are mechanical and TypeScript reports every missed reference. Line numbers are today's; if another plan has moved a symbol, rename it where it now lives.

1. Rename local boolean constants and the one prefixed `useState` (R3, R4).
   Files: `apps/web/src/features/settings/DeleteAllDataDialog.tsx:33,35`, `apps/web/src/features/settings/ThresholdEditDialog.tsx:48,49`, `apps/web/src/features/labs/WorkoutCard.tsx:14`, `apps/web/src/features/settings/ThresholdSparkline.tsx:29`, `apps/web/src/features/studio/markers/StudioTrackPickPopup.tsx:28`, `apps/web/src/features/studio/markers/StudioMarkerDialog.tsx:39,40`, `apps/web/src/features/studio/markers/MarkerRow.tsx:18`, `apps/web/src/features/studio/markers/StudioMarkerPins.tsx:33`, `apps/web/src/features/intervals/hooks/useIntervalsSync.ts:14`, `apps/web/src/features/intervals/IntervalsConnectionForm.tsx:42`, `apps/web/src/features/dashboard/DashboardZoomReset.tsx:6`, `apps/web/src/features/map/DeckGLOverlay.tsx:217`, `apps/web/src/features/intervals/runIntervalsSync.ts:50`, `apps/web/src/features/dashboard/LoadChart.tsx:114,166`, `apps/web/src/features/dashboard/VolumeChart.tsx:89`, `apps/web/src/features/sessions/session/LapStrip.tsx:102`, `apps/web/src/features/sessions/session/NoGpsBanner.tsx:11`, `apps/web/src/features/sessions/session/ColorByControl.tsx:113`, `apps/web/src/features/sessions/session/LapsControl.tsx:108,148`, `apps/web/src/features/sessions/session/SessionActionsMenu.tsx:15`, `apps/web/src/features/sessions/session/hooks/useSessionColorModes.ts:14`, `apps/web/src/features/sessions/session/hooks/useSessionWeather.ts:16`, `apps/web/src/features/sessions/hooks/useSessionReprocessingActive.ts:7`, `apps/web/src/features/sessions/charts/SessionChartsExplorer.tsx:106`, `apps/web/src/lib/laps.ts:39`, `apps/web/src/lib/lapSummary.ts:45`, `apps/web/src/lib/hooks/useChartZoom.ts:99`, `apps/web/src/components/charts/LapBands.tsx:39,40`.
   Change: `const [isDeleting, setIsDeleting]` → `const [deleting, setDeleting]`; `hasProfile` → `profilePresent`; `canSave` → `saveEnabled`; `isPace` → `paceField`; `isRest` → `restDay`; `hasHistory` → `historyPresent`; `hasSplits` → `splitsPresent`; `isEdit` → `editing`; `isPoi` → `poiMarker`; `isZoomed` → `zoomed`; `isDimmed` → `dimmed`; `isFullListing` → `fullListing`; `isGroupingDisabled` → `groupingDisabled`; `hasData` → `dataPresent`; `isPartial` → `partial`; `hasGps` → `gpsRecorded`; `hasSelectedLap` → `lapSelected`; `isDeviceSource` → `deviceSource`; `hasDeviceLaps` → `deviceLapsPresent`; `hasTrips` → `tripsPresent`; `isWeatherLoading` → `weatherLoading` (its right-hand side `weather.isLoading` is a TanStack Query field and keeps its name, R6); `hasOutdatedSessions` (the selector result) → `outdatedSessionsPresent`; `isRunning` → `running`; `isIntervalSession` → `intervalSession`; `isIntervals` → `intervalWorkout`; `isHovered`/`isSelected` → `hovered`/`selected`. Rename every use in the same scope.
   Check: `rg -nP '\b(?:const|let) (?:is|has|should|can|will|did)[A-Z]\w*\s*=\s*[^(=<]' apps/web/src` → no hit; `rg -nP 'const \[(?:is|has|should|can)[A-Z]\w*\s*,' apps/web/src` → no hit.

2. Give boolean-returning functions the `is`/`has` prefix (R5).
   Files: `apps/web/src/store/sessions.ts:61,67`, `apps/web/src/lib/guardedSessionsStorage.ts:51,59`, `apps/web/src/lib/moreStats.ts:187,198`, `apps/web/src/lib/mapCamera.ts:54,123,162` and its callers `apps/web/src/features/map/hooks/useMapCameraEffect.ts`, `apps/web/tests/lib/mapCamera.spec.ts`, `apps/web/src/features/map/hooks/useMapCameraEffect.ts:129`, `apps/web/src/features/map/terrainCamera.ts:130,317`, `apps/web/src/features/map/terrainLine.ts:61,64`, `apps/web/src/lib/savedFilters.ts:92`, `apps/web/src/lib/raceTime.ts:11` and its callers `apps/web/src/features/labs/RacePredictor.tsx`, `apps/web/src/features/settings/PaceEstimatorDialog.tsx`, `apps/web/src/features/sessions/recomputeTrainingLoad.ts:35`.
   Change: `canPersistSessions` → `isSessionsWriteAllowed`; the guard field `canWrite: () => boolean` → `isWriteAllowed`; `topicPresent` → `hasTopic`; `sameSubject` → `isSameSubject`; `refitHandledBy` → `isRefitHandledBy`; `mapCameraFitBlocked` → `isMapCameraFitBlocked`; `matchesName` → `hasMatchingName`; `usesLongFormat` → `isLongFormat`; `scoresFromPower` → `isPowerScored`; in the 3D map code `keepsZoomLimit` (`useMapCameraEffect.ts:129`, call `:352`) → `isZoomLimitKept`, `terrainLoaded` (`terrainCamera.ts:130`, call `:155`) → `isTerrainLoaded`, `converged` (`terrainCamera.ts:317`, call `:346`) → `isConverged`, `sameColor` (`terrainLine.ts:61`, call `:77`) → `isSameColor`, `startsRun` (`terrainLine.ts:64`, call `:97`) → `isRunStart`.
   Check: `rg -nP '\bconst (?!is[A-Z]|has[A-Z]|use[A-Z])[a-zA-Z_$]\w*\s*=\s*(?:<[^>]*>\s*)?\([^)]*\)\s*:\s*(?:boolean\b(?!\[)|\w+ is [A-Z])' apps/web/src` → only `getSnapshot` (`apps/web/src/lib/hooks/useHydrated.ts:27`, the `useSyncExternalStore` callback name, R6) and `applyCameraOnlyFit` (`apps/web/src/features/map/hooks/useMapCameraEffect.ts:180`, see Open items); `rg -nw "keepsZoomLimit|terrainLoaded|converged|sameColor|startsRun" apps/web/src` → nothing; `rg -n "canWrite|canPersistSessions" apps/web` → nothing.

3. Rename prefixed fields of app-local interfaces, options and hook results (R1).
   Files: `apps/web/src/lib/chartData.ts:48,69,83,87` and `apps/web/src/features/sessions/charts/SessionChartsExplorer.tsx:144-145`, `apps/web/tests/lib/chartData.spec.ts`, `apps/web/tests/lib/chartData.integration.test.ts`; `apps/web/src/lib/lapSummary.ts:11,47,55`, `apps/web/tests/lib/lapSummary.spec.ts`; `apps/web/src/lib/colorModes.ts:54,58`; `apps/web/src/features/labs/hooks/useCoachPlan.ts:17,39,48,59,68`, `apps/web/src/pages/LabsPage.tsx:57`; `apps/web/src/lib/hooks/useChartZoom.ts:15,101,109`, `apps/web/src/lib/hooks/useSyncedChartZoom.ts:14`, `apps/web/src/features/studio/charts/RouteChartsExplorer.tsx:172`, `apps/web/src/features/sessions/charts/SessionChartsExplorer.tsx:590`, `apps/web/src/features/dashboard/DashboardZoomReset.tsx:9`, `apps/web/tests/lib/hooks/useChartZoom.integration.test.ts`; `apps/web/src/features/labs/WorkoutCard.tsx:9,22`, `apps/web/src/features/labs/WeeklyPlanTimeline.tsx:29`; `apps/web/src/features/studio/charts/RouteChartsExplorer.tsx:28,100,135` and `apps/web/src/features/sessions/charts/SessionChartsExplorer.tsx:60,365-560` with their readers; `apps/web/src/features/demo/demoRecords.ts:130,263`, `apps/web/src/features/demo/buildDemoDataset.ts:259`; `apps/web/src/features/sessions/session/LapStrip.tsx:67`; `apps/web/src/components/charts/LapBands.tsx:20-27,75-78,123`; `apps/web/src/features/sessions/session/hooks/useSessionExport.ts:37`, `apps/web/src/features/sessions/session/hooks/useEditInStudio.ts:44`, `apps/web/src/features/sessions/session/SessionActionsMenu.tsx`; `apps/web/src/lib/dynamicLaps.ts:55`; `apps/web/src/features/sessions/charts/SessionChartsExplorer.tsx:84`.
   Change: options field `isRunning` → `running`; `LapSummary.isIntervals` → `intervalWorkout`; `zoneStatus` parameter `hasData` → `dataPresent`; `hasThresholdPace` → `thresholdPaceSet`; `UseChartZoomReturn.isZoomed` and the `useSyncedChartZoom` result `isZoomed` → `zoomed` — the `ZoomResetPill` prop from `packages/ui` keeps its name for now, so callers pass `isZoomed={zoom.zoomed}`; `WorkoutCard` prop `isExpanded` → `expanded`; chart spec field `hasData` → `dataPresent`; demo input `hasHr` → `hrRecorded`; `hasPartial` → `partialPresent`; `LapBands` props and `stripFill` input `isActive`, `isAlternate`, `isHovered`, `isSelected` → `active`, `alternate`, `hovered`, `selected`; hook results `canExport` → `exportable`, `canEdit` → `editable`; parameters `isPartial` (`closeLap`) → `partial`, `isRunning` (`railCadence`) → `running`.
   Check: `rg -nP '^\s*(?:readonly )?(?:is|has|should|can|will|did)[A-Z]\w*\??\s*:\s*boolean' apps/web/src` → only the persisted `isTaper` at `apps/web/src/types/index.ts:73`, which keeps its name (see Open items) (`isKnownX` at `apps/web/src/components/charts/ChartRail.tsx:72` is a function member, `(x) => boolean`, which R5 allows, and the pattern does not match it); `rg -nP '^\s+(?:is|has|can)[A-Z]\w*:\s' apps/web/src/features/sessions/session/hooks apps/web/src/features/studio/charts` → nothing.

4. Rename the lap-analysis fields (R1).
   Files: `apps/web/src/lib/laps.ts:9,10,54,55`, `apps/web/src/lib/dynamicLaps.ts:83,84`, `apps/web/src/lib/effortLaps.ts:87,88`, `apps/web/src/lib/lapSummary.ts`, `apps/web/src/features/sessions/session/LapStrip.tsx`, `apps/web/tests/lib/{lapSummary,effortLaps,lapsAnalysis,dynamicLaps}.spec.ts`, `apps/web/tests/features/demo/buildDemoDataset.spec.ts`.
   Change: `LapAnalysis.isInterval` → `interval`, `LapAnalysis.isPartial` → `partial`, every producer and reader. `LapAnalysis` is computed, never persisted.
   Check: `rg -n "\bisInterval\b|\bisPartial\b" apps/web` → nothing.

5. (packages/ui) Rename `useDevice().isDesktop` to `desktop`, with every reader.
   Files: `packages/ui/src/hooks/useDevice.ts`, `packages/ui/src/components/Dialog.tsx`, `packages/ui/src/components/Toast.tsx`, `packages/ui/src/components/ActionsMenu.tsx`, `packages/ui/src/components/ResponsivePopover.tsx`, `apps/web/src/components/layout/AppLayout.tsx`, `apps/web/src/components/layout/Dock.tsx`, `apps/web/src/features/onboarding/OnboardingFlow.tsx`, `apps/web/src/features/map/MapPickPopup.tsx`, `apps/web/src/features/map/MapControlsBar.tsx`, `apps/web/src/features/map/popupSafeZone.ts`, `tools/workbench/site/src/app/Panel.tsx`, `tools/workbench/site/src/app/ItemPanel.tsx`
   Change: `useDevice.ts:8` `isDesktop:` → `desktop:`; readers `device.isDesktop` → `device.desktop` (`Dialog.tsx:90`, `Toast.tsx:61`, `ActionsMenu.tsx:56`, `ResponsivePopover.tsx:42`, `AppLayout.tsx:80,96`, `Dock.tsx:108`, `OnboardingFlow.tsx:148,151`, `MapPickPopup.tsx:31,36,52`, `MapControlsBar.tsx:21`, `Panel.tsx:28,66`, `ItemPanel.tsx:61`); the parameter `isDesktop` of `popupSafeZone` and `popupCollisionPadding` (`popupSafeZone.ts:11,24,31,40,41`) → `desktop`.
   Check: `rg -n "isDesktop" apps tools packages --glob '!node_modules' --glob '!tools/workbench/backlog/**'` prints nothing; `vp run check` and `vp run test` pass; `vp run e2e` passes.

6. (packages/ui) Rename `ZoomResetPill`'s `isZoomed` prop to `zoomed`.
   Files: `packages/ui/src/components/ChartsCard.tsx`, `apps/web/src/features/sessions/charts/SessionChartsExplorer.tsx`, `apps/web/src/features/studio/charts/RouteChartsExplorer.tsx`, `apps/web/src/features/dashboard/DashboardZoomReset.tsx`
   Change: `ChartsCard.tsx:22-23` `isZoomed: boolean` / `props.isZoomed` → `zoomed`; call sites `isZoomed={…}` → `zoomed={…}` (`SessionChartsExplorer.tsx:590`, `RouteChartsExplorer.tsx:172`, `DashboardZoomReset.tsx:9`), passing the app value under whatever name it has when this item runs (`zoom.zoomed` once the app item above renamed `UseChartZoomReturn.isZoomed`).
   Check: `rg -n "isZoomed" packages/ui apps/web/src/features/sessions/charts/SessionChartsExplorer.tsx apps/web/src/features/studio/charts/RouteChartsExplorer.tsx apps/web/src/features/dashboard/DashboardZoomReset.tsx` prints nothing; `vp run check` and `vp run test` pass.

7. (packages/ui) Rename the remaining kit booleans.
   Files: `packages/ui/src/components/StatTile.tsx`, `packages/ui/src/hooks/useGrabberDrag.ts`, `packages/ui/src/components/BottomSheet.tsx`, `packages/ui/src/components/Dialog.tsx`
   Change: `StatTile.tsx:77` `const hasChart` → `const chartPresent` (uses at `:106`, `:119`, `:122`); `useGrabberDrag.ts:14` `wasDragged` (a function that returns a boolean, R5) → `isDragged`, with its callers `BottomSheet.tsx:83` and `Dialog.tsx:102`.
   Check: `rg -n "hasChart|wasDragged" packages/ui/src` prints nothing; `vp run check` and `vp run test` pass.

8. (packages/engine) Name the engine's boolean state for what it holds (R1, R4).
   Files: `packages/engine/src/effortDetection.ts`
   Change: `Grid.isBreak` (`:105`) → `breaks` (a `Uint8Array`, 1 where the second belongs to a break), with every read and every parameter that carries it renamed the same way: `buildGrid` (`:154`, `:186`, `:191`), `signalSeries` (`:203`, `:210`), `coverage` (`:220`), `runsOf(isBreak)` → `runsOf(breaks)` (`:228-232`), `smooth`, `buildBins` and `peltSegments` parameters (`:261`, `:327`, `:395`), `movingLength` (`:436`), `postprocess` (`:574`), `passesGuards` (`:630`), `detectEfforts` (`:706`, `:717`). In `buildGrid` the counter `stopped` (`:178`) → `stoppedRun` and the boolean `isStopped` (`:180`) → `stopped`. The per-segment flags `isWork` in `workSegments` (`:584`) and `labelSegments` (`:601`) → `working`.
   Check: `rg -n "\bis(Break|Stopped|Work)\b" packages/engine/src` prints nothing; `vp run check` clean; `vp run test` green.

9. (packages/engine) Give the engine's boolean-returning functions the `is`/`has` prefix (R5).
   Files: `packages/engine/src/gps.ts`, `packages/engine/src/energy.ts`, `packages/engine/src/effortDetection.ts`, `apps/web/src/features/map/trackPicking.ts`, `packages/engine/tests/gps.spec.ts`, `packages/engine/tests/gpsPick.spec.ts` (or `gps.pick.spec.ts`)
   Change: `boundsOverlap` (`gps.ts:134`) → `hasBoundsOverlap`, with `apps/web/src/features/map/trackPicking.ts:1,29` and its spec describe; `segmentIntersectsBounds` (`gps.ts:165`) → `isSegmentIntersectingBounds`, with `trackPicking.ts:1,34` and its spec; `coveredByRecords` (`energy.ts:58`) → `isCoveredByRecords` (`:126`); `grows` (`effortDetection.ts:585`) → `isContiguous` (`:590`, `:595`); `passesGuards` (`:618`) → `isDetectionPlausible` (`:711`).
   Check: `rg -n "\b(boundsOverlap|segmentIntersectsBounds|coveredByRecords|grows|passesGuards)\b" apps packages --glob '!node_modules'` prints nothing; `vp run check` clean; `vp run test` green.

10. (packages/testing) Name the terrain loop's flag for its state (R4).
   Files: `packages/testing/src/records.ts`
   Change: in `generateTerrainSegments`, `const isLast = s === segmentCount - 1;` (`records.ts:38`) becomes `const lastSegment = s === segmentCount - 1;` and its one read `if (isLast)` (`:41`) becomes `if (lastSegment)`. This plan runs before test-data-from-mock-factories moves the function into `series.ts`.
   Check: `rg -n "\bisLast\b" packages/testing/src` prints nothing; `vp check` from `packages/testing/` is clean; `vp run test` passes with the same counts.

11. (tools/docs) Give the capture's box predicate the `is` prefix (R5).
   Files: `tools/docs/banner/capture.ts`
   Change: `const contains = (outer: Clip, inner: Clip) =>` (`:319`) returns a boolean, so it becomes `const isWithin = (outer: Clip, inner: Clip) =>` with the body unchanged; its one call `if (!contains(frame2Clip, pickBox))` (`:363`) becomes `if (!isWithin(frame2Clip, pickBox))`. The other booleans of the tool already follow R1–R5 (`fill`, `resting`, `isOverTrack`, `isBannerLocale`); `isMobile`, `hasTouch`, `fullyParallel` and `reuseExistingServer` are Playwright option names (R6) and stay.
   Check: `rg -n "\bcontains\(" tools/docs/banner` prints nothing; `vp check` from `tools/docs/` is clean.

### tools/workbench

Line numbers are today's; where an earlier plan already edited a module, find the line by its text. Every name below is local to `tools/workbench` and stored nowhere (the board model is rebuilt on every `board.read`), so no rename touches a file format.

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

12. (tools/workbench) Name the workbench's boolean values for their state and its boolean helpers with `is` (R1, R3, R4, R5).
   Files: `tools/workbench/scripts/{statusGuard,workerGitGuard,changedFiles,cleanup,check,frontmatter,deps}.ts`, `tools/workbench/site/src/lib/board.ts`, `tools/workbench/site/src/actions/index.ts`, `tools/workbench/site/src/app/{Board,ItemPanel,PlanPane,ReviewPane,Columns}.tsx`, `tools/workbench/tests/site/src/actions/index.writes.spec.ts` (`tools/workbench/tests/board.spec.ts` if the mirrored-spec plan has not run)
   Change:
   - Locals (R4): `statusGuard.ts:250` `isAnd` → `doubleAmpersand`; `workerGitGuard.ts:28` `isSubagent` → `subagent`; `changedFiles.ts:46` `isPlanned` → `coveredByPlan`; `cleanup.ts:124` `none` → `nothingToReport`; `check.ts:57` `found` → `headingFound`; `board.ts:485` `const folder = path.endsWith('/')` (a boolean named like a path) → `trailingSlash`; `ItemPanel.tsx:32` `open` → `questionsOpen`.
   - Parameters and fields (R1): `checkPlan`'s `hasTech` (`frontmatter.ts:317`, used at `:345`), `movesOf`'s `hasTech` (`board.ts:280`) and the local `hasTech` in `planEdit` (`actions/index.ts:118`) → `techPresent`; the `ItemView` field `has: Record<'mockup' | 'plan' | 'tech' | 'review', boolean>` (`board.ts:183`, built at `:265-270`) → `present`, with its readers `Board.tsx:32-33` (`item.has[…]`), `ItemPanel.tsx:132-133,144,158,169` and the spec's `.has` reads.
   - State (R3): `PlanPane.tsx:32` `[showAnswered, setShowAnswered]` → `[answeredShown, setAnsweredShown]`; `ReviewPane.tsx:79` `[showSuperseded, setShowSuperseded]` → `[supersededShown, setSupersededShown]`.
   - Functions that return a boolean (R5): `deps.ts:122` `covers` → `isCovering`, `deps.ts:128` `inFocus` → `isInFocus`, `changedFiles.ts:27` `covers` → `isCoveredBy`, `Columns.tsx:110` `accepts` → `isMoveTarget`, each at every call.
   Check: `rg -nw "isAnd|isSubagent|isPlanned|hasTech|showAnswered|showSuperseded|inFocus" tools/workbench/scripts tools/workbench/site tools/workbench/tests` and `rg -n "\b(covers|accepts)\(" tools/workbench/scripts tools/workbench/site` print nothing; `rg -n "\.has\[|\.has\." tools/workbench/site/src/app` prints nothing; workbench check; board check; suite.

## Open items

- `packages/testing`: `hasTerrain` (`records.ts:114`) is not renamed: it is always true where it is read and test-data-from-mock-factories item 16 deletes it. The `isPlanned` and `hasDetailedRecords` defaults of the session factory are persisted `TrainingSession` fields and keep their names (see below).

- `packages/ui`: `ListItemHeader`'s local `isPrimary` (`packages/ui/src/components/ListItemHeader.tsx:15`) is removed by the exhaustive-record-maps plan (per-variant maps), not renamed here. `Popover.tsx:9` `isFocusElsewhere` is a boolean-returning function and keeps its prefix (R5).
- Persisted boolean fields are out of scope and keep their names (owner decision, scope exclusion in the TDR §1): `PrescribedWorkout.isTaper` (`apps/web/src/types/index.ts:73`, cached in `store-coach-plan`) and `TrainingSession.isPlanned`, `hasDetailedRecords`, `isNew` (`packages/engine/src/types.ts:57,58,62,66`, stored in `store-sessions`). No item here touches them or their stores' `version`/`migrate`.
- `packages/ui` members (`useDevice().isDesktop`, `ZoomResetPill`'s `isZoomed` prop) are renamed by the `(packages/ui)` items above, together with their app and tool readers.
- Engine-internal predicates and local flags are renamed by items 8–9. `isValidCoordinate`, `isMovingPair`, `isSessionOutdated` and `isShortNonWork` already carry the prefix (R5); `includeGhosts`, `endsAtMissingElevation`, `hole`, `falling` and `crosses` already name a state.
- `applyCameraOnlyFit` (`apps/web/src/features/map/hooks/useMapCameraEffect.ts:180`) runs a camera move and returns whether it handled the fit; it is a command with a boolean result, not a predicate, so item 2 leaves it (owner to confirm). The 3D map code's other booleans already name a state (`deckShown`, `terrainMounted`, `terrainTrackHovered`, `lapSelected`, `settled`, `moved`) or carry the prefix (`isColorList`, `hasOrbitModifier`).
- R2 (zod boolean fields) and R7 (`not*` flags): no violations in `apps/web/src` today; nothing to change.
- TanStack Query result fields (`isLoading`, `isFetching`, …) keep their names wherever they are forwarded (R6).
- `tools/workbench`: `QuestionView.open`, `CheckItem.checked` and `superseded`, `ItemView.reviewDoc` and the `Column` flags already name their state; nothing there is persisted, so R1's persisted-member exception has no subject.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
