---
kind: pattern-apply-tdr-reference
id: boolean-names-without-is-prefix
title: Booleans are named for the state, not with an interrogative prefix
summary: A boolean that holds a value is named for the state it describes; only a function or type guard that computes an answer keeps an is/has prefix.
governs:
  - "src/**/*.ts"
  - "src/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7]
adopted: 2026-09-17
---

# Booleans are named for the state, not with an interrogative prefix

## 1. Context

This file carries R1–R7.

A boolean that holds a value is named for the state it describes — `loading`, `disabled`, `open`, `active`, `dragging`, `expanded` — and not with an interrogative prefix (`isLoading`, `hasError`, `shouldRender`, `canDelete`). A boolean that *computes* an answer — a predicate function or a type guard — is the opposite case and keeps the `is`/`has` prefix, because there the prefix is the verb that makes the call site read as a question. Without the split, the same name shape means two different things and a reader cannot tell a stored flag from a call they must make.

Scope: every boolean *declaration site* in `src/` — component props, interface and type fields, Zod schema fields, hook return-type members, `useState` tuples and local derived constants. Deliberately out of scope: how a boolean is read at a call site.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Name a boolean member — prop, interface or type field, hook return member — for the state it holds, with no `is`/`has`/`should`/`can`/`will`/`did` prefix. | proposed |
| R2 | Name a `z.boolean()` schema field the same way. A schema field is part of a parsed-file contract and its name outlives any local rename. | proposed |
| R3 | Name a `useState` boolean for its state. Where the subject needs naming, put it in front (`dialogOpen`, `deleteConfirmationOpen`), never as a prefix question. | proposed |
| R4 | Name a local derived boolean constant for the state it expresses, not for the question it answers. | proposed |
| R5 | A function or type guard that *returns* a boolean keeps the `is`/`has` prefix: `isThing(x)`, `hasThing(x)`, `(x): x is Thing`. This is the inverse of R1 and is deliberate — the prefix marks the call. | proposed |
| R6 | A member that implements or forwards an external interface keeps that interface's name unchanged. Recharts' `isAnimationActive`, Radix's `defaultChecked` and a FIT file's own field names are not renamed to satisfy R1. | manual |
| R7 | Express polarity positively for a required flag. An optional opt-out flag that defaults to `false` uses a `disable*` / `no*` / `hide*` / `skip*` name. Never negate with a `not*` prefix. | proposed |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "^\\s+(is|has|should|can|will|did)[A-Z][A-Za-z0-9]*\\??:\\s*boolean"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["src/paraglide/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Flags a field that forwards an external library's own prop name, which R6 permits — check
    whether the identifier is spelled by a dependency before renaming. Misses a field whose
    `boolean` type is inferred rather than annotated.
R2:
  type: grep
  pattern: "(is|has|should|can)[A-Z][A-Za-z0-9]*:\\s*z\\.boolean\\(\\)"
  include: ["src/parsers/**/*.ts", "src/lib/weather.ts", "src/packages/gpx/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A schema field mirroring a FIT-file or Open-Meteo field name is R6, not a violation.
R3:
  type: grep
  pattern: "const \\[(is|has|should|can)[A-Z][A-Za-z0-9]*,"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R4:
  type: manual
  reason: >
    A local derived boolean has no annotation to match on, so telling a boolean const from any
    other const needs a reader. Scan for `const is…`/`const has…` bindings that are not functions.
  enforcedBy: null
R5:
  type: manual
  reason: >
    This is the inverse rule — it is satisfied by the absence of unprefixed predicates, which no
    pattern expresses. Read any exported function returning `boolean` and confirm it is prefixed.
  enforcedBy: null
R6:
  type: manual
  reason: >
    Deciding whether an identifier is spelled by an external interface means checking the
    dependency's own types, not this repository's text.
  enforcedBy: null
R7:
  type: grep
  pattern: "\\bnot[A-Z][A-Za-z0-9]*\\??:\\s*boolean"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Matches a field genuinely named after a word beginning "not" (`notation`) — check the whole
    identifier.
```

## 4. Trade-offs

- **Good, because** a reader can tell a stored flag from a predicate call at a glance, with no jump to the declaration.
- **Good, because** the prop surface reads as a description of state rather than as a list of questions, which is what the render actually consumes.
- **Bad, because** it disagrees with the surrounding ecosystem: React Query returns `isLoading`, Radix takes `defaultChecked`, Recharts takes `isAnimationActive`, so R6 carve-outs appear at every integration boundary and a reader has to know which side of the boundary they are on.
- **Neutral, because** an unprefixed boolean sometimes needs its subject spelled out (`dialogOpen` rather than `open`), which makes some names longer than the prefixed form they replace.

## 5. Reference implementation

A state-holding field, an external-interface field and a predicate in one module:

```ts
export interface LapRow {
  running: boolean;
  interval: boolean;
  isAnimationActive: boolean;
}

export const hasDetailedRecords = (session: TrainingSession): boolean =>
  session.detailedRecords;
```

The `useState` form:

```ts
const [deleting, setDeleting] = useState(false);
```

## 6. Forbidden practices

- ❌ `isLoading`, `hasError`, `shouldRender`, `canDelete` as the name of a field that *holds* a boolean — the prefix promises a call that does not exist.
- ❌ Renaming an external library's own prop to satisfy R1 — it breaks the correspondence and hides where the name came from.
- ❌ `notReady`, `isNotValid` and any other negated prefix — the reader has to invert the sentence before they can read the condition.
- ❌ Dropping the prefix from a predicate function or type guard to "be consistent" — R5 is the inverse of R1, not an exception to it.
