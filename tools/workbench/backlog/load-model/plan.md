---
title: Load and effort model
status: ready
created: 2026-10-19
type: bug
areas: [engine, app, i18n, ui, repo]
next: Owner sets ready, then "lets dev" (commit studio-marker-dialog-phone and code-conventions first)
---

# One model for load and effort

## Context

The load and effort features grew one by one and drifted apart: dashboard load chart, form (TSB, ACWR), session training effect, More stats (load tile, IF) and effort detection. Goal (owner, 2026-10-21): one consistent, transparent model behind all of them, so users get insights instead of contradictions; one shared basis, not one number. Folds in tss-rides-only, fit-hr-fallback, effort-demo-tuning and the 2026-10-21 backlog sweep.

## Decisions (settled)

- **Input per sport:** rides take TSS from power when NP and an FTP exist; runs never take TSS, they take heart rate (Q1, Q5). Without HR a session falls back to the duration estimate.
- **One threshold for HR load:** an optional, dated threshold HR in the profile and in onboarding; an hour at threshold HR scores 100, like an hour at FTP; without it the estimate at 88% of HR reserve applies (Q3).
- **HR from records:** avg/max HR come from the FIT summary, from the records when the summary lacks them; stored sessions are reprocessed (Q2).
- **Efforts:** detection gets hysteresis for everyone (enter at ≥ 88% FTP, leave only below ~80%); the demo data is built as the best case of how the app works (Q4). The same enter/leave rule holds for pace and HR efforts (Q7).
- **HR load per record:** the session load from HR sums the same per-record impulse as the training effect; a change to rest, max or threshold HR recomputes from the records (Q6).
- **Onboarding:** threshold HR is asked on "Your thresholds", next to FTP and threshold pace (Q8).
- **Basis shown:** the load note says when threshold HR is estimated, and the training effect card says "From heart rate" (Q9).

## Approach

### 1. Load per session (engine)

- `packages/engine/src/stress.ts`: one records-based entry point, `calculateSessionStress(sport, records, summary, thresholds)`, replaces the positional one (`:156-172`): cycling with NP from the records and an FTP scores TSS; otherwise HR records score the per-record HR load; otherwise the summary average HR scores TRIMP from the average; otherwise the duration estimate. The parser, the reprocess without a FIT file, the HR recompute and the demo all call it. `calculateSummaryStress` (`:116-143`) stays for the metadata path and takes `sport`: TSS (`:121-124`) for cycling only. `StressThresholds` (`:13-18`) gains `thresholdHr?`.
- HR impulse per record (Q6): one engine helper sums `dt × r × a × e^(b × r)` over the HR records, as the training effect does today (`packages/engine/src/trainingEffect.ts:133-154`), with the 10 s gap cap NP uses (`packages/engine/src/normalize.ts:4`), and scores one hour at threshold HR as 100. `r` is clamped to [0, 1] like the training effect (`trainingEffect.ts:138`); today an average outside rest–max scores TRIMP 0 (`stress.ts:74`).
- Threshold ratio: `(thresholdHr − rest) / (max − rest)` replaces the 0.88 literal (`stress.ts:89`), 0.88 when no threshold HR is set; one exported helper in `stress.ts`, also used by the training effect (`trainingEffect.ts:28` already imports from `stress.ts`). The threshold HR field validates between rest and max HR (Q12); the engine clamps the ratio into (0, 1), so a later rest or max edit can't produce a negative or endless load. `maxHr <= restHr` (today TRIMP 0) falls back to the duration estimate.
- `packages/engine/src/trainingEffect.ts`: the reference (`computeTrimpRef`, `:72-73`) uses the threshold ratio (`LT_HRR`, `:35`, becomes the fallback); `calculateTrainingEffect` (`:112-118`) takes a thresholds object (rest, max, gender, threshold HR) instead of three positional values. The anaerobic line (`VT2_HRR`, `:42`) follows the threshold ratio when a threshold HR is set, 0.90 of HR reserve otherwise (Q13). The training effect reads the same impulse helper, so its pauses stop counting (small shift in TE values).
- `packages/engine/SOURCES.md`: stress (`:11-13`) and training effect (`:29-31`) rows name the threshold ratio; the session derivation row (`:84`) names HR; the effort row (`:85`) names the leave levels.

