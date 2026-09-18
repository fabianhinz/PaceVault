---
id: hook-directory-placement
tdr_reference: tdr/hook-directory-placement.md
generated: 2026-09-17
---

# A hook's directory names what it is about, not who uses it

Read `tdr/hook-directory-placement.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Move the domain hook out of the app-wide hooks directory.
   Files: `src/hooks/useMetrics.ts` → `src/features/dashboard/hooks/useMetrics.ts`, `tests/hooks/useMetrics.spec.ts` → `tests/features/dashboard/hooks/useMetrics.spec.ts`, plus every importer
   Change: `src/hooks/` is reserved by R2 for hooks about no domain concept. `useMetrics` is about training metrics — a domain concept owned by the dashboard feature, which is where the metrics surface lives. Move the module and its spec, rewrite every importer's specifier to `@/features/dashboard/hooks/useMetrics.ts`. If more than one feature imports it, that is expected and is not a reason to leave it where it is — R3.
   Check: `src/hooks/` is empty and removed; `grep -rn "@/hooks/" src tests` returns nothing; `pnpm check && pnpm test -- --run`.

2. Move the browser-primitive hooks out of `src/lib/hooks/` into the app-wide hooks directory.
   Files: `src/lib/hooks/useIsDesktop.ts`, `useMediaQuery.ts`, `useHydrated.ts` → `src/hooks/`, plus their specs and importers
   Change: `useMediaQuery`, `useIsDesktop` and `useHydrated` are about the browser and the React lifecycle, not about any PaceVault concept — they are exactly R2's residue. Recreate `src/hooks/` for them. Leave `useChartZoom.ts`, `useSyncedChartZoom.ts`, `useMapHover.ts`, `useExpandCard.ts` and `useWatchPositionEffect.ts` where they are for now; they are handled in item 3.
   Check: `ls src/hooks` lists exactly the three modules; `pnpm check && pnpm test -- --run`.

3. Move the remaining `src/lib/hooks/` modules to the directory that owns their concept.
   Files: `src/lib/hooks/useChartZoom.ts`, `useSyncedChartZoom.ts`, `useMapHover.ts`, `useWatchPositionEffect.ts`, `useExpandCard.ts`, plus their specs and importers
   Change: place each by the concept it is about, not by who calls it — `useMapHover` and `useWatchPositionEffect` are about the map surface and geolocation, so they belong under `src/features/map/hooks/`; the two chart-zoom hooks are about charts, so they belong beside the chart components that own that surface (check whether that is `src/components/charts/` or a feature's `charts/` directory before moving). `useExpandCard` is about a card's expand/collapse UI primitive and belongs beside the card component. Being imported from two features afterwards is the expected outcome — R3.
   Check: `src/lib/hooks/` is empty and removed; `grep -rn "@/lib/hooks/" src tests` returns nothing; `pnpm check && pnpm test -- --run && pnpm exec playwright test`.

4. Remove the loose-sibling / `hooks/` mix wherever one exists.
   Files: every directory under `src/features/` that holds both a `hooks/` subdirectory and a loose `use*` file
   Change: R7 forbids the mix. Run the detection glob for R7; for each directory it names, move the loose `use*` siblings into that directory's `hooks/` in one change.
   Check: the R7 glob in the TDR reference returns no directory; `pnpm check && pnpm test -- --run`.

## Open items

R4 (server reads, writes and routing get their own top-level directories, never a feature `hooks/`) is deliberately left to the server-state and routing plans, which create those directories. Re-read this rule after both have been executed and confirm no query, mutation or routing hook has been filed into a feature `hooks/` directory.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
