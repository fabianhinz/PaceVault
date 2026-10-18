# Ideas

Each point stands on its own: what, where, next step.

## To decide

- **Onboarding scrolls at 1440×800:** 870 px tall on the FIT path, 1020 px on the intervals path. Options: hide the "Your values over time" title and subtitle on onboarding, or drop the sparkline row there (no history yet).
- **Studio marker dialog on phone:** in edit mode Delete, Cancel and Save share one row (`src/features/studio/markers/StudioMarkerDialog.tsx:200`). Decide the layout.
- **Average HR missing from the FIT summary:** some files have HR records but no session `avg_heart_rate`/`max_heart_rate`. Avg and max then show "--", and the load falls back to the duration estimate instead of TRIMP (`src/parsers/fit.ts:183`, `src/parsers/fit.ts:220-221`; power and cadence already fall back to records at `src/parsers/fit.ts:189`). Decide: derive avg/max HR from records when the summary lacks them, and whether stored sessions get reprocessed.

- **TSS only for rides (runs on TRIMP):** cycling FTP is applied to running power today (`running.fit`: 78 TRIMP → 206 TSS). Decide whether runs use TRIMP only; also fixes the onboarding FTP hint (R-O7).
- **Move memory rules into the workflow skills:** today the skills reference `feedback_*` memory files.
- **Rules vs code:** CLAUDE.md says no destructuring, no snapshots, arrow functions only and one shared hooks folder, but `src/components/ui` uses `{ className, ...rest } = props` (9 files, e.g. `src/components/ui/Tabs.tsx:6`), `tests/packages/gpx/__snapshots__/` exists, 6 `function` declarations sit in tests (`tests/factories/sessions.ts:6`), and `src/hooks/useMetrics.ts` sits next to `src/lib/hooks/`. Decide per item: fix the code or document the exception. Spun off from repo-restructure.
- **Stale memory paths:** `feedback_impl_review_and_acceptance` (says reviews are "not committed" and names `reviews/`, `mockups/`, `plans/<feature>.md`) and `feedback_lets_dev_gate` ("Plans in ./plans") still name the old paths. Until fixed, the skills state "workbench paths override path mentions in memory".

## To investigate

- **Status guard false positives:** the Bash rule blocks reading a plan (`cp workbench/x/plan.md /tmp/…`), heredoc text that mentions a `plan.md` path together with `rm`, and any file name ending in `plan.md` (e.g. `techplan.md`). Workaround so far: `cat … > file` with a neutral name. Tighten to the destination argument of `cp`/`mv` and to whole path segments.
- **Tune demo data / defaults for efforts:** with the plan defaults, demo run warm-ups are labelled work (demo warm-up pace is faster than 0.88 × threshold speed of 5:00/km), so the chip shows a count instead of the pattern; hilly demo rides (Lago di Tenno climb, Passo San Giovanni loop) give 10–20 climb "efforts". Tune the demo persona or the detection defaults (from the dynamic-efforts review, O2).
- **iOS keyboard over bottom dialogs:** `100dvh` doesn't shrink when the keyboard opens, so it may cover the bottom card. Needs a real device.
- **v3 migration on real sessions with the Performance monitor open:** `pvDebug.rerunMigration()` (dev only). Headless never reproduced the 300–600 MB.
- **Peak bars with real power variation:** rides under 20 min; power without FTP.

## Decided by agents (owner not consulted)

- **Overlays and tiles:** shared `ActionsMenu`; a dialog dragged closed while the app refuses to close springs back; onboarding tiles show no date note.
- **Studio export:** a POI exactly on a split lands in both segment files.
- **Profile history tiles:** no scrubbing in onboarding; field errors only once the draft changes.
- **More stats:** power cells only on rides; coasting = 0 W (or 0 rpm without power) while moving; Intensity without FTP shows VI only.
- **Engine:** per-record energy series deleted (a carbs estimate would need it again); `thresholdsAt` throws on a missing HR entry (`src/lib/thresholdsAt.ts:21`), unreachable after Zod validation.
- **Migration:** batch size 50; the app is hidden while it runs; a failed bulk write keeps that chunk's sessions.

## Loose ideas

- **3d map on session details page**
- **Rename "feature" to "item" in the workflow:** backlog items are features and bugs; skill names (`feature-*`), `feature-worker` and the skill texts still say "feature". Follow-up to repo-restructure, which only changes the paths.