### 2. HR from records, reprocessing, recompute

- `packages/engine/src/sessionDerivation.ts`: `timeWeightedMean` (`:29-47`), `deriveAvgFromRecords` (`:49-56`) and `deriveMaxFromRecords` (`:58-65`) accept `'hr'`; `RecordDerivedFields` (`:4-10`) gains `avgHr?` and `maxHr?`; `SESSION_DERIVATION_VERSION` (`:12`) 4 → 5.
- `apps/web/src/parsers/fit.ts`: derive before the stress call (today stress `:177` runs before `derived` `:182`) and call `calculateSessionStress` with `sport` (`:144`) and the records; `avgHr`/`maxHr` (`:212-213`) take the summary first, then the derived value (like `maxSpeed`, `:222`). `FitParseProfile` (`:106-111`) and `toFitParseProfile` (`apps/web/src/lib/fitParseProfile.ts:5-15`) carry `thresholdHr`.
- `apps/web/src/features/sessions/reprocessSessions.ts`: `recomputeFromRecords` (`:87-107`) derives avg/max HR when missing; `recomputedStress` (`:71-85`) calls `calculateSessionStress` with the records it already reads.
- `apps/web/src/lib/sessionStress.ts`: `StressInputs` (`:8`) gains `sport`; `trainingLoadSignature` (`:30-38`) splits into an HR part (gender, rest, max, threshold HR) and an FTP part, two string selectors (an object or tuple selector re-renders forever under zustand 5, `useTrainingLoadRecomputeEffect.ts:8`).
- `apps/web/src/features/sessions/recomputeTrainingLoad.ts`:
  - FTP part changed: the metadata path (`:14-27`) re-scores only cycling sessions with a stored NP (TSS); every HR or duration load stays as stored. An FTP edit can only move rides to TSS, never away: dated entries can't be deleted and the earliest entry covers earlier dates (`packages/engine/src/datedValue.ts:6-16`).
  - HR part changed: the records path re-scores the HR-scored sessions from their records (`getSessionRecords`, `apps/web/src/lib/indexeddb.ts:7-11`) under the same lock (`:12`, `:68-70`); the overlay opens before the records are read (today `commitChanges` opens it after, `:38-51`); the docstring (`:63-67`, "reads no records") changes.
  - The stored loads remember which HR values they were computed with (Q10): `apps/web/src/store/sessions.ts` persists the applied HR part of the signature (persist `version` 3 → 4 with a `migrate` step, `:26`, `:118-119`). It is written after a successful records recompute, after the reprocess (which scores with the profile it captures once, `apps/web/src/features/sessions/reprocessSessions.ts:194`) and after loading the demo (`apps/web/src/features/demo/loadDemoData.ts:24`). On start the effect compares the current HR part against it, so an interrupted records recompute is redone; the FTP part keeps today's run-on-every-start metadata path.

### 3. Threshold HR in the profile

