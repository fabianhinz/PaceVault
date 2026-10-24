---
id: assertion-vocabulary
tdr_reference: tdr/assertion-vocabulary.md
depends_on: [mirrored-spec-layout]
generated: 2026-10-23
---

# Specs assert through a small, exact matcher vocabulary

Read `tdr/assertion-vocabulary.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`mirrored-spec-layout`](mirrored-spec-layout.md) — renames the specs below to their mirrored `.spec.ts` names (`storeEngine.integration.test.ts` → `sessions.engine.integration.spec.ts`, `lapsAnalysis.spec.ts` → `laps.spec.ts`, …) and fixes the `apps/web/tests/types/` home R8 declares matchers in; every spec path below is its post-rename path.

## Changes

Line numbers are as of this plan and can shift by a few lines after the mirrored-layout renames; each item names the grep that re-locates its sites. The test API stays imported from `vite-plus/test`.

1. Add the DOM matchers to the test setup.
   Files: `apps/web/package.json`, `apps/web/tests/setup.ts`, `apps/web/tests/types/jestDom.d.ts` (new)
   Change: From `apps/web/`, run `vp add -D @testing-library/jest-dom`. In `apps/web/tests/setup.ts` add `import '@testing-library/jest-dom/vitest';` directly below `import 'fake-indexeddb/auto';` (it registers the matchers with `expect.extend`; `vite-plus/test` re-exports `vitest`, so the augmented `Assertion` is the one specs get). Create `apps/web/tests/types/jestDom.d.ts` containing only `import '@testing-library/jest-dom/vitest';`, the one ambient declaration of the `toBeInTheDocument`/`toBeDisabled`/… augmentation.
   Check: `apps/web/package.json` `devDependencies` lists `@testing-library/jest-dom`; `vp check` from the root is clean; `vp test -- --run` from `apps/web/` passes with the same count as before.

2. Assert the cache invalidation with its arguments.
   Files: `apps/web/tests/features/records/hooks/usePersonalBests.spec.ts:29,48`
   Change: Both bare `expect(ctx.invalidate).toHaveBeenCalled();` become `expect(ctx.invalidate).toHaveBeenCalledWith({ queryKey: PERSONAL_BESTS_KEY, refetchType: 'all' });` — the exact call `invalidatePersonalBests` makes (`apps/web/src/features/records/hooks/usePersonalBests.ts:58`). The two `.not.toHaveBeenCalled()` lines stay (R2). If the collaborators plan has already renamed `ctx.invalidate` to `queryClient.invalidateQueries`, apply the same argument list to that name.
   Check: `rg -n "toHaveBeenCalled\(\)" apps/web/tests` prints only `.not.toHaveBeenCalled()` lines.

3. Replace truthiness assertions with exact ones.
   Files: `apps/web/tests/store/sessions.engine.integration.spec.ts:39-40`, `apps/web/tests/store/user.integration.spec.ts:29`
   Change: Delete `expect(coaching.status).toBeTruthy();` (line 41 already asserts `toContain` over the five `FormStatus` values); `expect(coaching.message).toBeTruthy();` becomes `expect(coaching.message).not.toBe('');`; `expect(profile?.id).toBeTruthy();` becomes `expect(profile?.id).toEqual(expect.any(String));`.
   Check: `rg -n "toBe(Truthy|Falsy)\(" apps/web/tests` prints nothing.

4. Replace length comparisons with `toHaveLength`.
   Files: `apps/web/tests/lib/dynamicLaps.spec.ts:45`, `apps/web/tests/lib/records.computePbsForSessions.spec.ts:43`, `apps/web/tests/lib/chartBuckets.spec.ts:40`
   Change: `expect(result.analysis.length).toBe(3)` → `expect(result.analysis).toHaveLength(3)`; `expect(powerPBs.length).toBe(5)` → `expect(powerPBs).toHaveLength(5)`; `expect(out.length).toBe(100)` → `expect(out).toHaveLength(100)`.
   Check: `rg -n "expect\([^)]*\.length\)\.(toBe|toEqual)\(" apps/web/tests` prints nothing.

5. Replace computed-predicate assertions in the chart specs.
   Files: `apps/web/tests/lib/chartBuckets.spec.ts:43,49,59,60,66,82,83,126,127`, `apps/web/tests/lib/chartData.spec.ts:36,37,69,134`, `apps/web/tests/lib/chartData.integration.spec.ts:32,42`
   Change: Apply the three rewrites below to every `expect(<xs>.every|some(<p>)).toBe(true|false)` site; `<p>` is kept verbatim.
   - `expect(xs.every((r) => P)).toBe(true)` → `expect(xs.filter((r) => !(P))).toEqual([])`
   - `expect(xs.some((r) => P)).toBe(false)` → `expect(xs.filter((r) => P)).toEqual([])`
   - `expect(xs.some((r) => P)).toBe(true)` → `expect(xs.filter((r) => P)).not.toEqual([])`
   For example `chartBuckets.spec.ts:49` `expect(out.some((r) => r.power === null)).toBe(false);` becomes `expect(out.filter((r) => r.power === null)).toEqual([]);`, and `chartData.spec.ts:69` `expect(gaps.slice(1).every((g) => g < pace)).toBe(true);` becomes `expect(gaps.slice(1).filter((g) => !(g < pace))).toEqual([]);`.
   Check: `rg -n "expect\([^;]*\.(some|every)\([^;]*\)\s*\)?\s*\.(not\.)?toBe\(\s*(true|false)\s*\)" apps/web/tests/lib/chartBuckets.spec.ts apps/web/tests/lib/chartData.spec.ts apps/web/tests/lib/chartData.integration.spec.ts` prints nothing; `vp test -- --run tests/lib` from `apps/web/` passes with the same count.

6. Replace computed-predicate assertions in the records, laps and validation specs.
   Files: `apps/web/tests/lib/records.computePbsForSessions.spec.ts:44,45,91,117,141,224`, `apps/web/tests/lib/laps.spec.ts:52,64`, `apps/web/tests/lib/validation.integration.spec.ts:75`
   Change: The same three rewrites as item 5. `laps.spec.ts:52` `expect(analyzeLaps(laps).some((lap) => lap.isInterval)).toBe(false);` becomes `expect(analyzeLaps(laps).filter((lap) => lap.isInterval)).toEqual([]);`. `validation.integration.spec.ts:75` `expect(warnings.some((w) => w.code === 'power_above_max')).toBe(true);` becomes `expect(warnings).toContainEqual(expect.objectContaining({ code: 'power_above_max' }));`.
   Check: the item-5 grep over these three files prints nothing; `vp test -- --run tests/lib` from `apps/web/` passes with the same count.

7. Replace computed-predicate assertions in the feature specs.
   Files: `apps/web/tests/features/intervals/runIntervalsSync.integration.spec.ts:120,130,162,163`, `apps/web/tests/features/demo/buildDemoDataset.spec.ts:101,119,162,193,196,200`, `apps/web/tests/features/map/hooks/useMapTracks.integration.spec.ts:92`
   Change: The same three rewrites as item 5, except the two URL checks: `expect(urls.some((u) => u.includes('/activity/i100/'))).toBe(false);` becomes `expect(urls).not.toContainEqual(expect.stringContaining('/activity/i100/'));` and the `i200` line becomes `expect(urls).toContainEqual(expect.stringContaining('/activity/i200/'));`.
   Check: `rg -n "expect\([^;]*\.(includes|some|every|indexOf|startsWith|endsWith)\([^;]*\)\s*\)?\s*\.(not\.)?toBe(Truthy|Falsy|\(\s*(true|false)\s*\))" apps/web/tests` prints nothing; `vp test -- --run` from `apps/web/` passes with the same count as before item 1.

8. Replace the camera assertion helper of the 3D camera spec with one structural assertion (R8).
   Files: `apps/web/tests/features/map/terrainCamera.spec.ts:32-39,43-44`
   Change: Delete `expectCamera` (`:32-39`), a helper that wraps six `expect(…).toBeCloseTo(…, 9)` calls. Its two call sites (`:43-44`) become one `toEqual` each with `expect.closeTo` per field, the same precision as today: `expect(interpolateTerrainCamera({ from: start, to: target, progress: 0 })).toEqual({ center: [expect.closeTo(start.center[0], 9), expect.closeTo(start.center[1], 9)], zoom: expect.closeTo(start.zoom, 9), pitch: expect.closeTo(start.pitch, 9), bearing: expect.closeTo(start.bearing, 9), elevation: expect.closeTo(start.elevation, 9) });` and the same against `target` for `progress: 1`. A file-local `closeToCamera = (camera: TerrainCamera) => ({ center: [expect.closeTo(camera.center[0], 9), …], … })` that only builds the expected value (no `expect(…)` call inside) is allowed if the two literals read too long. `TerrainCamera` has exactly these five fields, so `toEqual` checks nothing the helper did not.
   Check: `rg -n "expectCamera" apps/web/tests` prints nothing; `rg -c "toBeCloseTo\(" apps/web/tests/features/map/terrainCamera.spec.ts` prints 6 fewer than before the item; `vp test -- --run tests/features/map/terrainCamera.spec.ts` from `apps/web/` passes 22 tests.

9. Write the vocabulary into the testing strategy.
   Files: `apps/web/tests/CLAUDE.md` (one new bullet directly after the **Style** bullet, line 14)
   Change: Insert `- **Assertions**: Interactions with their arguments (\`toHaveBeenCalledWith\`; bare \`toHaveBeenCalled\` only for a call whose arguments the spec does not determine), absence as \`.not.toHaveBeenCalled()\`; \`toBe\` for primitives, \`toEqual\` for objects and arrays; booleans as \`toBe(true)\`/\`toBe(false)\`, never \`toBeTruthy\`/\`toBeFalsy\`; never a computed predicate — \`toContain\`, \`toContainEqual\`, \`toHaveLength\`, \`toThrow\`/\`rejects\` or \`filter(…)\` against \`[]\`; DOM facts through jest-dom (\`toBeInTheDocument\`, \`toBeDisabled\`, \`toHaveValue\`); no file snapshots, inline snapshots only for short literal text (exception: file-format output, \`packages/gpx/CLAUDE.md\` § Rules, Tests). A new matcher is registered with \`expect.extend\` in \`apps/web/tests/setup.ts\` and declared in \`apps/web/tests/types/\`, never written as a helper that wraps \`expect\`.` Line 20 (imports from `vite-plus/test`) stays.
   Check: `rg -n "\*\*Assertions\*\*" apps/web/tests/CLAUDE.md` prints one line directly below the Style bullet; `rg -n "setup\.ts" apps/web/tests/CLAUDE.md` prints the Setup line and the new Assertions line.

10. (packages/engine) Replace the computed-predicate assertions in the engine specs (R5).
   Files: `packages/engine/tests/normalize.spec.ts` (or `normalizedEffort.spec.ts`), `packages/engine/tests/gradient.spec.ts`, `packages/engine/tests/effortDetection.spec.ts`
   Change: `normalize.spec.ts:105` `expect(uphill.every((f, i) => i === 0 || f > (uphill[i - 1] ?? Infinity))).toBe(true)` → `expect(uphill.filter((f, i) => i > 0 && f <= (uphill[i - 1] ?? -Infinity))).toEqual([])`; `gradient.spec.ts:29` `expect(gradients.slice(101, 111).every((g) => g === undefined)).toBe(true)` → `expect(gradients.slice(101, 111).filter((g) => g !== undefined)).toEqual([])`; `effortDetection.spec.ts:251` `expect(efforts.some((block) => block.start < 1530 && block.end > 1680)).toBe(false)` → `expect(efforts.filter((block) => block.start < 1530 && block.end > 1680)).toEqual([])` (`startSec`/`endSec` if the comments plan already renamed the fields). Each replacement fails on exactly the inputs the old assertion failed on and prints the offending entries.
   Check: `rg -n "\.(every|some)\(.*\)\)\.toBe\((true|false)\)" packages/engine/tests` prints nothing; `vp test -- --run` from `packages/engine/` passes with the same count.

### packages/gpx

11. (packages/gpx) Assert the profile lengths with `toHaveLength` (R5).
   Files: `packages/gpx/tests/routeProfile.spec.ts`
   Change: `expect(profile.elevation.length).toBe(profile.grade.length)` (`:33`) → `expect(profile.grade).toHaveLength(profile.elevation.length)`; `expect(profile.elevation.length).toBe(5000)` (`:76`) → `expect(profile.elevation).toHaveLength(5000)`.
   Check: `rg -n "\.length\)\.toBe\(" packages/gpx/tests` prints nothing; `vp -C packages/gpx exec vitest run` passes with the same count.

### tools/workbench

12. (tools/workbench) Assert the board's error list by membership, not by a predicate (R5).
   Files: `tools/workbench/tests/site/src/actions/index.read.spec.ts` (`tools/workbench/tests/boardRead.spec.ts` before the mirrored-spec plan)
   Change: `expect(board.errors.some((error) => error.includes('backlog/zz-broken/plan.md'))).toBe(true);` (today `:106`) → `expect(board.errors).toContainEqual(expect.stringContaining('backlog/zz-broken/plan.md'));`; `expect(board.errors.some((error) => error.includes('backlog/d-small/'))).toBe(false);` (today `:226`) → `expect(board.errors.filter((error) => error.includes('backlog/d-small/'))).toEqual([]);`.
   Check: `rg -n "\.(some|every)\(" tools/workbench/tests` prints nothing; `vp test -- --run` from `tools/workbench/` passes 66 tests.

## Open items

- R6 has no call site today (no spec asserts on DOM nodes); item 1 makes the jest-dom matchers available for the first one.
- R7: no `toMatchSnapshot`, `toMatchFileSnapshot`, `toMatchInlineSnapshot` or `.snap` file exists under `apps/web/tests/`; nothing to change.
- R9 (import `expect` from `vitest`) dropped by the owner: specs keep importing the test API from `vite-plus/test`.
- 3D map specs: `expect(samples.length).toBeLessThanOrEqual(70)` (`apps/web/tests/features/map/terrainCamera.spec.ts:281`) asserts an upper bound, not a length, and stays, like the engine's lower-bound checks below. `terrainLine.spec.ts`'s `zoomStops` builds a value and wraps no `expect`, so R8 does not reach it.
- `toEqual` on primitives stays acceptable here; only `toBe` on a structure literal is wrong (R3 grep prints nothing today).
- `packages/ui`: kit specs already conform; with no component specs, the kit has no jest-dom and no setup file, so R6 and R8 have nothing to govern there.

- `packages/engine`: the length checks `expect(x.length).toBeGreaterThan(0)` (`metrics.spec.ts:17,22`) and `toBeGreaterThanOrEqual(2)` (`effortDetection.spec.ts:338`) assert a lower bound, not a length, and stay. R6 and R8 have nothing to govern in the node-only engine specs; R7 holds (no snapshot), apart from the temporary pinned specs other plans create and delete.

- `packages/gpx`: R7's one exception is the GPX golden file — `packages/gpx/tests/buildGpx.spec.ts:25` keeps `toMatchSnapshot()` and `packages/gpx/tests/__snapshots__/buildGpx.spec.ts.snap` stays (owner decision, `packages/gpx/CLAUDE.md:10`). The sums `before.length + after.length` (`routeCut.spec.ts:115`) and `joined.length - real.length` (`:63`) assert a count derived from two lists, not a list's length, and stay. R6 and R8 have nothing to govern in the jsdom specs without jest-dom.
- `tools/workbench`: the hook specs assert a blocked call with `toBeDefined()` on the reason; naming the exact message is not part of R5 and stays as is.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
