---
kind: pattern-apply-tdr-reference
id: test-data-from-mock-factories
title: Test data comes from createMock factories, never from object literals
summary: Specs build every entity with createMock<Entity>(overrides?) from @pacevault/testing (engine and gpx entities) or apps/web/tests/factories (app entities), passing only the fields the test turns on; series builders live apart in @pacevault/testing/series.ts.
governs:
  - "apps/web/tests/**/*.spec.ts"
  - "apps/web/tests/**/*.spec.tsx"
  - "apps/web/tests/factories/**"
  - "packages/testing/src/**"
  - "packages/engine/tests/**/*.spec.ts"
  - "packages/gpx/tests/**/*.spec.ts"
  - "apps/web/src/**"
adopted_rules: [R1, R2, R3, R4, R6, R7, R8]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Test data comes from createMock factories, never from object literals

## 1. Context

This file carries R1–R4 and R6–R8. Every entity a spec needs is produced by a `createMock<Entity>(overrides?)` function that returns a complete, valid instance; the spec then narrows it with the two or three fields the assertion turns on. The alternative — each spec writing its own object literal or local `make…` helper — makes the entity's required shape a fact duplicated across many files, so adding one required field to `TrainingSession` breaks the type-check in every one of them. With a factory the same change touches one default.

Entities declared in `packages/engine/src/types.ts` (`TrainingSession`, `SessionRecord`, `SessionLap`, `SessionGPS`, `PersonalBest`, `DailyMetrics`) get their factories in the workspace package `@pacevault/testing`, one module per entity area (`packages/testing/src/sessions.ts`, `records.ts`, `gps.ts`, `personalBests.ts`, `dailyMetrics.ts`), imported as `@pacevault/testing/<module>.ts`; record, lap and session series builders sit in `packages/testing/src/series.ts`. Entities that exist only in the app (`UserProfile`, `CoachingRecommendation`, `WorkoutStep`, `WeeklyPlan` in `apps/web/src/types.ts`) get their factories in `apps/web/tests/factories/` (`profiles.ts`, `coaching.ts`), imported as `@tests/factories/<module>.ts`. Engine specs import `packages/testing` by relative path (`../../testing/src/…`), because `@pacevault/testing` depends on the engine and a workspace cycle trips `vp run`. This governs *data*; collaborators passed into a subject are substitutes (`collaborators-replaced-with-mocks`), not factories.

GPX route entities (`ParsedGpxPoint`, `RoutePoint`, `GpxPoint`, `GpxWaypoint`, `GpxMetadata` from `packages/gpx`) get their factories in `packages/testing/src/route.ts`, so `@pacevault/testing` depends on `@pacevault/gpx` as well; gpx specs reach that module by relative path (`../../testing/src/route.ts`) for the same reason engine specs do, and app specs import it as `@pacevault/testing/route.ts`.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | A spec never constructs a schema-defined entity as an object literal or through a local helper. It calls the entity's factory and passes only the fields the test depends on. | manual |
| R2 | A factory is `createMock<Entity>`, takes a single optional `overrides` parameter typed `Partial<Entity>`, returns `Entity`, and spreads `overrides` last so every default is replaceable. | proposed |
| R3 | The defaults a factory supplies form a complete, valid instance: every required field of the entity is populated, so the return value type-checks as the entity itself and not as a partial. | manual |
| R4 | A factory for an entity that contains another entity calls that entity's factory for the nested value rather than inlining its shape, and accepts an override for it. | manual |
| R6 | Factory and series modules (`@pacevault/testing/*`, `@tests/factories/*`) are importable from spec files only. No module under `apps/web/src/` or `packages/*/src/` (other than `packages/testing/src/` itself) imports one, and `@pacevault/testing` is only ever a devDependency. | proposed |
| R7 | Every export of a factory module is a factory following R2's name shape. Series and scenario builders (`cyclingRecordSeries({ count, basePowerWatts })`, `lapSeries(count)`, `sessionSeries({ count, startDate, baseTss, tssVariation })`) belong in the separate module `packages/testing/src/series.ts`; builders used by one spec only stay colocated in that spec. | proposed |
| R8 | A factory's defaults are fixed values. Where a generated identifier or timestamp is genuinely needed, the factory generates it, and any spec asserting on that field reads it back from the returned instance rather than hard-coding an expectation. | manual |

