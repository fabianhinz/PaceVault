---
title: Startup loader
status: ready
created: 2026-10-17
type: feature
areas: [app, ui, i18n, workbench, docs]
next: Owner sets ready, then implement on "lets dev"
---

# Startup loader with track draw-in

## Context

Today a reload paints a dark page, mounts React, shows the map at Europe zoom 4 (`apps/web/src/features/map/MapBackground.tsx:76-80`) and flies to the tracks once they are all loaded (`apps/web/src/features/map/hooks/useMapCameraEffect.ts:57-60`). The onboarding has its own React loader (`apps/web/src/features/onboarding/LogoLoader.tsx:55`) and a per-frame `PathLayer` draw-in (`apps/web/src/features/map/hooks/useOnboardingPreviewLayer.ts:30-59`). This item paints one loader from `index.html`, sets the camera behind it and hands off to a GPU draw-in of the user's tracks. Mockup: `mockup/index.html` (loader A × draw-in V6); research: `research/loader.md`, `research/draw-in.md`.

## Decisions (settled)

- **Loader A "L3 at 1.5 s"** (Q18): the L3 grow-and-retract animation at a 1.5 s cycle, 96 px at every width (Q17), no text (Q5). At least one full cycle; hand-off at the first cycle end after ready, with the logo empty; 400 ms opacity fade; then the draw-in. One element for startup and onboarding (Q10).
- **Inline, outside React:** markup, styles and keyframes live in `apps/web/index.html`, outside `#root`, so it paints with the HTML and stays as the page with JavaScript off, animating forever (Q14). Overlay `rgba(3,7,18,.85)` with an 8 px backdrop blur: a deliberate hand-copy of `overlayClass` (`packages/ui/src/components/Card.tsx`), as `NewerVersionOverlay.tsx:15` already does, because no class exists before React.
- **Every page reload plays it** (Q6). Ready waits for every track as today (Q2) and for the instant start fit (or nothing to fit, Q23), never for the map style or tiles (Q13). A 10 s cap fades the loader anyway; tracks that arrive later appear without a draw-in (Q13).
- **Draw-in V6 Ground speed** (Q19): every track draws at one speed along its length (the 75th-percentile track takes 1.5 s), starts staggered 0–300 ms (seeded), and every track ends by 2.5 s (long tracks are scaled to fit).
- **`gps-tracks` itself is a deck.gl `TripsLayer`** (`@deck.gl/geo-layers`, Q9 and owner: "no test, lets just go for the lib"); no swap. During the draw-in it uses the user's track intensity (Q11) and picking is locked until it ends (Q4).
- **When it plays** (Q3, Q7, Q22): on a page reload into the overview, and when the first tracks arrive in an empty library (after onboarding or Delete all data) without a reload, then with an instant fit and no loader. A filter that shows 0 tracks never re-arms it. A reload on `/sessions/:id` shows the loader, then the session track with no draw-in (Q15).
- **Onboarding** (Q10): the same loader, then the demo routes draw in on a `TripsLayer` with the startup timing, keeping two passes per route; owner: "if we opt for a lib here we should also use that lib for the onboarding".
- **Skip flag** (Q16, Q21): the e2e fixture sets `window.__pacevaultSkipLoader` with `addInitScript`; it removes the loader at once and skips the draw-in, so tracks are full and pickable straight away in e2e, review captures and the README banner.
- **Spin-off** (Q20): the zero-area fit, the onboarding reset after Delete all data and the GPS worker error go to `tools/workbench/backlog/first-fit-fixes/`.

## Approach

### 1. Inline loader (`apps/web/index.html`)

