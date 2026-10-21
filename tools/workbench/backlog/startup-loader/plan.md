---
title: Startup loader
status: idea
created: 2026-10-17
type: feature
areas: [app]
next: Design round, then item-plan (Q1–Q6 answered; includes the first fit after onboarding)
---

# Startup loader with track draw-in

> Parked idea from the owner (2026-10-17). Nothing is settled. Q&A and a design round come before this becomes a plan.

## Idea

On every app start, paint the onboarding logo loader (L3) immediately, ideally from `index.html` before React. Behind it, load the map, sessions and GPS tracks, with the camera already at the final view. Then hand off to a draw-in of the user's own tracks, reusing the onboarding draw-in, instead of today's initial camera flight.

```
Today:  dark page → React → map at Europe, zoom 4 → tracks load → fitBounds flight (1 s)
Idea:   loader paints with the HTML → map + sessions + GPS load behind it
        → camera jumps to the final view → loader fades → tracks draw in
```

## What exists today

- Onboarding loader: `apps/web/src/features/onboarding/LogoLoader.tsx`, with the L3 keyframes in `packages/ui/src/theme.css:132`, a 3.0 s cycle, at least one full cycle, and hand-off at a cycle boundary. Copy `ui_onboarding_loading` ("Kartendaten werden geladen…").
- Onboarding draw-in: `apps/web/src/features/map/previewDrawIn.ts` and `apps/web/src/features/map/hooks/useOnboardingPreviewLayer.ts`. It slices paths per frame in JS and rebuilds the `PathLayer` on every frame. That is fine for the 19 demo routes, but **does not scale** to thousands of sessions.
- First camera fit: `apps/web/src/features/map/hooks/useMapCameraEffect.ts` (`fitBounds`, `duration: 1000` for the overview). Its `initialDone` is never reset; see "First fit after onboarding" below.
- `index.html` only sets the background colour (`#030712`) before React mounts.

## First fit after onboarding (from onboarding-first-fit, 2026-10-21)

The loader replaces the animated first fit, so it also has to cover the first tracks that arrive without a reload. Owner (2026-10-21): "our startup loader will need to handle this case. Instead of a zoom it will do a "fit" without animation and "draw in" like the onboarding." That is a second trigger next to the page load in Q3: the first tracks after onboarding, also after Delete all data.

- **The bug:** the camera's `initialDone` is set once (`apps/web/src/lib/mapCamera.ts:151-155`) and never reset; the map stays mounted, so the first fit (`apps/web/src/lib/mapCamera.ts:127-133`) never runs again. Repro, no reload: demo → demo banner → Delete all data → upload own FIT files → the camera stays on Munich. Hidden when a filter was active (the reset at `apps/web/src/features/settings/DeleteAllDataDialog.tsx:49` queues a fit) or after a reload. Same after deleting every session, then importing; `apps/web/tests/lib/mapCamera.spec.ts:134` (case 11) asserts that behaviour and has to change.
- **Same fit path:** overview, trip and session fits set no `maxZoom` (only laps do, `apps/web/src/features/map/hooks/useMapCameraEffect.ts:64`), so zero-area bounds (e.g. an indoor session with GPS lock) zoom to MapLibre's 22.
- **Onboarding again:** Delete all data doesn't reset the onboarding store (step, preview revealed), so a second onboarding resumes at the old step.
- **Worker error:** a GPS worker error closes the import overlay without tracks (`apps/web/src/features/map/hooks/useGpsBackfill.ts:53`): no tracks and no fit until a reload.

## Likely approach (to validate)

- **Pre-React loader:** inline SVG plus CSS keyframes in `index.html`, styled without JavaScript: a fullscreen layer with the background colour and a backdrop blur, the animated logo centered. It shows on first paint and stays as the page when JavaScript is disabled (owner, 2026-10-21: "default styles (backgroudn color backdrop blur of the fullscreen centered animated icon) that are rendered when the app starts or no javascript is enabled"). React removes it once a "ready" signal fires. Onboarding could reuse the same element, so there is one loader. The L3 keyframes live in `packages/ui/src/theme.css:132` today, so the no-JS case needs its own copy in `index.html`.
- **Ready signal:** map style loaded + sessions hydrated + GPS tracks decoded. Today these are spread across `useGpsBackfill`, `useMapTracks` and the map `load` event.
- **Camera:** `duration: 0` for the first fit behind the loader, so there is no flight.
- **Draw-in:** deck.gl `TripsLayer` (new dependency `@deck.gl/geo-layers` at the installed 9.2 version). Per-vertex "time" is the cumulative distance, uploaded once; each frame only changes `currentTime`, and the GPU does the work. Additive blend and colours as on `gps-tracks`. The onboarding preview would move to it as well, so there is one technique.
- **e2e:** a way to skip the loader in tests. Otherwise every test waits ≥ 3 s, roughly +4 min for the suite.

## Open questions

- **Q1** · answered 2026-10-21 · **Minimum display time on every start:** 3 s every time, only on the first start, or shorter (e.g. 1.5 s, finishing the current cycle)? Returning users with a warm cache would otherwise wait for nothing. → Owner: "shorter for all cases"
- **Q2** · answered 2026-10-21 · **Large libraries and pending GPS backfill:** wait for every track, or hand off early and let tracks appear as they load? → Owner: "we already wait today right? If so lets continue waiting. No need to change this part"
- **Q3** · answered 2026-10-21 · **Deep links** (`/sessions/:id`): draw in only the detail track, skip the loader, or always do the overview draw-in? → Owner: "the overview draw in is just for the initial page load. Nothing the user does (except a page reload) shall trigger this effect"
- **Q4** · answered 2026-10-21 · **Interaction during the draw-in:** lock picking until it finishes, or pick on the full geometry? → Owner: "picking is locked until finished"
- **Q5** · answered 2026-10-21 · **Loader text before JS loads:** no text, or EN/DE chosen by `navigator.language` in a small inline script? → Owner: "lets just drop the loader text completly"
- **Q6** · answered 2026-10-21 · **Repetition:** play on every reload / PWA resume, or once per browser session? → Owner: "page reload triggers this"

## Effort (rough)

Medium, about the size of the training load recompute (a startup pass over all sessions plus an overlay). The draw-in for real tracks (TripsLayer) is the core; the loader, ready signal, camera and e2e skip are small to medium each.
