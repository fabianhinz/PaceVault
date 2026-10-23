---
kind: pattern-apply-tdr-reference
id: components-call-server-state-hooks-directly
title: Components call server-state hooks directly
summary: A component that needs IndexedDB or API data calls the React Query hook itself; a wrapper hook exists only when it derives, coordinates several calls, injects ambient arguments, memoises, or owns non-trivial enabled/retry conditions.
governs:
  - "apps/web/src/**/*.tsx"
  - "apps/web/src/**/hooks/*.ts"
adopted_rules: [R1, R2, R3, R4, R5]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Components call server-state hooks directly

## 1. Context

This file carries rules R1–R5.

Every I/O call (IndexedDB, Open-Meteo, intervals.icu) gets its own module exporting one React Query hook (`tdr/one-server-call-per-hook-module.md`), and hooks live in the `hooks/` directory of the concept they are about (`tdr/hook-directory-placement.md`). Read together, those invite a wrong inference: that data access must always be routed through a feature-local hook, so each component gets a wrapper that forwards one call and returns its result unchanged. This convention states the boundary — a component that needs server state is permitted, and expected, to call the query or mutation hook itself, and a wrapper is written only when it does work of its own.

"Server-state hook" means a module whose hook is a `useQuery`/`useMutation` call. Today these sit in feature `hooks/` directories (`apps/web/src/features/sessions/session/hooks/useSessionWeather.ts:28-40`, `apps/web/src/features/records/hooks/usePersonalBests.ts:48-55`, `apps/web/src/features/intervals/hooks/useIntervalsKeyCheck.ts:12-20`); the one-server-call-per-hook-module plan moves them to `apps/web/src/queries/` and `apps/web/src/mutations/`, and this rule then reads those trees as the server-state hooks. The code conforms: every feature hook that calls a server-state hook adds work of its own (`useSessionColorModes`, `useSessionDetailPath`), and components such as `SportsRecords`, `WeatherCard` and `IntervalsConnectionForm` call the server-state hook directly.

Scope: components under `apps/web/src/**/*.tsx` and the `hooks/` modules beside them. Out of scope: the server-state modules themselves, and hooks that wrap non-server concerns such as a store, context, routing or browser APIs.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | A component that needs server state calls the query or mutation hook directly in its own body. | manual |
| R2 | Do not introduce a `hooks/use*.ts` module whose whole body is one call to a server-state hook and a return of that call's result. | proposed |
| R3 | Write a wrapper hook only when it earns its place: it derives, filters, flattens or reshapes the returned data; coordinates more than one call; injects ambient arguments (store selections, the opened session) that every caller would otherwise repeat; memoises a computed result; or encapsulates non-trivial `enabled`/`retry`/refetch conditions. | manual |
| R4 | A wrapper hook keeps the one-hook-per-module shape of its neighbours: one exported `use*` per file, named for what it yields rather than for the call it makes. | manual |
| R5 | When a wrapper exists only to pin arguments and its callers each pass different ones, delete it and let the callers call the hook. | manual |

## 3. Detection

R2 is the only rule with a signal: a hook module whose body is a single expression calling another `use*` hook. Everything else turns on whether the extra statements are worth their file, which no pattern can judge.

