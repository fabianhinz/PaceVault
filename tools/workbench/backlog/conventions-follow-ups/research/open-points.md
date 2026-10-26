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
- User impact: nothing rendered; the type API changes and the inline defaults (`props.variant ?? 'default'`, no resolvers since migration Q4/Q25) would need another member.
- Options: A) keep them as real looks (current plan); B) remove and make the prop required or pick another default; C) drop.

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

## OP-61 · Map feature properties checked with typeof guards instead of Zod
- Severity: Low · Source: apps/web (3D map)
- From: conventions-migration fact-check 2026-10-24 (Q22)
- What: `apps/web/src/features/map/terrainLine.ts:211` `runOfFeature` reads MapLibre feature properties (`unknown`) through `typeof` / `in` guards; root `CLAUDE.md` §2 asks for a Zod schema with `safeParse` for untyped data.
- User impact: none.
- Options: A) a `terrainLineRunSchema` with `safeParse`; B) keep the guards (hot path on every pick).

## OP-62 · Dead exports in terrainCamera.ts
- Severity: Low · Source: apps/web (3D map)
- From: conventions-migration fact-check 2026-10-24 (Q22)
- What: `ScreenBox` (`apps/web/src/features/map/terrainCamera.ts:45`) and `FitCorrection` (`:52`) are exported but imported nowhere (root `CLAUDE.md` §2 "Delete dead code").
- User impact: none.
- Options: A) drop the `export`; B) keep.

## OP-63 · Lap hover may stay set after leaving 3D (possible bug)
- Severity: Medium · Source: apps/web (3D map)
- From: conventions-migration fact-check 2026-10-24 (Q22)
- What: `apps/web/src/features/map/hooks/useTerrainTrackPickingEffect.ts` sets `hoveredLapIndex` on pointer move (`:74`) and clears it on `mouseout` (`:52`), but its cleanup (`:107-115`) resets only `terrainTrackHovered`. Switching 3D → 2D while the pointer rests on a lap may leave that lap's hover preview drawn in 2D until the next pointer move.
- User impact: a stale lap highlight after the view switch (unconfirmed; reproduce first).
- Options: A) also `setHoveredLap(null)` in the cleanup; B) keep if it does not reproduce.

## OP-64 · Boolean helper created by the unit-length plan is not covered by the boolean plan
- Severity: Low · Source: docs/conventions
- From: conventions-migration fact-check 2026-10-24 (Q22)
- What: `docs/conventions/plans/unit-length-discipline.md` item 14 extracts a step from `useMapCameraEffect` that returns a boolean; `boolean-names-without-is-prefix.md` runs earlier and cannot list it, so the new helper may not get an `is…`/`has…` name.
- User impact: none.
- Options: A) the executing agent names it per boolean R5 when it creates it; B) a follow-up pass with the boolean check after the migration.

## OP-65 · Engine throws on contract-breaking input (deferred)
- Severity: Low · Source: packages/engine
- From: conventions-migration Q1, Q23, Q26 (2026-10-25)
- What: nine engine branches degrade silently on input that breaks their contract: `ewmaStep` non-finite TSS / load (`metrics.ts`), `predictRaceTime` no root in the solver bracket and `predictRaceTimes` invalid VDOT (`vdot.ts`), `calculateTrainingEffect` max HR ≤ rest HR (`trainingEffect.ts`), `intervalJoules` distance running backwards (`energy.ts`), `intensityFactor` FTP ≤ 0 (`stress.ts`), `referenceOf` FTP / threshold pace ≤ 0 (`effortDetection.ts`). The owner first wanted them to throw (Q1), then deferred it to keep the migration defensive (Q26). The Settings-fed sites cannot trigger once threshold validation (migration Q23) is live; `intervalJoules` sees real device noise and must stay silent.
- User impact: none today; a throw would put a session page on the error boundary.
- Options: A) throw at the Settings-fed and engine-internal sites once validation has been live for a while, keep `intervalJoules` silent; B) keep the engine silent.

