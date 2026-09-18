---
id: one-server-call-per-hook-module
tdr_reference: tdr/one-server-call-per-hook-module.md
generated: 2026-09-17
---

# One remote call per module, split into fetcher, key and hook

Read `tdr/one-server-call-per-hook-module.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Create the two trees.
   Files: new `src/queries/`, new `src/mutations/`
   Change: create both directories. `src/queries/` holds read modules, `src/mutations/` holds write modules; no module outside them calls `useQuery`, `useInfiniteQuery` or `useMutation` (R2). Neither tree gets an `index.ts` — consumers import the module path directly (R12).
   Check: both directories exist and are empty; nothing else changed.

2. Move the weather query into `src/queries/` and split it into its three parts.
   Files: `src/features/sessions/session/hooks/useSessionWeather.ts` → `src/queries/sessionWeather.ts`, plus `src/features/sessions/session/WeatherChips.tsx` and any other importer
   Change: the module already has a named top-level async `loadWeather`, which is R3's shape — keep it, rename it `fetchSessionWeather` for the naming convention and take its three positional parameters as a single options object (R4). Add an exported `sessionWeatherQueryKey({ sessionId })` returning the key array, and have the hook call it rather than writing `['session-weather', sessionId]` inline (R6). Export the key builder and the fetcher, since the session detail page is a plausible prefetch site (R7). Name the hook `useSessionWeather` and the module after the call it wraps (R8). Annotate the hook's return type `UseQueryResult<SessionWeather | null>` (R11).
   Check: `grep -rn "session-weather" src` matches only inside `src/queries/sessionWeather.ts`; `pnpm check && pnpm exec playwright test e2e/sessions.spec.ts`.

3. Move the ambient reads out of the fetcher and into the hook.
   Files: `src/queries/sessionWeather.ts`
   Change: R4 and R5 — the fetcher takes every input explicitly in its options object and calls no hook and reads no context, so it is callable from a prefetch or an `ensureQueryData` outside a render. The hook is the only export that touches ambient state; it reads what it needs and forwards it in. `loadWeather` already satisfies this — confirm it, and keep it that way when the options object is introduced.
   Check: `src/queries/sessionWeather.ts`'s fetcher contains no `use*` call; `pnpm check`.

4. Confirm no other module calls a React Query hook.
   Files: all of `src/`
   Change: run R2's signal. `src/main.tsx` mounts `QueryClientProvider`, which is configuration rather than a call and stays where it is. Anything else that calls `useQuery`/`useMutation` moves into the appropriate tree as its own module — one module per call, even a near-identical variant differing only by a filter (R1).
   Check: R2's grep matches only under `src/queries/` and `src/mutations/`; `pnpm check && pnpm test -- --run`.

5. Mirror the new module in the tests tree.
   Files: new `tests/queries/sessionWeather.spec.ts`
   Change: the module moved, so its spec moves with it under the spec-layout record's R5. Cover the key builder's output and the fetcher's cache-hit, no-GPS, offline and fetch paths — `tests/CLAUDE.md` requires happy path, edge cases and error conditions for anything this data flow touches.
   Check: `pnpm test -- --run tests/queries`.

## Open items

There is exactly one remote call in this application today — the Open-Meteo weather fetch — so these two trees hold one module between them and `src/mutations/` starts empty. That is a deliberate choice to establish the structure before it is needed rather than to retrofit it later; a reviewer should read the empty `src/mutations/` as a shape, not as an oversight.

R9 (a `shared.ts` beside sibling modules for anything two of them share) and R10 (a composing hook that issues no request of its own still belongs in the tree) have nothing to govern at one call. Both are carried in the TDR reference for the second one.

The `src/queries/` tree is a top-level hook directory in its own right — the hook-placement record's R4 sends every read and write hook here rather than into a feature `hooks/` directory, and no `hooks/` subdirectory is created inside it.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
