---
id: effects-are-rare
tdr_reference: tdr/effects-are-rare.md
generated: 2026-09-17
---

# An effect only synchronises with something outside React

Read `tdr/effects-are-rare.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Replace the open-time state reset in the studio route dialog.
   Files: `src/features/studio/StudioRouteFormDialog.tsx`
   Change: the effect at line 26 is a state setter fed by props (`if (props.open) { setName(props.route.name); setColor(props.route.color); }`) — exactly R2's shape. Delete the effect and reset by keying the subtree instead: have the parent render the dialog body with `key={props.route.id}` so React discards and re-seeds the local state when the route changes, and seed `useState` from `props.route` directly.
   Check: `grep -n "useEffect" src/features/studio/StudioRouteFormDialog.tsx` returns nothing; open the dialog on two different routes in sequence and confirm the fields show the second route's values, not the first's.

2. Replace the open-time state reset in the trip dialog.
   Files: `src/features/trips/TripFormDialog.tsx`
   Change: the effect at line 43 sets four pieces of local state from `props.trip` whenever `props.open` flips. Same treatment as item 1 — key the dialog body on `props.trip?.id ?? 'new'` and seed each `useState` from its prop directly, then delete the effect.
   Check: `grep -n "useEffect" src/features/trips/TripFormDialog.tsx` returns nothing; open the dialog for an existing trip, close it, open it for a new trip, and confirm the fields are empty the second time.

3. Replace the seeding effect in the studio marker dialog.
   Files: `src/features/studio/markers/StudioMarkerDialog.tsx`
   Change: the effect at line 48 guards on `active` and then seeds `label`, `description` and a distance from `existing` — the same prop-to-state copy, with a derived `seedM` computed inside it. Compute `seedM` during render, key the dialog body on the marker's identity, and seed the `useState` calls from the props. Delete the effect.
   Check: `grep -n "useEffect" src/features/studio/markers/StudioMarkerDialog.tsx` returns nothing; open the marker dialog on an existing point of interest and then on a new marker and confirm the fields reset.

4. Justify or remove the store-write effect in the laps tab.
   Files: `src/features/sessions/laps/LapsTab.tsx`
   Change: the effect at line 69 writes derived values (`analysis`, `enrichments`, `splitDistance`) into `useMapFocusStore` on every change. The store is outside React, so this is not an R2 violation — but R1 requires the external system to be named in the hook's name or in the effect's own naming. Extract it into `src/features/sessions/laps/hooks/useActiveLapDataEffect.ts` returning `void`, per R6, and have the component call that hook instead of holding the effect inline. Apply the same treatment to the second effect at line 99 if it is also a store synchronisation.
   Check: `grep -n "useEffect" src/features/sessions/laps/LapsTab.tsx` returns nothing; `pnpm check && pnpm exec playwright test e2e/sessions.spec.ts`.

5. Audit the remaining 30 effects against R1 and extract the ones that are a unit's whole purpose.
   Files: every file matched by `grep -rn "useEffect(" src`
   Change: for each remaining effect, confirm it synchronises with something outside React — an event listener, a timer, the map instance, IndexedDB, the service worker, the geolocation API, a Zustand store, or a worker channel — and that R5's cleanup unregisters whatever it registered. Where the effect is the component's whole reason to exist, move it to its own `use<Thing>Effect` module returning `void`, following the naming already used by `useWatchPositionEffect`, `useGeolocationCameraEffect` and `useFileDropEffect`.
   Check: `pnpm check && pnpm test -- --run && pnpm exec playwright test`; every remaining inline `useEffect` in `src/` sits in a component that also renders markup and names its external system.

## Open items

R4 of the original record named a specific library's purpose-built hooks (`useEvent`, `useInterval`, `useMeasure`, `useDebounce`) as the preferred alternative to a hand-rolled effect. PaceVault has no such library on its dependency graph, so that rule is Moot here and is not carried in the TDR reference. If a hook-utility library is ever added, revisit it — `src/features/settings/ThresholdsSection.tsx` currently hand-rolls a debounce that such a library would replace.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