## OP-66 · Generic app components cannot carry the FC annotation
- Severity: Low · Source: apps/web
- From: conventions-migration plan 2 (component-declaration-shape), 2026-10-25
- What: `GradeChart` (`apps/web/src/components/charts/GradeChart.tsx`), `ElevationChart` (`apps/web/src/components/charts/ElevationChart.tsx`) and `LapBands` (`apps/web/src/components/charts/LapBands.tsx`) are generic (`<T,>(props: …) =>`); `FC<…>` cannot carry a type parameter (TDR Trade-offs), so they keep their declaration, like the kit's `DataTable` (plan item 14). The plan did not list them.
- User impact: none.
- Options: A) accept generic components as the documented exception to R1 (as `DataTable`); B) drop the type parameter where callers use a single record type.

## OP-67 · Props types shared by several components or a helper keep their names
- Severity: Low · Source: apps/web, packages/ui
- From: conventions-migration plan 2 (component-declaration-shape), 2026-10-25
- What: R2 wants one `interface <Component>Props` directly above each component. Four props types are read by more than one unit and were left as they are: `ShellProps` (`DesktopOnboarding`, `PhoneCard`, `PhoneOnboarding` in `apps/web/src/features/onboarding/index.tsx`), `StepProps` (`OnboardingStep` and a helper in `apps/web/src/features/onboarding/OnboardingStep.tsx`), `StatRailProps` (`StatRail` and `StatRailContent` in `packages/ui/src/components/StatRail.tsx`), and the library type `FallbackProps` (`RouteErrorFallback`, `apps/web/src/components/ErrorFallbacks.tsx`).
- User impact: none.
- Options: A) settle them when the unit-length plan splits these modules (one component per module, props derived per library-type-narrowing); B) rename now with per-component interfaces.

## OP-68 · Union branches the exhaustive-maps plan did not list
- Severity: Low · Source: apps/web
- From: conventions-migration plan 17 (exhaustive-record-maps-over-branching), 2026-10-25
- What: three spots still branch on a closed union and were left as they are because the plan did not list them: `fitOptions` (`apps/web/src/features/map/hooks/useMapCameraEffect.ts`, `fit === 'overview' || fit === 'trip'` with a fallback for the other six `MapCameraFit` members), `lapsRowLabels` (`apps/web/src/features/sessions/session/lapLabels.ts`, `source === 'off'` / `'splits'` / `'efforts'` mixed with `set` checks), and `MoreStatsTopic` in `apps/web/src/lib/moreStats.ts`, a hand-written union beside the runtime list `TOPIC_ORDER` (R1). `pickMethod` in `packages/engine/src/energy.ts` keeps `if (method === 'heartRate' && body.gender === undefined) continue;` (a single guard, not a chain; the plan's item 13 grep still prints it).
- User impact: none.
- Options: A) convert them (switch with shared arms for `fitOptions`/`lapsRowLabels`, `TOPIC_ORDER as const` + derived type) when the unit-length plan next touches these modules; B) leave them.

## OP-69 · Flaky specs from random test data
- Severity: Medium · Source: packages/testing, apps/web/tests
- From: conventions-migration run, plans 16 and 17 (2026-10-25)
- What: the record generators in `packages/testing/src/records.ts` (`makeCyclingRecords` and friends) draw from `Math.random`, so specs built on them fail now and then: `records.computePbsForSessions.spec.ts` "returns best values from the stronger cycling session" (1 of 4 runs), also seen in `dynamicLaps` and `validation.integration`. The generator logic is unchanged since the base commit; the flakiness predates the migration.
- User impact: none; CI and local runs fail at random.
- Options: A) seed the generators (a small seeded PRNG passed in or set per spec); B) widen the margins in the affected specs; C) list them in `flaky.md`.