- `apps/web/src/types/index.ts:21-26`: `thresholds.thresholdHr?: DatedValue<number>[]`.
- `apps/web/src/store/user.ts`: `ThresholdKey` (`:10`), the `thresholds` schema (`:72-77`; without it the key is stripped on every hydrate), a `saveTodaysThresholds` branch (`:139-164`), persist `version` 3 → 4 with a `migrate` step (`:48-53`, `:179-180`).
- `apps/web/src/lib/thresholdsAt.ts` (`:5-13`, `:35-43`): resolves the raw `thresholdHr?`; the estimate stays in the engine, so the form never shows it as a stored value.
- Settings: `apps/web/src/features/settings/hooks/useThresholdsForm.ts` (types `:9-22`, `TEXT_FIELDS` `:24`, `storedForm` `:39-61`, `rangeFor` `:75-114` with a threshold HR range between rest and max HR, `isRequired` `:116-120`, `numberError` `:122-138`, `createProfile` `:177-198`); `ThresholdTiles.tsx` (`TILES` `:44-87`, the new tile after Max HR (Q11), `addCaption` `:89-99`); `thresholdIcons.ts` (`:6-13`); `ThresholdEditDialog.tsx` (`FIELD_TITLES`, `:26-32`); `ThresholdsSection.tsx` (`Histories`, `:76-83`).
- Onboarding (Q8): an optional threshold HR field on "Your thresholds", after FTP and threshold pace (`apps/web/src/features/onboarding/OnboardingStep.tsx`, `ThresholdFields` `:250-284`, `THRESHOLD_FIELDS` `:208`); the step subtitle says all three are optional. The label starts with "Threshold HR", so the e2e locators `/^FTP/` and `/^Threshold Pace/` stay unique.
- i18n (`packages/i18n/messages/en.json`, `de.json`): new label, hint, tile title and add caption for threshold HR; the onboarding thresholds subtitle ("Both are optional") and `ui_onboarding_ask_values_desc` name it.

### 4. Efforts with hysteresis

- `packages/engine/src/effortDetection.ts`: `EffortSignalDefaults` (`:40-47`) gains `leave`, between `steady` and `enter`: power enter 0.88 / leave 0.80 (`:55`), pace enter 0.88 / leave 0.85 (`:56`), HR enter 0.80 / leave 0.75 of HR reserve (`:57`) (Q7). `detectEfforts` resolves `leave` like `enter` (`:664-667`, `referenceOf` `:623-638`) and passes it to `labelSegments` (`:569-589`, call `:676`): a segment with mean ≥ enter seeds a work block, which grows into directly adjacent segments with mean ≥ leave, in both directions, never across a break (a gap between segments) or a dropout (a segment with `mean: NaN`).

### 5. Demo data as the best case

- `apps/web/src/features/demo/demoRecords.ts`: generated watts follow the profile FTP at the session date (`DemoPersona.ftp` `:117`, used at `:331`, `:339`; today the 210 W step after `buildDemoDataset.ts:124-127` never reaches the generator); the climb boost (`:331`) is capped so steady climbs stay below the leave level.
- `apps/web/src/features/demo/demoSchedule.ts`: the sweet spot work steps (`:176`, `:178`, `:180`) go from 0.9 to 0.92, so every scaled instance (×0.97–1.03, `buildDemoDataset.ts:258`) starts above enter; the Garda rides (`:219`, `:225`, `:227`) are checked against the cap.
- `apps/web/src/features/demo/buildDemoDataset.ts`: the persona gets a threshold HR (`:37-44`; ~163 bpm, where the HR model puts threshold effort); the dated profile is built before the session loop (`ftpHistory`, `:237`; today after it, `:272-284`), `thresholdsAt` (`apps/web/src/lib/thresholdsAt.ts:35`) takes the profile fields it reads instead of a full `UserProfile` (the builder has no `id`/`createdAt`), and each session's stress comes from `calculateSessionStress` with the thresholds at its date, the same call as the parser, so the startup recompute finds nothing to rewrite; avg/max HR via the shared derivation (`:145-155`); `lastRecord?.timerTime ?? 0` (`:143-144`) goes.

### 6. Show the basis

