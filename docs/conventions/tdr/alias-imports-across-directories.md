---
kind: pattern-apply-tdr-reference
id: alias-imports-across-directories
title: Alias imports across directory boundaries
summary: A sibling in the same directory is imported relatively; anything outside that directory is imported through the source-root alias, and no specifier ever contains a parent segment.
governs:
  - "src/**/*.ts"
  - "src/**/*.tsx"
adopted_rules: [R1, R2, R3, R4]
adopted: 2026-09-17
---

# Alias imports across directory boundaries

## 1. Context

This file carries R1–R4.

Every module specifier inside `src/` answers one question: is the target a neighbour, or is it somewhere else in the project? This record fixes a single answer for each case — a relative specifier means "in this directory", the source-root alias (`@/…`) means "elsewhere in this project". Without that split, a specifier encodes the distance between two files, so every move of either file rewrites imports that have nothing to do with the change, and a reader has to count `../` segments to work out where a module actually sits.

Scope is `src/`. Import *ordering* is not this record's business — Oxfmt's organise-imports pass owns it. Where the test tree's own imports are concerned, see the spec-layout record.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | An import whose target sits in the importing file's own directory is written as a relative specifier (`./Name.tsx`). The alias is not used for a sibling — it is the correct form here, not a fallback. | manual |
| R2 | An import whose target sits outside the importing file's own directory is written as the source-root alias, spelled as the full path from `src/` (`@/features/map/trackColors.ts`), regardless of how near the target directory is. This includes descending specifiers (`./hooks/useThing.ts`), which cross a boundary just as much as ascending ones. | proposed |
| R3 | A module specifier never contains `../`. A module inside a nested subdirectory reaches its parent, its siblings' subdirectories and its own subtree's shared modules through the alias like any other crossing — there is no carve-out for staying inside one's own feature. | proposed |
| R4 | The alias is declared with the same mapping in every resolver: the type checker (`paths` in `tsconfig.app.json`), the bundler (`resolve.alias` in `vite.config.ts`) and the test runner (`resolve.alias` in `vitest.config.ts`). | manual |

## 3. Detection

```yaml
R1:
  type: manual
  reason: >
    Deciding whether an alias specifier points at the importing file's own directory means
    resolving both paths and comparing their dirnames — a per-file computation, not a pattern
    over one line.
  enforcedBy: null
R2:
  type: grep
  pattern: "from '\\./[^']*/"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["src/paraglide/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Matches a descending specifier, which is the violation, but also matches `./index.css`-style
    asset imports where no alias equivalent is wanted — read the extension.
R3:
  type: grep
  pattern: "from '\\.\\./"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["src/paraglide/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R4:
  type: manual
  reason: >
    Comparing three config files' alias tables against each other is a cross-file set comparison
    a line-based pattern cannot express.
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** moving a file changes only that file's own relative imports; everything reaching it through the alias is unaffected.
- **Good, because** a specifier states where a module sits rather than how far away it is, so a reader locates the target without counting segments or knowing where they currently are.
- **Bad, because** the alias form is longer, and for a target one directory up it looks like ceremony — the payoff only shows when files move.
- **Neutral, because** it puts two forms in the same import block; the formatter's organise-imports pass groups them, so the split is visible rather than noisy.

## 5. Reference implementation

From `src/features/map/hooks/useSessionDetailPath.ts`, reaching its own feature's modules:

```ts
import { buildZoneColoredPath } from '@/features/map/zoneColoredPath.ts';
import { sportTrackColor } from '@/features/map/trackColors.ts';
import type { MapTrack } from './types.ts';
```

The third specifier is relative because `types.ts` is a sibling in `hooks/`; the first two are aliased because they sit one level up.

## 6. Forbidden practices

- ❌ `'../trackColors.ts'` — the parent segment encodes the distance between two files rather than the target's address.
- ❌ `'@/features/map/hooks/useMapTracks.ts'` written from inside `src/features/map/hooks/` — a sibling takes the relative form; the alias here says "somewhere else" about a file in the same directory.
- ❌ `'./markers/markerGeometry.ts'` — descending crosses a directory boundary exactly as ascending does, so it takes the alias.
- ❌ Declaring the alias in the bundler but not the test runner, or mapping it to a different root in one of them — the same specifier then resolves in one tool and fails in another.
