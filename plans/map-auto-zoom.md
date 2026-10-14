# Map auto-zoom (PLAN, ready for review)

Source: audit `mockups/map-auto-zoom/report.html` (static analysis, 2026-10-13), claims verified against the code on 2026-10-14.

## Context

Three hooks move the camera: `useMapCameraEffect` (overview, session, trip, Studio; `src/features/map/hooks/useMapCameraEffect.ts:18-72`), `useLapCameraEffect` (`src/features/map/hooks/useLapCameraEffect.ts:34-50`) and `useGeolocationCameraEffect` (`src/features/map/hooks/useGeolocationCameraEffect.ts:11-27`). The first two re-fit on every new array/object identity: `tracks` is rebuilt on any change to sessions, GPS, filter, opened session or trip focus (`src/features/map/hooks/useMapTracks.ts:86`), and GPS is re-read after every sessions change (`src/features/map/hooks/useGpsBackfill.ts:61`). No fit checks whether the user moved the map; every fit is animated (800–1200 ms). No camera view is stored anywhere.

## Decisions (walkthrough, one entry at a time)

1. **App start fly-in** (debatable): keep the animated fly-in from the default view to the densest cluster, but it runs once; no second fit from the GPS re-read.
2. **Background GPS arriving** (jarring): background data never moves the camera; new tracks just appear. The start fit from 1 counts as the initial load, not background data: it waits until the initial GPS read has delivered tracks, then fits once.
3. **Back from a session to the overview** (jarring): the camera stays where it is; the overview tracks are drawn around the session's area. No restore, no fit.
4. **Opening a session** (jarring: first fit aims at `tracks[0]` of the overview list): fit immediately, once, to the clicked session's bounds taken from the in-memory GPS list (`gpsData`, already holds `gps.bounds` per session; today the opened path re-reads it via `getSessionGPS`, `src/features/map/hooks/useMapTracks.ts:33`). If `gpsData` isn't loaded yet (reload/deep link), fit once when the session's own GPS arrives.
5. **Opening a "new" session** (jarring: `markSessionSeen` + GPS re-read add two fits): no move. Same rule as 2: after the open fit, sessions-store changes never move the camera on the session page.
6. **Reload / deep link on a session** (jarring: second fit when `gpsData` arrives): one animated fit when the session's own GPS arrives; the later GPS list doesn't move the camera (follows from 2 + 4).
7. **Tap on empty map with a lap selected** (debatable): nothing happens. A map tap no longer clears the lap (`src/features/map/DeckGLOverlay.tsx:420`); only explicit controls (X, Escape, re-click the lap) clear it, and those still zoom out to the whole session.
8. **Lap re-fit on unrelated changes** (jarring: colour mode, weather, profile, sessions rebuild the detail path, `src/features/map/hooks/useSessionDetailPath.ts:60-85`): the lap camera fits only when the lap changes, keyed on (session id, lap index), not on the path array (`src/features/map/hooks/useLapCameraEffect.ts:50`).
9. **Lap zoom lost on background data** (jarring: lap fit and whole-session fit race): one owner for the session-page camera. Session and lap camera merge into one decision point: target is the selected lap, else the session. Background data never moves it (2, 5).
10. **Lap grouping change clears the lap** (debatable): camera stays. Only an explicit close (X, Escape, re-click) zooms out to the session; an indirect clear (lap source / split distance, `src/store/mapControls.ts:42-51`) leaves the view as is.
11. **Deleting the open session** (debatable: three moves): exception to 3. The frame's subject is gone, so one fit to the densest cluster once the overview tracks (without the deleted session) have loaded. No stale first move, no repeat from the GPS re-read. Same rule for routes, see 17.
12. **Opening a trip** (jarring: first fit covers all activities, `src/features/map/hooks/useMapCameraEffect.ts:56-57`): fit immediately, once, to the union of the trip sessions' bounds from the in-memory GPS list, consistent with 4. Before `gpsData` is loaded, fit once when it arrives.
13. **Leaving a trip** (jarring: two moves): camera stays where it is, same as 3.
14. **Session ↔ trip** (jarring: two moves each way): trip → session follows 4. Session → trip (back) follows 12: arriving on a trip page always fits the whole trip once, regardless of where you came from. So "back stays" (3, 13) applies only when the destination is an overview page.
15. **StrictMode trip focus flicker** (debatable, dev only): no action. Verification judges camera behaviour in a prod preview as well.
16. **Back from a route to the Studio tab** (debatable): camera stays, like 3. Entering the Studio tab from outside Studio still fits all routes (the audit rates that good).
17. **Route import / delete / edit on the Studio tab** (debatable): never moves the camera. A route-list change no longer counts as a new target (today any `routes` change creates a new `unionBounds`, `src/features/map/hooks/useStudioMapTracks.ts:70`). Exception, aligned with 11: deleting a route from its detail page (navigates to `/labs?tab=studio`, `src/features/studio/StudioActionsMenu.tsx:48`) fits all remaining routes once.
18. **Session data re-fits Studio** (jarring): decouple fully. While Studio owns the map, session tracks aren't built at all, so session data can't reach the Studio camera.
19. **Filter change on the overview** (jarring when nothing visible changed): fit only if the set of visible track ids changed; same set, no move. A changed set fits once to the densest cluster.
20. **Filter scope** (jarring: filter re-fits session/trip/Studio): on the dashboard, every `/sessions` tab (log, trips, records; `src/pages/SessionsPage.tsx:24-26`) and Labs outside Studio, the map draws filtered tracks as today and a filter change fits per 19. On a session, trip or Studio page a filter change does nothing: those paths no longer depend on `activeFilter` (`src/features/map/hooks/useMapTracks.ts:86`). Map only; tab contents are unchanged.
21. **Dashboard chart zoom** (debatable): same as 19. Zoom and reset fit once if the visible track set changed.
22. **intervals.icu background sync** (jarring): never moves the camera, on any page (rule 2). New tracks just appear.
23. **User-started import** (files, ZIP, demo data; jarring: fit per batch): never moves the camera (rule 2), no fit at the end either. An import is data, not a "show me" action; only opening something and filter changes move the camera. Exception: if no start fit has happened yet (app started without tracks), the first time tracks exist counts as the initial load and runs the fly-in from 1 once.
24. **Reprocess after an app update** (jarring: up to three late fits): reprocess end counts as the initial load: one fit for the current page (overview fly-in per 1, session fit per 6, trip fit per 12). The GPS re-read and the committed sessions afterwards are background data and never move the camera (2). Consistent with the exception in 23.

