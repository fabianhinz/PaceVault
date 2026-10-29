---
title: Intervals sync tuning
status: in-review
created: 2026-10-29
type: chore
areas: [app]
next: Owner reviews round 1
size: small
---

# Intervals sync: faster downloads and a 30-day window for the "new" badge

## Context

The intervals.icu import downloads one FIT file at a time (`apps/web/src/lib/api/intervalsImport.ts:56`), so a large library takes long. Background syncs badge every session they import as new (`markNew: !foreground`, `apps/web/src/lib/api/intervalsSync.ts:75`), including backlog activities from years ago (past the 2,000-per-run cap, or left over after a 429). intervals.icu allows at most 10 requests/s per IP (developer, forum.intervals.icu/t/609).

## Decisions (settled)

- Up to 5 FIT downloads in flight; all intervals.icu requests together never exceed 5/s, half the 10/s limit (Q1).
- A 429 keeps today's behaviour: the import stops, `backlogPending` is set, the next background sync resumes. No retry, no `Retry-After` handling.
- `BUFFER_DAYS` 14 → 30.
- The badge uses the same window: a session imported by intervals sync is new only when its start is on or after (newest intervals session − `BUFFER_DAYS`), computed before the run; foreground or background no longer matters. No intervals session yet (first connect) → no badge.
- Out of scope: the rate-limit message, activities uploaded to intervals.icu more than 30 days late.

## Approach

1. **Request pacing** in `intervalsRequest`: every request waits for its slot, slots at least `MS_PER_SECOND / 5` apart (module-level next-slot time). Covers listing, key check, `/file` and the `/fit-file` fallback.
2. **Sliding download window** in `runIntervalsImport`: start the downloads of the next 5 activities, consume results in listing order (newest first), start the next download as each one is consumed. Parse and `batcher.add` stay sequential, so batching, duplicate checks and memory (≤ 5 buffers ahead) behave as today. A download result never rejects (wrapped as data or error); on a fatal code the loop stops and in-flight results are dropped. Their ids are not recorded, so the next sync fetches them again.
3. **Badge cutoff**: `intervals.ts` exports the window start in ms (`intervalsSyncWindowStart`); `intervalsSyncWindowOldest` formats it. `runIntervalsSync` reads it before the import and passes it down as `markNewSince` (replaces `markNew`); the batcher badges saved sessions with `session.date >= markNewSince`.

## Files

- `apps/web/src/lib/api/intervals.ts:34` `intervalsRequest`: await the request slot before `fetch`; constants for 5 requests/s.
- `apps/web/src/lib/api/intervals.ts:144` `BUFFER_DAYS` 14 → 30; `:153` split into `intervalsSyncWindowStart` (ms) and `intervalsSyncWindowOldest` (local date).
- `apps/web/src/lib/api/intervalsImport.ts:56` loop → sliding window of 5 (`DOWNLOAD_CONCURRENCY`); `markNew` → `markNewSince?: number`.
- `apps/web/src/lib/api/intervalsSync.ts:75` pass `markNewSince` from `intervalsSyncWindowStart(sessions)` read at the start of the run, instead of `!foreground`.
- `apps/web/src/lib/storage/createIngestBatcher.ts:89-146` `markNew` → `markNewSince`; `ingestBatch` adds saved sessions in two groups (`markNew: true` for `date >= markNewSince`, the rest without). File uploads pass nothing, as today.

## Tests

- `apps/web/tests/lib/api/intervals.spec.ts`: requests start at least 200 ms apart (fake timers).
- `apps/web/tests/lib/api/intervals.syncWindow.spec.ts`: 14 → 30 days; `intervalsSyncWindowStart` returns the ms value.
- `apps/web/tests/lib/api/intervalsImport.integration.spec.ts`: never more than 5 downloads in flight; sessions saved in listing order; a 429 still stops the import and in-flight results are not imported.
- `apps/web/tests/lib/api/intervalsSync.integration.spec.ts:106-123`: replace the two foreground/background badge cases with: inside the window → new; older than the window (backlog) → not new; no intervals session yet → not new, foreground or background. `:194` 14 → 30 days.
- `apps/web/tests/lib/storage/createIngestBatcher.integration.spec.ts`: `markNewSince` badges only sessions on or after the cutoff.

## Verification

`vp run check`, `vp run test`, `vp run e2e`, `vp run build` from the root.

## Real-data checks

- [ ] Full import of a large intervals.icu account is clearly faster than before and hits no 429.
- [ ] After a backlog continuation, only recent sessions carry the blue badge.

## Delivery and acceptance

Review doc in `tools/workbench/backlog/intervals-new-badge-window/review/` (root `CLAUDE.md` §5 step 4); no UI change, so no screenshots beyond the badge list if useful. Cleanup only via `item-done` after the owner's acceptance.

## Open questions

- **Q1** · answered 2026-10-29 · Request cap: (a) 5/s, 200 ms gap (b) 3/s (c) 8/s → (a). Owner: "5/s, 200 ms gap (Recommended)"

## Risks

- The module-level pacer adds up to 200 ms per request in specs that call the API several times; specs that need speed use fake timers.
