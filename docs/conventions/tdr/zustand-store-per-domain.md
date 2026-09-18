---
kind: pattern-apply-tdr-reference
id: zustand-store-per-domain
title: One store per domain, with a declared initial state and labelled writes
summary: Each domain owns one Zustand store created in exactly one module, exporting its initial state as a constant, with a fixed middleware stack and an action label on every write.
governs:
  - "src/store/**/*.ts"
  - "src/components/ui/toastStore.ts"
  - "src/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7, R8]
adopted: 2026-09-17
---

# One store per domain, with a declared initial state and labelled writes

## 1. Context

This file carries R1–R8.

Client state lives in Zustand stores, one per domain, each created in exactly one module under `src/store/` — plus `src/components/ui/toastStore.ts`, which is the state half of the `Toast` component and belongs with it. A feature does not create its own store; it uses the domain store that owns the state, or a context provider when the state is scoped to one subtree and meaningless outside it.

This record is the structural half of that arrangement: how a store is declared, how its defaults are reachable, what its middleware stack is, how a write is labelled, and how a component reads. It is deliberately the inverse of the single-store-of-slices arrangement it was adapted from — PaceVault's per-domain split is a decision recorded in `src/store/CLAUDE.md`, and the rules that existed only to make one global store work have been dropped rather than carried.