## Approach

One camera owner replaces the identity-driven fits (`useMapCameraEffect`, `useLapCameraEffect`, and the async tracks rebuilds that trigger them). It compares a **target key** with what it last fitted; new array identities (sessions, gpsData, filter, detail path, routes) never move the camera. Only a target change, a pending fit becoming resolvable, or one of three explicit signals (filter change on the overview, explicit lap close, delete of the open subject) do.

**Target** (derived each render, all in memory):

- `overview`: any non-session/trip/Studio page (dashboard, `/sessions` tabs, Labs outside Studio, `/settings`).
- `session(sessionId, lapIndex | null)`: from `openedSessionId` (`src/store/mapFocus.ts:6`) + `selectedLapIndex` (`src/store/mapControls.ts:19`).
- `trip(tripKey)`: sorted, joined `focusedTripSessionIds` (see open question 2).
- `studioTab`, `studioRoute(routeId)`: from `useStudioMapTracks` (`src/features/map/hooks/useStudioMapTracks.ts:42-75`).

**State** (ref in the owner, changed only by the pure reducer): previous `target`, `pending: MapCameraFit | null`, `initialDone`, baselines `visibleKey`, `filter`, `lapCloseCount`, `refitRequest`.

| Event                                                                        | `pending` becomes                                          |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Target changes to `session`                                                  | `session`                                                  |
| … to `trip`                                                                  | `trip` (14: regardless of previous target)                 |
| … to `studioRoute`                                                           | `studio` if the route has bounds                           |
| … to `studioTab`                                                             | `studio` unless the previous target was `studioRoute` (16) |
| … to `overview`                                                              | nothing; a stale pending is dropped (3, 13)                |
| Unhandled `refitRequest`, target now `overview` / `studioTab`                | `overview` / `studio` (11, 17)                             |
| Same session, lap changes to another non-null index                          | `lap`                                                      |
| Same session, lap → null and `lapCloseCount` grew                            | `lapClose`                                                 |
| Same session, lap → null without that                                        | nothing (10)                                               |
| `overview`, `!initialDone`, `visibleCount > 0`, not reprocessing             | `overview` (1, 2, 23, 24)                                  |
| `overview`, `filter` identity changed and `visibleKey` differs from baseline | `overview` (19, 21)                                        |
| Anything else (sessions, gpsData, routes, colour mode, weather, profile)     | baselines update silently (2, 5, 8, 17, 22)                |

