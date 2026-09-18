---
id: render-through-provider-helpers
tdr_reference: tdr/render-through-provider-helpers.md
generated: 2026-09-17
---

# Mount hooks through the shared provider helper, never bare renderHook

Read `tdr/render-through-provider-helpers.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Add the shared render module.
   Files: new `tests/renderWithProviders.tsx`
   Change: export `renderHookWithProviders` — and, for symmetry, a `renderWithProviders` the suite does not use today — wrapping the tree in the application's provider stack as `src/main.tsx` composes it: `QueryClientProvider` around `BrowserRouter`. Create the `QueryClient` per mount inside the helper (R5), configured with retries off and no cache carried between mounts. Preserve the helper's own re-wrapping `rerender` so a re-render stays inside the same stack (R9). Export a `createTestQueryClient` factory so a spec that must seed or inspect cache state can obtain one (R5).
   Check: `pnpm check`; the module compiles and exports both helpers.

2. Migrate the two hook integration specs onto the helper.
   Files: `tests/lib/hooks/useChartZoom.integration.test.ts`, `tests/lib/hooks/useMapHover.integration.test.ts` (paths after the spec-layout plan)
   Change: both currently call `@testing-library/react` directly. Replace the bare `renderHook` with `renderHookWithProviders` (R2). Keep importing `act`, `waitFor` and `fireEvent` straight from the testing library — only `render` and `renderHook` are replaced (R4). Where a spec re-renders with new props, call the `rerender` the helper returns (R9).
   Check: `grep -n "renderHook" tests/lib/hooks/*.ts` shows only `renderHookWithProviders`; `pnpm test -- --run tests/lib/hooks`.

3. Add the viewport override helper and use it where a hook reads a media query.
   Files: `tests/renderWithProviders.tsx`, any spec exercising `useMediaQuery` or `useIsDesktop`
   Change: export `createMatchMedia(width)` from the render module and assign it to `window.matchMedia` in the specs that need a viewport, rather than hand-rolling a mock per spec (R7). Drive the width from a token or a named constant, not a bare pixel literal.
   Check: `grep -rn "window.matchMedia = " tests` shows only assignments of `createMatchMedia(...)`; `pnpm test -- --run`.

4. Keep the query client out of module scope.
   Files: `tests/renderWithProviders.tsx`, every spec
   Change: R6 — no spec imports a module-level pre-built client. A client shared across files leaks cached results between tests, which is the failure mode that makes a suite pass alone and fail in file order.
   Check: `grep -rn "new QueryClient()" tests` shows it only inside the helper module's per-mount factory; `pnpm test -- --run` twice with `--sequence.shuffle`.

5. Record the bare-render carve-out.
   Files: this project's spec suite
   Change: R8 — a bare `render` / `renderHook` is permitted only when the subject is itself a provider under test, or when every provider it consumes is module-mocked; such a spec composes the minimum wrappers it needs explicitly. There is no such spec today. Add the carve-out to a spec only with a comment-free, self-evident setup that shows why, and name it in the commit message.
   Check: R1's and R2's signals report no bare mount outside the helper module.

## Open items

This record is adopted for **hook specs only**. `tests/CLAUDE.md` states that UI components get no unit tests — bugs there are caught visually — and that decision stands. Two sibling conventions that presuppose component render tests were therefore not adopted in this project at all: one governing accessible queries into a rendered tree, and one governing how queries are destructured from a render result. Do not reintroduce them, and do not read `renderWithProviders`' existence as an invitation to start writing component render tests; it exists so the helper is symmetric and so a future decision to allow them has one funnel rather than a dozen.

R3 of the original chose between a plain and a selected-tenant helper variant. PaceVault has no tenant or selected-entity context, so there is one variant and the rule is not carried in the TDR reference.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
