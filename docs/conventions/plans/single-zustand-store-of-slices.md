---
id: single-zustand-store-of-slices
tdr_reference: tdr/single-zustand-store-of-slices.md
generated: 2026-10-23
---

# Store state: initial state as a value, narrow selections, draft writes

Read `tdr/single-zustand-store-of-slices.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

The per-scope stores in `apps/web/src/store/<name>.ts` stay as they are: one `create` per module, persist key `store-<name>`, actions inside the store called through `getState()`. Only three things change. Every item's Check includes `vp run check` clean and `vp run test` green.

1. Export the initial state of the stores that `apps/web/tests/setup.ts` resets, and reset through it (R5).
   Files: `apps/web/src/store/user.ts:115-116,181`, `apps/web/src/store/sessions.ts:74-76`, `apps/web/src/store/coachPlan.ts:17-19`, `apps/web/src/store/intervals.ts:21-25,33-39`, `apps/web/src/store/mapPreferences.ts:99-101,120`, `apps/web/src/store/importProgress.ts:41-45`, `apps/web/src/store/sessionReprocessing.ts:14-16`, `apps/web/tests/setup.ts:4-10,28-53`.
   Change: in each store module, the data-field literals at the head of the creator move into a module-level `export const INITIAL_<NAME>_STORE_STATE: Pick<<Name>State, …data fields…> = { … }` above the `create` call, and the creator's returned object starts with `...INITIAL_<NAME>_STORE_STATE` followed by the actions. Names: `INITIAL_USER_STORE_STATE` (`profile`), `INITIAL_SESSIONS_STORE_STATE` (`sessions`, `appliedHrSignature`), `INITIAL_COACH_PLAN_STORE_STATE` (`cachedPlan`, `cacheKey`), `INITIAL_INTERVALS_STORE_STATE` (`apiKey`, `importedActivityIds`, `keyInvalid`, `backlogPending`), `INITIAL_MAP_PREFERENCES_STORE_STATE` (`trackIntensity: 'warm'`, `bySport: defaultBySport()`), `INITIAL_IMPORT_PROGRESS_STORE_STATE` (`runningImports`, `foreground`, `awaitingTrackBuild`, `mapCrashed`), `INITIAL_SESSION_REPROCESSING_STORE_STATE` (`phase`, `newerVersionInOtherTab`). Actions that restate the whole initial state use the constant: `disconnectIntervals` (`intervals.ts:33-39`) → `set(INITIAL_INTERVALS_STORE_STATE)`, `resetMapPreferences` (`mapPreferences.ts:120`) → `set(INITIAL_MAP_PREFERENCES_STORE_STATE)`, `resetProfile` (`user.ts:181`) → `set(INITIAL_USER_STORE_STATE)`; `sessions.ts:124` `clearAll` resets only `sessions` and stays. In `tests/setup.ts`, each `resetStateKeepingActions(use<Name>Store, { … })` call at `:28-53` passes `INITIAL_<NAME>_STORE_STATE` instead of its object literal, imported beside the store hook at `:4-10`. Persist keys, versions, `migrate` and `partialize` are untouched.
   Check: `rg -n "export const INITIAL_[A-Z_]+_STORE_STATE" apps/web/src/store` lists exactly these seven; `rg -n "resetStateKeepingActions\(\w+, \{" apps/web/tests/setup.ts` prints nothing.

2. Export the initial state of the stores that a spec resets in `beforeEach`, and reset through it (R5).
   Files: `apps/web/src/store/trips.ts:29-30,85`, `apps/web/src/store/studio.ts:66-67,128`, `apps/web/src/store/toast.ts:13-14`, `apps/web/src/store/layout.ts:23-28`, `apps/web/src/store/mapFocus.ts:25-48`, `apps/web/src/store/mapControls.ts:35-84`, `apps/web/src/store/geolocation.ts:19-23`, `apps/web/tests/store/trips.spec.ts:6`, `apps/web/tests/store/studio.spec.ts:20`, `apps/web/tests/store/toast.spec.ts:6`, `apps/web/tests/store/layout.spec.ts:14-18`, `apps/web/tests/store/mapFocus.spec.ts:8-18`, `apps/web/tests/store/mapControls.spec.ts:7-12`, `apps/web/tests/store/geolocation.spec.ts:6-11`.
   Change: same shape as item 1 for `INITIAL_TRIPS_STORE_STATE` (`trips`), `INITIAL_STUDIO_STORE_STATE` (`routes`), `INITIAL_TOAST_STORE_STATE` (`toasts`), `INITIAL_LAYOUT_STORE_STATE` (`onboardingComplete`, `demoMode`, `mobileSheetPosition`), `INITIAL_MAP_FOCUS_STORE_STATE` (`openedSessionId`, `hoveredSessionId`, `focusedTripSessionIds`, `hoveredStudioRouteId`, `hoveredPoint`, `pickCircle`, `mapRefitRequest`), `INITIAL_MAP_CONTROLS_STORE_STATE` (`trackColorMode`, `sessionLaps`, `selectedLapIndex`, `lapCloseCount`, `hoveredLapIndex`, `overviewMapControlsShown`, `sessionMapView`, `terrainTrackHovered`), `INITIAL_GEOLOCATION_STORE_STATE` (`tracking`, `position`, `accuracy`, `error`). In `mapFocus.ts` and `mapControls.ts` the data fields are interleaved with the actions; each field literal leaves its position and joins the constant, the actions keep their order. `mapControls.ts:68-83` `resetSessionControlsOnSessionOpen`/`Close` reset only some fields and stay literal. `trips.ts:85` and `studio.ts:128` `clearAll` → `set(INITIAL_TRIPS_STORE_STATE)` / `set(INITIAL_STUDIO_STORE_STATE)`. Each listed spec's `beforeEach` calls `use<Name>Store.setState(INITIAL_<NAME>_STORE_STATE)` instead of its literal; `mapFocus.spec.ts` resets both stores that way. The mapFocus, mapControls and layout specs reset fewer fields today than the constant holds; the full reset is the intended isolation and every assertion stays.
   Check: `rg -n "export const INITIAL_[A-Z_]+_STORE_STATE" apps/web/src/store` lists fourteen; `rg -nA6 "beforeEach" apps/web/tests/store/{trips,studio,toast,layout,mapFocus,mapControls,geolocation}.spec.ts | rg "setState\(\{"` prints nothing.

3. Select the marker-editor fields instead of the whole store (R9).
   Files: `apps/web/src/features/studio/markers/StudioMarkerDialog.tsx:1-5,33`.
   Change: `const editor = useStudioMarkerEditorStore();` subscribes to the whole store. Replace it with `const editor = useStudioMarkerEditorStore(useShallow((s) => ({ open: s.open, routeId: s.routeId, markerId: s.markerId, type: s.type, initialDistanceM: s.initialDistanceM })));` with `import { useShallow } from 'zustand/react/shallow';`. Every `editor.*` read below (`:34-40`, `:63`, `:75`, `:83`, `:121-137`) stays as it is; the dialog no longer reads the store's actions through `editor`.
   Check: `rg -n "use[A-Z]\w*Store\(\s*\)" apps/web/src` prints nothing; opening, editing and closing a marker in `vp dev` behaves as before (human check), `vp run e2e` green.

## Open items

- Kept per-scope stores (owner): R1–R4 (one `create`, slice directories, slice creator and type naming), R6 (one `persist(immer)` stack under one key with a global migrate chain) and R7 (actions in `actions/*Actions.ts` bundles) are dropped; R8 (devtools action labels) was already dropped. `apps/web/CLAUDE.md` and `apps/web/src/store/CLAUDE.md` keep their store wording.
- R5 is scoped to stores whose initial state is restated somewhere — by `apps/web/tests/setup.ts`, a spec's `beforeEach`, or the store's own reset action. `chartHover`, `filters`, `onboarding` and `studioMarkerEditor` have no such restatement today (`tests/store/filters.spec.ts:20` resets through `resetFilters()`), so they get no constant.
- R10 already holds: no `set` recipe in `apps/web/src/store/*.ts` returns a spread copy of state (`sessions.ts:79` spreads an incoming session, not the state). The partial-object form `set({ field: value })` is a replace, not a spread copy, and stays — the root `CLAUDE.md` code rules allow "replacing the object outright".
- `apps/web/src/features/sessions/session/hooks/useSessionLapsEffect.ts:21` uses a block-bodied selector, but it returns the stored `s.bySport[sport]` reference, not a fresh object, so R9 needs no `useShallow` there.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
