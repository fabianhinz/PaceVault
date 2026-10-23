---
kind: pattern-apply-tdr-reference
id: collaborators-replaced-with-mocks
title: A unit spec builds its subject directly with mocked collaborators
summary: A unit spec calls or constructs its subject itself and passes vitest-mock-extended substitutes for every collaborator one layer below it, rebuilt in beforeEach, reached through vi.mocked, under a describe titled with the subject's symbol.
governs:
  - "apps/web/tests/**/*.spec.ts"
  - "apps/web/tests/**/*.spec.tsx"
  - "apps/web/vitest.config.ts"
  - "packages/ui/tests/**/*.spec.ts"
  - "packages/ui/tests/**/*.spec.tsx"
adopted_rules: [R1, R2, R3, R5, R6, R7, R8]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# A unit spec builds its subject directly with mocked collaborators

## 1. Context

This file carries R1, R2, R3, R5, R6, R7 and R8. A unit spec here is a spec over one function, hook or module, and it gets that unit into a test by calling it itself with substitutes for what it depends on, rather than letting the production wiring assemble the real graph. Without that, a spec over one lib function reaches IndexedDB, the network and the store through several layers of indirection, so it becomes an integration test that is slow, order-dependent, and fails for reasons unrelated to the unit named in its title. Substituting collaborators also makes the unit's contract explicit: the parameters it receives are the list of things it depends on, and the spec restates it.

The rules also bind `packages/ui` (`packages/ui/src`, specs in `packages/ui/tests`); where the text below names an `apps/web` path, the kit's counterpart is meant. Kit specs exercise pure helpers and need no doubles today; a kit spec that needs one adds `vitest-mock-extended` to `packages/ui` devDependencies.

Scope: specs under `apps/web/tests/` that exercise a function, a hook or a pure module. Out of scope: Playwright specs in `apps/web/e2e/`, which run the real app on purpose, and `*.integration.spec.ts` files whose behaviour *is* the wiring (import → engine → store); those keep the real modules and substitute only what leaves the process (`fetch`, `Worker`, an injected IndexedDB failure). How test *data* is built is `test-data-from-mock-factories`; where a spec lives is `mirrored-spec-layout`.

**On R3 and `clearMocks`.** `apps/web/vitest.config.ts` sets `clearMocks: true` for the app's test project, which calls `mockClear()` on every spy before each test. That clears calls, instances and results and nothing else: a `mockReturnValue` or `mockResolvedValue` set in one test survives into the next. The `beforeEach` reassignment is therefore not redundant — it is the only thing that discards stubbed return values. Keep it.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Call or construct the subject under test directly in the spec, passing substitutes for every collaborator it receives. Never obtain it from the production wiring or a module that assembles its own graph. | manual |
| R2 | Produce substitutes with `mock<T>()` or `mockDeep<T>()` from `vitest-mock-extended` and type the binding `MockProxy<T>` / `DeepMockProxy<T>`. Do not hand-roll an object literal of `vi.fn()`s, or a partial object literal, to stand in for an interface. | manual |
| R3 | Declare each substitute as a `let` at describe scope and reassign it in `beforeEach`, then rebuild any subject state from the fresh substitutes in the same block. The reassignment exists to discard stubbed implementations, not call history. | manual |
| R5 | Mock at the seam one layer below the subject. A spec over a function that receives a `QueryClient` substitutes that client, not the cache it wraps; a spec over a lib function that calls `@/lib/indexeddb.ts` substitutes that module, not `idb`. | manual |
| R6 | Reach a module-mocked value through `vi.mocked(x)`. Never cast with `as Mock` or `as unknown as MockProxy<T>` to get at mock methods. | proposed |
| R7 | Name the top-level describe block with the subject's symbol — `describe(subject.name, ...)` — so a rename carries into the test report. Use a string literal only where the subject has no symbol whose `name` prints it: a behaviour spanning several functions, a zustand store hook (its `name` is the library's `useBoundStore`), a zod schema (no `name`). | manual |
| R8 | Do not add `vi.resetAllMocks()` / `mockReset()` to compensate for state between tests; `clearMocks` plus the `beforeEach` rebuild already covers it. | manual |

