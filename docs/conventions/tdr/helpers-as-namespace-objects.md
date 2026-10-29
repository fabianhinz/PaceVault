---
kind: pattern-apply-tdr-reference
id: helpers-as-namespace-objects
title: Helpers with generic names are exposed as one namespace object
summary: A helper module whose functions have short or generic names exports one plain object named after the file, built from shorthand references to module-local functions; self-describing helpers stay loose exports.
governs:
  - "apps/web/src/**/*.ts"
  - "apps/web/src/**/*.tsx"
  - "packages/ui/src/**/*.ts"
  - "packages/ui/src/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5, R6]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Helpers with generic names are exposed as one namespace object

## 1. Context

This file carries rules R1–R6.

The rules also bind `packages/ui` (`packages/ui/src`, specs in `packages/ui/tests`); where the text below names an `apps/web` path, the kit's counterpart is meant.

A topic module that groups several helpers has two ways to publish them: loose named exports, or one exported object that gathers module-local functions under a single name. This convention governs when the second form is used and how it is shaped — the module keeps every function private and exports one plain object, so call sites read `statFormat.duration(...)` and carry the topic at the point of use. It applies to helper, formatting, parsing, transform and debug-command modules in `apps/web/src`; it does not govern constant tables, config literals or union-keyed maps, which take the same syntactic shape but are a different thing (exhaustive-record-maps-over-branching). What belongs in a module is helpers-group-by-topic; where a module sits is helpers-split-by-reachability. `apps/web/src/lib/format/formatters.ts` keeps loose named exports by owner decision.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | When a module's helpers have short or generic member names — `duration`, `percent`, `reset`, `open` — that would be ambiguous or collide with locals and props as bare imports, export them as one namespace object and keep the functions module-local. | manual |
| R2 | When each helper's own name already carries its topic and reads unambiguously at an unqualified call site (`railPace`, `subscribeCrash`), export the functions loosely and do not wrap them. | manual |
| R3 | Name the namespace object after the module file's basename (`statFormat.ts` → `statFormat`). Where the basename is generic, qualify the name with the directory's topic instead. | proposed |
| R4 | The namespace object is the module's only exported value. Types may be exported alongside it; the same function is never exported both loosely and as a member, and companion tables (docs, labels) live with whoever composes the object. | proposed |
| R5 | Build the object from shorthand references to already-declared module-local bindings. Do not inline function literals into the object. | proposed |
| R6 | Write the namespace object as a plain object literal — no `as const`, no `satisfies`, no `Object.freeze`. Those annotations mark a constant table or a keyed map, not a namespace. | proposed |

## 3. Detection

```yaml
R1:
  type: manual
  reason: "Judging whether a member name reads unambiguously without its topic qualifier is a naming judgement."
  enforcedBy: null
R2:
  type: manual
  reason: "Inverse of R1; a loose-export module is syntactically indistinguishable from one that should have been wrapped."
  enforcedBy: null
R3:
  type: grep
  pattern: "^export const ([a-z][A-Za-z0-9]*) = \\{$"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx"]
  exempt: []
  violationWhen: count-differs
  enforcedBy: null
  falsePositives: "Also matches constant objects and lookup maps, whose names follow no such rule; filter those out before comparing against the basename."
R4:
  type: grep
  pattern: "^export const [a-z][A-Za-z0-9]* = \\{$"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx"]
  exempt: []
  violationWhen: count-differs
  enforcedBy: null
  falsePositives: "Flags any file that exports both a namespace object and another value, including files whose matched object is a constant table. Type-only exports are not violations."
R5:
  type: manual
  reason: >
    For each object literal assigned to an exported namespace const, every property must be a
    shorthand reference; a property whose value is a function expression is a violation. An AST
    pass can check it; no single-line pattern scopes itself to the object body.
  enforcedBy: null
R6:
  type: grep
  pattern: "^export const [a-z][A-Za-z0-9]* = \\{[\\s\\S]*?\\n\\} (as const|satisfies )"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "Matches every constant table and keyed map, which are supposed to carry these annotations; only an object whose members are functions is a violation."
```

## 4. Trade-offs

- **Good, because** the topic is visible at the call site without a naming prefix on every function, so short member names stay short and identical verbs can live in several modules without colliding.
- **Good, because** the module's surface is one symbol: a reader sees everything the module offers in one literal at the bottom of the file, and adding an unexported helper cannot accidentally widen the public API.
- **Bad, because** it defeats tree-shaking — importing one member pulls the whole object and everything it references into the bundle.
- **Bad, because** individual members are harder to substitute in tests: consumers hold a reference to the object, so a test must patch a property on the shared object rather than mock a module export, and the patch leaks between tests unless restored.
- **Bad, because** the choice between this form and loose exports rests on a naming judgement that no tool can check, so two modules of comparable shape can diverge without anything flagging it.
- **Neutral, because** the object is a plain literal with no annotation, which keeps it cheap to write but gives it no structural type contract of its own.

## 5. Reference implementation

```ts
import { formatRaceTime } from '@/lib/format/formatters.ts';
import { getLocale } from '@pacevault/i18n/runtime.js';

const integerFmt = new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 0 });

const watts = (value: number): string => integerFmt.format(value);

const duration = (seconds: number): string => formatRaceTime(Math.round(seconds));

const percent = (share: number): string => integerFmt.format(share * 100);

const integer = (value: number): string => integerFmt.format(value);

export const statFormat = {
  watts,
  duration,
  percent,
  integer,
};
```

Call site:

```tsx
import { statFormat } from './statFormat.ts';

const label = statFormat.duration(lap.movingTime);
```

## 6. Forbidden practices

- ❌ Exporting a function both loosely and as a member of the namespace object — two import paths to the same behaviour, and consumers split between them.
- ❌ Declaring members as inline function literals inside the object — the functions become unreadable as a list, and the object stops being a table of contents.
- ❌ Annotating a function namespace with `as const`, `satisfies Record<...>` or `Object.freeze` — those signal a constant table or keyed map and mislead the reader about what the module is.
- ❌ Wrapping a single helper in a namespace object purely for symmetry, when its own name already reads unambiguously at the call site.
- ❌ Naming the object something unrelated to its module, so an import gives no clue which file it came from.
- ❌ Re-exporting the namespace object from another module under a second name, which reintroduces the ambiguity the object was meant to remove.
