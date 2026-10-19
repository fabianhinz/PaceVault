---
title: Startup loader
status: idea
created: 2026-10-17
type: feature
areas: [app]
next: Q&A on Q1–Q6, then a design round
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

- Onboarding loader: `src/features/onboarding/LogoLoader.tsx`, with the L3 keyframes in `src/index.css`, a 3.0 s cycle, at least one full cycle, and hand-off at a cycle boundary. Copy `ui_onboarding_loading` ("Kartendaten werden geladen…").
- Onboarding draw-in: `src/features/map/previewDrawIn.ts` and `src/features/map/hooks/useOnboardingPreviewLayer.ts`. It slices paths per frame in JS and rebuilds the `PathLayer` on every frame. That is fine for the 19 demo routes, but **does not scale** to thousands of sessions.
- First camera fit: `src/features/map/hooks/useMapCameraEffect.ts` (`fitBounds`, `duration: 1000` for the overview).
- `index.html` only sets the background colour (`#030712`) before React mounts.

## Likely approach (to validate)

- **Pre-React loader:** inline SVG plus CSS keyframes in `index.html`. React removes it once a "ready" signal fires. Onboarding could reuse the same element, so there is one loader.
- **Ready signal:** map style loaded + sessions hydrated + GPS tracks decoded. Today these are spread across `useGpsBackfill`, `useMapTracks` and the map `load` event.
- **Camera:** `duration: 0` for the first fit behind the loader, so there is no flight.
- **Draw-in:** deck.gl `TripsLayer` (new dependency `@deck.gl/geo-layers` at the installed 9.2 version). Per-vertex "time" is the cumulative distance, uploaded once; each frame only changes `currentTime`, and the GPU does the work. Additive blend and colours as on `gps-tracks`. The onboarding preview would move to it as well, so there is one technique.
- **e2e:** a way to skip the loader in tests. Otherwise every test waits ≥ 3 s, roughly +4 min for the suite.

## Open questions

- **Q1** · open · **Minimum display time on every start:** 3 s every time, only on the first start, or shorter (e.g. 1.5 s, finishing the current cycle)? Returning users with a warm cache would otherwise wait for nothing.
- **Q2** · open · **Large libraries and pending GPS backfill:** wait for every track, or hand off early and let tracks appear as they load?
- **Q3** · open · **Deep links** (`/sessions/:id`): draw in only the detail track, skip the loader, or always do the overview draw-in?
- **Q4** · open · **Interaction during the draw-in:** lock picking until it finishes, or pick on the full geometry?
- **Q5** · open · **Loader text before JS loads:** no text, or EN/DE chosen by `navigator.language` in a small inline script?
- **Q6** · open · **Repetition:** play on every reload / PWA resume, or once per browser session?

## Effort (rough)

Medium, about the size of `workbench/training-load-recompute/plan.md`. The draw-in for real tracks (TripsLayer) is the core; the loader, ready signal, camera and e2e skip are small to medium each.
