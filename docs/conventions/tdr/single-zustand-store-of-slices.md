---
kind: pattern-apply-tdr-reference
id: single-zustand-store-of-slices
title: "Store state: initial state as a value, narrow selections, draft writes"
summary: A store whose initial state is restated by a test reset or a reset action exports it as INITIAL_<NAME>_STORE_STATE; components select the narrowest value (useShallow for built objects, never the whole store); writes mutate the Immer draft, never return a spread copy.
governs:
  - "apps/web/src/store/*.ts"
  - "apps/web/src/**/*.ts"
  - "apps/web/src/**/*.tsx"
adopted_rules: [R5, R9, R10]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Store state: initial state as a value, narrow selections, draft writes

## 1. Context

This file carries rules R5, R9 and R10.

The app keeps one Zustand store per scope, each in its own module `apps/web/src/store/<name>.ts` with its own `create`, its persist key `store-<name>` and its actions inside the store, called through `use<Name>Store.getState()` (`apps/web/src/store/CLAUDE.md`). This record does not change that layout. It fixes three things inside it: how a store's defaults are shared with the code that resets them, how components read state, and how actions write it.

A store's initial state is restated wherever something resets it: the global test reset in `apps/web/tests/setup.ts`, a spec's `beforeEach`, or a reset action of the store itself. Each restatement is a copy that drifts when a field is added. Exporting the defaults as a value gives every reset one source. Reads go through a selector because a store hook re-renders its component whenever the selected value changes by reference: selecting the whole store re-renders on every write, and a selector that builds a fresh object re-renders on every write unless `useShallow` compares it by members. Writes mutate the Immer draft, because the stores run under the `immer` middleware and a spread copy both bypasses it and silently drops nested changes made earlier in the same recipe.

Scope: every store module in `apps/web/src/store/` and every component or hook in `apps/web/src` that reads one. Server state in TanStack Query is out of scope.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R5 | When a store's initial state is restated elsewhere — by `apps/web/tests/setup.ts`, a spec's `beforeEach`, or one of the store's own reset actions — export it from the store module as a module-level `INITIAL_<NAME>_STORE_STATE` constant (`<NAME>` is the module name in SCREAMING_SNAKE, `mapPreferences.ts` → `INITIAL_MAP_PREFERENCES_STORE_STATE`), typed as the data fields of the state interface (`Pick<<Name>State, …>`), and spread it as the first entry of the object the creator returns. Every full reset uses the constant. A store whose initial state nothing restates has no constant. | manual |
| R9 | Read state in components and hooks with `use<Name>Store(selector)`, selecting the narrowest value needed. Wrap the selector in `useShallow` from `zustand/react/shallow` whenever it builds a new object or array. Never call a store hook without a selector, and never select the whole state. | manual |
| R10 | Mutate the Immer draft in place inside `set`; never return a spread copy of state. | manual |

## 3. Detection

