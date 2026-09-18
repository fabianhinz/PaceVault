---
kind: pattern-apply-tdr-reference
id: index-modules-are-not-barrels
title: An index module is a real module, never a re-export barrel
summary: Nothing in the tree exists purely to forward names from elsewhere — every module declares its own contents and importers address the module that declares the symbol.
governs:
  - "src/**/*.ts"
  - "src/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5, R8]
adopted: 2026-09-17
---

# An index module is a real module, never a re-export barrel

## 1. Context

This file carries R1–R5 and R8.

An `index` module is the thing a directory *is*, not a directory's table of contents. Nothing in the tree exists purely to forward names from elsewhere, so there is no aggregation layer to keep in sync, no import that accidentally pulls in a whole subtree, and no ambiguity about where a symbol is defined — the path you import from is the file that declares it.

This works because `tsconfig.app.json` maps `@/*` to `./src/*`, so every module is already addressable by a short absolute path. A barrel would buy nothing the alias does not already give, while costing a level of indirection.

Scope: everything under `src/`. Two rules from the original are Moot here and are not carried: this project has no job runner, and React Router resolves routes from a component tree rather than from file paths, so there are no framework-owned route modules.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | An `index.ts` / `index.tsx` declares its own contents. Every index module contains at least one declaration of its own — a component, a factory, or a constant table. | proposed |
| R2 | Never write `export *`. A module's exports are always written out by name at the point they are declared. | proposed |
| R3 | Never create a module whose entire body is re-export statements, and never add a re-export block to a module that has real contents. If a symbol is wanted elsewhere, importers address the module that declares it. | proposed |
| R4 | Import a module by its own path under the `@/` alias, down to the file that declares the symbol. Reaching a nested module through an ancestor directory's index is forbidden even where an index happens to exist. | proposed |
| R5 | Give a directory an `index.tsx` only when the directory is rendered as a unit — its index then declares the single entry component, named for the directory, that parents mount. A directory that is a collection of peers (hooks, stores, pure utilities, type modules) gets no index at all. | proposed |
| R8 | Use the `@/` alias for every cross-directory import; relative paths are permitted only within the same folder. | proposed |

## 3. Detection

```yaml
R1:
  type: glob
  pattern: "every src/**/index.{ts,tsx} contains at least one `export const`, `export function`, `export interface` or `export type X =` declaration of its own"
  include: ["src/**/index.ts", "src/**/index.tsx"]
  exempt: []
  violationWhen: no-match
  enforcedBy: null
  falsePositives: >
    A module mixing its own declarations with a re-export block passes this check and still
    violates R3 — run both.
R2:
  type: grep
  pattern: "^export \\*"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["src/paraglide/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R3:
  type: grep
  pattern: "^export (type )?\\{[^}]*\\} from "
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["src/paraglide/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A single-line `export type { X } from './x.ts'` inside a module that declares X's siblings is
    still a re-export and still a violation; there is no benign case in this tree.
R4:
  type: manual
  reason: >
    Detecting that an import reached a symbol through an ancestor index rather than its declaring
    module needs both ends resolved, which a line pattern cannot do.
  enforcedBy: null
R5:
  type: glob
  pattern: "no index.ts exists under src/; an index.tsx exists only in a directory the app renders as a unit"
  include: ["src/**/index.ts", "src/**/index.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Whether a directory is "rendered as a unit" is a reading of its parent's JSX, not of the
    directory itself.
R8:
  type: grep
  pattern: "from '\\.\\./"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["src/paraglide/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
```

## 4. Trade-offs

- **Good, because** the import path is the declaration site, so find-usages and go-to-definition are exact and no symbol has two addresses.
- **Good, because** nothing accidentally pulls a whole subtree into the bundle or into a test's module graph.
- **Bad, because** import lists get longer: five symbols from five modules is five lines where a barrel would have been one.
- **Bad, because** moving a module rewrites every importer, which a barrel would have absorbed — the cost the barrel was buying is real, it is just paid elsewhere.
- **Neutral, because** the alias makes the longer paths short enough to read, so the cost lands on line count rather than on comprehension.

## 5. Reference implementation

A type module that declares rather than forwards:

```ts
import type { Gender } from '@/packages/engine/types.ts';

export interface UserProfile {
  id: string;
  gender: Gender;
}
```

A consumer that needs `Gender` imports it from `@/packages/engine/types.ts`, not from this module.

## 6. Forbidden practices

- ❌ `export * from './x.ts'` at any level — it makes the module's surface invisible at its own declaration site.
- ❌ A module whose entire body is re-export statements.
- ❌ Adding a re-export block to a module that does declare things, so importers can reach a neighbour "conveniently" — the convenience is the indirection the rule exists to remove.
- ❌ `import { Thing } from '@/types'` where `Thing` is declared in `@/packages/engine/types.ts` — address the declaring module.
- ❌ Giving a directory of peers (`hooks/`, `store/`, `types/`) an `index.ts` so it can be imported as a unit.
