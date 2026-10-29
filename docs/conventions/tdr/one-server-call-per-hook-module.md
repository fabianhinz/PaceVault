---
kind: pattern-apply-tdr-reference
id: one-server-call-per-hook-module
title: One server call per module, split into fetcher, key and hook
summary: Every I/O call (IndexedDB, Open-Meteo, intervals.icu) is one module under src/queries or src/mutations holding a named fetcher, a key builder and one annotated React Query hook.
governs:
  - "apps/web/src/queries/**/*.ts"
  - "apps/web/src/mutations/**/*.ts"
  - "apps/web/src/mutations/**/*.tsx"
  - "tools/workbench/site/src/app/hooks/**/*.ts"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7, R8, R9, R10, R11, R12]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# One server call per module, split into fetcher, key and hook

## 1. Context

This file carries rules R1–R12.

PaceVault has no backend, but it has I/O boundaries that behave like one: IndexedDB (`apps/web/src/lib/storage/db.ts`), Open-Meteo (`apps/web/src/lib/api/weather.ts`) and intervals.icu (`apps/web/src/lib/api/intervals.ts`). Every call React code makes across one of them is one module, and that module is the whole unit: the request, the cache key that identifies it, and the hook that binds it to React Query. Reads live under `apps/web/src/queries/<domain>/`, writes under `apps/web/src/mutations/<domain>/`, and nothing else in the app calls `useQuery`, `useInfiniteQuery` or `useMutation`. Given a call you want to change there is exactly one file to open, and given a cache entry you want to invalidate there is exactly one named builder that produces its key.

Without the split the request body, the key array and the store reads fuse into a hook body. The request then cannot be reused from `queryClient.fetchQuery`, an invalidation helper or another module without re-entering React, and the key array gets retyped at every invalidation site, where a divergent copy is a silent cache miss rather than a compile error.

Scope: modules under `apps/web/src/queries/` and `apps/web/src/mutations/`, and any module that would otherwise call a React Query hook. Out of scope: how a request is authenticated and how a failed response becomes an error (`authenticated-fetch-and-response-parsing`), how a component reaches these hooks (`components-call-server-state-hooks-directly`), and the one-hook-per-file rule they share with the rest of the app (`one-hook-per-file`). Background jobs that run as polling or gated queries (`useIntervalsSync`) are reads in this sense: they are `useQuery` hooks and live under `queries/`.

In `tools/workbench` the board island's one read (`board.read`, key builder `boardQueryKey`) and its writes run through the dev server's actions; their hooks live in `site/src/app/hooks/` and follow R1, R3, R6, R7 and R8 (`useWriteMutation`, `useUndoMutation`). R2, R4, R5 and R9–R12 name `apps/web` trees, stores and the `QueryResults` registry and have no subject there.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | One module describes exactly one I/O call. A second call — even a near-identical variant differing by a filter — gets its own module. | manual |
| R2 | Reads live under `apps/web/src/queries/`, writes under `apps/web/src/mutations/`. No module outside those two trees calls `useQuery`, `useInfiniteQuery` or `useMutation`. | proposed |
| R3 | The request is a named top-level `async` function, separate from the hook — defined in the module, or imported from the `apps/web/src/lib/storage/` or `lib/api/` module that owns the transport. Never an anonymous body inlined into `queryFn` or `mutationFn`; a forwarding arrow (`(ctx) => runIntervalsSync({ ... })`) is fine. | proposed |
| R4 | That function takes a single options object and every input is explicit in it, including ambient values such as the intervals.icu API key, the session list or the query client. It calls no hook and reads no store, so it is callable outside a render. | manual |
| R5 | The hook is the only export that touches ambient state: it reads store values (via selectors, or `getState()` inside `queryFn` when the value must be read at fetch time) and forwards them into the function. | manual |
| R6 | A read module always defines a named key builder `<name>QueryKey(...)`, even without parameters, taking the same identifying inputs as the fetcher in an options object and returning the key array. The hook and every invalidation, reset, `isFetching` or `fetchQuery` site call it; nobody writes the array inline. | proposed |
| R7 | Export the key builder and the read function whenever anything outside the module prefetches, seeds, invalidates or composes that call. Keep a write module's function module-local until a second module needs it. | manual |
| R8 | Name a read hook `use<Name>` and a write hook `use<Name>Mutation`; one hook per module, and the file is named after that hook. | proposed |
| R9 | Anything two sibling modules share — a fetcher covering several shapes of one store, a key builder, a refetch policy, a cache-shaping helper — moves into a `shared.ts` beside them, not into whichever module needed it first. | manual |
| R10 | A hook that only composes other query hooks and issues no request of its own still belongs in this tree, next to what it composes, and defines no key and no fetcher. | manual |
| R11 | Annotate the hook's return type explicitly as `UseQueryResult<QueryResults['<name>']>` / `UseMutationResult<…>`, sourcing the read payload type from the `QueryResults` registry in `apps/web/src/types.ts` rather than restating a structural type per module. | proposed |
| R12 | No barrel: these trees contain no `index.ts`, and consumers import the module path directly. | proposed |

