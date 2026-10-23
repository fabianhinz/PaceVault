---
kind: pattern-apply-tdr-reference
id: component-declaration-shape
title: Component declaration shape and file naming
summary: "Every component is `export const X: FC<XProps> = (props) =>` with a non-exported XProps interface directly above it, alone in a PascalCase module named after it; a directory rendered as a unit has its entry in index.tsx."
governs:
  - "apps/web/src/**/*.tsx"
  - "packages/ui/src/**/*.tsx"
  - "tools/docs/banner/page/**/*.tsx"
  - "tools/workbench/site/src/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Component declaration shape and file naming

## 1. Context

This file carries rules R1–R7.

Every component in `apps/web` is declared the same way: an arrow function assigned to a `const`, annotated `FC` (imported as a type from `react`), with its prop shape in a named `interface` directly above it, alone in a file whose name is the component's name. That uniformity makes the tree navigable without a search: a path maps to a component name, a component name maps back to a path, and the prop surface is always the declaration immediately above the render tree. The root code rules already require arrow functions, named exports and a non-destructured `props`; this convention pins the annotation, the props form, the one-component-per-module rule (strict: extracted markup becomes its own module, never an unexported sibling in the same file) and the file naming.

Scope: component modules under `apps/web/src` (`components/`, `features/`, `pages/`, `App.tsx`, debug triggers) and under `packages/ui/src/components/`. In the kit, wrappers may rest-destructure `props` to strip their own props before forwarding the rest to a primitive (`packages/ui/CLAUDE.md` § Rules); R3 forbids every other destructuring there too. Out of scope: hook modules, non-component modules colocated with components (stores, helpers, tables), tests. How many modules a feature is split into and where shared types live belong to unit-length-discipline, index-modules-are-not-barrels and colocated-types-module.

The rules bind the banner page of `tools/docs` (`tools/docs/banner/page/**/*.tsx`) as well: every page component is `FC<XProps>` with its non-exported interface above it, alone in a PascalCase module named after it (R4, R5); `main.tsx` is the entry module R7 names, and R6 has no subject there.

