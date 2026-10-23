---
kind: pattern-apply-tdr-reference
id: classes-are-server-side-only
title: No classes in app code; units are arrow functions, hooks and plain objects
summary: apps/web/src declares no class to hold state, group behaviour or be injected and has no React class components; state that outlives a render lives in the store, a context provider or a useRef, and an Error subclass is the one sanctioned class.
governs:
  - "apps/web/src/**/*.ts"
  - "apps/web/src/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# No classes in app code; units are arrow functions, hooks and plain objects

## 1. Context

This file carries rules R1–R5.

PaceVault is a client-only SPA: there is no server layer whose lifecycle could own an instance (one per request, constructed and torn down at known points). In the browser React decides when a component renders, re-renders and unmounts, and an object holding state across those boundaries has to be re-synchronised by hand with props, effects and cleanup. So `apps/web/src` has no classes: its units are exported arrow functions, hooks and factories returning plain objects, and state that must outlive a render lives in a Zustand store (`apps/web/src/store/`), a React context provider or a `useRef`. The code holds this today — `apps/web/src` declares no class at all, and the error boundaries are `react-error-boundary`'s `ErrorBoundary` component (`apps/web/src/main.tsx:41-50`).

Module-level caches that hold no React state are not instances in the sense of R3 and stay where they are: the decoded track geometry memo `pathCache` (`apps/web/src/features/map/hooks/types.ts:6`), the IndexedDB connection `dbPromise` (`apps/web/src/lib/db.ts:42`) and the `pendingWrite` chain inside `createGuardedSessionsStorage` (`apps/web/src/lib/guardedSessionsStorage.ts:54`). The one module-level store-like singleton, `apps/web/src/lib/debug/crashSignal.ts:3-4` (a mutable `crashTarget` plus a listener `Set` read through `useSyncExternalStore`), is a hand-rolled second store and the one known R3 violation; moving it into a store is tracked in the backlog item `conventions-follow-ups`, not in a migration plan.

Test doubles under `apps/web/tests/` (`FakeWorker` in `apps/web/tests/features/map/hooks/useGpsBackfill.integration.test.ts:11`) stand in for a platform class and are out of scope.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Under `apps/web/src`, do not declare a class to hold state, to group behaviour, or to be injected as a collaborator. Express the unit as an exported arrow function, a hook, or a factory returning a plain object. | manual |
| R2 | Under `apps/web/src`, do not write React class components. A component is an arrow function; lifecycle and local state come from hooks, and error boundaries come from `react-error-boundary`. | manual |
| R3 | State that must survive a render lives in a Zustand store under `apps/web/src/store/`, a context provider, or a `useRef` — not in a module-level instance or a singleton. | manual |
| R4 | An `Error` subclass is the one sanctioned class: subclassing `Error` is the only way to carry typed fields through a `throw`. Its shape is `tdr/domain-error-subclasses.md`. | manual |
| R5 | A pure computation may be a class only when it is stateless with respect to React: constructed from its inputs at the point of use inside a `useMemo`/`useRef`, consumed immediately, never stored in component state, never shared between components, and holding no reference to a store, the query client or the DOM. Prefer a plain function; reach for this shape only when the computation has several interdependent private steps over one fixed input set. | manual |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "^[[:space:]]*(export )?(default )?(abstract )?class "
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Flags the sanctioned Error subclasses of R4 and the pure-computation shape of R5, which a
    reviewer triages by hand: a hit that extends Error is allowed outright, any other hit needs its
    call site read. Misses a class expression assigned to a const.
R2:
  type: grep
  pattern: "extends (React\\.)?(Pure)?Component\\b"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    An interface extending a props type whose name ends in Component is wrongly flagged. A class
    component written against an aliased import of Component is missed.
R3:
  type: manual
  reason: >
    Whether a piece of state must survive a render needs the component tree around it. A
    module-level mutable object and a legitimate module-level cache are syntactically identical;
    only intent separates them.
  enforcedBy: null
R4:
  type: manual
  reason: >
    A carve-out, not a constraint: it has no failing condition of its own and exists so a reviewer
    does not report the Error subclasses that R1 surfaces.
  enforcedBy: null
R5:
  type: manual
  reason: >
    Whether an instance is constructed and discarded or retained across renders is a data-flow
    property of the call site. Requires reading the hook that constructs it.
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** nothing in the app can acquire a lifecycle React does not manage, and a reader seeing `new` on a project type in an app file knows to look twice.
- **Good, because** units are trivially testable and tree-shakeable — an arrow function with explicit arguments has no construction step to arrange and no instance to reset between tests.
- **Bad, because** the app gives up real encapsulation. A closure over private variables is the only privacy available, and the moment a unit needs both private state and several public operations, the choice is a hook returning a bag of callbacks (which leaks its internals through its return type) or a factory. Private fields and a clean public surface are not on offer.
- **Bad, because** polymorphism has to be rebuilt each time: a discriminated union plus an exhaustive switch, or a map of handler functions — more code, and the "add a case" obligation is spread across call sites rather than concentrated in one subclass.
- **Neutral, because** the stores and context providers absorb what instances would otherwise have held. State that would have been private to an object becomes a named store visible to the whole app, easier to inspect in devtools and harder to keep small.
- **Neutral, because** the boundary is a convention, not a build constraint. Nothing in the toolchain stops an app file declaring a class; the rule holds because reviewers hold it.

## 5. Reference implementation

A factory returning a plain object instead of a class with private state — `apps/web/src/lib/guardedSessionsStorage.ts:50-57`:

```ts
export const createGuardedSessionsStorage = (guard: {
  canWrite: () => boolean;
  onNewerVersion: () => void;
}): StateStorage & { flush: () => Promise<void> } => {
  let pendingWrite: Promise<void> = Promise.resolve();

  return {
    getItem: (name) => idbStorage.getItem(name),
```

State that outlives a render in a store, changed through intent-named actions — `apps/web/src/store/chartHover.ts:12-24`:

```ts
export const useChartHoverStore = create<ChartHoverState>()(
  immer((set) => ({
    hoveredX: {},
    setChartHover: (group, x) =>
      set((draft) => {
        draft.hoveredX[group] = x;
      }),
    clearChartHover: (group) =>
      set((draft) => {
        draft.hoveredX[group] = null;
      }),
  })),
);
```

An error boundary from the library instead of a class component — `apps/web/src/main.tsx:41`:

```tsx
<ErrorBoundary FallbackComponent={RootErrorFallback}>
```

## 6. Forbidden practices

- ❌ A "manager", "service" or "controller" class instantiated once at module scope and imported for its methods — a singleton with hidden state that React cannot invalidate, that survives navigation and leaks between tests in the same file.
- ❌ A React class component, or an error boundary written as one while `react-error-boundary` is available — it reintroduces `this`, lifecycle methods and a second mental model for state alongside hooks.
- ❌ Holding a class instance in `useState` or in a store — the instance becomes state React compares by reference, so mutating it produces no re-render while replacing it discards accumulated state.
- ❌ A class that reads a store, the query client or the DOM from inside its methods — it hides a dependency the call site cannot see or substitute.
- ❌ Subclassing a class to vary behaviour — pass the varying behaviour in as a function, or model the variants as a discriminated union.