- Move the `<style>` block into `<head>` (it sits between `</head>` and `<body>` today, `apps/web/index.html:16-20`) and add the loader styles there: fixed, inset 0, `z-index: 300` (above the toast's `z-[200]`, `packages/ui/src/components/Toast.tsx:62`), overlay colour and blur, grid-centred; the three `@keyframes` from `packages/ui/src/theme.css:136-174` at `1.5s`; a `.is-leaving` class (opacity 0 over 400 ms, animation paused).
- `<div id="startup-loader" role="status" aria-label="PaceVault">` before `#root` with the 96 px SVG from `LogoLoader.tsx:23-52` (static gradient ids).
- An inline `<script>` right after the div: if `window.__pacevaultSkipLoader` is set, it removes the div synchronously (module scripts run before `DOMContentLoaded`, so a later removal would race the boot).

### 2. Hand-off (`apps/web/src/lib/startupLoader.ts`, new)

- `handoffDelayMs(elapsedMs, cycleMs)`: pure, the wait until the first cycle end at or after `max(elapsed, cycle)`.
- `handOffStartupLoader()`: reads the elapsed time from the first stroke's CSS animation clock (`getAnimations()[0].currentTime`, narrowed with `typeof === 'number'`), waits `handoffDelayMs`, adds `.is-leaving`, removes the element after the fade and resolves. No element → resolves at once.
- `startStartupLoaderCap()`: called once at boot (`apps/web/src/main.tsx`); at 10 s after first paint, if the loader is still there, it fades it and calls `capStartupLoader()` on the store.
- `removeStartupLoader()`: removes the element at once. Called on the boot error path (`apps/web/src/main.tsx:57-60`), in the root `ErrorBoundary`'s `onError` (`main.tsx:41`) and in the map boundary's `onError` (`apps/web/src/components/layout/AppLayout.tsx:72-79`), so no error screen sits under the loader.
- `startupLoaderSkipped()`: true when the skip flag is set.

### 3. Startup store and ready (`apps/web/src/store/startup.ts`, new; `apps/web/src/features/map/hooks/useStartupEffect.ts`, new)

- Store, not persisted: `phase: 'loading' | 'drawing' | 'done'`, `drawInStartedAt: number | null`, `capped: boolean`, `startFitSettled: boolean`; actions `startTrackDrawIn()`, `finishTrackDrawIn()`, `skipTrackDrawIn()`, `capStartupLoader()`, `settleStartFit()`.
- `useMapCameraEffect` calls `settleStartFit()` when it applies the `'start'` fit, or when `gpsData` is loaded with nothing to fit (Q23).
- `useStartupEffect` (mounted in `apps/web/src/features/map/MapBackground.tsx`):
  - skip flag → `skipTrackDrawIn()` at once (Q21);
  - onboarding not complete: ready = preview routes settled (`useOnboardingPreviewRoutes().status !== 'pending'`, as `LogoLoader.tsx:57`) → hand-off → `revealOnboardingPreview()` → `startTrackDrawIn()`;
  - onboarding complete: ready = `startFitSettled` → hand-off → `startTrackDrawIn()` on the overview, `skipTrackDrawIn()` on a session link (Q15) or when `capped` (Q13);
  - after `done`: when the library goes from empty (`gpsData.length === 0`) to tracks (first import after onboarding or Delete all data, Q7, Q22) and the start fit has settled again → `startTrackDrawIn()`.

### 4. Camera (`apps/web/src/lib/mapCamera.ts`, `apps/web/src/features/map/hooks/useMapCameraEffect.ts`)

- New fit kind `'start'` in `MapCameraFit` (`mapCamera.ts:8`): `nextMapCamera` sets it for the start fit (`mapCamera.ts:127-133`) instead of `'overview'`, so the effect can tell it apart from refits after a delete or a filter change (`mapCamera.ts:106`). `fitBoundsOf('start')` = the overview bounds; `fitOptions('start')` = the overview padding with `duration: 0` (`useMapCameraEffect.ts:57-60`).
- The effect no longer waits for the map `load` event (`useMapCameraEffect.ts:98`, `:130`, `:151`): the camera works before it (`apps/web/src/features/map/hooks/useOnboardingPreviewCameraEffect.ts:40-41`). The `mapLoaded` prop of `DeckGLOverlay` (`DeckGLOverlay.tsx:63`, `:111`) and its pass-through in `MapBackground.tsx:100` go; `useSuppressTapMouseEffect` keeps `mapLoaded` (`MapBackground.tsx:41`).
- `MapCameraObservation` gets `libraryEmpty` (`gpsData?.length === 0`); `initialDone` resets while the library is empty, so the first tracks into an empty library get an instant start fit again (Q7, Q22).

### 5. Draw-in timing (`apps/web/src/features/map/drawIn.ts`, new; replaces `previewDrawIn.ts`)

- `DRAW_IN_END_MS = 2500`, `DRAW_IN_STAGGER_MS = 300`, `DRAW_IN_P75_MS = 1500`.
- `buildDrawInTimestamps(paths, seed)`: per path the cumulative distance (`haversineM` from `@pacevault/engine/gps.ts`), one speed from the 75th-percentile length, a seeded start in 0–300 ms, scaled so the path ends by 2.5 s; returns one `number[]` per path (ms after the draw-in start).
- The onboarding's two passes (original + jittered copy) and its bounds move here from `previewDrawIn.ts:50-113`; `slicePath` and the per-pass start/duration go.

### 6. Track layers (`apps/web/src/features/map/DeckGLOverlay.tsx`, `apps/web/src/features/map/hooks/useOnboardingPreviewLayer.ts`)

- `gps-tracks` (`DeckGLOverlay.tsx:159-189`) becomes a `TripsLayer`: `getTimestamps` from `buildDrawInTimestamps` (memoised with `trackData`, with `updateTriggers.getTimestamps`), `fadeTrail: false`, `currentTime` from a new hook `useDrawInClock` (a rAF loop that only runs while `phase === 'drawing'`, then `finishTrackDrawIn()`; after `done` it is `DRAW_IN_END_MS + 1`, so float32 rounding never hides a vertex and tracks added later show in full). Colour, width, blend, highlight and transitions stay; `pickable` is false until `done` (Q4).
- The onboarding preview layer becomes a `TripsLayer` on the same clock and timing with the user's intensity rule from `gps-tracks` (Q11).
- `apps/web/package.json`: `@deck.gl/geo-layers`, `@deck.gl/extensions` and `@deck.gl/mesh-layers` (its peers) pinned `~9.2.9`, so they match `@deck.gl/core` 9.2.9 (`apps/web/package.json:25-27`); `^9.2.9` would resolve to 9.4. `pnpm-lock.yaml` changes with it. `apps/web/CLAUDE.md:16` lists geo-layers.

### 7. Removals

- `apps/web/src/features/onboarding/LogoLoader.tsx` and its mount in `OnboardingFlow.tsx:144`.
- The L3 `@theme` block in `packages/ui/src/theme.css:127-175` (only `LogoLoader.tsx` uses it).
- `ui_onboarding_loading` in `packages/i18n/messages/en.json` and `de.json` (only `LogoLoader.tsx` uses it).
- `apps/web/src/features/map/previewDrawIn.ts` and `apps/web/tests/features/map/previewDrawIn.spec.ts` (replaced by `drawIn.ts` and its spec).

### 8. Test, capture and banner skip

- `apps/web/e2e/helpers/test.ts:11-19`: the auto fixture also sets `window.__pacevaultSkipLoader = true`. `tools/workbench/shared/capture.ts` imports that fixture (`capture.ts:23`), so review captures skip too; a new helper `withStartup(page)` adds a later init script that deletes the flag, for the scenes that show the loader and the draw-in.
- `apps/web/e2e/helpers/onboarding.ts:3-4`: the comment and `LOADER_TIMEOUT_MS` go (the onboarding opens without the loader in tests).
- `tools/docs/banner/capture.ts`: sets the flag in its init script (`:58`).

## Files

- `apps/web/index.html`: inline loader, styles, keyframes, skip script.
- `apps/web/src/main.tsx`: start the cap; remove the loader on the boot error path and in the root boundary's `onError`.
- `apps/web/src/components/layout/AppLayout.tsx`: remove the loader in the map boundary's `onError`.
- `apps/web/src/lib/startupLoader.ts` (new): hand-off, cap, removal, skip check, `handoffDelayMs`.
- `apps/web/src/store/startup.ts` (new): phase store.
- `apps/web/src/features/map/hooks/useStartupEffect.ts` (new): ready → hand-off → draw-in.
- `apps/web/src/features/map/hooks/useDrawInClock.ts` (new): `currentTime` during the draw-in.
- `apps/web/src/features/map/drawIn.ts` (new): timestamps and onboarding passes.
- `apps/web/src/features/map/MapBackground.tsx`: mount `useStartupEffect`; drop the `mapLoaded` pass-through.
- `apps/web/src/features/map/DeckGLOverlay.tsx`: `gps-tracks` as `TripsLayer`; drop the `mapLoaded` prop.
- `apps/web/src/features/map/hooks/useOnboardingPreviewLayer.ts`: `TripsLayer` on the shared clock.
- `apps/web/src/features/map/hooks/useOnboardingPreviewRoutes.ts`: builds from `drawIn.ts`.
- `apps/web/src/features/map/hooks/useMapCameraEffect.ts`, `apps/web/src/lib/mapCamera.ts`: `'start'` fit, no `load` gate, `libraryEmpty` reset, `settleStartFit()`.
- `apps/web/src/features/onboarding/OnboardingFlow.tsx`: drop `LogoLoader`.
- `apps/web/package.json`, `pnpm-lock.yaml`: deck.gl geo-layers and its peers.
- `apps/web/CLAUDE.md`: stack row lists geo-layers.
- `apps/web/e2e/helpers/test.ts`, `apps/web/e2e/helpers/onboarding.ts`, `tools/workbench/shared/capture.ts`, `tools/docs/banner/capture.ts`: skip flag and opt-out.
- Deleted: `apps/web/src/features/onboarding/LogoLoader.tsx`, `apps/web/src/features/map/previewDrawIn.ts`, `apps/web/tests/features/map/previewDrawIn.spec.ts`; the L3 block in `packages/ui/src/theme.css`; `ui_onboarding_loading` in `packages/i18n/messages/en.json`, `de.json`.

## Tests

- `apps/web/tests/features/map/drawIn.spec.ts` (new): the 75th-percentile track takes 1.5 s; every track ends by 2.5 s; starts lie in 0–300 ms and repeat for the same seed; timestamps never decrease along a path; a 0 m path does not divide by zero; two passes per onboarding route, deterministic for the same input (from `previewDrawIn.spec.ts`).
- `apps/web/tests/lib/startupLoader.spec.ts` (new): `handoffDelayMs` at 400 ms (→ 1,100), 1,500 (→ 0), 2,600 (→ 400).
- `apps/web/tests/lib/mapCamera.spec.ts`: the start fit is `'start'` (cases 1 at `:42`, 2 at `:49`, the cases at `:218`, `:231`, `:241`, `:259`); `:134` flips (deleting the last session, then importing, fits again); a new case: a filter showing 0 tracks does not reset the start fit (Q22).
- `apps/web/e2e/map.spec.ts` (extended, with `withStartup`): the loader is in the first paint; it is gone within 5 s on a seeded library; a track click only opens the popup after the draw-in; a reload on `/sessions/:id` ends on the session with no loader left.
- `apps/web/e2e/onboarding.spec.ts`: stays green with the skip flag.

## Verification

From the root: `vp run check`, `vp run test`, `vp run e2e`, `vp run build` (compare the bundle size before and after, geo-layers must tree-shake). By hand: reload on the overview with a real library (desktop and a phone), reload on a session link, Delete all data → import, a fresh profile through onboarding, a filter showing 0 tracks then back (no replay), DevTools "Offline" reload (cap at 10 s), JavaScript disabled.

## Delivery and acceptance

Review doc `tools/workbench/backlog/startup-loader/review/index.html` from `tools/workbench/shared/review-template.html`: shots of the loader and of the draw-in mid-way and done (desktop and 390 px, via `withStartup`), plus the map after the start. Cleanup only via `item-done` after the owner's acceptance.

## Real-data checks

- [ ] Draw-in frame rate on a mid-range phone with the largest real library (fallback if it drops: V1 Bloom, per `research/draw-in.md`).
- [ ] An installed iOS PWA shows no white frame before the loader paints.

## Open questions

- **Q1** · answered 2026-10-21 · **Minimum display time on every start:** 3 s every time, only on the first start, or shorter (e.g. 1.5 s, finishing the current cycle)? Returning users with a warm cache would otherwise wait for nothing. → Owner: "shorter for all cases"
- **Q2** · answered 2026-10-21 · **Large libraries and pending GPS backfill:** wait for every track, or hand off early and let tracks appear as they load? → Owner: "we already wait today right? If so lets continue waiting. No need to change this part"
- **Q3** · answered 2026-10-21 · **Deep links** (`/sessions/:id`): draw in only the detail track, skip the loader, or always do the overview draw-in? → Owner: "the overview draw in is just for the initial page load. Nothing the user does (except a page reload) shall trigger this effect"
- **Q4** · answered 2026-10-21 · **Interaction during the draw-in:** lock picking until it finishes, or pick on the full geometry? → Owner: "picking is locked until finished"
- **Q5** · answered 2026-10-21 · **Loader text before JS loads:** no text, or EN/DE chosen by `navigator.language` in a small inline script? → Owner: "lets just drop the loader text completly"
- **Q6** · answered 2026-10-21 · **Repetition:** play on every reload / PWA resume, or once per browser session? → Owner: "page reload triggers this"
- **Q7** · answered 2026-10-22 · **First tracks without a reload:** Q3 says only a page reload plays the draw-in, but the first fit after onboarding (2026-10-21) asks for a fit without animation plus a draw-in when the first own tracks arrive after onboarding or after Delete all data. (a) Both play the draw-in: the page reload, and the first tracks into an empty map (recommended; Q3 stays true for everything the user does on a filled map). (b) Only the page reload; the first tracks after onboarding just appear after an instant fit. (c) The first tracks get the loader as well (loader shows during the GPS build, then draw-in). → (a). Owner: "Reload + first tracks (Recommended)"
- **Q8** · answered 2026-10-22 · **Draw-in choreography** (`research/draw-in.md`): which variants go into the mockup? V1 Bloom (all at once, ~1.5 s), V2 Scatter (onboarding motion shortened, seeded random starts, ~2.4 s; recommended to test first), V3 Ripple (outward from the map centre, ~2.4 s), V4 Timeline (oldest to newest, ~3–4 s), V5 Comets (V2 plus bright fading heads), V6 Ground speed (same speed along distance, capped ~2.5 s). → all six go into the mockup. Owner: "all"
- **Q9** · answered 2026-10-22 · **Hand-off to the normal map:** (a) `gps-tracks` itself becomes the TripsLayer, so there is no swap and no blank frame (recommended; +4 bytes per vertex). (b) A separate draw-in layer, then a swap to `gps-tracks` built in advance. (c) A cross-fade between the two. → (a). Owner: "gps-tracks is the TripsLayer (Recommended)"
- **Q10** · answered 2026-10-22 · **Onboarding timing on the shared layer:** (a) keep its own timing (4.2 s, two passes per route). (b) Use the startup timing, keep the two passes. → (b). Owner: "Use the startup timing"
- **Q11** · answered 2026-10-22 · **Brightness during the draw-in:** (a) the user's track intensity, so the last frame equals the final map. (b) A fixed faint level as in onboarding (`apps/web/src/features/map/hooks/useOnboardingPreviewLayer.ts:51`), then a fade to the user's level. → (a). Owner: "User's track intensity (Recommended)"
- **Q12** · answered 2026-10-22 · **Loader variants for the mockup** (`research/loader.md`): A "L3 at 1.5 s" (half-length cycle, hand-off at the next cycle end), B "Rush to the boundary" (today's 3.0 s look, runs 3× faster to the cycle end once ready, warm start ~1–1.7 s; recommended to test first), C "Quiet start" (glass at once, logo only after 700 ms), D "Glass lifts" (A plus a blur fade with the draw-in starting underneath), E "Floor and cut" (fades mid-stroke after ≥ 1 s). → all five go into the mockup. Owner: "all"
- **Q13** · answered 2026-10-22 · **When ready never comes** (basemap blocked or offline, GPS worker error): (a) fade after a cap (e.g. 10 s); tracks arriving later appear without a draw-in. (b) Fade after the cap and still draw in what arrives. (c) No cap. Ready does not wait for the map style or tiles either way (e2e blocks tiles, `apps/web/e2e/helpers/seed.ts:33-35`). → (a). Owner: "Cap, late tracks just appear (Recommended)"
- **Q14** · answered 2026-10-22 · **JavaScript off:** (a) the logo animates forever. (b) It stops on the full logo after a few cycles via `<noscript>`. (c) A static logo. → (a). Owner: "Logo animates forever (Recommended)"
- **Q15** · answered 2026-10-22 · **Reload on a session link (`/sessions/:id`):** (a) the loader, then the session track with no draw-in (Q3 limits the draw-in to the overview). (b) Draw in only that session's track. (c) Loader, overview draw-in, then a flight to the session. → (a). Owner: "Loader, then session track (Recommended)"
- **Q16** · answered 2026-10-22 · **e2e skip:** (a) a flag set in the `addInitScript` fixture (`apps/web/e2e/helpers/test.ts:11-19`) and read by the inline script. (b) A `?loader=off` URL parameter. (c) `navigator.webdriver`. → (a). Owner: "Flag via addInitScript (Recommended)"
- **Q17** · answered 2026-10-22 · **Logo size on a 390 px phone:** (a) 96 px as today. (b) 72–80 px. → (a). Owner: "96 px as today (Recommended)"
- **Q18** · answered 2026-10-22 · **Loader winner from the mockup:** A "L3 at 1.5 s", B "Rush to the boundary", C "Quiet start", D "Glass lifts", E "Floor and cut". → A. Owner: "lets kiss it, i guess L3 at 1.5s right?"
- **Q19** · answered 2026-10-22 · **Draw-in winner from the mockup:** V1 Bloom, V2 Scatter, V3 Ripple, V4 Timeline, V5 Comets, V6 Ground speed. → V6. Owner: "i like ground speed"
- **Q20** · answered 2026-10-22 · **The other first-fit findings of 2026-10-21** (the zero-area fit zooming to MapLibre's 22 because overview, trip and session fits set no `maxZoom`, `apps/web/src/features/map/hooks/useMapCameraEffect.ts:57-69`; Delete all data not resetting the onboarding store; a GPS worker error leaving the map without tracks until a reload, `apps/web/src/features/map/hooks/useGpsBackfill.ts:51-54`): (a) spin them off as their own item; this plan keeps only the `initialDone` reset that Q7 needs. (b) Fold all three into this plan. → (a), item `first-fit-fixes`. Owner: "Spin off as own item (Recommended)"
- **Q21** · answered 2026-10-22 · **Skip flag scope:** (a) the skip flag removes the loader and skips the draw-in, so tracks are full and pickable at once in e2e, captures and the banner. (b) Only the loader; the draw-in still plays in tests. → (a). Owner: "Yes, skip both (Recommended)"
- **Q22** · answered 2026-10-22 · **What counts as an empty map for Q7:** (a) the library is empty (no GPS tracks), so a filter showing 0 tracks never replays the fit or draw-in. (b) 0 visible tracks, filters included. → (a). Owner: "Empty library (Recommended)"
- **Q23** · answered 2026-10-22 · **When the startup is ready:** (a) after the instant start fit is applied (or there is nothing to fit), so the draw-in never plays behind the import summary or before the fit. (b) When `gpsData` is loaded. → (a). Owner: "After the instant fit (Recommended)"

## Risks

- `TripsLayer` with thousands of tracks on a phone where the overlay is interleaved (`DeckGLOverlay.tsx:420`): each frame also repaints the basemap.
- The hand-off reads the CSS animation clock; a background tab throttles timers to ≥ 1 s, which can delay the hand-off (the cap still applies).
- `TripsLayer` draws the head as a hard cut, not a round cap, while the line is growing.
