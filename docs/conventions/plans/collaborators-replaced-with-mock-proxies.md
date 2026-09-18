---
id: collaborators-replaced-with-mock-proxies
tdr_reference: tdr/collaborators-replaced-with-mock-proxies.md
generated: 2026-09-17
---

# Collaborators replaced with typed mock proxies

Read `tdr/collaborators-replaced-with-mock-proxies.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Add the mock-proxy dependency.
   Files: `package.json`, `pnpm-lock.yaml`
   Change: `pnpm add -D vitest-mock-extended`. It supplies `mock<T>()` and `mockDeep<T>()`, which build a typed proxy from a type rather than a hand-written literal, so a double stays in step with the interface it stands in for.
   Check: `pnpm install` succeeds and `pnpm test -- --run` still passes with no spec changed yet.

2. Replace the object literals cast to a domain type.
   Files: `tests/features/map/zoneColoredPath.spec.ts:32` and `:116`, `tests/lib/attributeFilters.spec.ts:236` and `:256`
   Change: R2 — `{ sessionId: 's1', timestamp: 0 } as SessionRecord` and `{ duration: 3600, distance: null } as unknown as AttributeFilters` are hand-written literals asserted into a type. Each stops resembling its interface the moment that interface grows a member, which is exactly what the cast hides. Replace with `mock<SessionRecord>({ sessionId: 's1', timestamp: 0 })` — the partial override argument seeds only the fields the case drives (R7) and the proxy supplies the rest.
   Check: `grep -rn "as unknown as\| as SessionRecord\| as AttributeFilters" tests` returns nothing; `pnpm test -- --run`.

3. Type every double from the real type.
   Files: every spec that holds a double across cases
   Change: R4 — a proxy held across cases is typed `MockProxy<T>` / `DeepMockProxy<T>`; a proxy built at the call site carries its type argument inline (`mockDeep<T>()`); a function standing in for a module export is typed `Mock<typeof binding>`. Reserve a bare `Mock` for a callback with no named counterpart. Import the type-only symbols in their own `import type` statement, per the runner-imports record.
   Check: `pnpm check`; no double is typed by inference alone.

4. Construct doubles fresh per case.
   Files: every spec holding a double, starting with `tests/store/filters.spec.ts`
   Change: R5 — build a double inside the `it`, or in a `beforeEach` that assigns to a `let` declared in the enclosing `describe`. Never at module scope. Do not lean on `vi.clearAllMocks` / `resetAllMocks` / `restoreAllMocks` to undo leakage: they clear call history, not stubbed implementations, so a `mockResolvedValue` set in one case survives into the next.
   Check: no `mock<`/`mockDeep<`/`vi.fn()` call sits at module scope in a spec; run `pnpm test -- --run` twice with `--sequence.shuffle` and confirm both pass.

5. Assert against the handle, not the automocked binding.
   Files: every spec using `vi.mock`, starting with `tests/store/filters.spec.ts`, which mocks `@/lib/indexeddb.ts`
   Change: R3 and R6 — call `vi.mock('<path>')` with the path only, no inline factory, and configure the automocked binding per case through `vi.mocked(binding)`. Install a fresh `vi.fn()` as the binding's implementation in `beforeEach` and make each expectation about that object, so call history cannot survive from the previous case.
   Check: `grep -rn "vi.mock(.*() =>" tests` returns nothing; `pnpm test -- --run`.

## Open items

The mechanism is chosen by the double's shape, not by preference: `vi.fn()` for a function-shaped double, `mock<T>()`/`mockDeep<T>()` for a multi-member object the unit receives as a value, `vi.mock()` for a dependency the unit reaches through its own imports. Most specs in this suite exercise pure engine and lib functions and need no double at all — this record is the rule for the cases that arise, not a mandate to introduce doubles.

`vitest.config.ts` does not currently set `clearMocks`. Whether to add it is out of this record's scope; item 4's per-case construction is what actually provides isolation, and `clearMocks` would not have removed the need for it.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
