# Open points after the More-stats / thresholds / migration round (2026-10-12)

Everything below is implemented and green (`vp check --no-fmt`, `vp test`, `vp exec playwright test`, `vp build`) unless it says otherwise. This file lists what still needs a decision, what agents decided on their own, and what needs a check with real data.

## Open (owner)

- **Moving time cell: text is scattered.** Line 2 is `3:15:24 / 3:17:29` (`ui_more_stats_of_total`, `messages/en.json:475`). Line 3 on rides is icon-only: `Wind` for coasting and `Pause` for stopped (`src/features/sessions/session/MoreStatsRow.tsx:119`, `:124`). Runs show `Stopped 0:00`. The phone cell has 126 px of usable width, so "of"/"von" and "Coast …/Stop …" did not fit. Sessions of 10 h or more still overflow line 2.
- **Mobile overlays:** more padding, clearer visible edges, better overflow behaviour. Applies to the phone branch of `ResponsivePopover` (`src/components/ui/ResponsivePopover.tsx:36`) and the bottom-sheet dialogs. No research or mockup yet.
- **Onboarding scroll at 1440×800:** 17 px too tall on the FIT path, about 967 px on the intervals path (also in `backlog.md`).

## Undecided (blank spots)

- **History chart minimum width:** `PROFILE_HISTORY_MIN_DAYS = 30` (`src/lib/profileHistory.ts:6`) came from the mockup; the owner said "first entry → today".
- **Copy changed for fit:**
  - DE decoupling verdict "Driftet" (`messages/de.json:480`), was "Spürbare Drift";
  - moving time `/` and icons, see above.
- **Peak power explanation** still mentions FTP ("around 95 % of your best 20 minutes", `messages/en.json:445`), although FTP is gone from the cell.
- **Debounce delays:** two local 600 ms constants (`src/features/filters/hooks/useFilterBuilder.ts:8`, `src/features/intervals/IntervalsConnectionForm.tsx:27`). Keep them local or share one?
- **Existing comments (no-comments rule):**
  - doc comments at `src/lib/filterGrammar.ts:282`, `src/lib/filterGrammar.ts:346`, `src/lib/filterVocabulary.ts:65`;
  - `// Sources:` headers at `src/packages/engine/stress.ts:1` and `src/packages/engine/zoneDistribution.ts:1`. `SOURCES.md` treats these as a convention.
- **Dead-code candidates:**
  - `saveSessionRecords` (`src/lib/indexeddb.ts:7`) and `saveSessionLaps` (`src/lib/indexeddb.ts:58`) are only used by tests;
  - 8 older types are exported but only used in their own file (`dashboardVolume.ts`, `filterGrammar.ts`, `loadAxis.ts`, `slidingHighlight.ts`, `weather.ts`, `sessionDerivation.ts`).
- **Test location:** engine tests live in `tests/engine/`, but `src/packages/CLAUDE.md` says `tests/packages/`. Move the tests or fix the doc.
- **Filter quotes:** the typographic list (`TYPOGRAPHIC_QUOTES`, `src/lib/filterGrammar.ts:91`) is „…“ “…” ‘…’ »…«. Mixed pairs such as „…” are not accepted.
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
- **Settings and onboarding:**
  - onboarding field order follows the plan, not the mockup;
  - the test-data tile doesn't save the form; it sets its own demo profile;
  - the history chart's active dot uses `tokens.textPrimary` instead of white.
- **Migration:**
  - batch size 50 (`REPROCESS_BATCH_SIZE`, `src/features/sessions/reprocessSessions.ts:23`);
  - the app is hidden while it runs (`src/components/layout/AppLayout.tsx:58`), so a reload on `/sessions/:id` shows an empty map until it finishes;
  - if a bulk write fails, that chunk's sessions are kept and marked with the new version;
  - the unused GPS backfill progress state was removed.
- **Filter:** while the "Not understood" debounce runs, the list stays empty instead of showing stale tiles.
- **Banner capture:** sets the mobile sheet through the store (`scripts/readme/capture.readme.ts:314`), not by dragging. With the GPU flag removed, laps frame 3 can vary slightly between runs.
- **e2e:** the ZIP drop tests wait for the dock before dropping (that was the real flakiness).

## Check with real data

- v3 migration on the real sessions with the Performance monitor open: `pvDebug.rerunMigration()` (dev only). Headless never reproduced the 300–600 MB.
- A smart-recording power ride: NP and TSS after the reprocess.
- Peak bars with real power variation; rides under 20 min; power without FTP.
- Importing a real intervals.icu file and a Strava ZIP.
