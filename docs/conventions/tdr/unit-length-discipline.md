---
kind: pattern-apply-tdr-reference
id: unit-length-discipline
title: Units grow wide, not deep
summary: A function, hook or component holds at most about a dozen statements and nests at most three deep (components one, two at most); extracted statements become hooks or topic-module steps, extracted markup its own component module, and line count is never the trigger.
governs:
  - "apps/web/src/**/*.ts"
  - "apps/web/src/**/*.tsx"
  - "packages/ui/src/**/*.ts"
  - "packages/ui/src/**/*.tsx"
  - "packages/engine/src/**/*.ts"
  - "packages/gpx/src/**/*.ts"
  - "packages/testing/src/**/*.ts"
  - "tools/docs/banner/**/*.ts"
  - "tools/docs/banner/**/*.tsx"
  - "tools/workbench/scripts/**/*.ts"
  - "tools/workbench/site/src/**/*.ts"
  - "tools/workbench/site/src/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Units grow wide, not deep

## 1. Context

This file carries rules R1–R7.

The rules also bind `packages/ui` (`packages/ui/src`, specs in `packages/ui/tests`); where the text below names an `apps/web` path, the kit's counterpart is meant: an extracted kit hook goes in `packages/ui/src/hooks/`, an extracted kit component into its own module in the component's directory. R1, R2, R3, R6 and R7 bind `packages/engine/src` as well (it has no components, so R4 and R5 have no subject there); an extracted engine step is a module-local function of the same topic module.

`packages/gpx/src` is bound exactly like the engine: R1, R2, R3, R6 and R7, extracted steps as module-local functions of the same module. So are the factories and series builders of `packages/testing/src`.

The unit of work in `apps/web` — a function, a hook, a component — is written as a short, flat sequence of named steps. What is held constant is not its *length*: a unit may run well past a screenful. What is held constant is its *shape*. A unit carries few statements and almost no nesting, and when it is long it is long because one of its statements is wide — a dispatch over a closed union, a markup return, a literal table — never because control flow has been stacked inside it.

Statement count and nesting depth are invariants and cheap to check in a diff; line count is a statistic and a misleading one. Reviewing against line count produces busywork splits that scatter one behaviour across files; reviewing against shape catches the thing that actually degrades — a unit that has started making decisions inside decisions.

Scope: application source under `apps/web/src`. Out of scope: file length (no budget at all), test files, and generated or vendored code. This convention owns the *trigger* for a split; where the extracted piece lands is stated in R4–R6 and owned in detail by one-hook-per-file, hook-directory-placement, component-declaration-shape and helpers-group-by-topic.

The rules bind `tools/docs/banner/` as well. A Playwright test body is a unit like any other: past R1 its statements become module-local steps of the test file, in test order, and helpers several tests share go to the topic modules beside it (`stillness.ts`, `png.ts`, `clip.ts`, `appPage.ts`, `shots.ts`, `messages.ts`, R6). The banner page declares one component per module (R5); its shared module-scope state lives in a plain `.ts` module beside the components (`page/bannerLocale.ts`).

The rules bind `tools/workbench` as well (`scripts/`, `site/src/`): a non-component unit's steps stay module-local in its topic module (R6), a board component's statements become hooks in `site/src/app/hooks/` (R4), and each board component has its own module (R5).

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | A unit's body is a short sequence of statements: at most about 12 top-level statements. Past that it is doing more than one thing; extract until the remaining sequence reads as a single named operation. | proposed |
| R2 | Control flow stays shallow. Nesting `if`/loop/`try`/`switch` more than three deep inside one unit is a defect to refactor — with early returns, a guard clause or an extracted step — not an indentation to accept. Components stay shallower still: one level is the norm, two the ceiling. An `else if` does not add a level; a callback is its own unit. | proposed |
| R3 | Width is not a split trigger. A `switch` exhausting a closed union, a markup return, a static literal table (such as a `charts: ChartEntry[]` array) or a long argument list may run far past a screenful and is left alone. Do not split a unit whose statement count and nesting are within R1 and R2 merely because it is long. | manual |
| R4 | When a component's *statements* grow past R1, the extracted piece is a hook in the feature's `hooks/` directory, not a helper parked in the same module. A component body reads as a list of hook calls and handler bindings. | manual |
| R5 | When a component's *markup* grows, the extracted piece is its own component module in the same directory, named after the component — never an unexported sibling component in the same module. A module declares exactly one component. | manual |
| R6 | When a non-component unit's statements grow past R1, the extracted step is a module-local function of the same topic module, or goes to the topic-named module it belongs to (helpers-group-by-topic). Never to a catch-all beside the caller. | manual |
| R7 | Line count alone is not a review objection. State which of R1, R2 or a mixed concern the unit violates, or accept it. Do not add a `max-lines` or `max-lines-per-function` budget. | manual |

