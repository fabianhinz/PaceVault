---
title: Rules vs code
status: idea
created: 2026-10-19
type: chore
areas: [app, ui, gpx, testing]
next: Owner answers Q1
---

# Code that contradicts the CLAUDE.md rules

## Idea

CLAUDE.md says no destructuring, no snapshots, arrow functions only and one shared hooks folder, but `packages/ui/src/components/Tabs.tsx:6` uses `const { className, ...rest } = props`, `packages/gpx/tests/__snapshots__/` exists, `function` declarations sit in the test factories (`packages/testing/src/sessions.ts:6`), and `apps/web/src/hooks/useMetrics.ts` sits next to `apps/web/src/lib/hooks/`. Spun off from repo-restructure (ideas.md "To decide").

## Open questions

- **Q1** · open · Per contradiction: fix the code or document the exception in CLAUDE.md? (a) fix the code everywhere (b) document the exceptions (c) decide per item in the plan