**Settle step.** The hook resolves bounds only for `pending`. Once the map is loaded, bounds exist and (for session-data kinds) reprocessing is over, it calls `fitBounds`, then `settleMapCameraFit` (`pending: null, initialDone: true`). Missing bounds keep `pending` until the data arrives (4, 6, 12, 24). Studio fits are now-or-never (routes are synchronous).

**Bounds sources** (hook, not reducer): overview `densestClusterBounds` of visible tracks; trip `unionBounds` of the trip ids' `gpsData` entries; session / lapClose the session's `gpsData` bounds, falling back to `getSessionGPS(id)` while `gpsData === null`; lap `pathBounds(selectedLapPath.path)`; studio `studioTracks.bounds`. Fit options keep today's values (overview/trip margin 50, 1000 ms; session and studio `MAP_FIT_MARGIN`, 1200 ms; lap/lapClose sheet cap 0.85, maxZoom 16, 800 ms; `e2e/mobile/map.spec.ts:415` detects lap fits by maxZoom 16).

**Back vs. open.** Decided by destination, not history direction: overview arrivals stay (3, 13), trip arrivals fit (14), session arrivals fit (4). Only `studioRoute → studioTab` (16) looks at the previous target. Deletes are flagged by an explicit store token.

**Signals** (intent-named store actions, called via `getState()`):

- `closeSelectedLap()` increments `lapCloseCount` and clears the lap (X, Escape); `toggleSelectedLap` increments on its deselect branch (re-click).
- `clearSelectedLap()` stays the indirect clear; `setLapSource` / `setSplitDistance` don't increment.
- `requestMapRefitAfterDelete()` increments `mapRefitRequest`; called from the open-session delete and the route-detail delete.

**Owner location.** `DeckGLOverlay`, replacing `useLapCameraEffect` at `src/features/map/DeckGLOverlay.tsx:97`; it already has `selectedLapPath` (`:84-86`), `studioTracks` (`:67`) and `useMap()`. Lifting `useSessionDetailPath` into `MapBackground` would re-render the whole `MapGL` tree on every list hover.

## Decision mapping

1. `overview` + `!initialDone` + tracks → one fly-in; `initialDone` stops the GPS re-read from fitting again.
2. `visibleCount` is 0 while `gpsData === null`, so the start fit waits for the first read; later data only moves baselines.
3. `→ overview` never fits and drops any pending fit.
4. `→ session` fits from `gpsData` in the same pass; with `gpsData === null` it waits for the `getSessionGPS` fallback.
5. `markSessionSeen` (`src/pages/SessionDetailPage.tsx:23-27`) changes only sessions; the key is unchanged.
6. Follows from 4: the pending fit settles once; later `gpsData` doesn't change the key.
7. Delete the overlay `onClick` at `src/features/map/DeckGLOverlay.tsx:419-421`; explicit closes produce `lapClose`.
8. Lap key `(sessionId, lapIndex)`; detail-path rebuilds (`src/features/map/hooks/useSessionDetailPath.ts:60-85`) don't touch it.
9. Session and lap fits are kinds of one reducer, so the race is gone.
10. `setLapSource` / `setSplitDistance` (`src/store/mapControls.ts:42-51`) clear without the token → nothing.
11. `DeleteSessionDialog` requests a refit before `navigate`; arriving on the overview with the unhandled token → `overview`.
12. `→ trip` uses the `unionBounds` from `gpsData`, now or once it arrives.
13. Same as 3.
14. Trip arrival ignores the previous target; session arrival follows 4.
15. No action; the reducer runs in an effect with a ref, so StrictMode's double run settles once (a dev-only trip flicker may still queue one extra trip fit).
16. `studioRoute → studioTab` stays; any other arrival on `studioTab` fits.
17. Route-list changes keep the key `studioTab`; `StudioActionsMenu` `onDeleted` requests a refit (no routes left → nothing).
18. `useMapTracks` returns `[]` while Studio is active.
19. Filter identity changed **and** `visibleKey` changed → `overview`; same set → nothing.
20. The filter rule only applies to the `overview` target; elsewhere the filter only becomes the new baseline.
21. `setDashboardChartRange` replaces `activeFilter` (`src/store/filters.ts:176-182`) → same as 19.
22. Background data → 2.
23. Backfill is paused while importing (`src/features/map/hooks/useGpsBackfill.ts:17`); only the `!initialDone` exception fits, once.
24. While reprocessing, session-data kinds don't settle and `visibleCount` is 0; afterwards exactly one pending or initial fit settles.

## Pure decision function

`src/lib/mapCamera.ts` (no React, no stores):

