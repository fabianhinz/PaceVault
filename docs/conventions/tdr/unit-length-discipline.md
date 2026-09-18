---
kind: pattern-apply-tdr-reference
id: unit-length-discipline
title: Units grow wide, not deep
summary: What is held constant about a function, hook or component is its shape — few statements, shallow control flow — not its line count, which is a misleading statistic here.
governs:
  - "src/**/*.ts"
  - "src/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7]
adopted: 2026-09-17
---

# Units grow wide, not deep

## 1. Context

This file carries R1–R7.

The unit of work in this application — a function, a hook, a component — is written as a short, flat sequence of named steps. What is held constant is not its *length*: units here routinely run well past a screenful, and a line-count budget would flag many perfectly ordinary ones. What is held constant is its *shape*. A unit carries few statements and almost no nesting, and when it is long it is long because one of its statements is wide — a dispatch over a closed union, a markup return, a literal table — never because control flow has been stacked inside it.

This matters because the two properties diverge sharply. Line count is a statistic here and a misleading one; statement count and nesting depth are invariants, and both are cheap to check in a diff. Reviewing against line count produces busywork splits that scatter one behaviour across files; reviewing against shape catches the thing that actually degrades — a unit that has started making decisions inside decisions.

Scope: `src/`, with the shallowness bar set tighter in `.tsx` (see R2). Deliberately out of scope: file length, which the module-length record owns and which this record deliberately does not measure; test files, whose arrange/act/assert bodies have a different shape; and generated code under `src/paraglide/`.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | A unit's body is a short sequence of statements. Past roughly a dozen it is doing more than one thing; extract until the remaining sequence reads as a single named operation. | proposed |
| R2 | Control flow stays shallow. Nesting `if`/loop/`try`/`switch` more than three deep inside one unit is a defect to refactor — with early returns, a guard clause, or an extracted step — not an indentation to accept. Units in `.tsx` stay shallower still: one level is the norm, two the ceiling. | proposed |
| R3 | Width is not a split trigger. A `switch` exhausting a closed union, a markup return, a static literal table, or a long argument list may run far past a screenful and is left alone. Do not split a unit whose statement count and nesting are within R1 and R2 merely because it is long. | manual |
| R4 | When a component's *statements* grow past R1, the extracted piece is a hook in its own module, not a helper parked in the same file. A component body should read as a list of hook calls and handler bindings. | manual |
| R5 | When a component's *markup* grows, the extracted piece is a module-local sub-component in the same module, unexported, serving only that component. It is promoted to a sibling module only once a second module needs it. | manual |
| R6 | When a non-component unit's statements grow past R1, the extracted step goes to a topic-named module. Never to a catch-all beside the caller. | manual |
| R7 | Line count alone is not a review objection. State which of R1, R2 or a mixed concern the unit violates, or accept it. Do not add a `max-lines` or `max-lines-per-function` budget to the linter. | manual |

## 3. Detection

```yaml
R1:
  type: ast
  pattern: "function/arrow/method body with more than 12 direct statements"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["src/paraglide/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Counts a long `const` chain of trivial destructures as twelve statements, which reads fine. The
    threshold is a prompt to look, not a verdict.
R2:
  type: ast
  pattern: "if/for/while/try/switch nested more than 3 deep (more than 2 in .tsx) inside one unit"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["src/paraglide/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A `switch` whose arms contain one `if` each reads flat and counts as two levels; depth alone
    does not distinguish stacked decisions from a dispatch with guards.
R3:
  type: manual
  reason: >
    This rule exists to stop a split. Any signal for it would be a line-count check, which R7
    explicitly forbids.
  enforcedBy: null
R4:
  type: manual
  reason: >
    Whether the extracted piece should be a hook or a sub-component depends on whether statements
    or markup grew, which is a reading of the unit.
  enforcedBy: null
R5:
  type: manual
  reason: >
    Same judgement as R4, from the other side.
  enforcedBy: null
R6:
  type: manual
  reason: >
    Where an extracted step belongs is the topic-grouping record's question, not a pattern.
  enforcedBy: null
R7:
  type: grep
  pattern: "max-lines"
  include: ["vite.config.ts", ".oxlintrc.json"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
```

## 4. Trade-offs

- **Good, because** it catches the property that actually degrades comprehension — decisions inside decisions — and ignores the one that does not.
- **Good, because** it refuses to generate busywork: a 280-line module with three flat functions passes, and a 40-line function with four levels of nesting does not.
- **Bad, because** neither threshold is enforced by anything, and "roughly a dozen" invites argument in review in a way a hard number would not.
- **Bad, because** R4's "extract a hook" answer adds a module and an import for what was five inline statements, and the gain is only visible once the component has several such extractions.
- **Neutral, because** it deliberately says nothing about file length, so it has to be read alongside the module-length record, which can pull the other way.

## 5. Reference implementation

A component body after R4 — hook calls and handler bindings, nothing else:

```tsx
export const SessionHeader = (props: SessionHeaderProps) => {
  const title = useSessionTitle(props.session);
  const exportState = useSessionExport(props.session);
  const editState = useEditInStudio(props.session);

  return ( … );
};
```

A non-component unit after R2 — guard clauses instead of stacked conditions:

```ts
const mapFitLap = (lap: FitLap, index: number): LapAnalysis | undefined => {
  if (!lap.start_time) return undefined;
  if (!lap.total_elapsed_time) return undefined;
  return { … };
};
```

## 6. Forbidden practices

- ❌ Splitting a unit because it is long, when its statement count and nesting are both fine — the behaviour ends up in two files and neither reads as a whole.
- ❌ Accepting a fourth level of nesting because "it's only one more `if`"; that is the defect the rule names.
- ❌ Extracting a component's grown statements into a helper function in the same module — the module keeps the complexity and gains a name for part of it.
- ❌ Promoting a module-local sub-component to a sibling module before a second module needs it.
- ❌ Adding `max-lines` or `max-lines-per-function` to the lint config; it measures the statistic this record says is misleading.
- ❌ "This function is too long" as a review comment with no rule named.
