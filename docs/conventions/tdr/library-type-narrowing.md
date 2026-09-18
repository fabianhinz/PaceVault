---
kind: pattern-apply-tdr-reference
id: library-type-narrowing
title: Component props are derived from the component value and narrowed with a safe omit helper
summary: Another component's prop surface is derived from the component value and narrowed with a key-checked omit helper, so an upstream rename fails the build instead of silently doing nothing.
governs:
  - "src/components/**/*.ts"
  - "src/components/**/*.tsx"
  - "src/features/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7]
adopted: 2026-09-17
---

# Component props are derived from the component value and narrowed with a safe omit helper

## 1. Context

This file carries R1–R7.

The components under `src/components/ui/` wrap Radix primitives, and a wrapper almost always needs to say "this primitive's props, minus the ones I own". Written as a plain `Omit<>`, that sentence is unchecked: `Omit` accepts a key the source does not have, so when a Radix upgrade renames a prop the omission quietly becomes a no-op and the wrapper starts forwarding something it meant to keep. The helper this record introduces constrains the key parameter to keys the source props actually have, which turns that rename into a type error at the wrapper.

Scope is deliberately narrow: the source type must be a **component's** props. Removing keys from anything else — a domain model, an IndexedDB record shape, a parsed FIT payload, a store action's argument — stays a plain `Omit<>`, because the helper cannot express it and nothing safer applies. That non-component case is the large majority of omissions in this codebase and is not a violation; R5 states it so a reviewer does not "fix" it.

Out of scope and owned elsewhere: how a props type is *declared* in the first place, and where it lives.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Derive another component's prop surface from the component *value* (`ComponentProps<typeof X>`), never from a separately imported props alias and never by restating its fields. | manual |
| R2 | To remove keys from a component's props, use `ComponentPropsOmitSafe<typeof X, 'a' \| 'b'>`. A bare `Omit<>` over a component's props is ruled out: it accepts a key the source does not have, so an upstream rename turns the omission into a silent no-op. | proposed |
| R3 | `Pick`, `Partial` and `Required` have no safe counterpart and are used directly. Compose them *over* the derived type — `Pick<ComponentProps<typeof X>, 'k'>` — rather than over a restated alias. | manual |
| R4 | Each entry of a `slotProps` object is typed from the slot's own component with the keys the wrapper owns removed — in practice `children`, plus any prop the wrapper fixes itself. | manual |
| R5 | `Omit<>` is the correct and expected form when the source is not a component's props. Do not route a domain model, a persisted record shape or a parsed payload through the component helper. | manual |
| R6 | A component whose only prop is children is typed `React.FC<PropsWithChildren>`. Do not spell the object out inline. | proposed |
| R7 | A props interface that carries other members declares `children` as an ordinary member typed `ReactNode`. Do not wrap the interface in `PropsWithChildren<>` and do not `extends PropsWithChildren`. | proposed |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "interface [A-Z][A-Za-z0-9]*Props extends [A-Z][A-Za-z0-9]*(Root)?Props"
  include: ["src/components/**/*.tsx", "src/components/**/types.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Extending this project's own props type is fine; only extending a separately imported
    third-party props alias is the case R1 rules out.
R2:
  type: grep
  pattern: "Omit<(React\\.)?ComponentProps<"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["src/types/componentProps.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R3:
  type: grep
  pattern: "(Pick|Partial|Required)<[A-Z][A-Za-z0-9]*Props,"
  include: ["src/components/**/*.tsx", "src/components/**/types.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Composing over this project's own named props type is correct; only composing over a restated
    alias of a third-party type is a violation.
R4:
  type: manual
  reason: >
    Checking that a slotProps entry's type came from the receiving component means resolving the
    type expression, not matching it.
  enforcedBy: null
R5:
  type: grep
  pattern: "ComponentPropsOmitSafe<(?!typeof)"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R6:
  type: grep
  pattern: "React\\.FC<\\{ children"
  include: ["src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R7:
  type: grep
  pattern: "PropsWithChildren<|extends PropsWithChildren"
  include: ["src/**/*.tsx", "src/components/**/types.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A bare `React.FC<PropsWithChildren>` on a children-only component is R6's correct form and does
    not match this pattern.
```

## 4. Trade-offs

- **Good, because** a Radix upgrade that renames a prop fails at the wrapper that meant to omit it, instead of silently forwarding it.
- **Good, because** deriving from the component value means a wrapper never restates fields that then drift from the primitive it wraps.
- **Bad, because** it introduces a project-specific type helper that every contributor has to learn, for a failure mode that bites only on a dependency upgrade.
- **Bad, because** the R2/R5 boundary — component props versus everything else — is invisible in the type expression itself, so a reviewer has to know what the source type is before they can tell which form is right.
- **Neutral, because** derived props types are harder to read on hover than a hand-written interface; the safety is bought with legibility.

## 5. Reference implementation

`src/types/componentProps.ts`:

```ts
import type { ComponentProps, ElementType } from 'react';

export type ComponentPropsOmitSafe<
  C extends ElementType,
  K extends keyof ComponentProps<C>,
> = Omit<ComponentProps<C>, K>;
```

A wrapper narrowing a Radix primitive:

```tsx
interface DialogContentProps
  extends ComponentPropsOmitSafe<typeof DialogPrimitive.Content, 'onOpenAutoFocus'> {
  children: ReactNode;
}
```

R5's case, unchanged and correct:

```ts
addSession: (session: Omit<TrainingSession, 'id' | 'createdAt'>) => string;
```

## 6. Forbidden practices

- ❌ `Omit<ComponentProps<typeof DialogPrimitive.Content>, 'onOpenAutoFoccus'>` — the typo is accepted, the omission does nothing, and nothing says so.
- ❌ Restating a Radix primitive's fields in a hand-written interface so the wrapper "documents" them; the copy drifts on the next upgrade.
- ❌ Importing a third-party props alias and extending it, where deriving from the component value would track the component instead.
- ❌ Routing a domain model or a persisted record shape through the component helper — it is for component props and nothing else.
- ❌ `React.FC<{ children: ReactNode }>` for a children-only component.
- ❌ `interface CardProps extends PropsWithChildren { … }` — declare `children: ReactNode` as an ordinary member instead.
