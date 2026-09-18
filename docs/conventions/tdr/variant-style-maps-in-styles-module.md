---
kind: pattern-apply-tdr-reference
id: variant-style-maps-in-styles-module
title: Variant class maps live in a styles module
summary: A union-typed prop that selects a block of classes becomes an exhaustive Record in the component's own styles.ts; one selecting a single value stays an indexed lookup at the point of use.
governs:
  - "src/components/ui/*/styles.ts"
  - "src/components/ui/*/*.tsx"
adopted_rules: [R1, R2, R4, R5, R7, R8, R9]
adopted: 2026-09-17
---

# Variant class maps live in a styles module

## 1. Context

This file carries R1, R2, R4, R5 and R7–R9.

Catalogue components take string-union presentation props, and each union member changes how the component looks. This record governs where that mapping lives and what shape it takes: a union that selects a *block* of classes becomes an exhaustive `Record<Union, T>` in the component directory's own `styles.ts`, and the component indexes it; a union that selects a *single value* stays an indexed lookup at the point of use and creates no `styles.ts` at all.

Without the split, style modules sprout for components that need nothing more than one class lookup, or per-property branching accumulates inside `.tsx` files where each new union member must be added in several places and the compiler cannot tell you that you missed one.

This record is adapted from a CSS-in-JS convention onto Tailwind: the blocks hold class strings rather than CSS objects, and they are typed by a `Record<Union, T>` with a locally declared entry type rather than by a shared style-resolver alias, of which this project has none.

Scope: the component directories of `src/components/ui/`. It does not govern feature-level styling, the token modules, or class helpers for third-party components — those are admitted into the same file by R9 but are not what this record prescribes. It assumes the union props are already declared and defaulted per the variant-resolver record, whose `resolve<Prop>` helpers are consumed here at the lookup site.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | When a union-typed prop selects a *block* of classes — more than one class string, or a structure with more than one key — declare that mapping as an exhaustive `Record<Union, T>` in a `styles.ts` in the component's own directory, with the entry type declared beside it. | manual |
| R2 | When a union-typed prop selects a *single value*, keep it as an indexed lookup at the point of use and do not create a `styles.ts` for it. Absence of a styles module is the correct outcome here, not an omission. | manual |
| R4 | Declare variant class maps only in a `styles.ts`. A `.tsx` may import and index them; it must not declare them. | proposed |
| R5 | Key the record exhaustively by the union. Do not widen the key to `string`, and do not use a partial map with a runtime fallback for the missing members. | proposed |
| R7 | Consume the record in the component by indexing it — with the prop's `resolve<Prop>` helper when the prop is optional, with the prop directly when it is required. Do not rebuild the block conditionally inside the component body. | manual |
| R8 | Name each exported record in camelCase for what it keys and what it styles, suffixed `Styles`: `<prop>Styles` when the component has one styled root, `<slot><Prop>Styles` when several parts are keyed by the same union. | proposed |
| R9 | A `styles.ts` may additionally hold class-derivation helpers and the constants those use. That secondary content does not by itself require a variant map, and needing it is a valid reason for a `styles.ts` to exist. | manual |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "Record<[A-Z][A-Za-z0-9]*(Variant|Size|Color|Mode), \\{"
  include: ["src/components/ui/*/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R2:
  type: manual
  reason: >
    Telling a block from a single value means reading the entry type — one class string, or a
    structure.
  enforcedBy: null
R4:
  type: grep
  pattern: "^const [a-zA-Z]+(Classes|Styles|Variants) = \\{"
  include: ["src/components/ui/*/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A map of single values that R2 keeps at the point of use also matches; read the entry shape.
R5:
  type: grep
  pattern: "Record<string, |Partial<Record<"
  include: ["src/components/ui/*/styles.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R7:
  type: grep
  pattern: "className=\\{cn\\([\\s\\S]{0,120}\\?.*:"
  include: ["src/components/ui/*/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A single-level conditional class that is not a variant lookup — a `disabled` or `active` flag —
    is permitted and matches.
R8:
  type: grep
  pattern: "^export const [a-z][A-Za-z0-9]*Styles = "
  include: ["src/components/ui/*/styles.ts"]
  exempt: []
  violationWhen: no-match
  enforcedBy: null
  falsePositives: "none known"
R9:
  type: manual
  reason: >
    Whether secondary content justifies the module is the judgement the rule grants.
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** adding a union member fails the type check in the map instead of silently rendering an unstyled variant.
- **Good, because** the implementation file keeps the render tree and nothing else, so a reader answering "what does this render" does not scroll past screens of class strings.
- **Bad, because** the class strings move one file away from the markup they style, and in Tailwind the two are usually read together — this is the cost of the split and it is real.
- **Bad, because** the R1/R2 boundary ("block" versus "single value") is a judgement made per prop, so two similar components can legitimately end up with and without a styles module.
- **Neutral, because** `cn()` still merges classes at the call site, so the map is one input among several and the final class list is assembled in the component regardless.

## 5. Reference implementation

`src/components/ui/banner/styles.ts`:

```ts
import type { BannerVariant } from './types.ts';

interface BannerPartClasses {
  container: string;
  icon: string;
}

export const variantStyles: Record<BannerVariant, BannerPartClasses> = {
  info: {
    container: 'backdrop-blur-xl bg-blue-500/10 border-blue-500/20 text-blue-200',
    icon: 'text-blue-400',
  },
  warning: { … },
  success: { … },
  error: { … },
};
```

`Banner.tsx` indexes it and rebuilds nothing:

```tsx
const classes = variantStyles[props.variant];
return <div className={cn('rounded-lg border p-4', classes.container)}>…</div>;
```

## 6. Forbidden practices

- ❌ A variant class map declared in a `.tsx`; the render tree and the style table then share a file and neither is findable.
- ❌ A `styles.ts` created for a component whose union selects one class string — the absence of the module is the signal that there is no block.
- ❌ `Record<string, string>` for a map keyed by a closed union; the widened key gives away the exhaustiveness check.
- ❌ `Partial<Record<Variant, …>>` with a runtime fallback, which silently absorbs the member you forgot.
- ❌ Rebuilding a variant's classes with a conditional in the component body rather than indexing the map.
- ❌ A map named `variantClasses` or `variants`; the `Styles` suffix is what distinguishes it from a union or a constant table.