## 3. Detection

```yaml
R1:
  type: manual
  reason: >
    Counting lib calls per module finds the gross case but not the real one — a fetcher may call
    several IndexedDB helpers for one logical read (cache lookup, records, save), and a module that
    wraps one call behind two exported hooks looks identical to a conforming one to a pattern.
  enforcedBy: null
R2:
  type: grep
  pattern: "use(Query|InfiniteQuery|Mutation)\\("
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx"]
  exempt: ["apps/web/src/queries/**", "apps/web/src/mutations/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    As written it does not match useQueryClient( or useIsFetching(, which are allowed anywhere. It
    cannot see useQuery reached through a re-export.
R3:
  type: grep
  pattern: "(queryFn|mutationFn):\\s*(async\\s*)?\\([^)]*\\)\\s*(:[^=]+)?=>\\s*\\{"
  include: ["apps/web/src/queries/**/*.ts", "apps/web/src/mutations/**/*.ts", "tools/workbench/site/src/app/hooks/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Flags a multi-line arrow that only reads ctx and forwards to the named function — conforming.
    Misses the single-expression form `queryFn: async () => (await fetch(url)).json()`.
R4:
  type: manual
  reason: >
    "Every input explicit" is a relation between the function's parameter object and what its body
    reads. A grep for `getState()` or `use[A-Z]` inside the fetcher catches the crude case only.
  enforcedBy: null
R5:
  type: manual
  reason: >
    Requires knowing which export is the hook and which is the request function, then checking that
    only the former reads stores. Cross-symbol, not a pattern.
  enforcedBy: null
R6:
  type: grep
  pattern: "queryKey:\\s*\\["
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "tools/workbench/site/src/app/hooks/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Also run `rg -n "_KEY = \\[" apps/web/src` — a constant key array exported in place of a builder
    is a violation the queryKey pattern does not see.
R7:
  type: manual
  reason: >
    Whether a symbol needs exporting depends on whether another module imports it; that is a
    whole-graph fact.
  enforcedBy: null
R8:
  type: grep
  pattern: "^export const use[A-Za-z0-9]+(?<!Mutation)\\s*="
  include: ["apps/web/src/mutations/**/*.ts", "tools/workbench/site/src/app/hooks/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "Requires a regex engine with lookbehind (`rg -P`). Does not check the read side."
R9:
  type: manual
  reason: >
    Deciding that two modules share a concern, rather than coincidentally resembling each other, is
    a design judgement.
  enforcedBy: null
R10:
  type: manual
  reason: >
    A composing hook is recognised by what it does not contain, and "no request of its own" is
    indistinguishable from "not written yet" to a pattern matcher.
  enforcedBy: null
R11:
  type: grep
  pattern: "^export const use[A-Za-z0-9]+ = \\([^)]*\\) =>"
  include: ["apps/web/src/queries/**/*.ts", "apps/web/src/mutations/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Multi-line parameter objects break the single-line match; run with `rg -U`. Says nothing about
    sourcing the payload from QueryResults, which is manual.
R12:
  type: glob
  pattern: "apps/web/src/{queries,mutations}/**/index.ts"
  include: ["apps/web/src/queries/**", "apps/web/src/mutations/**"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
```

