---
kind: pattern-apply-tdr-reference
id: colocated-types-module
title: A directory's shared vocabulary lives in a colocated types.ts
summary: A type, union or constant table read by more than one component or hook module goes in a leaf types.ts beside its readers, never exported from a component or hook for a sibling to import.
governs:
  - "apps/web/src/**"
  - "packages/ui/src/**"
  - "packages/engine/src/**"
  - "packages/gpx/src/**"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# A directory's shared vocabulary lives in a colocated types.ts

## 1. Context

This file carries rules R1–R7.

The rules also bind `packages/ui` (`packages/ui/src`, specs in `packages/ui/tests`); where the text below names an `apps/web` path, the kit's counterpart is meant. In the kit, a type read by several modules of one component directory, or by the kit's consumers, goes in that directory's `types.ts` (`packages/ui/src/components/pvToastViewport/types.ts`), never exported from the component module.

The rules bind `packages/engine` as well, whose directory is the flat `packages/engine/src`: a type read by more than one engine module goes in `packages/engine/src/types.ts`; a type read by one engine module stays in it and is exported when the app or a spec reads it, because the engine's modules are its public API. `types.ts` is a leaf there too (no imports) and may hold `as const` lists with their derived unions (`SPORTS`, `RACE_DISTANCES`).

`packages/gpx` is read the same way in its flat `packages/gpx/src`: "more than one module" counts gpx modules. `RoutePoint`, read by `routeGeometry.ts`, `routeCut.ts` and `routeProfile.ts`, lives in `packages/gpx/src/types.ts`; `GpxPoint`, `GpxWaypoint`, `RouteElevationStats` and `RouteProfile` stay with their one gpx reader and are exported because the app reads them. One exception to R3 holds there: `RoutePoint` extends `ParsedGpxPoint`, which is inferred from `parsedGpxPointSchema` and so stays beside it in `parseGpx.ts` (R6); gpx's `types.ts` therefore carries exactly one type-only import, `import type { ParsedGpxPoint } from './parseGpx.ts'`, and no value import.

When several modules in `apps/web/src` need the same type, union or constant table, that declaration has two possible homes: whichever component or hook happened to declare it first, or a dedicated `types.ts` beside its readers. This project uses the second. The cost of the first is directional: a module that needs only the name ends up importing a component or a hook, which drags its implementation, its transitive imports and its evolution into the reader's dependency graph for a name.

Scope: shared declarations inside `apps/web/src` feature, component, page, store and parser directories — the union describing a feature's states, the shape its modules pass between each other, the field vocabulary a form hook and its consumers share. Out of scope: a declaration used by exactly one module, which stays in that module; a component's own props, which stay module-local (component-declaration-shape); a type inferred from a zod schema, which stays with the schema (zod-schema-naming-and-inference); worker message contracts (cross-boundary-contracts-in-shared); and helper topic modules (`apps/web/src/lib/*.ts` and feature-local topic modules such as `features/map/zoneColoredPath.ts`), whose small types stay with the functions that consume them (helpers-group-by-topic R4).

The app-wide registry `apps/web/src/types.ts` (user profile, coaching and plan shapes) is the one cross-cutting instance; it is governed here only insofar as it stays a leaf.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | A declaration read by more than one module goes in a `types.ts` in the directory of its readers (their common directory when they sit in sibling sub-directories). A declaration read by one module stays in that module. Never export a type from a component or hook module so another module can import it. | manual |
| R2 | Name the module `types.ts`, lowercase, one per directory, beside the modules that read it — never in a `types/` subdirectory, never `<feature>Types.ts` or `*.types.ts`. | proposed |
| R3 | `types.ts` is a leaf: it imports from external packages, from `@pacevault/*` packages and from other `types.ts` modules — never from a sibling implementation module in its own directory. In `packages/gpx` its `types.ts` may type-import the schema-inferred `ParsedGpxPoint` from `parseGpx.ts` (§1). | proposed |
| R4 | `types.ts` may carry shared runtime vocabulary alongside its types: `as const` tables, literal maps and the unions derived from them. It carries no behaviour — no functions, no caches, no side effects. | proposed |
| R5 | When a nested subdirectory develops its own shared vocabulary, give it its own `types.ts` rather than growing the parent's; the parent's `types.ts` may compose the children's. | manual |
| R6 | A type inferred from a runtime value (a zod schema, an `as const` table, `ReturnType<typeof useX>`) lives with the value it is inferred from. Moving the type means moving the value too. | manual |
| R7 | Do not create a `types.ts` for a directory whose modules share nothing. | manual |

## 3. Detection

