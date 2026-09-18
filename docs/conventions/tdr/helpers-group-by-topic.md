---
kind: pattern-apply-tdr-reference
id: helpers-group-by-topic
title: Helper modules are named for a topic and hold that topic's functions
summary: A helper module is a unit of subject matter, not of one function — it is named for its topic and holds however many functions, constants and small types that topic needs.
governs:
  - "src/lib/**/*.ts"
  - "src/features/**/*.ts"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7]
adopted: 2026-09-17
---

# Helper modules are named for a topic and hold that topic's functions

## 1. Context

This file carries R1–R7.

This is a boundary record. Sibling records state a one-symbol-per-file discipline for hooks and for components; this record says where that discipline stops. A helper module is a unit of *subject matter*, not a unit of one function: it is named after the topic it covers and holds however many related functions, constants and small types that topic currently needs — one today, six later, without a rename or a new file. Without this boundary a reader who has internalised the hook and component rules over-splits helpers, producing directories of near-identical one-function modules whose relationships are invisible in the listing and whose shared private helpers have nowhere to live except a further module.

Scope: plain `.ts` helper modules — the central `src/lib/` directory and, just as much, feature-local helper modules colocated with the code they serve. Deliberately out of scope: React hooks and components, and engine modules under `src/packages/engine/`, whose module layout is fixed by that package's own rules.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Name a helper module after its topic — the subject its functions operate on or the operation family they form — not after whichever function it happens to hold today. | manual |
| R2 | Put every function belonging to one topic in that topic's module. Do not create a second module for a function that shares the first module's subject, imports, or private constants. | proposed |
| R3 | A helper module exports as many symbols as its topic needs. A module holding one function is correct only when the topic has one function; it is not a target to split toward. | manual |
| R4 | Colocate a topic's supporting constants and small types in the same module as the functions that consume them, rather than in a parallel constants or types module. | manual |
| R5 | Split a helper module when its exports stop sharing a subject — not when it crosses a count. The new module is named for the topic that left, and the split is a naming decision, not a size decision. | manual |
| R6 | Do not name a helper module for a generic bucket (`utils`, `helpers`, `misc`, `common`, `shared`) unless the enclosing directory supplies the topic the filename omits. `src/lib/` supplies no topic. | proposed |
| R7 | Feature-local helper modules follow the same rule as the central ones: a topic-named module beside the feature, holding that topic's functions. | manual |

## 3. Detection

```yaml
R1:
  type: manual
  reason: >
    Whether a filename names its contents' subject is a reading of both, not a pattern.
  enforcedBy: null
R2:
  type: manual
  reason: >
    Detecting two modules that share a subject means comparing their exports, imports and private
    constants pairwise across the directory.
  enforcedBy: null
R3:
  type: manual
  reason: >
    This rule exists to stop a split, so it is satisfied by an absence. Nothing to match on.
  enforcedBy: null
R4:
  type: glob
  pattern: "no constants.ts or types.ts sits beside a helper module whose functions are its only consumer"
  include: ["src/lib/*", "src/features/*/*"]
  exempt: ["src/packages/engine/types.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A `types.ts` shared by several sibling modules is the colocated-types convention, not a
    violation of this one — check how many modules in the directory import it.
R5:
  type: manual
  reason: >
    The trigger is "the exports stopped sharing a subject", which only a reader can judge.
  enforcedBy: null
R6:
  type: glob
  pattern: "src/lib/{utils,helpers,misc,common,shared}.ts and src/features/*/{utils,helpers,misc,common,shared}.ts must not exist"
  include: ["src/lib/*.ts", "src/features/*/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R7:
  type: manual
  reason: >
    Same judgement as R1, applied to feature directories.
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** a directory listing reads as a table of topics rather than a list of function names, so a reader finds the right module without opening several.
- **Good, because** a topic's private constants and small types have an obvious home, instead of being pushed into a further shared module the moment two functions need them.
- **Bad, because** it gives no size ceiling, so a genuinely central topic grows large — `src/lib/laps.ts` is already 428 lines and this rule offers no reason to split it. The module-length record owns that pressure, and the two can disagree.
- **Neutral, because** "is this the same topic?" is a judgement call, so two reviewers can land on different merges; the rule fixes the question, not the answer.

## 5. Reference implementation

`src/lib/timeRange.ts` — one topic, several functions, its own constants, no parallel constants module:

```ts
const DEFAULT_RANGE_DAYS = 90;

export const rangeStart = (now: number, days: number): number => …;
export const rangeLabel = (range: TimeRange): string => …;
export const clampRange = (range: TimeRange, bounds: TimeRange): TimeRange => …;
```

Adding a fourth time-range function goes here; it does not earn `timeRangeClamp.ts`.

## 6. Forbidden practices

- ❌ `src/lib/utils.ts` — `lib` supplies no topic, so the filename names nothing. Whatever is in it has a subject; name the file after that.
- ❌ Splitting a topic into one module per function to match the one-hook-per-file rule — that rule is about hooks, and copying it here scatters one subject across a directory.
- ❌ A `constants.ts` or `types.ts` beside a helper module whose functions are the only consumer — the constants belong in the module that reads them.
- ❌ Creating a second module for a function because the first module "is getting long". Length is not the trigger; a departed subject is.
