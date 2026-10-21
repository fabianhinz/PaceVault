---
title: Load and effort model
status: idea
created: 2026-10-19
type: bug
areas: [engine, app, i18n]
next: 'item-plan: draft the shared basis and change blocks from Q1–Q5, then tech.md'
---

# One model for load and effort

## Goal

The load and effort features grew one by one and drifted apart: dashboard load chart, form (CTL/ATL/TSB, ACWR), session training effect, More stats (load tile, IF) and effort detection. Goal (owner, 2026-10-21): one consistent, transparent model behind all of them, so users get insights instead of contradictions. Unified means one shared basis, not one number; each feature still answers its own question (stress accumulated, physiological effect, intervals). The bugs below follow from it.

The basis has to settle:

- **Input per sport:** which signal drives each sport (power for rides is the standard; HR or pace otherwise).
- **Fallback order:** one fixed order when data is missing (records → summary → duration), the same everywhere, and shown in the UI.
- **One threshold set:** FTP, threshold pace and threshold HR from the profile, used by load, training effect and efforts alike (today partly an assumed 88% HRR).
- **Source shown:** every number names its basis, especially where it differs from Garmin or TrainingPeaks conventions.
- **History shift:** stored loads change once on recompute; users see fitness and form move.

## Known bugs

The per-session load picks its method from the data, never from the sport, and every dashboard number (load chart, CTL/ATL/TSB, ACWR, trip load) sums three scales. Folds in tss-rides-only, fit-hr-fallback, effort-demo-tuning and the 2026-10-21 backlog sweep.

- **FTP on runs:** `calculateSummaryStress` (`packages/engine/src/stress.ts:116`) returns TSS whenever NP and an FTP exist; the parser knows the sport (`apps/web/src/parsers/fit.ts:144`) but doesn't pass it (`apps/web/src/parsers/fit.ts:177-178`). `running.fit`: 78 TRIMP → 206 TSS (IF 1.26). IF is already hidden for runs, and the onboarding hint says "for rides" (`packages/i18n/messages/en.json:627`). Since the training load recompute (`apps/web/src/features/sessions/recomputeTrainingLoad.ts`), one FTP entry rewrites every past run with power.
- **HR from records:** avg/max HR come only from the FIT summary (`apps/web/src/parsers/fit.ts:178`, `:212-213`). Without them the rail shows "--" and load falls back to 30/h. The demo builder already derives them from records. A records-derived avg should be time-weighted like power and cadence (rail HR isn't: `apps/web/src/lib/railRange.ts:105`).
- **TRIMP 0:** `calculateTRIMP` returns 0 when avg HR > max HR or ≤ rest HR (`packages/engine/src/stress.ts:74`), still tagged `trimp`; the session adds nothing to CTL/ATL. Training effect clamps the same case.
- **Mixed scales:** TRIMP is normalised to an assumed 88% HRR threshold (`packages/engine/src/stress.ts:89`), not the user's; the load card says "Misst, wie hart ein Training relativ zu deiner Schwelle war" (`packages/i18n/messages/de.json:338`) for all sessions.
- **Load vs training effect:** session load runs TRIMP on the summary average HR, training effect runs it per record, clamped (`packages/engine/src/trainingEffect.ts:112`); a ride with power shows load from power next to a training effect from HR, unlabelled.
- **Efforts:** the power enter threshold is 0.88 × FTP (`packages/engine/src/effortDetection.ts:55`), and sweet spot work (88–94% FTP) sits on it: the demo "Sweet spot 3×12" at 0.9 × FTP (`apps/web/src/features/demo/demoSchedule.ts:176-180`) fragments into 4–14 blocks or, after the demo FTP step to 210, finds none; real sweet spot work does the same. Steady hilly demo rides cross it on climbs (grade-boosted power) and show 10–21 efforts without a pattern (Lago di Tenno climb, Passo San Giovanni loop). Demo run warm-ups are not counted as work (sweep 2026-10-21).
- Stored sessions need recomputing: bump `SESSION_DERIVATION_VERSION` (`packages/engine/src/sessionDerivation.ts:12`); `trainingLoadSignature` doesn't see code changes.

## Quick wins (same path)

- Info texts name the conventions: TSB is today's CTL − ATL after today's load (TrainingPeaks uses yesterday's), ACWR is the smoothed 7/42-day ATL/CTL ratio, not a rolling 7:28 average (`packages/engine/src/metrics.ts:120-125`; `exp_tsb_*`, `exp_acwr_*` in `packages/i18n/messages/*.json`).
- Delete dead `MetricExplanation.sports` (`apps/web/src/lib/explanations.ts:40`, never read).
- Labs plan goes stale after a recompute: its cache key is `weekOf:sessionCount:thresholdPace` (`apps/web/src/lib/weekKey.ts:35-39`, `apps/web/src/features/labs/hooks/useCoachPlan.ts:43`); add the load signature.
- A failed recompute isn't retried: the signature is recorded before the run (`apps/web/src/features/sessions/hooks/useTrainingLoadRecomputeEffect.ts:14`); record it on success.
- Demo builder: `lastRecord?.timerTime ?? 0` (`apps/web/src/features/demo/buildDemoDataset.ts:144`) turns missing into 0 against "0 is data".

## Open questions

- **Q1** · answered 2026-10-21 · Do runs use TRIMP only? → (b) keep TSS for runs with power (revised by Q5: runs on HR only). Owner: "b"
- **Q2** · answered 2026-10-21 · Derive avg/max HR from the records when the summary lacks them? → (a) derive and reprocess stored sessions. Owner: "a"
- **Q3** · answered 2026-10-21 · Should an hour at your threshold count the same on every sport? → (b) fix the math: threshold HR in the profile and in onboarding, optional; skipped falls back to the estimate (88% HRR). Owner: "lets do (b) fix the math. We must include this in the onboarding as well right? Its okay to fallback though to an estimated hr threshold if the user skips this field (optional)"
- **Q4** · answered 2026-10-21 · Where to fix the sweet spot fragmentation? → (c) both: detection rule with hysteresis for everyone (enter ≥ 88% FTP, leave below ~80%), demo data built as the best case. Owner: "i think the demo data should create data in a way that reflects the best case scenario how our app could work" and "Yes, fix the rule too (Recommended)"
- **Q5** · answered 2026-10-21 · Which FTP for runs? → (c) runs on HR only; revises Q1. Owner: "okay, lets go with hr only. I guess Q3 answer also affects this?"
