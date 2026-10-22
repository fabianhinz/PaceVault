# Research: startup loader (look, timing, hand-off)

Scope: the loader painted from `index.html` before React, held until map, sessions and GPS tracks are ready, then faded into the track draw-in. Input: `plan.md` (Q1–Q6 answered), `apps/web/index.html:16-22`, `apps/web/src/features/onboarding/LogoLoader.tsx`, the L3 keyframes in `packages/ui/src/theme.css:127-175`, `overlayClass` in `packages/ui/src/components/Card.tsx:15`.

Repo facts that shape the options:

- `overlayClass` is `bg-surface-base/85 backdrop-blur-sm` (`Card.tsx:15`). In Tailwind v4, `blur-sm` is **8 px** (`--blur-sm: 8px`), so the inline copy needs `rgba(3,7,18,.85)` + `backdrop-filter: blur(8px)`.
- `LogoLoader` measures the cycle from React mount (`LogoLoader.tsx:58`, `useState(() => performance.now())`). An HTML loader starts its CSS clock at first paint, which is earlier, so the hand-off maths has to read the CSS animation's own clock (`element.getAnimations()[i].currentTime`), not React mount time.
- `createRoot(rootEl).render(...)` (`apps/web/src/main.tsx:39`) replaces the children of `#root`. A loader inside `#root` disappears on React's first render, long before the tracks are ready. It has to sit **outside** `#root`.
- Boot errors render `RootErrorFallback` into `#root` (`main.tsx:58-59`). A loader over it would hide the error, so the error path has to remove the loader too.
- e2e blocks the basemap: `page.route('**/*.cartocdn.com/**', (route) => route.abort())` (`apps/web/e2e/helpers/seed.ts:33-35`). A ready signal that waits on the map style or tiles would never fire there, and it would not fire offline on a cold tile cache either.
- e2e already has an auto fixture that runs `page.addInitScript` on every test (`apps/web/e2e/helpers/test.ts:11-19`), which is a natural place for a skip flag.
- There is no `apple-touch-startup-image` in `index.html` or `apps/web/public/`. The manifest sets `background_color` and `theme_color` to `SURFACE_BASE` (`apps/web/vite.config.ts:70-71`).
- No logo appears anywhere in the app chrome, so a "logo flies to the header" hand-off has no target. I dropped it.

## 1. Comparable products

