---
kind: pattern-apply-tdr-reference
id: helpers-as-namespace-objects
title: Helpers exposed as one namespace object
summary: A helper module whose member names would be ambiguous as bare imports exports one namespace object and keeps its functions module-local; a module whose names already carry their topic exports them loosely.
governs:
  - "src/lib/**/*.ts"
  - "src/features/**/*.ts"
adopted_rules: [R1, R2, R3, R4, R5, R6]
adopted: 2026-09-17
---

# Helpers exposed as one namespace object

## 1. Context

This file carries R1–R6.

A topic module that groups several helpers has two ways to publish them: loose named exports, or one exported object that gathers module-local functions under a single name. This record governs the choice between them — the module keeps every function private and exports one plain object, so call sites read `topic.member(...)` and carry the topic at the point of use, *when* the bare names would not carry it themselves.

It applies to helper, formatting, parsing and transform modules under `src/lib/` and inside features. It does not govern constant tables, config literals, or union-keyed lookup maps, which take the same syntactic shape but are a different thing. It is the counterpart of the topic-grouping record: that one decides what belongs in a module, this one decides how the module is published.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | When a module's helpers have short or generic member names — `reset`, `update`, `parse`, `validate`, `set` — that would be ambiguous or collide as bare imports, export them as one namespace object and keep the functions module-local. | manual |
| R2 | When each helper's own name already carries its topic and reads unambiguously at an unqualified call site (`formatPace`, `weekKey`, `haversineM`), export the functions loosely and do not wrap them. This is the correct outcome, not an unfinished conversion. | manual |
| R3 | Name the namespace object after the module file's basename. Where the basename is generic, qualify the name with the module's directory topic instead. | proposed |
| R4 | Let the namespace object be the module's only exported value. Types may be exported alongside it; the same function must not be exported both loosely and as a member. | proposed |
| R5 | Build the object from shorthand references to already-declared module-local bindings. Do not inline function literals into the object. | proposed |
| R6 | Write the namespace object as a plain object literal — no `as const`, no `satisfies`, no `Object.freeze`. Those annotations mark a constant table or a keyed map, not a namespace. | proposed |

## 3. Detection

```yaml
R1:
  type: manual
  reason: >
    "Would this name be ambiguous at an unqualified call site" is a reading of the name against
    the rest of the codebase, not a pattern over the module.
  enforcedBy: null
R2:
  type: manual
  reason: >
    The inverse of R1 and equally a judgement. Loose exports are not evidence of a violation.
  enforcedBy: null
R3:
  type: grep
  pattern: "^export const ([a-z][A-Za-z0-9]*) = \\{$"
  include: ["src/lib/**/*.ts", "src/features/**/*.ts"]
  exempt: []
  violationWhen: count-differs
  enforcedBy: null
  falsePositives: >
    Matches any exported object literal, including constant tables and lookup maps that this
    record does not govern. Compare the captured name against the file's basename by hand.
R4:
  type: grep
  pattern: "^export (const|function) "
  include: ["src/lib/**/*.ts", "src/features/**/*.ts"]
  exempt: []
  violationWhen: count-differs
  enforcedBy: null
  falsePositives: >
    A module that correctly uses loose exports under R2 has many matches and is not a violation.
    Only apply this count to a module already known to export a namespace object.
R5:
  type: grep
  pattern: "^\\s+[a-zA-Z0-9]+: \\(.*\\) =>"
  include: ["src/lib/**/*.ts", "src/features/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Matches any object literal holding a function, including Zustand action bags and React prop
    objects, which this record does not govern.
R6:
  type: grep
  pattern: "^export const [a-z][A-Za-z0-9]* = \\{[\\s\\S]*?\\} (as const|satisfies)"
  include: ["src/lib/**/*.ts", "src/features/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A constant table legitimately carries `as const` and is not governed here; check whether the
    members are functions before treating a match as a violation.
```

## 4. Trade-offs

- **Good, because** a generic member name regains its subject at the call site — `defaults.reset()` says what it resets, where a bare `reset()` does not.
- **Good, because** the module has exactly one exported value, so its public surface is a single line to read and a single symbol to rename.
- **Bad, because** the namespace object defeats tree-shaking for that module: importing one member keeps every member reachable, which matters in a bundle shipped to a browser.
- **Bad, because** go-to-definition lands on the object literal rather than the function, adding a hop.
- **Neutral, because** the R1/R2 split means two shapes coexist in `src/lib/`, and which one a module uses is a judgement a reader has to accept rather than derive.

## 5. Reference implementation

R1's form, for a module whose member names are generic:

```ts
const reset = (): void => { … };
const apply = (profile: UserProfile): void => { … };

export const defaults = { reset, apply };
```

R2's form, for a module whose names already carry their topic — unchanged and correct:

```ts
export const formatPace = (secPerKm: number): string => { … };
export const formatDistance = (meters: number): string => { … };
```

## 6. Forbidden practices

- ❌ Wrapping a module whose names already carry their topic — `formatters.formatPace(...)` repeats the subject twice and buys nothing.
- ❌ Exporting a function both loosely and as a member of the namespace object; two import forms then reach the same function and neither is canonical.
- ❌ Inlining function literals into the object — the members lose their own names in stack traces and the object becomes the only place to read them.
- ❌ `as const`, `satisfies` or `Object.freeze` on a namespace object; those mark a data table, and a reader uses them to tell the two apart.
