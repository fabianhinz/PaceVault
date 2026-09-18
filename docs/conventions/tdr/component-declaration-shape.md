---
kind: pattern-apply-tdr-reference
id: component-declaration-shape
title: Component declaration shape and file naming
summary: Every component is an arrow function assigned to a const, annotated React.FC, with a named props interface directly above it, in a file named after it.
governs:
  - "src/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5, R7]
adopted: 2026-09-17
---

# Component declaration shape and file naming

## 1. Context

This file carries R1–R5 and R7.

Every component is declared the same way: an arrow function assigned to a `const`, explicitly annotated `React.FC`, with its prop shape in a named `interface` sitting directly above it, in a file whose name is the component's name. That uniformity is what makes the tree navigable without a search: a path maps to a component name, a component name maps back to a path, and the prop surface is always the declaration immediately above the render tree. When the shape varies — a `function` declaration here, an inline object literal there, a file whose name says nothing about what it exports — locating a component becomes a grep problem and its props have to be reconstructed from the JSX.

Scope: `.tsx` modules under `src/`. Deliberately out of scope: hook modules, non-component modules colocated with components (stores, tables, style maps), and tests.

Two rules of the original are dropped or Moot here. The entry-component-in-`index.tsx` rule contradicts the index-module record adopted alongside this one, which wins. The route-module rule is Moot because React Router resolves routes from the component tree rather than from file paths, so page components are ordinary named exports.

For `src/components/ui/`, the props type lives in a per-component types module rather than above the component; that record owns that directory and this one's R2 placement clause does not apply there.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Declare a component as an arrow function assigned to a `const` and annotate it `React.FC`. Never a `function` declaration, never a `class`, never an unannotated const relying on inference. | proposed |
| R2 | Type props with a named `interface <ComponentName>Props` declared in the same module, directly above the component, and do not export it. A component that takes no props is annotated bare `React.FC`; one that takes only children is annotated `React.FC<PropsWithChildren>`. Components under `src/components/ui/` declare their props type in a colocated types module instead. | manual |
| R3 | Name the props parameter `props` and read fields through it; do not destructure in the parameter list. | manual |
| R4 | Export exactly one component per file, and name the file after it. Additional components in the module stay module-local (no `export`) and exist only to serve the exported one. A compound component family exported from one module is the single exception. | manual |
| R5 | Name a component file in PascalCase, matching the exported component. The name may drop the prefix the containing directory already supplies, so that path plus filename reads as the full component name without repeating a segment. | manual |
| R7 | Reserve lowerCamelCase `.tsx` filenames for modules that are not components: hook modules whose hook returns JSX, and data or configuration tables whose values are JSX. A lowerCamelCase file must never be the home of an exported component. | manual |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "^export const [A-Z][A-Za-z0-9]* = \\(props"
  include: ["src/**/*.tsx"]
  exempt: ["src/paraglide/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Matches an annotated declaration whose annotation is written after a line break. Misses a
    component declared with no parameter at all — pair with a search for `= () =>`.
R2:
  type: grep
  pattern: "^export interface [A-Z][A-Za-z0-9]*Props"
  include: ["src/features/**/*.tsx", "src/components/charts/*.tsx", "src/components/layout/*.tsx", "src/pages/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A props interface deliberately exported because a sibling narrows it is still a violation here;
    the sibling should derive from the component value instead.
R3:
  type: grep
  pattern: "^export const [A-Z][A-Za-z0-9]*(: React\\.FC[^=]*)? = \\(\\{"
  include: ["src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R4:
  type: glob
  pattern: "each src/**/[A-Z]*.tsx exports exactly one component, whose name equals the basename"
  include: ["src/**/*.tsx"]
  exempt: ["src/components/ui/**"]
  violationWhen: no-match
  enforcedBy: null
  falsePositives: >
    A compound component family (a Radix wrapper set) legitimately exports several; those live
    under `src/components/ui/` and are exempt.
R5:
  type: glob
  pattern: "no src/**/[a-z]*.tsx exports a PascalCase component"
  include: ["src/**/*.tsx"]
  exempt: ["src/**/use*.tsx", "src/paraglide/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R7:
  type: glob
  pattern: "a lowerCamelCase .tsx contains no `export const [A-Z]` declaration"
  include: ["src/**/[a-z]*.tsx"]
  exempt: ["src/**/use*.tsx"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
```

## 4. Trade-offs

- **Good, because** a path maps to a component name and back, so nothing has to be searched for and an agent can predict where a component lives before opening anything.
- **Good, because** the prop surface is always the declaration directly above the render tree, which is the first thing a reader needs and the last thing they should have to reconstruct.
- **Bad, because** `React.FC` adds nothing the explicit props interface does not already give, costs an import in every file, and is a type the React team has moved away from recommending. It buys uniformity, and uniformity is the whole argument.
- **Bad, because** `React.FC` makes the return type `ReactNode`, which quietly permits a component to return `undefined` where an explicit annotation would not.
- **Neutral, because** the one-component-per-file rule needs a compound-family exception, and that exception has to be scoped by directory rather than by a property of the code.

## 5. Reference implementation

```tsx
interface StatItemProps {
  label: string;
  value: ReactNode;
  unit?: string;
}

export const StatItem: React.FC<StatItemProps> = (props) => {
  return (
    <div>
      <Typography variant="overline">{props.label}</Typography>
      <Typography variant="h3">{props.value}</Typography>
    </div>
  );
};
```

A children-only component, and a props-free one:

```tsx
export const PageGrid: React.FC<PropsWithChildren> = (props) => <div>{props.children}</div>;
export const AppFooter: React.FC = () => <footer>…</footer>;
```

## 6. Forbidden practices

- ❌ `function StatItem(props: StatItemProps) { … }` — a second declaration form for the same thing.
- ❌ An unannotated `export const StatItem = (props: StatItemProps) => …`; the contract then depends on inference and changes silently.
- ❌ `React.FC<{ label: string }>` with the shape inline — the props type has no name, so nothing can refer to it.
- ❌ Destructuring in the parameter list (`({ label, value }) =>`); the fields lose their provenance at the first line of the component.
- ❌ Exporting the props interface so a sibling can import it; derive from the component value instead.
- ❌ A second exported component in a file, so the filename no longer identifies what the module is.
- ❌ `sessionCard.tsx` exporting `SessionCard` — a lowerCamelCase filename means the module is not a component.
