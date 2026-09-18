---
kind: pattern-apply-tdr-reference
id: module-length-and-single-export
title: Small modules, one component per implementation file
summary: A source module stays inside roughly 200 lines and a .tsx implementation file exports exactly one renderable component, named after the file.
governs:
  - "src/**/*.ts"
  - "src/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5, R6]
adopted: 2026-09-17
---

# Small modules, one component per implementation file

## 1. Context

This file carries R1–R6.

Each part of a feature lives in a file that holds one idea: the render tree, the shared vocabulary, the styling, the behaviour. Keeping those files small is what makes a directory listing a usable table of contents — a reader, or an agent, locates what it needs by filename instead of by scrolling. A file that absorbs sub-components, style maps and effect logic destroys that: the directory tells you nothing, and the single file must be read end to end before anything in it can be changed safely.

This record governs the size of a module and how many components it may export. It deliberately does not govern the *shape* of a unit inside that module — statement count and nesting depth are the unit-shape record's subject, and the two can disagree. Where they do, a module that is long because one statement is wide stays.

Deliberately out of scope: specs, whose length is governed by the cases they cover; generated code under `src/paraglide/`; and static data modules whose bulk is a literal table rather than behaviour.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Keep a source module short enough to hold in one screenful of attention; treat ~200 lines as the ceiling at which a module must be split rather than extended. Crossing it is a design signal, not a formatting problem. | proposed |
| R2 | A `.tsx` implementation file exports exactly one renderable component, and that component is named after the file. A compound component family (`Tabs`, `TabsList`, `TabsTrigger`) is a single exception, handled by the component-directory rules. | proposed |
| R3 | Non-component exports from an implementation file are limited to a pure, render-free helper that the module's spec exercises directly. Everything else that wants exporting belongs in a sibling module. | manual |
| R4 | Put a second renderable component in its own PascalCase file once a second module needs it. While it serves only its parent, keep it module-local and unexported in the same file. | proposed |
| R5 | When style maps and class tables grow to outweigh the render tree, move them out of the implementation file into a colocated styles module and import them by name — the implementation file keeps the render tree. | manual |
| R6 | Extract stateful behaviour into a colocated `use*` module — under the directory's `hooks/` — and pure computation into a sibling module named for what it computes; the implementation file composes them. | manual |

## 3. Detection

```yaml
R1:
  type: glob
  pattern: "no file under src/ exceeds 200 lines"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["src/paraglide/**", "src/lib/factories/**", "src/features/dashboard/generateDevData.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Flags a module whose bulk is a literal table or a wide markup return, which the unit-shape
    record explicitly permits. Read what the lines are before splitting.
R2:
  type: grep
  pattern: "^export const [A-Z][A-Za-z0-9]* = \\("
  include: ["src/**/*.tsx"]
  exempt: ["src/paraglide/**"]
  violationWhen: count-differs
  enforcedBy: null
  falsePositives: >
    Counts a compound component family as several violations; it is one. Also counts an exported
    non-component (a styled constant, a typed table) that happens to be PascalCase.
R3:
  type: grep
  pattern: "^export (const|function) [a-z]"
  include: ["src/**/*.tsx"]
  exempt: ["src/**/use*.tsx", "src/paraglide/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A pure helper exported for its own spec is the permitted case and matches; check whether a
    spec imports it before treating it as a violation.
R4:
  type: manual
  reason: >
    Whether a module-local sub-component now has a second consumer needs a usage search, not a
    pattern over the declaring file.
  enforcedBy: null
R5:
  type: manual
  reason: >
    "Outweighs the render tree" is a proportion a reader judges.
  enforcedBy: null
R6:
  type: manual
  reason: >
    Deciding that a block of statements is stateful behaviour rather than part of the render is a
    reading of the component.
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** a directory listing becomes a table of contents, so a reader opens one file rather than scrolling one.
- **Good, because** a module that must be split is a prompt to name what was hiding inside it, which usually produces a hook or a topic module that was always there.
- **Bad, because** 200 lines is arbitrary and this record admits it: it flags modules that are long for good reasons (a literal table, a wide markup return) and the exemption list has to grow to cover them.
- **Bad, because** it pulls against the unit-shape record, which explicitly refuses to treat length as a trigger. Two rules can flag opposite actions on the same file.
- **Neutral, because** the one-component rule mostly describes what this codebase already does, so R2 is a guard rather than a migration.

## 5. Reference implementation

A component directory after R6 — behaviour extracted, render tree left:

```
src/features/map/
  DeckGLOverlay.tsx        ← render tree only, under 200 lines
  hooks/useMapTracks.ts    ← the stateful behaviour that was inline
  hooks/useMapPopupState.ts
  trackColors.ts           ← pure computation, named for what it computes
```

## 6. Forbidden practices

- ❌ Extending a 300-line module because the next change "only adds twenty lines" — the ceiling is the prompt to split, and every addition past it makes the split harder.
- ❌ Exporting a second renderable component from an implementation file so a sibling can reach it; give it its own file instead.
- ❌ Splitting a module whose bulk is one wide literal table or one long markup return; that is the case the unit-shape record protects.
- ❌ Extracting a component's behaviour into a helper function further down the same file — the file keeps the complexity and gains a heading.
- ❌ Promoting a module-local sub-component to its own file before a second module needs it.
