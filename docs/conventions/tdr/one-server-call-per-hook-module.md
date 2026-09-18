---
kind: pattern-apply-tdr-reference
id: one-server-call-per-hook-module
title: One remote call per module, split into fetcher, key and hook
summary: Each remote call gets one module under src/queries/ or src/mutations/, holding a named async fetcher, an exported key builder, and the hook that wires them together.
governs:
  - "src/queries/**/*.ts"
  - "src/mutations/**/*.ts"
  - "src/**/*.ts"
  - "src/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7, R8, R9, R10, R11, R12]
adopted: 2026-09-17
---

# One remote call per module, split into fetcher, key and hook

## 1. Context

This file carries R1–R12.

A module that talks to something outside the browser splits into three named parts: an async fetcher that takes every input explicitly, a key builder that produces the cache key, and the hook that reads ambient state and wires the two together. Without the split the request body, the key array and the context reads fuse into a hook body. The request then cannot be called from a prefetch or an `ensureQueryData` without re-entering React, and the key array gets retyped by hand at every invalidation site, where a silently divergent copy is a cache miss rather than a compile error.

PaceVault is local-first and has exactly one remote call — the Open-Meteo weather fetch — so these trees hold one module today and `src/mutations/` is empty. That is the structure established before it is needed, not an oversight. IndexedDB access is *not* a remote call and does not belong here: `src/lib/indexeddb.ts`, `src/lib/db.ts` and `src/lib/weatherDb.ts` are the local persistence layer and are reached directly.

Scope: `src/queries/` and `src/mutations/`, plus any module that would otherwise call a React Query hook. Out of scope: how a component reaches these hooks, which is a sibling record, and the one-hook-per-file rule they share with the rest of the codebase.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | One module describes exactly one remote call. A second call — even a near-identical variant differing by a filter or a range — gets its own module. | manual |
| R2 | Reads live under `src/queries/`, writes under `src/mutations/`. No module outside those two trees calls `useQuery`, `useInfiniteQuery` or `useMutation`. Mounting `QueryClientProvider` in the app entry is configuration, not a call, and is not governed here. | proposed |
| R3 | The request is a named top-level `async` function in the module, separate from the hook. Never an anonymous body inlined into `queryFn` or `mutationFn`. | proposed |
| R4 | That function takes a single options object and every input is explicit in it. It calls no hook and reads no context, so it is callable outside a render. | manual |
| R5 | The hook is the only export that touches ambient state: it reads from stores or context and forwards the values into the function. | manual |
| R6 | A read module defines a named key builder, `<name>QueryKey`, taking the same identifying inputs as the fetcher and returning the key array. The hook calls it; it never writes the array inline. | proposed |
| R7 | Export the key builder and the fetcher whenever anything outside the module prefetches, seeds, invalidates or composes that call. Keep a write module's function module-local until a second module needs it. | manual |
| R8 | Name a read hook `use<Name>` and a write hook `use<Name>Mutation`; one hook per module, and the module is named after the call it wraps. | proposed |
| R9 | Anything two sibling modules share — a fetcher covering several shapes of one endpoint, a key builder, a refetch-interval policy — moves into a `shared.ts` beside them, not into whichever module happened to need it first. | manual |
| R10 | A hook that only composes other hooks and issues no request of its own still belongs in this tree, next to what it composes, and defines no key and no fetcher. | manual |
| R11 | Annotate the hook's return type explicitly as `UseQueryResult<…>` / `UseMutationResult<…>`. | proposed |
| R12 | No barrel: these trees export no `index.ts`, and consumers import the module path directly. | proposed |

## 3. Detection

