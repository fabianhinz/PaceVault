---
kind: pattern-apply-tdr-reference
id: hooks-return-the-fitting-shape
title: A hook returns the shape its call site needs
summary: There is no house return shape for hooks — a scalar, an array, a callback, void, a query result or a named composite are all first-class, but every hook carries an explicit return-type annotation.
governs:
  - "src/**/use*.ts"
  - "src/**/use*.tsx"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7]
adopted: 2026-09-17
---

# A hook returns the shape its call site needs

## 1. Context

This file carries R1–R7.

This is a boundary record. Sibling records prescribe a good deal of hook structure — one hook per file, where the file lives, how many server calls a hook module may make — and a reader who generalises from them will invent a rule that does not exist: that every hook returns an object literal. It does not. A hook here returns a query result object, a bare scalar, an array, a single callback, a tuple, `void`, or a named composite, and which one it is follows from what the call site does with it, not from a house style.

What this record fixes is the pressure to normalise: do not wrap a single value in an object for symmetry with the hook next to it, and do not flatten a library result object into hand-picked fields. Around that permission sit five genuine rules — an annotation rule, a naming rule for composites, a passthrough rule for library results, a narrow licence for tuples, and a stability rule for callback returns.

Scope: hook modules under `src/`. Hooks in `tests/` are out of scope.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Choose a hook's return shape from what its caller passes on. There is no required shape; a scalar, an array, a callback, `void`, a tuple, a query result object and a named composite are all first-class outcomes. | manual |
| R2 | Annotate every exported hook with an explicit return type, including `void` and including concise-body arrows. The annotation, not the body, is the hook's contract. | proposed |
| R3 | When a hook returns a composite of several members, declare that composite as a named `interface` or `type` beside the hook in its own module and annotate with the name. Keep the name unexported unless a consumer needs it. Name it for what the value is; a `Use<Hook>Result` name is acceptable where no better noun exists. | proposed |
| R4 | When a hook produces one thing, return that one thing bare — the scalar, the array, the callback — and return `void` from a hook that exists only for its effect. Never wrap a single member in an object literal. | proposed |
| R5 | A hook that wraps a server call returns React Query's result object unchanged, with its full `UseQueryResult<…>` / `UseMutationResult<…>` annotation. When a hook combines such a result with derived data, carry the whole result object as one member of the composite rather than re-exposing selected fields from it. | proposed |
| R6 | Reserve a tuple for a positional pair the caller names itself — a value and its setter — mirroring `useState`/`useReducer`. Any other multi-member return is a named composite under R3, never a positional list. | proposed |
| R7 | When a hook's entire return value is a function, return a referentially stable one (`useCallback` or an equivalent). | manual |

## 3. Detection

```yaml
R1:
  type: manual
  reason: >
    This rule grants latitude rather than removing it; there is nothing to flag.
  enforcedBy: null
R2:
  type: grep
  pattern: "^export const use[A-Z][A-Za-z0-9]* = \\([^)]*\\) => "
  include: ["src/**/use*.ts", "src/**/use*.tsx"]
  exempt: ["src/paraglide/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Matches a hook whose annotation is written after a multi-line parameter list, which this
    single-line pattern cannot see; check the declaration before treating a match as a violation.
R3:
  type: manual
  reason: >
    Whether a returned object literal should have been a named interface depends on how many
    members it carries and whether the annotation names them, which needs the declaration read.
  enforcedBy: null
R4:
  type: grep
  pattern: "return \\{ [a-zA-Z0-9]+ \\};"
  include: ["src/**/use*.ts", "src/**/use*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Matches a single-member return inside a nested helper function in the same module rather than
    the hook's own return.
R5:
  type: grep
  pattern: "UseQueryResult|UseMutationResult"
  include: ["src/queries/**/*.ts", "src/mutations/**/*.ts", "src/features/**/use*.ts"]
  exempt: []
  violationWhen: no-match
  enforcedBy: null
  falsePositives: >
    Only meaningful for a module that actually calls `useQuery`/`useMutation`; run it scoped to
    those modules, not across every hook.
R6:
  type: grep
  pattern: "return \\[[^\\]]+\\] as const;|: \\[[A-Za-z<>\\[\\]]+, [A-Za-z<>\\[\\]]+\\] ="
  include: ["src/**/use*.ts", "src/**/use*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A value-and-setter pair is the permitted case and matches too — read whether the second member
    is a setter for the first.
R7:
  type: manual
  reason: >
    Referential stability is a property of the value across renders, not of any text in the module.
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** the annotation makes the hook's contract readable without running type inference in your head, and a change to the body that changes the shape fails at the declaration rather than at a distant call site.
- **Good, because** refusing a house shape keeps single-value hooks from growing a wrapper object nobody wanted, which is the main way hook call sites get noisy.
- **Bad, because** "the shape its call site needs" is not checkable, so two hooks doing similar work can legitimately differ and a reviewer has no line to hold.
- **Neutral, because** naming every composite adds an interface per hook module; small, but it is a declaration a reader passes on the way to the hook.

## 5. Reference implementation

One thing, returned bare:

```ts
export const useIsDesktop = (): boolean => useMediaQuery('(min-width: 1024px)');
```

Several things, named composite declared beside the hook:

```ts
interface SessionExport {
  exportable: boolean;
  exportGpx: () => void;
}

export const useSessionExport = (session: TrainingSession): SessionExport => { … };
```

A server call, passed through whole:

```ts
export const useSessionWeather = (session: TrainingSession): UseQueryResult<Weather> =>
  useQuery({ queryKey: sessionWeatherQueryKey(session.id), queryFn: … });
```

## 6. Forbidden practices

- ❌ Wrapping a single returned value in an object for symmetry with a neighbouring hook — the caller then writes `.value` for nothing.
- ❌ Flattening a React Query result into hand-picked fields; the caller loses `refetch`, `error` and the status flags, and each hook picks a different subset.
- ❌ A positional tuple for anything that is not a value-and-setter pair — the members get named anew at every call site.
- ❌ Leaving an exported hook unannotated and relying on inference; the contract then lives in the body and changes silently.
- ❌ Returning a fresh function identity on every render from a hook whose whole return is that function — every consumer's dependency array then fires each render.
