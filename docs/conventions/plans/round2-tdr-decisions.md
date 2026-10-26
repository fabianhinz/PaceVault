---
id: round2-tdr-decisions
tdr_reference: tdr/formatting-through-intl-namespace.md
depends_on: []
generated: 2026-10-26
---

# Round 2: the owner's TDR decisions from the audit (R3)

Read `tdr/formatting-through-intl-namespace.md` first, then the other TDRs each item names (`signature-parameter-shape`, `colocated-types-module`, `ui-primitives-from-react-ui`). This file carries the owner's decisions from the review round (`tools/workbench/backlog/conventions-migration/review/findings.md` R3, plus the hand-built-control call from R2): two TDRs are deleted, three TDRs gain an exception or a clause, and two code changes follow from them. Unlike round 1, this plan edits TDRs on purpose; every TDR edit ends with the index regenerated.

Behaviour stays as it is, with one owner-accepted exception: display numbers that `toFixed` formats today show the locale's decimal separator, so German shows a decimal comma (`12,3` instead of `12.3`). English output stays byte-identical; a temporary pin proves it.

The conventions check used after every TDR edit, from the repo root:

```bash
node tools/workbench/backlog/conventions-migration/research/conventionsCheck.mjs docs/conventions --write
node tools/workbench/backlog/conventions-migration/research/conventionsCheck.mjs docs/conventions
```

Every item's Check includes `vp run check` clean and `vp run test` green.

## Depends on

Nothing. This is the first plan of round 2 (plan.md "Round 2 order").

## Changes

1. Delete the two TDRs copied from a server project (R3 decision 1).
   Files: `docs/conventions/tdr/classes-are-server-side-only.md`, `docs/conventions/tdr/server-class-role-suffixes.md`, `docs/conventions/CLAUDE.md`
   Change: delete both files. No other TDR, `CLAUDE.md` or code file names them (`rg -n "classes-are-server-side-only|server-class-role-suffixes"` outside the backlog hits only the two files themselves and `server-class-role-suffixes.md:29`, which goes with its file). Regenerate the index with `conventionsCheck.mjs docs/conventions --write`; its `governs` lines for both records disappear (today `docs/conventions/CLAUDE.md` lists `classes-are-server-side-only` under `apps/web/src/**/*.ts` and `*.tsx`, and `server-class-role-suffixes` under nine globs).
   Check: `ls docs/conventions/tdr | wc -l` prints 47; `rg -n "classes-are-server-side-only|server-class-role-suffixes" docs CLAUDE.md apps packages tools --glob '!tools/workbench/backlog/**'` prints nothing; the conventions check passes with 47 TDRs.

2. `signature-parameter-shape`: query/mutation fetchers keep one `options` object carrying `queryClient`/`signal` (R3 decision 2, `one-server-call-per-hook-module` R4 wins).
   Files: `docs/conventions/tdr/signature-parameter-shape.md`, `docs/conventions/CLAUDE.md`
   Change: today R6 (`signature-parameter-shape.md` rule table row R6 and its Forbidden bullet at line 200, "A `QueryClient`, abort signal or other thread-through handle declared as a field of the operation's object") contradicts `one-server-call-per-hook-module.md:40` R4 ("That function takes a single options object and every input is explicit in it, including … the query client"). Add the exception in three places:
   - §1 Context: a new paragraph after the `tools/workbench` paragraph: "One exception to R6, set by the owner: the fetcher of a read module in `apps/web/src/queries/` and the function of a write module in `apps/web/src/mutations/` (and the feature functions they forward to) take one `options` object that carries `queryClient` and `signal` as fields beside the domain inputs (`one-server-call-per-hook-module` R4 wins). Examples: `loadSessionGpsTracks(options: { detailedSessionIds; signal; queryClient; onSettled })` in `queries/sessions/useSessionGpsTracks.ts:42`, `syncAfterConnect(options: { queryClient; apiKey })` in `mutations/intervals/useConnectIntervalsMutation.ts:13`, `reprocessOutdated(options: { queryClient })` in `queries/sessions/useOutdatedSessionsReprocessing.ts:8`. Cache helpers that only take the client (`invalidatePersonalBests(queryClient)`) and helpers with a domain input plus the client (`invalidatePersonalBestsOfSession(sessionId, queryClient)`) keep R6."
   - §2 Rules, row R6: append "Exception: query and mutation fetchers carry `queryClient` and `signal` inside their single `options` object (§1)."
   - §3 Detection, `R6.falsePositives`: append "Also flags the query/mutation fetchers in `apps/web/src/queries/**` and `apps/web/src/mutations/**`, which carry the client in their `options` object by design (§1)."
   - §6 Forbidden practices, the `QueryClient` bullet: append "— outside the query/mutation fetchers of §1."
   Regenerate the index (the summary line is unchanged, so `docs/conventions/CLAUDE.md` should come out identical; the run proves it).
   Check: `rg -n "one-server-call-per-hook-module. R4" docs/conventions/tdr/signature-parameter-shape.md` prints the §1 paragraph; the conventions check passes.

