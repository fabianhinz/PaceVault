---
title: Training load recompute
status: in-review
created: 2026-10-17
type: bug
areas: [app, engine, i18n]
next: 'Owner accepts (status: done) or files R-items'
---

# Training load: recompute on threshold change

> Decisions are settled by the owner. Approach, Files, Tests and Verification follow below.

## Context

- Load is computed once at import and stored per session (`tss`, `stressMethod`, `normalizedPower`): `src/parsers/fit.ts:174-188` and `:223`, `:232-233`. FTP is passed only when the file has power records (`fit.ts:175-179`). Engine order TSS → TRIMP → duration: `src/packages/engine/stress.ts:109-144`.
- Nothing recomputes it when thresholds or gender change. Derivation reprocessing keeps the stored load unless it was TSS on both sides (`src/features/sessions/reprocessSessions.ts:43-48`, `:89`, `:101`). The reparse even computes fresh load with the current profile (`reprocessSessions.ts:72`) and then throws it away.
- Consumers of stored `tss`: `src/packages/engine/metrics.ts:72` (via `src/hooks/useMetrics.ts:16`, `src/features/labs/hooks/useCoachPlan.ts:51`), `src/features/dashboard/hooks/useFilteredMetrics.ts:34`, `src/features/trips/tripStats.ts:36`, `src/features/sessions/session/MoreStatsRow.tsx:66-69`, CTL in `src/features/sessions/session/TrainingEffectCard.tsx:128`. All of them read the store reactively, so a store update is enough.
- **How far a change reaches** (dated thresholds): `saveTodaysThresholds` dates at today's midnight (`src/store/user.ts:143`), and `valueAt` falls back to the earliest entry (`src/packages/engine/datedValue.ts:14-15`).
  - A first FTP entry applies to every session.
  - A changed rest HR, max HR or FTP value applies only to sessions from today on.
  - Gender is undated (`src/lib/thresholdsAt.ts:42`), so it applies to every TRIMP session.
- **NP:** the app computes NP only inside the FTP branch (`stress.ts:28-44`, `:119-120`). A session imported without FTP stores the device's `normalized_power` (`fit.ts:223`) or nothing.

### Answers to the owner's questions

1. **Engine or not?** Split in two.
   - The formula is domain logic and stays in the engine: `calculateSummaryStress` in `stress.ts` works from stored summary fields (duration, avgHr, NP).
   - Reading the profile, store and IndexedDB, writing back and taking the lock is orchestration. It goes in `src/features/sessions/recomputeTrainingLoad.ts`, next to `reprocessSessions.ts`.
   - The glue "session + profile → load" goes in `src/lib/sessionStress.ts`. It uses `thresholdsAt` (lib), so it can't live in the engine.
2. **What `workbench/session-detail-load-perf/plan.md` says, and what applies.** That plan isn't implemented yet: `src/features/sessions/hooks/useSessionRecords.ts` doesn't exist.
   - _Worker pattern_ (worker reads IDB by id, `src/features/records/personalBests.worker.ts:17-24`): applies only to the records path (open question 2). The metadata path doesn't need a worker.
   - _Invalidation sites_ (perf plan "Decisions", `useSessionReprocessingEffect.ts:14` etc.): don't apply. The recompute changes only session metadata in `store-sessions`. Records, laps, GPS and personal bests stay as they are, so there is no records-query invalidation and no `invalidatePersonalBests`.
   - The perf plan's chart worker reads only `sport` from `store-sessions` (perf plan §3), which the recompute doesn't touch, so no `reset` is needed.
   - Only the derivation reparse rewrites records. It is already one of the perf plan's sites.
