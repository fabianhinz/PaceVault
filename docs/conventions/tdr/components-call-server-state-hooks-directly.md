---
kind: pattern-apply-tdr-reference
id: components-call-server-state-hooks-directly
title: Components call remote-state hooks directly
summary: A component needing remote data calls the query or mutation hook in its own body; a feature-local wrapper is written only when it does something the caller would otherwise repeat.
governs:
  - "src/features/**/*.tsx"
  - "src/features/**/hooks/*.ts"
  - "src/pages/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5]
adopted: 2026-09-17
---

# Components call remote-state hooks directly

## 1. Context

This file carries R1–R5.

A component that needs remote data calls the query hook itself. The pull the other way is strong and mostly reflexive: a feature-local hook gets introduced "for consistency", its whole body is one call and a return, and the codebase gains a layer that hides which data a component actually reads while adding nothing. This record fixes the default — call directly — and states the five grounds on which a wrapper earns its place.

Scope: components under `src/features/` and `src/pages/`, and the feature-local `hooks/` directories beside them. Out of scope: the query and mutation modules themselves, which are a sibling record's subject.

The same shape appears around this project's local IndexedDB reads, which are not remote state and are not formally governed here. The test in R3 applies just as well to them, and reading it that way is encouraged; treat the verdict as advisory rather than as a violation.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | A component that needs remote data calls the query or mutation hook directly in its own body. | manual |
| R2 | Do not introduce a feature-local hook whose whole body is one call to a query or mutation hook and a return of that call's result. | proposed |
| R3 | Write a wrapper hook only when it earns its place: it derives, filters, flattens or reshapes the returned data; coordinates more than one call; injects ambient arguments (a store read, a route param, a selection) that every caller would otherwise repeat; memoises a computed result; or encapsulates non-trivial `enabled` / `retry` / refetch conditions. | manual |
| R4 | A wrapper hook keeps the single-call-per-module and single-export shape of its neighbours: one exported `use*` per file, named for what it yields rather than for the call it makes. | manual |
| R5 | When a wrapper exists only to pin arguments and its callers each pass different ones, delete it and let the callers call the hook. | manual |

## 3. Detection

```yaml
R1:
  type: manual
  reason: >
    "Calls it directly" is the absence of an intermediate layer, which no pattern over one file
    expresses.
  enforcedBy: null
R2:
  type: glob
  pattern: "a feature hook module whose body is a single return of a call to a src/queries or src/mutations hook"
  include: ["src/features/**/hooks/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A wrapper that also sets `enabled` from a store read is R3's third ground and looks similar at
    a glance; read what else the body does.
R3:
  type: manual
  reason: >
    Each of the five grounds is a property of what the hook does, which is exactly the judgement
    the rule exists to make.
  enforcedBy: null
R4:
  type: grep
  pattern: "^export const use[A-Z]"
  include: ["src/features/**/hooks/*.ts"]
  exempt: []
  violationWhen: count-differs
  enforcedBy: null
  falsePositives: >
    Expect exactly one per module; the one-hook-per-file record owns this more fully.
R5:
  type: manual
  reason: >
    "Callers each pass different arguments" needs every call site read.
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** a component's body shows which data it reads, so find-usages on a query hook lists its real consumers rather than one indirection.
- **Good, because** a layer that adds nothing never gets written, and the ones that do exist can each be pointed at a reason.
- **Bad, because** "earns its place" is five judgements rather than a line, so two reviewers can disagree about the same wrapper.
- **Neutral, because** it pulls against the instinct that feature code should not import from a top-level tree; the import path is longer and the indirection it replaces was never doing anything.

## 5. Reference implementation

Direct, which is the default:

```tsx
export const WeatherChips: React.FC<WeatherChipsProps> = (props) => {
  const weather = useSessionWeather({
    sessionId: props.session.id,
    sessionDateMs: props.session.startTime,
    durationSec: props.session.duration,
  });

  if (weather.isLoading) return <ValueSkeleton />;
  return <>{…}</>;
};
```

A wrapper that earns its place under R3 — it injects a route param every caller would otherwise read, and reshapes the result:

```ts
export const useCurrentSessionWeather = (): WindExposure | null => {
  const params = useParams();
  const weather = useSessionWeather({ sessionId: params.id ?? '', … });
  return useMemo(() => toWindExposure(weather.data), [weather.data]);
};
```

## 6. Forbidden practices

- ❌ A feature hook whose body is `return useSessionWeather(args);` — it hides the read and adds a file.
- ❌ Wrapping a query hook "for consistency" with the feature's other hooks.
- ❌ A wrapper that only pins arguments while each caller needs different ones; every caller then works around it.
- ❌ Naming a wrapper after the call it makes (`useGetSessionWeather`) rather than after what it yields.
- ❌ Two exported hooks in one wrapper module.
