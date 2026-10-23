---
kind: pattern-apply-tdr-reference
id: behavioural-constants-hoisted-upper-snake
title: Behavioural values are named UPPER_SNAKE constants at module scope
summary: In packages/ui, packages/engine, packages/gpx, tools/docs and tools/workbench a threshold, delay, bound, fallback, layering index, fixed pixel dimension or shared class string is a module-scope UPPER_SNAKE constant named for its reason and colocated with its reader; one-off structural CSS stays inline and design literals stay in the theme.
governs:
  - "packages/ui/src/**/*.ts"
  - "packages/ui/src/**/*.tsx"
  - "packages/engine/src/**/*.ts"
  - "packages/gpx/src/**/*.ts"
  - "tools/docs/banner/**/*.ts"
  - "tools/docs/banner/**/*.tsx"
  - "tools/docs/*.config.ts"
  - "tools/workbench/scripts/**/*.ts"
  - "tools/workbench/site/src/**/*.ts"
  - "tools/workbench/site/src/**/*.tsx"
adopted_rules: [R1, R2, R4, R5, R6, R7, R8]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Behavioural values are named UPPER_SNAKE constants at module scope

## 1. Context

This file carries rules R1, R2, R4, R5, R6, R7 and R8.

A value that governs **behaviour** — a threshold a gesture must cross, a delay, an upper or lower bound, the value used when an input is absent, a layering scheme, a fixed pixel dimension no theme token expresses, a class string several surfaces share — is named once at module scope instead of appearing as a bare literal inside a handler, an effect or a JSX attribute. The name is the only explanation such a number gets in a codebase without comments, so an unnamed `250` or `0.08` is unreviewable: nobody can tell whether it was measured, guessed or copied.

Three buckets, and the value of this record is the boundary between them. **Design values** (colour, spacing, radius, shadow, type size) come from `packages/ui/src/theme.css` and its mirror `src/lib/tokens.ts` (styled-api-over-sx); hoisting a literal colour into a constant does not launder it. **Behavioural values** are the subject: hoisted, UPPER_SNAKE, module scope. **One-off structural CSS** meaningful only where it sits (`relative`, `shrink-0`, `min-w-0`, a single `z-10` lift) stays inline. Keyed lookup records over a union follow exhaustive-record-maps-over-branching (`<VALUE>_BY_<KEY>`, `CLASSES_BY_*`), which is the same casing.

The rules also bind `packages/engine/src`, where the behavioural values are thresholds, bounds, iteration limits and formula coefficients read more than once; R5 has nothing to govern there because the engine holds no design values (engine-holds-domain-logic-only). In the engine a constant read by one module stays unexported in it, one read by another module or a spec is exported from the module that owns its concept, and the R7 unit suffix is always the long form: `_SEC`, `_MIN`, `_MS`, `_METERS`, `_DEGREES`, `_DAYS` (camelCase names carry `Sec`, `Min`, `Ms`, `Meters`, `Degrees`). `packages/engine/src/time.ts` is the topic module of time constants (native-date-and-duration-constants), not a central constants module.

`packages/gpx/src` is read the same way as the engine: its behavioural values are the precisions of the GPX output (`COORDINATE_DECIMALS`, `ELEVATION_DECIMALS`) and route thresholds (`ELEVATION_HYSTERESIS_METERS`); unit suffixes are the long form (R7), and a constant read by one module stays unexported. The two-point minimum of a route and the three-point minimum of a simplification are what a line is, not tuning, and stay inline (R4).

`tools/docs` (`tools/docs/banner/**`, `tools/docs/*.config.ts`) is bound the same way: its behavioural values are the capture's settle counts, search steps and limits, frame geometry, tolerances and viewports, and the banner page's shared frame height and backdrop shot. A duration is a `_MS` literal constant (native-date-and-duration-constants; the tool does not depend on the engine). A constant read by one module stays unexported; one read by several modules of the capture or the page is exported from the topic module of its subject. Pixel sizes in the page's class strings read once are design values (R5): they come from exact px theme tokens (styled-api-over-sx), not from constants.

