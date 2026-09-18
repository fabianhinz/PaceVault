---
id: floating-promises-marked-void
tdr_reference: tdr/floating-promises-marked-void.md
generated: 2026-09-17
---

# Deliberate fire-and-forget promises are prefixed with void

Read `tdr/floating-promises-marked-void.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Mark or await the seven unawaited `.then()` chains.
   Files: `src/features/settings/DataManagementSection.tsx:27` and `:32`, `src/features/studio/hooks/useStudioRoutePoints.ts:12`, `src/features/map/hooks/useSessionDetailPath.ts:35`, `src/features/map/hooks/useGpsBackfill.ts:46`, `src/pages/SessionDetailPage.tsx:34` and `:35`
   Change: each is a promise-returning expression used as a statement inside an effect. Decide per site: where the rejection does not matter and the effect has nothing to surface it with, prefix the expression with the `void` operator (R1). Where the rejection *does* matter — an IndexedDB read that failing would leave the screen blank — do not `void` it; attach a terminal `.catch` that reports through the toast store (R3, R4). `SessionDetailPage.tsx:34-35` loads the records and laps the page renders, so it is the likely first candidate for the second treatment.
   Check: the R1 grep in the TDR reference returns nothing; `pnpm check && pnpm exec playwright test e2e/sessions.spec.ts`.

2. Wrap async handlers passed directly to React event props.
   Files: `src/features/settings/DeleteAllDataDialog.tsx:97`, `src/features/settings/ReimportDialog.tsx:53`, `src/features/settings/PaceEstimatorDialog.tsx:99`, `src/features/studio/StudioRouteItem.tsx:23`, `src/features/studio/StudioRouteFormDialog.tsx:64`, and every other site the R2 signal reports
   Change: an `async` function handed to an `onClick`/`onChange`/`onSubmit` prop returns a promise where a void-returning function is expected. Wrap it — `onClick={() => void handleDelete()}` — rather than passing it directly. Where the handler is not `async`, leave it alone.
   Check: `pnpm check`; each listed handler is either synchronous or wrapped.

3. Replace every other discard form with `void`.
   Files: all of `src/`
   Change: R2 wants one spelling for an intentional fire-and-forget. Replace an empty `.catch(() => {})`, a no-op `.then()` used only to discard, or an inline lint suppression with the `void` operator. An empty `.catch` that exists to *swallow* a known-harmless rejection is not a discard form and stays — but it needs a real reason, not a silence.
   Check: `grep -rn "catch(() => {})\|catch(() => undefined)" src` returns nothing that is not deliberate; `pnpm check`.

4. Give the long-lived chains terminal handling.
   Files: `src/main.tsx`, `src/App.tsx`, `src/lib/db.ts`, `src/lib/indexeddb.ts`, and any service-worker registration
   Change: R4 wants terminal `.catch` handling on a long-lived `void`ed chain — an app bootstrap, a store hydration, a service-worker registration — rather than relying on `void` alone to deal with rejection. Add a `.catch` that reports the failure through the toast store or the console, per site.
   Check: `pnpm check && pnpm build && pnpm exec playwright test e2e/onboarding.spec.ts`.

## Open items

This record's gate is currently disabled: `vite.config.ts` sets `'typescript/no-floating-promises': 'off'`. The rule stays `proposed` in the TDR reference until the tooling plan turns it on — see [`tooling`](tooling.md), which must run *after* this plan, because switching the gate on first would fail on the seven sites above.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
