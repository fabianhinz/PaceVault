---
id: alias-imports-across-directories
tdr_reference: tdr/alias-imports-across-directories.md
generated: 2026-09-17
---

# Alias imports across directory boundaries

Read `tdr/alias-imports-across-directories.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Replace the ascending imports in the studio feature's hooks.
   Files: `src/features/studio/hooks/useGpxImport.ts`, `src/features/studio/hooks/useStudioMapPopup.ts`
   Change: `'../createStudioRoute.ts'` becomes `'@/features/studio/createStudioRoute.ts'`; `'../markers/markerGeometry.ts'` becomes `'@/features/studio/markers/markerGeometry.ts'`; `'../markers/StudioTrackPickPopup.tsx'` becomes `'@/features/studio/markers/StudioTrackPickPopup.tsx'`.
   Check: `grep -rn "from '\.\./" src/features/studio` returns nothing; `pnpm check`.

2. Replace the cross-feature imports in the map background.
   Files: `src/features/map/MapBackground.tsx`
   Change: the seven `'../studio/...'` and `'../sessions/...'` specifiers on lines 14–20 become their `@/features/studio/...` and `@/features/sessions/...` equivalents. These cross a feature boundary, which is exactly the case the alias exists for.
   Check: `grep -n "from '\.\./" src/features/map/MapBackground.tsx` returns nothing; `pnpm check`.

3. Replace the remaining ascending imports in the map hooks and the gpx package.
   Files: `src/features/map/hooks/useSessionDetailPath.ts`, `src/packages/gpx/routeGeometry.ts`
   Change: `'../zoneColoredPath.ts'` → `'@/features/map/zoneColoredPath.ts'`; `'../trackColors.ts'` → `'@/features/map/trackColors.ts'`; `'../engine/gps.ts'` → `'@/packages/engine/gps.ts'`; `'../engine/types.ts'` → `'@/packages/engine/types.ts'`.
   Change note: `src/packages/engine/CLAUDE.md` forbids the engine importing outward, not `src/packages/gpx/` importing the engine, so this rewrite does not cross that boundary — it only spells the existing edge with the alias.
   Check: `grep -rn "from '\.\./" src` returns nothing; `pnpm check && pnpm test -- --run`.

4. Confirm the alias resolves in all three resolvers.
   Files: `tsconfig.app.json`, `vite.config.ts`, `vitest.config.ts`
   Change: none expected — `paths: { "@/*": ["./src/*"] }`, `resolve.alias['@']` and the vitest `resolve.alias['@']` are all already present and agree. Read all three and confirm they still map `@` to the same directory; if one has drifted, correct it to match the other two.
   Check: `pnpm check && pnpm test -- --run && pnpm build` all pass.

## Open items

R4's published-artifact clause does not apply: PaceVault is a deployed application with no consumer that could ever see an unresolved `@/` specifier, so the alias only has to resolve in the three resolvers above.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
