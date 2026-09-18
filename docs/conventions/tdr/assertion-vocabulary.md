---
kind: pattern-apply-tdr-reference
id: assertion-vocabulary
title: Specs assert through a small, exact matcher vocabulary
summary: Interactions are asserted with their arguments, values with the matcher that names the claim, and nothing is asserted by recording whatever the code happened to produce.
governs:
  - "tests/**/*.spec.ts"
  - "tests/**/*.spec.tsx"
  - "tests/**/*.integration.test.ts"
  - "tests/setup.ts"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7, R8, R9]
adopted: 2026-09-17
---

# Specs assert through a small, exact matcher vocabulary

## 1. Context

This file carries R1–R9.

Every spec ends in an assertion, and the matcher chosen for it decides how much the spec actually proves. The vocabulary here is deliberately narrow: interaction is asserted with its arguments, value equality with a matcher chosen by the shape of the value, DOM facts with the matchers that name the fact, and nothing is asserted by recording whatever the code happened to produce. Without that discipline a suite fills up with assertions that are green by construction — a spy that was called with the wrong payload, a predicate reduced to "truthy", a snapshot that was re-recorded rather than read — and the suite stops being evidence.

That matters more here than in most projects, because `tests/CLAUDE.md` puts the whole weight of correctness on the engine, lib and store suites: components are checked visually and have no render tests. A vacuous assertion in `tests/packages/engine/` is not a weak test, it is an absent one.

Scope: the Vitest suite under `tests/`, including the setup file. Deliberately out of scope: the Playwright suites under `e2e/`, which use Playwright's own auto-retrying `expect` with a different matcher set and different timing semantics; nothing here transfers to them.