```ts
export type MapCameraTarget =
  | { kind: 'overview' }
  | { kind: 'session'; sessionId: string; lapIndex: number | null }
  | { kind: 'trip'; tripKey: string }
  | { kind: 'studioTab' }
  | { kind: 'studioRoute'; routeId: string };
export type MapCameraFit = 'overview' | 'session' | 'lap' | 'lapClose' | 'trip' | 'studio';
export const initialMapCameraState: MapCameraState;
export const nextMapCamera = (state: MapCameraState, obs: MapCameraObservation): MapCameraState;
export const settleMapCameraFit = (state: MapCameraState): MapCameraState;
```

`MapCameraObservation`: `target`, `visibleKey`, `visibleCount`, `filter`, `lapCloseCount`, `refitRequest`, `studioHasBounds`, `sessionDataBlocked`. `pathBounds` moves from `src/features/map/hooks/useLapCameraEffect.ts:8-25` into `src/features/map/lapPath.ts`.

## Files

**Create**

- `src/lib/mapCamera.ts`: types and reducer.
- `src/features/map/hooks/useSessionFitBounds.ts`: the session's `gpsData` bounds, else (while `gpsData === null`) a cancellable `getSessionGPS(id)` (logic from `src/features/map/hooks/useMapTracks.ts:31-43`).
- `tests/lib/mapCamera.spec.ts`.

**Modify**

- `src/features/map/hooks/useMapCameraEffect.ts:10-73`: rewrite as the owner, `useMapCameraEffect(gpsData, tracks, lapPath, mapLoaded)`; reads the focus, filter and reprocessing state itself, memoises `visibleKey`, runs `nextMapCamera` → resolve bounds → `fitBounds` → `settleMapCameraFit` in one effect.
- `src/features/map/hooks/useMapTracks.ts:16-89`: synchronous `useMemo` returning `MapTrack[]`; `[]` while Studio is active (18), reprocessing (moved from `src/features/map/MapBackground.tsx:36`) or a session is open (track layers are off then, `src/features/map/DeckGLOverlay.tsx:127-129`). Delete the unread `loading` state (`:23`, `:88`) and the `getSessionGPS` import (`:5`).
- `src/features/map/MapBackground.tsx`: drop the camera wiring (`:8`, `:26`, `:36`, `:40-41`, `:52-59`), pass `gpsData` and `mapLoaded` to `DeckGLOverlay` (`:104-109`); keep `:47-50`.
- `src/features/map/DeckGLOverlay.tsx`: swap the import at `:7`, replace `:97` with the owner, add two props (`:48-53`), delete the map-tap lap clear (`:419-421`).
- `src/features/map/hooks/useStudioMapTracks.ts:17-24`, `:50-74`: expose `routeId` so the target can tell tab from route.
- `src/store/mapControls.ts`: add `lapCloseCount`, `closeSelectedLap` (interface `:23-24`); `toggleSelectedLap` (`:56-62`) increments on deselect. `src/store/mapFocus.ts`: add `mapRefitRequest`, `requestMapRefitAfterDelete` (`:20-21`).
- `src/features/sessions/session/LapsControl.tsx:212`, `:265`: `clearSelectedLap()` → `closeSelectedLap()`.
- `src/features/sessions/session/DeleteSessionDialog.tsx:58-62`: request the refit before `navigate('/sessions')`.
- `src/features/studio/StudioActionsMenu.tsx:49`: request the refit before `navigate('/labs?tab=studio')`.
- `src/features/map/lapPath.ts`: add `pathBounds`.
- `e2e/helpers/map.ts`: add `exposeMap(page)` extracted from `e2e/mobile/map.spec.ts:398-417`, reuse it there.
- Progress overlay through the GPS build (open question 7): `src/store/importProgress.ts` (a separate "building tracks after a foreground task" flag that keeps the overlay open; not by extending `useSessionReprocessingActive`, because `useGpsBackfill` skips while reprocessing, `src/features/map/hooks/useGpsBackfill.ts:17`), `src/features/map/hooks/useGpsBackfill.ts:44-53` (report build start/done to that store), `src/components/ui/ImportProgressOverlay.tsx` (summary only after the build), `src/components/layout/AppLayout.tsx:59` (app stays hidden while that flag is set after a reprocess). Exact lines to verify when implementing.

**Unchanged on purpose:** `src/features/sessions/session/hooks/useSessionLapsEffect.ts:31` (indirect clear on unmount), `src/pages/TripDetailPage.tsx:22-27`, `src/features/map/hooks/useGeolocationCameraEffect.ts`, `src/features/map/hooks/useGpsBackfill.ts`.

