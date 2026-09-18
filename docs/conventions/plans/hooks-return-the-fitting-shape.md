---
id: hooks-return-the-fitting-shape
tdr_reference: tdr/hooks-return-the-fitting-shape.md
generated: 2026-09-17
---

# A hook returns the shape its call site needs

Read `tdr/hooks-return-the-fitting-shape.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Annotate the return type of the five `src/lib/hooks/` and `src/hooks/` modules that lack one.
   Files: `src/lib/hooks/useIsDesktop.ts`, `useSyncedChartZoom.ts`, `useMediaQuery.ts`, `useMapHover.ts`, `useWatchPositionEffect.ts`
   Change: add an explicit return-type annotation to each exported hook — `: boolean` for `useIsDesktop` and `useMediaQuery`, `: void` for `useWatchPositionEffect`, and for the two that return several members a named `interface` declared beside the hook in the same module (R3). The annotation, not the body, is the contract.
   Check: `grep -nE "^export const use[A-Za-z]+ = \(.*\) => \{" src/lib/hooks src/hooks -r` returns nothing; `pnpm check`.

2. Annotate the ten feature hooks under `src/features/{labs,settings,studio,dashboard}/hooks/`.
   Files: `src/features/labs/hooks/usePaceCalculator.ts`, `useRacePredictor.ts`, `src/features/settings/hooks/useReimport.ts`, `src/features/studio/hooks/useStudioSegmentExport.ts`, `useGpxImport.ts`, `useStudioRoutesPopup.ts`, `useStudioRoutePoints.ts`, `useStudioMapPopup.ts`, `src/features/dashboard/hooks/useDashboardChartZoom.ts`
   Change: same treatment. Where the hook returns one thing, annotate that type bare and do not wrap it in an object (R4). Where it returns several, declare a named interface in the hook's own module and annotate with the name; keep the interface unexported unless a consumer names it.
   Check: `pnpm check`; each listed file's exported hook has a `):` before its arrow body.

3. Annotate the remaining map and sessions hooks.
   Files: `src/features/map/hooks/useMapPopupState.ts`, `useMapTracks.ts`, `useGeolocationCameraEffect.ts`, `useGpsBackfill.ts`, `useDismiss.ts`, `src/features/sessions/charts/hooks/useZoneData.ts`, `src/features/sessions/hooks/useFileUpload.ts`, `useFileDropEffect.ts`, `src/features/sessions/session/hooks/useEditInStudio.ts`, `useSessionExport.ts`
   Change: same treatment. `useGeolocationCameraEffect` and `useFileDropEffect` are effect hooks and annotate `: void`. `useEditInStudio` and `useSessionExport` each return a small composite and get a named interface.
   Check: R2's detection grep returns nothing across all of `src/`; `pnpm check && pnpm test -- --run`.

4. Unwrap any single-member object return, and convert any non-`useState`-shaped tuple.
   Files: whichever of the hooks touched in items 1–3 return `{ x }` for a single `x`, or a positional tuple
   Change: a hook that produces one thing returns it bare (R4). A tuple is reserved for a value-and-setter pair mirroring `useState`/`useReducer` (R6); any other multi-member return becomes a named composite. Apply this while adding each annotation rather than as a separate pass, so a call site is updated once.
   Check: `pnpm check && pnpm test -- --run && pnpm exec playwright test`.

5. Leave the React Query hook's result object intact.
   Files: `src/features/sessions/session/hooks/useSessionWeather.ts`
   Change: no unwrapping. R5 requires a hook wrapping a server call to return the query library's result object unchanged, with its full `UseQueryResult<…>` annotation. Add that annotation if it is missing; do not pick fields off it.
   Check: the hook's annotation reads `UseQueryResult<…>`; `pnpm check`.

## Open items

None.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