## 3. Detection

```yaml
R1:
  type: manual
  reason: >
    A domain literal is usually unannotated — it reaches its type by being passed to a parameter or
    returned from a typed function, so no textual pattern distinguishes it from any other object
    literal. The narrow executable variant — a local helper shaped like a factory — is
    `rg -n "^\s*const (make|build|create|mock)[A-Z]\w* = \(overrides" apps/web/tests --glob '*.spec.*'`,
    which must print nothing; it does not see unannotated literals.
  enforcedBy: null
R2:
  type: grep
  pattern: "^export const createMock[A-Za-z0-9]+ = \\((?![^)]*overrides\\?: Partial<)"
  include: ["apps/web/tests/factories/**/*.ts", "packages/testing/src/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Flags a factory whose override type is written across several lines. Does not detect a factory
    that accepts `overrides` but forgets to spread it last — check the body.
R3:
  type: manual
  reason: >
    "Complete and valid" is a type-checker fact; the compiler already rejects an incomplete factory
    whose declared return type is the entity, and a factory that widens its return type to Partial
    passes both the compiler and any grep.
  enforcedBy: null
R4:
  type: manual
  reason: >
    Whether a nested object should have come from its own factory depends on whether that nested
    type is itself an entity with a factory — a cross-module lookup, not a local pattern.
  enforcedBy: null
R6:
  type: grep
  pattern: "from '(@tests/factories/[^']+|@pacevault/testing/[^']+)'"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/*/src/**/*.ts", "packages/*/src/**/*.tsx"]
  exempt: ["packages/testing/src/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Misses a production module re-exporting a factory through an intermediate module, because only
    the direct import matches.
R7:
  type: grep
  pattern: "^export (const|function) (?!createMock[A-Z])"
  include: ["apps/web/tests/factories/**/*.ts", "packages/testing/src/**/*.ts"]
  exempt: ["packages/testing/src/series.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Flags an exported type alias the factories' override types need, which is harmless. Does not
    flag a correctly named `createMockX` that builds scaffolding rather than an entity.
R8:
  type: manual
  reason: >
    Whether a generated identifier is required by the entity's semantics or is incidental
    convenience cannot be read off the factory, and the resulting fragility appears in the
    asserting spec, not in the factory module.
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** the required shape of an entity is stated once. Adding a required field to a type in `packages/engine/src/types.ts` is a one-line change to its factory instead of a mechanical repair across every spec that ever mentioned it.
- **Good, because** a spec's setup shows only what the test depends on. `createMockTrainingSession({ sport: 'running' })` says the assertion turns on `sport` and nothing else, which a twenty-field literal never says.
- **Good, because** one testing package serves the app and every package from the same modules, so a session or record stream is built the same way everywhere, and splitting series out of the factory modules keeps `createMock` the one thing a factory module offers.
- **Bad, because** a shared factory couples every spec to one default shape. Changing a default to suit a new test silently alters the fixture that distant specs were asserting against, and the breakage surfaces far from the edit that caused it.
- **Bad, because** a complete-entity default hides the dependency it satisfies. A spec that passes because the factory happened to default `stressMethod` one way is not obviously doing so.
- **Bad, because** the testing package depends on the engine, so engine specs must reach it by relative path rather than by package name, an asymmetry every new engine spec has to remember.
- **Neutral, because** factories that generate identifiers or timestamps (`Date.now()` under the fixed test clock) trade cross-test isolation for determinism.

## 5. Reference implementation

`packages/testing/src/sessions.ts`:

```ts
import type { TrainingSession } from '@pacevault/engine/types.ts';
import { SESSION_DERIVATION_VERSION } from '@pacevault/engine/sessionDerivation.ts';

