---
id: collaborators-replaced-with-mocks
tdr_reference: tdr/collaborators-replaced-with-mocks.md
depends_on: [mirrored-spec-layout]
generated: 2026-10-23
---

# A unit spec builds its subject directly with mocked collaborators

Read `tdr/collaborators-replaced-with-mocks.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`mirrored-spec-layout`](mirrored-spec-layout.md) — renames the specs to their mirrored `.spec.ts` names (`utils.spec.ts` → `formatters.spec.ts`, `fitRequiredFields.spec.ts` → `fit.requiredFields.spec.ts`, every `.integration.test.ts` → `.integration.spec.ts`) and settles the `include` of `apps/web/vitest.config.ts` that item 2 edits next to; every spec path below is its post-rename path.

## Changes

1. Add the substitute library.
   Files: `apps/web/package.json`
   Change: From `apps/web/`, run `vp add -D vitest-mock-extended`.
   Check: `apps/web/package.json` `devDependencies` lists `vitest-mock-extended`; `vp install` from the root reports no unmet peer error (the root `pnpm-workspace.yaml` allows any `vitest` peer).

2. Clear spy history between tests.
   Files: `apps/web/vitest.config.ts`
   Change: Add `clearMocks: true` to the `test` block (next to `globals: true`). Do not add `mockReset`, `restoreMocks` or any `vi.resetAllMocks()` call.
   Check: `rg -n "clearMocks: true" apps/web/vitest.config.ts` prints one line; `rg -n "resetAllMocks|restoreAllMocks|mockReset\(" apps/web/tests` prints nothing; `vp test -- --run` from `apps/web/` passes with the same count.

3. Substitute the query client in the personal-best invalidation spec.
   Files: `apps/web/tests/features/records/hooks/usePersonalBests.spec.ts:2,18-23,26-50`
   Change: Delete the `setup()` helper that builds a real `new QueryClient()` and spies on it. At describe scope declare `let queryClient: MockProxy<QueryClient>;` and in `beforeEach` assign `queryClient = mock<QueryClient>();` then `queryClient.isFetching.mockReturnValue(0);` (`mock`, `MockProxy` from `vitest-mock-extended`; `beforeEach` from `vite-plus/test`; `QueryClient` becomes a type import). Each test seeds the cache read with `queryClient.getQueryData.mockReturnValue([pb('a')])` (or the shared PB factory if the test-data plan has already replaced `pb`) (or leaves it unset for "nothing computed yet"), calls `invalidatePersonalBestsOfSession(queryClient, …)`, and asserts `expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: PERSONAL_BESTS_KEY, refetchType: 'all' })` or `expect(queryClient.invalidateQueries).not.toHaveBeenCalled()`. The in-flight test sets `queryClient.isFetching.mockReturnValue(1)` instead of `vi.spyOn`. The subject receives the client as an argument, so it is the seam one layer below (R5).
   Check: `rg -n "new QueryClient|spyOn" apps/web/tests/features/records/hooks/usePersonalBests.spec.ts` prints nothing; `vp test -- --run tests/features/records/hooks/usePersonalBests.spec.ts` from `apps/web/` passes 4 tests.

4. Replace the hand-rolled `Response` stand-in in the weather spec.
   Files: `apps/web/tests/lib/weather.spec.ts:332-339,385`
   Change: `stubFetch = (body: unknown, ok = true)` building `vi.fn().mockResolvedValue({ ok, json: async () => body })` becomes `stubFetch = (body: unknown, status = 200)` building `vi.fn<typeof fetch>().mockResolvedValue(Response.json(body, { status }))`; the caller at line 385 `stubFetch({}, false)` becomes `stubFetch({}, 500)`. The real `Response` is a value, not a collaborator interface, so it replaces the partial object literal.
   Check: `rg -n "json: async \(\) =>" apps/web/tests` prints nothing; `vp test -- --run tests/lib/weather.spec.ts` from `apps/web/` passes with the same count.

5. Substitute the map in the DEM-settle spec of the 3D camera.
   Files: `apps/web/tests/features/map/terrainCamera.spec.ts:2,94-125,127-186`
   Change: Delete the `StubDem` interface and the `stubMap` helper (`:94-125`), which hand-rolls an object literal of `on`/`off`/`getTerrain`/`getSource`/`isSourceLoaded` and casts it with `stub as unknown as MapLibreMap` (`:124`). In `describe('whenTerrainSettled', …)` (`:127`) declare `let map: MockProxy<MapLibreMap>;` and `let listeners: Map<string, Set<() => void>>;`; the existing `beforeEach` (`:128-138`) keeps its `vi.useFakeTimers` call and then assigns `listeners = new Map();` and `map = mock<MapLibreMap>();` and wires `map.on` / `map.off` with `mockImplementation` to add / delete the listener in `listeners` and return `map`; a describe-local `fire = (type: string) => …` calls every listener of `type`. Each test stubs the DEM state on the fresh substitute instead of passing a `StubDem`: `map.getTerrain.mockImplementation(() => …)` returns `{ source: 'dem' }` (in the terrain-set-during-the-wait case `null` until the test flips its local state, then `{ source: 'terrain-dem' }`), `map.getSource.mockReturnValue(mock<Source>())` except in the case that passed `source: false` (left unstubbed, so it returns `undefined`), and `map.isSourceLoaded.mockImplementation(() => loaded)` reads a test-local `let loaded` that the test sets where it writes `loaded.value = true` / `dem.value = true` today. `mock` and `MockProxy` from `vitest-mock-extended`; `Map as MapLibreMap` and `Source` as type imports from `maplibre-gl` (`:2`). The five cases keep their titles, their timer steps, their fired event names and their `resolves.toBe(true|false)` assertions (R2, R3).
   Check: `rg -n "as unknown as|stubMap|StubDem" apps/web/tests/features/map/terrainCamera.spec.ts` prints nothing; `vp test -- --run tests/features/map/terrainCamera.spec.ts` from `apps/web/` passes 22 tests.

6. Title top-level describes with the subject's symbol in the `lib` specs.
   Files: every `apps/web/tests/lib/**/*.spec.ts` with a top-level `describe('<identifier>'` whose `<identifier>` is imported in the file (51 files, 94 titles — `weather.spec.ts` alone has 8, `formatters.spec.ts` 6, `mapCamera.spec.ts` 2 with the 3D `sessionMinZoom`; `crashReport.spec.ts`, `hooks/useChartZoom.integration.spec.ts` and `hooks/useMapHover.integration.spec.ts` included)
   Change: `describe('analyzeLaps', () => {` becomes `describe(analyzeLaps.name, () => {` — only when the quoted title is exactly one imported arrow-function identifier. Multi-word scenario titles (`describe('lap ranges', …)`, `describe('computePBsForSessions with recorded zeros', …)`) and nested describes keep their string. An arrow function's `.name` is its binding name, so the test report text is unchanged.
   Check: `vp test -- --run tests/lib` from `apps/web/` passes with the same test count and the same test names (compare `vp test -- --run tests/lib --reporter=json --outputFile=<scratch>/after.json` against a run taken before the item); `rg -n "^describe\('[A-Za-z_][A-Za-z0-9_]*'," apps/web/tests/lib` prints only titles that are not imported identifiers.

7. Title top-level describes with the subject's symbol in the remaining specs.
   Files: `apps/web/tests/features/**`, `apps/web/tests/parsers/**`, `apps/web/tests/store/filters.spec.ts` (the remaining 42 symbol titles, e.g. the 3D `terrainCamera.spec.ts` 7, `terrainLine.spec.ts` 6 and `hooks/useMapRendererHandOver.integration.spec.ts` 1, `zoneColoredPath.spec.ts` 3, `parsers/fit.spec.ts` 3, `previewDrawIn.spec.ts` 2, `trackPicking.spec.ts` 2, `fitSchemas.spec.ts` `enumStr`, `filters.spec.ts` `migrateFilters`)
   Change: The same rewrite as item 6. Two exceptions keep their string title because `.name` would not print the symbol: zustand store hooks (`describe('useTripsStore', …)` and the other eight `use…Store` titles in `apps/web/tests/store/` — `create()` returns a function named `useBoundStore`) and zod schemas (`describe('fitRecordSchema', …)` and the three other `…Schema` titles in `apps/web/tests/parsers/fitSchemas.spec.ts` — a schema has no `name`).
   Check: `rg -n "^describe\('[A-Za-z_][A-Za-z0-9_]*'," apps/web/tests` prints only the `use…Store` titles, the four `…Schema` titles and `toastStore` (`apps/web/tests/store/toast.spec.ts`, a store title that is not an imported identifier); `vp test -- --run` from `apps/web/` passes with the same count and names.

8. Rewrite the testing strategy's preference for real wiring.
   Files: `apps/web/tests/CLAUDE.md:12,14`
   Change: Line 12 becomes `- **Level**: A unit spec builds its subject directly and replaces every collaborator one layer below it with a \`mock<T>()\` / \`mockDeep<T>()\` substitute from \`vitest-mock-extended\`; it never lets the production wiring assemble the real graph. \`packages/engine\`, \`packages/gpx\` and \`src/lib/\` get unit specs. An \`*.integration.spec.ts\` exists only where the wiring itself is the behaviour (e.g. import → engine → store) — one spec per flow, plus one for a failure the user sees — and substitutes only what leaves the process (\`fetch\`, \`Worker\`, an IndexedDB failure). Never repeat a case at a second level.` Line 14 becomes `- **Style**: Assert outcomes (values, persisted state, visible text) and, on substitutes, the interactions with their arguments; not internal structure or snapshots (one exception: file-format output, see \`packages/gpx/CLAUDE.md\` § Rules, Tests). Substitutes are \`let\` at describe scope and rebuilt in \`beforeEach\` (\`clearMocks\` clears calls, not stubbed return values); reach a module-mocked export through \`vi.mocked(x)\`, never a cast; title the top-level \`describe\` with the subject's symbol (\`describe(subject.name, …)\`) except for zustand store hooks and zod schemas.`
   Check: `rg -n "call counts" apps/web/tests/CLAUDE.md` prints nothing; a human reads lines 12 and 14 and finds the wording above.

9. (packages/ui) Title the kit specs with their subject's symbol.
   Files: `packages/ui/tests/lib/scrollFade.spec.ts`, `packages/ui/tests/lib/sheetDrag.spec.ts`, `packages/ui/tests/hooks/useMediaQuery.spec.ts`, `packages/ui/tests/lib/slidingHighlight.spec.ts`
   Change: `scrollFade.spec.ts:4` `describe('scrollFadeEdges', …)` → `describe(scrollFadeEdges.name, …)`; `sheetDrag.spec.ts:4` → `describe(shouldDismiss.name, …)`; `useMediaQuery.spec.ts:9` → `describe(useMediaQuery.name, …)`; `slidingHighlight.spec.ts:7` `describe('sliding highlight', …)` → `describe(highlightRect.name, …)` (its only subject). `sheetPosition.spec.ts:17` (several functions) and `tokens.spec.ts:25` (an object) keep their string titles (R7).
   Check: `vp test -- --run` from `packages/ui/` passes and reports `scrollFadeEdges`, `shouldDismiss`, `useMediaQuery`, `highlightRect` as suite names.

## Open items

- `packages/ui`: kit specs exercise pure helpers and need no doubles; R1–R6 and R8 have nothing to change there.
- R4 (constructor-injected versus module-singleton substitution) is moot here: `apps/web` has no classes with injected collaborators. Module mocks (`vi.mock('@/lib/indexeddb.ts', importOriginal)` in `recomputeTrainingLoad` and `reprocessSessions`, `vi.mock('fit-file-parser')` in `fit.requiredFields`) stay as they are.
- `apps/web/tests/features/map/hooks/useGpsBackfill.integration.spec.ts:10-27` keeps its `FakeWorker` class: it counts live instances across `new Worker(…)` calls, which `mock<Worker>()` cannot express without a constructible stand-in, and the repo bans the `function` keyword.
- Integration specs that pass a real `QueryClient` into the wiring they test (`createIngestBatcher`, `runIntervalsSync`, `runIntervalsImport`) keep it: the client is part of the wiring under test there.
- No spec casts to `Mock`/`MockProxy` today (R6 grep prints nothing).

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
