---
kind: pattern-apply-tdr-reference
id: spec-describe-and-case-titles
title: Specs declare their unit via a symbol-bound describe and name cases as "should" sentences
summary: One top-level describe per spec, bound to the imported symbol wherever one exists, with every case title written as a `should …` sentence.
governs:
  - "tests/**/*.spec.ts"
  - "tests/**/*.spec.tsx"
  - "tests/**/*.integration.test.ts"
adopted_rules: [R1, R2, R3, R4, R5]
adopted: 2026-09-17
---

# Specs declare their unit via a symbol-bound describe and name cases as "should" sentences

## 1. Context

This file carries R1–R5.

A spec's reporter output is the only place a failing test explains itself, so the describe and case titles are the suite's documentation surface. This record fixes the shape of that surface: one top-level `describe` per spec naming the unit under test, that name taken from the imported symbol itself rather than a string wherever a symbol exists, and case titles written as `should …` sentences so a failure line reads as a broken promise.

Without it, describe titles drift out of sync with the code they name — a renamed or deleted unit leaves a title that still reads plausibly and points at nothing — and case titles mix voices, so scanning a report means re-parsing each line's grammar before its meaning.

Scope: spec files under `tests/`. Shared helpers under `tests/factories/` and the setup file contain no cases and are out of scope, as are the Playwright specs under `e2e/`, which use a different runner and reporter. Where a spec lives is the layout record; how it obtains its runner bindings is the imports record; what goes inside a case is the assertion record.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | A spec file contains exactly one top-level `describe`; every case and every nested group sits inside it, and no case is declared at file scope. | proposed |
| R2 | When the unit under test is a named exported binding the spec already imports, the `describe` argument is that binding's `.name` — `describe(Unit.name, …)` — never a string that repeats the identifier. This holds for nested groups naming a sub-unit as much as for the top-level group. | proposed |
| R3 | When the unit has no single named binding to point at — a module exporting several peer helpers, a schema surface, an integration flow across several modules — the `describe` argument is a descriptive string literal naming that module or surface. This is the correct form for that case, not a tolerated lapse. | manual |
| R4 | Every case title is a `should …` sentence: `it('should …', …)`. Parameterised cases follow the same rule in the title passed after the case table, allowing a leading printf or `$`-property placeholder. | proposed |
| R5 | A nested `describe` exists for exactly one of two reasons: it groups a sub-unit — a separately exported helper from the same source module — or it groups a behaviour cluster named by a short noun phrase (a lifecycle phase, an interaction mode, a category of outcome). Nesting for any other reason, such as splitting one behaviour across data shapes, belongs in a parameterised case instead. | manual |

## 3. Detection

```yaml
R1:
  type: glob
  pattern: "each spec contains exactly one describe( at column 0, and no it( at column 0"
  include: ["tests/**/*.spec.ts", "tests/**/*.spec.tsx", "tests/**/*.integration.test.ts"]
  exempt: []
  violationWhen: count-differs
  enforcedBy: null
  falsePositives: "none known"
R2:
  type: grep
  pattern: "^describe\\('[a-zA-Z][A-Za-z0-9]*'"
  include: ["tests/**/*.spec.ts", "tests/**/*.spec.tsx", "tests/**/*.integration.test.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Matches an R3 descriptive string that happens to be a single word naming a module rather than
    a symbol. Check whether the spec imports a binding of that name before treating it as a
    violation.
R3:
  type: manual
  reason: >
    Deciding that a unit has no single named binding to point at means reading what the spec
    covers, not matching its title.
  enforcedBy: null
R4:
  type: grep
  pattern: "\\bit(\\.each)?\\((?!'should |`should |\\[)"
  include: ["tests/**/*.spec.ts", "tests/**/*.spec.tsx", "tests/**/*.integration.test.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    `it.each([...])` passes its table first and its title second, so the negative lookahead for `[`
    lets it through unchecked; verify those titles by reading.
R5:
  type: manual
  reason: >
    Whether a nested group names a sub-unit or a behaviour cluster — rather than splitting one
    behaviour across data shapes — is a reading of its cases.
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** a renamed or deleted unit breaks the spec that names it, instead of leaving a title that still reads plausibly and points at nothing.
- **Good, because** a uniform `should …` voice makes a failure report scannable: every line is a promise and the failing ones are the broken promises.
- **Bad, because** `Unit.name` is minified-name-sensitive and reads worse than a plain string at the top of the file, for a benefit that only shows on a rename.
- **Bad, because** rewriting every case title is a large mechanical diff that touches every spec and improves no behaviour, which makes it hard to review and easy to defer forever.
- **Neutral, because** R3 leaves both forms in the tree, so a reader cannot tell from a title alone whether the string was a considered choice or a missed R2.

## 5. Reference implementation

```ts
import { describe, it, expect } from 'vitest';
import { computeTrainingEffect } from '@/packages/engine/trainingEffect.ts';

describe(computeTrainingEffect.name, () => {
  it('should return undefined when the session has no heart-rate records', () => { … });

  describe('aerobic effect', () => {
    it('should rise with time spent above threshold', () => { … });
  });
});
```

R3's form, where no single binding names the surface:

```ts
describe('movingTime derivation (via laps)', () => { … });
```

## 6. Forbidden practices

- ❌ `describe('computeTrainingEffect', …)` when the spec imports `computeTrainingEffect` — the string and the symbol drift the first time one is renamed.
- ❌ A case declared at file scope, outside the top-level describe.
- ❌ Two top-level describes in one spec; each subject gets its own file, or the second becomes a nested behaviour cluster.
- ❌ `it('returns an empty array', …)` — the bare present tense reads as a statement of fact rather than a promise that failed.
- ❌ A nested describe per input shape, where a parameterised case would say the same thing once.
- ❌ A describe title that describes the test rather than the unit (`'edge cases'` at the top level).
