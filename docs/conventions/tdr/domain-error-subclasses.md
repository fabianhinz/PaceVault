---
kind: pattern-apply-tdr-reference
id: domain-error-subclasses
title: Error subclasses declared at the throw site, caught by type at the boundary
summary: A failure a consumer branches on gets an Error subclass named for the condition, declared in the module that throws it, carrying its data as readonly fields and caught with instanceof at the deciding boundary; everything else throws a bare Error.
governs:
  - "apps/web/src/**/*.ts"
  - "apps/web/src/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7, R8, R9, R10]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Error subclasses declared at the throw site, caught by type at the boundary

## 1. Context

This file carries rules R1 through R10.

Some failures cannot be represented in a function's return type — they unwind through a TanStack Query `queryFn`, or interrupt an import partway through — but a caller further up still has to know *which* failure happened to choose what the user sees (a rejected key versus a rate limit). A formatted message cannot carry that: branching on it means parsing text. This convention gives those failures a nominal type: the throwing module declares a class extending `Error`, and the component or hook that decides catches it with `instanceof`.

The rule is narrow. It governs failures that cross a module boundary and are branched on by a consumer. Expected, in-band failures that a caller handles on the normal path stay in the return type instead (`undefined`, `null`, or the function's own result shape); there is no separate outcome-union convention. Most throws in this app are bare `new Error(...)` and correctly so: a failure every caller treats identically earns no type. A subclass is a claim that someone will branch on it.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Throw an `Error` instance, never a string, object literal, or other non-`Error` value. | proposed |
| R2 | Introduce a subclass of `Error` only when a consumer branches on that specific failure, or when the failure carries data the consumer needs. Otherwise throw a bare `Error` with a formatted message. | manual |
| R3 | Declare the subclass in the module that throws it, above the code that throws it. Do not collect subclasses into a central errors module. A subclass thrown on behalf of many callers belongs in the module that owns the operation producing it (`apps/web/src/lib/api/intervals.ts` for intervals.icu requests), and only that module throws it. | manual |
| R4 | Name the subclass after the *condition* that failed, as a noun phrase plus the `Error` suffix (`IntervalsRequestFailedError`), not after the subsystem that raised it. | proposed |
| R5 | Put the structured context a consumer needs on the instance as a `public readonly` field, assigned in the constructor. Do not encode it in the message for the consumer to parse back out. | manual |
| R6 | Give the constructor the raw inputs and let it compose the message, so every throw of that condition produces the same wording. | manual |
| R7 | Set `this.name` to the class name in the constructor, so `apps/web/src/lib/debug/crashReport.ts` and the console report the subclass rather than `Error`. | proposed |
| R8 | When re-throwing or wrapping an underlying failure, pass it through the standard `cause` option rather than folding its message into the new message. | proposed |
| R9 | Catch by type at the boundary that makes the decision — the component or hook that maps the failure to UI state or copy — and convert there into that boundary's own vocabulary. Do not catch by type in intermediate layers merely to re-throw. | manual |
| R10 | Delete a subclass that has no throw site, and collapse one that has no `instanceof` consumer and no fields back into a bare `Error`. | proposed |

## 3. Detection

```yaml
R1:
  type: lint
  pattern: "typescript/only-throw-error (type-aware oxlint)"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Flags rethrowing a value typed `unknown` from a catch clause even when it is an Error at
    runtime. Until the rule is on, `rg -n "throw [^n]" apps/web/src | rg -v "throw new "` is the
    grep substitute.
R2:
  type: manual
  reason: >
    Deciding whether a failure deserves a type requires knowing whether any consumer will branch on
    it. R10 catches the observable half after the fact.
  enforcedBy: null
R3:
  type: grep
  pattern: "class [A-Za-z0-9_]+Error[^{]*extends"
  include: ["apps/web/src/**/*.ts"]
  exempt: []
  violationWhen: count-differs
  enforcedBy: null
  falsePositives: >
    Locating declarations is mechanical; the rule is about the relationship between a declaration
    and its throw sites, which needs a second pass resolving `throw new <Name>` across the tree.
R4:
  type: manual
  reason: >
    Whether a name denotes a condition or a subsystem is a semantic judgement.
  enforcedBy: null
R5:
  type: grep
  pattern: "\\.message as [A-Z]\\w*|\\.message\\.(includes|startsWith|match)\\(|message ==="
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Finds the consumer half — data read back out of a message. Whether a field a consumer needs is
    on the instance is a cross-file read of the `instanceof` sites.
R6:
  type: grep
  pattern: "throw new [A-Za-z0-9_]+Error\\(`"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A subclass whose message is genuinely per-call-site may take a prebuilt message. The pattern
    skips bare `new Error(` because `Error` has no prefix before the suffix.
R7:
  type: ast
  pattern: "ClassDeclaration whose superClass is Error and whose constructor body has no `this.name =` assignment"
  include: ["apps/web/src/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A line grep cannot scope `this.name =` to one class body; run it as an AST query.
R8:
  type: grep
  pattern: "catch \\((\\w+)\\)[\\s\\S]{0,200}?\\1\\.message[\\s\\S]{0,200}?throw new"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Needs multiline PCRE. Matches a catch that reads the message for logging and throws something
    unrelated; a missing `cause` without a message read is invisible.
R9:
  type: grep
  pattern: "instanceof [A-Z][A-Za-z0-9_]*Error"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx"]
  exempt: []
  violationWhen: no-match
  enforcedBy: null
  falsePositives: >
    Matches `instanceof Error` and library error bases. Reports only that type-branching happens,
    not that it happens at the deciding boundary.
R10:
  type: manual
  reason: >
    A join of three sets — declarations (R3), `throw new` sites, and `instanceof` sites (R9) — plus
    reading each declaration body for fields.
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** the boundary branches on a type the compiler checks, not on message text, so rewording a message cannot silently change which state the user sees.
- **Good, because** the subclass is a typed channel for structured context — an intervals.icu error code, an HTTP status — that does not survive being flattened into a string.
- **Good, because** declaring the class in its throwing module keeps the failure next to the code that produces it, and the import at the catch site points straight back at the origin.
- **Bad, because** with no shared base class and no registry, the set of custom errors is invisible; nothing tells a new caller which failures it could usefully branch on.
- **Bad, because** the catch is not checked: neither the compiler nor the linter requires a boundary to handle a subclass its callees throw, and deleting an `instanceof` branch compiles fine.
- **Neutral, because** a module that catches one imports from the module that throws it — a real dependency edge, fine while it runs from the UI inward.

## 5. Reference implementation

```ts
export class IntervalsRequestFailedError extends Error {
  public readonly code: IntervalsErrorCode;

  constructor(code: IntervalsErrorCode, options?: ErrorOptions) {
    super(`intervals.icu request failed: ${code}`, options);
    this.name = 'IntervalsRequestFailedError';
    this.code = code;
  }
}

export const intervalsDataOrThrow = <T>(result: IntervalsResult<T>): T => {
  if (!result.ok) throw new IntervalsRequestFailedError(result.code);
  return result.data;
};
```

The boundary that decides, converting into its own vocabulary:

```ts
} catch (err) {
  let message = m.ui_intervals_error_generic();
  if (err instanceof IntervalsRequestFailedError) message = MESSAGE_BY_INTERVALS_ERROR[err.code]();
  importProgressActions.finishImport({ kind: 'failed', message });
}
```

Wrapping with `cause`:

```ts
} catch (err) {
  throw new Error(`Failed to parse FIT file "${fileName}": the decoder rejected it`, { cause: err });
}
```

## 6. Forbidden practices

- ❌ A central `errors.ts` collecting every subclass in the app.
- ❌ Branching on `error.message` content, or on a code carried as the message (`throw new Error(result.code)` read back as `err.message as IntervalsErrorCode`).
- ❌ A subclass with an empty body that nothing catches by `instanceof`.
- ❌ A declared subclass with no throw site anywhere.
- ❌ Putting structured data into the message for the caller to parse back out instead of exposing it as a field.
- ❌ Catching a subclass in an intermediate layer only to rethrow it unchanged.
- ❌ Throwing a subclass for a failure the caller is expected to handle on its normal path — that belongs in the return type.
- ❌ Assigning a `name` that differs from the class name, or leaving it unset.
- ❌ Folding an underlying error's message into a new message (`…: ${err.message}`) instead of passing it as `cause`.