3. Move the `QueryResults` payload types into `apps/web/src/types.ts` so it imports no implementation module (R3 decision 3, `colocated-types-module` R3).
   Files: `apps/web/src/types.ts`, `apps/web/src/queries/settings/useStorageBreakdown.ts`, `apps/web/src/lib/storageBreakdown.ts`, `apps/web/src/features/settings/DataManagementSection.tsx`, `apps/web/src/features/map/previewDrawIn.ts`, `apps/web/src/queries/onboarding/useOnboardingPreviewRoutes.ts`, `apps/web/src/features/map/hooks/useOnboardingPreviewLayer.ts`, `apps/web/src/lib/weather.ts`, `apps/web/src/lib/db.ts`, `apps/web/src/features/sessions/session/hooks/useWindRose.ts`, `apps/web/src/features/sessions/session/hooks/useWindExposure.ts`, `apps/web/src/features/sessions/session/WeatherDetails.tsx`, `apps/web/src/features/sessions/session/WeatherHourlyTable.tsx`, `apps/web/src/features/intervals/runIntervalsSync.ts`, `apps/web/src/mutations/intervals/useConnectIntervalsMutation.ts`, `apps/web/tests/lib/weatherSummary.spec.ts`, `apps/web/tests/features/map/previewDrawIn.spec.ts`
   Change: `apps/web/src/types.ts:14-17` type-imports four payload types from implementation modules: `StorageBreakdown` (`queries/settings/useStorageBreakdown.ts:6`), `PreviewPasses` (`features/map/previewDrawIn.ts:24`), `SessionWeather` (`lib/weather.ts:31`), `IntervalsSyncSummary` (`features/intervals/runIntervalsSync.ts:17`). Move each declaration verbatim into `types.ts`, together with what it is built from that also lives in an implementation module: `StorageCategory` (`lib/storageBreakdown.ts:3`), `PreviewPass` (`features/map/previewDrawIn.ts:12`, keeps its three doc comments), `WeatherSnapshot` (`lib/weather.ts:18`). `types.ts` then imports only `@pacevault/engine/types.ts` (add `GPSBounds`, `Sport`) and `@pacevault/gpx/types.ts`. Delete lines 14-17. Every module that declared or imported one of the seven names imports it from `@/types.ts` instead (the declaring modules too: `lib/storageBreakdown.ts`, `previewDrawIn.ts`, `lib/weather.ts`, `runIntervalsSync.ts`); `lib/db.ts:5` `import type { SessionWeather } from './weather.ts'` → `@/types.ts`. No re-export is left behind (index-modules-are-not-barrels).
   Check: `rg -n "^import" apps/web/src/types.ts` prints only the two `@pacevault/*` imports; `rg -n "export (interface|type) (StorageBreakdown|StorageCategory|PreviewPasses|PreviewPass|SessionWeather|WeatherSnapshot|IntervalsSyncSummary)\b" apps/web/src` prints only `apps/web/src/types.ts` lines; `vp run check` clean.

