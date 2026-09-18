---
kind: pattern-apply-tdr-reference
id: variant-unions-with-default-resolvers
title: Variant unions with default resolvers
summary: A discrete choice prop is a named string-literal union, and an optional one has an exported resolve<Prop> function that applies its default at every consumption site.
governs:
  - "src/components/ui/**/*.ts"
  - "src/components/ui/**/*.tsx"
  - "src/components/charts/*.tsx"
  - "src/components/layout/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7]
adopted: 2026-09-17
---

# Variant unions with default resolvers

## 1. Context

This file carries R1–R7.

A shared component's discrete choices — which visual variant, which size, which orientation — are closed sets of names, and each such choice needs exactly one answer to "what happens when the caller passes nothing?". This record fixes both halves: the set is a named string-literal union in the component's own types module, and the default is applied by an exported `resolve<Prop>` function next to it, so the render path and the class-map lookup resolve the same way and the default has one home.

Without the resolver the default drifts: a destructuring default covers the render path while a class map keyed by the union misses on `undefined`, and the two disagree about what "no variant passed" means.

Scope: the discrete choice props of shared components under `src/components/`. It governs discrete choice props only — a fixed set of names the component itself understands. Continuous or open-ended props (numbers, free strings, callbacks), design tokens, and discriminated unions that switch a component's whole prop *shape* are out of scope, as are one-off mode flags inside a single feature component.

This is a different kind of default from the controlled/uncontrolled record's: that one seeds mutable interactive state a consumer may later take over, so its default is a starting value that changes over the component's life; a resolver here answers a pure, stateless question on every render and returns the same member for the same input forever.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Declare the allowed values of a discrete choice prop as a *named* string-literal union in the component's colocated types module. Never declare a TypeScript enum, and never inline the member list into the props interface. | enforced |
| R2 | Make the prop optional (`prop?: Union`) when the component has a sensible default; make it required when it does not. Do not encode the absent case as an extra union member. | manual |
| R3 | For every optional discrete choice prop, export a `resolve<Prop>` function from the same module as the union, typed `(prop: Union \| undefined) => Union`, whose body is a single `??` with the default literal. | manual |
| R4 | Read the prop through its resolver at every consumption site — the component body and every class-map lookup alike. Do not apply the default with a destructuring default parameter or an inline `?? '…'`. | manual |
| R5 | Keep the resolver total over its own union: it returns a union member, never a class string, a number, or a token. Map a resolved member to values with a `Record<Union, T>` lookup keyed by the resolver's output. | manual |
| R6 | Use the direct form `type Union = 'a' \| 'b'` by default. Use the const-array or const-object form (`const NAMES = [...] as const; type Union = (typeof NAMES)[number]`) only when the member list is also needed as a runtime value, and export the collection then. | manual |
| R7 | When a component accepts a subset of another component's union, derive it with `Extract<BaseUnion, 'a' \| 'b'>` and give the derived type its own resolver, rather than restating the members. | proposed |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "^\\s+[a-zA-Z]+\\??: '[a-zA-Z0-9_-]+' \\|"
  include: ["src/components/**/*.tsx", "src/components/**/types.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: "erasableSyntaxOnly in tsconfig.app.json — a TS enum fails pnpm check"
  falsePositives: >
    The enforced half is only the enum ban; the inline-union half is not enforced by anything and
    the pattern covers only single-line member lists.
R2:
  type: manual
  reason: >
    Whether a component has a sensible default is a design decision, not a property of its source.
  enforcedBy: null
R3:
  type: grep
  pattern: "export const resolve[A-Z][A-Za-z0-9]* = \\([a-zA-Z]+: [A-Za-z]+ \\| undefined\\): [A-Za-z]+ =>"
  include: ["src/components/**/types.ts", "src/components/**/*.tsx"]
  exempt: []
  violationWhen: no-match
  enforcedBy: null
  falsePositives: >
    Only meaningful for a module that declares an optional discrete choice prop; run it scoped to
    those modules rather than across the component tree.
R4:
  type: grep
  pattern: "\\?\\? '[a-zA-Z0-9_-]+'|= \\(\\{ [a-zA-Z]+ = '[a-zA-Z0-9_-]+'"
  include: ["src/components/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A `??` supplying a fallback for something that is not a variant prop — a label, an id — also
    matches.
R5:
  type: grep
  pattern: "export const resolve[A-Z][A-Za-z0-9]* = [\\s\\S]{0,120}=> '[^']*\\s"
  include: ["src/components/**/types.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Approximate: intended to catch a resolver returning a class string rather than a union member,
    but it cannot tell a multi-word class string from a multi-word union member.
R6:
  type: manual
  reason: >
    Whether the member list is needed as a runtime value depends on whether anything iterates it.
  enforcedBy: null
R7:
  type: grep
  pattern: "type [A-Z][A-Za-z0-9]* = '[a-zA-Z0-9_-]+' \\| '"
  include: ["src/components/**/types.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Most named unions are base unions and correctly written this way; only one that restates a
    subset of another union is a violation, which needs both declarations read.
```

## 4. Trade-offs

- **Good, because** the default lives in one exported function, so the render path and a class-map lookup cannot disagree about what "nothing passed" means.
- **Good, because** a named union is importable, so a sibling component can accept a subset of it by derivation rather than by restating members that then drift.
- **Bad, because** it adds a function per optional variant prop, and for a component with one variant and one call site that is more machinery than a destructuring default.
- **Bad, because** R4 forbids the idiomatic React default (`{ variant = 'body1' }`), which every React developer reaches for first — the rule needs the reason stated every time it is applied.
- **Neutral, because** R6 leaves two declaration forms in play, and which one a union uses depends on whether anything iterates it, not on how it reads.

## 5. Reference implementation

`src/components/ui/typography/types.ts` — union and resolver together:

```ts
export type TypographyVariant = 'h1' | 'h2' | 'h3' | 'title' | 'body1' | 'caption' | 'overline';

export const resolveVariant = (variant: TypographyVariant | undefined): TypographyVariant =>
  variant ?? 'body1';
```

The consumption sites both go through the resolver:

```tsx
const variant = resolveVariant(props.variant);
const classes = CLASSES_BY_VARIANT[variant];
```

A required prop, with nothing to resolve:

```ts
export type BannerVariant = 'info' | 'warning' | 'success' | 'error';

export interface BannerProps {
  variant: BannerVariant;
}
```

## 6. Forbidden practices

- ❌ A TypeScript enum for a discrete choice prop — it emits runtime code and `erasableSyntaxOnly` rejects it anyway.
- ❌ `variant?: 'h1' | 'h2' | 'body1'` inlined into the props interface; nothing else can name the set.
- ❌ `const { variant = 'body1' } = props` — the default covers the render path and misses every lookup that reads the raw prop.
- ❌ An inline `?? 'body1'` at each consumption site; the default is then declared as many times as it is used.
- ❌ A resolver returning a class string or a token — it stops being total over its union and becomes a lookup in disguise.
- ❌ Restating a subset of another component's union rather than deriving it with `Extract`; the two drift the first time a member is added.
- ❌ Encoding "not set" as an extra union member (`'default'`) instead of making the prop optional.