```yaml
R1:
  type: manual
  reason: >
    A permission, not an obligation — there is no violating shape to match. A component that holds
    no server call is conforming, and so is one that calls a wrapper that earns its place under R3.
  enforcedBy: null
R2:
  type: grep
  pattern: "export const use\\w+ = [^{]*=>\\s*use(?!Memo|Callback|State|Ref|Effect|LayoutEffect|Context|SyncExternalStore|Reducer)[A-Z]\\w*\\("
  include: ["apps/web/src/features/**/hooks/*.ts", "apps/web/src/components/**/*.ts", "apps/web/src/lib/hooks/*.ts"]
  exempt: ["apps/web/src/queries/**", "apps/web/src/mutations/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Run with rg -nUP. Flags an expression-bodied hook that forwards a store or context hook rather
    than a server-state hook, and a legitimate wrapper that pins a non-trivial argument set or
    enabled condition inline. Misses the commoner shape: a block body with one const, a rename or a
    `?? []` default before the return. Treat a match as a prompt to read the file, never as a
    finding on its own.
R3:
  type: manual
  reason: >
    "Earns its place" is a judgement about whether the extracted work would otherwise be repeated
    or would clutter the component.
  enforcedBy: null
R4:
  type: manual
  reason: >
    Covered structurally by tdr/one-hook-per-file.md; repeated here only so the wrapper case is not
    read as an exception to it.
  enforcedBy: null
R5:
  type: manual
  reason: "Requires reading every call site to see whether the pinned arguments are in fact shared."
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** the call site shows what data a component depends on without a second file to open; the dependency is visible in the component's own imports.
- **Good, because** the wrapper layer stays small enough that every file in a `hooks/` directory is worth reading — each one is there for a reason a reader can name.
- **Good, because** React Query's cache deduplicates repeated calls, so calling the same hook from several components (`useSessionWeather` from `WeatherCard`, `useSessionColorModes` and `useSessionDetailPath`) costs nothing at runtime and needs no hoisting to be shared.
- **Bad, because** knowledge of a call — its argument shape, its `enabled` condition — is scattered across every component that makes it, so changing that call's signature touches many files at once, which a single wrapper would have contained to one.
- **Bad, because** the line between "pins ambient arguments worth extracting" and "pass-through" is a judgement, and two reviewers can place it differently for the same hook.
- **Neutral, because** promoting a direct call into a wrapper later is mechanical: the criterion in R3 is also the trigger, so the first component that needs derivation creates the wrapper and the rest follow.

## 5. Reference implementation

A component calling the server-state hook itself, with the small shaping it needs kept inline — `apps/web/src/features/intervals/IntervalsConnectionForm.tsx:57`:

```tsx
const keyCheck = useIntervalsKeyCheck(candidateKey, storedKey);
```

The hook it calls owns its `enabled` and `retry` conditions, so there is no wrapper between them — `apps/web/src/features/intervals/hooks/useIntervalsKeyCheck.ts:12-20`:

```ts
export const useIntervalsKeyCheck = (apiKey: string, savedKey: string | null) => {
  return useQuery({
    queryKey: intervalsVerifyQueryKey(apiKey),
    queryFn: () => verifyIntervalsKeyOrThrow(apiKey),
    enabled: apiKey !== '' && apiKey !== savedKey,
    retry: false,
    staleTime: Infinity,
  });
};
```

A wrapper that earns its place under R3 — it coordinates the weather query with thresholds and a store selection and derives memoised colour-mode options from them — `apps/web/src/features/sessions/session/hooks/useSessionColorModes.ts:10-13`:

```ts
export const useSessionColorModes = (session: TrainingSession, records: SessionRecord[]) => {
  const thresholds = useThresholdsAt(session.date);
  const chosen = useMapPreferencesStore((s) => s.bySport[session.sport].colorMode);
  const weather = useSessionWeather(session.id, session.date, session.duration);
```

## 6. Forbidden practices

- ❌ The pass-through wrapper — a `hooks/useX.ts` whose body is `return useXQuery(props);` and nothing else. It adds a file, an import and a jump, and hides which server call the component actually makes.
- ❌ The cosmetic wrapper: a hook that calls one server-state hook and returns it with only a rename, a destructure, or a `?? []` default applied. That shaping belongs at the call site until a second caller needs the same shaping.
- ❌ One wrapper hook per component, created for symmetry with sibling features rather than because the component's data access needed anything.
- ❌ A facade hook that re-exports several server-state hooks so components import from one place — it defeats one-server-call-per-hook-module and makes the dependency graph unreadable.
- ❌ Moving a call into a wrapper solely to keep a component short. A wrapper is justified by the work it does, not by the lines it removes.