## 3. Detection

```yaml
R1:
  type: manual
  reason: >
    Distinguishing "called with substitutes" from "obtained from production wiring" requires
    resolving what the imported value is. A spec may legitimately import the subject's module and
    still call it with substitutes.
  enforcedBy: null
R2:
  type: grep
  pattern: "const\\s+\\w+\\s*(:\\s*\\w+)?\\s*=\\s*\\{[^}]*vi\\.fn\\(\\)[^}]*\\}|mockResolvedValue\\(\\{\\s*ok"
  include: ["apps/web/tests/**/*.spec.ts", "apps/web/tests/**/*.spec.tsx", "packages/ui/tests/**/*.spec.ts", "packages/ui/tests/**/*.spec.tsx"]
  exempt: ["apps/web/tests/setup.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Flags a legitimate inline props object carrying a callback prop (`onChange: vi.fn()`), which is
    a value the subject receives rather than a collaborator interface being stubbed. Also flags a
    `vi.mock` factory body, where an object of functions is the required shape.
R3:
  type: grep
  pattern: "^\\s*const\\s+\\w+\\s*=\\s*(mockDeep|mock)\\s*[<(]"
  include: ["apps/web/tests/**/*.spec.ts", "apps/web/tests/**/*.spec.tsx", "packages/ui/tests/**/*.spec.ts", "packages/ui/tests/**/*.spec.tsx"]
  exempt: ["apps/web/tests/setup.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A `const` mock created inside an `it` body is fine and matches this pattern; the rule targets
    describe-scope `const` only, which a line-anchored regex cannot reliably distinguish. Also
    misses a describe-scope `let` that is never reassigned.
R5:
  type: grep
  pattern: "vi\\.mock\\('(idb|fake-indexeddb)'"
  include: ["apps/web/tests/**/*.spec.ts", "apps/web/tests/**/*.spec.tsx", "packages/ui/tests/**/*.spec.ts", "packages/ui/tests/**/*.spec.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Flags a spec over `apps/web/src/lib/db.ts` itself, which owns the `idb` boundary and is the one
    place mocking it is correct. Does not flag the inverse leak — a spec using a real collaborator
    instead of a substitute.
R6:
  type: grep
  pattern: "\\bas\\s+(unknown\\s+as\\s+)?(vi\\.Mock|Mock|MockInstance|MockProxy<|DeepMockProxy<)"
  include: ["apps/web/tests/**/*.spec.ts", "apps/web/tests/**/*.spec.tsx", "packages/ui/tests/**/*.spec.ts", "packages/ui/tests/**/*.spec.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A narrowing cast on an overload that `vitest-mock-extended` cannot express is legitimate and
    matches.
R7:
  type: grep
  pattern: "^describe\\('[A-Za-z_][A-Za-z0-9_]*',"
  include: ["apps/web/tests/**/*.spec.ts", "apps/web/tests/**/*.spec.tsx", "packages/ui/tests/**/*.spec.ts", "packages/ui/tests/**/*.spec.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Matches the sanctioned string titles of zustand store hooks (`use…Store`) and zod schemas
    (`…Schema`), and a single-word title that is not an imported symbol. Only a title equal to an
    imported function's name is a real violation.
R8:
  type: grep
  pattern: "(vi\\.resetAllMocks|vi\\.restoreAllMocks|\\.mockReset)\\("
  include: ["apps/web/tests/**/*.spec.ts", "apps/web/tests/**/*.spec.tsx", "packages/ui/tests/**/*.spec.ts", "packages/ui/tests/**/*.spec.tsx"]
  exempt: ["apps/web/tests/setup.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A targeted `.mockReset()` on one spy mid-test, to re-stub a collaborator for a second phase of
    the same test, is legitimate. Only a blanket reset in a lifecycle hook is the anti-pattern.
```

