---
kind: pattern-apply-tdr-reference
id: effects-are-rare
title: An effect only synchronises with something outside React
summary: useEffect is only for external systems (DOM, browser APIs, timers, the map, an external store); derived state is computed during render, I/O goes through read and write modules, react-use hooks replace hand-rolled listeners and timers, and every effect lives in a use<Thing>Effect module named for that system.
governs:
  - "apps/web/src/**/*.ts"
  - "apps/web/src/**/*.tsx"
  - "packages/ui/src/**/*.ts"
  - "packages/ui/src/**/*.tsx"
  - "tools/workbench/site/src/**/*.ts"
  - "tools/workbench/site/src/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# An effect only synchronises with something outside React

## 1. Context

This file carries rules R1–R7.

The rules also bind `packages/ui` (`packages/ui/src`, specs in `packages/ui/tests`); where the text below names an `apps/web` path, the kit's counterpart is meant: an extracted effect hook goes in `packages/ui/src/hooks/`, and `react-use` is added to `packages/ui` when a kit hook uses it.

An effect is the app's escape hatch into systems React does not render: DOM and browser APIs (listeners, geolocation, `ResizeObserver`), timers and animation frames, the MapLibre/deck.gl map instance, Web Workers, and the zustand stores the map reads from outside the route subtree. Everything else already has a home — I/O (IndexedDB, Open-Meteo, intervals.icu) goes through the read and write modules in `apps/web/src/queries/` and `apps/web/src/mutations/`, shared client state lives in the stores, and anything computable from props, state or query results is computed during render. When those routes are bypassed and an effect copies a value into state, the component renders once with a stale value before correcting itself, the copy silently diverges from its source, and the reason for the extra render becomes invisible. A read module that caches what an effect loaded is invalidated by every write to the same data, so the cache never outlives the stored value.

The codebase carries no code comments, so the reason an effect exists is stated by its module name: every effect lives in a `use<Thing>Effect` hook (or inside a hook that returns a value derived from that system) whose name names the external system. Scope: modules under `apps/web/src`. Tests and the workbench tools are out of scope.

The rules bind the board island of `tools/workbench` (`tools/workbench/site/src/`) as well, whose effects live in `site/src/app/hooks/`.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Write an effect only to synchronise with something outside React: a DOM/browser API or listener, a timer or animation frame, the map instance, a worker, or an external store. State the external system in the name of the hook that holds the effect (`useWatchPositionEffect`, `useOverscrollLockEffect`); never in a comment. | manual |
| R2 | Never write an effect whose body is only a state setter fed by props, other state or query data, with or without a guard. Compute the value during render, memoise it, adjust state during render on a prop change (`if (props.open !== seededOpen) { ... }`), or key the subtree to reset it. | proposed |
| R3 | Never load or trigger I/O from an effect. Reading goes through a read hook in `apps/web/src/queries/` (gated with `enabled` for background jobs, and invalidated or removed by every write to the data it caches); writing goes through a mutation from `apps/web/src/mutations/` invoked from an event handler. | proposed |
| R4 | Prefer the `react-use` hook over a hand-rolled effect: `useEvent` and `useKeyPressEvent` for listeners, `useInterval` and `useTimeoutFn` for timers, `useMeasure` for element size, `useDebounce` for debouncing, `useEffectOnce` for mount-only work, `useUpdateEffect` to skip the first render. Keep a raw effect only where the hook cannot express the case (a passive-false listener on a ref-reached element, several listeners registered as one unit, an animation-frame loop). | proposed |
| R5 | An effect that registers with an external system returns a cleanup that unregisters it, including toasts or store entries it set. | proposed |
| R6 | When an effect is a unit's whole purpose, it lives in its own module named `use<Thing>Effect` returning `void` — never inline in a component that also renders markup. | proposed |
| R7 | Dependency arrays list every reactive value the effect reads. | proposed |

## 3. Detection