3. **Trigger:** one effect, no call sites in Settings (Approach §4). It covers Settings, onboarding (`createProfile`), demo load and a startup heal. intervals.icu sessions need nothing special: the recompute iterates the whole store regardless of `source`, and new arrivals are parsed with the current profile (`src/features/intervals/runIntervalsImport.ts:59`).
4. **Cost** (all estimates):
   - Metadata path: one `thresholdsAt` and one formula per session, under ~5 ms for 2k sessions, plus one persist write of the sessions blob.
   - Records path (only power sessions without any NP, and only if FTP is set): one decode per session. The perf plan measured ~120–140 ms per decode (dev, 4x CPU), so roughly 30 ms at 1x. 300 rides ≈ 10 s, spread over async IDB reads.
   - It runs under `SESSION_REPROCESSING_LOCK`, committing every `REPROCESS_BATCH_SIZE` sessions. It shows the reprocess overlay when sessions change (see Decisions).
5. **User-visible effects:** see open question 3.
6. **Keep rule:** the keep rule is removed. It contradicts the settled decision (Approach §3).

## Decisions (settled)

- Stored training load follows threshold changes (gender, rest HR, max HR, FTP), including TRIMP → TSS once FTP exists. Rest and max HR stay required (the onboarding plan keeps them), so there is no "duration → TRIMP" case.
- **NP via a one-time full reparse.**
  - Bump `SESSION_DERIVATION_VERSION` (`src/packages/engine/sessionDerivation.ts:12`), so every session is reparsed once from its FIT file and stores the **app's own NP**.
  - From then on the import always computes app NP, with or without FTP.
  - Every later recompute is metadata-only: it never reads records and needs no worker.
- **Trigger:** on every profile change, plus once per app start (the heal run). It writes and shows the overlay only when at least one session's load differs.
- **Rollout: one release.** The version bump makes the first start reparse every session with app NP _and_ the current profile's load. Users see "Migrating your sessions…" once; later changes are recomputes.
- Prerequisite for `workbench/onboarding-redesign/plan.md`, where FTP and possibly other thresholds become deferrable.
- Gender becomes binary app-wide, done in the onboarding plan (`user.ts:71` schema). There is no migration, because the owner confirmed no profile uses `other`.
- **Feedback: reuse the existing full-screen reprocess overlay** (`foreground.task === 'reprocess'`, `src/components/ui/ImportProgressOverlay.tsx:27`, `beginReprocessing`/`finishReprocessing` in `src/store/importProgress.ts:94-115`).
  - It shows only when at least one session actually changes.
  - There is no summary or toast afterwards, the same as derivation reprocessing today.
  - **Minimum display time for the reprocess overlay**, so a fast run never flashes.
    - Today `MIN_OPEN_MS = 800` (`src/components/ui/ImportProgressOverlay.tsx:14,121-125`) only delays the import _summary_.
    - A reprocess run has no summary, so the overlay disappears as soon as `foreground` is cleared.
    - The reprocess overlay must stay until `openedAt + MIN_OPEN_MS`, for derivation reprocessing and recompute alike.
    - **`MIN_OPEN_MS` goes from 800 to 1500.** The new value applies to the import summary and to every "Migrating your sessions…" case.
- **The minimum display time is enforced in the overlay.** It keeps rendering the last reprocess state until `openedAt + MIN_OPEN_MS`, and the app may mount underneath, because the overlay (`z-50`) covers it.
- **Rename the overlay copy** for every case where affected sessions are processed (derivation reprocess and recompute): `ui_reprocess_updating` becomes "Migrating your sessions…" / DE "Einheiten werden migriert…". Today it reads "Updating your sessions…" / "Einheiten werden aktualisiert…" (`messages/en.json:615`, `messages/de.json:615`).

## Approach

### 1. Engine: `src/packages/engine/stress.ts`

