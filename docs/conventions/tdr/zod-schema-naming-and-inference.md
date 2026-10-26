---
kind: pattern-apply-tdr-reference
id: zod-schema-naming-and-inference
title: Schemas named with a Schema suffix, types inferred from them
summary: Every zod binding is lowerCamelCase with a Schema suffix, and its TypeScript type is z.infer of it, named as the schema name in PascalCase minus the suffix.
governs:
  - "apps/web/src/**/*.ts"
  - "apps/web/src/**/*.tsx"
  - "packages/gpx/src/**/*.ts"
  - "tools/docs/banner/**/*.ts"
  - "tools/workbench/scripts/**/*.ts"
  - "tools/workbench/site/src/**/*.ts"
  - "tools/workbench/site/src/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Schemas named with a Schema suffix, types inferred from them

## 1. Context

This file carries rules R1 through R7.

Every shape that crosses a boundary in this app — a FIT file decoded by `fit-file-parser`, an intervals.icu or Open-Meteo response, a persisted IndexedDB entry, a worker message — is declared once as a zod schema and validated with `safeParse` (root `CLAUDE.md` §2). The compile-time type for that shape is derived from the schema rather than written beside it, so a field added, renamed or made optional in the validator propagates to every consumer. This record governs two things only: what the schema binding is called, and how the type is obtained from it. Where a schema lives is the parser's or consumer's module (`fitSchemas.ts` beside the FIT parser); worker contracts have their own record.

The rules bind `packages/gpx/src` as well, where the GPX parser validates each track or route point it reads from the XML (`parsedGpxPointSchema` and its inferred `ParsedGpxPoint` in `parseGpx.ts`).

The rules bind `tools/docs/banner/**/*.ts` too, where the capture validates the message catalogue it reads (`messagesSchema`). There the schema is applied with `.parse` and throws on bad input: the tool records that fail-fast exemption from root `CLAUDE.md` §2 in `tools/docs/CLAUDE.md`. Naming and inference (R1–R7) are unchanged by it.

The rules bind `tools/workbench` (`scripts/`, `site/src/`) as well, which imports zod from `zod` only; its artefact schemas follow cross-boundary-contracts-in-shared.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Name every zod binding with a `Schema` suffix, whatever its role — a response, a persisted entry, a parser input, an enum, a leaf validator such as `optNumSchema` or `dateTimeSchema`. Role words (`Input`, `Response`, `Persisted`) go *before* the suffix, not instead of it. | proposed |
| R2 | Write the schema binding in lowerCamelCase, so the PascalCase form of the same name stays free for the type derived from it. | proposed |
| R3 | Derive the TypeScript type from the schema. Never hand-declare an `interface` or object `type` that restates a shape a schema already describes; if both are needed, the schema is the source and the type is inferred from it. | manual |
| R4 | Name the derived type as the PascalCase of the schema name with the `Schema` suffix stripped. If the type already has a settled name, rename the schema to match it (`fitRecordInputSchema` for `FitRecordInput`). Do not append `Type` to work around a collision. | proposed |
| R5 | Use `z.infer` by default for a derived type. Use `z.input` only when the consumer holds the shape *before* parsing and the schema applies `.default()`, `z.coerce`, `.transform()` or `.pipe()`. | manual |
| R6 | Do not carry the `Schema` suffix into the derived type's name. | proposed |
| R7 | Export a derived type only when a consumer outside the module needs it; a type used solely by the declaring module stays module-local. | manual |

## 3. Detection

R1, R2, R4 and R6 are greppable only when the search enumerates *all* zod declarations, starting from `= z`, rather than matching the suffix being checked.

