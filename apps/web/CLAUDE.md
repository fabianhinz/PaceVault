# @pacevault/web

**WHY:** The PaceVault PWA: maps, analyses and stores fitness/GPS activities in the browser.
**WHAT:** A pure client-side SPA with no backend server. The browser _is_ the database. Four external dependencies exist: [Open-Meteo](https://open-meteo.com/) for historical weather data — fetched lazily on session detail view and cached in IndexedDB (`session-weather` store); CARTO's vector basemap tiles, whose style is vendored in `src/features/map/darkMatter.style.json` so the map still paints offline (tiles, glyphs and sprites are cached by the service worker as `carto-tiles`, `carto-assets`); [Mapterhorn](https://mapterhorn.com/) terrain (DEM) tiles, fetched only while the 3D map view is on and cached by the service worker as `mapterhorn-dem`; and [intervals.icu](https://intervals.icu/) as an **opt-in** activity source — the user pastes their own API key, and once connected new activities arrive automatically. `src/lib/intervals.ts` is the only call site, and responses are never cached.

Shared code rules (named exports, arrow functions, no destructuring, Zod, no ternaries in `.ts`, …) are in the root `CLAUDE.md` §2. Paths below are relative to `apps/web/`.

## 1. Tech Stack

| Layer         | Choice                                                                                                                                                                                                                                                                                                           |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build & PWA   | Vite 8 (via Vite+) + `@tailwindcss/vite` + `vite-plugin-pwa`                                                                                                                                                                                                                                                     |
| Framework     | React 19, TypeScript 5.9 strict                                                                                                                                                                                                                                                                                  |
| Routing       | React Router v7, imported only in `src/routing/`. Destinations are named pages in `src/routing/pageRegistry.ts`; navigate with `usePageRouting().open({ page, params })`, read URL state with `useRouterParam`, write it with `useRouterQuery`. Rules: `docs/conventions/tdr/navigation-through-router-hooks.md` |
| UI            | `@pacevault/ui` (`packages/ui`): `@radix-ui/*` primitives wrapped and styled with Tailwind v4. Dark mode only. `cn()` from `@pacevault/ui/lib/cn.ts`. No component libraries (no MUI, AntD, Shadcn).                                                                                                             |
| Mapping / GIS | `deck.gl` (core, layers, mapbox), `maplibre-gl`, `react-map-gl`, `@googlemaps/polyline-codec`                                                                                                                                                                                                                    |
| State         | Zustand (`persist` middleware) for global state                                                                                                                                                                                                                                                                  |
| Data Vis      | Recharts                                                                                                                                                                                                                                                                                                         |
| Icons         | `lucide-react`                                                                                                                                                                                                                                                                                                   |
| i18n          | Paraglide.js via `@pacevault/i18n` (`packages/i18n`) — import messages from `@pacevault/i18n/messages.js`, the runtime from `@pacevault/i18n/runtime.js`                                                                                                                                                         |
| File parsing  | `fit-file-parser` for .FIT binaries; GPX via `@pacevault/gpx`                                                                                                                                                                                                                                                    |
| Domain logic  | `@pacevault/engine` (pure functions, `packages/engine`)                                                                                                                                                                                                                                                          |
| Storage       | IndexedDB via `idb` (`src/lib/db.ts`): `kv` (Zustand persist), `session-records`, `session-laps`, `session-gps`, `session-weather`, `fit-files`, `studio-route-points`                                                                                                                                           |
| Toolchain     | **Vite+** (`vp dev`, `vp build`, `vp test`, `vp check`) wrapping pnpm; lint and format settings live in the root `vite.config.ts`                                                                                                                                                                                |

## 2. App Rules

- **Local-first absolute rule**: IDs are generated via `v4()` from the `uuid` package. Never call an external API outside the four documented integrations above (Open-Meteo, CARTO, Mapterhorn, intervals.icu). Each is opt-in or lazily triggered — intervals.icu only once the user enters a key — and the app stays fully usable offline without any of them.
- **Pure engine**: All business logic lives in `@pacevault/engine` (`packages/engine`) as pure functions; the app wires it to stores and UI.
- **Headless UI**: Import Radix primitive → wrap in `@pacevault/ui` (`packages/ui/src/components/`) → style with Tailwind. Kit rules: `packages/ui/CLAUDE.md`.
- **Reuse UI components**: Before inlining layout or UI patterns in feature code, check `@pacevault/ui/components/` for existing components (`PvCardHeader`, `PvStatTile`, `PvValueSkeleton`, etc.). Extract new shared components when a pattern appears in 2+ places. App-bound components (`MetricLabel`, `RootErrorFallback`, `RouteErrorFallback`, `ImportProgressOverlay`, `PaceRange`, `ToastHost`) live in `src/components/`.
- **0 is data, missing is missing**: Only a missing key, `null` or `undefined` means "no data". A recorded `0` (0 W, 0 rpm, 0 km/h, 0 bpm) is a value: never filter it out, never hide it with a truthy check (`if (x)`), never replace missing data with `?? 0`. Chart series keep one point per record, with `null` where the value is missing. Pace is `null` only at speed 0 (division by zero).
- **Required FIT data throws**: Fields the app cannot work without (session `start_time`, `sport`, `total_timer_time`; lap `start_time`, `timestamp`, `total_elapsed_time`, `total_timer_time`; record `timestamp`) throw a `Failed to parse FIT file "<name>": …` error when missing. Everything else is optional and stays `undefined`.
- **Store actions via getState()**: Call Zustand actions with `useStore.getState().action()` at the call site. Do not extract actions via selectors (`const action = useStore(s => s.action)`). Keep selectors only for state values that trigger re-renders.
- **Pages are thin**: Route-level page components live in `src/pages/` (e.g. `DashboardPage.tsx`, `SessionDetailPage.tsx`). They wire route params to features but contain no business logic.
- **Hooks**: A hook lives in the `hooks/` directory of the concept it is about (a feature, a sub-surface such as `features/sessions/session/`, the store), never beside whoever happens to call it; importing it from another feature is normal. `src/lib/hooks/` holds only hooks about no domain concept (DOM, browser, timing, chart interaction). Server reads live in `src/queries/`, writes in `src/mutations/`, routing in `src/routing/`, with no `hooks/` inside them. A hook may sit loose beside a component only while that component, in the same directory, is its sole consumer. Rules: `docs/conventions/tdr/hook-directory-placement.md`.
- **Snackbars**: transient feedback is declared in a `<feature>Snackbars.ts` map (`satisfies SnackbarMap`, `apps/web/src/lib/snackbar.ts`; cross-feature entries in `src/commonSnackbars.ts`) and raised with `useSnackbar().enqueueSnackbar(entry)`; an entry's `key` is its toast id, so a shown entry is not stacked again. Feature code never writes to the toast store. Rules: `docs/conventions/tdr/snackbar-feedback-via-feature-maps.md`.
- **Environment**: Vite reads `.env.local` from `apps/web/` (see `.env.example`).

### UI rules

For code, mockups and plans alike:

- **No reduced-motion handling**: no `prefers-reduced-motion` fallbacks; its absence is not a risk to flag (owner, 2026-10-16).
- **Banners at the very top**: a `Banner` is the page container's first child, above any header, title or actions menu.
- **Same action, same place**: an action keeps its place and label at every width; narrow layouts may shrink secondary actions to icons, never move or rename them. Dialog-like surfaces: status as a chip in the header, Expand and Close (✕) top right; footer with the destructive action spelled out (`danger`) on the left, or in a three-action footer a `danger` icon button with an accessible label, and the primary action on the right.

## 3. Colour Palette

Anything drawn on the map — sport tracks, studio routes, markers — has to hold up against the dark basemap. Check a new or changed colour against these rules before adding it.

- **No blue, cyan, teal or grey on the map.** The basemap's roads, rivers and water are slate blue; a track in that family reads as a street or a river. Blue stays reserved for the app accent, the live-position dot and UI surfaces off the map.
- **Judge a colour by how it renders, not by its swatch.** Tracks blend additively at low alpha, so a single pass is dim and overlaps build brightness. A good track colour has one strong dominant channel: a single pass stays visible, and repeated passes build a heat ramp instead of washing straight to white. Warm hues build the most fire-like ramp.
- **Sport colours must stay apart at every overlap stage**, from one pass to a saturated hot spot, not only as full-strength swatches. Current pair: running green `#4ade80`, cycling fire orange `#f97316`. A new sport takes a hue that is neither of these nor blue.
- **Colour-blind safety is not a criterion** for the map palette; punch and visibility are.
- **Studio routes are never shown alongside session tracks**, so they only need to differ from the basemap and from each other. Studio colour keys are persisted, so renaming or removing one needs a store migration.
- **Zone colours** (blue → green → yellow → orange → red) replace the sport colour on the session detail map rather than appearing next to it, so sharing a hue with a sport colour is acceptable there.
- A sport colour lives in three places that must change together: the map (`src/features/map/trackColors.ts`), the CSS theme (`packages/ui/src/theme.css`) and its JS mirror (`packages/ui/src/lib/tokens.ts`).
- Every colour token in `packages/ui/src/lib/tokens.ts` mirrors one in `packages/ui/src/theme.css`; change both together.

## 4. Surfaces

Every surface takes its background from `@pacevault/ui/lib/surfaces.ts` (`GLASS_CLASS`, `FLOATING_CLASS`, `FLOATING_LG_CLASS`, `TILE_CLASS`, `SCRIM_CLASS`); never hand-copy the class string. Which one to use, by placement: `packages/ui/CLAUDE.md` § Surfaces.

## 5. Verification

From `apps/web/` (or the root scripts in the root `CLAUDE.md` §5):

```bash
vp check                  # fmt + lint + types
vp test -- --run          # vitest (tests/, setup in tests/setup.ts)
vp exec playwright test   # e2e (e2e/, starts its own dev server)
vp build                  # production build
```

Deeper rules: `src/features/CLAUDE.md`, `src/store/CLAUDE.md`, `tests/CLAUDE.md`; translations: `packages/i18n/CLAUDE.md`.
