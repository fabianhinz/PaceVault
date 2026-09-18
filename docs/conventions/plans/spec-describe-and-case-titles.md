---
id: spec-describe-and-case-titles
tdr_reference: tdr/spec-describe-and-case-titles.md
generated: 2026-09-17
---

# Specs declare their unit via a symbol-bound describe and name cases as "should" sentences

Read `tdr/spec-describe-and-case-titles.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Bind the top-level describe to the imported symbol wherever one exists.
   Files: every spec under `tests/` whose top-level `describe` takes a string literal naming a symbol the spec already imports
   Change: `describe('deriveDistanceFromRecords', …)` becomes `describe(deriveDistanceFromRecords.name, …)`, and so on for `deriveAvgFromRecords`, `deriveMaxFromRecords`, `mapFitLaps`, `positionAtDistance`, `distanceAtPosition`, `pickBoundsFromCorners`, `filterTracksByPickBounds`, `segmentAtDistance`, `computePopupPosition`, `buildSportColoredPath` and every other case the R2 signal reports. A rename then carries into the test report instead of leaving a plausible title pointing at nothing.
   Check: R2's grep reports no remaining string-literal describe that matches an imported binding's name; `pnpm test -- --run`.

2. Keep a descriptive string where there is no single named binding.
   Files: `tests/parsers/fitSchemas.spec.ts`, `tests/hooks/useMetrics.spec.ts`, `tests/features/map/zoneColoredPath.spec.ts`, and the integration specs under `tests/store/` and `tests/engine/`
   Change: no change to the describe argument where the unit has no single symbol to point at — a module exporting several peer helpers, a Zod schema surface, a flow spanning several modules. `describe('fitRecordSchema', …)` can bind to the schema binding itself since it is imported; `describe('movingTime derivation (via laps)', …)` and `describe('useFilteredMetrics — filtering sessions before computeMetrics', …)` are R3's correct form and stay. Decide per describe and note the R3 ones in the commit message.
   Check: every remaining string-literal describe names a module or a surface, not a symbol the spec imports.

3. Rewrite case titles as `should …` sentences.
   Files: every spec under `tests/`
   Change: R4 — `it('returns empty array for empty input', …)` becomes `it('should return an empty array for empty input', …)`. This is the largest mechanical change in the plan; the great majority of case titles in `tests/parsers/`, `tests/engine/`, `tests/lib/` and `tests/store/` are written in the bare present tense. Work file by file so each commit is reviewable. A parameterised case follows the same rule in the title passed after the case table, allowing a leading `$`-property placeholder.
   Check: R4's grep reports no `it(` whose title does not begin `should `; `pnpm test -- --run` and read the reporter output — every line should read as a broken promise when it fails.

4. Collapse any file-scope case into the top-level describe.
   Files: any spec the R1 signal reports
   Change: R1 — a spec file contains exactly one top-level `describe`, and every case and nested group sits inside it. Move a file-scope `it` into the describe; split a file with two top-level describes into two specs under R10 of the layout record, or nest the second as a behaviour cluster if it belongs to the same subject.
   Check: R1's script reports exactly one top-level describe per spec; `pnpm test -- --run`.

5. Justify every nested describe.
   Files: the specs the R5 signal reports
   Change: a nested `describe` exists for exactly one of two reasons — it groups a separately exported helper from the same source module, or it groups a behaviour cluster named by a short noun phrase. Nesting that splits one behaviour across data shapes becomes a parameterised case instead.
   Check: each nested describe's title is either a symbol name or a short noun phrase; `pnpm test -- --run`.

## Open items

None.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