4. Pin today's English output of every `toFixed` display site (temporary).
   Files: new `apps/web/tests/lib/displayNumbersPin.spec.ts`
   Change: before item 5 or 6 touches any code, write a spec that records today's English strings as literals (no computed expectation): `railFixed1` and `railSigned1` (`apps/web/src/lib/railFormat.ts:10,15`) for `0`, `-0.04`, `0.04`, `0.25`, `-2.25`, `12.34`, `null`; `formatBytes` (`lib/formatters.ts:186`) for `512 * 1024`, `1.25 * 1024 * 1024`, `1536.4 * 1024 * 1024`; `formatDistance` (`lib/formatters.ts:227`) for `999`, `1000`, `12_345`, `1_234_567`; and, for the component and message sites, the exact expressions they use today written against the same inputs as literal expectations: `(n).toFixed(0)` for `0`, `99.5`, `1234.4` (trip load), `.toFixed(1)` for `0`, `1.25`, `-0.04`, `45.67` (VDOT, ACWR, TSB), `.toFixed(2)` for `0`, `1.005`, `1.2`, `1234.567` (ACWR in the coach rationale, marker km). Run it green on today's tree; items 5 and 6 then switch each `describe` from the `toFixed` expression to the new call (same inputs, same literal expectations).
   Check: `vp test apps/web/tests/lib/displayNumbersPin.spec.ts` passes before item 5.

5. Number modes for the `toFixed` displays and the two sites inside `formatters.ts` (R3 decision 4).
   Files: `apps/web/src/lib/formatters.ts`
   Change: today `NumberFormatMode` (`formatters.ts:74-81`) groups thousands in every fixed mode; `toFixed` never groups. Add three modes so English stays byte-identical where a value can reach 1000: `'integer-ungrouped'` (`maximumFractionDigits: 0, useGrouping: false`), `'fixed-one-decimal-ungrouped'` (`minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false`), `'fixed-two-decimals-ungrouped'` (`minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false`), each with its `NUMBER_FORMATS` entry. Then: `formatBytes` (`:189`) `` `${(kb / 1024).toFixed(1)} MB` `` → `` `${formatNumber(kb / 1024, 'fixed-one-decimal-ungrouped')} MB` ``; `formatDistance` (`:230`) `` `${(meters / 1000).toFixed(1)} km` `` → `` `${formatNumber(meters / 1000, 'fixed-one-decimal-ungrouped')} km` ``. `toKm` (`:235`) keeps `toFixed(2)`: after item 6 its only callers fill the studio marker form's km input fields (`features/studio/hooks/useStudioMarkerForm.ts:89,90,140,158`), which `Number.parseFloat` reads back (`:117-118,136,153,174`), so it is a machine value, not a display.
   Check: `rg -n "toFixed" apps/web/src/lib/formatters.ts` prints only `toKm` (`:235`); the pin's `formatBytes`/`formatDistance` cases pass unchanged.

