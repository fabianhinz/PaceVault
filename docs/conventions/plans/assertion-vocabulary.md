---
id: assertion-vocabulary
tdr_reference: tdr/assertion-vocabulary.md
generated: 2026-09-17
---

# Specs assert through a small, exact matcher vocabulary

Read `tdr/assertion-vocabulary.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`explicit-vitest-global-imports`](explicit-vitest-global-imports.md) — registers the DOM matchers R6 requires, which are not available today.

## Changes

1. Replace the six `toBeTruthy` assertions with the matcher that names the claim.
   Files: `tests/lib/sessionTitleFormatter.spec.ts:48`, `tests/store/userStore.integration.test.ts:14`, `tests/store/sessionsStore.integration.test.ts:11` and `:42`, `tests/store/storeEngine.integration.test.ts:46` and `:47`
   Change: R4 and R5 — `expect(result).toBeTruthy()` on a formatted string becomes an assertion on the string itself (`toBe('…')` for a fixed value, `toContain('…')` for a fragment the spec determines). `expect(id).toBeTruthy()` on a generated uuid becomes `expect(id).toEqual(expect.any(String))` plus a length or format assertion, or better, a read-back: assert the store now holds a session with that id. `expect(coaching.status).toBeTruthy()` becomes an assertion on the actual status value the pipeline should produce — `toBeTruthy` there passes on any non-empty string and proves nothing about which one.
   Check: `grep -rn "toBeTruthy\|toBeFalsy" tests` returns nothing; `pnpm test -- --run`.

2. Replace the snapshot assertion.
   Files: `tests/packages/gpx/buildGpx.spec.ts:25` (path after the spec-layout plan; `tests/packages/gpx/buildGpx.spec.ts` today)
   Change: R7 — `expect(gpx).toMatchSnapshot()` is a file-based snapshot, which is not a statement about what matters in the generated GPX. Replace it with assertions naming the claims: the document declares the expected namespace and creator, it contains one `<trkpt>` per input point with the expected lat/lon, and the elevation and time fields appear where the input had them. Where the whole literal text genuinely *is* the assertion and is short enough to read in a diff, `toMatchInlineSnapshot` is permitted instead.
   Check: `grep -rn "toMatchSnapshot" tests` returns nothing; the obsolete snapshot file under `tests/packages/gpx/__snapshots__/` is deleted; `pnpm test -- --run tests/packages/gpx`.

3. Tighten the spy assertions that do not name their arguments.
   Files: every spec the R1 signal reports, starting with `tests/store/filters.spec.ts`
   Change: R1 — `expect(spy).toHaveBeenCalled()` is reserved for a call whose arguments the spec does not determine. Where the spec set up an input, the assertion names it with `toHaveBeenCalledWith(...)`. `tests/store/filters.spec.ts:230` and `:341` use `not.toHaveBeenCalled()`, which is R2's correct form for asserting absence and stays as it is.
   Check: R1's grep reports only calls whose arguments the spec genuinely does not determine; `pnpm test -- --run`.

4. Fix `toBe` applied to a structure and `toEqual` applied to a primitive.
   Files: every spec the R3 signal reports
   Change: R3 — `toBe` for primitives, identity and `null`/`undefined`; `toEqual` for objects and arrays. `toBe` on a freshly built object literal is either a guaranteed failure or an accidental pass on a shared reference.
   Check: R3's signal reports nothing; `pnpm test -- --run`.

5. Use the DOM matchers in the two hook integration specs.
   Files: `tests/lib/hooks/useChartZoom.integration.test.ts`, `tests/lib/hooks/useMapHover.integration.test.ts` (paths after the spec-layout plan)
   Change: R6 — assert DOM presence with `toBeInTheDocument()` and element state with the matcher that names it, rather than reading a property off a node and comparing it. These are the only two specs that touch a rendered tree; after the setup file registers the matchers, use them here rather than hand-rolled property reads.
   Check: `pnpm test -- --run tests/lib/hooks`.

## Open items

R8 (extend the matcher vocabulary with `expect.extend` rather than writing an assertion helper that wraps `expect`) has nothing to do today — no spec wraps `expect` in a helper. It is carried in the TDR reference as the answer for the first spec that wants one: a registered matcher composes with `.not`, produces a real failure message, and is reachable from every spec, where a helper does none of those.

`vitest.config.ts` does not enable `expect-expect` or any equivalent, so nothing fails when a test asserts nothing at all. These rules are the only thing standing between a test and a vacuous pass, and that is worth stating rather than assuming.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
