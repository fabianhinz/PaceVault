# Open points (as of 2026-10-13)

Entry point for the next session: what is ready to build, what is still open, and what agents decided without the owner.

## Ready to build

None. Mobile overlays, stat tile, studio route export and the profile history tiles are built; their plans and mockups are deleted.

## Open topics (owner)

- **Session detail reload performance:** decisions taken 2026-10-14 (React Query decode-once with gcTime 0, long-lived worker for chart rows incl. zoom, manual trace before/after), recorded in `plans/session-detail-load-perf.md`. Still a DRAFT: needs files to modify and steps before it is ready to build.
- **Map auto-zoom:** becomes a plan. All 24 jarring/debatable entries decided 2026-10-14 in `plans/map-auto-zoom.md`; approach, files and verification still to write. The HTML report is at `mockups/map-auto-zoom/report.html`. Summary, from code reading only (nothing observed in a browser):
  - 17 jarring, 8 debatable, 11 good. Sheet drag, resize/rotation, hover, switching overview pages and Studio marker edits do not move the camera.
  - Root cause: `useMapCameraEffect` fits again whenever the `tracks` array is replaced (`src/features/map/hooks/useMapCameraEffect.ts:72`). It is rebuilt on every change to sessions, GPS, filter or trip focus (`src/features/map/hooks/useMapTracks.ts:86`), and GPS is re-read after every sessions change (`src/features/map/hooks/useGpsBackfill.ts:61`), so one data change usually means two fits. No fit checks whether the user moved the map.
  - Worst cases: background data (intervals.icu sync, import, reprocess) moves the map on any page; opening a session first aims at the wrong session (`src/features/map/hooks/useMapCameraEffect.ts:37-50`); opening a trip zooms out to all activities first (`useMapCameraEffect.ts:56-57`); going back moves twice and doesn't restore the previous view (`useMapCameraEffect.ts:54-71`); a selected lap is re-fitted on colour mode, weather or sessions change and a sessions change drops the lap zoom (`src/features/map/hooks/useLapCameraEffect.ts:50`, `src/features/map/hooks/useSessionDetailPath.ts:85`); in Studio, session data changes re-fit the route (`useMapCameraEffect.ts:21-32`).
- **README banner revisit:** due now. The UI it captures changed (phone overlays, stat tiles, settings tiles).
- **Onboarding scroll at 1440×800 (to discuss):** with the threshold tiles the page is 870 px tall on the FIT path and 1020 px on the intervals path (scrollHeight, viewport 800). Cause: the gender/birth-year row, the divider, the "Your values over time" group title and two 102 px tile rows are taller than the five input fields they replace. Options:
  - hide the tile group title and subtitle on onboarding;
  - drop the sparkline row on onboarding, where tiles have no history yet.
- **Three footer buttons on phone (to discuss):** since mobile-overlays, the Studio marker dialog in edit mode puts Delete, Cancel and Save in one row on phone (`src/features/studio/markers/StudioMarkerDialog.tsx:200`, `max-lg:grid-cols-3`; Delete at `StudioMarkerDialog.tsx:202-204`). Owner wants to discuss the layout.
- **iOS keyboard over bottom dialogs (unverified):** `100dvh` doesn't shrink when the keyboard opens, so it may cover the bottom-pinned card and Safari pans the page. Needs a real device or WebKit.

## Undecided (blank spots)

- **Sparkline minimum span** (`PROFILE_HISTORY_MIN_DAYS = 30`, `src/lib/profileHistory.ts:4`): survived the chart and now sets the sparklines' minimum time span. Keep 30 days?
- **DE decoupling verdict "Driftet"** (`messages/de.json:484`), was "Spürbare Drift".
- **Peak power explanation** still mentions FTP ("around 95 % of your best 20 minutes", `exp_peakPower_range` in `messages/en.json`), although FTP is gone from the cell.
- **Debounce delays:** two local 600 ms constants (`src/features/filters/hooks/useFilterBuilder.ts:7`, `src/features/intervals/IntervalsConnectionForm.tsx:27`). Keep local or share one?
- **Existing comments (no-comments rule):**
  - doc comments at `src/lib/filterGrammar.ts:270`, `src/lib/filterGrammar.ts:334`, `src/lib/filterVocabulary.ts:63`;
  - `// Sources:` headers at `src/packages/engine/stress.ts:1` and `src/packages/engine/zoneDistribution.ts:1`. `SOURCES.md` treats these as a convention.
