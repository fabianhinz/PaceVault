---
kind: pattern-apply-tdr-reference
id: mirrored-spec-layout
title: Specs live in a mirrored tests tree
summary: Every spec sits under tests/ at the path that mirrors its subject's path under src/, named after the module it covers.
governs:
  - "tests/**/*.spec.ts"
  - "tests/**/*.spec.tsx"
  - "tests/**/*.integration.test.ts"
  - "src/**/*.ts"
  - "src/**/*.tsx"
adopted_rules: [R1, R2, R3, R5, R7, R8, R9, R10]
adopted: 2026-09-17
---

# Specs live in a mirrored tests tree

## 1. Context

This file carries R1–R3, R5 and R7–R10.

Specs live outside the source root, in `tests/`, whose directory structure mirrors `src/` segment for segment, so a reader locates the spec for any module by swapping one prefix — the mirror *is* the index, with no search step. `vitest.config.ts` includes `tests/**/*.integration.test.ts` and `tests/**/*.spec.ts` and nothing under `src/`, so a spec placed beside its source never runs at all.

Without the mirror, specs drift into ad-hoc locations — grouped by a topic that is not a directory, named after the behaviour rather than the module — and both humans and path-scoped tooling lose a predictable way to find "the test for X". This codebase has that drift today: a `tests/engine/` tree that does not correspond to `src/packages/engine/`, and store specs named after a concept rather than their module.

One rule of the original is Moot here and is not carried: it chose between two runner trees by the runtime a subject needs. This project runs one Vitest project with a jsdom environment for everything, so there is no tree to choose.

Scope: where a spec goes, how it is named, and where its fixtures live. It deliberately does **not** mandate that every module gets a spec — `tests/CLAUDE.md` owns that, and requires coverage for the engine, packages and lib while forbidding component render tests. What goes *inside* a spec belongs to the title, import and assertion records.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Never place a spec file under `src/`. Every spec lives under `tests/`. | proposed |
| R2 | A spec's path inside `tests/` mirrors its subject's path inside `src/`: a module at `src/X/Y.ts` is specified at `tests/X/Y.spec.ts`. Directory names and casing are reproduced exactly. | manual |
| R3 | Name the spec after the module it covers, suffixed `.spec.ts`, or `.integration.test.ts` where it wires several layers together. A spec covering a module with a differently spelled or pluralised name is misnamed, not merely inconsistent. | manual |
| R5 | When a subject is renamed or moved within `src/`, rename or move its spec in the same change so the mirror holds. A spec left at the old path still passes and will not be found from the new one. | manual |
| R7 | Keep exactly one setup file, `tests/setup.ts`, registered only through the runner's `setupFiles`. A spec never re-applies tree-wide setup. | manual |
| R8 | Colocate a spec's own fixtures — recorded payloads, fixture-building modules, binary artefacts — in the mirrored directory beside the spec. Put helpers shared across specs under `tests/factories/` and import them through the `@tests` alias. | manual |
| R9 | Put ambient type declarations that specs depend on — custom matcher augmentations, polyfill shims — in `tests/types/` as `.d.ts` files, one per augmented surface. The matcher implementation belongs in the setup file; only its declaration goes here. | manual |
| R10 | When one subject needs several spec files, keep the mirrored path and add a qualifier segment before the suffix (`fit.laps.spec.ts`) rather than inventing a parallel directory. | manual |

## 3. Detection

