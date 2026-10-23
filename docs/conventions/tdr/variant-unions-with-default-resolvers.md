---
kind: pattern-apply-tdr-reference
id: variant-unions-with-default-resolvers
title: Discrete choice props are named unions resolved by one default function
summary: A packages/ui component's variant, size or look prop is a named string-literal union declared beside its props, made optional when it has a default, and read everywhere through one resolve<Name>Variant function whose body is a single ?? with the default member.
governs:
  - "packages/ui/src/components/**/*.tsx"
  - "packages/ui/src/components/**/types.ts"
  - "tools/docs/banner/page/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Discrete choice props are named unions resolved by one default function

## 1. Context

This file carries rules R1, R2, R3, R4, R5, R6 and R7.

A kit component's discrete choices — which visual variant, which size, which look — are closed sets of names, and each needs exactly one answer to "what happens when the caller passes nothing?". The set is a named string-literal union (never a TypeScript enum, which `erasableSyntaxOnly` in `packages/ui/tsconfig.json` rejects anyway), and the default is applied by one `resolve<Name>Variant` function, so the default has one home and the class map keyed by the union (exhaustive-record-maps-over-branching) is always indexed with a member, never with `undefined`.

Where the union lives follows component-declaration-shape and colocated-types-module: beside the props interface in the component module, or in the component directory's `types.ts` once several modules of the directory (or the kit's consumers) read it. The resolver is a module-local function in the component module that reads the prop: a component module exports only its component (the lint rule `react/only-export-components` and component-declaration-shape), and in a Tailwind kit there is no second style layer that would need to import it. If a second module of the same directory ever reads the same prop, the resolver moves to that directory's `types.ts` with the union.

Scope: the props of components under `packages/ui/src/components/`. Continuous or open-ended props (numbers, free strings, callbacks), booleans, and token-typed colour props are out of scope. A prop that changes in response to the user is interactive state, not a presentation choice, and gets no resolver.

The rules bind the banner page components of `tools/docs` (`tools/docs/banner/page/**/*.tsx`) as well: a discrete choice prop there (`Shot`'s `fit`) is a named union declared beside its props, and a required one gets no resolver.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Declare the allowed values of a discrete choice prop as a *named* string-literal union type (`type CardVariant = 'default' \| 'compact'`), beside the props interface or in the directory's `types.ts`. Never a TypeScript enum, never the member list inline in the props interface. | proposed |
| R2 | Make the prop optional (`variant?: CardVariant`) when the component has a sensible default, required when it does not. Do not add a member that stands for "nothing passed" (`'none'`, `undefined` in the union); a member naming a real look (`'default'`, the neutral toast) is a look, not the absent case. | manual |
| R3 | For every optional discrete choice prop, declare a `resolve<Name>Variant` (for a size or look: `resolve<Name>Size`, `resolve<Name>Look`) typed `(value?: Union): Union`, whose body is a single `??` with the default member. Keep it module-local in the component module that reads the prop; move it to the directory's `types.ts` together with the union once a second module of the directory reads the prop. | manual |
| R4 | Read the prop through its resolver at every consumption site. Do not apply the default with a destructuring default (`variant = 'primary'`) or an inline `props.variant ?? '…'`. | manual |
| R5 | Keep the resolver total over its own union: it returns a union member, never a class string, number or token. Map a resolved member to values with a `Record<Union, T>` keyed by the resolver's output. | manual |
| R6 | Use the direct form `type Union = 'a' \| 'b'` by default. Derive the union from a runtime value (`keyof typeof CONFIG_BY_TYPOGRAPHY_VARIANT`, `(typeof NAMES)[number]`) only when that runtime list or map exists anyway. | manual |
| R7 | When a component accepts a subset of another component's union, derive it with `Extract<BaseUnion, 'a' \| 'b'>` and give the derived type its own resolver, rather than restating the members. | proposed |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "^\\s+[a-zA-Z]+\\??:\\s*'[^']+'\\s*\\|"
  include: ["packages/ui/src/components/**/*.tsx", "packages/ui/src/components/**/types.ts", "tools/docs/banner/page/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "Flags an inline literal union in any interface, including a non-props helper type; the enum half is enforced by erasableSyntaxOnly in packages/ui/tsconfig.json."
R2:
  type: manual
  reason: "Whether a member names a real look or the absent case is a reading of what it renders."
  enforcedBy: null
R3:
  type: manual
  reason: "Requires pairing each optional union prop with its resolver."
  enforcedBy: null
R4:
  type: grep
  pattern: "(variant|size|look)\\s*=\\s*'|props\\.(variant|size|look)\\s*\\?\\?\\s*'"
  include: ["packages/ui/src/components/**/*.tsx", "tools/docs/banner/page/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "Also matches a JSX attribute passing a literal (variant='ghost'), which is a call site, not a default; read each hit."
R5:
  type: manual
  reason: "Requires reading the resolver's return type."
  enforcedBy: null
R6:
  type: manual
  reason: "Whether the runtime list exists for another reason is a judgement."
  enforcedBy: null
R7:
  type: grep
  pattern: "Extract<"
  include: ["packages/ui/src/components/**/*.tsx", "packages/ui/src/components/**/types.ts", "tools/docs/banner/page/**/*.tsx"]
  exempt: []
  violationWhen: no-match
  enforcedBy: null
  falsePositives: "Locates conforming code only; a hand-copied subset is textually indistinguishable from an independent union."
```

## 4. Trade-offs

- **Good, because** the default literal appears exactly once per prop, next to the union, so widening the union or changing the default is a one-place edit.
- **Good, because** a `Record<Union, …>` class map keyed by the resolver's output is exhaustive by construction and can never be indexed with `undefined`.
- **Bad, because** it is boilerplate — a one-line function per prop expressing what a destructuring default writes in four characters.
- **Bad, because** the resolver is invisible to a reader of the props interface alone: the effective default sits one indirection away from the `prop?:` line.
- **Neutral, because** the direct and derived union forms coexist by design; the derived form earns its indirection only where the runtime map exists anyway.

## 5. Reference implementation

```tsx
import type { FC } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  variant?: ButtonVariant;
}

const resolveButtonVariant = (variant?: ButtonVariant): ButtonVariant => variant ?? 'primary';

const CLASSES_BY_BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white',
  secondary: 'bg-white/5 text-text-primary',
  ghost: 'bg-transparent text-text-secondary',
  danger: 'bg-status-danger-strong/10 text-status-danger',
};

export const Button: FC<ButtonProps> = (props) => (
  <button className={CLASSES_BY_BUTTON_VARIANT[resolveButtonVariant(props.variant)]} />
);
```

## 6. Forbidden practices

- ❌ A TypeScript `enum` for a choice prop.
- ❌ The union inline in the props interface (`variant?: 'a' | 'b'`) — unnamed, so neither a resolver nor a `Record<Union, T>` map can refer to it.
- ❌ `const { variant = 'primary' } = props` or `props.variant ?? 'primary'` as the default.
- ❌ A destructuring default alongside an existing resolver — two declarations of one default that drift apart.
- ❌ A `resolve<Name>` function that returns a class string, a number or a token; split it into a resolver and a `Record<Union, T>`.
- ❌ A union member that stands for "nothing passed" (`'none'`) added to sidestep the resolver.
- ❌ Restating a subset of another component's union by hand instead of `Extract<…>`.