```yaml
R1:
  type: manual
  reason: >
    Requires resolving every import of a declared name and judging whether the readers are
    components or hooks importing another implementation for a name. A helper: list exported
    types of .tsx and use*.ts modules that another module imports
    (rg -n "import (type )?\{[^}]*\} from '[^']*\.tsx'" apps/web/src and read each hit).
  enforcedBy: null
R2:
  type: glob
  pattern: "apps/web/src/**/{types/**,*[A-Z]*Types.ts,*.types.ts}"
  include: ["apps/web/src/**", "packages/ui/src/**", "packages/engine/src/**", "packages/gpx/src/**"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A module named for a domain concept that happens to end in "Types". Read the match before
    reporting it.
R3:
  type: grep
  pattern: "^import (type )?\\{[^}]*\\} from '\\./(?!types\\.ts')"
  include: ["apps/web/src/**/types.ts", "packages/engine/src/types.ts", "packages/gpx/src/types.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Misses the same coupling written through the @/ alias to the module's own directory, and
    flags a sibling that is itself a pure declaration module under another name.
R4:
  type: grep
  pattern: "^(export )?(const [A-Za-z0-9_]+ = (async )?\\(|const [A-Za-z0-9_]+ = new |function |class |default )"
  include: ["apps/web/src/**/types.ts", "apps/web/src/types.ts", "packages/engine/src/types.ts", "packages/gpx/src/types.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    An as-const table whose entries are arrow functions (a renderer registry) matches although
    it is vocabulary. Cannot see a top-level side effect that is not a declaration.
R5:
  type: manual
  reason: >
    Whether a nested directory's shared names belong to it or to its parent is a judgement about
    where the concept lives.
  enforcedBy: null
R6:
  type: manual
  reason: >
    Needs the inference chain — which value the type derives from and whether that value is
    itself shared.
  enforcedBy: null
R7:
  type: manual
  reason: >
    "Shares nothing" is the absence of a pattern; single-reader declarations in a types.ts can be
    listed as candidates, not decided.
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** a module that needs a name imports a module with no behaviour and no transitive weight, instead of pulling in a component or hook and everything it depends on.
- **Good, because** the leaf property (R3) makes cycles within a directory structurally impossible: implementations depend on the vocabulary, never the reverse.
- **Good, because** the directory's shared language is discoverable at a fixed filename — a reader or an agent learns what the feature talks about without reading any of its logic.
- **Bad, because** it separates a type from the code that gives it meaning. Understanding a union now costs two files, and the declaration loses the context of the function that consumes it.
- **Bad, because** a fixed filename with no stated admission criterion is an attractor: anything vaguely shared accumulates there, and the module grows into an unreviewable dumping ground with no natural split point.
- **Neutral, because** the boundary between "shared" and "local" is re-decided every time a second reader appears; the rule fixes the destination, not the moment of the move.

## 5. Reference implementation

A derived-union vocabulary, where the runtime table and its type are one idea and R4 keeps them together:

```ts
export const ONBOARDING_SHELLS = ['card', 'dialog'] as const;

export type OnboardingShell = (typeof ONBOARDING_SHELLS)[number];
```

A leaf that only names shapes its readers pass around (`apps/web/src/features/map/hooks/types.ts` after its fix):

```ts
import type { SessionGPS, Sport, TrainingSession } from '@pacevault/engine/types.ts';

export interface MapTrack {
  sessionId: string;
  sport: Sport;
  gps: SessionGPS;
  session: TrainingSession;
}
```

And the shape it must not take — a name exported from the component that also implements it, which is what R1 replaces:

```tsx
export type IntervalsKeyCheck = { kind: 'checking' } | { kind: 'valid' };

export const IntervalsStatusLine: FC<IntervalsStatusLineProps> = (props) => <span />;
```

## 6. Forbidden practices

- ❌ Exporting a type from a component or hook module so another module can import it — the reader then depends on the implementation for a name. Move the declaration to `types.ts`.
- ❌ `types.ts` importing a sibling implementation module from its own directory — this inverts the leaf relationship and reintroduces the coupling the module exists to remove.
- ❌ Putting a function, a cache or a side effect in `types.ts` — the module's value is that importing it costs nothing at runtime.
- ❌ A `types/` subdirectory, or `<feature>Types.ts`, or `types.ts` in a parent directory serving children that could each hold their own — the convention is worth nothing if the location has to be searched for.
- ❌ Moving a type inferred from a schema, an `as const` table or a hook's return value into `types.ts` while leaving the value behind.
- ❌ Creating a `types.ts` up front for a directory with one module, or leaving single-reader declarations in one after their second reader disappeared.
