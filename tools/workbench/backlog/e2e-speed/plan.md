---
title: E2E speed
status: idea
created: 2026-11-06
type: chore
areas: [app]
next: 'Owner decides: plan directly (measure per-spec durations on main vs feat/segments first)'
---

# The e2e suite got slower: find and fix the regression

## Idea

`vp run e2e` got noticeably slower (owner: "regression >> e2e tests got slow"); the run on `feat/segments` on 2026-11-06 took 2.1 min for 90 tests (`apps/web/playwright.config.ts:13-19`, `fullyParallel`, default workers locally). Compare per-spec durations against `main`, find what grew (segment matching, demo data, map waits) and bring it back down. Related: `e2e-gpu-rendering` (GPU instead of SwiftShader for the map specs); `e2e/map.spec.ts:42` failing under parallel load in rounds 8 and 9 of `session-segments` may share the cause. Owner: "no, leave as is: we need to add a chore ticket for our e2 test though (regression >> e2e tests got slow)"

Flaky under parallel load, collected from `session-segments` review rounds 8–10 (none is in `tools/workbench/backlog/flaky.md`; every one passed on the serial re-run `vp -C apps/web exec playwright test --last-failed --workers 1`):

- `[chromium] e2e/map.spec.ts:42` "map hover › track click opens the picker popover at the click point": failed in the first full run of rounds 8, 9 and 10.
- `[mobile] e2e/mobile/map.spec.ts:249` "mobile dock › filter input stays in place while typing": failed in round 8.
- Round 10: the full suite reached 91 tests; `e2e/segments.spec.ts` alone needs `test.setTimeout(180_000)` for its matching waits (`MATCHING_TIMEOUT_MS`), the likeliest share of the slowdown together with the map specs.
- Round 10: a reload right after a session delete raced the delete's IndexedDB write in the parallel run and brought the session back (the new delete e2e now navigates through the Segments tab instead of `page.goto`); a sign of how much the parallel load stretches IndexedDB writes. Owner on the app side: "this is something that can not happen in real live"

Owner (2026-11-07): "leave, we have a backlog item for the speed of our e2e tests, feel free to update that with more infos"

## Open questions
