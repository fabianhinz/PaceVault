# Open points (as of 2026-10-13)

Entry point for the next session: what is ready to build, what is still open, and what agents decided without the owner.

## Ready to build (no open questions, wait for the owner's "lets dev")

| Order | Plan                            | Depends on                                                                                                                                                        |
| ----- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `plans/mobile-overlays.md`      | –                                                                                                                                                                 |
| 2     | `plans/stat-tile.md`            | –                                                                                                                                                                 |
| 3     | `plans/studio-route-export.md`  | `mobile-overlays.md` (the Export row goes into the shared ⋮ `ActionsMenu`, which is the floating card on phone)                                                   |
| 4     | `plans/profile-history-mini.md` | `mobile-overlays.md` and `stat-tile.md` (uses `DialogHeader`/`DialogBody`/`DialogFooter`, the built-in grabber, `StatTile`, adds a `required` prop to `StatTile`) |

Built one after another in this order, not in parallel. All four edit `messages/en.json` and `messages/de.json`, so each re-reads both before editing.

## Open topics (owner)

- **Session detail reload performance:** `plans/session-detail-load-perf.md` is a DRAFT. Contains the full trace findings, ranked hot paths and options; its open questions (measure prod first? decode-once approach? defer hidden sections? target) need answers before it becomes a plan.
- **Map auto-zoom:** audit done, no plan yet. The HTML report is at `mockups/map-auto-zoom/report.html`. Summary, from code reading only (nothing observed in a browser):
  - 17 jarring, 8 debatable, 11 good. Sheet drag, resize/rotation, hover, switching overview pages and Studio marker edits do not move the camera.
  - Root cause: `useMapCameraEffect` fits again whenever the `tracks` array is replaced (`src/features/map/hooks/useMapCameraEffect.ts:72`). It is rebuilt on every change to sessions, GPS, filter or trip focus (`src/features/map/hooks/useMapTracks.ts:86`), and GPS is re-read after every sessions change (`src/features/map/hooks/useGpsBackfill.ts:61`), so one data change usually means two fits. No fit checks whether the user moved the map.
  - Worst cases: background data (intervals.icu sync, import, reprocess) moves the map on any page; opening a session first aims at the wrong session (`src/features/map/hooks/useMapCameraEffect.ts:37-50`); opening a trip zooms out to all activities first (`useMapCameraEffect.ts:56-57`); going back moves twice and doesn't restore the previous view (`useMapCameraEffect.ts:54-71`); a selected lap is re-fitted on colour mode, weather or sessions change and a sessions change drops the lap zoom (`src/features/map/hooks/useLapCameraEffect.ts:50`, `src/features/map/hooks/useSessionDetailPath.ts:85`); in Studio, session data changes re-fit the route (`useMapCameraEffect.ts:21-32`).
  - Next step: owner decides whether this becomes a plan.
- **README banner revisit:** once the four ready plans are built, talk about the banner again (the UI it captures will have changed).
- **Onboarding scroll at 1440×800 (to discuss):** after `profile-history-mini.md` the page is 870 px tall on the FIT path and 1020 px on the intervals path (scrollHeight, viewport 800). Cause: the gender/birth-year row, the divider, the "Your values over time" group title and two 102 px tile rows are taller than the five input fields they replace. Options:
  - hide the tile group title and subtitle on onboarding;
  - drop the sparkline row on onboarding, where tiles have no history yet.
- **Three footer buttons on phone (to discuss):** since mobile-overlays, the Studio marker dialog in edit mode puts Delete, Cancel and Save in one row on phone (`src/features/studio/markers/StudioMarkerDialog.tsx:200`, `max-lg:grid-cols-3`; Delete at `StudioMarkerDialog.tsx:202-204`). Owner wants to discuss the layout.
- **Layout shift in the threshold edit dialog (to discuss):** while typing a new value, the field error appears and disappears under the input and the dialog's height jumps. The error goes in as `helperText` (`src/features/settings/ThresholdEditDialog.tsx:56`, passed at `ThresholdEditDialog.tsx:84-85`), and `Input` renders that line only while it is set (`src/components/ui/Input.tsx:43-47`). In the pace dialog the "Estimate from a race time" link takes the same slot, so the swap there changes the content without changing the height.

## Undecided (blank spots)

- **History chart minimum width** (`PROFILE_HISTORY_MIN_DAYS = 30`, `src/lib/profileHistory.ts:6`): likely superseded by `profile-history-mini.md`; confirm when building it.
- **DE decoupling verdict "Driftet"** (`messages/de.json:479`), was "Spürbare Drift".
- **Peak power explanation** still mentions FTP ("around 95 % of your best 20 minutes", `exp_peakPower_range` in `messages/en.json`), although FTP is gone from the cell.
- **Debounce delays:** two local 600 ms constants (`src/features/filters/hooks/useFilterBuilder.ts:7`, `src/features/intervals/IntervalsConnectionForm.tsx:27`). Keep local or share one?
- **Existing comments (no-comments rule):**
  - doc comments at `src/lib/filterGrammar.ts:270`, `src/lib/filterGrammar.ts:334`, `src/lib/filterVocabulary.ts:63`;
  - `// Sources:` headers at `src/packages/engine/stress.ts:1` and `src/packages/engine/zoneDistribution.ts:1`. `SOURCES.md` treats these as a convention.
- **Dead-code candidates:**
  - `saveSessionRecords` and `saveSessionLaps` (`src/lib/indexeddb.ts`) are only used by `tests/lib/indexeddb.integration.test.ts`;
  - exported types only used in their own file in `src/lib/` (`dashboardVolume.ts`, `filterGrammar.ts`, `slidingHighlight.ts`, `weather.ts`). The owner chose "keep exported" for engine constants and in-file engine types; unclear whether that covers `src/lib/`.
- **Test location:** engine tests live in `tests/engine/`, but `src/packages/CLAUDE.md:8` says `tests/packages/`. Move the tests or fix the doc.
- **Filter quotes:** the typographic list (`TYPOGRAPHIC_QUOTES`, `src/lib/filterGrammar.ts:78`) is „…“ “…” ‘…’ »…«. Mixed pairs such as „…” are not accepted.
- **Working-style memory** (orchestrator mode, one topic at a time, "lets dev"): save or not, and with project or user scope.

## Decided by agents without the owner

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
  - batch size 50 (`REPROCESS_BATCH_SIZE`, `src/features/sessions/reprocessSessions.ts:23`);
  - the app is hidden while it runs (`src/components/layout/AppLayout.tsx:58`), so a reload on `/sessions/:id` shows an empty map until it finishes;
  - if a bulk write fails, that chunk's sessions are kept and marked with the new version.
- **Banner capture:** sets the mobile sheet through the store (`scripts/readme/capture.readme.ts:314`), not by dragging. Laps frame 3 can vary slightly between runs.

## Check with real data

- v3 migration on the real sessions with the Performance monitor open: `pvDebug.rerunMigration()` (dev only). Headless never reproduced the 300–600 MB.
- A smart-recording power ride: NP and TSS after the reprocess.
- Peak bars with real power variation; rides under 20 min; power without FTP.
- Importing a real intervals.icu file and a Strava ZIP.
