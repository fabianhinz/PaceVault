---
kind: pattern-apply-tdr-reference
id: index-modules-are-not-barrels
title: An index module is a real module, never a re-export barrel
summary: Import every symbol from the file that declares it under the @/ alias; no export *, no re-export modules, and an index.tsx only for a directory rendered as a unit.
governs:
  - "apps/web/src/**/*.ts"
  - "apps/web/src/**/*.tsx"
  - "apps/web/tests/**/*.ts"
  - "apps/web/tests/**/*.tsx"
  - "packages/ui/src/**/*.ts"
  - "packages/ui/src/**/*.tsx"
  - "packages/ui/tests/**/*.ts"
  - "packages/ui/tests/**/*.tsx"
  - "packages/engine/src/**/*.ts"
  - "packages/engine/tests/**/*.ts"
  - "tools/workbench/scripts/**/*.ts"
  - "tools/workbench/site/src/**/*.ts"
  - "tools/workbench/site/src/**/*.tsx"
  - "tools/workbench/tests/**/*.ts"
adopted_rules: [R1, R2, R3, R4, R5, R8]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# An index module is a real module, never a re-export barrel

## 1. Context

This file carries rules R1, R2, R3, R4, R5 and R8.

In `apps/web` an `index.tsx` is the thing a directory *is*, not a directory's table of contents: it declares the entry component that a page or a parent feature renders. Nothing in the tree exists purely to forward names from elsewhere, so there is no aggregation layer to keep in sync, no import that accidentally pulls in a whole subtree, and no ambiguity about where a symbol is defined — the path you import from is the file that declares it.

This works because `apps/web/tsconfig.app.json` maps `@/*` to `./src/*`, so every module in the app is already addressable by a short absolute path; a barrel would buy nothing the alias does not already give. Scope: everything under `apps/web/src` and `apps/web/tests`, and — for R1, R2, R3 and R5 — `packages/ui/src` and `packages/ui/tests`. R4 and R8 (the `@/` alias) do not apply to `packages/ui`: the kit ships raw source that consumers compile with their own `@/` alias, so it imports itself by relative path (`packages/ui/CLAUDE.md` § Rules), and a kit module importing a moved neighbour uses `../pv<Name>/Pv<Name>.tsx`. R1, R2, R3 and R5 also bind `packages/engine` (`packages/engine/src`, specs in `packages/engine/tests`), which imports itself by relative path like the kit and publishes every module through its `"./*": "./src/*"` export, so it has no entry module at all. Otherwise out of scope: the remaining workspace packages, which publish by `exports` subpaths and have their own rules, and the `@pacevault/web` `exports` entries in `apps/web/package.json`, which are the tools' deliberate access path.

