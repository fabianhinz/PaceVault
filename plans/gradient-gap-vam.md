# GAP and gradient: one derived gradient, Strava-shaped curve

Research: `scratchpad/gap/` (window analysis on 10 runs), `scratchpad/gap-model/` (model comparison against the owner's HR-equivalent pace). Mockup for VAM: `mockups/gradient-gap-vam/index.html` (in progress).

## Context

- GAP and the Grade chart only appear when a file has a device `grade` field (`src/lib/chartData.ts:74`, `:88`). None of the owner's trail runs has one (intervals.icu-generated FIT, Garmin/Apple TCX), so trail runs show neither.
- Session GAP is still computed at import from a raw record-to-record slope (`src/packages/engine/normalize.ts:65-111`, `src/parsers/fit.ts:256-259`): biased fast (convex cost curve) and it counts stops and timer pauses as running time (`normalize.ts:98`), which shifts it by 50–90 s/km on trail runs.
- Three separate GAP paths: stored session value (`src/features/sessions/charts/SessionChartsExplorer.tsx:192`), range value (`src/lib/railRange.ts:108`), per-point series (`src/lib/chartData.ts:93-98`, per-point average vs. distance-weighted session value).
- Studio uses a 30 m window (`src/packages/gpx/routeProfile.ts:28`) and a 50 m window (`src/packages/gpx/routeGeometry.ts:33`).
- Minetti is off by ~2× on descents against the owner's HR data; a Strava-shaped curve fits best on every terrain class.

## Decisions (settled)

- **One gradient for all sources**: always derived from elevation + distance over a centred **50 m distance window**; device `grade` is ignored. Shared engine helper used by sessions (GAP chart, session GAP, rails, Grade chart, min/max grade in `src/lib/recordExtremes.ts`, `src/lib/railRange.ts`) and the Studio (`routeProfile.ts`, `routeGeometry.ts`). Window never bridges missing elevation; records without distance are skipped; stops (same distance) merge.
- **Curve**: Strava-shaped, our own fit to public anchors (minimum ≈ 0.88 at −9 %, 1.0 at −18 %, uphill ≈ Minetti shifted ~2 %; Kay 2012), cited in `src/packages/engine/SOURCES.md`. Gradient limited to **±30 %**.
- **Pairing**: only neighbouring records with speed > 0 and dt ≤ 10 s (fixes stops/pauses counted as running time).
- **Steep climbs**: keep GAP and add **VAM** (metres climbed per hour, m/h) for all sports, mockup `mockups/gradient-gap-vam/index.html` variant **4** (elevation profile, single colour):
  - The elevation profile highlights every climb in **one** colour of the elevation violet family (no colour ramp: with few climbs a relative ramp exaggerates tiny differences). VAM appears as numbers only.
  - The elevation rail shows "↗ 840 m/h" on hover over a climb and the average VAM of the climbs at rest (session, lap or zoom range; zoom wins over lap). Nowhere else (not in the summary card or header).
  - Climb detection with **hysteresis** on the shared 50 m gradient: a climb starts at the sport's threshold (running ≥ 15 %, cycling ≥ 5 %) and continues until the gradient drops clearly below it (exit: running < 10 %, cycling < 3 %); flatter bits inside a climb count.
  - Minimum size: running ≥ 40 m gain and ≥ 90 s; cycling ≥ 50 m gain and ≥ 2 min. Merge climbs separated by less than 120 s (running) / 60 s (cycling). VAM rounded to 10 m/h.
  - VAM over moving time only (same pairing as GAP: speed > 0, dt ≤ 10 s); descents never form a climb; missing elevation splits a climb and shows `--`.
  - Name "VAM" in EN and DE; the ⓘ explains "metres climbed per hour".
- ⓘ text for GAP rewritten (today's "GAP slower than actual pace = downhill coasting" becomes wrong).
- **Fitted curve**: f(g) = 1 + 2.754·g + 15.69·g² + 3.723·g³ + 7.218·g⁴ (g as a fraction, ±0.30), cited with `@see` tags in `normalize.ts` and documented in `SOURCES.md`.
- **Hover** over a climb shows that climb's VAM.
- The ⓘ on the elevation row explains VAM when the session has climbs.
- **Climb colour**: violet-300 `#c4b5fd` (`chart-climb` token).
- **Storage**: old sessions get the new GAP through the automatic reprocessing (`plans/session-reprocessing.md`); TSS stays frozen.

## Open

- None.

## Tests

- Climb detection: hysteresis keeps a flatter bit inside a climb; minimum size per sport; merge gap per sport.

- Regression: "session GAP ignores stops and timer pauses".
- Regression: "trail runs without a grade field get a GAP and a Grade chart".
- Gradient helper: 50 m window, missing elevation not bridged, stops merged.
- Curve: f(0) = 1, minimum ≈ 0.88 near −9 %, clamp at ±30 %, monotone on [−9 %, +30 %].

## Verification

`vp check`, `vp test -- --run`, `vp exec playwright test`, `vp build`; by hand on a trail run (GAP chart, Grade chart, rails) and a Studio route.
