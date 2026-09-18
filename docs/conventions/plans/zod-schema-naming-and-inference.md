---
id: zod-schema-naming-and-inference
tdr_reference: tdr/zod-schema-naming-and-inference.md
generated: 2026-09-17
---

# Schemas named with a Schema suffix, types inferred from them

Read `tdr/zod-schema-naming-and-inference.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Give the two abbreviated leaf validators a `Schema` suffix.
   Files: `src/parsers/fitSchemas.ts`
   Change: `optDateTime` and `optNum` are Zod bindings with no `Schema` suffix, which R1 requires of every binding whatever its role — including a leaf validator. Rename them `optionalDateTimeSchema` and `optionalNumberSchema`; the abbreviations go with the rename, since the suffix is what marks them as validators and the prefix should say what they validate. Update every use inside the module.
   Check: `grep -nE "= z\.[a-z]" src/parsers/fitSchemas.ts` shows every binding ending in `Schema`; `pnpm test -- --run tests/parsers/fitSchemas.spec.ts` passes.

2. Correct the one derived type name that carries a role word after the suffix strip.
   Files: `src/parsers/fitSchemas.ts:69`, plus every importer of `FitLapInput`
   Change: `export type FitLapInput = z.infer<typeof fitLapSchema>` derives from `fitLapSchema`, so R4 fixes its name as `FitLap` — the PascalCase of the schema name with `Schema` stripped, nothing appended. Rename the type and every importer. If the name `FitLap` collides with an existing type, that collision is the signal that one of the two is misnamed; resolve it by renaming the other, not by keeping `Input`.
   Check: `grep -rn "FitLapInput" src tests` returns nothing; `pnpm check && pnpm test -- --run`.

3. Confirm `z.infer` is the right derivation for both existing inferred types.
   Files: `src/parsers/fitSchemas.ts`, `src/lib/weather.ts`
   Change: R5 reserves `z.input` for a consumer holding the shape *before* parsing. Both current types describe post-parse values, so both stay on `z.infer`. Read each schema for a `.default()`, `z.coerce` or `.transform()` that would make the pre- and post-parse shapes differ; if one exists and a caller assembles the pre-parse shape, add a separate `z.input`-derived type rather than switching the existing one.
   Check: no change expected; `pnpm check`.

4. Check for hand-written types that restate a schema's shape.
   Files: `src/parsers/fitSchemas.ts`, `src/lib/weather.ts`, `src/packages/gpx/parseGpx.ts`, and the modules that consume them
   Change: run R3's detection. For every schema, confirm no `interface` or object `type` elsewhere restates the same shape. Where one does, delete it and infer from the schema instead — the schema is the source.
   Check: `pnpm check && pnpm test -- --run`.

5. Unexport any derived type with no consumer outside its module.
   Files: `src/parsers/fitSchemas.ts`, `src/lib/weather.ts`
   Change: R7 keeps a type module-local when only its own module reads it. For each exported inferred type, search for importers; drop the `export` where there are none.
   Check: `pnpm check` still passes with the exports removed.

## Open items

`src/packages/gpx/parseGpx.ts` declares a `pointSchema` that satisfies R1 and R2 but derives no type. That is not a violation — R3 requires the type to come *from* the schema when a type is needed, not that every schema produce one.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
