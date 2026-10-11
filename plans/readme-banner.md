# README rewrite + generated feature banner

## Context

- Runs last: after `plans/demo-data.md` (deterministic Munich 12-month dataset), `plans/filter-query.md`, `plans/mobile-map.md`, `plans/mobile-touch.md`. Screenshots must show the final UI (mobile-touch moves the map pick popup to `ResponsivePopover` at the click point).
- Visual reference: `mockups/banner/index.html?n=7&k=1.5&s=0` (round-2 mockup; `mockups/` is gitignored, open locally). Its notes say 1.75× and "40 km"; the decisions below override both.
- `README.md` is contributor-first, makes wrong claims ("Garmin .FIT files", "efficiency" — no such metric exists; `grep -ri efficiency src` is empty) and shows `app.png` (last touched in #23, outdated). `app.png` is referenced only at `README.md:9`.
- No live link today. `.firebaserc:3` has project `pacevault` → `https://pacevault.web.app`.
- Imports: any FIT, ZIP (`src/lib/archive.ts`), intervals.icu sync (`src/features/intervals/`), GPX for Studio (`src/features/studio/createStudioRoute.ts`). UI in English and German (`project.inlang/settings.json:3-4`). Metric sources: `src/packages/engine/SOURCES.md`.
- Network at runtime: Open-Meteo (`src/lib/weather.ts:297`), CARTO tiles (`src/features/map/mapStyle.ts:9-11`, key optional at `:16`), intervals.icu.
- Existing building blocks: Open-Meteo stub `openMeteoFixture` (`e2e/sessions.spec.ts:7`, used at `:229`); CARTO blocking in `e2e/helpers/seed.ts:13`; `glassClass`/`<Card>` in `src/components/ui/Card.tsx:3`; colour tokens `src/index.css` / `src/lib/tokens.ts`. The app uses Tailwind's default sans stack (no web font).
- `playwright.config.ts` has `testDir: './e2e'`; vitest includes only `tests/**` (`vitest.config.ts:14`); `tsconfig.node.json:25` includes `scripts` (node lib, no DOM, no `@/` alias).

## Decisions (settled)

- **Data:** the demo dataset only, loaded through the onboarding UI exactly like `e2e/onboarding.spec.ts:40` ("test data" tile → "Generate" → close import summary → wait for `[data-layout="dock"]`, 30 s). No dev hook, no `page.evaluate` to load or change data (DOM cleanup and reading `pickCircle` are fine), no app change. Never `data/` or `e2e/fixtures/*.fit`.
- **Session picks:** by the English demo names (stored as data), taking the most recent session with that name in the session list. Never by index or hard-coded id.
- **Overlays:** before every shot the script removes from the DOM (locator + `evaluate`, no app change): `DemoBanner` (renders above every page once `demoMode` is on, located by its text) and the TanStack Query devtools toggle (`button.tsqd-open-btn` and its container `.tsqd-open-btn-container`, injected by `vp dev` at the top-left; the "palm tree" in round 1). Then blur the focused element and park the mouse in a corner (desktop) so no hover state leaks into the shot — except tile 1, whose hover is the point.
- **Determinism:** the anchor is not exported by demo-data — `loadDemoData` passes `today = new Date()`, so freezing the page clock fixes it. `page.clock.setFixedTime(new Date('2026-09-16T12:00:00+02:00'))` (a Wednesday) before first navigation, plus `timezoneId: 'Europe/Berlin'` in the readme Playwright config (demo output depends on seed, today and time zone). The last demo session then lands 1–7 days before the anchor; "all time", "90 days" and readiness are stable. English forced via `addInitScript` (`localStorage.PARAGLIDE_LOCALE = 'en'`) + `locale: 'en-US'`, `reducedMotion: 'reduce'`, `deviceScaleFactor: 2`.
- **Weather:** Open-Meteo intercepted with the shared fixture — never live.
- **CARTO:** live tiles at generation time (with `VITE_CARTO_API_KEY` from `.env.local` if present). Wait for `networkidle` + a short settle before each map shot. Basemap may drift when CARTO/OSM data changes; acceptable, the tracks don't.
- **Location:** `scripts/readme/`. Own Playwright config, file pattern `*.readme.ts` so neither `vp exec playwright test` nor vitest picks it up. Not part of CI or the verification suite.
- **Banner (round-2 variant C):** 1600 × 900 CSS px @2x, page background `surface-sunken`, app sans stack. No chips.
  - Background: the tile-1 shot, `object-fit: cover`, blurred (~28 px), slightly saturated, ~35 % opacity, bleeding past the edges; everything else sits on top behind glass.
  - Title strip: `public/favicon.svg` (64 px) + `Typography h1` "PaceVault" over `Typography body1` (`textSecondary`) "Your training, analyzed locally. No account. Works offline."
  - Body: `grid-cols-[1fr_272px_272px]`. Left: 3 × 2 grid of 5 desktop tiles, the heatmap spans both rows. Right: 2 phone tiles (frame ~232 px wide, 390:844, rounded, `gray-800` border; shot `object-fit: cover`, `object-position: top`). Each frame has a drawn iOS-style status bar row above the shot ("9:41" left; right: lucide `Signal` + `Wifi` + `BatteryFull` on tile 6, `Plane` + `BatteryFull` on tile 3 = airplane mode, the offline cue a screenshot alone can't give).
  - Each tile is one `<Card>` (content surface → `glassClass`): screenshot (`object-fit: cover` with a per-tile `object-position`, rounded), then the title/subtitle pair `CardHeader` uses — `Typography title` + `Typography caption` — at 1.5× (`zoom: 1.5` on the text block, so 24/18 px; variants unchanged). Title strip text gets the same 1.5×. Text never wraps; overflow is a bug.
  - Rendered as a React page served by `vp dev`, importing `@/index.css`, `Card` and `Typography` directly — no copied class strings or hex values.
- **Output:** committed `docs/readme/de_banner.png` (embedded in README) and `docs/readme/en_banner.png`; `vp run readme:banner [--locale de|en]` (default `de`, via `scripts/readme/run.ts` → `README_LOCALE`); raw tile shots in `scripts/readme/out/<locale>/` (gitignored). `app.png` deleted.
- **Rendering:** Playwright `channel: 'chromium'` (full build, new headless, real GPU). The headless shell / SwiftShader composited `backdrop-filter` only partly and `clip` screenshots dropped it, so every shot is a whole-window screenshot cropped in a helper page, taken after animations finish and two frames match.
- **Tiles (final):** 7. The local-first claim lives in the title strip; the storage tile and Personal bests are out.

  | #   | Shot                                                                                         | Viewport | Place           | Session                                     |
  | --- | -------------------------------------------------------------------------------------------- | -------- | --------------- | ------------------------------------------- |
  | 1   | `/`, locate me at a point on the Isar shared by runs and rides, click the dot → pick popover | desktop  | left, both rows | tracks under the dot (≥ 3, run + ride)      |
  | 2   | session detail, Color by → Heart rate, no lap selected                                       | desktop  | grid            | most recent "6×800 m Isar" (all 5 HR zones) |
  | 3   | GAP chart with a selected 1 km lap, stacked over the dock filter with the typed query        | desktop  | grid            | most recent "Flaucher easy"                 |
  | 4   | dashboard Current Form gauges + Performance Metrics                                          | desktop  | grid            | dashboard                                   |
  | 5   | Studio: route with 2 split points, 1 waypoint, export popup open                             | desktop  | grid            | studio route "Tegernsee loop"               |
  | 6   | session detail offline (preview build, SW cache): map, track, stats                          | mobile   | phone 1         | most recent "Starnberger See long ride"     |
  | 7   | session detail, Color by → Wind, weather card expanded                                       | mobile   | phone 2         | most recent "Dachau loop"                   |

  Titles, subtitles, tagline and the typed filter live per locale in `scripts/readme/tiles.ts` (`BANNER_TEXT`); tile 3's subtitle quotes the typed query exactly (en "ride 50", de "rad 50", 3 readings each).

  No "only/first/unique" claims, no trademarked metric names (TSS/NP/IF). Tile 1 leads with interactivity (the heatmap is clickable, not a static image) without claiming nobody else does it. Tile 3's subtitle is exactly the typed text; change both together.

- **Tile 1 capture:** desktop, geolocation granted and set to a point on the Isar shared by the Isar runs and the Starnberger / Wolfratshausen rides; click "locate me", find the blue position dot in the screenshot, click it → pick popover (≥ 3 sessions, run + ride). Mouse stays on the dot. GPX export is only named in the subtitle.
- **Tile 2 capture:** session picked by scoring every demo GPS session's HR/power zone share along the track; "6×800 m Isar" spreads over all five HR zones on a compact route. Color by → Heart rate, no lap selected, no zoom.
- **Laps/GAP and filter share one tile; weather gets its own phone tile (7 tiles stay):** GAP is the smaller share (2 : 3 stacked with the filter shot).
- **Tile 6 capture (offline):** the SW is only registered in a production build (`VitePWA` has no `devOptions`, `vite.config.ts:89-120`), so this test runs against `vp build && vp preview` (own origin, own demo load). Steps: load demo data → `navigator.serviceWorker.ready`, reload so the SW controls the page → open the session online at the shot viewport (Open-Meteo stubbed via `context.route`, which also sees SW requests) → `networkidle` + settle so `carto-tiles`/`carto-assets` and the `session-weather` IDB entry are filled (check `caches.has('carto-tiles')`) → `context.setOffline(true)` plus `context.route` aborting `cartocdn.com` and `open-meteo.com` (proves cache only) → `page.reload()` → settle → shot (weather card collapsed; it gets tile 7). Map tiles, track and stats must render; a blank basemap fails the run.
- **Tile 3 typed text:** en "ride 50" / de "rad 50" — a bare number reads as km, days and min, so the filter shows 3 readings against the demo data.
- **README:** users first, contributors at the bottom of the same file.

## Approach

1. **Shared weather stub:** move `openMeteoFixture` from `e2e/sessions.spec.ts:7` to `e2e/helpers/openMeteo.ts` (named export); import it in `e2e/sessions.spec.ts` and the readme script (2 call sites → shared).
2. **`scripts/readme/playwright.config.ts`:** `testDir: '.'`, `testMatch: '*.readme.ts'`, `workers: 1`, `retries: 0`, `reporter: 'list'`, chromium only, `baseURL` + `webServer` as in `playwright.config.ts` (`vp dev`, reuse existing server), plus a second `webServer` `vp build && vp preview --port 4173 --strictPort` used only by the offline tile (absolute URL).
3. **`scripts/readme/capture.readme.ts`:** one `beforeEach` (clock, locale, Open-Meteo route, load demo data via the onboarding "test data" tile), one `test` per tile writing `scripts/readme/out/<n>-<slug>.png` (element or viewport screenshot; desktop 1440 × 900, mobile 390 × 844 with `isMobile` + `hasTouch`). Overlay removal (see Decisions) before every shot. Pick sessions by name (see table below). Tiles 1 and 2 follow the capture steps in Decisions. Tile 7 opens the shipped studio route "Tegernsee loop" and adds 2 split points + 1 waypoint through the UI (Tools), then opens the export popup — demo-data ships the route without them, by design. Final `test` opens `/scripts/readme/banner/index.html` and screenshots `#banner` to `docs/readme/banner.png`.
4. **`scripts/readme/banner/`** (`index.html`, `main.tsx`, `Banner.tsx`): reads the tile list (shared `tiles.ts`: file, title, subtitle, viewport, place, `object-position`) and renders variant C (Decisions → Banner); images loaded from `/scripts/readme/out/`. Dev-only page — `vp build` input stays `index.html`.
5. **tsconfig:** add `scripts/readme/banner` to `tsconfig.app.json:35` include; exclude it from `tsconfig.node.json:25` (DOM + `@/` alias needed). `capture.readme.ts`, `tiles.ts`, config stay under the node config.
6. **`package.json`:** `"readme:banner": "vp exec playwright test -c scripts/readme/playwright.config.ts"`.
7. **`.gitignore`:** `scripts/readme/out/`.
8. **`README.md`** rewrite, in this order:
   - Title, one-line pitch (local-first training log for runners and cyclists in the browser), `![PaceVault features](./docs/readme/banner.png)`, **Try it: https://pacevault.web.app** (installable PWA, works offline).
   - Features (short bullets): interactive heatmap (click a track → its sessions); session detail colored by HR/power/wind zones, laps, splits, GAP; historical weather + wind; fitness/fatigue/form, readiness, ACWR; personal bests; natural-language filters; Studio (GPX import, split points, waypoints, segment export); English/German UI.
   - Getting your data in: any `.FIT` file, ZIP archives of FIT files, intervals.icu sync (own API key), GPX into Studio. No "Garmin-only" wording.
   - Privacy & offline: no account, no server; all data in the browser (IndexedDB). Only three optional network services: Open-Meteo (weather, on session open), CARTO (map tiles), intervals.icu (only once you add a key). Works offline without them (installable PWA; map tiles you've viewed are cached).
   - Metrics & sources: link `src/packages/engine/SOURCES.md`.
   - Contributing (existing Getting Started, verification suite, crash-report section — unchanged content) + "Regenerating the README banner" (`vp run readme:banner`, needs network for tiles, optional `VITE_CARTO_API_KEY`).
9. Delete `app.png`.

## Demo sessions per tile

| Tile | Demo data used                                                                                                                 |
| ---- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1    | all Munich foot + bike loops from HOME (camera fits the densest cluster, Garda trip ignored); runs and rides overlap near HOME |
| 2    | most recent "6×800 m Isar" (HR, real DEM elevation, warmup/active/rest laps); `lap-strip-bar` index 3                          |
| 3    | most recent "Starnberger See long ride" (outdoor GPS; weather from the stub, cached before going offline)                      |
| 4    | most recent "Flaucher easy" (1 km auto-laps, elevation → GAP)                                                                  |
| 5    | dashboard as is (last 8 weeks rebuild → rising CTL)                                                                            |
| 3    | filter "ride 50" / "rad 50" → about 50 km, last 50 days, about 50 min                                                          |
| 7    | studio route "Tegernsee loop"                                                                                                  |

## Needs from demo-data

- `loadDemoData` passes a fixed seed constant (not random), so the dataset — and tile 2's zoomed view — is identical across runs.
- The session names above are final and exported from `demoSchedule.ts` (the script imports them instead of copying strings).
- "Starnberger See long ride" is ≥ 50 km and occurs ≥ 2× within the last 90 days (the rebuild weeks).
- "6×800 m Isar" and "Flaucher easy" each occur within the last 8 weeks, so the session list reaches them without scrolling far.
- "6×800 m Isar" laps are warmup, active, rest, active, …, so index 3 is an active rep, and its HR reaches zones 3+ (the mockup's ride stayed in zones 1–2 → only blue/green).
- Foot and bike loops share streets near HOME, so a single click hits both sports.

## Tests

None. The script is a dev tool, not app behaviour (`tests/CLAUDE.md`: skip thin wrappers; no render/snapshot tests). The moved `openMeteoFixture` stays covered by the existing weather test in `e2e/sessions.spec.ts`.

## Verification

- `vp run readme:banner` twice → tiles and `docs/readme/banner.png` look identical (basemap aside); text fits at 1.5×, no overflow, no DE strings, no demo banner or devtools button; tile 3 shows basemap, track and weather with no network.
- Banner matches `mockups/banner/index.html?n=7&k=1.5&s=0`, plus tile 1's open pick popover.
- `vp exec playwright test` does not run `capture.readme.ts`; weather e2e still green.
- `vp check`, `vp test -- --run`, `vp build` (no banner page in `dist/`).
- README on GitHub (branch view): banner renders via relative path, live link opens, no reference to `app.png`.
