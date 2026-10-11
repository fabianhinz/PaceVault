# Demo data: one deterministic Munich dataset

## Context

- Onboarding "test data" calls `generateDevData` (`src/pages/OnboardingPage.tsx:9,27`), then `completeOnboarding()` + `setDemoMode(true)`; `DemoBanner` (`src/components/layout/DemoBanner.tsx:10`) reads `demoMode`; `DeleteAllDataDialog.tsx:38-47` clears sessions, trips, studio and resets `demoMode`. Sessions carry `source: { kind: 'demo' }` (`engine/types.ts:34`).
- `src/features/dashboard/generateDevData.ts`:
  - 90 days, ~103 sessions (`:248`), three weekly templates (`:153`), persona (`:36`).
  - `Math.random` + `v4()` → different on every run.
  - Day-offset 0 gets `now + 6–20 h` (`:257`) → sessions in the future.
  - Route stretched over the duration by index (`:97-112`) → GPS length ≠ record distance.
  - Elevation is a random walk from 100/200 m (`lib/factories/records.ts:227,244`); Munich is ~520 m.
  - Laps are fixed 5 min, all `active` (`:365`, `records.ts:369`).
  - Never sets `name`, `gap`, `movingTime`, `elevationLoss`, `fingerprint`, `maxSpeed`.
- Routes: `public/testData.json` (5 foot, 5 bike loops), made by `scripts/generateTestData.ts` via public OSRM (`package.json:16`). The app fetches it at runtime (`generateDevData.ts:31`), but `*.json` is not in the PWA precache (`vite.config.ts:92`), so the demo fails offline.
- `src/lib/factories/records.ts` is imported only by `generateDevData.ts` and `tests/factories/records.ts`. The 13 tests that use it all import through `@tests/factories/records.ts`.
- FIT import sets `stressFtp` whenever power records exist, whatever the sport (`src/parsers/fit.ts:203-207`). The app has no running-power threshold.
- The map camera already fits the densest cluster (`useMapCameraEffect.ts:54-59`), so a far-away trip does not zoom the heatmap out.

## Decisions (settled)

- **One pure builder** `buildDemoDataset({ seed, today })`. It returns profile, sessions, records, laps, trips and studio routes. It reads no clock and has no randomness of its own, so it feeds both onboarding and the later screenshot script.
- **Munich, HOME in Glockenbach** (`11.565, 48.125`), 52 weeks. The owner's e2e FIT fixtures are untouched.
- **Dates relative to today, shifted by whole weeks.** The schedule is written as (week before the end, weekday, local start time). The builder picks the latest week shift that puts the last session on or before yesterday, so the last session lands 1–7 days ago and nothing is in the future.
  - Why: fixed absolute dates would leave the dashboard's relative ranges (7 d, 42 d, this year) empty after a few weeks. Whole-week shifts keep long runs on weekends.
  - Start times are local wall-clock times built with `new Date(y, m, d, h, min)`, so DST is handled. Output is deterministic for a given (seed, today, time zone). The screenshot script will freeze the clock and the time zone.
- **Randomness:** a mulberry32 PRNG (no new dependency). Session IDs come from `v4({ random: rng16() })` (uuid 13), so they are deterministic. Trips and studio routes go through the existing store actions, which keep using random `v4()` and `Date.now()`; the screenshot script reaches them through the UI.
- **Time follows the real route.** Each outdoor record's lat/lng/elevation is interpolated at its cumulative `distance` along the resampled route. Duration falls out of the speed profile, so GPS length equals session distance. Interval sessions and long runs repeat a loop when needed, with the distance wrapping around it.
- **Elevation:** real DEM values from the Open-Meteo elevation API, fetched only by the route script at generation time and stored in the JSON. At runtime: interpolated value plus ±0.3 m smoothed noise. Indoor sessions have no elevation (missing, not 0).
- **Power:** cycling yes (outdoor and indoor), derived from speed and grade with simple physics. 0 W and 0 rpm while coasting or stopped. **No running power**: `fit.ts:203-207` would score it against the cycling FTP.
- **Laps:**
  - Steady sessions auto-lap like a Garmin (1 km running, 5 km cycling), all `active`.
  - Structured sessions use `warmup` / `active` / `rest` … / `cooldown`, with at least 2 rest laps between actives so `hasIntervalStructure` (`lib/laps.ts:31`) detects them.
    - "6×800 m Isar": warmup, then active/rest alternating, then cooldown (warmup, 6 × active, 5 × rest, cooldown = 13 laps). Index 0 = warmup, odd indices 1–11 = the 6 reps, even indices 2–10 = rests, 12 = cooldown. The banner clicks `lap-strip-bar` index 3 = the 2nd rep.
  - Set per lap: `startTime`, `endTime`, `intensity`, `distance`, `totalTimerTime`, `totalMovingTime` (from `movingSeconds`, `lib/movingTime.ts:37`; drives lap pace, `laps.ts:49`), `minHr`/`maxHr` (`detectIntervals`) when the session has HR.