The rules bind the board island of `tools/workbench` (`tools/workbench/site/src/**/*.tsx`) as well. R6 is not applied there: Astro mounts the island by file (`site/src/pages/index.astro` → `site/src/app/Board.tsx`).

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Declare a component as an arrow function assigned to a `const` and annotate it `FC<XProps>` (`import type { FC } from 'react'`). Never a `function` declaration, never `class`, never an unannotated const relying on inference, never `React.FC`. | proposed |
| R2 | Type props with a named `interface <ComponentName>Props` declared in the same module, directly above the component, and do not export it. A component that takes no props is annotated bare `FC`; one that takes only children is annotated `FC<PropsWithChildren>`. | manual |
| R3 | Name the props parameter `props` and read fields through it; do not destructure in the parameter list. | manual |
| R4 | A module declares exactly one component, and the file is named after it. A second component — exported or not — is moved to its own module, even when only one module renders it. | manual |
| R5 | Name a component file in PascalCase, matching the exported component. The name may drop the prefix the containing directory already supplies, so that path plus filename reads as the full component name without repeating a segment. In `packages/ui` the file always carries the full `Pv`-prefixed component name, also inside its family directory (`pvDialog/PvDialogHeader.tsx`, per component-directory-and-file-naming). | manual |
| R6 | Put a directory's entry component in `index.tsx`, named for the directory in PascalCase, when the directory is mounted from outside through that one component (`features/onboarding/index.tsx` → `Onboarding`). Importers then name the directory's index, not a file inside it. Not in `packages/ui`, which has no index modules: importers address `pv<Name>/Pv<Name>.tsx`. | manual |
| R7 | Reserve lowerCamelCase `.tsx` filenames for modules that are not components: hook modules whose hook returns JSX (`useZoneLineStroke.tsx`), the app entry `main.tsx`, and data tables whose values are JSX. A lowerCamelCase file is never the home of an exported component, and a PascalCase file never holds only a hook. | manual |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "^\\s*(export )?const [A-Z][a-zA-Z0-9]* = \\((props\\b|\\) =>)|React\\.FC|^(export )?function [A-Z]"
  include: ["apps/web/src/**/*.tsx", "packages/ui/src/**/*.tsx", "tools/docs/banner/page/**/*.tsx", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A PascalCase const initialised with a parenthesised arithmetic expression is excluded by the
    `props`/`) =>` alternatives; a component whose parameter is not named `props` slips through
    (and violates R3).
R2:
  type: grep
  pattern: "\\(props: \\{|FC<\\{|^export (interface|type) [A-Za-z0-9]*Props\\b|^(export )?type [A-Za-z0-9]*Props\\b"
  include: ["apps/web/src/**/*.tsx", "packages/ui/src/**/*.tsx", "tools/docs/banner/page/**/*.tsx", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Cannot see a props interface declared far from its component or a props type imported from a
    shared module — both need the file read.
R3:
  type: grep
  pattern: "FC(<[^=]*>)?\\s*=\\s*\\(\\{|^(export )?const [A-Z][a-zA-Z0-9]* = \\(\\{"
  include: ["apps/web/src/**/*.tsx", "packages/ui/src/**/*.tsx", "tools/docs/banner/page/**/*.tsx", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "A wrapped multi-line signature can hide destructuring from a single-line regex."
R4:
  type: ast
  pattern: "more than one top-level PascalCase const in a .tsx module whose initializer is an arrow or function expression"
  include: ["apps/web/src/**/*.tsx", "packages/ui/src/**/*.tsx", "tools/docs/banner/page/**/*.tsx", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A PascalCase const holding a component reference from a lookup table (`const Icon = …`)
    inside a module is not a declaration and is not matched at top level.
R5:
  type: manual
  reason: >
    The exported name may absorb the directory that contains it, so checking a filename against
    an export needs the qualified name reconstructed from the path. A helper:
    for f in $(find apps/web/src -name '[A-Z]*.tsx'); do b=$(basename $f .tsx); rg -q "^export const $b\b" $f || echo $f; done
  enforcedBy: null
R6:
  type: manual
  reason: >
    Whether a directory is mounted from outside through one component is an import-graph fact:
    list the directory's .tsx modules imported from outside it and confirm there is exactly one.
  enforcedBy: null
R7:
  type: glob
  pattern: "apps/web/src/**/[a-z]*.tsx"
  include: ["apps/web/src/**", "packages/ui/src/**", "tools/docs/banner/page/**/*.tsx", "tools/workbench/site/src/**/*.tsx"]
  exempt: ["apps/web/src/**/index.tsx", "apps/web/src/**/use*.tsx", "apps/web/src/main.tsx"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A JSX-valued data table is an accepted lowerCamelCase .tsx; read each hit. The reverse case
    (a PascalCase file exporting only a hook) needs the R5 helper.
```

## 4. Trade-offs

- **Good, because** the path is the index: a component name predicts its file, and a file predicts its export, so navigation costs no search and an agent can construct an import path from a name.
- **Good, because** one fixed declaration line means the prop surface is always in the same place — the `interface` immediately above the component — and can be read without scrolling the render tree.
- **Good, because** keeping the props interface module-local keeps the module's public surface to exactly one name, which is what makes the one-component-per-file rule mean anything.
- **Bad, because** `FC` is widely discouraged in modern React: its return type rejects some legal component returns and generic components cannot be expressed through it at all. The React TypeScript docs and most community style guides recommend annotating the props parameter instead. This project keeps it because uniformity is worth more than the type-level nicety, and because the annotation is the single grep that finds every component in the tree.
- **Bad, because** the non-destructured `props` parameter costs a prefix on every field read and makes default values verbose.
- **Bad, because** strict one-component-per-module turns every small markup piece into a file and an import, so a component and its private sub-pieces are read across several files.
- **Neutral, because** allowing the filename to drop a directory prefix keeps import sites readable at the cost of exact file/export name equality — which is precisely why R5 cannot be automated.

## 5. Reference implementation

A feature entry module, named for its directory:

```tsx
import type { FC } from 'react';
import { OnboardingStep } from '@/features/onboarding/OnboardingStep.tsx';
import type { ThresholdsForm } from '@/features/settings/hooks/useThresholdsForm.ts';

interface OnboardingProps {
  thresholds: ThresholdsForm;
}

export const Onboarding: FC<OnboardingProps> = (props) => (
  <OnboardingStep thresholds={props.thresholds} />
);
```

A children-only component and a no-props component, each alone in its module:

```tsx
import type { FC, PropsWithChildren } from 'react';

export const CardBody: FC<PropsWithChildren> = (props) => (
  <div className="flex flex-col gap-4">{props.children}</div>
);
```

```tsx
import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';

export const SportsRecordsEmpty: FC = () => <p className="text-text-tertiary">{m.ui_records_empty()}</p>;
```

## 6. Forbidden practices

- ❌ `export function Component(props: Props)` or a `class` component — the declaration form is a const-assigned arrow.
- ❌ An unannotated arrow component (`export const X = (props: XProps) =>`) or `React.FC` — annotate `FC<XProps>` from a type import.
- ❌ `(props: { value: string; onChange: () => void })` or `FC<{ … }>` with an inline object literal — the prop shape has no name to reference or jump to.
- ❌ `export interface ComponentProps` on a props type only its own module uses; a props-like shape shared by several modules belongs in a colocated `types.ts`.
- ❌ `type ComponentProps = { … }` for a component's own props.
- ❌ Destructuring in the parameter list — `({ value, onChange }) =>`. Use `props`.
- ❌ A second component in a component module, exported or not — move it to its own PascalCase module.
- ❌ A component exported from a lowerCamelCase `.tsx` file, or a PascalCase `.tsx` file that holds only a hook.
- ❌ A default export.