```yaml
R1:
  type: manual
  reason: >
    Whether a given effect targets a system outside React is a judgement about the call it makes.
    The forbidden shapes are covered by R2, R3 and R4; a reviewer reads R1 for anything those miss.
  enforcedBy: null
R2:
  type: grep
  pattern: 'useEffect\(\(\) => \{\s*(?:if \([^{;]*\) \{\s*)?set[A-Z]\w*\([^;]*\);\s*\}?\s*\},\s*\['
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Run with `rg -nUP`. Flags a setter that belongs to an external system rather than to React.
    Misses a mirror spread over several setters (the dialog seeding effects) and setters reached
    through `useXStore.getState().setY(...)`; grep `getState\(\)\.set` inside effects and read each.
R3:
  type: grep
  pattern: 'useEffect\(\(\) => \{(?:(?!\},\s*\[)[\s\S]){0,600}?(?:\.mutate\(|\bfetch\(|get[A-Z]\w*\(|\.then\()'
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Run with `rg -nUP`. Flags `getBoundingClientRect()`-style DOM reads; check whether the call is
    one of `apps/web/src/lib/storage/db.ts`, `apps/web/src/lib/api/weather.ts`
    or `apps/web/src/lib/api/intervals.ts`. Misses I/O hidden behind a feature helper
    (`reprocessOutdatedSessions()`) and bodies longer than the window. For the invalidation half,
    read each caller of a write helper in `apps/web/src/lib/storage/` or `lib/api/` and confirm the flow invalidates or
    removes the read modules that cache the same data.
R4:
  type: grep
  pattern: 'useEffect\(\(\) => \{(?:(?!\},\s*\[)[\s\S]){0,600}?(?:addEventListener\(|setInterval\(|new ResizeObserver\()'
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Run with `rg -nUP`. Flags the accepted raw cases listed in R4 (map canvas touchend listener,
    file-drop listeners).
R5:
  type: grep
  pattern: '(addEventListener\(|setInterval\(|setTimeout\(|requestAnimationFrame\(|watchPosition\(|addToast\()'
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A file-level candidate list, not a verdict: a reviewer confirms each registration inside an
    effect has its matching remove/clear/cancel reachable from the same effect's cleanup.
R6:
  type: grep
  pattern: 'useEffect\('
  include: ["apps/web/src/**/*.tsx", "packages/ui/src/**/*.tsx", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: ["apps/web/src/**/hooks/**", "apps/web/src/**/use*.tsx"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Any effect inline in a component module is a violation. Also run
    `rg -n "^export const use\w*Effect" apps/web/src` and confirm each `*Effect.ts` module exports
    the matching hook annotated `: void`.
R7:
  type: lint
  pattern: "react-hooks/exhaustive-deps"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Configured as `warn` in the root `vite.config.ts` lint override today, so `vp check` reports but
    does not fail; raising it to `error` is a tooling proposal.
```

## 4. Trade-offs

- **Good, because** the value a component renders has one source. Deriving during render cannot go stale, cannot render a wrong first frame, and cannot drift from what it was derived from.
- **Good, because** naming the external system in the hook's name turns the effect's reason for existing into something a reader sees before opening the file, and gives every effect a seam independent of the component that renders.
- **Bad, because** the escape hatch is real and the boundary is a judgement call. Publishing a route-scoped value into the store the map reads is indistinguishable in shape from the mirror R2 forbids, so R2 will flag correct code and a reviewer has to overrule it. A contributor who reads the rule as "no effects" reaches for a worse workaround instead.
- **Bad, because** extracting every effect into its own module multiplies small files and adds a hop between the component and the behaviour that affects it.
- **Bad, because** a cached read module is only as fresh as its invalidation: a write path that forgets to invalidate shows stale data until reload, where the effect it replaced read again on every mount.
- **Neutral, because** leaning on `react-use` trades hand-written lifecycle code for a dependency on its semantics; upgrading the library becomes a behavioural change rather than a version bump.

## 5. Reference implementation

A justified effect — it writes into a store the map reads from outside the route subtree, and clears it on unmount:

```ts
export const useTripMapFocusEffect = (sessionIds: string[] | undefined): void => {
  useEffect(() => {
    useMapFocusStore.getState().setFocusedTripSessions(sessionIds ?? []);
    return () => {
      useMapFocusStore.getState().setFocusedTripSessions([]);
    };
  }, [sessionIds]);
};
```

A listener and a debounce through the purpose-built hooks instead of hand-rolled effects:

```ts
useKeyPressEvent('Escape', () => useMapControlsStore.getState().closeSelectedLap());

useDebounce(() => setDebounced(value), delayMs, [value]);
```

The mirror and the reset it replaces, and the forms they become:

```tsx
const groupBy = useFiltersStore((s) => s.loadChartGroupBy);
const isGroupingDisabled = axis.days !== null && axis.days.count <= 7;
const effectiveGroupBy: LoadGroupBy = isGroupingDisabled ? 'day' : groupBy;

const [seededOpen, setSeededOpen] = useState(false);
if (props.open !== seededOpen) {
  setSeededOpen(props.open);
  if (props.open) setName(props.route.name);
}

const sessionRecords = useSessionRecords({ sessionId, enabled });
const records = sessionRecords.data ?? NO_RECORDS;
```

A cached read invalidated by the write that changes its data:

```ts
await saveStudioRoutePoints(id, geometry.points);
await invalidateStudioRoutePoints(meta.queryClient, { routeId: id });
```

## 6. Forbidden practices

- An effect whose body is `setX(<something derived from props, state or query data>)`, guarded or not — compute it during render.
- An effect that writes a derived value back into a store so the same component can read it again (`setLoadChartGroupBy('day')` when the range is short) — derive the effective value instead.
- An effect that resets or seeds local form state when a prop flips — adjust state during render or key the subtree.
- An effect that reads IndexedDB, calls Open-Meteo or intervals.icu, then stores the response in local state — that is a read module.
- An effect that calls a mutation or a writing helper (`reprocessOutdatedSessions()`, `recomputeTrainingLoad()`), so that rendering causes a write. Background jobs are gated read modules; user writes run from event handlers.
- A write to stored data that leaves a read module caching the same data untouched — invalidate or remove its queries in the same flow.
- A hand-rolled `addEventListener` / `removeEventListener`, `ResizeObserver`, `setTimeout` debounce or re-arming timer effect where a `react-use` hook exists.
- An effect that registers, subscribes or sets a toast and returns nothing.
- An effect left inline in a component that also renders markup.
- A comment explaining why an effect exists; the hook's name says it.
