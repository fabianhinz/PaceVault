---
kind: pattern-apply-tdr-reference
id: zod-schema-naming-and-inference
title: Schemas named with a Schema suffix, types inferred from them
summary: Every Zod binding is lowerCamelCase with a Schema suffix, and its compile-time type is inferred from it rather than written out beside it.
governs:
  - "src/**/*.ts"
  - "src/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7]
adopted: 2026-09-17
---

# Schemas named with a Schema suffix, types inferred from them

## 1. Context

This file carries R1–R7.

Every shape that crosses a boundary into this application — a parsed FIT binary, a GPX document, an Open-Meteo response, a value read back out of IndexedDB, an environment block — is declared once as a Zod schema and validated at runtime. The compile-time type for that shape is then derived from the schema rather than written out beside it, so a field added, renamed, or made optional in the validator propagates to every consumer instead of leaving a hand-written type quietly claiming the old shape.

This record governs two things and only two: what the schema binding is called, and how the type is obtained from it. The project's own standing rule — that untyped external data is validated with `safeParse` and returns a safe fallback rather than throwing — is the reason these schemas exist; this record does not restate it.

Scope: every Zod declaration in `src/`. Out of scope: test fixtures.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Name every Zod binding with a `Schema` suffix, whatever its role — a parsed record, a response, a payload, an enum, a leaf validator. Role words (`Record`, `Response`, `Lap`, `Input`) describe the shape and belong *before* the suffix, not instead of it. | proposed |
| R2 | Write the schema binding in lowerCamelCase, so the PascalCase form of the same name stays free for the type derived from it. | proposed |
| R3 | Derive the TypeScript type from the schema. Never hand-declare an `interface` or object `type` that restates a shape a schema already describes; if both are needed, the schema is the source and the type is inferred from it. | manual |
| R4 | Name the derived type as the PascalCase of the schema name with the `Schema` suffix stripped, and nothing appended. Do not add `Type` or `Input` to work around a name collision — a collision means R1 or R2 was broken upstream, and the fix is to rename the schema. | proposed |
| R5 | Use `z.infer` by default. Use `z.input` only when the consumer holds the shape *before* parsing — where the schema applies `.default()`, `z.coerce`, `.transform()` or `.pipe()` and the pre- and post-parse shapes genuinely differ. | manual |
| R6 | Do not carry the `Schema` suffix into the derived type's name. `Schema` marks a runtime validator; a type that ends in `Schema` reads as if the validator itself were the type. | proposed |
| R7 | A derived type is exported only when a consumer outside the module needs it; a type used solely by the module that declares its schema stays module-local, inferred but unexported. | manual |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "(const|let) ([a-zA-Z0-9]*(?<!Schema)) = z\\."
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Matches a chained continuation line that begins with `z.` after a line break; check that the
    match is a binding rather than a fragment.
R2:
  type: grep
  pattern: "(const|let) [A-Z][A-Za-z0-9]*Schema = z\\."
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R3:
  type: manual
  reason: >
    Detecting that a hand-written interface restates a schema's shape means comparing two
    declarations field by field, which no pattern expresses.
  enforcedBy: null
R4:
  type: grep
  pattern: "export type ([A-Z][A-Za-z0-9]*) = z\\.(infer|input)<typeof ([a-z][A-Za-z0-9]*)Schema>"
  include: ["src/**/*.ts"]
  exempt: []
  violationWhen: count-differs
  enforcedBy: null
  falsePositives: >
    Compare the two captures by hand — the pattern extracts both names but cannot assert that one
    is the PascalCase of the other.
R5:
  type: grep
  pattern: "z\\.input<"
  include: ["src/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Every `z.input` is a candidate for review, not automatically a violation; read whether its
    schema actually transforms.
R6:
  type: grep
  pattern: "type [A-Z][A-Za-z0-9]*Schema = "
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R7:
  type: manual
  reason: >
    Whether a derived type has a consumer outside its module needs a usage search per symbol.
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** a field change in the validator reaches every consumer as a type error, so a parser and its readers cannot drift apart silently.
- **Good, because** the suffix makes the runtime/compile-time split visible at every reference: `fitLapSchema` parses, `FitLap` describes.
- **Bad, because** an inferred type's shape is not readable at its declaration — a reader has to follow the schema to learn what the type contains, and editor hover output for a large Zod object is hard to read.
- **Neutral, because** the naming rules are mechanical, so they are easy to follow and easy to get wrong in only one way: appending a role word to the derived type instead of the schema.

## 5. Reference implementation

`src/parsers/fitSchemas.ts` — binding, suffix, and the type derived from it:

```ts
export const fitLapSchema = z.object({
  start_time: optionalDateTimeSchema,
  total_elapsed_time: optionalNumberSchema,
});

export type FitLap = z.infer<typeof fitLapSchema>;
```

The consumer validates and falls back rather than throwing, which is what the schema is for:

```ts
const parsed = fitLapsSchema.safeParse(raw);
if (!parsed.success) return [];
```

## 6. Forbidden practices

- ❌ `optNum`, `dateTime`, `point` as a Zod binding name — without the suffix, a reference cannot be told from a plain value.
- ❌ `FitLapSchema` as the binding name; it takes the PascalCase form the derived type needs.
- ❌ `FitLapInput` or `FitLapType` as a derived type name — the role word or the `Type` suffix is a workaround for a collision that means the schema is misnamed.
- ❌ A hand-written `interface FitLap { … }` sitting beside `fitLapSchema` — two declarations of one shape, and only one of them is checked at runtime.
- ❌ `z.input` on a schema that neither defaults, coerces nor transforms; it claims a pre-parse shape that does not differ.
- ❌ Exporting every inferred type by reflex; an unexported type is one less name in the module's surface.