```yaml
R1:
  type: grep
  pattern: "^\\s*(?:export\\s+)?(?:const|let)\\s+(?!\\w*Schema\\b)\\w+\\s*(?::[^=]*)?=\\s*z\\b"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/gpx/src/**/*.ts", "tools/docs/banner/**/*.ts", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Matches a local binding that is not a reusable schema — an inline `z.object(...)` assigned only
    to feed one `.safeParse()` on the next line — and `z.NEVER` sentinels.
R2:
  type: grep
  pattern: "^\\s*(?:export\\s+)?(?:const|let)\\s+[A-Z]\\w*\\s*(?::[^=]*)?=\\s*z\\b"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/gpx/src/**/*.ts", "tools/docs/banner/**/*.ts", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A schema whose leading token is an acronym carried over from an external contract is still a
    violation, but a reviewer may accept it where the external name is load-bearing.
R3:
  type: manual
  reason: >
    Deciding that a hand-written interface duplicates a schema means comparing two shapes across
    files. A cheap proxy: for each `<name>Schema`, grep `interface <Name>\\b|type <Name> =` (the
    PascalCase of the name minus the suffix) outside a `z.infer` line; it misses duplicates given a
    different name.
  enforcedBy: null
R4:
  type: grep
  pattern: "type\\s+\\w+Type\\s*=\\s*z\\.(?:infer|output|input)<"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/gpx/src/**/*.ts", "tools/docs/banner/**/*.ts", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Flags a derived type whose domain noun genuinely ends in "Type". The mismatch half (a type named
    differently from its schema) needs `rg -oP 'type (\\w+) = z\\.infer<typeof (\\w+)Schema>'` and a
    pairwise comparison of the two captures.
R5:
  type: manual
  reason: >
    Choosing the pre-parse or post-parse type requires knowing whether the schema transforms and
    whether the consumer holds the value before or after parsing.
  enforcedBy: null
R6:
  type: grep
  pattern: "type\\s+\\w*Schema\\s*=\\s*z\\.(?:infer|output|input)<"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/gpx/src/**/*.ts", "tools/docs/banner/**/*.ts", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R7:
  type: manual
  reason: >
    Whether a derived type needs exporting is an import-graph fact; an unused export also falls
    under the root rule to delete dead code.
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** the validator and the type cannot drift: adding a field to the schema updates every consumer's type in the same change.
- **Good, because** the suffix makes schemas findable: a reader scanning a module knows which bindings are runtime validators, and one grep finds the whole boundary surface.
- **Good, because** reserving the PascalCase name for the type removes the collision that otherwise forces invented suffixes.
- **Bad, because** an inferred type is worse to read than a declared one: tooltips and errors show the expanded structure rather than a named shape.
- **Bad, because** a change to a schema silently changes the type everywhere it is used; there is no declaration site to review.
- **Neutral, because** the suffix adds six characters to every schema binding.

## 5. Reference implementation

`apps/web/src/parsers/fitSchemas.ts`:

```ts
import { z } from 'zod';

const optNumSchema = z.number().optional();
const dateTimeSchema = z.union([z.string(), z.date()]);

export const fitFileIdSchema = z.object({
  serial_number: optNumSchema,
  time_created: dateTimeSchema,
});

export type FitFileId = z.infer<typeof fitFileIdSchema>;

export const fitRecordInputSchema = z.object({
  elapsed_time: z.number(),
  heart_rate: optNumSchema,
  power: optNumSchema,
});

export const fitRecordsSchema = z.array(fitRecordInputSchema);

export type FitRecordInput = z.infer<typeof fitRecordInputSchema>;
```

Module-local, inferred but not exported (`apps/web/src/lib/api/weather.ts`):

```ts
const openMeteoResponseSchema = z.object({ hourly: z.object({ time: z.array(z.number()) }) });

type OpenMeteoResponse = z.infer<typeof openMeteoResponseSchema>;
```

## 6. Forbidden practices

- ❌ A schema named for its role alone — `…Response`, `…Input`, `…Persisted`, `…Parser`, or a bare noun such as `optNum`, `dateTime`, `activity` — with no `Schema` suffix.
- ❌ A PascalCase schema binding. It reads as a type at the use site and takes the name the derived type should have.
- ❌ A derived type named `…Type`, or one that differs from its schema's name (`IntervalsActivity` from `activitySchema`) — rename the schema.
- ❌ A derived type that keeps the `Schema` suffix.
- ❌ An `interface` or object `type` hand-written alongside a schema of the same shape (`interface FitFileId` beside `fitFileIdSchema`).
- ❌ Two derived types over one schema with contradictory names; if the schema transforms, the pair is `z.input`/`z.infer` and named accordingly.
