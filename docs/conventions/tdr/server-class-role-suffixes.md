---
kind: pattern-apply-tdr-reference
id: server-class-role-suffixes
title: Class names ending in Error are reserved for Error subclasses
summary: A class extending Error ends in Error, and no class that does not extend Error carries that suffix.
governs:
  - "apps/web/src/**/*.ts"
  - "apps/web/src/**/*.tsx"
  - "apps/web/tests/**/*.ts"
  - "packages/*/src/**/*.ts"
  - "tools/workbench/scripts/**/*.ts"
  - "tools/workbench/site/src/**/*.ts"
  - "tools/workbench/tests/**/*.ts"
  - "tools/docs/banner/**/*.ts"
adopted_rules: [R5]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Class names ending in Error are reserved for Error subclasses

## 1. Context

This file carries rule R5.

The workspace has almost no classes: application code is arrow functions, hooks and plain objects (`tdr/classes-are-server-side-only.md`), and the only class an app module may declare is an `Error` subclass (`tdr/domain-error-subclasses.md`). The one role suffix that therefore matters is `Error`: a reader seeing `…Error` in an import or a `catch` must be able to rely on it being something `instanceof Error` holds for, and on every `Error` subclass being findable by that suffix. Request-path layers, framework base classes and job entrypoints do not exist in this client-only workspace, so no other suffix vocabulary is governed.

Today the only classes in the workspace are test doubles: `ActionError` in the `astro:actions` mocks of `tools/workbench/tests/board.spec.ts:8` (and its siblings `boardDone.spec.ts`, `boardRead.spec.ts`) extends `Error` and ends in `Error`; `FakeWorker` (`apps/web/tests/features/map/hooks/useGpsBackfill.integration.test.ts:11`) and `FakeWatcher` (`tools/workbench/tests/devPlugin.spec.ts:12`) extend no `Error` and do not use the suffix. All conform.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R5 | A class extending `Error` ends in `Error`, and no class that does not extend `Error` uses that suffix. | manual |

## 3. Detection

```yaml
R5:
  type: grep
  pattern: "class \\w*Error\\b(?![^{]*extends \\w*Error)"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "apps/web/tests/**/*.ts", "packages/*/src/**/*.ts", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/tests/**/*.ts", "tools/docs/banner/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Run with rg -nP. A multi-line declaration puts the extends clause past the newline, so a
    conforming class with a long generic parameter list is wrongly flagged. Covers only the first
    half; the converse (a class extending Error without the suffix) needs
    rg -nP "class (?!\w*Error\b)\w+ extends \w*Error\b" over the same paths.
```

## 4. Trade-offs

- **Good, because** the suffix is a type-level statement of what a class is: an `…Error` in an import or a `catch` tells the reader it can be thrown and narrowed with `instanceof`.
- **Bad, because** a closed vocabulary pushes back against classes that genuinely straddle two roles, and the pressure can resolve the wrong way, making the claim on the name a lie.
- **Bad, because** the suffix is decoration to the compiler. Nothing fails when it is wrong, so the guarantee is only as good as review attention.
- **Neutral, because** classes that are not errors carry no role marker at all. That is intended — the absence of the suffix is itself the signal — but the vocabulary cannot be read as covering everything.

## 5. Reference implementation

A conforming `Error` subclass — the `ActionError` test double in `tools/workbench/tests/board.spec.ts:8-14`:

```ts
ActionError: class ActionError extends Error {
  code: string;
  constructor(options: { code: string; message: string }) {
    super(options.message);
    this.code = options.code;
  }
},
```

A class that is not an error and so takes a descriptive name without the suffix — `apps/web/tests/features/map/hooks/useGpsBackfill.integration.test.ts:11`:

```ts
class FakeWorker {
```

## 6. Forbidden practices

- ❌ Reusing the `Error` suffix for a class that does not extend `Error` — the suffix is a claim about contract, and a false claim is worse than no suffix.
- ❌ An `Error` subclass named without the suffix (`IntervalsRequestFailed extends Error`) — it hides from every search and every reader scanning a `catch` for the types it can narrow to.