## 3. Detection

R1 and R2 are the executable pair and deliberately independent: a unit can be flat and overloaded, or short and stacked. A TypeScript-compiler script that implements both (and the one-component-per-module count R5 needs) is part of this project's unit-length migration and can be rerun at any time; its logic is stated in the patterns below.

```yaml
R1:
  type: ast
  pattern: "FunctionDeclaration|MethodDeclaration|ArrowFunction|FunctionExpression with a Block body whose body.statements.length > 12 (callbacks counted as their own units)"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "packages/engine/src/**/*.ts", "packages/gpx/src/**/*.ts", "packages/testing/src/**/*.ts", "tools/docs/banner/**/*.ts", "tools/docs/banner/**/*.tsx", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: ["apps/web/src/**/*.d.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Counts statements, not their weight: a body of eight statements where one is a 150-line
    object literal passes, which R3 intends. Statements introduced by early-return guard clauses
    inflate the count although they are the refactor R2 asks for.
R2:
  type: ast
  pattern: "IfStatement|ForStatement|ForOfStatement|ForInStatement|WhileStatement|DoStatement|TryStatement|SwitchStatement nested more than 3 deep (more than 2 in a PascalCase unit in a .tsx module) within one function body; an IfStatement that is the elseStatement of its parent IfStatement does not increment depth; counting stops at a nested function boundary"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "packages/engine/src/**/*.ts", "packages/gpx/src/**/*.ts", "packages/testing/src/**/*.ts", "tools/docs/banner/**/*.ts", "tools/docs/banner/**/*.tsx", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: ["apps/web/src/**/*.d.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Stopping at a callback boundary under-reports a unit that hides its stacking inside one
    inline callback. Ternaries and JSX conditionals are invisible to it, so a component can branch
    heavily in markup and pass. The "one level is the norm" half of the component bar is a review
    judgement; the signal enforces only the ceiling of two.
R3:
  type: manual
  reason: >
    A prohibition on splitting. The evidence for a bad split is a file that should not exist,
    which is only visible by reading the pair.
  enforcedBy: null
R4:
  type: manual
  reason: >
    Requires judging whether a statement sequence removed from a component became a hook or a
    local helper, and whether it should have.
  enforcedBy: null
R5:
  type: ast
  pattern: "more than one top-level PascalCase const in a .tsx module whose initializer is an arrow or function expression"
  include: ["apps/web/src/**/*.tsx", "packages/ui/src/**/*.tsx", "tools/docs/banner/**/*.tsx", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "Distinguishing markup growth from logic growth still needs a read; the count only finds the second component."
R6:
  type: manual
  reason: "Whether an extracted module is topic-named or a catch-all is a naming judgement."
  enforcedBy: null
R7:
  type: manual
  reason: "A rule about how to phrase a review comment."
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** it separates the property worth defending from the one that merely correlates. Statement count and nesting track how many decisions a reader must hold at once; line count tracks how much markup or dispatch happens to be inline, which costs the reader almost nothing.
- **Good, because** the bar survives formatting. A narrow print width and heavily attributed markup inflate line counts for reasons that have nothing to do with the code's structure.
- **Good, because** a shallow unit is testable and diffable: every branch is reachable from the signature without constructing a nested precondition, and a changed branch shows up as a changed branch rather than as a reindented block.
- **Bad, because** splitting on statement count scatters a single behaviour across files. A sequence extracted into three hooks has to be reassembled in the reader's head; R3 and R7 exist to stop that cost being paid for nothing.
- **Bad, because** the pressure to keep component bodies flat pushes state and effects into hooks that exist for no reason except to be elsewhere. A hook with one caller and no reuse is a rename of a block, and it can make the component's behaviour less visible.
- **Bad, because** strict one-component-per-module turns every small markup piece into a file, so a component and its private sub-pieces are read across several files.
- **Bad, because** "about a dozen" will be argued at the margin, and the signal cannot see a statement's weight.
- **Neutral, because** the wide forms R3 protects — exhaustive dispatch, markup returns, literal tables — are exactly the forms other conventions here already shape; this one only declines to second-guess their length.

## 5. Reference implementation

A handful of statements, no nesting, one wide statement carrying the bulk of the lines; logic arrived as hooks, markup as its own component module:

```tsx
import type { FC } from 'react';
import { ChartRow } from '@pacevault/ui/components/ChartsCard.tsx';
import { LegendLine } from '@/components/dashboard/LegendLine.tsx';
import { useDashboardAxis } from '@/components/dashboard/hooks/useDashboardAxis.ts';
import { useVolumeChartRails } from '@/components/dashboard/hooks/useVolumeChartRails.ts';
import { useVolumeSeries } from '@/components/dashboard/hooks/useVolumeSeries.ts';
import { useFiltersStore } from '@/store/filters.ts';