```yaml
R1:
  type: glob
  pattern: "no *.spec.ts, *.spec.tsx or *.integration.test.ts exists under src/"
  include: ["src/**/*.spec.ts", "src/**/*.spec.tsx", "src/**/*.integration.test.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R2:
  type: glob
  pattern: "for each tests/**/*.{spec,integration.test}.{ts,tsx}, a src/<same path>.{ts,tsx} exists"
  include: ["tests/**/*.spec.ts", "tests/**/*.spec.tsx", "tests/**/*.integration.test.ts"]
  exempt: ["tests/setup.ts", "tests/factories/**", "tests/types/**"]
  violationWhen: no-match
  enforcedBy: null
  falsePositives: >
    An integration spec that deliberately covers a flow across several modules has no single
    mirrored subject and fails this check; R10 asks it to mirror its principal subject with a
    qualifier segment, which the script cannot verify.
R3:
  type: glob
  pattern: "each spec's basename, with the .spec/.integration.test suffix stripped, equals its subject's basename"
  include: ["tests/**/*.spec.ts", "tests/**/*.spec.tsx", "tests/**/*.integration.test.ts"]
  exempt: ["tests/setup.ts", "tests/factories/**", "tests/types/**"]
  violationWhen: no-match
  enforcedBy: null
  falsePositives: >
    A qualifier segment added under R10 (`fit.laps.spec.ts`) fails a naive basename comparison.
R5:
  type: manual
  reason: >
    "Moved in the same change" is a property of a commit, not of the tree at rest.
  enforcedBy: null
R7:
  type: grep
  pattern: "import 'fake-indexeddb|@testing-library/jest-dom"
  include: ["tests/**/*.spec.ts", "tests/**/*.spec.tsx", "tests/**/*.integration.test.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R8:
  type: grep
  pattern: "from '\\.\\./"
  include: ["tests/**/*.spec.ts", "tests/**/*.spec.tsx", "tests/**/*.integration.test.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Flags a relative reach out of the spec's own mirrored subtree, which is the violation, but
    cannot tell it from a reach into a colocated fixture one level up.
R9:
  type: glob
  pattern: "no .d.ts sits outside tests/types/"
  include: ["tests/**/*.d.ts"]
  exempt: ["tests/types/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R10:
  type: manual
  reason: >
    Recognising that several specs cover one subject means reading what each covers.
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** finding a module's spec is a path transformation rather than a search, which is as true for an agent as for a person.
- **Good, because** a spec left behind by a rename becomes visible — the mirror breaks — where a topic-grouped tree hides it indefinitely.
- **Bad, because** an integration spec that deliberately crosses several modules has no single mirrored subject, so R10's qualifier is a convention on top of a rule that does not quite fit it.
- **Bad, because** every module move becomes a two-file move, and forgetting the second half leaves a spec that still passes at the wrong address.
- **Neutral, because** the mirror says nothing about coverage; a module with no spec is not visible as a gap here, which is `tests/CLAUDE.md`'s job.

## 5. Reference implementation

```
src/packages/engine/trainingEffect.ts   →  tests/packages/engine/trainingEffect.spec.ts
src/lib/hooks/useChartZoom.ts           →  tests/lib/hooks/useChartZoom.integration.test.ts
src/store/sessions.ts                   →  tests/store/sessions.integration.test.ts
src/parsers/fit.ts                      →  tests/parsers/fit.spec.ts
                                           tests/parsers/fit.laps.spec.ts   ← R10 qualifier
```

A spec reaches its subject and its shared helpers through aliases, never through a relative climb:

```ts
import { computeTrainingEffect } from '@/packages/engine/trainingEffect.ts';
import { createMockSession } from '@tests/factories/sessions.ts';
```

## 6. Forbidden practices

- ❌ A spec beside its source under `src/` — the runner's `include` globs do not reach it, so it never runs.
- ❌ A `tests/engine/` tree for a subject that lives at `src/packages/engine/`; the mirror is only useful while it is exact.
- ❌ Naming a spec after the concept it tests (`sessionsStore`, `storeEngine`) rather than after the module it covers.
- ❌ Grouping specs by kind (`tests/unit/`, `tests/integration/`) rather than by their subject's path; the suffix already carries the kind.
- ❌ Moving a module without moving its spec — the old spec still passes and nobody finds it from the new path.
- ❌ Re-applying tree-wide setup inside a spec; the setup file is registered once and applies to all of them.
- ❌ A relative `../` climb out of a spec's own mirrored subtree to reach source or a shared helper; use `@/` and `@tests`.