The rules bind `tools/workbench` as well (`scripts/`, `site/src/`, `tests/`). Its two source roots are addressed by the aliases `@scripts/*` (`tools/workbench/scripts/*`) and `@site/*` (`tools/workbench/site/src/*`), declared in `tools/workbench/tsconfig.json`, `tools/workbench/site/tsconfig.json`, `tools/workbench/vitest.config.ts` and, for the dependency graph, `tools/workbench/.dependency-cruiser.cjs`; they are its counterpart of `@/` under R4 and R8. Two kinds of module keep relative specifiers: the scripts and hooks under `scripts/`, which Node runs directly and which import only same-folder modules, and the modules that load while Astro reads its config (`site/astro.config.mjs`, `site/src/lib/devPlugin.ts`), before the aliases exist. `site/src/actions/index.ts` is the actions entry Astro requires by that name; it declares the actions itself, so R1 holds.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | An `index.ts` / `index.tsx` declares its own contents: at least one declaration of its own — in this app, the entry component of the directory. | proposed |
| R2 | Never write `export *`. A module's exports are written out by name at the point they are declared. | proposed |
| R3 | Never create a module whose body is re-export statements, and do not forward another module's names (`export type { X } from '…'`) from a module that also declares things. Importers address the module that declares the symbol. | proposed |
| R4 | Import a module by its own path under the `@/` alias, down to the file that declares the symbol (`@/types.ts`, `@/components/mapBackground/trackPicking.ts`). Reaching a nested module through an ancestor directory's index is forbidden even where an index exists. | proposed |
| R5 | Give a directory an `index.tsx` only when the directory is rendered as a unit — its index then declares the single entry component, named for the directory, that parents mount. A directory that is a collection of peers (hooks, types, queries, mutations, routing helpers, helper topic modules) gets no index at all. | proposed |
| R8 | Use the `@/` alias for every cross-directory import; a relative path is allowed only for a module in the same folder (`./x.ts`), never `../`. | proposed |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "index module whose body, after stripping imports and blank lines, contains no declaration keyword (const|interface|type|enum) and no top-level call expression"
  include: ["apps/web/src/**/index.ts", "apps/web/src/**/index.tsx", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx", "tools/workbench/tests/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    None known in this app; there is no file-path routing, so no one-line routing adapter is a
    legitimate exception.
R2:
  type: grep
  pattern: "^\\s*export\\s+(type\\s+)?\\*"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "apps/web/tests/**/*.ts", "apps/web/tests/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "packages/ui/tests/**/*.ts", "packages/ui/tests/**/*.tsx", "packages/engine/src/**/*.ts", "packages/engine/tests/**/*.ts", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx", "tools/workbench/tests/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "A fixture string embedding the literal text of a re-export. None known."
R3:
  type: grep
  pattern: "^export (type )?\\{[^}]*\\} from '|^\\} from '[^']*';$ preceded by an `export (type )?{` opener"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "packages/engine/src/**/*.ts", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx", "tools/workbench/tests/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A multi-line `import { … } from` also ends in `} from '…';` — confirm the block opens with
    `export`, not `import`, before reporting.
R4:
  type: manual
  reason: >
    Whether an import specifier is the declaring module or an ancestor index cannot be decided
    from the line; it needs resolution plus a read of the target.
  enforcedBy: null
R5:
  type: manual
  reason: >
    "Rendered as a unit" is a fact about who mounts the directory; a pattern cannot see it. Start
    from `find apps/web/src -name 'index.ts*'` and read each hit and its importers.
  enforcedBy: null
R8:
  type: grep
  pattern: "from '\\.\\./"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "apps/web/tests/**/*.ts", "apps/web/tests/**/*.tsx", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx", "tools/workbench/tests/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "None known; same-folder `./` imports are allowed and not matched."
```

## 4. Trade-offs

- **Good, because** an import path names the file that declares the symbol, so navigation is one jump and a reader never has to resolve a forwarding chain to find a definition.
- **Good, because** there is no aggregation file to update when a module is added, renamed or deleted — a class of merge conflict and a class of stale export simply do not occur.
- **Good, because** importing one symbol cannot drag a directory's whole subtree into the module graph, which keeps bundle boundaries and circular-import risk predictable.
- **Bad, because** import paths are longer and deeper, and a consumer must know a module's internal layout rather than a single directory name.
- **Bad, because** moving a file is a wide change: every importer's path must be rewritten, where a barrel would have absorbed the move behind one edit.
- **Bad, because** a directory has no single place that states what it offers; the directory listing is the only summary, so directories have to stay small enough to read.
- **Neutral, because** the only module that ever exists to be reached by directory name is a rendered directory's entry component, which turns that pattern into a recognisable, bounded exception.

## 5. Reference implementation

A rendered directory's index declares its entry component and nothing else:

```tsx
import type { FC } from 'react';
import { OnboardingStep } from '@/components/onboarding/OnboardingStep.tsx';
import { useOnboardingStore } from '@/store/onboarding.ts';

export const Onboarding: FC = () => {
  const step = useOnboardingStore((s) => s.step);
  return <OnboardingStep step={step} />;
};
```

A type registry is a plain module imported by its own path, and a forwarded name is imported from where it is declared:

```ts
import type { Gender } from '@pacevault/engine/types.ts';
import type { UserProfile } from '@/types.ts';
```

## 6. Forbidden practices

- ❌ `export * from './x.ts'` anywhere — it makes the exported surface invisible at the export site and couples every consumer to whatever the target file grows next.
- ❌ A module consisting only of `export { X } from './X.tsx'` lines, or a declaring module that also forwards another package's names (`export type { Gender } from '@pacevault/engine/types.ts'`). It adds a hop and invites two spellings of the same import.
- ❌ Adding an index to a directory of peers (hooks, types, helpers) so it can be imported "as a package" — each peer is reached by its own path.
- ❌ Importing a nested module through an ancestor's index, even when the ancestor index exists for another reason.
- ❌ Widening a feature's `index.tsx` beyond its entry component by re-exporting its internals alongside it — the entry component is the only name the directory publishes.
- ❌ `import { x } from '../sibling-directory/x.ts'` — cross-directory imports go through `@/`.