Nothing in the root `vite.config.ts` lint block fails on any of this today. R11's annotation half is proposed for `typescript/explicit-function-return-type` in the tooling plan.

## 4. Trade-offs

- **Good, because** an I/O change is a single-file change: the store or URL, the request shape, the key and the hook that exposes it are adjacent.
- **Good, because** the request function survives outside React. `fetchQuery`, invalidation helpers and one module seeding another's cache reuse the exact function the hook uses.
- **Good, because** a named key builder makes invalidation refactor-safe: change the key's shape and every call site moves with it, instead of drifting into a silent cache miss.
- **Bad, because** three exports for one call is ceremony. A read used by exactly one component and never invalidated pays for a fetcher, a key builder and a hook where a hook alone would do.
- **Bad, because** the key builder duplicates knowledge the hook already holds: two parameter lists to keep in step, and nothing fails when one grows an argument the other ignores.
- **Bad, because** the usual justification for exporting the request function — testability without React — is not what the specs here do; the export is load-bearing for reuse, not for testing.
- **Neutral, because** the shape is mechanical enough that a new call is a copy of the nearest neighbour, which keeps the tree uniform at the cost of never being reconsidered.

## 5. Reference implementation

```ts
export const loadSessionWeather = async (options: {
  sessionId: string;
  sessionDateMs: number;
  durationSec: number;
}): Promise<QueryResults['sessionWeather']> => {
  const cached = await getSessionWeather(options.sessionId);
  if (cached) return cached;
  const records = await getSessionRecords(options.sessionId);
  const hasGps = records.some((r) => r.lat !== undefined && r.lng !== undefined);
  if (!hasGps) return null;
  if (!navigator.onLine) return null;
  const weather = await fetchSessionWeather(
    options.sessionId,
    options.sessionDateMs,
    options.durationSec,
    records,
  );
  if (!weather) return null;
  await saveSessionWeather(weather);
  return weather;
};

export const sessionWeatherQueryKey = (options: { sessionId: string }): string[] => [
  'session-weather',
  options.sessionId,
];

export const useSessionWeather = (options: {
  sessionId: string;
  sessionDateMs: number;
  durationSec: number;
}): UseQueryResult<QueryResults['sessionWeather']> =>
  useQuery({
    queryKey: sessionWeatherQueryKey({ sessionId: options.sessionId }),
    queryFn: () => loadSessionWeather(options),
    enabled: options.sessionId !== '' && options.durationSec > 0,
    staleTime: Infinity,
    retry: false,
  });
```

A write module is the same shape minus the key builder:

```ts
const deleteSessionData = async (options: { sessionId: string }): Promise<void> => {
  await Promise.all([
    deleteSessionRecords(options.sessionId),
    deleteSessionLaps(options.sessionId),
    deleteSessionGPS(options.sessionId),
    deleteSessionWeather(options.sessionId),
    deleteFitFile(options.sessionId),
  ]);
};

export const useDeleteSessionMutation = (): UseMutationResult<void, Error, { sessionId: string }> =>
  useMutation({ mutationFn: deleteSessionData });
```

## 6. Forbidden practices

- `useQuery` or `useMutation` called from a component, a feature `hooks/` directory or `apps/web/src/lib/hooks/` — the call then has no findable home and no reusable key.
- The request written directly into `queryFn` / `mutationFn` as an anonymous body — nothing else can ever call it.
- A key array written inline at a `queryKey` site, or exported as a constant (`PERSONAL_BESTS_KEY = ['personal-bests']`) instead of a builder.
- A request function that reads a store, the router or a context itself instead of receiving the value. It stops being callable from `fetchQuery` and from tests without store setup.
- A write hook named `use<Name>` without the `Mutation` suffix — it reads as a query at the call site.
- Two I/O calls in one module because they share a domain, or a module that exports a second hook for a variant of the same call. Split by call, not by domain.
- A `utils.ts`, `helpers.ts` or `common.ts` beside these modules. Shared material goes into `shared.ts` next to the modules that share it.
- An `index.ts` re-exporting a directory of these modules.
