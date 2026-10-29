---
kind: pattern-apply-tdr-reference
id: hooks-return-the-fitting-shape
title: A hook returns the shape its call site needs
summary: Every exported hook has an explicit return type; it returns a single value bare, void for effects, a library result unchanged, a value/setter tuple, or a named composite type.
governs:
  - "apps/web/src/**/use*.ts"
  - "apps/web/src/**/use*.tsx"
  - "packages/ui/src/**/use*.ts"
  - "packages/ui/src/**/use*.tsx"
  - "tools/workbench/site/src/**/*.ts"
  - "tools/workbench/site/src/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# A hook returns the shape its call site needs

## 1. Context

This file carries rules R1–R7.

This is a boundary record. Sibling records prescribe a good deal of hook structure — one hook per file, where the file lives, how a server-call module is shaped — and a reader who generalises from them will invent a rule that does not exist: that every hook returns an object literal. It does not. A hook here returns a query result object, a bare scalar, an array, a ref, a single callback, a tuple, `void`, or a named composite, and which one follows from what the call site does with it, not from a house style.

What this record fixes is the pressure to normalise: do not wrap a single value in an object for symmetry with the hook next to it, and do not flatten a library result object into hand-picked fields. Around that permission sit an annotation rule, a naming rule for composites, a passthrough rule for library results, and a narrow licence for tuples.

Scope: hook modules under `apps/web/src` and `packages/ui/src/hooks/`. Zustand store accessors in `apps/web/src/store/` and hooks in `apps/web/tests/` are out of scope.

The rules bind the board island of `tools/workbench` (`tools/workbench/site/src/`) as well.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Choose a hook's return shape from what its caller reads or passes on. There is no required shape; a scalar, an array, a ref, a callback, `void`, a tuple, a library result object and a named composite are all first-class outcomes. | manual |
| R2 | Annotate every exported hook with an explicit return type. The annotation, not the body, is the hook's contract. `ReturnType<typeof useX>` used as the hook's own type does not count. | proposed |
| R3 | When a hook returns a composite of several members, declare that composite as a named `interface` or `type` beside the hook and annotate with the name. Keep the name file-local unless a consumer needs it. Name it for what the value is (`DashboardAxis`, `MapPopupState`, `ThresholdsForm`); a `Use<Hook>Result` name is acceptable where no better noun exists. | proposed |
| R4 | When a hook produces one thing, return that one thing bare — the scalar, the array, the ref, the callback — and return `void` from a hook that exists only for its effect. Never wrap a single member in an object literal (`return { gpsData }`). | proposed |
| R5 | A hook that wraps an I/O call returns React Query's result object unchanged, annotated `UseQueryResult<…>` / `UseMutationResult<…>`. When a hook combines such a result with derived data, carry the whole result object as one member of the composite rather than re-exposing selected fields from it. | proposed |
| R6 | Reserve a tuple for a positional pair the caller names itself — a value and its setter, mirroring `useState`. Any other multi-member return is a named composite under R3. | proposed |
| R7 | When a hook's entire return value is a function, return a referentially stable one (`useCallback`, or a function that closes over nothing reactive), so a caller can list it in a dependency array or pass it to a memoised child. | manual |

## 3. Detection