## 4. Trade-offs

- **Good, because** the spec runs the unit and nothing else: a failure points at the unit named in the describe block, and the suite stays fast enough to run on every change.
- **Good, because** the `beforeEach` rebuild makes each test independent by construction rather than by discipline, so tests can be reordered, filtered or run alone without changing behaviour.
- **Good, because** the list of substitutes at the top of a spec is a readable dependency inventory for the unit — and a spec that needs eight of them is visible evidence the unit is doing too much.
- **Bad, because** `mockDeep` auto-stubs every member: a call to a collaborator the spec never thought about silently returns a proxy instead of throwing, so a spec can pass green while the subject calls the collaborator with the wrong arguments, or not at all. Substituting a collaborator obliges the spec to assert on it explicitly; the mock will not.
- **Bad, because** module-level `vi.mock` couples the spec to the subject's import structure. Moving a module breaks specs that never touched the behaviour — and a mocked module drifts silently away from the real one's signature.
- **Neutral, because** mocked collaborators mean no unit spec proves the units fit together; that guarantee is deliberately pushed out to the `*.integration.spec.ts` files and the Playwright layer.

## 5. Reference implementation

The collaborator arrives as an argument, so it is substituted as an argument:

```ts
import { beforeEach, describe, expect, it } from 'vite-plus/test';
import { mock, type MockProxy } from 'vitest-mock-extended';
import type { QueryClient } from '@tanstack/react-query';
import {
  PERSONAL_BESTS_KEY,
  invalidatePersonalBestsOfSession,
} from '@/features/records/hooks/usePersonalBests.ts';

describe(invalidatePersonalBestsOfSession.name, () => {
  let queryClient: MockProxy<QueryClient>;

  beforeEach(() => {
    queryClient = mock<QueryClient>();
    queryClient.isFetching.mockReturnValue(0);
  });

  it('invalidates while a computation is in flight', () => {
    queryClient.isFetching.mockReturnValue(1);

    invalidatePersonalBestsOfSession(queryClient, 'b');

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: PERSONAL_BESTS_KEY,
      refetchType: 'all',
    });
  });
});
```

The subject imports its collaborator, so the module is mocked and reached through `vi.mocked`:

```ts
vi.mock('@/lib/indexeddb.ts');

describe(recomputeTrainingLoad.name, () => {
  beforeEach(() => {
    vi.mocked(getSessionRecords).mockResolvedValue([]);
  });
});
```

## 6. Forbidden practices

- ❌ Letting a unit spec use a real collaborator it could have received as a substitute — the spec then fails for that collaborator's reasons, and its title lies about what is under test.
- ❌ Reaching past a layer to mock what it encapsulates (mocking `idb` in a spec over a function that talks to `@/lib/indexeddb.ts`). The spec then encodes the storage layer's shape and breaks on refactors that change nothing observable.
- ❌ A describe-scope `const` substitute with no `beforeEach` reassignment — `clearMocks` will not discard its stubbed return values, so tests leak into each other in file order.
- ❌ Adding `vi.resetAllMocks()` in a lifecycle hook to paper over that leak instead of rebuilding the substitutes; it also wipes mocks the setup file `apps/web/tests/setup.ts` installed.
- ❌ Hand-rolled `{ method: vi.fn() }` or `{ ok, json: async () => body }` stand-ins for a typed collaborator — they compile after the real interface gains a member, and the spec keeps passing against a shape that no longer exists.
- ❌ `as unknown as MockProxy<T>` (or `as Mock`) to reach mock methods on a module-mocked value. `vi.mocked()` gives the same access with the type checked.
- ❌ A top-level `describe('analyzeLaps')` string literal where the symbol is in scope — the title stops matching after a rename and nothing fails.
