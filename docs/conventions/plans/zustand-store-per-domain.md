---
id: zustand-store-per-domain
tdr_reference: tdr/zustand-store-per-domain.md
generated: 2026-09-17
---

# One store per domain, with a declared initial state and labelled writes

Read `tdr/zustand-store-per-domain.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Export a named initial-state constant from every store.
   Files: all 13 modules under `src/store/`, plus `src/components/ui/toastStore.ts`
   Change: each store currently inlines its defaults in the creator (`sessions: []`, `toasts: []`). Declare a module-level `INITIAL_<DOMAIN>_STATE` constant typed by the store's state shape, and spread it as the first entry of the object the creator returns. This is what lets an action and a spec reset to the defaults by value rather than restating them.
   Check: `grep -rln "INITIAL_" src/store src/components/ui/toastStore.ts` lists all 14 modules; `pnpm test -- --run tests/store`.

2. Add the `devtools` middleware and label every write.
   Files: all 14 store modules
   Change: wrap each creator in `devtools` outside `immer` — and, where a store persists, outside `persist` too — so the middleware order is fixed and identical across stores. Then pass an action label as the third argument of every `set` call. Inside a creator the label is the action's own name; where a store grows a separate actions module, derive it from a module-local `getActionKey`. Without the label the devtools timeline is a list of anonymous entries, which is worst exactly when a state bug is being chased.
   Check: `grep -rn "devtools(" src/store | wc -l` returns 13; open the app with the Redux DevTools extension and confirm every write appears under a name.

3. Fix the one store whose middleware order differs.
   Files: `src/store/sessions.ts`
   Change: it wraps `immer(persist(...))` while the convention is `devtools(persist(immer(...)))` — `immer` innermost so the draft is what the creator writes, `persist` outside it, `devtools` outermost. Reorder it and confirm the persisted payload shape is unchanged; if it is not, the rehydration path needs a `version` bump per `src/store/CLAUDE.md`.
   Check: `pnpm test -- --run tests/store/sessionsStore.integration.test.ts`; load the app with existing data in IndexedDB and confirm sessions still appear.

4. Wrap object-returning selectors in `useShallow`.
   Files: every component selecting from a store
   Change: run R7's signal. A selector returning an object, an array or a `Map` re-renders its component on every unrelated write unless wrapped in `useShallow` from `zustand/react/shallow`. Select the narrowest value needed; wrap what remains.
   Check: R7's grep returns nothing; `pnpm exec playwright test`.

5. Confirm no store is created outside a store module, and no draft is returned by spread.
   Files: all of `src/`
   Change: run R1's and R8's signals. `create` from `zustand` is called only in `src/store/*.ts` and `src/components/ui/toastStore.ts` — a feature must not create its own store, and subtree-scoped state belongs in a context provider. R8: mutate the Immer draft in place inside `set`; never return a spread copy of state.
   Check: R1's and R8's greps return nothing outside the store modules; `pnpm check && pnpm test -- --run`.

## Open items

This record deliberately inverts the convention it was drawn from. That one required a single global store composed of per-domain slices; PaceVault runs 13 domain stores under `src/store/` plus `toastStore`, and that split is a documented decision in `src/store/CLAUDE.md`. The structural rules that survive the inversion are the ones carried here — one creation site per domain, a declared initial state, a fixed middleware stack, labelled writes, narrow selectors, in-place draft mutation. The rules that existed only to make a single store work (a `GlobalStore` type intersection, a root module spreading slice creators) are dropped and are not in the TDR reference.

`src/store/CLAUDE.md` already fixes persistence (`createJSONStorage(() => idbStorage)`, `skipHydration: true`, `version: 1`, `store-<name>` keys, no localStorage), scope-clear action naming, and the testing requirement. This record does not restate any of that and does not override it.

`src/components/ui/toastStore.ts` sits outside `src/store/` because it is the state half of the `Toast` UI component. Items 1, 2, 4 and 5 apply to it; it does not move.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
