---
kind: pattern-apply-tdr-reference
id: component-directory-and-file-naming
title: Every kit component lives in its own pv-prefixed directory
summary: A packages/ui component lives in components/pv<Name>/Pv<Name>.tsx, every component export carries the Pv prefix, family members sit beside it as Pv<Name><Part>.tsx, and only genuinely shared non-component modules sit at the components root.
governs:
  - "packages/ui/src/components/**"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Every kit component lives in its own pv-prefixed directory

## 1. Context

This file carries rules R1, R2, R3, R4, R5, R6 and R7.

`@pacevault/ui` is imported by path (`@pacevault/ui/components/pvDialog/PvDialogContent.tsx`, the package exports `"./*": "./src/*"`), so a mechanical mapping between directory, file and exported symbol is what lets a reader go from an import to its file, or from a directory to its primary component, without searching. The `Pv` prefix marks a kit component at every import site in `apps/web`, `tools/workbench` and `tools/docs`, where kit components sit next to the app's own components and next to the Radix primitives the kit wraps (`PvDialog` is the kit's dialog, `DialogPrimitive.Root` the primitive, `Dialog`-named app components the app's own).

Scope: `packages/ui/src/components/`. It governs directory names, component file names, the names of shared support modules inside a component directory, and the prefix on component exports. What a component module itself looks like (one component per module, `FC<XProps>`, a non-exported props interface) is component-declaration-shape; where a type shared by several modules goes is colocated-types-module (a component directory's own `types.ts`). Specs mirror `src/` under `packages/ui/tests/` (mirrored-spec-layout). There is no index module anywhere (index-modules-are-not-barrels). Hooks (`src/hooks/`) and helpers (`src/lib/`) are not components and are not governed here.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Name a component directory in camelCase as `pv` followed by the PascalCase name of its primary component (`pvDialog`, `pvStatTile`, `pvToastViewport`). | manual |
| R2 | Name the primary implementation file for the component itself, PascalCase `.tsx`, at the top level of its directory: upper-casing the first letter of the directory name yields the file name exactly (`pvDialog/PvDialog.tsx`). | manual |
| R3 | Give every component exported from a module under `packages/ui/src/components/` the `Pv` prefix (`PvDialog`, `PvDialogContent`, `PvBottomSheetProvider`). Non-component exports — hooks, helpers, constants, types — take no prefix (`useSheetPeekContext`, `TypographyVariants`). | manual |
| R4 | Put a secondary component of the same family — a compound part, a row, an internal piece another module of the directory renders — in the same directory, in its own file named after its exported symbol, carrying the same prefix (`pvDialog/PvDialogHeader.tsx`, `pvStatRail/PvStatRailContent.tsx`), whether or not anything outside the directory imports it. | manual |
| R5 | The only fixed support-module name inside a component directory is `types.ts` (the directory's shared vocabulary, per colocated-types-module). Any other non-component module there takes a descriptive camelCase name, and a hook module is named for the hook it exports. | manual |
| R6 | Give a support module the `.ts` extension; use `.tsx` only when the module itself contains JSX. | manual |
| R7 | Keep component files inside a component directory, never directly under `packages/ui/src/components/`. A component rendered by several directories still earns its own directory (`pvSheetGrabber/`, `pvCollapsibleHeader/`); only shared non-component modules may sit at the components root, and helpers belong in `src/lib/`. | manual |

## 3. Detection

R2 and R4 need a name-to-name correlation no single pattern expresses, so they are `manual`: a validator loops over directories.

```yaml
R1:
  type: glob
  pattern: "packages/ui/src/components/*/"
  include: ["packages/ui/src/components/*/"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "Enumerates the population rather than testing it: test each directory basename against /^pv[A-Z][A-Za-z0-9]*$/ and report only failures."
R2:
  type: manual
  reason: "Derive the expected file name from the directory name (upper-case the first letter) and assert that file exists. A directory conforms only if it holds a top-level .tsx file whose basename is the directory name with its first letter upper-cased."
  enforcedBy: null
R3:
  type: grep
  pattern: "^export const (?!Pv)[A-Z][A-Za-z0-9]*\\b"
  include: ["packages/ui/src/components/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "Needs PCRE (rg -P). Flags a capitalised non-component export (an UPPER_SNAKE constant is not matched, a PascalCase constant would be). Misses an export written as an export list."
R4:
  type: manual
  reason: "Deciding which top-level .tsx files in a component directory are secondary components means classifying each file's export. Criterion: every top-level .tsx that exports a component and is not the primary file is named Pv<Something>.tsx and exports Pv<Something>."
  enforcedBy: null
R5:
  type: glob
  pattern: "packages/ui/src/components/*/[a-z]*.{ts,tsx}"
  include: ["packages/ui/src/components/*/[a-z]*.ts", "packages/ui/src/components/*/[a-z]*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "Enumerates every lowercase-initial module; allow types.ts, camelCase descriptive names and use*-named hook modules, report the rest (types.tsx, type.ts, Types.ts)."
R6:
  type: grep
  pattern: "</|/>"
  include: ["packages/ui/src/components/**/types.tsx", "packages/ui/src/components/**/use*.tsx"]
  exempt: []
  violationWhen: no-match
  enforcedBy: null
  falsePositives: "Inverted signal: a .tsx support module with no JSX tag is the violation. Wrongly clears a module whose only match sits in a string."
R7:
  type: glob
  pattern: "packages/ui/src/components/*.tsx"
  include: ["packages/ui/src/components/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "Does not flag a .ts module at that level, which is intentional."
```

## 4. Trade-offs

- **Good, because** a symbol name determines its file path and vice versa, so a human or an agent can navigate from an import to its implementation, or from a directory to its primary component, without searching. The camelCase-directory/PascalCase-file split makes the primary file visually distinct from support modules in a listing.
- **Good, because** the prefix marks kit components unambiguously at the consumer's import site, inside an app that mixes them with its own components and with the Radix primitives the kit wraps — no name collisions, no doubt about which dialog is meant.
- **Bad, because** the prefix is pure noise inside the kit itself: every directory, file and symbol repeats it, which lengthens names, weakens autocomplete, and makes the components root sort as one block.
- **Bad, because** nothing in the toolchain enforces any of it; every rule is a review-time obligation, and the casing difference between a directory and its file is exactly what a case-insensitive filesystem lets slip.
- **Neutral, because** renaming a component means renaming its directory, its primary file and its exported symbol together — mechanical, never a one-line change.

## 5. Reference implementation

```
packages/ui/src/components/
  pvDialog/
    PvDialog.tsx
    PvDialogContent.tsx
    PvDialogHeader.tsx
    PvDialogCard.tsx
  pvStatRail/
    PvStatRail.tsx
    PvStatRailContent.tsx
    types.ts
  pvSheetGrabber/
    PvSheetGrabber.tsx
```

```tsx
import { PvDialog } from '@pacevault/ui/components/pvDialog/PvDialog.tsx';
import { PvDialogContent } from '@pacevault/ui/components/pvDialog/PvDialogContent.tsx';
import { useDevice } from '@pacevault/ui/hooks/useDevice.ts';
```

## 6. Forbidden practices

- ❌ A component directory in PascalCase, kebab-case, or without the `pv` prefix — it breaks the derivation from directory to file to exported symbol.
- ❌ A primary file whose name is not the directory name with an upper-cased first letter, including an `index.tsx` that re-exports it.
- ❌ A per-directory index barrel; importers address the file that declares the symbol.
- ❌ An unprefixed PascalCase component file in a component directory, or a component export without the prefix — including via an alias that strips it.
- ❌ A bare generic name for a wrapper around a Radix primitive; the prefix is what keeps the wrapper distinguishable from the primitive.
- ❌ A support module under a near-miss of `types.ts` (`type.ts`, `Types.ts`, `types.tsx` without JSX).
- ❌ A `.tsx` extension on a support module that contains no JSX.
- ❌ A component file directly under `packages/ui/src/components/`, even when it is small or shared between directories.