- **Session fields** mirror `fit.ts:242-275`:
  - `deriveSessionFieldsFromRecords` gives `gap` and `maxSpeed`.
  - `calculateSessionStress` gets `ftp` only when the session has power.
  - Also set: `elevationGain`, `elevationLoss`, `subSport` (`treadmill`, `indoor_cycling`), and `fingerprint` via `generateFingerprint(undefined, …)`.
  - Never set the fields `fit-data.md` deletes: session `calories`, `movingTime`, `deviceTss`/`deviceIf`/`deviceFtp`, `min/max/avgAltitude`, `maxPower`; lap `avgSpeed`, `maxSpeed`, `totalAscent`, `min/max/avgAltitude`, `avgHr`, `avgCadence`, `maxCadence`, `repetitionNum`, `totalElapsedTime`. Calories come from `calorie-estimate.md` (records + profile).
- **Missing stays missing:** one ride has no HR strap (power only, `stressMethod: 'tss'`). Rides through the city have short stops (speed 0, which is data) so that lap moving time < timer time.
- **Names:** English strings stored as data (README audience), e.g. "Flaucher easy", "6×800 m Isar", "Starnberger See long ride". They are not i18n messages. Names are final and exported as constants from `demoSchedule.ts`, so the README screenshot script imports them instead of copying strings.
- **Persona:** keep it as is (`generateDevData.ts:36`: female, maxHr 178, restHr 48, FTP 200, threshold pace 5:00/km), plus body data for `calorie-estimate.md`:
  - `birthYear: 1992`.
  - Weight history, 3 entries dated relative to the anchor (week shift like sessions): 62.0 kg at the first week, 60.5 kg after the break, 59.5 kg 6 weeks before the end. Field shape as defined by `calorie-estimate.md`.
  - So every demo session shows a calorie estimate (power, running or HR method).
