---
id: toast-feedback-via-feature-maps
tdr_reference: tdr/toast-feedback-via-feature-maps.md
generated: 2026-09-17
---

# Transient feedback declared in feature-scoped toast maps

Read `tdr/toast-feedback-via-feature-maps.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Declare the shared map type.
   Files: new `src/components/ui/toast/types.ts` (or the existing one after the component-directory plan has run)
   Change: export a `ToastMap` type — a record of entry keys to `{ message, variant, key }`, where `message` is a Paraglide message function rather than a literal string, `variant` is taken from the closed union `MessageToastItem['variant']` already exported by the toast store, and `key` is a stable string identifying the entry. This is the type every feature map is closed with.
   Check: `pnpm check`.

2. Collect each feature's toast content into a map beside the feature.
   Files: new `src/features/sessions/sessionsToasts.ts`, `src/features/studio/studioToasts.ts`, `src/features/trips/tripsToasts.ts`, `src/features/settings/settingsToasts.ts`, plus every call site
   Change: run R5's signal to find every `toast(...)` call. For each feature, move its messages into a module named `<feature>Toasts.ts` in that feature's own directory, exporting a single SCREAMING_SNAKE constant closed with `satisfies ToastMap` (R1, R2). Every entry carries exactly `message`, `variant` and `key`, where `key` is the literal `<MAP_CONSTANT_NAME>_<entryKey>` (R3). Take the `variant` from the closed union at the declaration site; never introduce a new variant string there (R4).
   Check: each new module exports exactly one constant; `pnpm check`.

3. Rewrite the call sites to pass a map entry.
   Files: every module the R5 signal reported
   Change: call the toast store with a map entry — or a spread of one, where the call needs a per-invocation field such as a specific id or a longer description (R5). The `toast(title, description, variant, id)` convenience function in the toast store stays, but its arguments come from a map entry rather than being written inline.
   Check: R5's grep shows no `toast(` call with a literal first argument; `pnpm exec playwright test e2e/upload.spec.ts e2e/studio.spec.ts`.

4. Keep app-wide content in one map at the root.
   Files: new `src/appToasts.ts` or the existing shared location
   Change: R2 — a feature's map lives in that feature's own directory; only content reused across unrelated features belongs in the one app-wide map. Upload progress and the delete-all-data confirmations are the likely candidates for the app-wide map, since they are driven from more than one surface.
   Check: no feature map duplicates an entry from another feature map; `pnpm check`.

5. Confirm every enqueue goes through the store hook.
   Files: all of `src/`
   Change: R6 — obtain the enqueue path from the toast store rather than from any module-level singleton that bypasses it. In this project that means `useToastStore.getState().addToast(...)` or the exported `toast(...)` wrapper around it, which is the same path; there is no competing singleton to remove. Confirm nothing writes `useToastStore.setState` directly to push a toast.
   Check: `grep -rn "useToastStore.setState" src` returns nothing outside the store module; `pnpm check && pnpm test -- --run`.

## Open items

This record is adapted away from a notification library onto this project's own toast store, and away from literal message strings onto Paraglide. An entry's `message` is a message *function* from `@/paraglide/messages.js`, not a string — the wording stays in `messages/*.json` where `messages/CLAUDE.md` governs its tone and placeholders, and the map owns only which message goes with which outcome, in which variant, under which key. A later agent must not "simplify" this by inlining English strings into the maps; that would move translated copy out of Paraglide.

The original's R4 relied on a design-system snackbar component exporting the variant union, and its R6 forbade two module-level singletons from a notification library. Here the union comes from `MessageToastItem['variant']` in the toast store, and there are no singletons to forbid — R6 is carried in the reduced form stated above.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
