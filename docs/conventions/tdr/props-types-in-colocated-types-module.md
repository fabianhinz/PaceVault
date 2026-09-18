---
kind: pattern-apply-tdr-reference
id: props-types-in-colocated-types-module
title: Props types live in the component's colocated types module
summary: A shared-catalogue component declares its public props type and variant unions in a sibling types.ts, and its implementation imports them type-only.
governs:
  - "src/components/ui/**/*.ts"
  - "src/components/ui/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5, R6, R9]
adopted: 2026-09-17
---

# Props types live in the component's colocated types module

## 1. Context

This file carries R1–R6 and R9.

Every component in the shared catalogue is a directory, and its public prop contract is declared in the colocated types module beside the implementation rather than inside it. Consumers of a catalogue component import the props type nearly as often as they import the component — to narrow it, to extend it, to type a wrapper — and a props type buried in the implementation module drags the whole implementation into anything that only wanted the shape. Keeping the contract in a type-only module lets a sibling narrow it, and gives the variant resolvers somewhere to live without a cycle back through the component.

This record governs `src/components/ui/` and nothing else. Feature components, and the components under `src/components/charts/` and `src/components/layout/`, declare their props interface in the component module directly above the component — a different rule for a different population, and the two do not overlap. A reader must not generalise this outward.

Whether a types module exists at all is the file-set record's subject; this one governs what goes in it. Two rules of the convention this was adapted from are Moot: they governed a styling-state key reaching styled parts through a separate channel, and Tailwind classes are resolved in the component here, so no such channel exists.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | A component that accepts props declares its public props type in the colocated `types.ts` of the component's own directory, never in the implementation module. A component that accepts no props declares no props type and is owed no types module. | manual |
| R2 | The public props type is named exactly `<ComponentName>Props`, matching the exported component identifier character for character — including plurality and word order. | manual |
| R3 | The props type is `export`ed from the types module. | proposed |
| R4 | Implementation modules do not export prop types. A prop type for a private, non-exported sub-component may be declared inline in the implementation, but must not be exported. | proposed |
| R5 | To narrow a props type that already has a name — a React DOM props type, or one from another types module — use plain `Omit` or `Pick` on that name. | manual |
| R6 | To derive props from a component *value* rather than a named type, use the project's `ComponentPropsOmitSafe<typeof Component, ExcludedKeys>` helper. Never hand-roll it as `Omit<ComponentProps<typeof C>, …>`, as `Parameters<typeof C>[0]`, or as a bare `ComponentProps<typeof C>` where keys need removing. | proposed |
| R9 | The implementation imports its props type with a type-only import, so the types module stays erasable and never becomes a runtime dependency of the component. | proposed |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "^interface [A-Z][A-Za-z0-9]*Props"
  include: ["src/components/ui/*/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A props type for a private, non-exported sub-component may be declared inline under R4 and
    matches this pattern; check whether the named component is the directory's entry point.
R2:
  type: glob
  pattern: "each src/components/ui/<dir>/types.ts exports a <Dir>Props matching the implementation's exported component name"
  include: ["src/components/ui/*/types.ts"]
  exempt: []
  violationWhen: no-match
  enforcedBy: null
  falsePositives: >
    A compound family's directory exports several components, each with its own props type; the
    check should run per exported component, not per directory.
R3:
  type: grep
  pattern: "^interface [A-Z][A-Za-z0-9]*Props"
  include: ["src/components/ui/*/types.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R4:
  type: grep
  pattern: "^export (interface|type) [A-Z][A-Za-z0-9]*Props"
  include: ["src/components/ui/*/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R5:
  type: manual
  reason: >
    Whether a named type was available to narrow needs both the source and the narrowing read.
  enforcedBy: null
R6:
  type: grep
  pattern: "Omit<(React\\.)?ComponentProps<|Parameters<typeof "
  include: ["src/components/ui/**/*.ts", "src/components/ui/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R9:
  type: grep
  pattern: "^import \\{[^}]*\\} from '\\./types\\.ts'"
  include: ["src/components/ui/*/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A value import of a `resolve<Prop>` function from the types module is legitimate and matches;
    only a *type* imported without the `type` keyword is the violation.
```

## 4. Trade-offs

- **Good, because** a module that needs only a component's shape imports only the shape, with none of the implementation, its Radix dependency or its class strings on the path.
- **Good, because** the types module gives the variant unions and their resolvers a home that the implementation can import without a cycle.
- **Bad, because** it doubles the file count in the catalogue for components whose props type is four lines, and the contract now lives one file away from the render tree that consumes it.
- **Bad, because** it disagrees with the rule governing every other component in the codebase; the same author writing a feature component and a catalogue component follows two conventions on the same day.
- **Neutral, because** R9's type-only import is the thing that actually keeps the module erasable, and it is easy to break by importing a resolver from the same module without noticing.

## 5. Reference implementation

`src/components/ui/banner/types.ts`:

```ts
import type { HTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export type BannerVariant = 'info' | 'warning' | 'success' | 'error';

export interface BannerProps extends HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  children: ReactNode;
  action?: ReactNode;
  variant: BannerVariant;
}
```

`src/components/ui/banner/Banner.tsx`:

```tsx
import type { BannerProps } from './types.ts';

export const Banner: React.FC<BannerProps> = (props) => { … };
```

## 6. Forbidden practices

- ❌ A catalogue component's props interface declared in its implementation module — importing the shape then imports the component.
- ❌ `BannerProps` for a component exported as `Banner` but named `BannerBox` in the file, or any other character-level mismatch.
- ❌ An implementation module exporting a props type "so a sibling can use it"; the sibling imports from the types module.
- ❌ `Omit<ComponentProps<typeof DialogPrimitive.Content>, 'children'>` — use the key-checked helper.
- ❌ `Parameters<typeof Component>[0]` to reach a component's props.
- ❌ A value import from `./types.ts` in the implementation where a type-only import would do; the module stops being erasable.
- ❌ A `types.ts` importing its own implementation module — a cycle back through the component, which is exactly what this record exists to avoid.
