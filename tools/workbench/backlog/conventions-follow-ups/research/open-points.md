# Follow-ups from the conventions migration

Collected while planning `docs/conventions/plans/`. None of these is part of the migration; each needs its own decision.

## OP-43 · Non-token colours passed into kit props (errors to look at)
- Severity: Medium · Source: packages/ui
- From: plans/styled-api-over-sx.md Open items (packages/ui)
- What: `SessionChartsExplorer.tsx:102` passes `band.color` (engine zone hex, e.g. `#34d399` from `packages/engine/src/zones.ts:13-17`) to `StatRailNote.color`; `TrainingEffectCard.tsx:55` passes `''` as the gauge `valueFill` fallback; `TE_FILL` (`:32`) and `statusFill` (`apps/web/src/lib/statusColors.ts:13`) are typed `Record<string, string>`. These props stay typed `string` for now.
- User impact: none until fixed.
- Options: A) add the zone colours as tokens and type `TokenColor` everywhere; B) treat them as data colours typed `string`; C) drop.

## OP-52 · UTC date in the GPX export file name (possible bug)
- Severity: Medium · Source: packages/gpx
- From: triage (today `packages/gpx/src/buildGpx.ts:105`, moved to `apps/web/src/lib/gpxExport.ts` by engine-holds-domain-logic-only)
- What: `toISOString().slice(0, 10)` uses UTC, so a session started shortly after local midnight gets the previous day in its file name.
- User impact: the file name shows the wrong day for those sessions.
- Options: A) keep; B) use the local calendar day (file name changes).

## OP-53 · Route named after the first waypoint on re-import (possible bug)
- Severity: Medium · Source: packages/gpx
- From: triage (`packages/gpx/src/parseGpx.ts:77-82`)
- What: `parseName` takes the first `<name>` in the document; without a metadata name a `<wpt>` name comes before `<trk><name>`, so a route exported with markers but no name re-imports named after its first marker.
- User impact: unexpected route name after import.
- Options: A) keep; B) prefer metadata, then trk, then rte name (imported name changes).

## OP-32 · Session delete via `mutate` without await
- Severity: Low · Source: apps/web
- From: plans/one-server-call-per-hook-module.md (kept, item 7, residual edge case)
- What: `DeleteSessionDialog` calls `mutate` without `await`.
- User impact: a failed IndexedDB delete becomes an unshown mutation error instead of an unhandled rejection — visible in the console only.
- Options: A) accept (stays in the plan); B) `await mutateAsync` to keep today's rejection; C) drop the item.

## OP-35 · Split context state from actions
- Severity: Low · Source: packages/ui
- From: plans/context-provider-accessor-pairs.md (packages/ui)
- What: split each sheet context into a state and an actions context (3 → 6), e.g. `SheetPeekContext` `target`/`active` vs `registerTarget`/`setActive`.
- User impact: nothing visible; changes which consumers re-render and when.
- Options: A) split; B) keep as is; C) drop.

## OP-31 · Query-param writes keep unrelated keys
- Severity: Low · Source: apps/web
- From: plans/navigation-through-router-hooks.md (kept, residual edge case)
- What: `useRouterQuery().push` keeps unrelated query keys, where `setSearchParams({ tab })` drops them today.
- User impact: only visible if a user hand-types extra query params; no app-generated URL has any.
- Options: A) accept (stays in the plan); B) make `push` drop other keys like today; C) drop R5.

## OP-33 · Shared collator for MetricLabel's short-label comparison
- Severity: Low · Source: apps/web
- From: plans/formatting-through-intl-namespace.md (former item 7); rule R4 pending in tdr/formatting-through-intl-namespace.md
- What: add `export const collator = new Intl.Collator(getLocale(), { sensitivity: 'base' })` to `apps/web/src/lib/formatters.ts`; in `apps/web/src/components/MetricLabel.tsx:55-57` replace `explanation.shortLabel.localeCompare(props.contextLabel, undefined, { sensitivity: 'base' }) === 0` with `collator.compare(explanation.shortLabel, props.contextLabel) === 0`.
- User impact: the comparison deciding whether the short label is hidden at size `sm` switches from the browser locale to the app locale (`en`/`de`). Identical for en/de browsers and Latin labels; can differ where the browser locale treats accented letters as distinct base letters (e.g. Swedish `ä` vs `a`).
- Options: A) behaviour-preserving: `new Intl.Collator(undefined, { sensitivity: 'base' })` (identical to today, but not "built with getLocale()"); B) as planned with `getLocale()`; C) drop, keep `localeCompare` in MetricLabel.

## OP-44 · `'default'` variant members
- Severity: Low · Source: packages/ui
- From: plans/variant-unions-with-default-resolvers.md (packages/ui)
- What: remove the `'default'` member from `CardVariant`, `ToastVariant`, `DropdownMenuItemVariant`.
- User impact: nothing rendered; the type API changes and those resolvers would have no member left to return.
- Options: A) keep them as real looks (current plan); B) remove and drop those resolvers; C) drop.

## OP-45 · Unify single-failure engine returns on undefined
- Severity: Low · Source: packages/engine
- From: plans/outcome-unions-over-exceptions.md (packages/engine)
- What: `unionBounds`, `densestClusterBounds` (bounds.ts) and `computeWindExposure`/`windExposureFromRecords` return `T | null`; switch to `T | undefined` and adapt the app readers (`useMapCameraEffect.ts`, `useStudioMapTracks.ts`, `useWindExposure.ts`).
- User impact: nothing visible; the returned value changes from `null` to `undefined`.
- Options: A) unify; B) keep; C) drop.