- `calculateTSS` (`:28-44`) takes `np` instead of records.
- New exported `StressSummary { durationSec; avgHr?; normalizedPower? }`, `StressThresholds { restHr; maxHr; gender; ftp? }` and `calculateSummaryStress(summary, thresholds)`. Same order and result shape as `:117`: TSS if NP and FTP > 0, else TRIMP if avgHr is present, else duration. NP 0 W with FTP gives TSS 0, because 0 is data.
- `calculateSessionStress` (`:109-144`) computes NP from records **always**, delegates to `calculateSummaryStress`, and returns `normalizedPower` whenever it is derived, not only for TSS. Callers stay the same: `src/features/demo/buildDemoDataset.ts:159`, tests.

### 2. Import: `src/parsers/fit.ts`

- `:175-188`: `normalizedPower = calculateNormalizedPower(records)` (app NP), then `calculateSummaryStress(...)` with `userProfile`. This drops the `hasPowerRecords` gate (`:175-179`), because records NP is `undefined` without power anyway.
  - The device NP fallback is removed. The owner settled on "the app's own NP for all sessions", so NP comes from records only.
- `:223`: use that `normalizedPower`.
- Import and recompute now run the same function on the same inputs. That keeps the recompute idempotent: a freshly imported session never "changes" on the next run.

### 3. Reprocessing: `src/features/sessions/reprocessSessions.ts`

- `:21`: export `SESSION_REPROCESSING_LOCK`.
- `mergeReparsedSession` (`:39-62`): drop the keep rule (`:43-48`). It takes `tss`, `stressMethod` and `normalizedPower` from the reparse, which already used the current profile (`:72`).
- `recomputedStress` (`:79-107`): replace it with `sessionStressAt({ ...session, normalizedPower: calculateNormalizedPower(records) ?? session.normalizedPower }, profile)`. With no profile it keeps the stored values, as today (`:89`).

### 4. Recompute

- `src/lib/sessionStress.ts` (new):
  - `sessionStressAt(session, profile)`: `thresholdsAt(profile, session.date)` → `calculateSummaryStress`.
  - `trainingLoadSignature(profile)`: a string over gender and the restHr/maxHr/ftp histories, used as a stable selector value.
- `src/features/sessions/recomputeTrainingLoad.ts` (new): `recomputeTrainingLoad(): Promise<number>`.
  - Takes `withExclusiveLock(SESSION_REPROCESSING_LOCK, …)` (`src/lib/webLock.ts:1`) and calls `useSessionsStore.persist.rehydrate()` first, like `reprocessSessions.ts:203`.
  - For each session, computes `sessionStressAt` and keeps only the sessions whose `tss`, `stressMethod` or `normalizedPower` differ.
  - Metadata only, with no records reads. After the one-time reparse, every power session has app NP stored.
  - Opens the reprocess overlay (`beginReprocessing`) only when the diff is non-empty, and closes it with `finishReprocessing`.
  - Commits every `REPROCESS_BATCH_SIZE`, then `guardedSessionsStorage.flush()`. Returns the number changed.
- `src/store/sessions.ts:43`, `:77-85`: a new `applyRecomputedTrainingLoad(changes)` assigns only `tss`, `stressMethod` and `normalizedPower` on the draft by id. `commitReprocessedSessions` replaces the whole object, which could undo a concurrent `markSessionSeen` (`:86-92`). The persisted shape doesn't change, so there is no version bump.
- `src/features/sessions/hooks/useTrainingLoadRecomputeEffect.ts` (new), mounted in `src/components/layout/AppLayout.tsx:66` after `useSessionReprocessingEffect()`.
  - Selects `trainingLoadSignature(profile)` and the reprocessing `phase`.
  - Runs `recomputeTrainingLoad()` when `phase === 'done'` and the signature changed, including the first `done` after startup.
  - Waiting for `done` is required: `canPersistSessions` blocks writes while outdated sessions exist (`src/store/sessions.ts:48-51`).
  - The startup run heals interrupted runs, other tabs' profile changes and existing stale sessions, so no persisted marker is needed.

## Files

**Create:** `src/lib/sessionStress.ts`, `src/features/sessions/recomputeTrainingLoad.ts`, `src/features/sessions/hooks/useTrainingLoadRecomputeEffect.ts`, `tests/features/sessions/recomputeTrainingLoad.integration.test.ts`.

