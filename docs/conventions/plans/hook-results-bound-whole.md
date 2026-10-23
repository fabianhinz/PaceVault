---
id: hook-results-bound-whole
tdr_reference: tdr/hook-results-bound-whole.md
generated: 2026-10-23
---

# Bind a hook's result whole and read through the name

Read `tdr/hook-results-bound-whole.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Rename the stand-in bindings of hook results to the noun they hold.
   Files: `apps/web/src/components/charts/ChartRail.tsx`, `apps/web/src/features/dashboard/LoadChart.tsx`, `apps/web/src/features/records/SportsRecords.tsx`, `apps/web/src/features/sessions/session/WeatherCard.tsx`, `apps/web/src/features/labs/hooks/useRacePredictor.ts`, `apps/web/src/features/labs/hooks/useCoachPlan.ts`, `apps/web/src/features/settings/PaceEstimatorDialog.tsx`
   Change: rename each binding and every read of it in the same function:
   - `apps/web/src/components/charts/ChartRail.tsx:26` `const x = useChartHoverX(props.group);` -> `const hoveredX = ...` (reads at `:30`, `:31`, `:33`).
   - `apps/web/src/components/charts/ChartRail.tsx:77` `const x = useChartHoverX(props.group);` -> `const hoveredX = ...` (reads at `:78`, `:82`, `:83`).
   - `apps/web/src/features/dashboard/LoadChart.tsx:73` `const x = useChartHoverX(DASHBOARD_HOVER_GROUP);` -> `const hoveredX = ...` (reads at `:74`, `:75`).
   - `apps/web/src/features/records/SportsRecords.tsx:9` `const query = usePersonalBests();` -> `const personalBests = usePersonalBests();` (`query.data`, `query.isPending` -> `personalBests.data`, `personalBests.isPending`).
   - `apps/web/src/features/sessions/session/WeatherCard.tsx:129` `const query = useSessionWeather(...)` -> `const sessionWeather = useSessionWeather(...)` (`query.data` at `:130`, `query.isLoading` at `:134`).
   - `apps/web/src/features/labs/hooks/useRacePredictor.ts:9` `const result = useMemo(...)` -> `const prediction = useMemo(...)` (`result?.vdot`, `result?.predictions` -> `prediction?.vdot`, `prediction?.predictions`).
   - `apps/web/src/features/labs/hooks/useCoachPlan.ts:34` `const result = useMemo(...)` -> `const resolvedPlan = useMemo(...)` (reads at `:62-68`).
   - `apps/web/src/features/settings/PaceEstimatorDialog.tsx:35` `const result = useMemo(...)` -> `const estimatedPace = useMemo(...)` (reads in `handleSave` and the render below).
   Line numbers are today's; if another plan has moved a component (one-component-per-module) rename it where it now lives.
   Check: `rg -n "const (query|data|result|value|res|x) = use[A-Z]" apps/web/src` prints nothing; `vp check` passes.

2. Bind every `renderHook` result whole in the app tests.
   Files: `apps/web/tests/lib/hooks/useMapHover.integration.test.ts`, `apps/web/tests/lib/hooks/useChartZoom.integration.test.ts`
   Change: the 14 `const { … } = renderHook(...)` bindings become `const hook = renderHook(...)`, and every read goes through `hook`: `result.current.x` -> `hook.result.current.x`, `unmount()` -> `hook.unmount()`, `rerender(...)` -> `hook.rerender(...)`. The same shape already exists at `apps/web/tests/features/map/hooks/useMapTracks.integration.test.ts:29`. The sites:
   - `apps/web/tests/lib/hooks/useMapHover.integration.test.ts:25`, `:40`, `:56` (`{ result }`, reads at `:28,33`, `:43,49`, `:59,65`) and `:75` (`{ unmount }`, call at `:76`).
   - `apps/web/tests/lib/hooks/useChartZoom.integration.test.ts:31`, `:39`, `:54`, `:66`, `:77`, `:90`, `:104`, `:140`, `:155` (`{ result }`), and `:123` (`{ result, rerender }`, `rerender` at `:133`). The `({ data }) =>` callback parameter at `:123` is a destructured parameter object, not a hook result, and stays.
   Line numbers are today's; if the spec-layout plan has moved or renamed these files, apply the change where they now live.
   Check: `rg -nU "const\s*\{[^}]*\}\s*(:[^=]*)?=\s*(renderHook|use[A-Z]\w*)\s*[(<]" apps/web/tests` prints nothing; `vp run test` green.

## Open items

- R1 and R3 already hold in `apps/web/src`: a multi-line scan (`rg -nU "const\s*\{[^}]*\}\s*(:[^=]*)?=\s*use[A-Z]\w*\s*[(<]" apps/web/src`) finds no destructured or renamed object binding of a hook result; every destructured binding is a positional pair (`useState`, `useTransition`, `useSearchParams`).
- R5 (carve-outs for third-party bag-of-callables hooks and for test render results) is dropped by owner decision: no exemption for tests or third-party hooks. The existing `CLAUDE.md:28` line ("No object destructuring for component props and hook return values") already states that, so it is not rewritten here; its example `result.x` uses a stand-in name R2 forbids — whether to reword that example is an owner question.
- `const store = useStudioStore.getState()` (`apps/web/src/features/studio/StudioRouteFormDialog.tsx:36`, `apps/web/src/features/studio/markers/StudioMarkerDialog.tsx:113`) is a store snapshot, not a hook call, and is out of this record's scope.
- `packages/ui`: already conforms (`const device = useDevice()`, `const grabber = useGrabberDrag()`, single-member reads such as `useContext(…).register` are R4).

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
