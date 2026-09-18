---
kind: pattern-apply-tdr-reference
id: component-module-file-set
title: Each shared component gets a directory with a fixed file set and no index
summary: Every component in the shared catalogue occupies its own camelCase directory holding a PascalCase implementation file and, where earned, a types and a styles module — never an index.
governs:
  - "src/components/ui/**"
adopted_rules: [R1, R2, R3, R4, R6, R7, R8]
adopted: 2026-09-17
---

# Each shared component gets a directory with a fixed file set and no index

## 1. Context

This file carries R1–R4 and R6–R8.

Every component in the shared catalogue occupies its own directory under `src/components/ui/`, and that directory always contains the same concerns in the same files: implementation, and — where the component earns them — its public type surface and its variant class maps. The payoff is that a reader who knows one component knows where to look in all of them, and that a component's supporting modules have an address derived from the component's own name instead of accumulating as suffixed siblings in a flat directory.

The scope is the shared catalogue only: directories directly under `src/components/ui/`. `src/components/charts/`, `src/components/layout/` and every component under `src/features/` keep flat files — they are not a catalogue, their components have one or two call sites each, and the file-set rules buy nothing there. That boundary is deliberate.

One filename from the convention this was adapted from is Moot: it reserved a name for a Storybook story per component, and this project has no Storybook.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Give every catalogue component its own directory directly under `src/components/ui/`, named in camelCase after the component; do not leave one as a loose file at that level. Reserve that level for modules genuinely shared across components. | manual |
| R2 | Name the implementation file after its directory in PascalCase, and keep exactly one such entry-point file per directory. A compound family's secondary components live in the same directory, each in its own PascalCase file named after its exported symbol. | manual |
| R3 | Declare the component's public props, variant unions and size unions in a sibling `types.ts`, and have the implementation import them from `./types.ts`. Omit the module only when the component accepts no props at all. | manual |
| R4 | Give the types module the plain `.ts` extension; use `.tsx` only when the module genuinely builds elements. | manual |
| R6 | Add a `styles.ts` only when the component maps a variant or size union onto a block of classes. A component with no variant union owes no styles module, and an empty one destroys the signal. | manual |
| R7 | A non-component module belonging to one component — a store, a geometry helper, a hook — lives in that component's directory under a descriptive camelCase name. | manual |
| R8 | Do not add an `index.ts` to a component directory or any directory below it. Import implementation and type modules by their own paths. | proposed |

## 3. Detection

```yaml
R1:
  type: glob
  pattern: "no *.tsx sits directly under src/components/ui/"
  include: ["src/components/ui/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A module genuinely shared across component directories belongs at that level; none exists
    today, and one would need a stated reason.
R2:
  type: glob
  pattern: "each src/components/ui/<dir>/ contains a <Dir>.tsx whose name is the directory name with an upper-cased first letter"
  include: ["src/components/ui/*/"]
  exempt: []
  violationWhen: no-match
  enforcedBy: null
  falsePositives: "none known"
R3:
  type: glob
  pattern: "each src/components/ui/<dir>/ containing a component with props also contains types.ts"
  include: ["src/components/ui/*/"]
  exempt: []
  violationWhen: no-match
  enforcedBy: null
  falsePositives: >
    A component that accepts no props owes no types module and fails this check correctly-but-
    noisily; check the implementation's props parameter.
R4:
  type: glob
  pattern: "no src/components/ui/*/types.tsx exists unless it contains JSX"
  include: ["src/components/ui/*/types.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R6:
  type: glob
  pattern: "a src/components/ui/*/styles.ts exists only where the component has a variant or size union"
  include: ["src/components/ui/*/styles.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Requires reading the sibling types module for a union before judging; the presence of the file
    alone is not the violation.
R7:
  type: glob
  pattern: "no non-component module belonging to one component sits directly under src/components/ui/"
  include: ["src/components/ui/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R8:
  type: glob
  pattern: "src/components/ui/**/index.ts and index.tsx must not exist"
  include: ["src/components/ui/**/index.ts", "src/components/ui/**/index.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
```

## 4. Trade-offs

- **Good, because** a component's supporting modules have an address derived from the component's name, so a reader finds its types or its class maps without a search.
- **Good, because** the flat directory stops growing suffixed siblings (`ToastStore.ts`, `BannerVariants.ts`) that are only related to their component by a naming convention nobody enforces.
- **Bad, because** the import path gains a segment and repeats the component name — `@/components/ui/iconBadge/IconBadge.tsx` — which is redundant at every one of roughly 150 call sites. The no-index rule is what makes that unavoidable, and it is the price of never having a barrel.
- **Bad, because** this is a very large mechanical migration for a catalogue where more than half the components have no types module and no styles module to file; those get a directory holding exactly one file.
- **Neutral, because** the boundary at `src/components/ui/` has to be remembered rather than derived — a component in `src/components/charts/` follows different rules for no reason visible in its own directory.

## 5. Reference implementation

```
src/components/ui/
  banner/
    Banner.tsx        ← implementation, one entry point
    types.ts          ← BannerVariant union and BannerProps
    styles.ts         ← the variant → class-block map
  iconBadge/
    IconBadge.tsx     ← no variants, no props type worth a module: one file is the whole directory
  toast/
    Toast.tsx         ← the family's primary
    ToastViewport.tsx ← a secondary component of the same family
    toastStore.ts     ← R7: a non-component module belonging to this component
```

An importer addresses the file, never a directory:

```ts
import { Banner } from '@/components/ui/banner/Banner.tsx';
```

## 6. Forbidden practices

- ❌ A component implementation file left directly under `src/components/ui/`.
- ❌ An `index.ts` in a component directory so importers can name the directory — that is a barrel, and it makes the symbol's declaration site unfindable from its import.
- ❌ A second entry-point component in a directory that is not part of that directory's compound family.
- ❌ An empty or near-empty `styles.ts` created for symmetry; its presence is the signal that variant class maps exist.
- ❌ A component's own store, hook or helper left at the catalogue root as a suffixed sibling.
- ❌ Applying this layout to `src/components/charts/`, `src/components/layout/` or a feature directory; the scope is the shared catalogue.