Nothing in the toolchain fails when a test asserts nothing at all — the rules below are the only thing standing between a test and a vacuous pass.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Assert an interaction with its arguments: `expect(spy).toHaveBeenCalledWith(...)`. Bare `toHaveBeenCalled()` is reserved for a call whose arguments the spec does not determine — a zero-argument callback, a refetch, a close. If the spec set up an input, the assertion names it. | manual |
| R2 | Assert that something did *not* happen with `expect(spy).not.toHaveBeenCalled()`. Do not express absence as a count. | manual |
| R3 | Use `toBe` for primitives, identity, and `null`/`undefined`, and `toEqual` for objects and arrays. `toBe` is never applied to a structure literal — reference equality on a freshly built value is a guaranteed failure or an accidental pass on a shared reference. | manual |
| R4 | Assert a boolean exactly: `toBe(true)` / `toBe(false)`. `toBeTruthy` / `toBeFalsy` pass on any truthy value and hide the difference between `true`, a non-empty string and an object. | proposed |
| R5 | Never assert a computed predicate, and never assert existence where the value is the claim. Assert the underlying value with the matcher that names it — `toContain` over a membership check, `toHaveLength` over a length comparison, `toThrow` / `rejects` over a caught-error flag. A predicate collapses the diff to `false`, so the failure message says nothing. | manual |
| R6 | Assert DOM presence with `toBeInTheDocument()` and its negation. Use `toBeVisible()` only where visibility rather than presence is the claim. Assert element state with the matcher that names it (`toBeDisabled`, `toHaveValue`, `toHaveAttribute`, `toBeChecked`) rather than reading a property off the node and comparing it. | manual |
| R7 | Do not write file-based snapshots. `toMatchInlineSnapshot` is permitted only where the assertion *is* the full literal text and that text is short enough to read in the diff — a thrown error's message, a small generated document, an empty render. It is not a substitute for naming what matters about a generated artefact. | proposed |
| R8 | Extend the matcher vocabulary with `expect.extend` in `tests/setup.ts`, declared in `tests/types/`, rather than writing an assertion helper that wraps `expect`. A registered matcher composes with `.not`, produces a real failure message, and is reachable from every spec. | manual |
| R9 | Import `expect` explicitly from `vitest` in every spec, even though `globals` is enabled. | proposed |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "toHaveBeenCalled\\(\\)"
  include: ["tests/**/*.spec.ts", "tests/**/*.spec.tsx", "tests/**/*.integration.test.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    `not.toHaveBeenCalled()` is R2's correct form and matches this pattern; and a genuinely
    argument-free call is permitted. Read the line before treating a match as a violation.
R2:
  type: grep
  pattern: "toHaveBeenCalledTimes\\(0\\)"
  include: ["tests/**/*.spec.ts", "tests/**/*.spec.tsx", "tests/**/*.integration.test.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R3:
  type: grep
  pattern: "toBe\\(\\{|toBe\\(\\[|toEqual\\((true|false|null|undefined|-?[0-9]+)\\)"
  include: ["tests/**/*.spec.ts", "tests/**/*.spec.tsx", "tests/**/*.integration.test.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    `toEqual(null)` is harmless though `toBe(null)` is preferred; misses `toBe(someObjectVariable)`,
    which needs the variable's type resolved.
R4:
  type: grep
  pattern: "toBeTruthy\\(\\)|toBeFalsy\\(\\)"
  include: ["tests/**/*.spec.ts", "tests/**/*.spec.tsx", "tests/**/*.integration.test.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R5:
  type: grep
  pattern: "expect\\([a-zA-Z_.]+\\.(includes|some|every|startsWith|endsWith)\\(|expect\\([a-zA-Z_.]+\\.length\\)"
  include: ["tests/**/*.spec.ts", "tests/**/*.spec.tsx", "tests/**/*.integration.test.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    `expect(x.length).toBe(3)` is only slightly worse than `toHaveLength(3)`; the serious case is
    `expect(x.some(...)).toBe(true)`, which this pattern cannot distinguish.
R6:
  type: grep
  pattern: "expect\\([a-zA-Z_.]+\\.(textContent|disabled|value|checked)\\)"
  include: ["tests/**/*.spec.tsx", "tests/**/*.integration.test.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R7:
  type: grep
  pattern: "toMatchSnapshot\\(\\)"
  include: ["tests/**/*.spec.ts", "tests/**/*.spec.tsx", "tests/**/*.integration.test.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R8:
  type: grep
  pattern: "const expect[A-Z][A-Za-z0-9]* = |function expect[A-Z]"
  include: ["tests/**/*.ts", "tests/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R9:
  type: grep
  pattern: "\\bexpect\\b"
  include: ["tests/**/*.spec.ts", "tests/**/*.spec.tsx", "tests/**/*.integration.test.ts"]
  exempt: []
  violationWhen: no-match
  enforcedBy: null
  falsePositives: >
    Checks that `expect` appears at all, not that it was imported; pair with the imports record's
    R1 signal.
```

## 4. Trade-offs

- **Good, because** a failing assertion names the claim that broke, so the reporter line is the diagnosis rather than the start of one.
- **Good, because** it closes the specific ways a test can be green without proving anything — a truthy check, a re-recorded snapshot, a spy asserted without its payload.
- **Bad, because** several rules are judgement calls a pattern cannot confirm, so the vocabulary holds by review and erodes quietly when review is light.
- **Bad, because** replacing a snapshot with named assertions is more code and a real risk of asserting less than the snapshot did; the trade is legibility for coverage and it has to be made deliberately.
- **Neutral, because** the exactness costs verbosity: `toHaveBeenCalledWith` with a full payload is longer than `toHaveBeenCalled`, and most of the time the extra characters restate what the setup already said.

## 5. Reference implementation

```ts
expect(setActiveLapData).toHaveBeenCalledWith(analysis, enrichments, null);
expect(getRecords).not.toHaveBeenCalled();

expect(zoneFor(155)).toBe('threshold');
expect(buckets).toEqual([{ zone: 'tempo', seconds: 120 }]);
expect(session.detailedRecords).toBe(true);
expect(laps).toHaveLength(4);
expect(() => parseFit(corrupt)).toThrow('Failed to parse FIT file');
```

The replacement for a snapshot — claims rather than a recording:

```ts
expect(gpx).toContain('<gpx creator="PaceVault"');
expect(gpx.match(/<trkpt/g)).toHaveLength(points.length);
```

## 6. Forbidden practices

- ❌ `expect(value).toBeTruthy()` — it passes on `'x'`, on `1` and on `{}`, so it proves the value is not empty and nothing else.
- ❌ `expect(spy).toHaveBeenCalled()` when the spec set up the input; the payload is the part that can be wrong.
- ❌ `expect(spy).toHaveBeenCalledTimes(0)` to express absence.
- ❌ `expect(result).toBe({ a: 1 })` — reference equality against a fresh literal never passes.
- ❌ `expect(list.some((x) => x.id === 'a')).toBe(true)` — the failure message is `false` and says nothing about the list.
- ❌ `toMatchSnapshot()` on generated output; re-recording it is a keystroke and reading it is not.
- ❌ A `expectValidSession(x)` helper wrapping `expect` — it cannot be negated and its failure message names the helper, not the claim.