## OP-70 · Studio route delete still waits for the IndexedDB points delete
- Severity: Low · Source: apps/web
- From: conventions-migration plan 23 (one-server-call-per-hook-module), 2026-10-25
- What: the plan's item 8 made `handleDelete` in `apps/web/src/features/studio/DeleteStudioRouteDialog.tsx` synchronous (`deleteStudioRoute.mutate(…)`, dialog closes and `onDeleted` runs at once, a failed points delete becomes the mutation's error state). That is a behaviour change the owner has not confirmed (Decisions › Defensive), so the dialog keeps today's flow through the new `useDeleteStudioRouteMutation`: `await deleteStudioRoute.mutateAsync({ routeId }).catch(() => undefined)`, then close and `onDeleted`. The plan's check (`async ()`/`catch(` absent) still prints these two lines. A plain `mutate(…, { onSettled })` would not work either: the store delete can unmount the dialog first, and TanStack skips per-call callbacks without a mounted observer.
- User impact: none today (same timing, same swallowed error).
- Options: A) keep it; B) adopt the plan's version (dialog closes before the points delete finishes, failure kept as mutation error state).

## OP-71 · Board pixel size and z-index literals the token plan did not list
- Severity: Low · Source: tools/workbench
- From: conventions-migration plan 28 (styled-api-over-sx), 2026-10-25
- What: the TDR binds `tools/workbench/site/src` to R3, but the plan's item 20 covers only the board's colours. Its R3 grep still prints two board literals no item names: `h-[420px]` (`tools/workbench/site/src/app/ReviewPane.tsx:175`) and `z-[45]` (`tools/workbench/site/src/app/WriteCard.tsx:151`). Both stay as they are. The TDR's z-index clause governs `packages/ui` only, so `z-[45]` may be out of scope; `h-[420px]` is a pixel size.
- User impact: none (board only, same pixels).
- Options: A) add `--spacing-420px` to the kit theme and use `h-420px` (the board imports the kit theme), and leave `z-[45]` as a non-kit layer; B) leave both and narrow the TDR's board clause to colours; C) also give the board's layer a `--z-index-*` token.

## OP-72 · Engine names the naming plan did not list
- Severity: Low · Source: packages/engine
- From: conventions-migration plan 30 (names-spell-out-their-meaning), 2026-10-25
- What: the TDR's R2/R3 detection still prints engine names no plan item renames: the exported functions `activeSeconds` (`packages/engine/src/normalize.ts:13`, read by six engine modules) and `coastingSeconds` (`packages/engine/src/cadence.ts:13`, read by `apps/web/src/lib/moreStats.ts`), the module constants `GAP_GRADIENT_LIMIT` and `GAP_CURVE_COEFFICIENTS` (`normalize.ts:9,11`, GAP is grade-adjusted pace, which R2 spells out), and the climb helper `metresPerHour` with the field `Climb.gain` (`climbs.ts`, metres without a unit suffix). All stay as they are. Typed single-letter parameters such as `(a: GPSPoint, b: GPSPoint)` also stay: the TDR's reference implementation uses them, the plan's R4 check does not match them, the TDR's R4 grep does.
- User impact: none (names only).
- Options: A) rename in a follow-up: `activeDurationSec`, `coastingDurationSec`, `GRADE_ADJUSTED_PACE_GRADIENT_LIMIT`, `GRADE_ADJUSTED_PACE_CURVE_COEFFICIENTS`, `metersPerHour`, `gainMeters`; B) leave them and list `…Seconds` function names and the typed `(a, b)` pair as exceptions in the TDR.

## OP-73 · Older read modules pause while the browser is offline
- Severity: Medium · Source: apps/web
- From: conventions-migration plan 32 (effects-are-rare), 2026-10-25
- What: TanStack Query's default `networkMode: 'online'` pauses a query while `navigator.onLine` is false. The read modules plan 32 added over IndexedDB and the GPS worker (`queries/studio/useStudioRoutePoints.ts`, `queries/sessions/useSessionRecords.ts`, `useSessionLaps.ts`, `useSessionGps.ts`, `useSessionGpsTracks.ts`, `useOutdatedSessionsReprocessing.ts`, `useTrainingLoadRecompute.ts`, `queries/settings/useStorageBreakdown.ts`) set `networkMode: 'always'` so they keep today's offline behaviour. The local read modules from earlier plans do not: `queries/records/usePersonalBests.ts` (worker) and `queries/onboarding/useOnboardingPreviewRoutes.ts` still pause offline; `lib/queryClient.ts` sets no default. Not changed here (outside this plan's items).
- User impact: offline, personal bests (and the onboarding preview routes) can stay in their loading state until the browser reports a connection.
- Options: A) set `networkMode: 'always'` on those two modules; B) set it as the default in `createQueryClient` and opt the Open-Meteo and intervals.icu modules back into `'online'`; C) leave it.

