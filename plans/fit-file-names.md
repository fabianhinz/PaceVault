# FIT import: intervals.icu file names and Strava `.fit.gz`

## Context

- A FIT file has no field for the user's activity title; the title only comes from the intervals.icu API (`meta.name`, `src/parsers/fit.ts:221`) or from the file name via `extractSessionName` (`src/lib/filename.ts:6-16`, pattern `^\d+_(.+)\.fit$`, `_` → space).
- intervals.icu downloads are named `i<id>_<Name>.fit` (e.g. `i183955644_Bad_Herrenalb_Trailrunning.fit`). The leading `i` doesn't match the pattern, so manually imported intervals.icu files lose their title and get the sport + time-of-day fallback.
- ZIP import (`src/lib/archive.ts`, `fflate`) extracts only entries ending in `.fit`/`.tcx` (`archive.ts:7`), and the upload flow keeps only `.fit` (`src/features/sessions/hooks/useFileUpload.ts:34-35`). Strava's bulk export stores activities as `activities/<id>.fit.gz`, so such a ZIP imports nothing today.
- Research (exporters' naming): only intervals.icu puts the title in the file name; Garmin (`<id>_ACTIVITY.fit`), Wahoo, Zwift, Polar, Suunto, HealthFit, Golden Cheetah use ids or dates. Strava keeps titles in `activities.csv`, Garmin probably in `summarizedActivities.json`.
- Directions considered: (1) accept the `i` prefix, (2) unpack `.fit.gz`, (3) read Strava's `activities.csv`, (4) Garmin nested ZIPs + JSON, (5) names inside the FIT. This plan covers 1 and 2.

## Decisions (settled)

- **intervals.icu names:** `extractSessionName` accepts an optional `i` before the id (`^i?\d+_(.+)\.fit$`). Everything else about the name (underscores → spaces, name order source → stored → fallback) stays.
- **Strava `.fit.gz`:** ZIP entries ending in `.fit.gz` are extracted and gunzipped (`fflate`'s `gunzipSync`) and imported like `.fit`. The file name used for the session is the inner name without `.gz`. Strava's numeric file ids carry no title, so these sessions get the fallback title.
- Single `.fit.gz` uploads outside a ZIP are not part of this plan.

## Approach

- `src/lib/filename.ts:7`: widen the pattern.
- `src/lib/archive.ts`: recognise `.fit.gz` entries (extension stays `.fit` for the caller), decompress in `extractArchiveEntry`; remove the two stale comments (`archive.ts:5-6`).
- `src/features/sessions/hooks/useFileUpload.ts:34-35`: no change expected if the entry reports `.fit`; verify.

## Open

- Direction 3 (titles from Strava's `activities.csv`) — only if Strava bulk export becomes a real import path.

## Tests

- `tests/lib/filename.spec.ts`: regression "intervals.icu file names keep their title" (`i183955644_Bad_Herrenalb_Trailrunning.fit` → "Bad Herrenalb Trailrunning").
- `tests/lib/archive.spec.ts`: a ZIP with `activities/123.fit.gz` lists one `.fit` entry and extracts the decompressed bytes.

## Verification

`vp check`, `vp test -- --run`, `vp exec playwright test`, `vp build`; by hand: import an intervals.icu FIT (title kept) and a ZIP with a `.fit.gz` entry (session imported).