**Modify:**

- `src/packages/engine/stress.ts:28-44,109-144`
- `src/parsers/fit.ts:175-188,223`
- `src/packages/engine/sessionDerivation.ts:12`: bump `SESSION_DERIVATION_VERSION`
- `src/features/sessions/reprocessSessions.ts:21,39-62,79-107`
- `src/store/sessions.ts:43,77-85`
- `src/components/layout/AppLayout.tsx:66`
- `messages/en.json:615`, `messages/de.json:615`: overlay copy "Migrating your sessions…" / "Einheiten werden migriert…"
- `src/store/importProgress.ts:94-115`: reuse `beginReprocessing` / `finishReprocessing` for the recompute
- `src/components/ui/ImportProgressOverlay.tsx:14,114-125`: minimum display time for the reprocess overlay
- `tests/packages/engine/stress.spec.ts`
- `tests/features/sessions/reprocessSessions.integration.test.ts:85-128,353-380`

**Delete:** nothing. `SOURCES.md` already lists `stress.ts` (`src/packages/engine/SOURCES.md:11-13`), and there are no new citations.

## Tests

- `tests/packages/engine/stress.spec.ts`: `calculateSummaryStress` gives TSS from stored NP + FTP, TRIMP without FTP, duration without avgHr, and TSS 0 at NP 0 W.
- `tests/features/sessions/recomputeTrainingLoad.integration.test.ts` (fake-indexeddb). Seed:
  - a TRIMP ride with stored app NP;
  - a run with `isNew: true`.

  Then call `saveTodaysThresholds({ ftp: 250 })` and `recomputeTrainingLoad()`. Assert:
  - the ride becomes `tss` with the expected value, without any records read;
  - the run is unchanged, still `isNew`;
  - the result is persisted.

- Update the two reprocess tests whose behaviour changes on purpose: `:85`, which keeps duration 42, and `:353`, which keeps TSS without FTP. Both now expect the profile's load.

## Verification

1. `vp check`, `vp test -- --run`, `vp exec playwright test`, `vp build`.
2. Manual:
   - Import power rides with no FTP set: the load tile shows TRIMP.
   - Add an FTP in Settings: the tiles switch to TSS, and the fitness chart and dashboard load change.
   - Change max HR: only sessions from today change.
   - Reload: nothing changes again (idempotent).
   - An intervals.icu ride behaves the same way.

## Open questions

None. All questions answered on 2026-10-17.

## Delivery and acceptance

- **Review document (part of the implementation output):** `workbench/training-load-recompute/review/index.html`. It is local only: one self-contained file plus screenshots in the same folder, not published and not committed.
  - Every UI or flow change is labelled (`C1`, `C2`, …) on a screenshot (desktop and 390 px; EN, plus DE where the copy changed) and explained in one or two lines: what changed, where (`path:line`), and why (which decision).
  - Changes without a UI (engine, store, migration) get one short labelled entry each, with what the owner can observe.
  - Screenshots come from the running app via the repo's Playwright, taken after the verification suite passes.
- **Acceptance:** the owner reviews the code and the review document. Only after the owner's explicit acceptance are `workbench/training-load-recompute/review/` and this plan deleted. Nothing is cleaned up before that.

## Real-data checks

- [ ] A smart-recording power ride: NP and TSS after the reprocess.

## Risks

- The first startup after release rewrites every session whose stored load disagrees with the profile, which is the bug being fixed. Fitness, fatigue and form jump once.
- The one-time reparse runs over every session on first start (minutes for large libraries; estimate). It shows the blocking overlay, which is accepted (owner: one release).
- A background intervals.icu sync that parses with the old profile while a recompute runs can leave one session stale until the next startup run.
- Each change persists the whole `store-sessions` blob, the same as reprocessing today.
