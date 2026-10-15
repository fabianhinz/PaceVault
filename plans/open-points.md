# Open points

Each point stands on its own: what, where, next step.

## Ready to build

- **Session detail reload performance:** plan in `plans/session-detail-load-perf.md`. First record the baseline DevTools trace: reload `/sessions/:id`, 4x CPU slowdown, same session, dev and prod preview.

## To decide

- **Onboarding scrolls at 1440×800:** 870 px tall on the FIT path, 1020 px on the intervals path. Options: hide the "Your values over time" title and subtitle on onboarding, or drop the sparkline row there (no history yet).
- **Studio marker dialog on phone:** in edit mode Delete, Cancel and Save share one row (`src/features/studio/markers/StudioMarkerDialog.tsx:200`). Decide the layout.

## To investigate

- **iOS keyboard over bottom dialogs:** `100dvh` doesn't shrink when the keyboard opens, so it may cover the bottom card. Needs a real device.

## Check with real data

- v3 migration on real sessions with the Performance monitor open: `pvDebug.rerunMigration()` (dev only). Headless never reproduced the 300–600 MB.
- A smart-recording power ride: NP and TSS after the reprocess.
- Peak bars with real power variation; rides under 20 min; power without FTP.
- Importing a real intervals.icu file and a Strava ZIP.

## Decided by agents (owner not consulted)

- **Overlays and tiles:** shared `ActionsMenu`; a dialog dragged closed while the app refuses to close springs back; onboarding tiles show no date note.
- **Studio export:** a POI exactly on a split lands in both segment files.
- **Profile history tiles:** no scrubbing in onboarding; field errors only once the draft changes.
- **More stats:** power cells only on rides; coasting = 0 W (or 0 rpm without power) while moving; Intensity without FTP shows VI only.
- **Engine:** per-record energy series deleted (a carbs estimate would need it again); `thresholdsAt` throws on a missing HR entry (`src/lib/thresholdsAt.ts:21`), unreachable after Zod validation.
- **Migration:** batch size 50; the app is hidden while it runs; a failed bulk write keeps that chunk's sessions.
