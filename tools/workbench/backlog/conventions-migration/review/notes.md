# Notes for the review doc (collected during the run)

## Open points / owner attention
- Suspected flake, not in `flaky.md`: `apps/web/e2e/mobile/map.spec.ts:249` "filter input stays in place while typing" failed once in plan 3, passed on rerun and 5× repeat.
- Suspected e2e flake, not in `flaky.md`: `apps/web/e2e/mobile/map.spec.ts` "chart scrub on touch moves the map circle" failed once in plan 22, passed on rerun.
- Suspected flaky unit test: `records.computePbsForSessions` (app) failed once in the full run of plan 16, passed alone and on a full rerun.
- `pnpm-lock.yaml` changed beyond the plans: plan 4 pruned a stale `@vitest/browser` entry, plan 12 pruned stale `polyline-codec`/`simplify-ts` entries.
- Plan 7 added `tools/workbench/depcruise.aliases.cjs` (dependency-cruiser 18.6 rejects `enhancedResolveOptions.alias`).
- Adjacent, not edited: `.claude/agents/item-worker.md:36` and `.claude/skills/item-explore/references/mockup-prompt.md:36` still name the surface classes in `Card.tsx` (moved by plan 15).
- Manual checks the workers skipped: `pvDebug.help()` in the browser (plan 5); walking the workbench board tabs by eye (plans 2, 7, 8, 14, 15 — probe output and board screenshot diff were identical).
- Plan 2 incident: a bare `vp fmt` reformatted 92 Markdown files; restored (verified: no content lost). Workers since then format code paths only.
- Plan 28 changed an e2e expectation: `apps/web/e2e/onboarding.spec.ts:164` now expects the focus ring colour as `color(srgb …)` (the `color-mix` token computes in that notation); ring screenshots identical. `cn` uses `extendTailwindMerge` with the new token names.
- Plan 23: intervals.icu connect starts its mutation before `beginImport` (race with the background sync, found by e2e); studio route dialog keeps await-then-close (OP-70).
- Plan 32 behaviour changes (all named in the plan): Escape handled once per press on `window`; sparkline measured with `useMeasure` (fractional sizes); stored load grouping no longer overwritten for ranges ≤ 7 days; dialogs seed fields before first paint; records/laps/GPS/route points cached, track hover preloads records; startup reprocessing and training-load recompute as gated queries; board write card closes 12 s after pointer leaves. New read modules use `networkMode: 'always'` (offline-safe); GPS track query `staleTime: 0` (duplicate-only import would hang otherwise); recompute query `gcTime: 0`. OP-73: two older read modules stall offline — checked: same at the base commit, not a regression.
- Plan 43 (unit length): **hand test needed** — tap/click on the 3D track on a touch device selects the lap (`trackTapHandlers`, kept byte-equivalent, no spec). Eight informative comments were not carried over into the extracted units; listed in progress line 43 for the owner. New ui lint warning (false positive) at `BottomSheet.tsx:124`. `deleteAllData.ts` exports `clearAllAppState`.
- Plan 14: `buildEffortLapSet` maps `thresholdPace` → `thresholdPaceSecPerKm` explicitly (the rename would otherwise have dropped it).
