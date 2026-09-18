---
id: boolean-names-without-is-prefix
tdr_reference: tdr/boolean-names-without-is-prefix.md
generated: 2026-09-17
---

# Booleans are named for the state, not with an interrogative prefix

Read `tdr/boolean-names-without-is-prefix.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Rename the two boolean fields on the domain session type.
   Files: `src/packages/engine/types.ts`, `src/parsers/fit.ts`, `src/features/dashboard/generateDevData.ts`, `src/features/sessions/session/hooks/useEditInStudio.ts`, `src/features/sessions/session/hooks/useSessionExport.ts`, plus every reader found by the grep below
   Change: on the session interface in `src/packages/engine/types.ts`, rename `isPlanned: boolean` to `planned: boolean` and `hasDetailedRecords: boolean` to `detailedRecords: boolean`. Update every construction site (`src/parsers/fit.ts:284-285`, `src/features/dashboard/generateDevData.ts:279-280`) and every read. `useEditInStudio.ts:48` and `useSessionExport.ts:37` read it as `session.hasDetailedRecords` — those become `session.detailedRecords` while their own returned members `canEdit` / `canExport` are handled in item 3.
   Check: `grep -rn "isPlanned\|hasDetailedRecords" src tests` returns nothing, then `pnpm check && pnpm test`.

2. Rename boolean fields on local interfaces and derived objects.
   Files: `src/types/index.ts` (`isTaper`), `src/lib/prescription.ts:365` (`isTaper`), `src/features/labs/WorkoutCard.tsx:9` (`isExpanded`), `src/features/map/MapPopupShell.tsx:14` (`isExpanded`), `src/features/labs/hooks/useCoachPlan.ts:16` (`hasThresholdPace`), `src/features/sessions/laps/LapSplitsChart.tsx:20` and `src/features/sessions/laps/LapDetailTable.tsx:15` (`isRunning`), `src/features/sessions/laps/SplitDistanceCard.tsx:18` (`isDevice`), `src/features/sessions/charts/hooks/useZoneData.ts:11` (`isRunning` parameter), `src/lib/dynamicLaps.ts:98` (`isInterval`)
   Change: drop the prefix — `isTaper` → `taper`, `isExpanded` → `expanded`, `hasThresholdPace` → `thresholdPace`, `isRunning` → `running`, `isDevice` → `device`, `isInterval` → `interval`. Rename the declaration and every reader in the same change. Leave `src/lib/chartTheme.ts:72` `isAnimationActive` alone — it is Recharts' own prop name (R6).
   Check: `pnpm check && pnpm test -- --run`; then read `src/features/sessions/laps/LapSplitsChart.tsx` and confirm the prop is passed as `running={...}`.

3. Rename the `hasData` map entries and the `canEdit` / `canExport` hook members.
   Files: `src/features/sessions/charts/SessionChartsExplorer.tsx` (9 sites), `src/features/studio/charts/RouteChartsExplorer.tsx` (3 sites), `src/features/sessions/session/hooks/useEditInStudio.ts`, `src/features/sessions/session/hooks/useSessionExport.ts`
   Change: in both chart explorers rename the descriptor field `hasData` to `populated` on the interface and at every literal site. In the two hooks rename the returned members `canEdit` → `editable` and `canExport` → `exportable`, and update their call sites.
   Check: `grep -rn "hasData\|canEdit\|canExport" src` returns nothing, then `pnpm check`.

4. Rename the one prefixed `useState` boolean.
   Files: `src/features/settings/DeleteAllDataDialog.tsx`
   Change: `const [isDeleting, setIsDeleting] = useState(false)` becomes `const [deleting, setDeleting] = useState(false)`; update both readers in the same file.
   Check: `grep -n "isDeleting" src/features/settings/DeleteAllDataDialog.tsx` returns nothing; `pnpm check`.

## Open items

None. R5's predicate carve-out (`is*`/`has*` on functions and type guards) is already satisfied — no predicate function in `src/` was found breaking it, so nothing changes there.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
