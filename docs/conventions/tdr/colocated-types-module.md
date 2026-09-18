---
kind: pattern-apply-tdr-reference
id: colocated-types-module
title: A feature's shared vocabulary lives in a colocated types.ts
summary: A declaration read by more than one module in a directory goes in that directory's own types.ts, which stays a behaviour-free leaf; a single-consumer declaration stays where it is.
governs:
  - "src/features/**/*.ts"
  - "src/features/**/*.tsx"
  - "src/lib/**/*.ts"
  - "src/components/**/*.ts"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7]
adopted: 2026-09-17
---

# A feature's shared vocabulary lives in a colocated types.ts

## 1. Context

This file carries R1–R7.

When several modules inside one directory need the same type, union, or constant table, that declaration has two possible homes: whichever implementation module happened to declare it first, or a dedicated `types.ts` beside them. This record prescribes the second. The cost of the first is directional: a sibling that needs only the name ends up importing the module that also holds the behaviour, which drags the implementation, its transitive imports, and its evolution into the consumer's dependency graph for a name.

Scope: shared declarations inside a feature or shared-module directory — the union describing its states, the constant table it keys off, the shape its sibling modules pass between each other. Deliberately out of scope: a declaration used by exactly one module, which stays in that module; a component's own props type, which has its own home; a type inferred from a Zod schema, which stays with the schema that produces it; and `src/packages/engine/`, whose type placement is fixed by that package's own rules.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | A declaration read by more than one module in a directory goes in a `types.ts` in that directory. A declaration read by one module stays in that module. | manual |
| R2 | Name the module `types.ts`, lowercase, one per directory, sitting beside the modules that read it — never in a `types/` subdirectory, a parent directory, or a differently named module. | proposed |
| R3 | `types.ts` is a leaf: it imports from external packages, from `src/packages/engine/types.ts`, and from other `types.ts` modules — never from a sibling implementation module in its own directory. | proposed |
| R4 | `types.ts` may carry the directory's shared runtime vocabulary alongside its types: `as const` tables, literal maps, and the unions derived from them. It carries no behaviour — no functions, no classes, no side effects. | proposed |
| R5 | When a nested subdirectory develops its own shared vocabulary, give it its own `types.ts` rather than growing the parent's; the parent's `types.ts` may compose the children's. | manual |
| R6 | A type produced by inference from a runtime value (a Zod schema, an `as const` table) lives with the value it is inferred from. Moving the type to `types.ts` means moving the value too. | manual |
| R7 | Do not create a `types.ts` for a directory whose modules share nothing. A single-consumer type moved out of its module is a jump with nothing bought. | manual |

## 3. Detection

```yaml
R1:
  type: manual
  reason: >
    Counting a declaration's in-directory consumers means resolving every sibling's imports, not
    matching text in the declaring file.
  enforcedBy: null
R2:
  type: glob
  pattern: "no src/**/types/ directory exists and no shared-vocabulary module is named anything but types.ts"
  include: ["src/features/**", "src/lib/**", "src/components/**"]
  exempt: ["src/types/"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    `src/types/` is the application-level profile module and is exempt until the index-modules plan
    renames it; after that, this exemption can be dropped.
R3:
  type: grep
  pattern: "^import .* from '\\./(?!types)"
  include: ["src/**/types.ts"]
  exempt: ["src/packages/engine/types.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A relative import of another `types.ts` in the same directory is permitted; the negative
    lookahead covers the common spelling but not `./sub/types.ts`.
R4:
  type: grep
  pattern: "^export const [a-zA-Z0-9]+ = \\(|^export function |^export class "
  include: ["src/**/types.ts"]
  exempt: ["src/packages/engine/types.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    An `as const` table whose members are functions matches and is genuinely a violation; a table
    of data is not and does not match.
R5:
  type: manual
  reason: >
    Whether a nested directory has vocabulary of its own is the same counting judgement as R1.
  enforcedBy: null
R6:
  type: manual
  reason: >
    Detecting that an inferred type was separated from the value it infers from needs both files
    read together.
  enforcedBy: null
R7:
  type: glob
  pattern: "every src/**/types.ts has at least two in-directory importers"
  include: ["src/**/types.ts"]
  exempt: ["src/packages/engine/types.ts"]
  violationWhen: no-match
  enforcedBy: null
  falsePositives: >
    A `types.ts` whose consumers are all in nested subdirectories rather than the same directory is
    correctly placed under R5 and fails this check.
```

## 4. Trade-offs

- **Good, because** a module that needs only a name imports only a name — the implementation, its transitive imports and its churn stay out of the consumer's graph.
- **Good, because** a directory's vocabulary is readable in one file, which is the fastest way to learn what a feature is about.
- **Bad, because** it adds a file per directory and a jump for the reader, which for a directory with two modules and one shared type is more ceremony than it buys.
- **Bad, because** the R1 threshold is "more than one consumer", so a type oscillates between homes as consumers come and go, and nothing forces the move back down.
- **Neutral, because** the leaf rule sometimes inverts an existing import edge, which is the right direction but shows up as churn in unrelated modules.

## 5. Reference implementation

`src/features/map/types.ts` — shared vocabulary, a table and the union derived from it, no behaviour:

```ts
import type { SessionGPS } from '@/packages/engine/types.ts';

export const MAP_HOVER_KINDS = ['lap', 'session', 'route'] as const;
export type MapHoverKind = (typeof MAP_HOVER_KINDS)[number];

export interface MapTrack {
  id: string;
  gps: SessionGPS;
  kind: MapHoverKind;
}
```

`useMapTracks.ts` and `MapBackground.tsx` both import `MapTrack` from here; neither imports it from the other.

## 6. Forbidden practices

- ❌ A sibling importing a type from the implementation module that happens to declare it — the name arrives with the behaviour attached.
- ❌ A `types/` subdirectory, or a `sharedTypes.ts`; the filename is what makes the module findable without looking.
- ❌ A `types.ts` importing a sibling implementation module — it stops being a leaf and the cycle it invites is exactly what the record prevents.
- ❌ Putting a function or a class in `types.ts` to keep it "with its types"; the module then has behaviour and importing a name pulls it again.
- ❌ Creating a `types.ts` for a directory whose modules share nothing, so that every directory looks the same.
- ❌ Moving a Zod-inferred or `as const`-derived type into `types.ts` while its value stays behind — the type then restates a shape instead of following it.
