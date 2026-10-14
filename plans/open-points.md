# Open points (as of 2026-10-14)

Entry point for the next session: what is ready to build, what is still open, and what agents decided without the owner.

## Ready to build

- **Session detail reload performance:** `plans/session-detail-load-perf.md` is complete (React Query decode-once with gcTime 0, long-lived worker for chart rows incl. zoom, loading states, id-only worker requests). Blocked only on the owner's baseline DevTools trace (reload `/sessions/:id`, 4x CPU, same session, dev and prod preview) before anything changes.

Map auto-zoom (one camera owner, `src/lib/mapCamera.ts`, one unit test per decision in `tests/lib/mapCamera.spec.ts`), overview track intensity and persisted map preferences (`src/store/mapPreferences.ts`) are built; their plans and mockups are deleted.

## Open topics (owner)

- **README banner revisit:** due now. The UI it captures changed (phone overlays, stat tiles, settings tiles).
- **Onboarding scroll at 1440×800 (to discuss):** with the threshold tiles the page is 870 px tall on the FIT path and 1020 px on the intervals path (scrollHeight, viewport 800). Cause: the gender/birth-year row, the divider, the "Your values over time" group title and two 102 px tile rows are taller than the five input fields they replace. Options:
  - hide the tile group title and subtitle on onboarding;
  - drop the sparkline row on onboarding, where tiles have no history yet.
- **Three footer buttons on phone (to discuss):** since mobile-overlays, the Studio marker dialog in edit mode puts Delete, Cancel and Save in one row on phone (`src/features/studio/markers/StudioMarkerDialog.tsx:200`, `max-lg:grid-cols-3`; Delete at `StudioMarkerDialog.tsx:202-204`). Owner wants to discuss the layout.
- **Map flashes on track hover (exists on main):** sometimes the whole map flashes when hovering a track, at every track intensity. Not caused by rebuilding the track data on hover (memoised separately now, `src/features/map/DeckGLOverlay.tsx:135-143`; didn't help). deck.gl 9.2 renders interleaved into MapLibre 5.18's GL context (`src/features/map/DeckGLOverlay.tsx:415-416`); `interleaved: true` must stay, it fixed the track/tile drift in the iOS standalone PWA (commit `78eb897`). Suspects, both untested: the tracks' additive blend parameters (`src/features/map/trackColors.ts:3-10`) leaking into a basemap frame, or the hover pick pass forcing a redraw with incomplete GL state. Next step: check both versions against known interleaved flicker/blend issues and prepare switchable experiments for the owner to try in a real browser (headless SwiftShader may not reproduce it).
- **iOS keyboard over bottom dialogs (unverified):** `100dvh` doesn't shrink when the keyboard opens, so it may cover the bottom-pinned card and Safari pans the page. Needs a real device or WebKit.

## Undecided (blank spots)

None.

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