```yaml
R5:
  type: grep
  pattern: "export const INITIAL_[A-Z0-9_]+_STORE_STATE"
  include: ["apps/web/src/store/*.ts"]
  exempt: []
  violationWhen: count-differs
  enforcedBy: null
  falsePositives: >
    Compare the hits against the stores reset in apps/web/tests/setup.ts and in the `beforeEach`
    blocks of apps/web/tests/store/*.spec.ts, plus stores with a reset action that restates every
    data field. A second signal: `use[A-Z]\\w*Store\\.setState\\(\\s*\\{` or
    `resetStateKeepingActions\\(\\w+, \\{` inside a reset block is a restated literal. A test that
    seeds specific state with setState is not a reset and is not a finding.
R9:
  type: grep
  pattern: "use[A-Z]\\w*Store\\(\\s*\\)|use[A-Z]\\w*Store\\(\\s*\\(\\w+\\) => (\\(\\{|\\[)"
  include: ["apps/web/src/**/*.tsx", "apps/web/src/**/*.ts"]
  exempt: ["apps/web/src/store/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Run multi-line (`rg -nU`); a formatter-wrapped selector is otherwise missed. A selector
    already wrapped in `useShallow` does not match, which is correct. A block-bodied selector
    (`(s) => { … }`) does not match and needs a read: returning a stored reference
    (`return s.bySport[sport]`) is fine, building an object or array is a finding. An identity
    selector (`(s) => s`) and a selector extracted to a named const escape the pattern.
R10:
  type: grep
  pattern: "=> \\(\\{ \\.\\.\\.(state|s|store|draft)\\b"
  include: ["apps/web/src/store/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A spread that builds an unrelated object inside an action (`sessionsData.map((s) => ({ ...s,
    createdAt }))`) matches the `s` alternative and is not a state copy; read each hit. A spread
    inside a draft assignment (`draft.x = { ...draft.x, y }`) is legal under Immer and does not
    match. The partial-object form `set({ field: value })` is a replace, not a spread copy, and is
    not a finding.
```

Nothing in this project's toolchain enforces any of this; oxlint has no rule on store selectors or Immer recipes.

## 4. Trade-offs

- **Good, because** a store's defaults live in one place: the global test reset, a spec's `beforeEach` and the store's own reset action all read the same constant, so a new field is reset everywhere the moment it is added.
- **Good, because** a narrow selector makes a component's dependency on the store visible at the call site and limits its re-renders to the fields it reads.
- **Good, because** draft mutation is the one write style the `immer` middleware is there for; a reader finds the same recipe shape in every action.
- **Bad, because** the constant is typed with `Pick<<Name>State, …>`, which lists the data fields a second time beside the interface; a field added to the interface but not to the `Pick` fails to compile only where the constant is spread.
- **Bad, because** `useShallow` is easy to forget on an object-building selector, and nothing but review catches it; the symptom is extra renders, not an error.
- **Neutral, because** a full reset through the constant also resets fields a spec used to leave alone; that is stronger isolation, not a behaviour change of the app.

## 5. Reference implementation

`apps/web/src/store/trips.ts`:

```ts
export const INITIAL_TRIPS_STORE_STATE: Pick<TripsState, 'trips'> = {
  trips: [],
};

export const useTripsStore = create<TripsState>()(
  immer(
    persist(
      (set) => ({
        ...INITIAL_TRIPS_STORE_STATE,
        deleteTrip: (id) =>
          set((draft) => {
            draft.trips = draft.trips.filter((t) => t.id !== id);
          }),
        clearAll: () => set(INITIAL_TRIPS_STORE_STATE),
      }),
      {
        name: 'store-trips',
        storage: createJSONStorage(() => idbStorage),
        skipHydration: true,
        version: 1,
      },
    ),
  ),
);
```

`apps/web/tests/store/trips.spec.ts`:

```ts
beforeEach(() => {
  useTripsStore.setState(INITIAL_TRIPS_STORE_STATE);
});
```

Call sites:

```tsx
const trips = useTripsStore((s) => s.trips);
const tripCount = useTripsStore((s) => s.trips.length);
const editor = useStudioMarkerEditorStore(
  useShallow((s) => ({ open: s.open, routeId: s.routeId, markerId: s.markerId })),
);
useTripsStore.getState().deleteTrip(props.trip.id);
```

## 6. Forbidden practices

- ❌ Restating a store's initial values as an object literal in `apps/web/tests/setup.ts`, a spec's `beforeEach` or a reset action when the store exports `INITIAL_<NAME>_STORE_STATE` — the copy drifts on the next added field.
- ❌ Declaring the initial values inline in the creator while something else restates them — the reset needs them by value.
- ❌ Calling a store hook without a selector (`useStudioMarkerEditorStore()`), selecting the whole state (`(s) => s`), or returning a fresh object or array from a selector without `useShallow` — each re-renders the component on every write to the store.
- ❌ `set((s) => ({ ...s, field }))` — a spread copy of state instead of a draft mutation.