- **Schedule:** a declarative 52-week block plan (~4.5 sessions/week, ~235 sessions):
  - Base: easy and long runs, treadmill and indoor rides.
  - Build 1: run intervals (6×800 m, 5×1 km, 3×2 km tempo), sweet-spot rides with work/rest laps.
  - A 2-week break: CTL drop, detraining.
  - Lake Garda trip: 5 days, 3 rides and 1 run around Riva, high ATL.
  - Build 2, then a 2-week taper into a half-marathon race (21.1 km, TSB positive), then a recovery week.
  - The last 8 weeks rebuild, so "today" shows rising CTL.
  - Fixed for the README banner (`readme-banner.md`, "Needs from demo-data"):
    - "Starnberger See long ride": outdoor GPS ride, ≥ 50 km, ≥ 2× within the last 90 days before the anchor (tiles 3, 6).
    - "6×800 m Isar" and "Flaucher easy" each occur within the last 8 weeks (tiles 2, 4).
    - "6×800 m Isar": lap order above (index 3 = 2nd rep), HR recorded, and the reps take HR into zone 3+ (tile 2's HR colouring must show more than blue/green).
    - "Flaucher easy": outdoor, 1 km auto-laps, real elevation (GAP, tile 4).
    - Studio route "Tegernsee loop" ships with no split points or waypoints (tile 7 adds them).
  - Loops repeat with small variants, so the distance/duration/elevation fuzzy filters (`lib/attributeFilters.ts:6-10`) get clusters and outliers. The 12 months span "this year", the previous calendar year (typed as `2025`) and "last year" (the rolling last 365 days, per `filter-query.md`) in the filter grammar.
- **Routes:** about 8 overlapping foot loops (Flaucher, Isar south/north, Englischer Garten, Westpark, Theresienwiese, Olympiapark, a 21 km Isar long run) and about 6 bike loops (the existing 5 plus the Isar cycle path to Wolfratshausen), all from HOME. At least one foot loop and one bike loop share streets within ~1 km of HOME (e.g. the Isar path at the Flaucher), and both are used often enough that one point there carries ≥ 3 sessions incl. a run and a ride (banner tile 1's pick). Plus 4 Lake Garda routes and 1 studio route ("Tegernsee loop", about 120 km, never ridden). Only the script touches the network (OSRM + Open-Meteo elevation). The output is bundled as JSON and loaded with a dynamic `import()`, so it is precached and works offline.
- **Weather:** nothing to do. It is fetched live for the shifted dates; the screenshot plan will stub it.

## Affects other plans

- `fit-data.md` (deletes stored-but-unused fields): demo-data needs none of the deleted fields and does not set them (list under "Session fields"). Lap `totalMovingTime` is **kept** there (lap pace, `laps.ts:49`) and demo-data keeps setting it. The city stops stay as speed-0 data either way.
- `calorie-estimate.md`: demo profile carries `birthYear` and a weight history (see Persona); replaces its `generateDevData.ts` persona step.
- `readme-banner.md`: depends on the names, lap order, HR zones, HOME overlap and studio route fixed above.

## Approach

- `scripts/generateTestData.ts` → `scripts/generateDemoRoutes.ts`:
  - New route list.
  - Resample each OSRM polyline to fixed spacing (25 m foot, 50 m bike).
  - Batch elevation lookups (100 points per request).
  - Write `src/features/demo/demoRoutes.json` (`{ key, name, sport, polyline, elevations[] }`, plus `studio` and `trip` groups).
  - `package.json:16`: rename the script to `generate-demo-routes`.
  - Delete `public/testData.json`.
- New `src/features/demo/`:
  - `seededRandom.ts`: mulberry32, `between`, `pick`, `uuid` via `v4({ random })`.
  - `demoSchedule.ts`: the 52-week plan as data (week, weekday, start time, sport, route key, name, steps). No logic.
  - `demoRecords.ts`: route sampling (cumulative haversine, interpolation at distance), speed/power/HR synthesis (HR as a lagged response to step intensity), lap building from steps or auto-lap.
  - `buildDemoDataset.ts`: pure, `({ seed, today, routes }) => DemoDataset`. Holds the week-shift date logic and builds `SessionFields` with the engine helpers listed above. No store or IDB imports.
  - `loadDemoData.ts`: replaces `generateDevData`, with the same progress-store flow (`generateDevData.ts:233,276,372-385`).
    - Dynamic-imports the routes and calls the builder with `today = new Date()` and a fixed exported seed constant (`DEMO_SEED`), so the dataset is identical across runs.
    - Saves records, laps and GPS (`bulkSaveSessionData`, `buildSessionGPS` + `saveSessionGPS`).
    - Calls `addSessions`, `createTrip` + `updateTrip`, and `createStudioRouteFromPoints`, then `invalidatePersonalBests`.
- `src/features/studio/createStudioRoute.ts:13-42`: split into `createStudioRouteFromPoints(points, meta)`. `createStudioRouteFromGpx` keeps its signature and calls it.
- `src/pages/OnboardingPage.tsx:9,27`: switch to `loadDemoData`. The `setDemoMode` flow stays the same.
- Delete `src/features/dashboard/generateDevData.ts`.
- Move the body of `src/lib/factories/records.ts` into `tests/factories/records.ts`, replacing its re-export (`:3-8`), and delete `src/lib/factories/`. The 13 tests keep their imports and behaviour unchanged.
- If building the dataset blocks the main thread noticeably (over ~3 s, measured by hand), move `buildDemoDataset` into `src/features/demo/demoDataset.worker.ts`, following the `gpsBuild.worker.ts` pattern.

## Tests

`tests/features/demo/buildDemoDataset.spec.ts`. Build once in `beforeAll` with a fixed `today`.

- Determinism: same seed and today give a deep-equal dataset, IDs included.
- Dates: every session starts before today's local midnight. The last one is 1–7 days ago, the first one 51–53 weeks before it. A `today` on a DST-switch Sunday changes nothing.
- Map and stats agree: for every outdoor session, the haversine length of the record track is within 1 % of `session.distance`.
- At least one running interval session's laps give `analyzeLaps(...).some((l) => l.isInterval)`.
- Banner contract: the latest "6×800 m Isar" has 13 laps, lap 3 is `active`, its max HR is in zone 3+ for the persona; the latest "Starnberger See long ride" is ≥ 50 km; some record point within 1 km of HOME lies within ~20 m of tracks from ≥ 3 sessions incl. a run and a ride.
- No session or lap sets a field deleted by `fit-data.md`; the profile has `birthYear` and ≥ 2 weight entries.

## Verification

`vp check`, `vp test -- --run`, `vp exec playwright test` (the existing `e2e/onboarding.spec.ts:40` test covers the flow; check that it stays within its 30 s timeout), `vp build`.

By hand:

- Onboarding → test data, online and offline.
- The dashboard shows 12 months of CTL/ATL/TSB with the break and the taper.
- The Munich heatmap has overlapping loops.
- A session map, its elevation (~520 m) and its distance agree.
- An interval session shows work/rest laps.
- A session detail shows a calorie estimate.
- The trip and the studio route are present.
- "Delete all data" clears everything and removes the banner.
