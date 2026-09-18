---
id: explicit-vitest-global-imports
tdr_reference: tdr/explicit-vitest-global-imports.md
generated: 2026-09-17
---

# Import the test API explicitly, even with globals enabled

Read `tdr/explicit-vitest-global-imports.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Register the DOM matchers in the setup file.
   Files: `tests/setup.ts`
   Change: `tests/setup.ts` imports `fake-indexeddb/auto` but never registers `@testing-library/jest-dom`, so the DOM matchers the assertion record requires are not available to any spec. Add `import '@testing-library/jest-dom/vitest';` as a bare side-effect import at the top of the setup file, beside the `fake-indexeddb/auto` import. The package is already a devDependency through `@testing-library/react`; if it is not a direct dependency, add it in the same change.
   Check: write a throwaway spec asserting `expect(document.body).toBeInTheDocument()`, run `pnpm test -- --run` and confirm it passes, then delete it.

2. Confirm every spec imports its runner symbols by name.
   Files: every spec under `tests/`
   Change: no change expected — every spec already imports from `vitest` despite `globals: true` in `vitest.config.ts`, which is exactly R1. Run R1's and R2's signals and fix anything that has drifted: a file using a symbol it did not import and relying on the ambient global is the violation R2 names.
   Check: R1's and R2's signals return nothing; `pnpm test -- --run`.

3. Confirm no spec imports the matcher extension itself.
   Files: every spec under `tests/`
   Change: R4 — matcher registration is not repeated per file. After item 1 it lives in the setup file; no spec adds its own `@testing-library/jest-dom` import.
   Check: `grep -rn "jest-dom" tests --include='*.spec.ts' --include='*.spec.tsx' --include='*.integration.test.ts'` returns nothing.

4. Keep type-only runner symbols in their own `import type` statement.
   Files: any spec the R3 signal reports
   Change: R3 — a type-only symbol from `vitest` (`Mock`, `MockInstance`, `MockedFunction`) is imported by a separate `import type` statement, not with an inline `type` modifier inside the value import. No spec currently does either; this is a guard for the first one that needs a mock type, which the mock-proxy plan will introduce.
   Check: R3's grep returns nothing; `pnpm check`.

5. Decide whether to turn `globals` off.
   Files: `vitest.config.ts`
   Change: optional, and a judgement call rather than a requirement of this record. Since every spec imports its symbols explicitly, `globals: true` buys nothing and switching it off would make R1 self-enforcing — an unimported `describe` would simply fail. The cost is that `@testing-library/jest-dom/vitest` and any other setup relying on ambient globals must still work, and `tsconfig.test.json` may reference `vitest/globals` types that become unnecessary. If you turn it off, run the full suite before and after and record the decision in the commit message; if you leave it on, say so and move on.
   Check: `pnpm test -- --run` passes either way; `pnpm check` passes.

## Open items

Item 5 is genuinely optional and this plan does not require either outcome. If `globals` is left on, R1 and R2 remain `proposed` with nothing enforcing them, which is the current state and is acceptable. If it is turned off, update the TDR reference's Section 3 `enforcedBy` for R1 and R2 to name `vitest.config.ts` and flip their Section 2 Enforcement to `enforced`.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
