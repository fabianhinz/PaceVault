---
kind: pattern-apply-tdr-reference
id: collaborators-replaced-with-mock-proxies
title: Collaborators replaced with typed mock proxies
summary: A stand-in's mechanism follows the collaborator's shape — a bare vi.fn for a function, a typed proxy for an object, a path-only vi.mock for a module — and every double is typed from the real type and built fresh per case.
governs:
  - "tests/**/*.spec.ts"
  - "tests/**/*.spec.tsx"
  - "tests/**/*.integration.test.ts"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7]
adopted: 2026-09-17
---

# Collaborators replaced with typed mock proxies

## 1. Context

This file carries R1–R7.

A spec that has to stand in for something the unit under test talks to has three mechanisms available, and picking by habit rather than by the shape of the collaborator produces stand-ins that drift from the real type: a hand-written literal satisfies today's call site and silently stops resembling the interface it replaces the moment that interface grows a member. This record fixes which mechanism answers which situation and how the resulting handle is typed.

The population of specs that need a stand-in at all is small — most specs here exercise pure engine, lib and parser functions and assert on their return values — so treat this as the rule for the cases that arise, not as a mandate to introduce doubles.

This record covers how collaborators are *substituted*. How test *data* is built is the factory record. It says nothing about the Playwright suites under `e2e/`, where the collaborators are real on purpose.

`vitest-mock-extended` is a direct devDependency of this project and supplies `mock<T>()`, `mockDeep<T>()`, `MockProxy<T>` and `DeepMockProxy<T>`.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Use `vi.fn()` when the double is function-shaped — a callback the unit receives as a prop or argument, or the implementation installed into an automocked module binding. Keep it bare; do not wrap a single function in a mock proxy. | manual |
| R2 | Use `mock<T>()` / `mockDeep<T>()` when the double is a multi-member object the unit receives as a value — a session record, a filter bag, a map instance, a DOM-ish object, a ref target, an event. Never hand-write an object literal and cast it to the collaborator's type. | proposed |
| R3 | Use `vi.mock('<module path>')` when the unit reaches the dependency through its own module imports and the spec has no way to hand it in — the IndexedDB layer, the weather client, a store module. Call it with the path only, no inline factory, and configure the automocked binding per case through `vi.mocked(binding)`. The path may be a package id or a first-party alias path; ownership of the module is irrelevant to the choice. | proposed |
| R4 | Give every double a handle typed from the real type: `MockProxy<T>` / `DeepMockProxy<T>` for a proxy held across cases, an inline type argument (`mockDeep<T>()`) where it is built at the call site, and `Mock<typeof binding>` for a function standing in for a module export. Reserve a bare `Mock` for a callback that has no named counterpart. | manual |
| R5 | Construct doubles fresh per case — inside the `it`, or in a `beforeEach` that assigns to a `let` declared in the enclosing `describe`. Never build a double at module scope, and do not lean on `vi.clearAllMocks` / `resetAllMocks` / `restoreAllMocks` to undo leakage between cases: they clear call history, not stubbed implementations. | proposed |
| R6 | Assert against the handle you created, not against the automocked binding: install a fresh `vi.fn()` (or proxy) as the binding's implementation and make the expectation about that object, so call history cannot survive from the previous case. | manual |
| R7 | Seed only the members the case actually drives — pass them as the partial-override argument (`mock<T>({ … })`) or set them on the proxy afterwards — and leave the rest of the surface to the proxy. | manual |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "mock(Deep)?<\\(\\) =>|mock(Deep)?<\\([a-zA-Z]+:"
  include: ["tests/**/*.spec.ts", "tests/**/*.spec.tsx", "tests/**/*.integration.test.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R2:
  type: grep
  pattern: "\\} as (unknown as )?[A-Z][A-Za-z0-9]*"
  include: ["tests/**/*.spec.ts", "tests/**/*.spec.tsx", "tests/**/*.integration.test.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A cast that narrows a genuinely-complete literal to a union member, or an `as const` on a
    fixture table, also matches. Read whether the literal is standing in for a wider interface.
R3:
  type: grep
  pattern: "vi\\.mock\\([^)]*,\\s*\\(\\) =>"
  include: ["tests/**/*.spec.ts", "tests/**/*.spec.tsx", "tests/**/*.integration.test.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A factory is occasionally unavoidable for a module with no analysable shape; such a case needs
    a stated reason rather than silent tolerance.
R4:
  type: grep
  pattern: "let [a-zA-Z]+: (MockProxy|DeepMockProxy|Mock)<"
  include: ["tests/**/*.spec.ts", "tests/**/*.spec.tsx", "tests/**/*.integration.test.ts"]
  exempt: []
  violationWhen: no-match
  enforcedBy: null
  falsePositives: >
    Only meaningful in a spec that holds a double across cases; a spec with no doubles fails this
    check trivially. Run it scoped to specs that call `mock<`/`mockDeep<`.
R5:
  type: grep
  pattern: "^const [a-zA-Z]+ = (mock(Deep)?<|vi\\.fn\\()"
  include: ["tests/**/*.spec.ts", "tests/**/*.spec.tsx", "tests/**/*.integration.test.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A module-scope `vi.fn()` used solely as a stable reference identity in a single case is still
    shared state and still a violation.
R6:
  type: manual
  reason: >
    Whether an expectation targets the handle the spec created or the automocked binding needs the
    two identities traced through the file.
  enforcedBy: null
R7:
  type: manual
  reason: >
    "Only the members the case drives" is a comparison between the seeded fields and the assertions,
    which a pattern cannot make.
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** a double built from a type stays in step with that type: a new required field on `SessionRecord` does not silently leave every stand-in short of it.
- **Good, because** the mechanism follows from the collaborator's shape, so the choice is not a matter of taste and two specs standing in for the same thing look the same.
- **Bad, because** a proxy answers every member, so a spec can pass while the unit calls something the spec never considered — a hand-written literal would at least have failed to compile.
- **Bad, because** it adds a dependency and a vocabulary (`MockProxy`, `mockDeep`) for a small population of specs; most of this suite needs none of it.
- **Neutral, because** per-case construction is more setup than a module-scope double, and the isolation it buys only shows when specs run in a different order.

## 5. Reference implementation

An object-shaped double, seeded with only what the case drives:

```ts
import { mock } from 'vitest-mock-extended';
import type { MockProxy } from 'vitest-mock-extended';

describe(buildZoneColoredPath.name, () => {
  let record: MockProxy<SessionRecord>;

  beforeEach(() => {
    record = mock<SessionRecord>({ sessionId: 's1', timestamp: 0 });
  });
});
```

A module the unit reaches through its own imports — path only, configured per case:

```ts
vi.mock('@/lib/indexeddb.ts');

beforeEach(() => {
  vi.mocked(getRecords).mockResolvedValue([]);
});
```

## 6. Forbidden practices

- ❌ `{ sessionId: 's1' } as SessionRecord` — the cast asserts a shape the literal does not have, and the assertion stops being true silently.
- ❌ `{ … } as unknown as T` — the double cast exists precisely to defeat the check that would have caught the drift.
- ❌ Wrapping a single callback in `mock<T>()`; a bare `vi.fn()` is the shape of a function.
- ❌ `vi.mock(path, () => ({ … }))` with an inline factory — the stand-in is then hand-written after all, just inside a callback.
- ❌ A double built at module scope; its stubbed implementations and its call history outlive the case that set them.
- ❌ `vi.resetAllMocks()` in a `beforeEach` to compensate for a shared double; it clears calls, not implementations, so the specs pass alone and fail in file order.
- ❌ Asserting on the imported binding rather than on the handle installed as its implementation.