## OP-74 · TDRs still name the IndexedDB modules merged into `db.ts`
- Severity: Low · Source: docs/conventions
- From: conventions-migration plan 39 (helpers-group-by-topic), 2026-10-26
- What: plan 39 merged `apps/web/src/lib/indexeddb.ts`, `idbStorage.ts` and `weatherDb.ts` into `apps/web/src/lib/db.ts`. TDRs stay fixed during the migration, so four still cite the old paths: `docs/conventions/tdr/collaborators-replaced-with-mocks.md` (R5 and the `vi.mock('@/lib/indexeddb.ts')` example), `effects-are-rare.md` (detection list), `helpers-split-by-reachability.md` (reference example with `indexeddb.ts:4-7`), `one-server-call-per-hook-module.md` (Context). The code no longer has these files.
- User impact: none for app users; an agent reading those TDRs looks for modules that do not exist.
- Options: A) rewrite the four citations to `apps/web/src/lib/db.ts` after the migration; B) leave them as historical examples.

## OP-75 · A bare `vp check` in `tools/workbench` fails on backlog Markdown formatting
- Severity: Low · Source: tools/workbench
- From: conventions-migration plan 43 (unit-length-discipline), 2026-10-26
- What: run inside `tools/workbench`, a bare `vp check` also formats the backlog and stops at formatting errors in 8 Markdown files the migration workers append to (among them `conventions-migration/review/progress.md`, `review/carryover.md`, `conventions-follow-ups/research/open-points.md`). The root `vp run check` (astro check for the workbench) and `vp check scripts site/src tests` pass. Nothing was reformatted (bare `vp fmt` is banned during the migration).
- User impact: none for app users; an agent running a bare `vp check` in the workbench sees a failure unrelated to code.
- Options: A) format the backlog Markdown once after the migration; B) leave `backlog/` out of the workbench formatting check; C) leave it.

## OP-76 · Three TDR examples still import kit components from their old flat paths
- Severity: Low · Source: docs/conventions
- From: conventions-migration plan 45 (component-directory-and-file-naming), 2026-10-26
- What: the plan's item 50 rewrites the kit imports in `docs/conventions/tdr/ui-primitives-from-react-ui.md` (R1 text "import it from `@pacevault/ui/components/<Name>.tsx`" and the `Tabs`/`TabsList`/`TabsTrigger` example), `library-type-narrowing.md` (`DialogContent, DialogRoot` from `Dialog.tsx`) and `unit-length-discipline.md` (`ChartRow`). Not done: the item's plan (Approach step 6) keeps TDRs fixed during implementation. The kit now lives at `@pacevault/ui/components/pv<Name>/Pv<Name>.tsx` with `Pv`-prefixed exports, so these examples point at files that no longer exist. `rg -n "@pacevault/ui/components/[A-Z]" docs/conventions/tdr` lists them (also hits in `context-provider-accessor-pairs.md`, `formatting-through-intl-namespace.md`, `navigation-through-router-hooks.md`, `snackbar-feedback-via-feature-maps.md` that the plan did not name).
- User impact: none for app users; an agent reading those TDRs copies an import path that does not resolve.
- Options: A) apply item 50 (and the same rewrite to the four unnamed TDRs) after the migration; B) leave the examples as historical.