| Product | Cold start and hand-off | Evidence |
| --- | --- | --- |
| **Linear** (web) | Its served HTML holds an inline `#loading` layer, a sibling of `#root` at `z-index: 99999`, with a 64 px logo SVG. The logo block fades in with `animation: fadeIn .4s ease-out 1s both`, so it **only appears after 1 s**: a fast start shows just the background. Removal is a class: `body.loaded #loading { opacity: 0 }` with `transition: opacity .1s`, and `body.loaded` also pauses the logo animation. An inline script reads `splashScreenConfig` from `localStorage` so the splash pre-sizes the sidebar to the user's layout, and it sets dark/light from `prefers-color-scheme` before paint. | Verified from the HTML served at [linear.app/login](https://linear.app/login) (fetched 2026-10-22) |
| **Figma** (web, file browser) | No logo splash. Its HTML holds an inline **skeleton** of the file browser (`#filebrowser-loading-page`, grey `.row`/`.circle` placeholders, a cloned sidebar). The hand-off is a `.fadeOut` class (`opacity .2s ease-in-out`), then `.hidden` (`display: none`). How the editor canvas loads is unverified. | Verified from the HTML served at [figma.com/files](https://www.figma.com/files) (fetched 2026-10-22) |
| **Google Maps** (web) | No logo splash in the HTML. The page **inlines the initial viewport** (a static-map `og:image` with an IP-derived center and `zoom=12`), so the map starts where it will stay and does not fly in. `<noscript>` shows a "JavaScript must be enabled" message. Its runtime behaviour (any fade or raster placeholder) is unverified. | Partly verified from the HTML served at [google.com/maps](https://www.google.com/maps) (fetched 2026-10-22) |
| **Garmin Connect** (web) | `/modern/` redirects to an Astro sign-in shell that contains only `<noscript>` text. The app-shell loader behind login is unverified. Users report slow activity pages (seconds up to minutes for long activities). | Shell verified at [connect.garmin.com/modern](https://connect.garmin.com/modern/). Slowness: [Garmin forum](https://forums.garmin.com/apps-software/mobile-apps-web/f/garmin-connect-web/402829/garmin-connect-is-slow-to-load), [Garmin forum](https://forums.garmin.com/apps-software/mobile-apps-web/f/garmin-connect-web/391638/garmin-connect-web-extremely-slow-to-load-with-run-walk-graph/1860202) |
| **Strava** (web) | The dashboard is behind login. Logged out, it serves a Next.js marketing page with no splash. The dashboard loader and its map hand-off are **unverified**: no public description was found. | [strava.com/dashboard](https://www.strava.com/dashboard) (logged-out response) |
| **Komoot** (web) | `/plan` serves server-rendered HTML with an empty `<noscript>`. How the planner map loads is **unverified**. | [komoot.com/plan](https://www.komoot.com/plan) |
| **MapLibre/Mapbox-based apps** | The map can start at the final view with no flight: the `bounds` constructor option "overrides `center` and `zoom`", and `fitBoundsOptions` applies "only when fitting the initial `bounds`". `load` fires after "the first visually complete rendering". `idle` fires when no camera move is running, all requested tiles are loaded and fades are done. I verified no specific PWA's splash. | [MapLibre MapOptions](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapOptions/), [MapLibre events](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapEventType/) |
| **Installed-PWA OS splash** | Android/Chrome builds its own splash from the manifest (`name`, `background_color`, `theme_color`, an icon of at least 512 px), and it shows **before** `index.html` paints. iOS/iPadOS ignore the manifest for this and need `<link rel="apple-touch-startup-image">` per screen size, and since iOS 17.6.1 these must be real PNG files (data and blob URLs broke). Without startup images, what iOS shows at launch is unverified. | [web.dev splash](https://web.dev/splash-screen/), [Lighthouse splash](https://developer.chrome.com/docs/lighthouse/pwa/splash-screen?hl=en), [web.dev PWA enhancements](https://web.dev/learn/pwa/enhancements), [WebKit bug 280262](https://bugs.webkit.org/show_bug.cgi?id=280262) |
| **deck.gl TripsLayer** (the draw-in) | `currentTime` is the playhead, in the same units as `getTimestamps`. `fadeTrail` (default `true`) fades the trail over `trailLength`. A draw-in that keeps the full track needs `fadeTrail: false`. | [deck.gl TripsLayer](https://deck.gl/docs/api-reference/geo-layers/trips-layer) |

Takeaways: the two products I could verify (Linear, Figma) paint inline HTML **outside** the React root and remove it by toggling a class with a short fade (0.1 s and 0.2 s). Linear delays its logo by 1 s so that fast starts never flash it. Google Maps avoids a camera flight by knowing the viewport before JS runs. I found no product that holds a splash until its data is drawn, as Q2 asks for. That choice is PaceVault's own.

## 2. Patterns

Ratings: ++ good, + fine, – weak, –– poor.

| # | Pattern | 390 px fit | Glanceable | Effort | Risks |
| --- | --- | --- | --- | --- | --- |
| P1 | **Inline loader outside `#root`** in `index.html` (`<div id="boot-loader">` + inline `<style>` + inline SVG, the L3 keyframes copied). React hides it with a class or data attribute and removes it after `transitionend`. | ++ (centered, no layout) | ++ | Low | The keyframes exist twice (theme.css and index.html), so they can drift. The ids in the SVG gradients must not clash with `useId` ids. Z-order against Radix portals: toasts raised during load sit under it. |
| P2 | Loader **inside `#root`** | ++ | ++ | Low | `createRoot().render` wipes it on the first render (`main.tsx:39`), so the loader blinks out before the data is ready and the empty app or map flashes (FOUC). Rejected. |
| P3 | **React re-renders its own copy** over the HTML one (today's `LogoLoader`) | ++ | ++ | Low | Double paint: the CSS animation restarts at mount and the strokes jump. Two elements to fade. Rejected. |
| P4 | **One element, two callers**: a small controller module (show, hide at the cycle boundary, `remove`) that drives the `index.html` element. Startup and onboarding both call it, and onboarding re-shows it after "Delete all data". | ++ | ++ | Medium | Re-showing restarts the CSS animation (set the class again, or call `animation.play()`/`currentTime = 0`). The onboarding store's `revealOnboardingPreview` timing has to move to the controller. |
| P5 | **Shorter cycle**: L3 keyframes at 1.5 s (same percentages, `1.5s`) | ++ | + (faster strokes, less calm) | Low | Changes onboarding too if one loader is shared. On a phone at 96 px it is still readable; at 1.5 s each stroke grows in 0.6 s. |
| P6 | **Rush to the boundary**: keep the 3.0 s look; on ready, set `playbackRate` (for example 3) on the three CSS animations until the cycle ends, then fade | ++ | + (a visible "hurry") | Medium (WAAPI on CSS animations) | All three animations need the same rate, or the stagger breaks. Worst case 1 s after ready at 3×. |
| P7 | **Early fade mid-cycle** (no boundary): fade whenever ready ≥ floor | ++ | + | Lowest | The logo is cut mid-stroke under the fade. With a 300–400 ms fade that is barely visible. Gives up the "empty logo at hand-off" rule of `LogoLoader.tsx:19-21`. |
| P8 | **Delayed logo** (Linear): the backdrop paints at once, and the logo fades in only after N ms | ++ | ++ on fast starts (nothing to read), + on slow ones | Low | Fast reloads never show the logo. That may clash with the intent of Q6 ("page reload triggers this"). Plain CSS (`animation-delay`) is enough. |
| P9 | **Opacity-only hand-off** (300–500 ms) | ++ | ++ | Low | None notable. Today it is 500 ms (`LogoLoader.tsx:10`). |
| P10 | **Blur ramp**: animate `backdrop-filter: blur(8px→0)` together with opacity | + | ++ (tracks "come into focus") | Low | Animating `backdrop-filter` over a WebGL canvas costs a full-screen re-blur per frame. Jank risk on mid-range phones while the draw-in starts. Unverified on iOS Safari. |
| P11 | **Overlap**: start the draw-in when the fade starts, not when it ends | ++ | ++ | Low | Picking stays locked (Q4) until the draw-in ends, so the overlap shortens the lock. The first ~300 ms of the draw-in are half hidden. |
| P12 | **Camera at the final view behind the loader**: `fitBounds(..., { duration: 0 })` before the fade (or MapLibre's `bounds` option at construction) | ++ | ++ | Low | Tiles for the final view must load behind the loader. If the ready signal ignores tiles (it has to, see the e2e and offline facts above), the basemap may still fill in during the fade. |
| P13 | **Ready signal with a cap and an error exit**: sessions hydrated + GPS decoded (Q2), style `load` optional, plus a timeout cap, and removal on a boot error | ++ | — | Low–medium | Without a cap: blocked basemap (e2e, offline) or a GPS worker error (`useGpsBackfill.ts:53`, in the plan) leaves the loader forever. Without the error exit, `RootErrorFallback` is hidden. |
| P14 | **No-JS state**: the same element stays (owner) | ++ | + | Zero | The logo animates forever with no text (Q5). An optional `<noscript>` style could stop it after N cycles (`animation-iteration-count`). |
| P15 | **OS splash interplay** | — | — | Low–medium | Android shows a manifest splash (icon on `#030712`), then the HTML loader: two splashes in a row with a different logo size and position, plus a static-to-animated jump. iOS standalone has no startup images, so the launch frame before `index.html` paints is unverified (possibly white). Startup images would need about 20 PNGs (web.dev). |
| P16 | **e2e skip**: a flag set by `addInitScript` in the existing auto fixture (`e2e/helpers/test.ts:11-19`), which the inline script reads and then hides the loader at once | — | — | Low | A flag read only in React leaves the HTML loader up during React boot. The inline script itself has to read it. Alternatives: a `?loader=off` URL parameter (leaks into `goto` calls), or `navigator.webdriver` (also hits real automation users). |

## 3. Shortlist

All variants share P1 + P4 + P12 + P13. They differ in look, timing and hand-off. The times assume warm-cache data ready at about 0.6 s and a slow case at about 4 s; these are illustrations, not measurements.

Common frame (every variant, before the hand-off):

```
Desktop (1440)                                   390 px phone
┌──────────────────────────────────────────────┐ ┌──────────────────┐
│ #030712 @ 85 %, blur 8 px (map behind once    │ │                  │
│ React mounts; plain dark before that)         │ │                  │
│                                               │ │                  │
│                     ╭───╮                     │ │      ╭───╮       │
│                     │\|/│  96 px L3 logo      │ │      │\|/│ 96 px │
│                     ╰───╯  no text (Q5)       │ │      ╰───╯       │
│                                               │ │                  │
│                                               │ │                  │
└──────────────────────────────────────────────┘ └──────────────────┘
```

### A. "L3 at 1.5 s": half cycle, boundary hand-off

Look: the L3 keyframes at a 1.5 s cycle, 96 px. Timing: at least one cycle (1.5 s), then the next 1.5 s boundary after ready. Hand-off: 400 ms opacity fade, then the draw-in.

```
t:   0        0.6 ready   1.5 boundary   1.9            draw-in →
     [logo cycles ··········|fade 400 ms|] [tracks grow from start points]

Desktop                                          390 px
┌──────────────────────────────────────────────┐ ┌──────────────────┐
│░░░░░░░░░░░░░░░░ fading glass ░░░░░░░░░░░░░░░░│ │░░░ fading ░░░░░░░│
│░░░░░░   ~~~╲__╱~~~  tracks drawing in  ░░░░░░│ │░  ~~╲_╱~~  ░░░░░░│
│░░░░░░░░░░ (logo empty at boundary) ░░░░░░░░░░│ │░░░░░░░░░░░░░░░░░░│
└──────────────────────────────────────────────┘ └──────────────────┘
```

Rationale: smallest change from today's proven rule (empty logo at hand-off); one timing for startup and onboarding.

### B. "Rush to the boundary": 3.0 s look, speeds up on ready

Look: unchanged L3 at 3.0 s. Timing: floor 0.8 s. On ready, all three CSS animations go to `playbackRate = 3` until the cycle ends (at most 1 s), then a 300 ms fade, then the draw-in.

```
t:   0     0.6 ready → ×3     ~1.4 boundary  1.7     draw-in →
     [calm L3 ····|hurry ····|fade 300 ms|] [tracks grow]
     slow case: calm L3 for full 3 s cycles until ready, then ≤ 1 s hurry

Desktop                                          390 px
┌──────────────────────────────────────────────┐ ┌──────────────────┐
│                     ╭───╮                     │ │      ╭───╮       │
│                     │ ⟫ │  strokes retract    │ │      │ ⟫ │       │
│                     ╰───╯  3× faster          │ │      ╰───╯       │
└──────────────────────────────────────────────┘ └──────────────────┘
```

Rationale: keeps the calm onboarding look and the clean boundary while cutting warm starts to about 1–1.7 s.

### C. "Quiet start": delayed logo (Linear pattern)

Look: the glass paints at once. The logo fades in (400 ms) only if not ready after 700 ms. Timing: ready before 700 ms means a 250 ms fade of the glass alone, then the draw-in. Ready later means it behaves like A from the moment the logo appears.

```
fast:  0 ──── 0.6 ready ── 0.85 ── draw-in →     (logo never shown)
slow:  0 ── 0.7 logo fades in ── cycles ── boundary ── fade ── draw-in →

Desktop (fast case)                              390 px (fast case)
┌──────────────────────────────────────────────┐ ┌──────────────────┐
│░░░░░░░░░░░░░ plain dark glass ░░░░░░░░░░░░░░░│ │░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░ (no logo yet) ░░░░░░░░░░░░░░░░░│ │░░░░ no logo ░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ │░░░░░░░░░░░░░░░░░░│
└──────────────────────────────────────────────┘ └──────────────────┘
```

Rationale: the shortest perceived start, as Linear proves; trades the branded moment on fast reloads.

### D. "Glass lifts": overlap with a blur ramp

Look: as A (1.5 s cycle). Hand-off: at the boundary, a 600 ms fade of opacity plus blur 8 → 0 px, **and** the draw-in starts at the same time underneath.

```
t:   0     0.6 ready   1.5 boundary ── 2.1
     [logo cycles ····|glass clears 600 ms ]
                      [tracks draw in ············ →]

Desktop                                          390 px
┌──────────────────────────────────────────────┐ ┌──────────────────┐
│▒▒▒▒▒▒▒▒ blur 8→0, tracks sharpen ▒▒▒▒▒▒▒▒▒▒▒▒│ │▒▒ blur 8→0 ▒▒▒▒▒▒│
│▒▒▒  ~~~╲__╱~~~  growing under the glass  ▒▒▒│ │▒ ~~╲_╱~~ ▒▒▒▒▒▒▒▒│
└──────────────────────────────────────────────┘ └──────────────────┘
```

Rationale: the most continuous hand-off ("tracks come into focus") and a shorter pick lock; the costliest frames on phones (P10).

### E. "Floor and cut": no cycle lock

Look: L3 at 3.0 s. Timing: fade as soon as ready and at least 1.0 s have passed, mid-stroke allowed. Hand-off: 400 ms fade with the logo scaling to 0.92, then the draw-in.

```
t:   0 ──── 0.6 ready ── 1.0 floor ── 1.4 ── draw-in →
     slow case: fade at ready, wherever the strokes are

Desktop                                          390 px
┌──────────────────────────────────────────────┐ ┌──────────────────┐
│                     ╭───╮                     │ │      ╭───╮       │
│                     │\| │ ← cut mid-stroke,   │ │      │\| │       │
│                     ╰───╯   fades and shrinks │ │      ╰───╯       │
└──────────────────────────────────────────────┘ └──────────────────┘
```

Rationale: the simplest and most predictable timing (pure CSS fade, no cycle maths); drops the "empty logo" rule.

**I would test first: B.** It is the only variant that meets Q1 on warm starts (about 1–1.7 s) while keeping both the current 3.0 s look (so the `index.html` keyframes are a 1:1 copy of `theme.css`) and the empty-logo hand-off. Its open risk, whether the 3× rush reads as deliberate or as a glitch, can only be judged on screen. A is the control to compare it against.

## 4. Open questions

1. **Floor on fast starts** (Q1 says "shorter"): (a) no floor: a fast start shows the glass only (C); (b) about 0.8–1.0 s (B, E); (c) one 1.5 s cycle (A, D).
2. **Hand-off point**: (a) at the cycle boundary, empty logo (A, B, D); (b) wherever the strokes are (E).
3. **Cycle length and onboarding**: one shared loader means one timing. (a) 1.5 s for both; (b) 3.0 s for both, with the rush on ready (B); (c) a different speed for onboarding than for startup (two settings for one element).
4. **Hand-off motion**: (a) opacity only, 300–500 ms; (b) opacity + blur ramp (D, phone jank risk); (c) the draw-in waits for the fade to end, or overlaps it.
5. **Cap when "ready" never comes** (blocked or offline basemap, GPS worker error): (a) fade after a cap (for example 10 s) and let late tracks appear without a draw-in; (b) fade after the cap and still draw in whatever arrives; (c) no cap (risk: a stuck loader). Should the map style `load` count toward ready at all?
6. **No-JS page**: (a) the logo animates forever; (b) it stops after N cycles on the full logo (a `<noscript>` style); (c) static logo from the start.
7. **Deep-link reload** (`/sessions/:id` reloaded): Q3 limits the overview draw-in to the initial page load, so does a reload there (a) show the loader and then the detail track without a draw-in; (b) draw in only the detail track; (c) show the loader, then the overview draw-in, then fly to the session?
8. **OS splash interplay**: (a) accept Android's manifest splash followed by the HTML loader; (b) add iOS `apple-touch-startup-image` PNGs (plain `#030712`) against a possible white launch frame; (c) both. The iOS launch frame should be checked on a device first.
9. **Logo size on the phone**: (a) 96 px everywhere (today); (b) 72–80 px at 390 px.
10. **e2e skip**: (a) a flag set in the auto `addInitScript` fixture and read by the inline script (P16); (b) a `?loader=off` URL parameter; (c) `navigator.webdriver`.

## 5. Sources

- Linear served HTML: https://linear.app/login (fetched 2026-10-22)
- Figma served HTML: https://www.figma.com/files (fetched 2026-10-22)
- Google Maps served HTML: https://www.google.com/maps (fetched 2026-10-22)
- Garmin Connect sign-in shell: https://connect.garmin.com/modern/ (fetched 2026-10-22)
- Garmin forum, slow loads: https://forums.garmin.com/apps-software/mobile-apps-web/f/garmin-connect-web/402829/garmin-connect-is-slow-to-load and https://forums.garmin.com/apps-software/mobile-apps-web/f/garmin-connect-web/391638/garmin-connect-web-extremely-slow-to-load-with-run-walk-graph/1860202
- Strava logged-out response: https://www.strava.com/dashboard
- Komoot planner HTML: https://www.komoot.com/plan
- MapLibre MapOptions (`bounds`, `fitBoundsOptions`): https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapOptions/
- MapLibre events (`load`, `idle`): https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapEventType/
- deck.gl TripsLayer: https://deck.gl/docs/api-reference/geo-layers/trips-layer
- PWA splash on Android: https://web.dev/splash-screen/ and https://developer.chrome.com/docs/lighthouse/pwa/splash-screen?hl=en
- iOS startup images: https://web.dev/learn/pwa/enhancements
- WebKit bug, data URLs in startup images: https://bugs.webkit.org/show_bug.cgi?id=280262