```yaml
R1:
  type: manual
  reason: >
    A permission, not a constraint; checkable only in review, by asking whether a chosen shape
    follows from the call site.
  enforcedBy: null
R2:
  type: grep
  pattern: "export const use[A-Z]\\w* = (<[^>]*>)?\\((?:[^()]|\\([^()]*\\))*\\)\\s*=>"
  include: ["apps/web/src/**/use*.ts", "apps/web/src/**/use*.tsx", "packages/ui/src/**/use*.ts", "packages/ui/src/**/use*.tsx", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Run with `rg -nU`. Parameters containing doubly nested parentheses escape the pattern. Also
    run `rg -n "ReturnType<typeof use" apps/web/src` — a type derived from the hook is not an
    annotation.
R3:
  type: grep
  pattern: "\\):\\s*\\{[^}]*;[^}]*\\}\\s*=>"
  include: ["apps/web/src/**/use*.ts", "apps/web/src/**/use*.tsx", "packages/ui/src/**/use*.ts", "packages/ui/src/**/use*.tsx", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Matches an index-signature annotation, which is correct as written. Under-reports on formatted
    multi-line annotations; run with `rg -nU` and read each `): {` hit.
R4:
  type: grep
  pattern: "return \\{ [A-Za-z_$][A-Za-z0-9_$]* \\};"
  include: ["apps/web/src/**/use*.ts", "apps/web/src/**/use*.tsx", "packages/ui/src/**/use*.ts", "packages/ui/src/**/use*.tsx", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A single-member object is occasionally deliberate (a shape known to be growing). Flag and
    review; do not auto-rewrite.
R5:
  type: grep
  pattern: "useQuery|useMutation|useInfiniteQuery"
  include: ["apps/web/src/queries/**/use*.ts", "apps/web/src/mutations/**/use*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: no-match
  enforcedBy: null
  falsePositives: >
    Establishes only that a module in those trees calls the library; telling passthrough from
    flattening needs the return annotation read next to the call.
R6:
  type: grep
  pattern: "\\):\\s*\\[[^\\]]+\\]\\s*=>"
  include: ["apps/web/src/**/use*.ts", "apps/web/src/**/use*.tsx", "packages/ui/src/**/use*.ts", "packages/ui/src/**/use*.tsx", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Flags every tuple return including the conforming value/setter pair; check each hit by eye.
R7:
  type: manual
  reason: "Whether a returned function is stable needs reading how it is built; a bare arrow in the hook body is not."
  enforcedBy: null
```

R2 has no failing gate in the root `vite.config.ts` lint block today; `typescript/explicit-function-return-type` is proposed in the tooling plan.

## 4. Trade-offs

- **Good, because** a hook's annotation stays honest: a hook that computes one boolean says `boolean`, and a caller reads its whole contract in the signature.
- **Good, because** passing a query result through unchanged keeps every field the library offers — `isFetching`, `error`, `refetch`, `status` — reachable without the wrapper being edited.
- **Good, because** naming composites gives every multi-member return a place where its members are listed once, and gives specs and consumers a type to import.
- **Bad, because** heterogeneous return shapes mean a caller cannot guess: every hook has to be read before it is used, and turning a scalar hook into a composite breaks every call site at once.
- **Bad, because** "fits the call site" is a judgement, so two hooks solving near-identical problems can end up with different shapes and neither is wrong.
- **Neutral, because** an annotation gate guarantees the annotation exists but says nothing about whether the shape behind it was chosen well.

## 5. Reference implementation

```ts
interface MapPopupState {
  popup: PopupInfo | null;
  hoveringTrack: boolean;
  interactive: boolean;
  onClick: PickHandler;
  onHover: PickHandler;
  closePopup: () => void;
  onPointerLeave: () => void;
}
export const useMapPopupState = (
  mapRef: RefObject<MapRef | null>,
  tracks: MapTrack[],
): MapPopupState => { ... };

export const useSessionWeather = (options: {
  sessionId: string;
  sessionDateMs: number;
  durationSec: number;
}): UseQueryResult<QueryResults['sessionWeather']> => { ... };

export const useGpsBackfill = (): SessionGPS[] | null => { ... };

export const useDismiss = (
  onClose: () => void,
  options?: DismissOptions,
): RefObject<HTMLDivElement | null> => { ... };

export const useDebouncedValue = <T>(value: T, delayMs: number): T => { ... };

export const useFileDropEffect = (onDrop: (files: FileList) => void, enabled: boolean): void => { ... };
```

## 6. Forbidden practices

- Wrapping a single value in an object literal — `(): { gpsData: SessionGPS[] | null }` where `(): SessionGPS[] | null` would do.
- Flattening a query or mutation result into hand-picked fields (`{ data, isLoading }`).
- A multi-member inline object literal in the return annotation. Give the shape a name.
- `export type X = ReturnType<typeof useX>` as the hook's contract — the body becomes the contract again.
- A tuple of more than two positions, or a two-position tuple that is not a value/setter pair.
- An unannotated exported hook, or one annotated `any`/`unknown` to silence a linter.
- Reshaping an existing hook purely to match its neighbours. Uniformity is not a reason; a changed call site is.