## OP-77 · The item-explore mockup prompt names the old kit file paths
- Severity: Low · Source: .claude/skills
- From: conventions-migration plan 45 (component-directory-and-file-naming), 2026-10-26
- What: `.claude/skills/item-explore/references/mockup-prompt.md:36` and `:39` list `packages/ui/src/components/Card.tsx`, `Typography.tsx`, `Button.tsx`, `Label.tsx`, `Input.tsx`, `FloatingPill.tsx`, `RadioGroup.tsx`, `ResponsivePopover.tsx`, `Popover.tsx`, `Dialog.tsx`, `BottomSheet.tsx` (and `glassClass`/`floatingClass`/`tileClass`, gone since plan 15); `:79`, `:80`, `:99` name `Typography`, `Button`, `FloatingPill`. All moved to `components/pv<Name>/Pv<Name>.tsx` with `Pv` names. Outside the plan's file list, left unchanged.
- User impact: none for app users; a mockup research agent reads paths that do not exist.
- Options: A) rewrite the skill reference to the `pv<Name>/Pv<Name>.tsx` paths and `lib/surfaces.ts` constants; B) leave it.

## OP-78 · The tooling gates are on, but the TDRs do not record them
- Severity: Low · Source: docs/conventions
- From: conventions-migration plan 46 (tooling), 2026-10-26
- What: every item of `tooling.md` ends with "Then: set `enforcedBy` in the backed TDR's Section 3 … and flip its Section 2 Enforcement to `enforced`". Not done: TDRs stay fixed during the migration (item plan, Approach step 6). Gates now on whose TDR rows still read `proposed`/`manual`: `effects-are-rare` R7 (`react-hooks/exhaustive-deps` error), `component-declaration-shape` R1 (`func-style`), `index-modules-are-not-barrels` R8 (`import/no-relative-parent-imports`, limited to R8's scope, OP-79), `navigation-through-router-hooks` R8 (`no-restricted-imports` for `Link`/`NavLink`), `exhaustive-record-maps-over-branching` R3 (`typescript/switch-exhaustiveness-check`, `considerDefaultExhaustiveForUnions: false`), `domain-error-subclasses` R1 (`typescript/only-throw-error`), `hooks-return-the-fitting-shape` R2 (`typescript/explicit-module-boundary-types` on `use*` files, OP-79), `floating-promises-marked-void` R1 (`typescript/no-floating-promises` + `no-misused-promises`), `collaborators-replaced-with-mocks` R6 (`typescript/no-unsafe-type-assertion` on `apps/web/tests/**`), all in the root `vite.config.ts`; `engine-holds-domain-logic-only` R3 import half (`engine-is-pure` via `tools/workbench/scripts/boundaries.ts` in `vp run check`; Enforcement stays `proposed`); `styled-api-over-sx` R3/R5 (`tools/workbench/scripts/themeTokens.ts` in `vp run check`, `apps/web/src` and `packages/ui/src`; Enforcement stays `manual`). Also stale: `hooks-return-the-fitting-shape.md:112` says R2 has no failing gate.
- User impact: none for app users; an agent reading the TDRs believes the rules are review-only.
- Options: A) apply the "Then" steps of the deleted `tooling.md` (as listed here) after the migration; B) leave the TDRs as they are.

