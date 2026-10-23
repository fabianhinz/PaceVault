---
kind: pattern-apply-tdr-reference
id: spec-describe-and-case-titles
title: One top-level describe per engine spec, titled by its unit
summary: An engine or gpx spec has exactly one top-level describe, titled describe(unit.name) for a single exported function or the module name for several peers; nested groups name a sub-unit by its symbol or a short behaviour cluster.
governs:
  - "packages/engine/tests/**/*.spec.ts"
  - "packages/gpx/tests/**/*.spec.ts"
  - "tools/workbench/tests/**/*.ts"
adopted_rules: [R1, R2, R3, R5]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# One top-level describe per engine spec, titled by its unit

## 1. Context

This file carries rules R1, R2, R3 and R5.

An engine spec covers one module (`packages/engine/tests/<module>.spec.ts`, mirrored-spec-layout). The test report is read per file, so the file's structure should be the module's: one root group, inside it one group per exported function, inside those the behaviour clusters. Before this record, engine specs mixed several top-level groups per file, suffix titles that restated the unit (`'calculateSummaryStress for runs'`, `'estimateSessionEnergy — power'`) and string titles that silently went stale when a function was renamed.

Titling a group with the symbol's `.name` makes a rename carry into the report (the same choice collaborators-replaced-with-mocks R7 makes for app specs). Scope: engine specs. Case titles are not governed here; the `should …` form is not used in this project.

The rules bind the gpx specs (`packages/gpx/tests/<module>.spec.ts`) the same way.

R1, R2 and R3 bind the specs of `tools/workbench` (`tools/workbench/tests/`) as well.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | A spec file contains exactly one top-level `describe`; every case and every nested group sits inside it, and no case is declared at file scope. | proposed |
| R2 | When the unit under test is a named exported binding the spec imports, the `describe` argument is that binding's `.name` — `describe(detectClimbs.name, …)` — never a string that repeats the identifier. This holds for nested groups naming a sub-unit as much as for the top-level group. | proposed |
| R3 | When the spec has no single named binding to point at — a module exporting several peer functions, or a constant table (which has no `.name`) — the `describe` argument is a descriptive string literal naming that module or table (`'stress'`, `'METERS_BY_RACE_DISTANCE'`). This is the correct form for that case, not a tolerated lapse. | manual |
| R5 | A nested `describe` exists for exactly one of two reasons: it groups a sub-unit — a separately exported function of the same module, titled by R2 — or it groups a behaviour cluster named by a short noun phrase (`'edge cases'`, `'recorded zeros'`, `'threshold consistency'`). A title that restates the unit plus a qualifier (`'X for runs'`) becomes that qualifier nested inside the unit's group. | manual |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "^(describe|it|test)\\("
  include: ["packages/engine/tests/**/*.spec.ts", "packages/gpx/tests/**/*.spec.ts", "tools/workbench/tests/**/*.ts"]
  exempt: []
  violationWhen: count-differs
  enforcedBy: null
  falsePositives: "Counts per file must be exactly one `describe(` and no `it(`/`test(` at column 0."
R2:
  type: grep
  pattern: "describe\\('[a-z][A-Za-z0-9]*'"
  include: ["packages/engine/tests/**/*.spec.ts", "packages/gpx/tests/**/*.spec.ts", "tools/workbench/tests/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "A module-titled root group (R3, e.g. `describe('stress'`) matches too; it is correct when the module exports several peers."
R3:
  type: manual
  reason: "Whether a spec covers one unit or several peers depends on what the module exports."
  enforcedBy: null
R5:
  type: manual
  reason: "Telling a behaviour cluster from a restated unit needs a reader."
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** a renamed function renames its test group, and the report reads module → function → behaviour.
- **Good, because** one root per file makes `describe.only` / `describe.skip` and report folding predictable.
- **Bad, because** module-level specs gain one indentation level.
- **Neutral, because** constants and modules keep string titles; R2 applies only where a symbol with a `.name` exists.

## 5. Reference implementation

```ts
describe('stress', () => {
  describe(intensityFactor.name, () => {
    it('divides NP by FTP', () => { … });
  });

  describe(calculateSummaryStress.name, () => {
    it('scores TSS for a ride with NP and FTP', () => { … });

    describe('runs', () => {
      it('never scores TSS', () => { … });
    });
  });
});
```

## 6. Forbidden practices

- ❌ Several top-level `describe` blocks in one spec file.
- ❌ `describe('detectEfforts', …)` while the spec imports `detectEfforts` — use `detectEfforts.name`.
- ❌ `describe('estimateSessionEnergy — power', …)` beside `describe('estimateSessionEnergy — running', …)` — nest `'power'` and `'running'` inside one group of the unit.
