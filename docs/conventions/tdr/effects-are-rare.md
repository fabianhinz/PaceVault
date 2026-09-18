---
kind: pattern-apply-tdr-reference
id: effects-are-rare
title: An effect only synchronises with something outside React
summary: useEffect is reserved for synchronising with a system React does not render; anything computable from props, state or store reads is computed during render instead.
governs:
  - "src/**/*.tsx"
  - "src/**/*.ts"
adopted_rules: [R1, R2, R3, R5, R6, R7]
adopted: 2026-09-17
---

# An effect only synchronises with something outside React

## 1. Context

This file carries R1, R2, R3, R5, R6 and R7.

An effect is the escape hatch into systems React does not render: event sources, timers, imperative DOM and browser APIs (geolocation, media queries, the file input), the MapLibre instance, the service worker, IndexedDB, a web worker's message channel, and the Zustand stores. Everything else already has a home — server data arrives through React Query hooks, shared state lives in a store, and anything computable from props, state or a store read is computed during render. When those routes are bypassed and an effect copies a value into state instead, the component renders once with a stale value before correcting itself, the copy silently diverges from its source, and the reason for the extra render becomes invisible to the next reader.

One rule of the original is Moot here and is not carried: it named a hook-utility library's purpose-built hooks as the preferred alternative to a hand-rolled effect, and this project has no such library.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Write an effect only to synchronise with something outside React: an event source or subscription, a timer, an imperative DOM/browser API, the map instance, a worker channel, IndexedDB, or a Zustand store. Name the external system in the hook's own name. | manual |
| R2 | Never write an effect whose body is only a state setter fed by props, other state or store data, with or without a guard. Compute the value during render, memoise it, or key the subtree to reset it. | proposed |
| R3 | Never load or trigger asynchronous data work from an effect. Reading goes through a query hook; writing goes through a mutation or a store action invoked from an event handler. | proposed |
| R5 | An effect that registers with an external system returns a cleanup that unregisters it — a listener removed, a timer cleared, a map handler detached, a store entry reset. | proposed |
| R6 | When an effect is a unit's whole purpose, it lives in its own module named `use<Thing>Effect` returning `void` — never inline in a component that also renders markup. | proposed |
| R7 | Dependency arrays list every reactive value the effect reads. | proposed |

## 3. Detection

```yaml
R1:
  type: manual
  reason: >
    Whether an effect's body touches a system outside React is a reading of what it calls, not a
    pattern over the call site.
  enforcedBy: null
R2:
  type: grep
  pattern: "useEffect\\(\\(\\) => \\{\\s*(if \\([^)]*\\) \\{\\s*)?set[A-Z][A-Za-z0-9]*\\("
  include: ["src/**/*.tsx", "src/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A setter that publishes a value read *from* an external system — a measured size, a geolocation
    fix — is R1's correct shape and matches this pattern anyway. Read the setter's argument: if it
    comes from props, state or a store, it is a violation.
R3:
  type: grep
  pattern: "useEffect\\([\\s\\S]{0,200}(await |\\.then\\(|fetch\\()"
  include: ["src/**/*.tsx", "src/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    An effect awaiting an imperative browser API it is synchronising with — an IndexedDB open, a
    service-worker registration — is R1's correct shape, not a data load.
R5:
  type: manual
  reason: >
    Pairing each registration inside an effect with an unregistration in its returned cleanup is a
    per-effect reading; a pattern cannot tell which calls need undoing.
  enforcedBy: null
R6:
  type: glob
  pattern: "a component module whose only statement besides its return is a useEffect call"
  include: ["src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Needs a reader to judge "whole purpose"; a component with one effect and substantial markup is
    not in scope.
R7:
  type: lint
  pattern: "react-hooks/exhaustive-deps"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    The rule is configured at `warn` in `vite.config.ts`, so it reports but does not fail. Until
    that is raised to `error`, treat its output as advisory.
```

## 4. Trade-offs

- **Good, because** a component renders the right thing on its first pass instead of rendering a stale value and correcting itself, which removes a whole class of flicker.
- **Good, because** the remaining effects are all about something outside React, so `useEffect` in a diff is a signal worth reading rather than noise.
- **Bad, because** replacing a prop-to-state copy with a `key` on the subtree moves the reset into the parent, where it is less obvious that it is a reset at all — the mechanism is correct and the intent is harder to see.
- **Bad, because** "compute during render" can mean recomputing something expensive every render, so R2 sometimes trades an effect for a `useMemo` and a dependency list.
- **Neutral, because** extracting an effect into a `use*Effect` module adds a file for something that was three lines inline.

## 5. Reference implementation

An effect that synchronises with an external system, in its own module, with cleanup:

```ts
export const useWatchPositionEffect = (): void => {
  useEffect(() => {
    const id = navigator.geolocation.watchPosition((pos) => {
      useGeolocationStore.getState().setPosition(pos.coords);
    });
    return () => navigator.geolocation.clearWatch(id);
  }, []);
};
```

The replacement for a prop-to-state copy — the parent keys the subtree, the child seeds from props:

```tsx
<TripFormBody key={props.trip?.id ?? 'new'} trip={props.trip} />
```

```ts
const [name, setName] = useState(props.trip?.name ?? '');
```

## 6. Forbidden practices

- ❌ An effect whose body is `if (props.open) { setX(props.x); }` — it renders the stale value first and the copy diverges from its source thereafter.
- ❌ Loading data in an effect and parking it in local state; that is what a query hook is for.
- ❌ Registering a listener, a timer or a map handler with no cleanup — the second mount runs both.
- ❌ An inline effect in a component that also renders markup, when the effect is the only reason the component exists.
- ❌ Trimming a dependency array to stop an effect re-running. The missing dependency is the bug; the loop is the symptom.