## OP-79 · Two lint gates are narrower than `tooling.md` wrote them
- Severity: Low · Source: vite.config.ts
- From: conventions-migration plan 46 (tooling), 2026-10-26
- What: (1) gate 7 as written (`typescript/explicit-function-return-type` with `allowExpressions`) reported 83 errors, every one an inner callback or local helper inside a hook (`const handleDragEnter = (e) => …`), none an unannotated hook; its `use*` glob also matched `apps/web/src/store/user.ts`. Hooks R2 asks only for exported hooks, so the gate uses `typescript/explicit-module-boundary-types` on the same globs (exported functions need return and parameter types); three exported helpers in `apps/web/src/queries/records/usePersonalBests.ts` gained return types (agent decision in `conventions-migration/review/decisions.md`). (2) gate 3 (`import/no-relative-parent-imports`) as a global rule reported 245 imports in `packages/engine/tests`, `packages/gpx/tests`, `packages/ui/src` and `tests`, `packages/i18n/scripts`, `tools/docs/banner/page` and the workbench's `site/astro.config.mjs` and `site/src/lib/devPlugin.ts`, all outside R8's scope (`index-modules-are-not-barrels` Scope: the kit and the engine import themselves by relative path; the two Astro-config modules load before the aliases exist). An override turns it off for `packages/**`, `tools/docs/**` and those two modules; the three hits inside the scope (`useThresholdTileReading.ts`, `useIntervalsKeyInput.ts`) now import through `@/`.
- User impact: none.
- Options: A) keep both as they are; B) annotate every inner hook function too (83 sites) and switch gate 7 to the planned rule; C) give `packages/engine/tests`, `packages/gpx/tests` and `tools/docs` aliases and widen gate 3.

## OP-80 · `engine-is-pure` does not see a bare `react` import that cannot resolve
- Severity: Low · Source: tools/workbench
- From: conventions-migration plan 46 (tooling), 2026-10-26
- What: the plan's check plants `import { useState } from 'react'` in an engine module. `packages/engine` does not declare React, so under pnpm the import does not resolve: the engine's own `vp check` fails first (`TS2307`), and dependency-cruiser records an unresolved `react` that the rule's `to.path` (`node_modules/(@types/)?(react|react-dom|zustand)/`) does not match, so `boundaries.ts` alone passes it. The gate was proven with a resolvable violation instead (`import { useLayoutStore } from '../../../apps/web/src/store/layout.ts'` in `packages/engine/src/geodesy.ts`: `vp run check` failed with `engine-is-pure packages/engine/src/geodesy.ts → apps/web/src/store/layout.ts`; removed, it passed). React or zustand are caught only once someone also adds them to the engine's `package.json`.
- User impact: none; the type check catches the unresolved import today.
- Options: A) also match unresolved module names (`'^(react|react-dom|zustand)$'` in `to.path`, or `couldNotResolve`); B) widen `to` to `{ pathNot: '^packages/engine/' }` as the deleted plan's Open items suggested (also covers R3's "engine modules import only engine modules"); C) leave it.

## OP-81 · Leftover open items of `tooling.md`
- Severity: Low · Source: docs/conventions
- From: conventions-migration plan 46 (tooling), 2026-10-26
- What: the deleted plan listed these as not done: (1) `exhaustive-record-maps-over-branching` R1 (no TypeScript `enum`): the run found no general enum ban in the installed oxlint (`oxc/no-const-enum` covers only `const enum`), so R1 stays manual; (2) `apps/web/src/features/map/map-attribution.css` is on the theme-token allowlist (MapLibre attribution overrides, `rgb(0 0 0 / 0.6)`, `rgb(255 255 255 / 0.5|0.6|0.8)`); four exact-alpha tokens read as `var(--color-…)` would shrink the allowlist to the two theme files; (3) `mirrored-spec-layout` R7 (one setup file per tree) has no lint rule; its `enforcedBy` could name `apps/web/vitest.config.ts`; (4) the theme-token check scans neither `tools/docs/banner/page` (its `banner.css` would join the allowlist) nor the board. Effects R2/R3 stay review-time (owner, Q13).
- User impact: none.
- Options: A) handle each point after the migration; B) leave them.

## OP-82 · Pace calculator shows a decimal dot in German
- Severity: Low · Source: apps/web (labs)
- From: conventions-migration round 2, Q34 (2026-10-27)
- What: the pace calculator (`PaceCalculator.tsx`, three `type="text"` fields) writes the solved value with `toFixed` and parses its fields back with `Number(...)`, so German shows `4.5` while the rest of the app shows `4,5` after the `toFixed` → `formatNumber` change of round 2.
- User impact: inconsistent decimal separator in German, only in this calculator.
- Options: A) keep; B) format with `formatNumber` and parse the fields locale-aware (comma and dot), with specs.