## OP-47 · Share the one-hour TRIMP reference between stress and training effect
- Severity: Low · Source: packages/engine
- From: plans/helpers-group-by-topic.md (packages/engine)
- What: replace `referenceTrimp` in `trainingEffect.ts` (60·t·a·e^(b·t)) with `stress.ts` `60 · impulsePerMinute(t, coeff)`.
- User impact: the aerobic training-effect value can differ in the last floating-point bit, so the rounded value may move by 0.1 in rare cases.
- Options: A) share and accept; B) keep both; C) drop.

## OP-51 · null → undefined for gpx single-failure returns
- Severity: Low · Source: packages/gpx
- From: plans/outcome-unions-over-exceptions.md (packages/gpx)
- What: `buildGpxString`, `buildRouteGeometry`, `pointAtRouteDistance`, `routeDistanceAtPosition` return `null`; the engine uses `undefined`.
- User impact: none directly; the returned value changes for every caller.
- Options: A) keep `null` (planned); B) unify on `undefined` and adapt callers; C) drop.

## OP-58 · Shared hook path regexes
- Severity: Medium · Source: tools/workbench
- From: tools/workbench triage
- What: `tools/workbench/scripts/indexHook.ts:18-19` matches `[^/]+`; `tools/workbench/scripts/statusGuard.ts:55-56` matches `[^/_.][^/]*`.
- User impact: sharing one regex changes which edits get checked or blocked (`_x` / `.x` folders).
- Options: A) keep; B) both use the guard's form (indexHook stops checking `_`/`.` folders); C) both use indexHook's form (the guard starts protecting them).

## OP-60 · Near-duplicate parsers that differ
- Severity: Medium · Source: tools/workbench
- From: tools/workbench triage
- What: `frontmatter.ts:128-143` `readStatus` treats an empty value as `undefined`, `readSize` returns `''`; `board.ts:145` `frontmatterLine` and `frontmatter.ts:59` `FRONTMATTER` handle CRLF and a trailing space after `---` differently; `writeBack.ts:295` `QUESTION_LINE` and `frontmatter.ts:232` `QUESTION` differ in the `- ` prefix and `.*` vs `[\s\S]*`.
- User impact: merging changes which plans the stale-file guard accepts and which question lines parse (e.g. CRLF files).
- Options: A) keep; B) adopt one parser's semantics, pinned by spec cases; C) adopt the other's.

## OP-56 · Fragile class couplings in the banner capture
- Severity: Low · Source: tools/docs
- From: plans/unit-length-discipline.md (tools/docs)
- What: the capture finds app elements via styling classes: the demo banner via `.mb-4` (`tools/docs/banner/capture.ts:93` ↔ `apps/web/src/components/layout/DemoBanner.tsx:18`), `.text-text-tertiary` (`:426`), `.text-sport-running`/`.text-sport-cycling` (`:359-360`), `.maplibregl-canvas` (`:341`), the `tsqd-*` devtools classes (`:86`).
- User impact: none today; any class edit in the app breaks the capture.
- Options: A) data attributes/test ids in the app and select on them (changes the app DOM); B) leave it and document the coupling in `tools/docs/CLAUDE.md`; C) both.

## OP-57 · Date stamps: local vs UTC
- Severity: Low · Source: tools/workbench
- From: tools/workbench triage (no plan item)
- What: `tools/workbench/site/src/actions/index.ts:58-62` builds the local date by hand; `tools/workbench/scripts/deps.ts:552` and `tools/workbench/scripts/interfaces.ts:362` use UTC `toISOString().slice(0, 10)`.
- User impact: around midnight, answers carry the local date while review artefacts carry the previous UTC day; unifying moves one of them.
- Options: A) keep both; B) both local via Intl with the board locale; C) both UTC.

## OP-59 · Hook entry and exit differences
- Severity: Low · Source: tools/workbench
- From: tools/workbench triage
- What: `workerGitGuard.ts:47` decides whether to run via `argv[1]?.endsWith`, the others compare resolved paths; `indexHook.ts:41` runs `main()` on import; `workerGitGuard.ts:43` writes stderr without a trailing newline.
- User impact: what Claude sees on a block changes by one newline; the run-on-import guard has no visible effect.
- Options: A) keep; B) unify on the resolve guard plus `console.error`; C) guard only indexHook.

## crashSignal as a hand-rolled store
- From: docs/conventions/tdr/classes-are-server-side-only.md R3
- What: `apps/web/src/lib/debug/crashSignal.ts:3-4` keeps a mutable `crashTarget` plus a listener `Set`, read through `useSyncExternalStore` — a module singleton next to the zustand stores. The global-store plan that would have absorbed it was dropped.
- User impact: none (debug crash trigger).
- Options: A) move into a small zustand store; B) keep as a documented exception.

## DOMParser in packages/gpx
- From: docs/conventions/tdr/helpers-split-by-reachability.md (known edge)
- What: `packages/gpx/src/parseGpx.ts:85` uses `DOMParser`, which exists only on the browser main thread, while packages/gpx counts as pure/shared (any runtime).
- User impact: none today (only the app parses GPX); a worker or Node caller would fail.
- Options: A) accept and document gpx parsing as browser-only; B) inject the parser; C) use a runtime-neutral XML parser (new dependency).
