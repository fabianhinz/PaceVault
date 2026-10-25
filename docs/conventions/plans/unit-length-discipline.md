---
id: unit-length-discipline
tdr_reference: tdr/unit-length-discipline.md
depends_on: [signature-parameter-shape, variant-unions-with-default-resolvers, native-date-and-duration-constants, zod-schema-naming-and-inference, styled-api-over-sx, cross-boundary-contracts-in-shared, effects-are-rare, hooks-return-the-fitting-shape, floating-promises-marked-void, library-type-narrowing]
generated: 2026-10-23
---

# Units grow wide, not deep

Read `tdr/unit-length-discipline.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`signature-parameter-shape`](signature-parameter-shape.md) — the last plan that reshapes engine signatures; items 21–31 extract steps with the object parameters it introduced, so each new helper is written once in its final shape. Through helpers-group-by-topic and names-spell-out-their-meaning it also follows every chained plan with `tools/docs` items (index-modules, comments, behavioural-constants, boolean-names, exhaustive-record-maps), so items 37–38 move the capture and the banner page under their final names.
- [`variant-unions-with-default-resolvers`](variant-unions-with-default-resolvers.md) — names `ShotFit` on the banner page (and, through its own prerequisites, follows component-declaration-shape, which gives every page component its `FC<XProps>` shape), so item 38 moves finished declarations.
- [`native-date-and-duration-constants`](native-date-and-duration-constants.md) — names the capture's waits (`UI_READY_TIMEOUT_MS`, …) that item 37 distributes over the new modules.
- [`zod-schema-naming-and-inference`](zod-schema-naming-and-inference.md) — binds `messagesSchema`, which item 37 moves into `messages.ts`.
- [`styled-api-over-sx`](styled-api-over-sx.md) — moves `FitText`'s zoom into its class list before item 38 moves `FitText`.
- [`cross-boundary-contracts-in-shared`](cross-boundary-contracts-in-shared.md) — moves the workbench artefact schemas into their contract, so items 41–42 split units over their final types.
- [`effects-are-rare`](effects-are-rare.md) — takes the workbench effects out of `TechPane`, `MockupPane` and `WriteCard` before item 40 counts their statements.
- [`hooks-return-the-fitting-shape`](hooks-return-the-fitting-shape.md) — annotates the workbench hooks, so the hooks item 40 adds sit beside annotated ones.
- [`floating-promises-marked-void`](floating-promises-marked-void.md) — marks the workbench promises in code items 39–42 move.
- [`library-type-narrowing`](library-type-narrowing.md) — types the two `Empty` components that item 39 merges into `EmptyNote`.

## Changes

`apps/web/src` has 46 units over the bar (more than 12 top-level statements, or nesting deeper than 3 — deeper than 2 in a component) and 29 modules that declare more than one component. Items 1–6 split non-component units (covered by unit tests, lowest risk), items 7–13 split the multi-component modules (mechanical moves), items 14–19 extract hooks from components.

How to work every item:

- **Shape check.** Save this script outside the repo (for example as `unit-shape.cjs` in your scratch directory) and run it from `apps/web` with `vp -C apps/web exec node <path>/unit-shape.cjs $(cd apps/web && find src -name '*.ts' -o -name '*.tsx' | grep -v '\.d\.ts$')`. It prints one line per unit over the bar and one line per module with more than one component; today it prints 75 lines, at the end of this plan none.

  ```js
  const ts = require(require.resolve('typescript', { paths: [process.cwd()] }));
  const fs = require('fs');
  const K = ts.SyntaxKind;
  const CTRL = new Set([K.IfStatement, K.ForStatement, K.ForOfStatement, K.ForInStatement, K.WhileStatement, K.DoStatement, K.TryStatement, K.SwitchStatement]);
  const isFn = (n) => ts.isFunctionDeclaration(n) || ts.isMethodDeclaration(n) || ts.isArrowFunction(n) || ts.isFunctionExpression(n);
  const nameOf = (n) => {
    if (n.name && ts.isIdentifier(n.name)) return n.name.text;
    const p = n.parent;
    if (p && ts.isVariableDeclaration(p) && ts.isIdentifier(p.name)) return p.name.text;
    if (p && ts.isPropertyAssignment(p)) return p.name.getText();
    return '<callback>';
  };
  const depthOf = (body) => {
    let max = 0;
    const walk = (n, d) => {
      if (isFn(n)) return;
      let nd = d;
      if (CTRL.has(n.kind)) {
        const elseIf = ts.isIfStatement(n) && ts.isIfStatement(n.parent) && n.parent.elseStatement === n;
        if (!elseIf) nd = d + 1;
        max = Math.max(max, nd);
      }
      ts.forEachChild(n, (c) => walk(c, nd));
    };
    ts.forEachChild(body, (c) => walk(c, 0));
    return max;
  };
  for (const f of process.argv.slice(2)) {
    const tsx = f.endsWith('.tsx');
    const sf = ts.createSourceFile(f, fs.readFileSync(f, 'utf8'), ts.ScriptTarget.Latest, true, tsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const at = (n) => `${f}:${sf.getLineAndCharacterOfPosition(n.getStart()).line + 1}`;
    const visit = (n) => {
      if (isFn(n) && n.body && ts.isBlock(n.body)) {
        const name = nameOf(n);
        const component = tsx && /^[A-Z]/.test(name);
        const statements = n.body.statements.length;
        const depth = depthOf(n.body);
        if (statements > 12 || depth > (component ? 2 : 3)) console.log(`${at(n)} ${name} statements=${statements} depth=${depth}`);
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
    if (tsx) {
      const comps = [];
      for (const s of sf.statements) {
        if (!ts.isVariableStatement(s)) continue;
        for (const d of s.declarationList.declarations) {
          const i = d.initializer;
          if (ts.isIdentifier(d.name) && /^[A-Z][a-z]/.test(d.name.text) && i && (ts.isArrowFunction(i) || ts.isFunctionExpression(i))) comps.push(d.name.text);
        }
      }
      if (comps.length > 1) console.log(`${f} components=${comps.join(',')}`);
    }
  }
  ```

- **Item check.** An item is done when the shape check no longer lists any unit or module the item names, `vp run -F @pacevault/i18n compile && vp check` finishes with no error ("clean `vp check`"), and `vp run test` passes. Items that touch components also need `vp run e2e` and before/after screenshots (desktop and 390 px, `vp run workbench:capture`) that show no visual change.
- **Where pieces land.** Extracted component statements become a hook in the `hooks/` directory of the feature (R4); extracted markup becomes its own component module in the same directory, named after the component, exported, declared in the shape the module had (R5, strict one component per module); extracted non-component steps become module-local functions in the same topic module, or go to the named topic module (R6). A constant, type or helper that more than one of the new modules reads goes to that directory's `types.ts` (types and `as const` tables) or to the topic module named in the item. Existing names are kept; nothing is renamed unless the item says so.
- **Comments.** Moved code carries no comments. A comment that holds information (for example `// TODO: handle .tcx files once a TCX parser is added` in `features/sessions/hooks/useFileUpload.ts`, the `/** … */` doc lines in `features/onboarding/OnboardingStep.tsx:39` and `features/settings/PaceEstimateButton.tsx:4`) is listed for the owner in the review instead of being carried over or silently dropped.
- **Width is not a trigger.** Wide statements stay whole: the `charts` array in `SessionChartsExplorer.tsx:358-583` and `RouteChartsExplorer.tsx:93-165`, markup returns, literal tables. Do not split them to shorten a file.

### Non-component units

1. Pure lib helpers.
   Files: `apps/web/src/lib/chartTheme.ts`, `apps/web/src/lib/profileHistory.ts`, `apps/web/src/lib/groupSteps.ts`, `apps/web/src/lib/records.ts`, `apps/web/src/lib/railRange.ts`, `apps/web/src/lib/dynamicLaps.ts` (or `apps/web/src/lib/laps.ts` after the helpers-group-by-topic merge), `apps/web/src/lib/chartBuckets.ts` (or `apps/web/src/lib/chartData.ts` after the merge), `apps/web/src/lib/weather.ts`
   Change: All new functions are module-local in the same module.
   - `niceAxis` (`chartTheme.ts:26`, 14 statements): extract `paddedRange(present): { low: number; high: number }` (lines 32-39) and `axisTicks(start, end, step): number[]` (43-46).
   - `sparklinePath` (`profileHistory.ts:74`, 15): extract `valueRange(values): { low: number; high: number }` (87-94) and `sparklineLine(points, xOf, yOf, right): string` (97-101).
   - `groupSteps` (`groupSteps.ts:7`, depth 4): extract `collectRepeatGroup(steps, start, repeat): { group: WorkoutStep[]; next: number }` (the inner `while`, 16-22), so the outer loop holds one `if/else`.
   - `extractFastestDistances` (`records.ts:83`, depth 4): extract `fastestTimeFor(withDistance, meters): number | undefined` (the two-pointer scan, 94-111); the outer loop becomes `for (const target of targets) { const time = fastestTimeFor(…); if (time !== undefined) results.set(…); }`.
   - `computeRangeStats` (`railRange.ts:79`, 17): extract `recordsInRange(records, range, allMoving)` returning `{ inRange, gradients, moving, firstIndex, lastIndex }` (84-100) and `rangeClimb(records, firstIndex, lastIndex)` returning `{ vam, avgGrade }` (102-108).
   - `computeDynamicLaps` (`dynamicLaps.ts:36`, 17) and its inner `closeLap` (`:55`, 18): lift `closeLap` to a module-level `lapFromSlice(records, moving, indices, lapIndex): { analysis: LapAnalysis; span: LapSpan } | undefined` (56-85) and extract `distanceIndices(records): number[]` (40-43); `computeDynamicLaps` pushes the returned pair.
   - `bucketSeries` (`chartBuckets.ts:46`, 23): extract `channelValues(rows, options)` (50-69, returns `{ values, channelSpacing }`), `rowsInRange(rows, allXs, options)` (70-77, returns `{ indices, xs }`), `bucketLayout(xs, targetRows, channelSpacing)` (79-93, returns `{ first, width, count }`), `fillBuckets(…)` (95-125) and `bucketRows(…)` (127-142).
   - `fetchSessionWeather` (`weather.ts:350`, 13): extract `snapshotAt(waypoint, data): WeatherSnapshot | undefined` (the per-waypoint body, 380-420) and `snapshotsFromClusters(clusters, clusterResults, waypoints): WeatherSnapshot[]` (370-422).
   Check: item check; the shape check lists none of these eight files.

2. Filter text parser.
   Files: `apps/web/src/lib/filterGrammar.ts`
   Change: `parse` (`:360`, 21 statements, depth 5) holds its state in seven locals and closures and dispatches every token kind inline in one 130-line loop (403-536). Collect the state in one module-local `interface ParseState { fixed; ambiguous; months; years; names; currentYear; currentMonth }` built by `createParseState(now)`, turn `setTime`, `setQuantity`, `inferYear`, `isPastYear` (376-401) into module-level functions taking the state, and move each token branch into a module-level reader that returns the index of the last consumed token: `readClock(state, words, i)` (417-428), `readNumber(state, words, i)` (431-462), `readThis(state, words, i)` (475-490), `readRelative(state, words, i)` (493-504), `readSince(state, words, i)` (507-524) and `readWord(state, words, i)` for the month/name/keyword remainder. The loop body becomes a flat sequence of `if (reader matches) { i = reader(…); continue; }`; the month-range tail (538-554) becomes `applyMonthRange(state)` and the combination step (556-564) `combineAmbiguous(state)`.
   Check: item check (`tests/lib/filterGrammar.spec.ts` covers every branch); the shape check does not list `filterGrammar.ts`.

3. FIT parser.
   Files: `apps/web/src/parsers/fit.ts`
   Change: `parseFitFile` (`:113`, 31 statements) gets four module-local steps: `requiredSessionFields(fitSession, fileName)` (139-157, returns `{ sport, sessionDate, sessionDuration }`; keep today's failure behaviour: it throws), `parseRecordsAndLaps(data, fileName)` (159-173, returns `{ records, laps }`), `sessionFingerprint(data, fitSession, derived)` (188-200) and `averagePace(sport, avgSpeed)` (202-205).
   Check: item check (`tests/parsers/` FIT specs pass unchanged); the shape check does not list `fit.ts`.

4. Demo data builders.
   Files: `apps/web/src/features/demo/buildDemoDataset.ts`, `apps/web/src/features/demo/demoRecords.ts`, `apps/web/src/features/demo/loadDemoData.ts`
   Change: All new functions are module-local.
   - `buildSession` (`buildDemoDataset.ts:138`, 16): extract `averageSpeedAndPace(sport, distance, duration)` (158-162) and `withOptionalFields(session, derived, workout, records)` (187-193).
   - `buildDemoDataset` (`buildDemoDataset.ts:204`, 15): extract `indexRoutes(routes)` (209-214, returns `{ routes, cityRoutes }`), `demoProfile(newestDay)` (224-237) and `placeSessions(placed, context)` (239-270, returns `{ sessions, sessionData, gardaIds }`).
   - `routeAt` (`demoRecords.ts:74`, 15): extract `bracketIndex(cumulative, distance): number` (the binary search, 79-88) and `interpolatePoint(a, b, t)` (96-100).
   - `simulateSession` (`demoRecords.ts:223`, 26) and its step callback (`:284`, depth 4): replace the eight mutable locals (233-240) with one `SimulationState` object (`t`, `d`, `v`, `hr`, `smoothedPowerRatio`, `noise`, `eleNoise`, `coasting`, `records`, `stepStarts`) built by `createSimulationState(input)`; lift `updateHr` and `push` (249-274) to module-level functions taking the state; move the step body to `simulateStep(state, step, input)`, its stop handling (297-309) to `simulateStop(state, stop)`, and the two sport branches to `runningSample(state, …)` (322-331) and `cyclingSample(state, …)` (332-349).
   - `loadDemoData` (`loadDemoData.ts:16`, 18): extract `saveDemoSessionData(dataset)` (28-36) and `addDemoTripsAndRoutes(dataset)` (40-54).
   Check: item check (`tests/features/demo/buildDemoDataset.spec.ts` asserts the seeded dataset and must pass unchanged); the shape check lists none of the three files.

5. Session import and lap labels.
   Files: `apps/web/src/features/sessions/createIngestBatcher.ts`, `apps/web/src/features/sessions/hooks/useFileUpload.ts`, `apps/web/src/lib/archive.ts`, `apps/web/src/features/sessions/session/lapLabels.ts`, `apps/web/src/features/sessions/session/LapStrip.tsx` (or `apps/web/src/features/sessions/session/lapStripLayout.ts` after item 11)
   Change:
   - `ingestBatch` (`createIngestBatcher.ts:23`, 14): extract module-local `partitionDuplicates(parsed, existingSessions)` (27-43, returns `{ unique, duplicates }`) and `saveSessionData(withIds)` (55-82, returns `{ savedCount, saveFailed }`).
   - `importFiles` (`useFileUpload.ts:18`, 13 statements, depth 4): move the source collection (23-50) to `export const collectUploadSources = async (files: File[]): Promise<{ sources: UploadSource[]; fitCount: number; failed: number }>` in `apps/web/src/lib/archive.ts` (the upload-archive topic: it already owns `isArchiveFile`, `listActivityEntries`), with the archive branch in a module-local `archiveSource(file)` so no branch nests past two; extract module-local `ingestSources(sources, ingestFit)` (72-81) in `useFileUpload.ts`.
   - `lapsRowLabels` (`lapLabels.ts:69`, 18): extract module-local `pendingRowLabel(source, set)` (the three early returns, 74-90) and `lapsRowSecondary(summary, range)` (110-125).
   - `layoutStrip` (`LapStrip.tsx:70`, 16): extract module-local `maxDeviation(bands, deviationOf)` (85-89) and `layoutBar(band, context)` (the loop body, 94-135).
   Check: item check; `vp run e2e` passes (`e2e/` import specs); the shape check lists none of these units.

6. Intervals sync, coach plan, thresholds form, data reset, filter builder.
   Files: `apps/web/src/features/intervals/runIntervalsSync.ts`, `apps/web/src/features/labs/hooks/useCoachPlan.ts`, `apps/web/src/lib/prescription.ts`, `apps/web/src/features/settings/hooks/useThresholdsForm.ts`, `apps/web/src/features/settings/hooks/useThresholdsFormErrors.ts` (new), `apps/web/src/features/settings/DeleteAllDataDialog.tsx`, `apps/web/src/features/settings/deleteAllData.ts` (new), `apps/web/src/features/filters/hooks/useFilterBuilder.ts`, `apps/web/src/features/filters/hooks/useNotUnderstoodHint.ts` (new)
   Change:
   - `runIntervalsSync` (`runIntervalsSync.ts:40`, 14): extract module-local `selectImportBatch(listed, importedIds)` (58-60) and `importBatch(batch, context)` (the `try` block, 70-103).
   - the plan callback in `useCoachPlan.ts:34` (13): move the fresh-plan computation (51-57) to `export const generateFreshPlan = (sessions, thresholdPace, today)` in `apps/web/src/lib/prescription.ts` (the plan topic, beside `generateWeeklyPlan`).
   - `createProfile` (`useThresholdsForm.ts:206`, 15): extract module-local `thresholdsFromForm(form)` (207-218) and `optionalProfileFields(form)` (224-227).
   - `useThresholdsForm` (`useThresholdsForm.ts:250`, 18): move the error derivation (256-273: `stored`, `errors`, `fields`, `current`, `dirty`, `valid`, `visibleError`) into the new hook `useThresholdsFormErrors(form, profile, mode, revealed)`.
   - `handleDelete` (`DeleteAllDataDialog.tsx:39`, 16): move the ten store resets and `clearAllRecords()` (41-51) into `export const deleteAllData = async (queryClient: QueryClient) => …` in the new topic module `features/settings/deleteAllData.ts`; `handleDelete` keeps `setIsDeleting`, `await deleteAllData(queryClient)`, `onOpenChange`, `toast`, `navigate`.
   - `useFilterBuilder` (`useFilterBuilder.ts:7`, 14): move the not-understood hint (13-19) into the new hook `useNotUnderstoodHint(text, interpretations)`.
   Check: item check (`tests/store/deleteAllData.integration.test.ts` passes); the shape check lists none of these units.

### Modules with more than one component

7. App-bound components and chart components.
   Files: `apps/web/src/components/ErrorFallbacks.tsx` (deleted), `apps/web/src/components/ReportBugButton.tsx`, `apps/web/src/components/FallbackActions.tsx`, `apps/web/src/components/RootErrorFallback.tsx`, `apps/web/src/components/RouteErrorFallback.tsx`, `apps/web/src/components/ImportProgressOverlay.tsx`, `apps/web/src/components/ProgressRing.tsx`, `apps/web/src/components/OverlayContent.tsx`, `apps/web/src/components/useHeldReprocess.ts`, `apps/web/src/components/importProgressCopy.ts`, `apps/web/src/components/MetricLabel.tsx`, `apps/web/src/components/ExplanationBody.tsx`, `apps/web/src/components/charts/ChartRail.tsx` → `apps/web/src/components/charts/SeriesRail.tsx`, `apps/web/src/components/charts/MultiSeriesRail.tsx`, `apps/web/src/components/charts/types.ts`, `apps/web/src/components/charts/LapBands.tsx`, `apps/web/src/components/charts/LapBandShape.tsx`, `apps/web/CLAUDE.md`; importers `apps/web/src/components/layout/AppLayout.tsx`, `apps/web/src/main.tsx`, `apps/web/src/features/dashboard/PerformanceChart.tsx`, `apps/web/src/features/dashboard/LoadChart.tsx`, `apps/web/src/features/dashboard/VolumeChart.tsx`, `apps/web/src/features/studio/charts/RouteChartsExplorer.tsx`, `apps/web/src/features/sessions/charts/SessionChartsExplorer.tsx`
   Change: `ErrorFallbacks.tsx` (`ReportBugButton:13`, `FallbackActions:29`, `RootErrorFallback:39`, `RouteErrorFallback:58`) becomes four modules, each with its props interface; the file is deleted and `AppLayout.tsx`/`main.tsx` import from the two fallback modules. `ImportProgressOverlay.tsx`: `ProgressRing` (`:65`, with `SIZE`, `STROKE`, `RADIUS`, `CIRCUMFERENCE`) and `OverlayContent` (`:115`) move out; the hook `useHeldReprocess` (`:164`) moves to `components/useHeldReprocess.ts` beside its sole consumer; `MIN_OPEN_MS` (read by `OverlayContent` and the hook) and the label builders `phaseLabel`, `foregroundLabel`, `importedTitle`, `summaryTitle`, `importedLine`, `summaryDescription` move to the topic module `components/importProgressCopy.ts`. `MetricLabel.tsx`: `ExplanationBody` (`:23`) moves out. `ChartRail.tsx` exports two components: `SeriesRail` stays in a file renamed `SeriesRail.tsx`, `MultiSeriesRail` (`:76`) moves to `MultiSeriesRail.tsx`, and `RailReading` (`:11`, read by both) moves to `components/charts/types.ts`; the five importers are repointed. `LapBands.tsx`: `LapBandShape` (`:38`, with `STRIP_OFFSET`, `STRIP_HEIGHT`, `StripFillState`, `stripFill`, `LapBandShapeProps`) moves out; `AreaShapeProps` (read by both) moves to `components/charts/types.ts`; `LAP_STRIP_TICK_MARGIN` stays exported from `LapBands.tsx`. In `apps/web/CLAUDE.md:31` replace the parenthesis `` (`MetricLabel`, `ErrorFallbacks`, `ImportProgressOverlay`, `PaceRange`, `ToastHost`) `` with `` (`MetricLabel`, `RootErrorFallback`, `RouteErrorFallback`, `ImportProgressOverlay`, `PaceRange`, `ToastHost`) ``.
   Check: item check including e2e and screenshots; `rg -n "ErrorFallbacks|ChartRail" apps/web` prints nothing; the shape check lists no module under `apps/web/src/components/` except those of item 8.

8. Layout components.
   Files: `apps/web/src/components/layout/AppLayout.tsx`, `apps/web/src/components/layout/RouteContent.tsx`, `apps/web/src/components/layout/MobileSheet.tsx`, `apps/web/src/components/layout/Dock.tsx`, `apps/web/src/components/layout/DockRail.tsx`, `apps/web/src/components/layout/DockBar.tsx`, `apps/web/src/components/layout/useDockList.ts`, `apps/web/src/components/layout/types.ts`, `apps/web/src/components/layout/DockItems.tsx` (deleted), `apps/web/src/components/layout/DockSegment.tsx`, `apps/web/src/components/layout/DockTabs.tsx`, `apps/web/src/components/layout/DockCircle.tsx`, `apps/web/src/components/layout/DockFilterButton.tsx`, `apps/web/src/components/layout/DockLocateButton.tsx`, `apps/web/src/components/layout/dockItemClasses.ts`
   Change: `AppLayout.tsx`: `RouteContent` (`:23`) and `MobileSheet` (`:37`) move out. `Dock.tsx`: `DockRail` (`:48`, with `fadeClass`, `hiddenClass`) and `DockBar` (`:79`) move out; the hook `useDockList` (`:20`) moves to `useDockList.ts` beside its sole consumer; `DockList` (read by `DockRail`, `DockBar`, the hook) moves to `components/layout/types.ts`. `DockItems.tsx` (five components) is deleted: `DockSegment` (`:62`), `DockTabs` (`:71`, with `tabs`, `isTabActive`, `tracks`, `trackClasses`, `DockTabsProps`), `DockCircle` (`:108`), `DockFilterButton` (`:118`, with `DockFilterButtonProps`), `DockLocateButton` (`:140`) each get their module; `DockItemKind` goes to `types.ts`; the class strings read by several of them (`itemClasses`, `itemClass`, `activeItemClass`, `segmentClass`) go to the topic module `dockItemClasses.ts`. `Dock.tsx` imports the dock items from their new modules.
   Check: item check including e2e and screenshots (dock at desktop and 390 px); `rg -n "DockItems" apps/web` prints nothing; the shape check lists nothing under `apps/web/src/components/`.

9. Small feature modules.
   Files: `apps/web/src/features/dashboard/LoadChart.tsx`, `apps/web/src/features/dashboard/LoadBucketBand.tsx`, `apps/web/src/features/dashboard/VolumeChart.tsx`, `apps/web/src/features/dashboard/LegendLine.tsx`, `apps/web/src/features/intervals/IntervalsStatusLine.tsx`, `apps/web/src/features/intervals/ErrorLine.tsx`, `apps/web/src/features/intervals/LoadingLine.tsx`, `apps/web/src/features/labs/WorkoutExpansionPanel.tsx`, `apps/web/src/features/labs/StepRow.tsx`, `apps/web/src/features/map/TrackIntensityControl.tsx`, `apps/web/src/features/map/RampSwatch.tsx`, `apps/web/src/features/studio/StudioToolsTab.tsx`, `apps/web/src/features/studio/MarkerCard.tsx`, `apps/web/src/features/settings/ThresholdEditDialog.tsx`, `apps/web/src/features/settings/ThresholdEditForm.tsx`, `apps/web/src/features/settings/ThresholdsSection.tsx`, `apps/web/src/features/settings/ProfileFields.tsx`, `apps/web/src/features/settings/Divider.tsx`
   Change: Move each module-local component into its own module in the same directory, taking with it the declarations only it reads: `LoadBucketBand` (`LoadChart.tsx:68`, with `BandShapeProps`), `LegendLine` (`VolumeChart.tsx:54`), `ErrorLine` (`IntervalsStatusLine.tsx:19`), `LoadingLine` (`IntervalsStatusLine.tsx:26`), `StepRow` (`WorkoutExpansionPanel.tsx:60`), `RampSwatch` (`TrackIntensityControl.tsx:45`, with `RAMP_BASE`, `RAMP_STOPS`, `RAMP_MAX_PASSES`, `RAMP_SPORTS`, `rampGradient`), `MarkerCard` (`StudioToolsTab.tsx:10`), `ThresholdEditForm` (`ThresholdEditDialog.tsx:35`, with `FIELD_TITLES`), `ProfileFields` (`ThresholdsSection.tsx:26`), `Divider` (`ThresholdsSection.tsx:63`).
   Check: item check including e2e and screenshots of the dashboard, labs, map controls, studio tools and settings; the shape check lists none of the nine original modules.

10. Onboarding.
    Files: `apps/web/src/features/onboarding/OnboardingFlow.tsx` (`features/onboarding/index.tsx` with the component `Onboarding` after component-declaration-shape item 12), `apps/web/src/features/onboarding/DesktopOnboarding.tsx`, `apps/web/src/features/onboarding/PhoneCard.tsx`, `apps/web/src/features/onboarding/ReopenPill.tsx`, `apps/web/src/features/onboarding/PhoneOnboarding.tsx`, `apps/web/src/features/onboarding/OnboardingIntro.tsx`, `apps/web/src/features/onboarding/OnboardingIntroActions.tsx`, `apps/web/src/features/onboarding/OnboardingStep.tsx`, `apps/web/src/features/onboarding/OnboardingHeading.tsx`, `apps/web/src/features/onboarding/SourcePicker.tsx`, `apps/web/src/features/onboarding/FieldInput.tsx`, `apps/web/src/features/onboarding/GenderPick.tsx`, `apps/web/src/features/onboarding/YouFields.tsx`, `apps/web/src/features/onboarding/ThresholdFields.tsx`, `apps/web/src/features/onboarding/ContinueButton.tsx`, `apps/web/src/features/onboarding/BackButton.tsx`, `apps/web/src/features/onboarding/CardBody.tsx`, `apps/web/src/features/onboarding/onboardingScreens.tsx`, `apps/web/src/features/onboarding/onboardingFields.ts`, `apps/web/src/features/onboarding/types.ts`
    Change: `OnboardingFlow.tsx`: `DesktopOnboarding` (`:47`), `PhoneCard` (`:74`), `ReopenPill` (`:91`), `PhoneOnboarding` (`:112`) move out; `ShellProps` (read by three of them) goes to `features/onboarding/types.ts`. `OnboardingIntro.tsx`: the second exported component `OnboardingIntroActions` (`:46`) moves out. `OnboardingStep.tsx` (ten components): `OnboardingHeading` (`:56`), `SourcePicker` (`:116`, with `SourceOption`, `SOURCES`, `pickSource`), `FieldInput` (`:137`), `GenderPick` (`:170`, with `GENDERS`), `YouFields` (`:210`), `ThresholdFields` (`:250`), `ContinueButton` (`:294`), `BackButton` (`:367`), `CardBody` (`:373`) move out; `fieldId` (read by `FieldInput`, `GenderPick` and `continueStep`) goes to `onboardingFields.ts`; the JSX-valued screen table `screenOf` with `Screen`, `YOU_FIELDS`, `THRESHOLD_FIELDS`, `nextStep`, `completeOnboarding`, `continueStep` goes to the lowerCamelCase module `onboardingScreens.tsx`; `OnboardingShell` and `StepProps` go to `types.ts` (if the colocated-types plan already created `types.ts` with `OnboardingShell`, add to it).
    Check: item check including e2e (`e2e/` onboarding specs) and screenshots of every onboarding step at desktop and 390 px; the shape check lists nothing under `features/onboarding/`.

11. Session detail lap and colour controls.
    Files: `apps/web/src/features/sessions/session/ColorByControl.tsx`, `apps/web/src/features/sessions/session/Swatch.tsx`, `apps/web/src/features/sessions/session/LapStrip.tsx`, `apps/web/src/features/sessions/session/LapSwatch.tsx`, `apps/web/src/features/sessions/session/Bars.tsx`, `apps/web/src/features/sessions/session/AvatarFrame.tsx`, `apps/web/src/features/sessions/session/LapStripAvatar.tsx`, `apps/web/src/features/sessions/session/LegendDot.tsx`, `apps/web/src/features/sessions/session/LapStripDetail.tsx`, `apps/web/src/features/sessions/session/lapStripLayout.ts`, `apps/web/src/features/sessions/session/LapsControl.tsx`, `apps/web/src/features/sessions/session/SplitSlider.tsx`, `apps/web/src/features/sessions/session/LapsPicker.tsx`, `apps/web/src/features/sessions/session/StepButton.tsx`, `apps/web/src/features/sessions/session/LapStepper.tsx`, `apps/web/src/features/sessions/session/LapsRow.tsx`, `apps/web/src/features/sessions/session/KeyValue.tsx`, `apps/web/src/features/sessions/session/LapExtreme.tsx`, `apps/web/src/features/sessions/session/LapsDetails.tsx`, `apps/web/src/features/sessions/session/types.ts`
    Change: `ColorByControl.tsx`: `Swatch` (`:81`, with `SPORT_COLOR`, `gradient`, `swatchBackground`) moves out. `LapStrip.tsx` (seven components): `LapSwatch` (`:25`, exported; with `MANY_LAPS`, `cellColor`), `Bars` (`:139`), `AvatarFrame` (`:154`, with `AVATAR_SIZE`), `LapStripAvatar` (`:167`), `LegendDot` (`:189`), `LapStripDetail` (`:199`, with `DETAIL_WIDTH`, `DETAIL_HEIGHT`) move out; `layoutStrip`, `StripBar`, `StripLayout`, `FASTER`, `SLOWER` (read by `Bars`, `LapStripAvatar`, `LapStripDetail`) go to the topic module `lapStripLayout.ts`; `LapsControl.tsx` and `LapsRow.tsx` import `LapSwatch` from its new module. `LapsControl.tsx`: `SplitSlider` (`:61`), `LapsPicker` (`:101`, with `LIMITER_LABELS`, `LapsPickerProps`, `rowClass`), `StepButton` (`:260`), `LapStepper` (`:291`) move out; `LapsControlProps` (extended by `LapsPickerProps`) goes to `features/sessions/session/types.ts`. `LapsRow.tsx`: `KeyValue` (`:34`), `LapExtreme` (`:51`), `LapsDetails` (`:69`, with `bpmFmt`, `recoveryLabel`) move out.
    Check: item check including e2e and screenshots of a session with device laps, splits and efforts; the shape check lists none of the four original modules.

12. Session detail weather and training-effect cards.
    Files: `apps/web/src/features/sessions/session/TrainingEffectCard.tsx`, `apps/web/src/features/sessions/session/TrainingEffectGlyph.tsx`, `apps/web/src/features/sessions/session/TrainingEffectGauge.tsx`, `apps/web/src/features/sessions/session/trainingEffectScale.ts`, `apps/web/src/features/sessions/session/WeatherCard.tsx`, `apps/web/src/features/sessions/session/WindLegend.tsx`, `apps/web/src/features/sessions/session/WeatherDetails.tsx`, `apps/web/src/features/sessions/session/weatherConditions.ts`, `apps/web/src/features/sessions/session/WeatherHourlyTable.tsx`, `apps/web/src/features/sessions/session/PrecipitationDots.tsx`, `apps/web/src/features/sessions/session/WindRose.tsx`, `apps/web/src/features/sessions/session/WindRoseGlyph.tsx`, `apps/web/src/features/sessions/session/Wedges.tsx`
    Change: `TrainingEffectCard.tsx`: `TrainingEffectGlyph` (`:57`) and `TrainingEffectGauge` (`:86`, with `TE_TEXT`) move out; `TE_ZONES`, `TE_FILL`, `fillOf`, `teFmt` (read by several) go to the topic module `trainingEffectScale.ts`. `WeatherCard.tsx`: `WindLegend` (`:79`, with `percentFmt`) and `WeatherDetails` (`:103`, with `OPEN_METEO_URL`, `WeatherDetailsProps`) move out; `WIND_LEGEND` (read by `WindLegend` and `secondaryLine`) goes to the existing weather-presentation topic module `weatherConditions.ts`. `WeatherHourlyTable.tsx`: `PrecipitationDots` (`:41`, with `PRECIPITATION_COLORS`) moves out. `WindRose.tsx` exports two components: `WindRoseGlyph` (`:43`) moves to `WindRoseGlyph.tsx`, `Wedges` (`:26`, with `HALF_SECTOR_RAD`, `point`, `wedgePath`, `WedgesProps`) to `Wedges.tsx`; `WeatherCard.tsx` imports `WindRoseGlyph` from its new module.
    Check: item check including e2e and screenshots of a session with weather; the shape check lists none of the four original modules.

13. Page modules.
    Files: `apps/web/src/pages/StudioDetailPage.tsx`, `apps/web/src/features/studio/StudioDetail.tsx`, `apps/web/src/pages/TripDetailPage.tsx`, `apps/web/src/features/trips/TripDetail.tsx`
    Change: `StudioDetail` (`StudioDetailPage.tsx:33`, with `validTabs`) moves to `features/studio/StudioDetail.tsx` and `TripDetail` (`TripDetailPage.tsx:40`) to `features/trips/TripDetail.tsx` — pages stay thin and hold only their page component (`apps/web/CLAUDE.md:35`).
    Check: item check including e2e and screenshots of a studio route and a trip; the shape check lists nothing under `src/pages/`.

### Component statements into hooks

14. Map overlay and background.
    Files: `apps/web/src/features/map/DeckGLOverlay.tsx`, `apps/web/src/features/map/DeckOverlayControl.tsx`, `apps/web/src/features/map/MapBackground.tsx`, `apps/web/src/features/map/hooks/useMapCameraEffect.ts`, `apps/web/src/features/map/hooks/useTerrainTrackPickingEffect.ts`, `apps/web/src/features/map/hooks/useMapPopupState.ts`, `apps/web/src/features/map/trackPicking.ts`, new hooks under `apps/web/src/features/map/hooks/`: `useTrackLayers.ts`, `useDetailLayers.ts`, `useLapLayers.ts`, `useStudioRouteLayer.ts`, `usePickLayers.ts`, `useGeoLayers.ts`, `useMapInteraction.ts`, `useMapBackgroundEffects.ts`, `useMapCameraInputs.ts`
    Change:
    - `DeckGLOverlay` (`DeckGLOverlay.tsx:69`, 43 statements): each layer group becomes a hook that reads its own store slices — `useTrackLayers(tracks)` (store reads 70, 82-84, 91; layers 153-210), `useDetailLayers(…)` (87, 125-151, 212-234), `useLapLayers(…)` (74-76, 102-113, 236-284), `useStudioRouteLayer()` (78, 81, 286-339), `usePickLayers(terrain)` (72-73, 341-381), `useGeoLayers(terrain)` (79-80, 383-427). The three hooks whose selectors or layers read `props.terrain` today (`hoveredPoint`, `pickCircle` and `hoveredLapIndex` at 72-73 and 76, `pickCircleLayer` at 342, `geoLayers` at 384) take it as their `terrain` input. The component keeps `useMapRendererHandOver` (88) and the effect hooks (94, 115-122), and returns today's markup (441-453) with the layer list of 429-439 written in place as the `layers` value (`handOver.deckShown ? [onboardingPreviewLayer, trackLayers, …, geoLayers] : NO_LAYERS`), in today's order with today's layer ids, so draw order and picking stay the same. `DeckOverlayControl` reads `useDevice().pointerFine` itself and derives `interleaved` from it (its `interleaved` prop, `DeckOverlayControl.tsx:9`, and the component's `pointerFine` read at 85 go away; the layer hooks read `useDevice()` themselves), which keeps the component at 12 statements.
    - `MapBackground` (`MapBackground.tsx:27`, 22): `useMapInteraction(mapRef, tracks)` returns `{ popupState, studioPopup, studioRoutesPopup, onMapClick, interactive }` (37-39, 51-70); `useMapBackgroundEffects(mapRef, mapLoaded)` holds the four side effects (42-49). The two terrain reads (32-33) stay in the component, which ends at 11 statements.
    - `useMapCameraEffect` (`useMapCameraEffect.ts:307`, 16): the store and derived inputs (322-334: `target` through `visibleKey`) move into `useMapCameraInputs({ gpsData, tracks })`; the effect hook keeps `mapRef`, `map`, `state`, `runs` (320-321, 335-336), calls it and keeps its `useEffect`. The effect callback (`:338`, 14 statements) hands the fit itself (356-379) to a module-local `runPendingFit({ pending, mapRef, map, runs, target, lapPath, sessionPath, sources }: { …; sources: FitSources }): boolean`, whose body is those lines unchanged except that the `applyCameraOnlyFit` branch returns `true`, the `bounds === null` guard returns `false` and the end returns `true`; the callback reads `if (!runPendingFit({ …, sources: { tracks, gpsData, tripSessionIds, sessionBounds, lapPath: lapPath?.path ?? null, studioBounds } })) return;` followed by the one `state.current = settleMapCameraFit(state.current);`, so the camera-only and the bounds fit settle exactly as today and a missing bounds still leaves the fit pending (9 statements).
    - the effect callback in `useTerrainTrackPickingEffect.ts:66` (17 statements): the tap recognition (80-100: `tapStart`, `lastTapAt`, `onClick`, `onTouchStart`, `onTouchMove`, `onTouchEnd`) moves into a module-local `trackTapHandlers(selectAt: (event: TrackPointerEvent) => void): TrackTapHandlers`, with `interface TrackTapHandlers { onClick; onTouchStart; onTouchMove; onTouchEnd }` typed as today's handlers; the callback binds `const taps = trackTapHandlers(selectAt);` and registers and removes `taps.onClick`, `taps.onTouchStart`, … in the same `map.on`/`map.off` order (12 statements). The why-comment at 19-20 stays above `TAP_TOLERANCE_PX`.
    - the click handler in `useMapPopupState.ts:22` (14): the pick computation (29-47) moves to `export const pickSessionsAt = (map, info, tracks): TrainingSession[]` in `features/map/trackPicking.ts`.
    Check: item check including e2e (`e2e/map.spec.ts`, `e2e/mobile/map.spec.ts`, `switching 2D and 3D only tilts, keeps the zoom-out limit and leaves none behind` included) and map screenshots (overview, session detail with laps in 2D and 3D, studio, live position); the shape check lists none of these six units; no spec covers the 3D track picking, so by hand in `vp dev` a click and a touch tap (device emulation) on a session track in 3D select its lap and hovering it shows the pointer cursor.

15. Dashboard charts and chart zoom.
    Files: `apps/web/src/features/dashboard/LoadChart.tsx`, `apps/web/src/features/dashboard/VolumeChart.tsx`, `apps/web/src/features/dashboard/hooks/useDashboardSports.ts` (new), `apps/web/src/features/dashboard/hooks/useLoadChartData.ts` (new), `apps/web/src/features/dashboard/hooks/useVolumeChartRails.ts` (new), `apps/web/src/lib/hooks/useChartZoom.ts`, `apps/web/src/lib/hooks/useZoomSelectionState.ts` (new), `apps/web/src/lib/chartZoom.ts` (new)
    Change:
    - The identical `sports` memo in `LoadChart.tsx:122-125` and `VolumeChart.tsx:69-72` becomes `useDashboardSports()` (reads `activeFilter?.sport` itself).
    - `LoadChart` (`LoadChart.tsx:110`, 16): `useLoadChartData(axis)` returns `{ groupBy, isGroupingDisabled, load, sportTotals, bucketAt, onZoomComplete }` (113-152; the grouping reset effect is already gone, the effects-are-rare plan derives the grouping during render).
    - `VolumeChart` (`VolumeChart.tsx:64`, 16): `useVolumeChartRails(series, metric)` returns `{ railRows, unit, lineColor }` (83-111).
    - `useChartZoom` (`useChartZoom.ts:22`, 19) and its `onMouseUp` (`:58`, 15): the four selection states and the reset-on-new-data block (27-40) become `useZoomSelectionState(data)`; the index resolution in `onMouseUp` (69-80) becomes the pure `export const zoomSelection = (data, xKey, pressed, released): { left: number; right: number } | null` in the new topic module `apps/web/src/lib/chartZoom.ts`.
    Check: item check including e2e and dashboard screenshots (drag-zoom still works); the shape check lists none of these units.

16. Session and route chart explorers.
    Files: `apps/web/src/features/sessions/charts/SessionChartsExplorer.tsx`, new hooks under `apps/web/src/features/sessions/charts/hooks/`: `useSessionChartScales.ts`, `useSessionChartRows.ts`, `useSessionChartHover.ts`, `useSessionRailStats.ts`, `useSessionChartNodes.ts`; `apps/web/src/features/studio/charts/RouteChartsExplorer.tsx`, new hooks `apps/web/src/features/studio/hooks/useRouteChartRows.ts`, `apps/web/src/features/studio/hooks/useRouteChartHover.ts`
    Change:
    - `SessionChartsExplorer` (`:105`, 44 statements): `useSessionChartScales(session, thresholds, trackColorMode)` (120-137), `useSessionChartRows(session, zoomRange)` (108-119, 143-161: terrain, climb spans, extremes, rows, compact rows, lookups), `useSessionChartHover(byTime, gpsLookup)` (163-194), `useSessionRailStats(session, rows, terrain, zoomRange)` (199-264: selected band, rail range, stats, the power and grade rail readings, `elevationMetricId`), `useSessionChartNodes(…)` (267-356). The `charts` array (358-583) stays in the component as one wide statement.
    - `RouteChartsExplorer` (`:43`, 15): `useRouteChartRows(points, zoomRange)` (44-61) and `useRouteChartHover(byDist, gpsLookup)` (63-85).
    Check: item check including e2e and screenshots of a session's charts (hover, lap selection, zoom) and a studio route's charts; the shape check lists neither unit.

17. Lap controls.
    Files: `apps/web/src/features/sessions/session/LapsPicker.tsx` (after item 11; `LapsControl.tsx:101` before it), `apps/web/src/features/sessions/session/LapsControl.tsx`, `apps/web/src/features/sessions/session/hooks/useLapsPickerSets.ts` (new), `apps/web/src/features/sessions/session/hooks/useLapsControlState.ts` (new), `apps/web/src/features/sessions/session/lapLabels.ts`
    Change:
    - `LapsPicker` (26 statements): `useLapsPickerSets(props)` returns `{ deviceSet, splitSet, effortSet, limitedBy }` (102-128); the description strings (129-158: effort caption, nudge, device and splits descriptions) become the pure `export const lapsPickerDescriptions = (…)` in the lap-label topic module `lapLabels.ts`. The `rows` literal (160-188) stays.
    - `LapsControl` (`LapsControl.tsx:355`, 13): `useLapsControlState(props)` returns `{ source, splitDistance, sessionLaps, selected, hasSelectedLap }` (357-376).
    Check: item check including e2e and screenshots of the laps picker for each source; the shape check lists neither unit.

18. Intervals form and threshold editing.
    Files: `apps/web/src/features/intervals/IntervalsConnectionForm.tsx` (or `apps/web/src/features/intervals/index.tsx` after the component-declaration-shape plan), `apps/web/src/features/intervals/hooks/useIntervalsKeyInput.ts` (new), `apps/web/src/features/intervals/hooks/useIntervalsImport.ts` (new), `apps/web/src/features/settings/ThresholdEditForm.tsx` (after item 9), `apps/web/src/features/settings/hooks/useThresholdDraft.ts` (new), `apps/web/src/features/settings/ThresholdTiles.tsx`, `apps/web/src/features/settings/ThresholdTile.tsx` (new), `apps/web/src/features/settings/hooks/useThresholdTileReading.ts` (new)
    Change:
    - `IntervalsConnectionForm` (`:40`, 20): `useIntervalsKeyInput(storedKey)` returns the key-input state and the derived `check` that the markup reads (46-68), `useIntervalsImport(…)` returns the import error state and `handleImport` (47, 51, 70-130).
    - `ThresholdEditForm` (`ThresholdEditDialog.tsx:35` today, 13): `useThresholdDraft(field, thresholds)` returns `{ draft, setDraft, visibleError, canSave }` (41-48).
    - the tile callback in `ThresholdTiles.tsx:127` (17 statements of logic plus markup): the callback body becomes the component `ThresholdTile` in `ThresholdTile.tsx`, and its value logic (128-154: points, fresh, shown value, note, unit, ring style) the hook `useThresholdTileReading(tile, history, context, scrub, fresh)`; `ThresholdTiles` maps `TILES` to `<ThresholdTile … />`.
    Check: item check including e2e and screenshots of the intervals connection form (onboarding and settings) and the threshold tiles; the shape check lists none of these units.

19. Studio marker dialog and track pick popup.
    Files: `apps/web/src/features/studio/markers/StudioMarkerDialog.tsx`, `apps/web/src/features/studio/hooks/useStudioMarkerForm.ts` (new), `apps/web/src/features/studio/markers/StudioTrackPickPopup.tsx`, `apps/web/src/features/studio/hooks/useStudioTrackPickSegment.ts` (new)
    Change:
    - `StudioMarkerDialog` (`:32`, 24): `useStudioMarkerForm(route)` returns every state value, derived flag and handler the dialog markup reads (33-145; the effects-are-rare plan has already replaced the reset effect 49-83 with seeding during render).
    - `StudioTrackPickPopup` (`:20`, 14): `useStudioTrackPickSegment(info)` returns `{ route, routeExport, segment, segmentTooShort, exportLabel, subtitleParts }` (21-49).
    Check: item check including e2e (`e2e/studio.spec.ts`) and studio screenshots; the shape check prints nothing for the whole of `apps/web/src`.

20. (packages/ui) Extract the bottom sheet's peek fade into a hook.
   Files: new `packages/ui/src/hooks/useSheetPeekFade.ts`; `packages/ui/src/components/BottomSheet.tsx`
   Change: `BottomSheet` (`BottomSheet.tsx:52`) holds about 17 top-level statements (R1). Move `:60-63` (`fade`, `peekOpacity`, `peekPointerEvents`, `contentOpacity`, with the threshold constant they read) into `useSheetPeekFade({ y, layout }: { y: MotionValue<number>; layout: SheetLayout }): SheetPeekFade`, returning a file-local `interface SheetPeekFade { peekOpacity: MotionValue<number>; peekPointerEvents: MotionValue<'auto' | 'none'>; contentOpacity: MotionValue<number> }` built with the same `useTransform` calls in the same order; `BottomSheet` binds `const peekFade = useSheetPeekFade({ y, layout });` and reads `peekFade.peekOpacity` etc. Together with the effects-are-rare `packages/ui` items this leaves about 12 statements.
   Check: `rg -n "useTransform" packages/ui/src/components/BottomSheet.tsx` prints nothing; `vp run check` and `vp run test` pass; `vp run e2e` passes.

### packages/engine

Items 21–31 split the nine engine units over the bar (`vp -C packages/engine exec node <path>/unit-shape.cjs $(cd packages/engine && find src -name '*.ts')` lists them). Names and signatures are the ones in force after the names, helpers-group and signature plans. Extracted steps are module-local functions of the same module (R6), written with one destructured object parameter, declared above the unit that calls them; they keep their statements in the original order and move every comment with the code it belongs to (the `@see` tags and why-notes stay, nothing else is added). Each item's check: the shape check no longer lists the unit, the pinned spec of item 21 passes, `vp run check` is clean and `vp run test` passes.

21. (packages/engine) Pin today's outputs of the units this plan splits.
   Files: new `packages/engine/tests/pinnedOutputs.spec.ts` (temporary, deleted by item 31)
   Change: the spec builds one deterministic session — 4,000 records with `timestamp: i`, `hr: Math.round(140 + 25 * Math.sin(i / 97))`, `power: Math.round(220 + 90 * Math.sin(i / 53))`, `cadence: 85`, `speed: 3 + Math.sin(i / 71)`, `distance` the running sum of `speed`, `elevation: 100 + 20 * Math.sin(i / 300)`, `lat: 48 + i * 1e-5`, `lng: 8.4 + 1e-3 * Math.sin(i / 200)`, leaving out the records of seconds 1200–1259 — plus a second session of the same shape whose power alternates 360 W and 150 W every 180 s (so effort detection finds blocks, a warm-up and a cool-down), and, inside one `describe('pinned engine outputs', …)`, one `toMatchInlineSnapshot()` case per call: `detectEfforts` on both sessions for `'cycling'` with `{ restHr: 50, maxHr: 190, ftp: 250 }` and on the first for `'running'` with `{ restHr: 50, maxHr: 190, thresholdPaceSecPerKm: 300 }`; `aerobicDecoupling` on the first session for both sports; `trainingEffectFromRecords` for both genders at CTL 0, 40 and 250; `dailyMetricsFromSessions` over twelve sessions on fixed dates (two of them planned) with a fixed `endDate`, with and without `includeGhosts`; `isSegmentIntersectingBounds` for a crossing, a touching, a parallel-outside and a fully-outside segment. Fill the snapshots once with `vp test -- --run -u tests/pinnedOutputs.spec.ts` from `packages/engine`; never pass `-u` again in this plan.
   Check: the spec passes without `-u` and its inline snapshots are filled.

22. (packages/engine) `detectEfforts` (`effortDetection.ts:667`, 20 statements).
   Files: `packages/engine/src/effortDetection.ts`
   Change: extract `chooseSignal({ grid, sport, thresholds }): { signal: EffortSignal | null; limitedBy: EffortLimiter | undefined }` (the signal loop, `:677-688`), `signalLevels({ signal, thresholds, defaults }): SignalLevels | undefined` (`:691-697`), `gradeFactorFor({ signal, records, grid }): (second: number) => number` (`:699-703`) and `blocksFromPieces({ pieces, grid, series }): EffortBlock[]` (`:713-727`). `detectEfforts` keeps the early returns in the same order with the same objects.
   Check: item check.

23. (packages/engine) `buildGrid` (`effortDetection.ts:134`, 17 statements).
   Files: `packages/engine/src/effortDetection.ts`
   Change: extract `gridSeconds({ records, offset }): number[]` (`:138-144`), `fillGrid({ grid, records, seconds }): Uint8Array` (the `put` closure and the record loop, `:156-177`, returning the gap marks) and `markBreaks({ grid, gap }): void` (the stopped-run and gap passes, `:178-192`). `buildGrid` keeps its guards and the grid literal.
   Check: item check.

24. (packages/engine) `peltChangePoints` (`changePoints.ts`, 15 statements).
   Files: `packages/engine/src/changePoints.ts`
   Change: extract `prefixSums(values: number[]): { sums: Float64Array; squares: Float64Array }` (the cumulative sums) and `changesFrom({ last, n }): number[]` (the back-tracking loop and `reverse()`); the main loop and the pruning filter stay in `peltChangePoints`.
   Check: item check.

25. (packages/engine) `buildBins` (`effortDetection.ts:327`, depth 5).
   Files: `packages/engine/src/effortDetection.ts`
   Change: extract `binsOfRuns({ series, breaks }): Bin[]` (`:328-337`), `dropoutEnd({ bins, start }): number` (the inner `while`, `:344-349`), `assignPieces(bins: Bin[]): void` (the piece loop `:338-364`, now calling `dropoutEnd` and holding one `if` per level) and `fillFromNeighbours(bins: Bin[]): void` (the two passes `:365-376`, forward then backward, unchanged). `buildBins` reads as the three calls and `return bins`.
   Check: item check (depth ≤ 3 everywhere in the module).

26. (packages/engine) `markWarmupCooldown` (`effortDetection.ts:522`, 15 statements).
   Files: `packages/engine/src/effortDetection.ts`
   Change: extract `headStart({ pieces, firstWork }): number` and `tailEnd({ pieces, lastWork }): number` (the two `while` walks), `cooldownPiece({ pieces, lastWork, end }): Piece | undefined` and `warmupPiece({ pieces, start, firstWork }): Piece | undefined` (each returns the piece the old `if` built, or `undefined`). `markWarmupCooldown` applies the cool-down splice first and the warm-up splice second, at the same indices as today.
   Check: item check.

27. (packages/engine) `trainingEffectFromRecords` (`trainingEffect.ts:122`, 15 statements).
   Files: `packages/engine/src/trainingEffect.ts`
   Change: extract `anaerobicImpulseOf({ samples, line }): number` (the loop `:140-146`), `fitnessScaleOf(ctl: number): number` (`:149`), `aerobicScore({ aerobicTrimp, trimpRef, fitnessScale }): number` (`:153-156`) and `anaerobicScore({ anaerobicImpulse, fitnessScale }): number` (`:159-162`), each returning exactly the expression it replaces.
   Check: item check.

28. (packages/engine) `aerobicDecoupling` (`decoupling.ts:98`, 13 statements).
   Files: `packages/engine/src/decoupling.ts`
   Change: extract `splitHalves({ intervals, totalSec }): { first: CountedInterval[]; second: CountedInterval[] }` (`:116-126`).
   Check: item check.

29. (packages/engine) `dayKeysFromSessions` (`metrics.ts:28`, 13 statements) and the doubled planned-session filter.
   Files: `packages/engine/src/metrics.ts`
   Change: extract `dayStart(timestamp: number): Date` (`const date = new Date(timestamp); date.setHours(0, 0, 0, 0); return date;`) and `lastDayStart(endDate: number | undefined): Date` (`if (endDate) return dayStart(endDate); return dayStart(Date.now());` — the same truthiness test as today, and `new Date(Date.now())` is `new Date()`); `dayKeysFromSessions` reads `const start = dayStart(first.date); const end = lastDayStart(endDate);` and keeps its loop over a copy of `start`. `aggregateDailyTss` loses its `includeGhosts` input and the `if (!includeGhosts && session.isPlanned) continue;` line (`:69`): `dailyMetricsFromSessions` already passes it only the sessions it kept (`:92-96`), so the check never skips anything.
   Check: item check; `rg -n "includeGhosts" packages/engine/src/metrics.ts` prints only `dailyMetricsFromSessions`.

30. (packages/engine) `isSegmentIntersectingBounds` (`bounds.ts`, depth 4).
   Files: `packages/engine/src/bounds.ts`
   Change: extract

   ```ts
   interface ParameterRange {
     tMin: number;
     tMax: number;
   }

   const clipEdge = ({
     direction,
     distance,
     range,
   }: {
     direction: number;
     distance: number;
     range: ParameterRange;
   }): ParameterRange | undefined => {
     if (direction === 0) {
       if (distance < 0) return undefined;
       return range;
     }
     const t = distance / direction;
     if (direction < 0) {
       if (t > range.tMax) return undefined;
       if (t > range.tMin) return { tMin: t, tMax: range.tMax };
       return range;
     }
     if (t < range.tMin) return undefined;
     if (t < range.tMax) return { tMin: range.tMin, tMax: t };
     return range;
   };
   ```

   and the edge loop becomes `let range: ParameterRange = { tMin: 0, tMax: 1 }; for (let i = 0; i < 4; i++) { const clipped = clipEdge({ direction: directions[i] ?? 0, distance: distances[i] ?? 0, range }); if (!clipped) return false; range = clipped; } return range.tMin <= range.tMax;`.
   Check: item check.

31. (packages/engine) Delete the pinned spec and confirm the engine is within the bar.
   Files: `packages/engine/tests/pinnedOutputs.spec.ts`
   Change: delete the file.
   Check: the shape check over `packages/engine/src` prints nothing; `test ! -e packages/engine/tests/pinnedOutputs.spec.ts`; `vp run test` passes.

### packages/gpx

Items 32–36 split the three gpx units over the bar (`vp -C packages/gpx exec node <path>/unit-shape.cjs $(cd packages/gpx && find src -name '*.ts')` lists `buildGpxString`, `sliceRoute` and `routeDistanceAtPosition` today). Names and signatures are the ones in force after the names, helpers-group and signature plans. Extracted steps are module-local functions of the same module (R6), take one destructured object when they have two or more inputs, sit above the unit that calls them, and keep their statements in the original order. Each item's check: the shape check no longer lists the unit, the pinned spec of item 32 passes without `-u`, `vp run check` is clean and `vp run test` passes.

32. (packages/gpx) Pin today's outputs of the units this plan splits.
   Files: new `packages/gpx/tests/pinnedOutputs.spec.ts` (temporary, deleted by item 36)
   Change: the spec builds a route from 120 parsed points (`lat: 47 + i * 0.00002`, `lng: 11 + 0.00002 * Math.sin(i * 1.3)`, `ele: 600 + Math.sin(i / 10) * 5`, `time: Date.parse('2025-08-17T06:00:00Z') + i * 1000`, `seg: Math.floor(i / 60)`, each through `createMockParsedGpxPoint` if the test-data plan has run) with `buildRouteGeometry`, and eight GPX points (`lat: 48.137 + i * 0.001`, `lon: 11.575 + i * 0.001`, `ele: 520 + i * 0.37`, `time: new Date(Date.parse('2024-01-15T08:00:00Z') + i * 1000)`, `seg: Math.floor(i / 4)`). Inside one `describe('pinned gpx outputs', …)` it holds one `toMatchInlineSnapshot()` case per call: `buildGpxString` of the eight points with metadata `{ name: 'Ride & <Run>', time: new Date('2024-01-15T06:00:00Z') }` and the waypoints `{ lat: 48.1381234, lon: 11.5761234, ele: 530.06, name: 'Café & <Hut>', desc: '"Fresh" water' }` and `{ lat: 48.139, lon: 11.577, name: 'Summit' }`; `buildGpxString` of the same points with `{ time: new Date('2024-01-15T06:00:00Z') }` and no waypoints; `JSON.stringify` of `sliceRoute` at the ranges `[0, 0.137]`, `[0.137, 0.5]`, `[0.5, 1]` of the route distance and at `[distance * 0.4, distance * 0.4]`; `JSON.stringify` of `pointAtRouteDistance` at `-10`, `distance * 0.25`, `distance * 0.75` and `distance + 1000`; `JSON.stringify` of `routeDistanceAtPosition` at the recorded point 37, at `{ lat: 47.0007, lng: 11.0001 }`, at `{ lat: 47.0013, lng: 11.0002 }` (beside the second segment) and at `{ lat: 46.9, lng: 11 }`. Run it once with `-u` to fill the snapshots.
   Check: `vp -C packages/gpx exec vitest run tests/pinnedOutputs.spec.ts` passes without `-u` and its snapshots are filled.

33. (packages/gpx) `buildGpxString` (`buildGpx.ts:30`, 20 statements).
   Files: `packages/gpx/src/buildGpx.ts`
   Change: extract four line builders and drop the two dead guards (`metadata?.name` on a required parameter, `:47`, and `if (metadata.time)` on a required `Date`, which is always truthy, `:55`):

   ```ts
   const metadataLines = ({ escapedName, time }: { escapedName: string | undefined; time: Date }): string[] => {
     const lines = ['<metadata>'];
     if (escapedName) lines.push(`<name>${escapedName}</name>`);
     lines.push(`<time>${time.toISOString()}</time>`);
     lines.push('</metadata>');
     return lines;
   };

   const waypointLines = (waypoint: GpxWaypoint): string[] => {
     const lines = [`<wpt lat="${waypoint.lat.toFixed(COORDINATE_DECIMALS)}" lon="${waypoint.lon.toFixed(COORDINATE_DECIMALS)}">`];
     if (waypoint.ele != null) lines.push(`<ele>${waypoint.ele.toFixed(ELEVATION_DECIMALS)}</ele>`);
     lines.push(`<name>${escapeXml(waypoint.name)}</name>`);
     if (waypoint.desc) lines.push(`<desc>${escapeXml(waypoint.desc)}</desc>`);
     lines.push('</wpt>');
     return lines;
   };

   const trackPointLines = (point: GpxPoint): string[] => {
     const lines = [`<trkpt lat="${point.lat.toFixed(COORDINATE_DECIMALS)}" lon="${point.lon.toFixed(COORDINATE_DECIMALS)}">`];
     if (point.ele != null) lines.push(`<ele>${point.ele.toFixed(ELEVATION_DECIMALS)}</ele>`);
     if (point.time) lines.push(`<time>${point.time.toISOString()}</time>`);
     lines.push('</trkpt>');
     return lines;
   };

   const trackLines = ({ points, escapedName }: { points: GpxPoint[]; escapedName: string | undefined }): string[] => {
     const lines = ['<trk>'];
     if (escapedName) lines.push(`<name>${escapedName}</name>`);
     lines.push('<trkseg>');
     let currentSegment = points[0]?.seg;
     for (const point of points) {
       if (point.seg !== currentSegment) {
         lines.push('</trkseg>', '<trkseg>');
         currentSegment = point.seg;
       }
       lines.push(...trackPointLines(point));
     }
     lines.push('</trkseg>', '</trk>');
     return lines;
   };
   ```

   `buildGpxString` keeps its guard and reads `let escapedName: string | undefined; if (metadata.name) escapedName = escapeXml(metadata.name); return ['<?xml version="1.0" encoding="UTF-8"?>', <the gpx root tag string of :40-43, unchanged>, ...metadataLines({ escapedName, time: metadata.time }), ...waypoints.flatMap((waypoint) => waypointLines(waypoint)), ...trackLines({ points, escapedName }), '</gpx>'].join('\n');` — the same lines in the same order.
   Check: item check; `packages/gpx/tests/buildGpx.spec.ts` and its file snapshot pass unchanged.

34. (packages/gpx) `sliceRoute` (`routeCut.ts:57`, 14 statements).
   Files: `packages/gpx/src/routeCut.ts`
   Change: extract

   ```ts
   const interpolatedStart = ({ points, startIndex, startMeters }: { points: RoutePoint[]; startIndex: number; startMeters: number }): RoutePoint[] => {
     const startAt = points[startIndex];
     const beforeStart = points[startIndex - 1];
     if (startAt && beforeStart && startAt.dist > startMeters) {
       return [interpolatedPoint({ before: beforeStart, after: startAt, distanceMeters: startMeters })];
     }
     return [];
   };

   const closingPoint = ({ points, endIndex, endMeters }: { points: RoutePoint[]; endIndex: number; endMeters: number }): RoutePoint[] => {
     const endAt = points[endIndex];
     const beforeEnd = points[endIndex - 1];
     if (endAt && endAt.dist === endMeters) return [endAt];
     if (endAt && beforeEnd) return [interpolatedPoint({ before: beforeEnd, after: endAt, distanceMeters: endMeters })];
     return [];
   };
   ```

   and `sliceRoute` keeps its guard, `startIndex`, `endIndex` and the `endMeters >= last.dist` override, then returns `[...interpolatedStart({ points, startIndex, startMeters }), ...points.slice(startIndex, endIndex), ...closingPoint({ points, endIndex, endMeters })]`. `points.slice` yields the same point objects the index loop pushed (an array of points has no holes, so its `if (point)` never skipped one).
   Check: item check; `packages/gpx/tests/routeCut.spec.ts` passes unchanged (its identity assertions included).

35. (packages/gpx) `routeDistanceAtPosition` (`routeCut.ts:88`, a 15-statement loop body mixing the projection with the best-match bookkeeping).
   Files: `packages/gpx/src/routeCut.ts`
   Change: extract the projection onto one segment, carrying the `@see [Veness2019] — equirectangular approximation.` tag the comments plan put on `routeDistanceAtPosition`:

   ```ts
   const nearestOnSegment = ({
     segmentStart,
     segmentEnd,
     positionX,
     positionY,
     longitudeScale,
   }: {
     segmentStart: RoutePoint;
     segmentEnd: RoutePoint;
     positionX: number;
     positionY: number;
     longitudeScale: number;
   }): { distanceSquared: number; routeDistanceMeters: number } => {
     const startX = segmentStart.lng * longitudeScale;
     const startY = segmentStart.lat;
     const deltaX = segmentEnd.lng * longitudeScale - startX;
     const deltaY = segmentEnd.lat - startY;
     const lengthSquared = deltaX * deltaX + deltaY * deltaY;
     let fraction = 0;
     if (lengthSquared > 0) {
       fraction = Math.max(0, Math.min(1, ((positionX - startX) * deltaX + (positionY - startY) * deltaY) / lengthSquared));
     }
     const offsetX = positionX - (startX + deltaX * fraction);
     const offsetY = positionY - (startY + deltaY * fraction);
     return {
       distanceSquared: offsetX * offsetX + offsetY * offsetY,
       routeDistanceMeters: segmentStart.dist + (segmentEnd.dist - segmentStart.dist) * fraction,
     };
   };
   ```

   The loop body becomes `const segmentEnd = points[i]; if (!segmentEnd) continue; let segmentStart = points[i - 1]; if (!segmentStart || segmentStart.seg !== segmentEnd.seg) segmentStart = segmentEnd; const nearest = nearestOnSegment({ segmentStart, segmentEnd, positionX, positionY, longitudeScale }); if (nearest.distanceSquared < nearestDistanceSquared) { nearestDistanceSquared = nearest.distanceSquared; nearestRouteDistanceMeters = nearest.routeDistanceMeters; }`. Every expression keeps its operands and order; the route distance is now computed for every segment instead of only the nearer ones, which changes no kept value.
   Check: item check; `rg -n "@see \[Veness2019\]" -A1 packages/gpx/src/routeCut.ts` shows the tag above `nearestOnSegment`.

36. (packages/gpx) Delete the pinned spec and confirm gpx is within the bar.
   Files: `packages/gpx/tests/pinnedOutputs.spec.ts`
   Change: delete the file.
   Check: the shape check over `packages/gpx/src` prints nothing; `test ! -e packages/gpx/tests/pinnedOutputs.spec.ts`; `vp run test` passes.

### tools/docs

Every other `tools/docs` plan item runs before these two (see Depends on), so the names below are their final names: `messageText`, `outPath`, `bannerLocale`, `WEB_APP_ORIGIN`, `isWithin`, the `_MS` waits, the behaviour constants, `messagesSchema`, `locales.ts` / `bannerContent.ts` (`BANNER_TEXT_BY_LOCALE`, `FLOW_KEYS`, `FRAMES_BY_FLOW`, `TILE_KEYS`, `SHOT_FILE_BY_TILE`, `BACKDROP_FILE`), `CLASSES_BY_SHOT_FIT` / `ShotFit`, the `FC<XProps>` declarations and the `({ … }, page)` helper signatures. Find code by those names; today's line numbers no longer hold. Moved code keeps its comments only where the comments plan kept them (the `waitForStill` rationale moves with `waitForStill`).

**Tool item check.** An item is done when the shape check, run from `tools/docs` as `vp -C tools/docs exec node <path>/unit-shape.cjs $(cd tools/docs && find banner -name '*.ts' -o -name '*.tsx' | grep -v '^banner/out/')`, prints nothing; `vp check` from `tools/docs/` is clean; and the banner check passes: before the item run `vp run docs:banner --locale de` and `vp run docs:banner --locale en` and copy `docs/banners/de_banner.png` and `docs/banners/en_banner.png` into a directory outside the repo, after it run both again and compare with `uv run --no-project --with pillow python -c "import sys;from PIL import Image,ImageChops;[print(n,ImageChops.difference(Image.open(f'{sys.argv[1]}/{n}_banner.png').convert('RGBA'),Image.open(f'docs/banners/{n}_banner.png').convert('RGBA')).getbbox()) for n in ('de','en')]" <that-directory>`, which must print `de None` and `en None`.

37. (tools/docs) Split the capture into topic modules and turn its test bodies into step calls (R1, R6).
   Files: `tools/docs/banner/capture.ts`, `tools/docs/banner/env.ts`; new `tools/docs/banner/messages.ts`, `tools/docs/banner/stillness.ts`, `tools/docs/banner/png.ts`, `tools/docs/banner/clip.ts`, `tools/docs/banner/appPage.ts`, `tools/docs/banner/shots.ts`
   Change: today the four test bodies hold 41, 47, 23 and 24 statements (`capture.ts:330`, `:386`, `:477`, `:553`) and every helper sits in the test file. Move the helpers, unchanged, into topic modules beside it; a declaration another module reads is exported, the rest stay module-local:
   - `env.ts` gains `REPO_ROOT` from `capture.ts`, unchanged: `export const REPO_ROOT = resolve(import.meta.dirname, '../../..');` with `import { resolve } from 'node:path';` (`env.ts` sits in `banner/` like `capture.ts`, so the path is the same). Read by `messages.ts` and `shots.ts`.
   - `messages.ts`: `messagesSchema`, `messages` (the catalogue of the `bannerLocale()` locale), `messageText`, `escapeRegExp`.
   - `stillness.ts`: `STILL_POLL_MS`, `STILL_MAX_POLLS`, `NETWORK_IDLE_MS`, `SETTLE_FRAME_COUNT`, `waitForStill` with its kept rationale comment.
   - `clip.ts`: `type Clip`, `boxOf`, `padded`, `clamp`, `isWithin`, `spiral`.
   - `png.ts`: `GEO_DOT_RGB`, `GEO_DOT_COLOR_TOLERANCE`, `openPngCanvas` (module-local), `cropPng`, `findPositionDot`.
   - `appPage.ts`: `FROZEN_CLOCK_TIME`, `UI_READY_TIMEOUT_MS`, `DEMO_IMPORT_TIMEOUT_MS`, `DOCK_READY_TIMEOUT_MS`, `SESSION_SCROLL_PAUSE_MS`, `SESSION_SCROLL_MAX_STEPS`, `PARKED_MOUSE_INSET`, `HOVER_SETTLE_FRAME_COUNT`, `LayoutStoreModule`, and `prepareContext`, `loadDemoData`, `hideOverlays`, `parkMouse`, `openSession`, `isOverTrack`, `nextTrackPoint`, `popover`, `locate`, `sheet`, `sheetHandle`, `sheetScroller`, `pinSheetPosition`.
   - `shots.ts`: `OUT_DIR`, `BANNER_PATH`, both `mkdirSync` calls (the only module-scope side effects, kept together here and run when `capture.ts` imports the module), `outPath`, `shoot`.
   A module that needs the locale declares `const LOCALE = bannerLocale();` from `./env.ts`, as `capture.ts:13` does today. `capture.ts` keeps the constants only its tests read (viewports, `MAP_WIDTH`, the session names, `STATS_SHEET_POSITION`, `LOCATE_POSITION`, the hero frame geometry, `SHOT_PADDING`, `SHEET_HANDLE_CLEARANCE`, `SPIRAL_STEP`, `STUDIO_SPIRAL_RADIUS`, `MAP_EDGE_MARGIN`, `CHART_SCROLL_GAP`, `CHART_SCROLL_TOLERANCE`, `SPLIT_SLIDER_STEPS`, `FILTER_READINGS_BOTTOM_PADDING`, `BANNER_VIEWPORT`), the `test.describe` blocks, and these module-local steps, each the statements of today's test body in today's order (line ranges are today's):
   - heatmap: `openHeatmapAtLocatedPosition(page)` (`:331-338`); `zoomToPositionDot(page)` (`:340-345`, returns the dot); `heroFrames(dot)` (`:346-349`, returns `{ locate, pick }` clips); `shootLocate({ dot, clip }, page)` (`:351-353`); `shootPick({ dot, clip }, page)` (`:355-369`, returns the pick popover); `shootExport(pick, page)` (`:371-379`).
   - laps: `showDeviceLapsByHeartRate(page)` (`:391-401`); `collapseSheet(page)` (`:403-408`); `shootTappedRep(page)` (`:411-439`, the rep search and the `2b` shot, returns `repName`); `shootRepStats(repName, page)` (`:441-465`, written as `pinSheetOnRep(repName, page)` for `:441-449`, `scrollToHeartRateChart(repName, page)` for `:451-463`, then `parkMouse` and the `2c` shot).
   - route studio: `addStudioMarkers(page)` (`:482-498`, with its `addMarker`); `pickStudioRoute(page)` (`:499-510`, returns the studio popover).
   - summary and weather: `shootSummary(page)` (`:557-567`, returns the weather card locator); `shootWeatherDetails(weather, page)` (`:569-588`).
   The `splits`, `plain-text filters` and `render banner` tests are within the bar and keep their bodies. Test titles, `test.describe.configure({ mode: 'serial' })`, every `test.use` and the test order stay as they are, so the same shots are taken in the same sequence; `playwright.config.ts` `testMatch: 'capture.ts'` stays, and the new modules hold no `test(…)` call.
   Check: tool item check; `rg -n "^\s*test\(" tools/docs/banner --glob '!capture.ts'` prints nothing; `ls tools/docs/banner/out/de` lists the same eleven shots as before.

38. (tools/docs) Split the banner page into one component per module (R5).
   Files: `tools/docs/banner/page/Banner.tsx`; new `tools/docs/banner/page/bannerLocale.ts`, `tools/docs/banner/page/frameSize.ts`, `tools/docs/banner/page/FitText.tsx`, `tools/docs/banner/page/Shot.tsx`, `tools/docs/banner/page/StepCaption.tsx`, `tools/docs/banner/page/FrameShots.tsx`, `tools/docs/banner/page/FlowCard.tsx`, `tools/docs/banner/page/TileCard.tsx`
   Change: `Banner.tsx` declares seven components. Each moves, unchanged apart from its imports, into its own module named after it, importing its siblings as `./<Name>.tsx`; `Tile` is renamed `TileCard` (props interface `TileCardProps`, its one use in `Banner`), since a bare `Tile` names no element of the page. The module-scope locale state the components share moves to `bannerLocale.ts` (owner decision):

   ```ts
   import { BANNER_TEXT_BY_LOCALE } from '../bannerContent.ts';
   import { DEFAULT_BANNER_LOCALE, isBannerLocale, type BannerLocale } from '../locales.ts';

   const bannerLocaleFromUrl = (): BannerLocale => {
     const localeParam = new URLSearchParams(window.location.search).get('locale');
     if (isBannerLocale(localeParam)) return localeParam;
     return DEFAULT_BANNER_LOCALE;
   };

   export const BANNER_LOCALE = bannerLocaleFromUrl();
   export const BANNER_COPY = BANNER_TEXT_BY_LOCALE[BANNER_LOCALE];
   export const shotUrl = (file: string) => `/banner/out/${BANNER_LOCALE}/${file}`;
   ```

   (the `.ts` module takes `if`/`return` instead of today's ternary at `Banner.tsx:20`, root `CLAUDE.md` §2); every read of `text` becomes `BANNER_COPY` (`FlowCard`, `TileCard`, `Banner`). `FRAME_HEIGHT_CLASS`, read by `FrameShots` and `FlowCard`, moves to `frameSize.ts` as its only export (`export const FRAME_HEIGHT_CLASS = 'h-[556px]';`). `ShotFit` and `CLASSES_BY_SHOT_FIT` stay module-local in `Shot.tsx`; `FitText` keeps its `useLayoutEffect` as it is (owner decision: no dependency change). `Banner.tsx` keeps only `Banner`, which `main.tsx` imports unchanged.
   Check: tool item check; `rg -c "^(export )?const [A-Z]\w*: FC" tools/docs/banner/page` prints `1` for each of the seven component modules (`FitText`, `Shot`, `StepCaption`, `FrameShots`, `FlowCard`, `TileCard`, `Banner`); `rg -n "\btext\.|\bTile\b" tools/docs/banner/page` prints nothing.

### tools/workbench

Every other workbench plan item runs before these (see Depends on), so the names below are their final names: the module splits of helpers-group-by-topic (`checkRules.ts`, `techFile.ts`, `componentGraph.ts`, `markdown.ts`, `techActual.ts`, `html.ts`, `itemCli.ts`), `paths.ts`, the contract module, the object signatures, the hooks in `site/src/app/hooks/` (`useWriteMutation`, `useUndoMutation`, `useTechDiagramsEffect`, `useTechRefitEffect`, `useWriteCardTimerEffect`, …), the `FC<XProps>` declarations, the map names (`LABEL_BY_BUCKET`, `SHAPE_BY_BUCKET`, …) and the renamed locals. Find code by those names; today's line numbers no longer hold. Moved code keeps exactly the comments the comments plan kept.

**Workbench shape check.** Run the shape check script from the top of this plan from `tools/workbench` as `node <path>/unit-shape.cjs $(find scripts site/src -name '*.ts' -o -name '*.tsx')`. Before any workbench plan item it prints 26 lines; after item 42 it prints nothing.

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

39. (tools/workbench) One component per module on the board (R5).
   Files: `tools/workbench/site/src/app/{Board,Columns,NeedsYou,PlanPane,ReviewPane,AnswerDialog,WriteCard,Prose}.tsx`, `tools/workbench/site/src/app/icons.tsx` (deleted); new `tools/workbench/site/src/app/{BoardPage,Column,FlakyRow,PlanSection,EmptyNote,ReviewSection,FindingRow,ReviewSections,AnswerForm,WrittenChanges,Inline,StatusRing,StatusFill,StatusIcon,TypeIcon}.tsx`; importers `tools/workbench/site/src/app/{ItemPanel,ItemCard,QuestionRow,CheckRow}.tsx`
   Change: each extra component moves, unchanged apart from its imports and its export, into its own module named after it, beside its parent; a module-level constant or helper moves with the one component that reads it.
   - `Board.tsx` keeps `Board`, `queryClient` and the `overwriteGetLocale` call; `BoardPage.tsx` takes `BoardPage`, `GUIDE_TITLE`, `PanelContent` and `tabFor`.
   - `Columns.tsx` keeps `Columns` and `PHASES`; `Column.tsx` takes `Column`, `ColumnProps` and `GATE_TITLE`.
   - `NeedsYou.tsx` keeps `NeedsYou` and `FLAKY_TITLE`; `FlakyRow.tsx` takes `FlakyRow`.
   - The two identical `Empty` components (`PlanPane.tsx`, `ReviewPane.tsx`) become one `EmptyNote.tsx` (`export const EmptyNote: FC<PropsWithChildren>`), read by both panes. `PlanPane.tsx`'s `Section` becomes `PlanSection.tsx` (`PlanSection`, `PlanSectionProps`); `ReviewPane.tsx`'s `Section`, `FindingRow` and `Sections` become `ReviewSection.tsx`, `FindingRow.tsx` and `ReviewSections.tsx` (`ReviewSections`); `ReviewPane.tsx` keeps `ReviewPane`.
   - `AnswerDialog.tsx` keeps `AnswerDialog`; `AnswerForm.tsx` takes `AnswerForm`, `AnswerFormProps` and `QUICK_ANSWERS`.
   - `WriteCard.tsx` keeps `WriteCard` and `titleOf`; `WrittenChanges.tsx` takes `Written`, renamed `WrittenChanges` (`WrittenChangesProps`), with `Line`, `linesOf` and `CLASSES_BY_LINE_KIND`.
   - `Prose.tsx` keeps `Prose`; `Inline.tsx` takes `Inline`, `inlineMd` and `inlineHtml`.
   - `icons.tsx` is a lowerCamelCase module exporting components (component-declaration-shape R7) and is deleted: `Ring` → `StatusRing.tsx`, `Fill` → `StatusFill.tsx`, `StatusIcon.tsx` takes `StatusIcon` and `SHAPE_BY_BUCKET`, `TypeIcon.tsx` takes `TypeIcon` and `ICON_BY_ITEM_TYPE`.
   Every importer names the new module (`'./StatusIcon.tsx'`, `'./Inline.tsx'`, …). The rendered DOM is unchanged.
   Check: the workbench shape check prints no `components=` line; `test ! -e tools/workbench/site/src/app/icons.tsx`; workbench check; board check.

40. (tools/workbench) Component statements into hooks and topic steps (R1, R4, R6).
   Files: `tools/workbench/site/src/app/BoardPage.tsx`, `tools/workbench/site/src/app/TechPane.tsx`, `tools/workbench/site/src/app/CheckRow.tsx`; new `tools/workbench/site/src/app/hooks/usePanelState.ts`, `tools/workbench/site/src/app/hooks/useTechFullScreen.ts`, `tools/workbench/site/src/lib/checkText.ts`
   Change:
   - `BoardPage` (13 statements): the panel state — `panel`/`setPanel`, `expanded`/`setExpanded`, `showTab`, `openItem`, `toggleGuide`, `close` — moves into `usePanelState({ items }): PanelState` (`items` is `boardView?.items`), `interface PanelState { panel: PanelContent; expanded: boolean; setExpanded: (expanded: boolean) => void; showTab: (target: { folder: string; tab: Slot }) => void; openItem: (target: { folder: string; asked: Slot | undefined }) => void; toggleGuide: () => void; close: () => void }` declared beside the hook (`PanelContent` and `tabFor` move to the hook module, which `BoardPage.tsx` imports them from). `BoardPage` binds `const panelState = usePanelState({ items: boardView?.items })` and reads `panelState.panel`, `panelState.expanded`, ….
   - `TechPane` (16 statements after the effects plan): the full-screen stage — the `full` state, the `body` ref, `bodyRef`, `close`, `control`, `switchTo`, `diagram`, `label`, `path` — moves into `useTechFullScreen(): TechFullScreen`, a named composite that also returns `open` (today's `setFull`, which `useTechDiagramsEffect` receives as `expand`); `TechPane` keeps `pane`, `techHtml`, `actualHtml`, the two memoised `__html` objects, the hook calls and the markup.
   - `CheckRow` (19 statements): the text split — `body`, `pointer`, `why`, `what` from `check.text`, `check.superseded` and whether it is an agent decision — moves into `checkText.ts` as `export const checkRowText = ({ text, superseded, agent }: { text: string; superseded: boolean; agent: boolean }): { what: string; why: string | undefined; pointer: string | undefined } => { … }`, today's statements in today's order; the three `let … if (agent)` pairs become a map `const WRITES_BY_CHECK_KIND: Record<CheckRowProps['kind'], { toggle: 'plan.toggleCheck' | 'review.toggleDecision'; remove: 'plan.deleteCheck' | 'review.deleteDecision'; removeLabel: string }> = { check: { toggle: 'plan.toggleCheck', remove: 'plan.deleteCheck', removeLabel: 'Delete this real-data check' }, agent: { toggle: 'review.toggleDecision', remove: 'review.deleteDecision', removeLabel: 'Delete this agent decision' } };` in `CheckRow.tsx`.
   Check: the workbench shape check prints no line for `BoardPage`, `TechPane` or `CheckRow`; workbench check; board check (open and switch panels, the guide, Expand/Collapse, Tech full screen and its Planned | Actual switch, a superseded decision's struck-through text and its pointer).

41. (tools/workbench) Script units within the bar (R1, R2, R6).
   Files: `tools/workbench/scripts/{checkRules,techFile,deps,componentGraph,interfaces}.ts`
   Change: each unit keeps its output; the extracted steps are module-local functions of the same module, in the unit's order:
   - `checkPlan` (14): `parsedFrontmatter({ path, plan })` returns `{ errors: string[]; frontmatter: PlanFrontmatter | undefined }` (`errors` holds the YAML error, the missing block and the schema issues, with today's messages; `frontmatter` is `undefined` whenever `errors` is not empty), and `questionErrors({ path, questions, status })` the unquoted-answer and open-from-ready errors; `checkPlan` pushes the tech.md error after them as today. `parsedFrontmatter` is exported for `board.ts` (item 42).
   - `checkDecisions` (depth 4): the per-item test becomes `decisionItemError({ path, item }): string | undefined`.
   - `moduleEntries` (depth 4): the inner loop over one list token becomes `bulletEntries(token): TechEntry[]`.
   - `toDepsGraph` (32 statements, depth 4): `drawnEdges({ modules, sources, focusNodes, focus })` returns `{ edges, folded }`; `nodeLabels({ nodes, folded })` the label map with its repeat pass; `layerLines({ nodes, folded, nodeLine })` the app subgraphs, with `featureLines({ inLayer, folded, nodeLine })` for the nested feature subgraphs; `folderLines({ nodes, nodeLine })` the other folders; `classLines({ nodes, focusNodes, added, missing, idOf })` the `class`/`classDef` lines. Line order in the mermaid text is today's.
   - `main` of `deps.ts` (40): `writeDepsGraph`, `writeComponentGraph`, `writeFilesJson`, each with its `writeFileSync` and its `console.log` line, then the boundary report; the order of writes, logs and exits is today's.
   - `toComponentGraph` (22): `componentImports(cruise)` and `componentLines({ nodes, imports, drawn, entries, added })`.
   - `propsText` (13): the branch for a local interface or alias becomes `localPropsText({ local, file })`.
   Check: the workbench shape check prints no `scripts/` line; workbench check (`deps-usage`, `deps-missing` unchanged); suite (`deps.spec.ts`, `componentGraph.spec.ts` and `interfaces.spec.ts` pin the mermaid text and the printed interfaces).

42. (tools/workbench) Board-side units within the bar (R1, R6).
   Files: `tools/workbench/site/src/lib/{writeBack,board,techActual}.ts`, `tools/workbench/site/src/scripts/tech.ts`
   Change:
   - `fileItems` (14) and `headings` share the start index after the frontmatter: `const firstBodyLine = (lines: string[]): number => { const front = frontmatterRange(lines); if (front) return front.end + 1; return 0; };`, read by both.
   - `diffOps` (16): `lcsLengths({ beforeMiddle, afterMiddle })` builds the table, `editScript({ beforeMiddle, afterMiddle, lcsLengths })` walks it; `diffOps` keeps the prefix, the suffix and the numbering.
   - `readItem` (16): the plan parse reads `parsedFrontmatter({ path, plan: text })` from `@scripts/checkRules.ts` (its `frontmatter` is `undefined` in today's three `return undefined` cases), and the review files become `reviewState({ dir }): { findings: FindingView[]; decisions: CheckItem[]; reviewDoc: boolean; reviewPresent: boolean }`.
   - `filesActualHtml` (13): `parsedFilesJson(text): FilesJson | undefined`; `interfacesActualHtml` (13): `interfacesSummary(text): { generated: string | undefined; countsHtml: string; missingHtml: string }`.
   - `sectionControl` (18): `actualSide({ parts, expand })` returns `{ hint, figure, graph, source, frame }`, and `wireSwitches({ control, frames, segments, plannedFigure })` the per-frame switch setup; `labelRow` (13): `labelSpan({ className, text })` builds each of its two spans.
   Check: the workbench shape check prints nothing; workbench check; board check; suite.

## Open items

- `tools/docs`: `run.ts`, `env.ts`, the configs and `main.tsx` are within the bar. The step functions of item 37 stay module-local in `capture.ts`: each is read by one test only, and the topic modules hold what several tests share.
- `tools/docs`: the moved capture steps keep finding app elements through styling classes (`.mb-4` for the demo banner, `.text-text-tertiary`, `.text-sport-running`/`.text-sport-cycling`, `.maplibregl-canvas`, the `tsqd-*` devtools classes); selecting on data attributes instead changes the app DOM and is not part of this plan (follow-up: backlog item conventions-follow-ups).
- `packages/ui` R5 (extracted markup gets its own module): the 15 kit modules declaring several components are split by the component-directory-and-file-naming plan.
- File length is deliberately unbudgeted (owner decision): no `max-lines` or `max-lines-per-function` rule, and line count is no review objection (R7).
- The 12-statement bar is the owner's; the shape check counts statements, not their weight, so a unit can pass with a heavy single statement (accepted, R3).
- Nesting inside an inline callback is counted for the callback, not for its enclosing unit; the shape check follows that reading.

- `packages/engine`: item 29 keeps `getDateRange`'s sort of all sessions to find the first date (a `Math.min` would give the same date, but the sort is not proven identical for sessions sharing a timestamp and is cheap); `new Date()` as the default end stays (owner decision).

- `packages/gpx`: `buildRouteGeometry` (6 statements after the polyline move), `elevationStatsFromPoints` (8, nesting 3) and `collectPoints` (3, nesting 3) are within R1 and R2 and stay as they are.

- `packages/testing`: already conforms, no item. The densest unit, `makeLapsFromRecords` with its `closeLap` (`records.ts:278-338`), is deleted by test-data-from-mock-factories item 3; every remaining factory and series helper is within R1 and R2 (`buildSpeedArray` nests 3, `generateTerrainSegments` holds 6 top-level statements).
- `tools/workbench`: `checkRowText` and the steps of items 41–42 are topic steps (R6), not hooks: they compute strings and touch no React state.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
