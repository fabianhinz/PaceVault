---
title: Code conventions
status: done
created: 2026-10-19
type: chore
areas: [app, ui, gpx, testing, repo]
next: Owner reviews round 1
size: small
---

# Code that contradicts the CLAUDE.md rules

## Context

Four places contradict the shared code rules (sweep 2026-10-21). The barrel exports from package-barrel-exports are dropped (Q3); packages keep their `.ts` subpath imports.

## Decisions (settled)

- Rest-destructuring stays in the `packages/ui` wrappers that strip their own props before forwarding (15 sites in 9 files, e.g. `packages/ui/src/components/Tabs.tsx:6`, `packages/ui/src/components/Card.tsx:26`); documented as the exception (Q4).
- The GPX snapshot stays (`packages/gpx/tests/buildGpx.spec.ts:25`): the exact XML is the contract with other apps; documented as the exception (Q5).
- The 6 `function` declarations become arrow functions, and `useMetrics.ts` moves into `apps/web/src/lib/hooks/` (Q6).

## Approach

- `packages/ui/CLAUDE.md` Rules (`:8-14`): new bullet "**Props**: a wrapper may rest-destructure `props` to strip its own props (`variant`, `className`, …) before forwarding the rest to a primitive; elsewhere the root no-destructuring rule holds."
- `CLAUDE.md:28`: the no-destructuring rule points to that exception.
- `packages/gpx/CLAUDE.md:10` (Tests): a snapshot is allowed for file-format output; `buildGpx` locks the exported XML other apps read.
- Arrow functions: `packages/testing/src/sessions.ts:6`, `:31`; `apps/web/tests/parsers/fitLaps.spec.ts:4`; `apps/web/tests/parsers/fit.spec.ts:12`; `apps/web/tests/lib/lapsAnalysis.spec.ts:5`; `apps/web/tests/lib/hooks/useChartZoom.integration.test.ts:16`.
- Move `apps/web/src/hooks/useMetrics.ts` to `apps/web/src/lib/hooks/useMetrics.ts`; update the imports in `apps/web/src/features/dashboard/ReadinessGauge.tsx`, `FormStatusCard.tsx`, `ACWRGauge.tsx` and `apps/web/src/features/sessions/session/TrainingEffectCard.tsx`; the empty `apps/web/src/hooks/` goes.
- `CLAUDE.md:21`: "each package exports `"./*": "./src/*"`" gains "except `@pacevault/i18n`, which exports its compiled messages, runtime and Vite plugin by name" (agent decision 1).

## Files

- **Changed:** `CLAUDE.md`, `packages/ui/CLAUDE.md`, `packages/gpx/CLAUDE.md`, `packages/testing/src/sessions.ts`, `apps/web/tests/parsers/fitLaps.spec.ts`, `apps/web/tests/parsers/fit.spec.ts`, `apps/web/tests/lib/lapsAnalysis.spec.ts`, `apps/web/tests/lib/hooks/useChartZoom.integration.test.ts`, `apps/web/src/features/dashboard/ReadinessGauge.tsx`, `apps/web/src/features/dashboard/FormStatusCard.tsx`, `apps/web/src/features/dashboard/ACWRGauge.tsx`, `apps/web/src/features/sessions/session/TrainingEffectCard.tsx`.
- **Moved:** `apps/web/src/hooks/useMetrics.ts` → `apps/web/src/lib/hooks/useMetrics.ts`.

## Tests

- No new tests: a refactor without behaviour change; the existing suites cover the moved hook and the changed helpers.
- `grep -rnE "^\s*(export )?function\b" packages apps --include='*.ts' --include='*.tsx' --exclude-dir=node_modules` finds nothing, and `apps/web/src/hooks/` no longer exists.

## Verification

1. Full root `CLAUDE.md` §5 suite.

## Delivery and acceptance

Review doc (`size: small`: Changes, Verification, How to check); no UI change, no screenshots. Cleanup only via `item-done` after the owner's acceptance.

## Open questions

- **Q1** · answered 2026-10-21 · Per rule contradiction: fix the code or document the exception in CLAUDE.md? → (c) decide per item in the plan. Owner: "c"
- **Q2** · answered 2026-10-21 · Shape of the package API? → (a) one `index.ts` per package (`import { stress } from '@pacevault/engine'`). Owner: "a" (dropped by Q3)
- **Q3** · answered 2026-10-21 · Barrels mean rewriting imports in ~300 files (85 deep subpaths), not a fast-lane chore: how to scope them? → dropped; the packages keep their `.ts` subpath imports. Owner: "lets drop the barrels"
- **Q4** · answered 2026-10-21 · 15 rest-destructures in `packages/ui` (6 of 9 files strip custom props before forwarding): fix or document? → (a) document the exception in `packages/ui/CLAUDE.md`. Owner: "Document exception (Recommended)"
- **Q5** · answered 2026-10-21 · The GPX export snapshot vs the no-snapshot testing rule? → (a) keep it and document the exception in `packages/gpx/CLAUDE.md`. Owner: "Keep + document (Recommended)"
- **Q6** · answered 2026-10-21 · 6 `function` declarations and `useMetrics.ts` outside `src/lib/hooks/`: fix or document? → (a) fix both. Owner: "Fix both (Recommended)"

## Risks

- A missed `useMetrics` importer fails the type check, not at runtime.
