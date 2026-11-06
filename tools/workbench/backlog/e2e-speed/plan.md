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

## Open questions