export const createMockTrainingSession = (
  overrides?: Partial<TrainingSession>,
): TrainingSession => ({
  id: `session-${Date.now()}`,
  sport: 'cycling',
  date: Date.now(),
  duration: 3600,
  distance: 30000,
  avgHr: 150,
  maxHr: 175,
  avgPower: 200,
  normalizedPower: 215,
  avgCadence: 88,
  avgPace: undefined,
  elevationGain: 300,
  tss: 80,
  stressMethod: 'tss',
  isPlanned: false,
  hasDetailedRecords: true,
  derivationVersion: SESSION_DERIVATION_VERSION,
  createdAt: Date.now(),
  source: { kind: 'file' },
  ...overrides,
});
```

`packages/testing/src/records.ts`:

```ts
import type { SessionLap, SessionRecord } from '@pacevault/engine/types.ts';

export const createMockSessionRecord = (overrides?: Partial<SessionRecord>): SessionRecord => ({
  timestamp: 0,
  ...overrides,
});

export const createMockSessionLap = (overrides?: Partial<SessionLap>): SessionLap => ({
  lapIndex: 0,
  startTime: 0,
  endTime: 300_000,
  totalTimerTime: 300,
  distance: 1000,
  intensity: 'active',
  ...overrides,
});
```

`packages/testing/src/series.ts` holds the builders that take a count (bare when it is their only input, otherwise in one object with their unit-named options, `runningRecordSeries({ count, baseSpeedMetersPerSec, baseHrBpm })`) and return many entities (`cyclingRecordSeries`, `runningRecordSeries`, `gpsRunningRecordSeries`, `indoorRecordSeries`, `lapSeries`, `invalidRecordSeries`, `sessionSeries`); `sessionSeries` builds each item with `createMockTrainingSession`.

A spec takes the whole instance and narrows it, reading generated fields back (`subject` stands for the function under test):

```ts
import { it, expect } from 'vite-plus/test';
import { createMockTrainingSession } from '@pacevault/testing/sessions.ts';
import { runningRecordSeries } from '@pacevault/testing/series.ts';
import { createMockUserProfile } from '@tests/factories/profiles.ts';

it('keeps the id of the session it scores', () => {
  const session = createMockTrainingSession({ sport: 'running' });
  const records = runningRecordSeries({ count: 3601 });
  const profile = createMockUserProfile();

  const result = subject({ session, records, profile });

  expect(result.sessionId).toBe(session.id);
});
```

An engine spec reaches the same modules by relative path:

```ts
import { createMockTrainingSession } from '../../testing/src/sessions.ts';
import { sessionSeries } from '../../testing/src/series.ts';
```

## 6. Forbidden practices

- ❌ An object literal standing in for an entity in a spec — including one narrowed with `as TrainingSession` or `as unknown as TrainingSession` to silence the missing fields. The cast converts a compile error the factory would have prevented into a runtime surprise.
- ❌ A per-spec local `const makeSession = (overrides) => ({ … })` helper at the top of a spec file. It is a factory with no home; the next spec needing the same entity writes it again, differently.
- ❌ Alternative factory names — `makeSession`, `buildSession`, `aSession`, `sessionFixture`, `createSessionMock`, `createMockedSession`. One prefix and one word order, so the factory for any entity is findable by typing `createMock` and the entity's name.
- ❌ A factory returning a partial and leaving the spec to complete it. That reinstates the duplication the factory exists to remove, at every call site.
- ❌ Importing `@pacevault/testing/*` or `@tests/factories/*` from `apps/web/src/` or `packages/*/src/`, or listing `@pacevault/testing` as a runtime dependency. Shipping it ships fixtures.
- ❌ Re-implementing in `apps/web/tests/factories/` a factory that `@pacevault/testing` already provides. Compose the shared one and add only the app's extra fields.
- ❌ Putting series builders, payload builders or constants in a factory module. They belong in `packages/testing/src/series.ts` or beside the one spec that uses them.