Scope: `packages/ui/src` and `packages/engine/src`. Out of scope: `theme.css` and `lib/tokens.ts` (they author design values) and the specs under `packages/ui/tests/`.

`tools/workbench` (`scripts/`, `site/src/`) is bound the same way: its behavioural values are buffer sizes, the diff context, zoom bounds and the Mermaid limits. Its locations (repo root, backlog, workbench folder, guide) and their environment overrides live in one topic module, `tools/workbench/scripts/paths.ts`, the module of their subject (R6, R8); the graph and theme colours are design values (R5).

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Declare a value that governs behaviour — threshold, delay or interval, bound, fallback, layering index, a fixed pixel dimension no theme token expresses, or a class string read by several modules — as a module-scope `const` above the unit that reads it; do not inline it at the use site. | manual |
| R2 | Name a module-scope constant that holds a scalar, a string or a frozen literal in `UPPER_SNAKE_CASE` — including the shared surface class strings (`GLASS_CLASS`, `FLOATING_CLASS`, …). | proposed |
| R4 | Leave a structural declaration inline when its value is meaningful only there and read by nothing else: layout mode, positioning, overflow, flex sizing, a single lift over one adjacent sibling. Hoist a layering value only once there is a scheme of two or more named layers. | manual |
| R5 | Do not hoist a design value into a constant. A colour, spacing, radius, shadow or type size is read from the theme (a utility class, or `tokens` in JS); hoisting a token key under a name is fine, hoisting a raw literal is not. | proposed |
| R6 | Declare the constant unexported, in the module that reads it. Export it only when another module or a spec reads it, from the module that owns the concept: a component directory's `types.ts` when several modules of that directory read it, a topic module in `src/lib/` when several directories or the consumers of the kit do (`lib/surfaces.ts`, `lib/sheetDrag.ts`). | manual |
| R7 | Name the constant for the reason it exists, not for its literal value; prefix a constant that supplies the value of an omitted input with `DEFAULT_`; suffix a duration with its unit (`_MS`); in `packages/engine` and `packages/gpx` every unit suffix is the long form (`_SEC`, `_MIN`, `_MS`, `_METERS`, `_DEGREES`, `_DAYS`). | proposed |
| R8 | Do not introduce a central constants module (`constants.ts`, `config.ts`). Behavioural constants live with the unit whose behaviour they govern, or in the `src/lib/` topic module of their subject. | proposed |

## 3. Detection

