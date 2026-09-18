---
kind: pattern-apply-tdr-reference
id: signature-parameter-shape
title: One destructured options object once a signature takes more than one input
summary: A callable needing one thing takes it bare and positional; a callable needing several takes one destructured object holding all of them, typed inline at the declaration.
governs:
  - "src/**/*.ts"
  - "src/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7, R8]
adopted: 2026-09-17
---

# One destructured options object once a signature takes more than one input

## 1. Context

This file carries R1–R8.

This record governs the **declaration side** of a parameter list only: how a callable states what it takes. The shape is a single decision made at one threshold — a callable that needs one thing takes it bare and positional, a callable that needs several takes one destructured object holding all of them, typed inline at the point of declaration. Without that threshold the same operation acquires two or three unordered identifiers side by side, every later field is a breaking positional insert, and an optional argument in the middle of the list has to be padded with `undefined` at every call that follows it.

Scope: function declarations, object method declarations and custom hook declarations anywhere under `src/`. Deliberately out of scope, and owned by other rules: React component props, which are named `props` and never destructured in the parameter list; what a callable **returns**; and how callers pass arguments, about which this record says nothing.

The boundary with the project's standing no-destructuring rule matters and is stated plainly: that rule covers component props and hook *return values*. This record covers parameter lists. A hook's parameters are in scope here; its result is not.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | A callable that takes two or more inputs declares them as a **single destructured object parameter**. Two or more positional parameters are a carve-out (R5, R6, R8), not the default. | proposed |
| R2 | A callable that takes exactly one input declares it as a bare positional parameter. Do not wrap a lone value in an object for symmetry with a neighbouring signature. | proposed |
| R3 | Type the destructured object with an **inline object type literal** written immediately after the pattern. Introduce a named type only when a second declaration in the same module must share it or derive from it with `Omit`, `Pick` or `Partial`; the name then exists for the sharing, not for tidiness. | proposed |
| R4 | When every field of the object is optional, make the whole parameter optional with the default `= {}` and mark each field optional. Never `= { … }` with seeded values, and never swap the destructuring pattern for a `?`-marked named parameter to express optionality. | proposed |
| R5 | Keep parameters positional when they are the anonymous inputs of a **generic utility** — a subject value plus a ref, a callback, a comparator, a matcher, an event name — none of which carries an identity worth naming at the call site. Express that utility's tuning knobs as a trailing optional `options?` object rather than as further positional parameters. | manual |
| R6 | An infrastructure handle a callable accepts only to thread onward — an `AbortSignal`, an IndexedDB transaction — stays a **trailing optional positional parameter after** the destructured object. It is not a field of the object, because it is not part of what the operation is about. | manual |
| R7 | Where a destructuring pattern cannot be written — the parameter is a union of shapes, or optional with no default — declare it as a named parameter with an inline object type. Do not use that form anywhere a destructuring pattern would work. | proposed |
| R8 | A signature whose parameter list is imposed by a framework or a callback contract — a Recharts tick formatter, a deck.gl accessor, an `Array.prototype.sort` comparator, a `navigator.geolocation` callback — keeps that list verbatim. It is not a carve-out to imitate: a signature is exempt only while an external caller dictates it. | manual |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "^(export )?const [a-z][A-Za-z0-9]* = \\([a-zA-Z_][^)]*,[^)]*\\)\\s*(:|=>)"
  include: ["src/**/*.ts"]
  exempt: ["src/paraglide/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Matches every R5, R6 and R8 carve-out as well, which is most of the multi-parameter callables
    in a codebase that talks to Recharts and deck.gl. The signal produces a review list, not a
    verdict. Restricted to `.ts` so component declarations in `.tsx` are not swept in.
R2:
  type: grep
  pattern: "= \\(\\{ [a-zA-Z0-9]+ \\}: \\{ [a-zA-Z0-9]+: [^;}]+ \\}\\)"
  include: ["src/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A single-field object parameter that is genuinely about to grow a second field is the same
    text as one that should have been bare.
R3:
  type: grep
  pattern: "= \\(\\{[^}]*\\}: [A-Z][A-Za-z0-9]*\\)"
  include: ["src/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A named type shared with a second declaration in the same module is permitted; check whether
    the name is referenced more than once.
R4:
  type: grep
  pattern: "= \\{ [a-zA-Z0-9]+:"
  include: ["src/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Matches any object literal default, including ones that are not parameter defaults.
R5:
  type: manual
  reason: >
    Whether an input "carries an identity worth naming" is the judgement the rule exists to make.
  enforcedBy: null
R6:
  type: manual
  reason: >
    Telling an infrastructure handle from a domain input means knowing what the callable does with
    it — thread it onward, or read it.
  enforcedBy: null
R7:
  type: manual
  reason: >
    Whether a destructuring pattern *could* have been written needs the parameter's type resolved.
  enforcedBy: null
R8:
  type: manual
  reason: >
    Identifying the external caller that dictates a signature means resolving where the callable is
    passed, not reading its declaration.
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** a call site names its arguments, so `computeStress({ tss, duration, ftp })` is readable where `computeStress(tss, duration, ftp)` needs the declaration open beside it.
- **Good, because** adding a field is additive rather than a positional insert, and an optional field never has to be padded with `undefined`.
- **Bad, because** in a project that already forbids destructuring component props and hook results, a destructured parameter list is a third form and a reader has to know which population they are in. This record states the boundary rather than removing it.
- **Bad, because** the carve-outs cover most of the multi-parameter callables at the library boundaries (Recharts, deck.gl, maplibre), so the detection signal is noisy and the rule is mostly enforced by review.
- **Neutral, because** wrapping two positional arguments in an object adds braces at every call site for a gain that only shows at the third argument.

## 5. Reference implementation

Two or more inputs, one destructured object, typed inline:

```ts
export const computeStress = ({
  tss,
  durationS,
  ftp,
}: {
  tss: number;
  durationS: number;
  ftp: number;
}): StressResult => { … };
```

One input, bare and positional:

```ts
export const zoneForHeartRate = (bpm: number): ZoneName => { … };
```

An R6 handle, trailing and positional after the object:

```ts
export const putSession = (
  { id, session }: { id: string; session: TrainingSession },
  signal?: AbortSignal,
): Promise<void> => { … };
```

## 6. Forbidden practices

- ❌ Three positional domain values side by side — the call site says nothing and the fourth one is a breaking insert.
- ❌ Wrapping a single input in an object because the function beside it takes one.
- ❌ Naming the parameter object's type when only one declaration uses it; the name is an extra hop for nothing.
- ❌ `= { pageSize: 20 }` as a parameter default — the seeded values hide in the signature instead of in the body where they can be named.
- ❌ Putting an `AbortSignal` or a transaction handle inside the options object; it is not part of what the operation is about.
- ❌ Copying a framework-imposed positional signature into a callable no framework calls, on the grounds that "we already do that here".