Deliberately out of scope, because `src/store/CLAUDE.md` already fixes them: persistence configuration, persist key format, scope-clear action naming, and the requirement that state transitions, persistence logic and derived computations are tested. Also out of scope: server state, which belongs in React Query and must not be mirrored into a store.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Call `create` from `zustand` in exactly one module per domain, under `src/store/`. Feature code never creates a store. Subtree-scoped state belongs in a context provider; anything else belongs to the domain store that owns it. | proposed |
| R2 | Name the store module after its domain in camelCase, and name the exported hook `use<Domain>Store`. One store per module. | proposed |
| R3 | Export the store's defaults as a module-level `INITIAL_<DOMAIN>_STATE` constant typed by the state shape, and spread it as the first entry of the object the creator returns. Actions and specs reset to it by value rather than restating it. | proposed |
| R4 | Keep the middleware stack fixed and identical across stores: `devtools` outermost, then `persist` where the store persists, then `immer` innermost so the creator writes a draft. | proposed |
| R5 | Pass a devtools action label as the third argument of every `set` / `setState` call. Inside a creator, use the action's own name; in a separate actions module, derive it from a module-local `getActionKey`. | proposed |
| R6 | Put write logic that a creator cannot express without `get()` inside the creator; anything else may move to a `<domain>/actions/` module as module-private functions collected into one exported object that writes through `use<Domain>Store.setState`. | manual |
| R7 | Read state in components with `use<Domain>Store(selector)`, selecting the narrowest value needed. Wrap the selector in `useShallow` from `zustand/react/shallow` whenever it returns an object, array or `Map`. Call actions at the call site through `use<Domain>Store.getState().action()`, not through a selector. | proposed |
| R8 | Mutate the Immer draft in place inside `set` / `setState`; never return a spread copy of state. | proposed |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "\\bcreate(Store)?\\s*[<(]"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["src/store/**", "src/components/ui/toastStore.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Matches any local identifier named `create`/`createStore` — `createStudioRoute`, React's
    `createContext`, `createJSONStorage`. Narrow by first requiring a `from 'zustand'` import in
    the same file; a file with no zustand import cannot violate this rule.
R2:
  type: glob
  pattern: "each src/store/*.ts exports exactly one `use<Domain>Store`"
  include: ["src/store/*.ts"]
  exempt: ["src/store/CLAUDE.md"]
  violationWhen: no-match
  enforcedBy: null
  falsePositives: "none known"
R3:
  type: grep
  pattern: "export const INITIAL_[A-Z0-9_]+_STATE"
  include: ["src/store/*.ts", "src/components/ui/toastStore.ts"]
  exempt: []
  violationWhen: no-match
  enforcedBy: null
  falsePositives: >
    A store whose state is a single nested key may name the constant after that key rather than
    the domain.
R4:
  type: grep
  pattern: "create<[A-Za-z]+>\\(\\)\\(\\s*devtools\\("
  include: ["src/store/*.ts", "src/components/ui/toastStore.ts"]
  exempt: []
  violationWhen: no-match
  enforcedBy: null
  falsePositives: >
    Cannot see the order of the inner middlewares — check `persist` and `immer` nesting by hand.
R5:
  type: grep
  pattern: "set\\(\\(draft\\) => \\{[\\s\\S]*?\\}\\)(?!,)"
  include: ["src/store/*.ts", "src/components/ui/toastStore.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Matching a third argument across a multi-line call is beyond a line-based pattern; compare the
    count of `set(` call sites against the count of string-literal third arguments as a smell test,
    then read the differences.
R6:
  type: manual
  reason: >
    Whether write logic needs `get()` is a reading of the action, not a pattern.
  enforcedBy: null
R7:
  type: grep
  pattern: "use[A-Z][A-Za-z]*Store\\(\\s*\\(s(tate)?\\) => \\{|use[A-Z][A-Za-z]*Store\\(\\s*\\(s(tate)?\\) => \\["
  include: ["src/**/*.tsx", "src/**/*.ts"]
  exempt: ["src/store/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A selector already wrapped in `useShallow` appears as `useXStore(useShallow(...))` and does not
    match, which is correct; a selector extracted to a named const escapes the pattern entirely.
R8:
  type: grep
  pattern: "=> \\(\\{ \\.\\.\\.(state|draft|s)\\b"
  include: ["src/store/*.ts", "src/components/ui/toastStore.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A spread inside a nested draft assignment (`draft.x = { ...draft.x, y }`) is legal under Immer
    and does not match, while a spread building an unrelated local object might.
```

## 4. Trade-offs

- **Good, because** a domain's state has one address, so a reader finds it from the feature's name and nothing has to be traced through a composition root.
- **Good, because** one store's write cannot re-render a component subscribed to another's, which a single intersected store cannot promise.
- **Good, because** labelled writes plus a fixed middleware stack make the devtools timeline readable, which is the only thing that helps when state is behaving strangely.
- **Bad, because** cross-domain reads have to name two stores and coordinate them by hand, where a single store would have made it one selector — `src/features/sessions/laps/LapsTab.tsx` writing derived lap data into the map-focus store is that cost showing up.
- **Bad, because** there is no single reset: a test or a "delete all data" path has to touch every store, which is exactly why R3's initial-state constant is not optional here.
- **Neutral, because** 14 stores means 14 devtools instances rather than one timeline; each is readable, and the interleaving between them is not.

## 5. Reference implementation

```ts
interface TripsState {
  trips: Trip[];
  addTrip: (trip: Omit<Trip, 'id'>) => string;
}

export const INITIAL_TRIPS_STATE = {
  trips: [],
} satisfies Pick<TripsState, 'trips'>;

export const useTripsStore = create<TripsState>()(
  devtools(
    persist(
      immer((set) => ({
        ...INITIAL_TRIPS_STATE,
        addTrip: (tripData) => {
          const id = v4();
          set(
            (draft) => {
              draft.trips.push({ ...tripData, id });
            },
            undefined,
            'addTrip',
          );
          return id;
        },
      })),
      { name: 'store-trips', storage: createJSONStorage(() => idbStorage), skipHydration: true, version: 1 },
    ),
  ),
);
```

A component reads narrowly and calls actions through `getState()`:

```tsx
const trips = useTripsStore(useShallow((s) => s.trips));
const handleAdd = () => useTripsStore.getState().addTrip(draft);
```

## 6. Forbidden practices

- ❌ A `create(...)` from `zustand` outside a store module — including a "small, local, feature-only" store. Subtree-scoped state belongs in a context provider; anything else belongs to a domain store.
- ❌ Declaring a store's defaults inline in the creator instead of as an exported constant — actions and specs then reset to values they restate.
- ❌ A `set` / `setState` call with no third-argument action label; the devtools timeline degrades to anonymous entries exactly when it matters.
- ❌ A middleware stack ordered differently from its neighbours, so the same `set` behaves differently in two stores.
- ❌ Selecting the whole store (`useXStore((s) => s)`) or returning a fresh object from a selector without `useShallow` — both re-render on every unrelated write.
- ❌ Extracting an action through a selector (`const add = useTripsStore((s) => s.addTrip)`); call it through `getState()` at the call site instead.
- ❌ Copying a React Query response into a store. Server state belongs in the query cache; the store holds what the user is editing or how the UI is arranged.
- ❌ Returning a spread copy of state from `set` under the Immer middleware.
