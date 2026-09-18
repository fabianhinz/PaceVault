---
kind: pattern-apply-tdr-reference
id: test-data-from-mock-factories
title: Test data comes from mock factories, never from object literals
summary: Every entity a spec needs comes from a createMock<Entity>(overrides?) factory returning a complete valid instance, which the spec narrows with the fields its assertion turns on.
governs:
  - "tests/**/*.spec.ts"
  - "tests/**/*.spec.tsx"
  - "tests/**/*.integration.test.ts"
  - "tests/factories/**/*.ts"
adopted_rules: [R1, R2, R3, R4, R6, R7, R8]
adopted: 2026-09-17
---

# Test data comes from mock factories, never from object literals

## 1. Context

This file carries R1–R4 and R6–R8.

Every entity a spec needs is produced by a `createMock<Entity>(overrides?)` function in `tests/factories/` that returns a complete, valid instance of that entity; the spec then narrows it with the two or three fields the assertion actually turns on. The alternative — each spec writing its own object literal — makes the entity's required shape a fact duplicated across dozens of files, so adding one required field to `TrainingSession` breaks the type check in every one of them and each has to be repaired by hand. With a factory the same change touches one default.

Scope: spec files under `tests/` and the factory modules they import. It governs *data* — the entities and value objects a unit under test reads and returns. It deliberately does not govern *collaborators*: something the unit talks to is replaced with a mock proxy, not built by a factory, and that is a sibling record.

One rule of the original is Moot: it split factory ownership between a workspace package's `./testing` subpath and the application's own module. PaceVault is a single package, so every factory lives in `tests/factories/` and there is no published factory to compose.

`src/lib/factories/` is production code despite its name and is not governed here.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | A spec never constructs a persisted or schema-defined entity as an object literal. It calls the entity's factory and passes only the fields the test depends on. | manual |
| R2 | A factory is named `createMock<Entity>`, takes a single optional `overrides` parameter typed `Partial<Entity>`, returns `Entity`, and spreads `overrides` last so every default is replaceable. | proposed |
| R3 | The defaults a factory supplies form a complete, valid instance: every required field of the entity is populated, and the factory's return type is annotated with the entity type so a new required field fails there. | manual |
| R4 | A factory for an entity that contains another entity calls that entity's factory for the nested value rather than inlining its shape, and accepts an override for it. | manual |
| R6 | Factory modules are importable from spec files only. No production module imports one. | proposed |
| R7 | Every export of a factory module is a factory following R2's name shape. Fixture constants, sample payloads and other test scaffolding belong in their own sibling module under `tests/`. | proposed |
| R8 | A factory's defaults are fixed values. Where a generated identifier or timestamp is genuinely needed, the factory generates it, and any spec asserting on that field reads it back from the returned instance rather than hard-coding an expectation. | manual |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "const [a-zA-Z]+: (TrainingSession|SessionRecord|SessionGPS|UserProfile|LapAnalysis|Trip) = \\{"
  include: ["tests/**/*.spec.ts", "tests/**/*.spec.tsx", "tests/**/*.integration.test.ts"]
  exempt: ["tests/factories/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Misses an entity literal passed inline as an argument rather than bound to an annotated const,
    which is the more common form; pair with a read of the spec's arrange block.
R2:
  type: grep
  pattern: "export const createMock[A-Z][A-Za-z0-9]* = \\(overrides\\?: Partial<[A-Za-z]+>\\): [A-Za-z]+ =>"
  include: ["tests/factories/*.ts"]
  exempt: []
  violationWhen: no-match
  enforcedBy: null
  falsePositives: >
    A factory whose parameter list wraps across lines will not match a single-line pattern.
R3:
  type: manual
  reason: >
    Whether the defaults form a complete instance is what the return-type annotation proves; the
    check is `pnpm check`, not a pattern over the module.
  enforcedBy: null
R4:
  type: manual
  reason: >
    Detecting an inlined nested entity shape means comparing a factory's literal against another
    factory's output type.
  enforcedBy: null
R6:
  type: grep
  pattern: "@tests/factories|tests/factories"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R7:
  type: grep
  pattern: "^export const (?!createMock)[a-zA-Z]"
  include: ["tests/factories/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A module-private helper the factories share is not exported and does not match; an exported
    type alias does not match either.
R8:
  type: grep
  pattern: "Date\\.now\\(\\)|Math\\.random\\(\\)"
  include: ["tests/factories/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A generated id or timestamp is permitted; the violation is a spec hard-coding an expectation
    against it, which this pattern cannot see.
```

## 4. Trade-offs

- **Good, because** adding a required field to an entity is one edit in one default rather than a repair in every spec that built that entity by hand.
- **Good, because** a spec's arrange block shows only the fields its assertion turns on, so what the test is actually about is visible instead of buried in a full object literal.
- **Bad, because** a complete default instance hides which fields a unit really depends on: a spec can pass because the factory happened to supply something the assertion never named.
- **Bad, because** factories accumulate — a default that suits most specs gets overridden in half of them, and the defaults stop being a meaningful "typical" instance.
- **Neutral, because** the factory/proxy split (data versus collaborator) is a real distinction that has to be made per site, and the two records have to be read together to make it.

## 5. Reference implementation

`tests/factories/sessions.ts`:

```ts
import { createMockSessionGPS } from '@tests/factories/gps.ts';

export const createMockTrainingSession = (
  overrides?: Partial<TrainingSession>,
): TrainingSession => ({
  id: 'session-1',
  createdAt: 0,
  startTime: 0,
  sport: 'running',
  distance: 10_000,
  detailedRecords: true,
  gps: createMockSessionGPS(),
  ...overrides,
});
```

A spec names only what it is about:

```ts
const session = createMockTrainingSession({ distance: 42_195 });
expect(formatDistance(session.distance)).toBe('42.20 km');
```

## 6. Forbidden practices

- ❌ A full entity object literal in a spec — the entity's shape is then a fact restated in every file that needs one.
- ❌ A factory returning a partial and being cast to the entity; the cast is what lets the defaults go stale.
- ❌ A factory whose overrides are spread first, so a default silently wins over what the spec asked for.
- ❌ A factory inlining a nested entity's shape instead of calling that entity's own factory.
- ❌ A production module importing a factory; test scaffolding then ships in the bundle.
- ❌ A fixture constant or a sample payload exported from a factory module alongside the factories.
- ❌ A spec hard-coding an expectation against a generated id or timestamp instead of reading it back from the instance.