- **Dead-code candidates:**
  - `saveSessionRecords` and `saveSessionLaps` (`src/lib/indexeddb.ts`) are only used by tests (`tests/lib/indexeddb.integration.test.ts`, `tests/store/deleteAllData.integration.test.ts`);
  - exported types only used in their own file in `src/lib/` (`dashboardVolume.ts`, `filterGrammar.ts`, `slidingHighlight.ts`, `weather.ts`). The owner chose "keep exported" for engine constants and in-file engine types; unclear whether that covers `src/lib/`.
- **Test location:** `src/packages/CLAUDE.md:8` says `tests/packages/`. The gpx tests follow it, but the engine tests live in `tests/engine/`. Move them or fix the doc.
- **Filter quotes:** the typographic list (`TYPOGRAPHIC_QUOTES`, `src/lib/filterGrammar.ts:78`) is „…“ “…” ‘…’ »…«. Mixed pairs such as „…” are not accepted.

## Decided by agents without the owner

- **Overlays and tiles build:**
  - names `ActionsMenu` (shared ⋮ menu) and `ui_sheet_drag_close` (grabber label);
  - kept comments in `src/features/studio/markers/StudioMarkerDialog.tsx` (mounted once at route level, `close()` keeps `markerId`, seed effect deps);
  - `Card` and `Input` still destructure props to drop non-DOM props before spreading;
  - onboarding tiles show no date note (Settings tiles always do);
  - a dialog dismissed by drag while the app refuses to close springs back (`src/components/ui/Dialog.tsx:71-79`).
- **Studio export:**
  - `buildGpxString` takes waypoints as a third parameter;
  - a POI exactly on a split is in both neighbouring segment files;
  - all studio e2e tests run with SwiftShader (`test.use` at the top of `e2e/studio.spec.ts`), and the map helpers moved to `e2e/helpers/map.ts`.
- **Profile history tiles:** no scrubbing in onboarding; scrubbing left of a value's first entry shows that first entry; field errors only show once the draft differs from the starting value.
- **More stats:**
  - power cells (Intensity, Peak power) only on rides, even when a run records power (`src/lib/moreStats.ts:166`);
  - coasting counts 0 W, or 0 rpm without power, and only while moving, so indoor rides without speed show none;
  - a third calorie link state: "Add your birth year";
  - Intensity without FTP shows VI only, with `NP … W · Avg … W` on line 3;
  - one ⓘ shows both the IF and VI explanations (`MetricLabel` `relatedMetricIds`).
- **Engine and lib:**
  - deleted `recordEnergySeries`, `recordWorkSeries`, `sessionWorkKj` and the low/high kcal fields. A future carbs estimate will need per-record energy again;
  - `thresholdsAt` throws when resting or max HR has no entry (`src/lib/thresholdsAt.ts:21`), against the "never throw" rule. Unreachable after Zod validation.
- **Settings and onboarding:** the test-data tile doesn't save the form; it sets its own demo profile.
- **Migration:**
  - batch size 50 (`REPROCESS_BATCH_SIZE = INGEST_BATCH_SIZE`, `src/features/sessions/reprocessSessions.ts:23`, `src/features/sessions/createIngestBatcher.ts:11`);
  - the app is hidden while it runs (`src/components/layout/AppLayout.tsx:58`), so a reload on `/sessions/:id` shows an empty map until it finishes;
  - if a bulk write fails, that chunk's sessions are kept and marked with the new version.
- **Banner capture:** sets the mobile sheet through the store (`scripts/readme/capture.readme.ts:314`), not by dragging. Laps frame 3 can vary slightly between runs.

## Check with real data

- v3 migration on the real sessions with the Performance monitor open: `pvDebug.rerunMigration()` (dev only). Headless never reproduced the 300–600 MB.
- A smart-recording power ride: NP and TSS after the reprocess.
- Peak bars with real power variation; rides under 20 min; power without FTP.
- Importing a real intervals.icu file and a Strava ZIP.