6. Route the remaining `toFixed` display sites through `formatNumber` (R3 decision 4).
   Files: `apps/web/src/lib/railFormat.ts`, `apps/web/src/features/dashboard/ReadinessGauge.tsx`, `apps/web/src/features/dashboard/ACWRGauge.tsx`, `apps/web/src/features/trips/TripStatsGrid.tsx`, `apps/web/src/features/labs/RacePredictor.tsx`, `apps/web/src/lib/prescription.ts`, `apps/web/src/features/studio/markers/MarkerRow.tsx`, `apps/web/src/features/studio/hooks/useStudioTrackPickSegment.ts`, `apps/web/tests/lib/displayNumbersPin.spec.ts`
   Change (`rg -n "toFixed\(" apps/web/src` lists 17 lines with 20 calls; these are the display ones):
   - `lib/railFormat.ts:12` `value.toFixed(1)` → `formatNumber(value, 'fixed-one-decimal')`; `:17` `` `+${value.toFixed(1)}` `` → `` `+${formatNumber(value, 'fixed-one-decimal')}` ``; `:18` `` `−${Math.abs(value).toFixed(1)}` `` → `` `−${formatNumber(Math.abs(value), 'fixed-one-decimal')}` `` (the explicit `+` and U+2212 `−` stay, so a value that rounds to zero keeps its sign as today); `:19` → `formatNumber(value, 'fixed-one-decimal')`. Speeds and grades stay far below 1000, so the grouped mode is safe.
   - `features/dashboard/ReadinessGauge.tsx:30` `` `${tsb > 0 ? '+' : ''}${tsb.toFixed(1)}` `` → `` `${tsb > 0 ? '+' : ''}${formatNumber(tsb, 'fixed-one-decimal')}` `` (Intl prints `-0.0` for `-0.04` like `toFixed`).
   - `features/dashboard/ACWRGauge.tsx:40` `acwr.toFixed(1)` → `formatNumber(acwr, 'fixed-one-decimal')`.
   - `features/trips/TripStatsGrid.tsx:47` `totals.tss.toFixed(0)` → `formatNumber(totals.tss, 'integer-ungrouped')` (a trip's load can pass 1000).
   - `features/labs/RacePredictor.tsx:84` `predictor.vdot?.toFixed(1) ?? '--'` → keep the missing case explicit: render `'--'` when `predictor.vdot === undefined`, else `formatNumber(predictor.vdot, 'fixed-one-decimal')` (single-level ternary in JSX).
   - `lib/prescription.ts:235` `acwr: context.acwr.toFixed(2)` → `acwr: formatNumber(context.acwr, 'fixed-two-decimals')` (the coach rationale message parameter).
   - `features/studio/markers/MarkerRow.tsx:28,31` `toKm(…)` → `formatNumber(… / 1000, 'fixed-two-decimals-ungrouped')`; same in `features/studio/hooks/useStudioTrackPickSegment.ts:65,67`. Drop the then-unused `toKm` imports (`MarkerRow.tsx:7`, `useStudioTrackPickSegment.ts:5`).
   Not display, unchanged: SVG path data `lib/profileHistory.ts:110,112,114`, SVG points `features/sessions/session/Wedges.tsx:16`, the CSS colour string `features/map/terrainLine.ts:45`, the marker-form input values through `toKm` (item 5), and the pace calculator's solved field `features/labs/hooks/usePaceCalculator.ts:53` (owner, Q34 (1): keeps `toFixed`; see Settled). Switch each pin `describe` to the new call with the same literal expectations, run it green, then delete `apps/web/tests/lib/displayNumbersPin.spec.ts`.
   Check: `rg -n "toFixed\(" apps/web/src` prints exactly `profileHistory.ts:110,112,114` (two calls each on `:110` and `:112`), `Wedges.tsx:16` (two calls), `terrainLine.ts:45`, `formatters.ts` `toKm`, `usePaceCalculator.ts:53`; the pin passed after the switch and is deleted (`ls apps/web/tests/lib/displayNumbersPin.spec.ts` fails); `vp run e2e` passes (English strings unchanged); the German captures of dashboard, session detail and settings show decimal commas in the gauges, rail values, distances and storage sizes, and nothing else changed (`vp run workbench:capture` against the "before" shots).

7. Formatting TDR: a `toFixed` clause in Rules and Detection (R3 decision 4).
   Files: `docs/conventions/tdr/formatting-through-intl-namespace.md`, `docs/conventions/CLAUDE.md`
   Change: frontmatter `adopted_rules: [R1, R2, R3, R7, R8]` → `[R1, R2, R3, R7, R8, R9]`; §1 Context "This file carries R1, R2, R3, R7 and R8." → "… R7, R8 and R9."; summary: append ", and never format a displayed number with toFixed"; §2 Rules, new row after R8: "| R9 | Never format a number a user reads with `toFixed`. Route it through `formatNumber` with a `NumberFormatMode` (add a mode when none fits, `-ungrouped` when the value can reach 1000 and today's output has no group separator), so the decimal separator follows the locale. `toFixed` stays for machine strings: SVG path and point data, CSS colour strings, and values written into an input field that code parses back with `Number`/`parseFloat`. | proposed |"; §3 Detection, new entry:
   ```yaml
   R9:
     type: grep
     pattern: "\\.toFixed\\("
     include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx"]
     exempt: []
     violationWhen: any-match
     enforcedBy: null
     falsePositives: >
       Machine strings: SVG path data in `lib/profileHistory.ts`, SVG points in
       `features/sessions/session/Wedges.tsx`, the rgba string in `features/map/terrainLine.ts`,
       `toKm` in `lib/formatters.ts` (marker-form input values) and the pace calculator's solved
       field in `features/labs/hooks/usePaceCalculator.ts`. Read each hit.
   ```
   §6 Forbidden practices, new bullet: "❌ `value.toFixed(1)` on a number a user reads — it always prints a decimal point; use `formatNumber(value, 'fixed-one-decimal')`." Regenerate the index (the summary line changes on every `governs` line of this record).
   Check: `rg -n "^\| R9" docs/conventions/tdr/formatting-through-intl-namespace.md` prints one row; `rg -n "toFixed" docs/conventions/CLAUDE.md` prints the three regenerated summary lines; the conventions check passes.

8. `ui-primitives-from-react-ui`: the five feature-specific hand-built controls are an accepted exception (R2, owner).
   Files: `docs/conventions/tdr/ui-primitives-from-react-ui.md`, `docs/conventions/CLAUDE.md`
   Change: in §1 Context, after the Scope paragraph, add: "Accepted exception (owner, 2026-10-26): five controls are built in `apps/web` from kit parts and plain elements because they are specific to one feature, not part of the shared visual language, so R1 and R5 do not move them into the kit: `StepButton` (`features/sessions/session/StepButton.tsx`), `TripFormDialog` (`features/trips/TripFormDialog.tsx`), `PaceEstimateButton` (`features/settings/PaceEstimateButton.tsx`), `StudioColorPicker` (`features/studio/StudioColorPicker.tsx`) and `StudioMarkerPins` (`features/studio/markers/StudioMarkerPins.tsx`). They stay feature components and move with their feature (round 2 `features/` → `components/`). A sixth control of the same kind is not covered by this list; it goes through R5." In §3 Detection, `R5.reason`: append " The five controls listed in §1 are accepted exceptions." Regenerate the index (summary unchanged; the run proves it). The paths are today's; `round2-rules-and-gates` rewrites them to `components/…` after the move.
   Check: `rg -n "StudioMarkerPins" docs/conventions/tdr/ui-primitives-from-react-ui.md` prints the §1 paragraph; the conventions check passes.

## Open items

- The marker form's km fields (`toKm` in `useStudioMarkerForm.ts`) stay on `toFixed` for the reason under Settled (input values read back with `Number.parseFloat`); the marker list row and the track-pick subtitle (item 6) show German commas, the form fields keep a point.
- `one-server-call-per-hook-module.md:47` (R11) still names `apps/web/src/types/index.ts` for the `QueryResults` registry; the file is `apps/web/src/types.ts`. Path fixes in TDRs belong to `round2-rules-and-gates`; flagged here so it is not lost.
- The follow-ups entry "crashSignal as a hand-rolled store" (`tools/workbench/backlog/conventions-follow-ups/research/open-points.md:117-118`) names `classes-are-server-side-only.md` R3 as its source; after item 1 that file is gone. The entry itself stays valid (a module singleton beside the zustand stores); its "From" line is for the owner to reword.

## Settled

- **Pace calculator keeps `toFixed`** (owner, Q34 (1), 2026-10-27: "keep for now but add as an open point the inconsistency"): `features/labs/hooks/usePaceCalculator.ts:53` writes the solved distance with `toFixed(2)` into the distance input (`features/labs/PaceCalculator.tsx:25,62`), which is read back with `Number(distanceInput)` (`usePaceCalculator.ts:33`) and accepts only a decimal point. It is an input value, not a display, so item 6 leaves it and item 7 lists it in the R9 `falsePositives`. The resulting German inconsistency (the calculator shows `4.5`, the rest of the app `4,5`) is OP-82 in `tools/workbench/backlog/conventions-follow-ups/research/open-points.md`.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans; items 1, 2, 7 and 8 regenerated it, so it is already correct once this file is gone.