export const VolumeChart: FC = () => {
  const axis = useDashboardAxis();
  const metric = useFiltersStore((s) => s.volumeChartMetric);
  const series = useVolumeSeries(axis);
  const rails = useVolumeChartRails(series, metric);

  if (series.rows.length === 0) return null;

  return (
    <ChartRow rails={rails.railRows}>
      {rails.railRows.map((row) => (
        <LegendLine key={row.key} label={row.name} color={row.color} />
      ))}
    </ChartRow>
  );
};
```

A non-component unit keeps its steps in its own topic module:

```ts
const paddedRange = (present: number[]): { low: number; high: number } => {
  const min = Math.min(...present);
  const max = Math.max(...present);
  const padding = (max - min) * PADDING_RATIO || Math.abs(max) * PADDING_RATIO || 1;
  return { low: min - padding, high: max + padding };
};

export const niceAxis = (values: Array<number | null | undefined>, tickCount: number) => {
  const present = values.filter((v): v is number => v !== null && v !== undefined);
  if (present.length === 0) return undefined;
  const range = paddedRange(present);
  const step = niceStep((range.high - range.low) / Math.max(1, tickCount - 1));
  const start = roundToStep(Math.floor(range.low / step) * step);
  const end = roundToStep(Math.ceil(range.high / step) * step);
  return { domain: [start, end], ticks: axisTicks(start, end, step) };
};
```

## 6. Forbidden practices

- ❌ Stacking a third and fourth level of `if`/loop/`try` inside a unit (a second level inside a component) and accepting it because each level is individually reasonable. Invert the condition and return early instead.
- ❌ A unit that reaches its statement budget through sequential blocks each preceded by a comment naming what the block does — those headings are the extracted units' names, and comments are not used in this codebase anyway.
- ❌ Splitting a wide `switch`, a long markup return or a static table into fragments to bring a line count down. The cases no longer read as one exhaustive set.
- ❌ Extracting a component's statements into a module-scoped helper in the same file so the body looks shorter. It moves the code without moving the concern; the piece belongs in a hook.
- ❌ A second component in a component module, exported or not. Extracted markup is its own module from the start.
- ❌ Adding `max-lines-per-function` or `max-lines` to make this convention automatic. It would fail on the forms R3 protects and pass the stacked units R2 targets.
- ❌ "This function is too long" as a standalone review comment.