- `apps/web/src/lib/moreStats.ts` (`:141-145`) carries whether the threshold HR at the session date is estimated; `apps/web/src/features/sessions/session/MoreStatsRow.tsx` (`LOAD_SOURCES`, `:47-51`; `loadCell` `:73`) shows it in the HR note ("From heart rate · threshold estimated"); `ui_more_stats_load_from_hr` drops "underrates intervals", which no longer holds per record (Q6, Q9).
- `apps/web/src/features/sessions/session/TrainingEffectCard.tsx` (result `:165-185`, summary caption `:179-183`): a "From heart rate" caption next to the existing values; `ui_te_values` stays (e2e `apps/web/e2e/sessions.spec.ts:37` reads it) (Q9).
- Copy: `exp_trimp_range` ("~100 for a 1-hour threshold effort") names threshold HR; `exp_duration_oneLiner` ("when no power or heart rate data is available") also covers runs without HR, which no longer use power.

### 7. Quick wins on the same path

- TSB and ACWR info texts name their conventions: TSB is the same day's CTL − ATL after that day's load (TrainingPeaks uses the day before), ACWR the smoothed 7/42-day ratio (`packages/engine/src/metrics.ts:110-116`; `exp_tsb_*`, `exp_acwr_*`).
- Delete the unused `MetricExplanation.sports` (`apps/web/src/lib/explanations.ts:40`) and its checks in `apps/web/tests/lib/explanations.spec.ts` (`:36-44`, `:74-79`).
- Labs plan cache key (`apps/web/src/lib/weekKey.ts:35-39`, `apps/web/src/features/labs/hooks/useCoachPlan.ts:43`): today week, session count and threshold pace, so a recompute or reprocess that moves the loads keeps a stale plan. The key adds a digest of the stored session loads: the plan refreshes when loads change and otherwise stays fixed for the week (Q14).
- A failed recompute is redone: the applied signature is written only after success (`apps/web/src/features/sessions/hooks/useTrainingLoadRecomputeEffect.ts:14`; how it persists: Q10).
- Gauges without data: the form gauges turn missing data into 0 (`apps/web/src/features/dashboard/ReadinessGauge.tsx:29`, `apps/web/src/features/dashboard/ACWRGauge.tsx:19`), so without history they show 0.0 and a status label (readiness from the neutral coaching default, `apps/web/src/lib/coachingMessages.ts:93-102`; ACWR a risk label). Without data they show `--` (the rails' `MISSING`, `apps/web/src/lib/railFormat.ts:4`, then exported), an empty dial (value at its minimum, since `GaugeDial` needs a number, `packages/ui/src/components/GaugeDial.tsx:74`) and no label. The stray `contextLabel="asd"` (`ACWRGauge.tsx:40`) goes.

### 8. Riding along (not load-related)

Owner, 2026-10-21: "all on the load and effort modal item".

- Marker dialog: clearing "From previous split" sets the offset to 0 (`apps/web/src/features/studio/markers/StudioMarkerDialog.tsx:101-104`) and puts the split on top of the previous one; Save also needs that field to hold a number while it is shown, like the km field.
- Desktop dialog footer: at 1280 × 800 the edit-waypoint dialog cuts off its footer (`packages/ui/src/components/Dialog.tsx:148`, `lg:max-h-[calc(100dvh-25rem)]`); the footer stays visible and the body scrolls. This changes every dialog on desktop (`Dialog.tsx` serves 11 app dialogs and `ResponsivePopover`; today the whole card scrolls, `:146`, and `DialogBody` uses `lg:contents`, `:201`).
- Rule wording: root `CLAUDE.md:21` also names the named exports of `@pacevault/web` (`apps/web/package.json:6-10`); `apps/web/tests/CLAUDE.md:14` points to the GPX snapshot exception (`packages/gpx/CLAUDE.md:10`).

## Files

See `tech.md` (`### Changed`).

## Tests

- `packages/engine/tests/stress.spec.ts`: a run with NP and FTP scores from HR; one hour at threshold HR scores 100; without threshold HR the 88% estimate applies; per-record HR clamps instead of scoring 0; a session without HR records falls back to the average HR, then to duration.
- `packages/engine/tests/trainingEffect.spec.ts`: the reference follows the threshold ratio; the new thresholds object.
- `packages/engine/tests/effortDetection.spec.ts`: regression "sweet spot 3×12 fragments into many blocks" (three blocks with a slowly wandering level around enter, not white noise); a leave edge; no seed, no block; the hills (`:159`) and TT (`:184`) guard rails stay empty.
- `apps/web/tests/store/userStore.integration.test.ts`: v3 → v4 migrate, legacy and unrecognised shapes; a saved threshold HR survives rehydrate.
- `apps/web/tests/store/sessionsStore.integration.test.ts`: v3 → v4 migrate (no applied HR signature yet, so the first start recomputes HR loads once); the applied signature survives rehydrate.
- `apps/web/tests/parsers/fitThresholds.integration.test.ts:24-45`: `running.fit` with an FTP history scores from HR (today it encodes the bug).
- `apps/web/tests/parsers/fitRequiredFields.spec.ts` (mocks `fit-file-parser`, `:3-9`): avg/max HR derived when the summary lacks them (every FIT fixture carries summary HR).
- `apps/web/tests/features/sessions/reprocessSessions.integration.test.ts` (`:164-189`, `:278-319`, `:321-389`): runs no longer get TSS; `recomputeFromRecords` derives HR; the new `calculateSessionStress` call.
- `apps/web/tests/features/sessions/recomputeTrainingLoad.integration.test.ts`: fixtures carry `sport` (`:43-46`); the file-wide records mock (`:12-20`) becomes per test: an FTP change still never reads records, an HR change does and keeps ride TSS.
- `apps/web/tests/packages/engine/stressPipeline.integration.test.ts`: the new call; its duration case (`:75-84`) uses records with HR, so it now scores from HR.
- `apps/web/tests/lib/sessionFitness.spec.ts:21`: the training effect's thresholds object.
- `apps/web/tests/lib/weekKey.spec.ts:30-46`: the new cache key.
- `apps/web/tests/features/demo/buildDemoDataset.spec.ts`: every sweet spot session shows three efforts with a pattern; rides score TSS, runs HR; the builder's loads equal the recompute's.
- e2e `apps/web/e2e/dashboard.spec.ts`: regression "form gauges show 0.0 without history": a profile without sessions shows `--` in both gauges.
- e2e `apps/web/e2e/studio.spec.ts` (marker test, `:72`): regression "cleared from-split field puts the split on the previous one": clearing that field disables Save. The field only shows above an earlier split (`StudioMarkerDialog.tsx:73-79`), so the test adds a second split at a larger km; the inputs have no accessible name (`:165`, `:178`), so it picks them by position.
- e2e seeds: the Labs coach seeds (`apps/web/e2e/helpers/seed.ts:234-270`, `apps/web/e2e/labs.spec.ts:20-43`) become rides with NP and FTP, so their TSS stays exact (one hour from HR can't reach the 200 `labs.spec.ts:41` needs); `seededLoad` (`seed.ts:17-18`) gets `sport`; a seed that needs a threshold HR writes the dated v4 shape, since the v1 flat shape (`seed.ts:91-103`) drops it. Onboarding and settings e2e cover the threshold HR field.

## Verification

1. Full root `CLAUDE.md` §5 suite.
2. Manual: import `running.fit` with an FTP set: the load tile says "from heart rate"; set a threshold HR: run loads move, ride loads don't.
3. Manual: load the demo: every sweet spot ride shows "3 × 12:00"-style efforts; the Garda rides show none.

## Real-data checks

- [ ] A real interval run with HR: load before and after.
- [ ] A real sweet spot ride: three efforts, not fragments.
- [ ] A long history after the reprocess: fitness and form move once, then stay.

## Delivery and acceptance

Review doc in `tools/workbench/backlog/load-model/review/` with before/after shots of the load tile, the training effect card, the dashboard load card, the threshold HR settings tile and onboarding step, a demo sweet spot session's laps, the gauges without data, the marker dialog with a cleared from-split field, and the edit-waypoint dialog plus one other dialog at 1280 × 800. §8 builds on lines from studio-marker-dialog-phone and code-conventions, so those are committed before "lets dev". Cleanup only via `item-done` after the owner's acceptance.

## Open questions

- **Q1** · answered 2026-10-21 · Do runs use TRIMP only? → (b) keep TSS for runs with power (revised by Q5: runs on HR only). Owner: "b"
- **Q2** · answered 2026-10-21 · Derive avg/max HR from the records when the summary lacks them? → (a) derive and reprocess stored sessions. Owner: "a"
- **Q3** · answered 2026-10-21 · Should an hour at your threshold count the same on every sport? → (b) fix the math: threshold HR in the profile and in onboarding, optional; skipped falls back to the estimate (88% HRR). Owner: "lets do (b) fix the math. We must include this in the onboarding as well right? Its okay to fallback though to an estimated hr threshold if the user skips this field (optional)"
- **Q4** · answered 2026-10-21 · Where to fix the sweet spot fragmentation? → (c) both: detection rule with hysteresis for everyone (enter ≥ 88% FTP, leave below ~80%), demo data built as the best case. Owner: "i think the demo data should create data in a way that reflects the best case scenario how our app could work" and "Yes, fix the rule too (Recommended)"
- **Q5** · answered 2026-10-21 · Which FTP for runs? → (c) runs on HR only; revises Q1. Owner: "okay, lets go with hr only. I guess Q3 answer also affects this?"
- **Q6** · answered 2026-10-21 · How is the HR load summed? → (a) per record, like the training effect; a change to rest, max or threshold HR recomputes from the records, with the migration overlay. Owner: "Per record (Recommended)"
- **Q7** · answered 2026-10-21 · Hysteresis for pace and HR efforts too? → (a) yes: pace leave 0.85 (enter 0.88), HR leave 0.75 (enter 0.80). Owner: "All signals (Recommended)"
- **Q8** · answered 2026-10-21 · Where does onboarding ask threshold HR? → (a) on "Your thresholds" with FTP and threshold pace, all optional. Owner: "Your thresholds (Recommended)"
- **Q9** · answered 2026-10-21 · How do the screens show the basis? → (a) the load note says when threshold HR is estimated, and the training effect card says "From heart rate". Owner: "Load note + TE caption (Recommended)"
- **Q10** · answered 2026-10-21 · How do the stored HR loads know which rest, max and threshold HR they were computed with? → (a) store the HR values used: starts and FTP changes stay as today, only an HR change reads the records once, an interrupted run is redone on the next start. Owner: "Store the HR values used (Recommended)"
- **Q11** · answered 2026-10-21 · Where does the threshold HR tile go? → (a) after Max HR, so the HR values sit together and W/kg ends up alone. Owner: "After Max HR (Recommended)"
- **Q12** · answered 2026-10-21 · A dated threshold HR can end up outside rest–max after a later rest or max edit: what then? → only the threshold HR field validates; the engine clamps the ratio into (0, 1). Owner: "this is not really a real issue. A little validation on the threshold input is enough"
- **Q13** · answered 2026-10-21 · The anaerobic training effect counts above a fixed 90% of HR reserve (`trainingEffect.ts:42`); with a threshold HR above that line, threshold work counts as anaerobic. Should the line follow threshold HR? → (a) yes: above the threshold HR when set, 90% of HR reserve otherwise. Owner: "Follow threshold HR (Recommended)"
- **Q14** · answered 2026-10-21 · The Labs week plan is cached per week, session count and threshold pace, so a recompute that moves the loads keeps a stale plan. New key? → (a) add a digest of the stored loads: the plan refreshes after a recompute or reprocess and otherwise stays fixed for the week. Owner: "Loads changed (Recommended)"

## Risks

- The reprocess changes every stored load once; fitness and form move on the next start.
- A demo already loaded keeps its old records; the new demo data shows after reloading the demo.