```yaml
R1:
  type: manual
  reason: >
    Whether two calls are "the same call with a different filter" is a reading of both.
  enforcedBy: null
R2:
  type: grep
  pattern: "useQuery\\(|useInfiniteQuery\\(|useMutation\\("
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["src/queries/**", "src/mutations/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    `useQueryClient()` does not match. A component reading an already-declared hook does not match
    either, which is correct — that is the sibling record's subject.
R3:
  type: grep
  pattern: "(queryFn|mutationFn): (async )?\\(\\) =>"
  include: ["src/queries/**/*.ts", "src/mutations/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A one-line `queryFn: () => fetchThing(options)` delegating to the named function is the correct
    form and matches; read whether the arrow contains the request or forwards to it.
R4:
  type: grep
  pattern: "^const [a-zA-Z]+ = async \\([\\s\\S]{0,200}use[A-Z]"
  include: ["src/queries/**/*.ts", "src/mutations/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Approximate — a `use`-prefixed non-hook helper in the fetcher's body would match too.
R5:
  type: manual
  reason: >
    Which values are ambient and which are inputs is a reading of where each comes from.
  enforcedBy: null
R6:
  type: grep
  pattern: "queryKey: \\["
  include: ["src/queries/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R7:
  type: manual
  reason: >
    Whether anything outside the module prefetches or invalidates the call needs a usage search.
  enforcedBy: null
R8:
  type: glob
  pattern: "each src/queries/*.ts exports one `use<Name>` and each src/mutations/*.ts one `use<Name>Mutation`, matching the module basename"
  include: ["src/queries/*.ts", "src/mutations/*.ts"]
  exempt: ["src/queries/shared.ts", "src/mutations/shared.ts"]
  violationWhen: no-match
  enforcedBy: null
  falsePositives: "none known"
R9:
  type: manual
  reason: >
    Detecting a shared concern duplicated across two sibling modules means comparing them.
  enforcedBy: null
R10:
  type: manual
  reason: >
    A composing hook has no request to match on; recognising one means reading what it calls.
  enforcedBy: null
R11:
  type: grep
  pattern: "export const use[A-Z][A-Za-z0-9]* = \\([^)]*\\)(?!: Use(Query|Mutation)Result)"
  include: ["src/queries/*.ts", "src/mutations/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Misses an annotation written after a multi-line parameter list.
R12:
  type: glob
  pattern: "src/queries/index.ts and src/mutations/index.ts must not exist"
  include: ["src/queries/index.ts", "src/mutations/index.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
```

## 4. Trade-offs

- **Good, because** the fetcher is callable outside a render, so a prefetch on navigation or a seed after a write costs nothing to add later.
- **Good, because** the key exists once as a function, so an invalidation cannot silently diverge from the query it meant to invalidate.
- **Bad, because** it is a three-part structure for one call. At the current scale it is more ceremony than the code needs, and it is justified by what a second and third call would cost without it — which may never arrive in a local-first app.
- **Bad, because** a top-level `src/queries/` tree pulls the one weather call away from the session feature that owns it, so the feature directory no longer shows everything the feature does.
- **Neutral, because** the IndexedDB layer looks like a data layer and is deliberately not governed here; a reader has to know that "remote" is the boundary, not "async".

## 5. Reference implementation

`src/queries/sessionWeather.ts`:

```ts
export const sessionWeatherQueryKey = ({ sessionId }: { sessionId: string }): QueryKey => [
  'session-weather',
  sessionId,
];

export const fetchSessionWeather = async ({
  sessionId,
  sessionDateMs,
  durationSec,
}: {
  sessionId: string;
  sessionDateMs: number;
  durationSec: number;
}): Promise<SessionWeather | null> => { … };

export const useSessionWeather = (options: {
  sessionId: string;
  sessionDateMs: number;
  durationSec: number;
}): UseQueryResult<SessionWeather | null> =>
  useQuery({
    queryKey: sessionWeatherQueryKey(options),
    queryFn: () => fetchSessionWeather(options),
    enabled: options.sessionId !== '' && options.durationSec > 0,
    staleTime: Infinity,
    retry: false,
  });
```

## 6. Forbidden practices

- ❌ `useQuery` or `useMutation` called from a component or a feature hook directory.
- ❌ An anonymous async body inlined into `queryFn` — the request is then unreachable from a prefetch.
- ❌ `queryKey: ['session-weather', sessionId]` written inline; the next invalidation site retypes it and one of the two is wrong.
- ❌ A fetcher reading a store or a context; it stops being callable outside a render, which is the whole point of the split.
- ❌ Two remote calls in one module, however similar.
- ❌ An `index.ts` in either tree; consumers address the module that declares the call.
- ❌ Filing IndexedDB access here because it is async. The boundary is remote, not asynchronous.