```yaml
R1:
  type: manual
  reason: >
    No syntax separates a behavioural literal from a structural or design one. Criterion: would
    changing this number change what the component does (when it fires, what it permits, what it
    falls back to, what sits in front of what) rather than how it looks? If yes, it is named.
  enforcedBy: null
R2:
  type: grep
  pattern: "^(export )?const [a-z][A-Za-z0-9]*\\s*(:[^=]*)?=\\s*(-?[0-9]|'|`)"
  include: ["packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "packages/engine/src/**/*.ts", "packages/gpx/src/**/*.ts", "tools/docs/banner/**/*.ts", "tools/docs/banner/**/*.tsx", "tools/docs/*.config.ts", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: ["packages/ui/src/lib/tokens.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Flags a module-scope camelCase binding initialised from a literal that is really a derived
    alias. Blind to constants inside a function body (not governed) and to multi-line object
    literals.
R4:
  type: manual
  reason: >
    The permissive side cannot be grepped: every conforming class string looks like a violating
    one. Criterion for staying inline: read at exactly one place, no meaning beyond "make this box
    behave structurally here", and a name would only restate the CSS property.
  enforcedBy: null
R5:
  type: grep
  pattern: "^(export )?const [A-Z][A-Z0-9_]*\\s*(:[^=]*)?=\\s*'(#[0-9a-fA-F]{3,8}|rgba?\\(|hsla?\\()"
  include: ["packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "packages/engine/src/**/*.ts", "packages/gpx/src/**/*.ts", "tools/docs/banner/**/*.ts", "tools/docs/banner/**/*.tsx", "tools/docs/*.config.ts", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: ["packages/ui/src/lib/tokens.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "Catches only colour literals; a hoisted spacing or radius number looks like any other number."
R6:
  type: manual
  reason: >
    Requires reading who consumes the binding. A constant read only inside its own module stays
    unexported; exporting a constant with a single in-module consumer is a violation (and dead
    code under the root CLAUDE.md rule).
  enforcedBy: null
R7:
  type: grep
  pattern: "^(export )?const [A-Z0-9_]*(DELAY|TIMEOUT|DURATION|INTERVAL|TIME)(?![A-Z0-9_]*_(MS|S)\\b)[A-Z0-9_]*\\s*="
  include: ["packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "packages/engine/src/**/*.ts", "packages/gpx/src/**/*.ts", "tools/docs/banner/**/*.ts", "tools/docs/banner/**/*.tsx", "tools/docs/*.config.ts", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "Needs PCRE (rg -P). Covers only the duration slice; DEFAULT_ and reason-naming are review items."
R8:
  type: glob
  pattern: "packages/ui/src/**/{constants,consts,config}.{ts,tsx}"
  include: ["packages/ui/src/**", "packages/engine/src/**", "packages/gpx/src/**", "tools/docs/banner/**", "tools/docs/*.config.ts", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "Blind to a de facto shared constants module under another name."
```

## 4. Trade-offs

- **Good, because** a named module-scope constant is the only documentation a magic number gets in a codebase that forbids explanatory comments, and the name can carry the reason (`DISMISS_VELOCITY`, `TOAST_DURATION_MS`) a bare literal cannot.
- **Good, because** hoisting puts every knob a unit exposes at the top of the file, so its tunable surface is visible without reading the body, and a spec can import the constant instead of restating the number.
- **Bad, because** the boundary is a judgement per value: a class string whose every number has been lifted into a constant reads far worse than the inline version, and the indirection buys nothing when the constant has one reader three lines below.
- **Neutral, because** the absence of a central constants module means the same value can be declared twice in two components without anything noticing; a value genuinely shared between two directories belongs in a `src/lib/` topic module or in the theme, not in a dumping ground.

## 5. Reference implementation

```ts
const DISMISS_OFFSET_RATIO = 0.3;
const DISMISS_VELOCITY = 500;

export const SHEET_DRAG_ELASTIC = 0.08;
```

```ts
const FLOATING_SURFACE = 'bg-surface/85 backdrop-blur-xl border border-white/10';

export const GLASS_CLASS = 'bg-surface/55 backdrop-blur-xl border border-white/10';
export const FLOATING_CLASS = `${FLOATING_SURFACE} shadow-[0_8px_24px_rgb(0_0_0/0.4)]`;
```

```tsx
const TOAST_DURATION_MS = 4000;

<ToastPrimitive.Root duration={t.persistent ? Infinity : TOAST_DURATION_MS} />
```

## 6. Forbidden practices

- ❌ A bare numeric literal as a delay, duration or threshold at the use site — the number is the decision, and an unnamed decision cannot be reviewed or reused by a spec.
- ❌ The same behavioural literal written twice in two modules (`dragElastic: 0.08` in a hook and in a component) instead of one exported constant.
- ❌ A module-scope constant holding a colour, spacing, radius, shadow or type-size literal; UPPER_SNAKE does not turn a raw design literal into a legitimate constant.
- ❌ A camelCase module-scope binding holding a frozen string or keyed data record (`glassClass`, `rowClass`); that is a constant and takes UPPER_SNAKE.
- ❌ Hoisting every number out of a class list, including `0`, `1` and a lone `z-10`.
- ❌ Exporting a constant that only its own module reads.
- ❌ A shared `constants.ts` collecting values from several components.
- ❌ A duration constant with no unit in its name.