**Delete:** `src/features/map/hooks/useLapCameraEffect.ts`.

## Tests

- `tests/lib/mapCamera.spec.ts`: one short `it` per decision with behaviour (1–14, 16, 17, 19–21, 23, 24), named after the decision. More than the usual 0–3 new tests because the function branches per decision.
- E2E, extending existing specs: `e2e/sessions.spec.ts:114-141` (lap flow: tap an empty map corner, `lap-stepper` stays visible, decision 7); `e2e/map.spec.ts` gains "back from a session keeps the overview camera" (decision 3) via `exposeMap`, `jumpTo`, open session, `goBack`, center/zoom unchanged for 2 s.
- Re-check `e2e/mobile/map.spec.ts:382-470` (lap fit spy keyed on maxZoom 16) and the `findPickableTrack` callers (they reload after upload, so the start fit still runs).

## Verification

1. `vp check`
2. `vp test -- --run`
3. `vp exec playwright test`
4. `vp build`; owner starts the preview. Manual pass at desktop and phone width (prod, per 15):
   - cold start on `/`: one fly-in; panning right away isn't pulled back;
   - open a session: one fit; a "new" session: no extra move; reload on `/sessions/:id`: one fit;
   - lap: select, step, X, Escape, re-click zoom out; map tap, colour mode, split distance: nothing;
   - back to the overview: stays; delete the open session: one densest fit;
   - trip: open one fit; trip → session → back fits the trip; leave stays;
   - Studio: enter fits; route → back stays; import/delete on the tab stays; delete from route detail fits all;
   - filter: same set no move, changed set one fit; chart zoom/reset; filter on a session page: nothing;
   - ZIP import on a populated map: no move; on an empty DB: one fly-in;
   - intervals.icu sync: no move; locate-me unchanged;
   - reprocess (outdated `derivationVersion`, reload): one fit at the end.
   - foreground import and reprocess: the overlay stays until tracks are drawn, the summary appears after; intervals.icu sync shows no overlay.

## Open questions

1. **Leaving Studio to an overview page:** decided, the camera stays (like 3). Studio → overview never fits.
2. **Editing the open trip's sessions:** decided, fit the new union. The trip key is the sorted session ids, so a change is a new target.
3. **Forward navigation to an overview:** decided, arriving on the overview from a session, trip or Studio, or on the Studio tab from a route, keeps the camera, whether by back or by a link (dock "Dashboard", Studio breadcrumb). Entering the Studio tab from outside Studio still fits (16).
4. **User moved before the start fit:** decided, close the window instead: the progress overlay also covers the GPS build that follows a reprocess or an import (`src/features/map/hooks/useGpsBackfill.ts:36-53`), so the map can't be used before the first fit. Scope and look: see 7.
5. **Deep link counts as the start fit:** decided, OK. A cold-opened session fit sets `initialDone`; arriving on the overview afterwards stays (3), no later fly-in.
6. **Filter changed off-overview, then back:** decided, stays (3 + 20). Arrival never fits; the off-overview filter change is only recorded as the new baseline.
7. **Progress indicator for the GPS build (from 4):** decided, only after foreground tasks. When a foreground import or reprocess (already showing `ImportProgressOverlay`) is followed by a GPS build, the overlay stays open until the tracks are built; background sync (intervals.icu) stays silent. Mechanism: no new phase or label; the overlay keeps its current label ("Saving…" for imports, "Updating…" for reprocess) until `useGpsBackfill` (`src/features/map/hooks/useGpsBackfill.ts:44-47`) reports done; for reprocess, the app stays hidden (`src/components/layout/AppLayout.tsx:59`) until then. The import summary card appears only after the GPS build has finished.
8. **Fit timing after foreground tasks (from the walkthrough videos, 2026-10-14):** after a reprocess, the camera waits until the track build is done (`awaitingTrackBuild` cleared), then fits once with the rebuilt GPS list, visible after the overlay closes. The first-data fly-in after an import into an empty app waits until the overlay including the summary is closed.

## Risks

- The owner in `DeckGLOverlay` couples camera logic to a render component (two new props); the alternative costs `MapGL` re-renders on every hover.
- `visibleKey` is O(n) per tracks change; memoise on `tracks`. Compute `densestClusterBounds` only at fit time.
- Pending fits for targets without GPS must be dropped on target change, or a late GPS build of a session already left would fit.
- An unhandled delete token must be cleared on any target change, or a later arrival would fit.
- Without auto-fit after imports, e2e flows that import and then pick on the map without a reload may find nothing on screen; re-run studio, map and mobile specs.
