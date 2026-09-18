---
id: helpers-group-by-topic
tdr_reference: tdr/helpers-group-by-topic.md
generated: 2026-09-17
---

# Helper modules are named for a topic and hold that topic's functions

Read `tdr/helpers-group-by-topic.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Rename the one generically named helper module.
   Files: `src/lib/utils.ts` → `src/lib/classNames.ts`, plus every importer
   Change: `src/lib/utils.ts` holds exactly one export, `cn`. `utils` is the generic bucket name R6 forbids and the enclosing directory `lib/` supplies no topic. Move the file to `src/lib/classNames.ts` unchanged and rewrite every `from '@/lib/utils.ts'` specifier to `'@/lib/classNames.ts'`. Move `tests/lib/utils.spec.ts` to `tests/lib/classNames.spec.ts` in the same change so the spec mirror holds.
   Check: `grep -rn "lib/utils" src tests e2e` returns nothing; `pnpm check && pnpm test -- --run`.

2. Merge the two single-function laps helpers that share a subject.
   Files: `src/lib/laps.ts`, `src/lib/lapChartData.ts`, `src/lib/lapMarkers.ts`, `src/lib/dynamicLaps.ts`
   Change: read all four. Where two of them share the same subject, the same imports and the same private constants, merge the smaller into the larger under the topic name and delete the emptied module — R2. `laps.ts` is already 428 lines, so it is the merge target only where the subject genuinely matches; a module that covers a *different* lap topic (chart shaping vs. marker geometry vs. dynamic splitting) stays separate under R5. Record which pairs you merged and which you left, and why, in the commit message.
   Check: `pnpm check && pnpm test -- --run`; `ls src/lib/lap*` shows only the modules whose topics genuinely differ.

3. Confirm the remaining `src/lib/` modules are topic-named.
   Files: every file directly under `src/lib/`
   Change: read the 38 module names. Each must name the subject its functions operate on (`weather.ts`, `timeRange.ts`, `records.ts` do; `defaults.ts` and `validation.ts` are borderline — decide whether each names a real topic or is a bucket, and rename the ones that are buckets after what they actually compute). Do not split a module merely because it holds several functions — R3.
   Check: no module directly under `src/lib/` is named `utils`, `helpers`, `misc`, `common` or `shared`; `pnpm check && pnpm test -- --run`.

## Open items

R7 (feature-local helper modules follow the same rule) found no violations: `src/features/studio/createStudioRoute.ts`, `src/features/studio/routeColors.ts`, `src/features/trips/tripStats.ts`, `src/features/labs/workoutDisplay.ts` and `src/features/map/trackColors.ts` are all topic-named already. Nothing to change there.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
