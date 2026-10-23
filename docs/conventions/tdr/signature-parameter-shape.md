---
kind: pattern-apply-tdr-reference
id: signature-parameter-shape
title: One destructured options object once a signature takes more than one input
summary: A function, method or hook taking two or more inputs declares one destructured object parameter typed inline; one input stays bare; generic utilities, trailing infrastructure handles and library-imposed signatures are the only positional exceptions.
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
adopted_rules: [R1, R2, R3, R4, R5, R6, R7, R8]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# One destructured options object once a signature takes more than one input

## 1. Context

This file carries rules R1 through R8.

The rules also bind `packages/ui` (`packages/ui/src`, specs in `packages/ui/tests`); where the text below names an `apps/web` path, the kit's counterpart is meant.

The rules bind `packages/engine/src` too, with one difference set by the owner: R5 does not apply there. Every engine callable with two or more inputs takes one destructured object — per-record and per-second helpers inside hot loops included (`activeSeconds({ previous, current })`, `meanOf({ series, from, to })`) — and an anonymous pair gets field names (`{ from, to }`). R6 has no subject (the engine threads no infrastructure handle) and R8 keeps only callback contracts (`Array.prototype` callbacks, `sort` comparators) positional.

`packages/gpx/src` has no R5 carve-out either: its interpolation helpers take one object like every other callable there (`interpolateLinear({ from, to, fraction })`, `sliceRoute({ points, startMeters, endMeters })`).

`packages/testing/src` has no R5 carve-out either (owner decision): `clamp({ value, min, max })` and the random-walk and channel helpers take one object, and a series builder that takes a count and options takes them as one object (`cyclingRecordSeries({ count, basePowerWatts })`, `sessionSeries({ count, startDate, baseTss, tssVariation })`); a builder taking only a count stays positional (`lapSeries(count)`), and a factory keeps its single `overrides` parameter (test-data-from-mock-factories R2).

This record governs the **declaration side** of a parameter list only: how a callable states what it takes. A callable that needs one thing takes it bare and positional; a callable that needs several takes one destructured object holding all of them, typed inline at the declaration. Without that threshold the same operation acquires two or three unordered identifiers side by side (`updateTrip(id, name, sessionIds, description)`), every later field is a breaking positional insert, and an optional argument in the middle has to be padded with `undefined`.

Scope: arrow-function declarations, object-literal methods (store actions included) and custom hooks in `apps/web/src`. Out of scope: React component props, which are named `props` and never destructured; what a callable returns; and how callers pass arguments. Destructuring a *parameter object* is allowed and expected; destructuring component props and hook results stays forbidden (root `CLAUDE.md` §2).

The rules bind `tools/docs/banner/` as well. Its capture helpers thread the Playwright `Page` to Playwright calls, so `page` is the R6 handle there: it trails the domain inputs as a positional parameter (`shoot({ file, clip }, page)`, `openSession(name, page)`), a helper that takes only `page` keeps it bare, and the `({ page })` test fixtures and `page.evaluate` callbacks keep the shape Playwright imposes (R8). R5 applies as in the app (`clamp`, `padded`, `isWithin`).

The rules bind `tools/workbench` (`scripts/`, `site/src/`) as well. In `scripts/interfaces.ts` the printing context (`{ checker, file }`) is the R6 handle the printers only thread onward, so it trails the domain input positionally; the Connect middleware `handle(req, res, next)` keeps its list (R8).

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | A callable that takes two or more inputs declares them as a **single destructured object parameter**. Two or more positional parameters are a carve-out (R5, R6, R8), not the default. | proposed |
| R2 | A callable that takes exactly one input declares it as a bare positional parameter. Do not wrap a lone value in an object for symmetry with a neighbouring signature. | proposed |
| R3 | Type the destructured object with an **inline object type literal** right after the pattern. Introduce a named type only when a second declaration in the same module must share it or derive from it with `Omit`, `Pick` or `Partial`. | proposed |
| R4 | When every field of the object is optional, make the whole parameter optional with the default `= {}` and mark each field optional. Never `= { … }` with seeded values, and never a `?`-marked named parameter in place of the pattern. | proposed |
| R5 | Keep parameters positional when they are the anonymous inputs of a **generic utility** — a subject value plus a factor, a comparator pair, a callback, a ref — none of which carries an identity worth naming at the call site (`clamp(value, min, max)`, `byNewestFirst(a, b)`). Express a utility's tuning knobs, and the knobs of a subject-plus-options operation, as a trailing optional `options` object rather than further positional parameters. | manual |
| R6 | An infrastructure handle a callable accepts only to thread onward — a TanStack `QueryClient`, an `AbortSignal` — stays a **trailing positional parameter after** the domain input(s). It is not a field of the object. | manual |
| R7 | Where a destructuring pattern cannot be written — the parameter is a union of shapes, or optional with no default — declare it as a named parameter with an inline object type. Do not use that form anywhere a pattern would work. | proposed |
| R8 | A signature whose parameter list is imposed by a library or callback contract keeps that list verbatim: deck.gl `onClick(info, event)`, `idb`'s `upgrade(db, oldVersion)`, Zustand `StateStorage.setItem(name, value)`, persist `migrate(persisted, version)` / `merge(persisted, current)` and the helpers that mirror them. It is exempt only while an external caller dictates it. | manual |

## 3. Detection

Every grep entry is defeated by a signature wrapped across lines, which Oxfmt produces once a list exceeds 100 columns; the AST entry is the reliable one.

```yaml
R1:
  type: ast
  pattern: >
    VariableDeclaration or PropertyAssignment whose initializer is an ArrowFunction or
    FunctionExpression, or a MethodDeclaration, with more than one parameter and a first parameter
    that is not an ObjectBindingPattern. Report file, line, name and parameter names (the TypeScript
    compiler-API scanner in plans/signature-parameter-shape.md does exactly this).
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "packages/engine/src/**/*.ts", "packages/gpx/src/**/*.ts", "packages/testing/src/**/*.ts", "tools/docs/banner/**/*.ts", "tools/docs/banner/**/*.tsx", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Reports the R5, R6 and R8 carve-outs identically to genuine violations — the AST cannot tell a
    domain field from an anonymous utility input. Does not report inline callbacks passed straight
    to a call, which are framework signatures.
R2:
  type: grep
  pattern: "\\(\\s*\\{\\s*[A-Za-z_$][\\w$]*\\s*\\}\\s*:\\s*\\{\\s*[A-Za-z_$][\\w$]*\\??\\s*:[^;,{}]+;?\\s*\\}"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "packages/engine/src/**/*.ts", "packages/gpx/src/**/*.ts", "packages/testing/src/**/*.ts", "tools/docs/banner/**/*.ts", "tools/docs/banner/**/*.tsx", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Flags a legitimate one-field object that exists because R4 made the whole parameter optional
    (`{ path = '' }: { path?: string } = {}`) — check for the `= {}` tail. Misses multi-line forms.
R3:
  type: grep
  pattern: "\\}\\s*:\\s*(?:Omit|Pick|Partial|Required|[A-Z][\\w$]*)\\s*[<,)=]"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "packages/engine/src/**/*.ts", "packages/gpx/src/**/*.ts", "packages/testing/src/**/*.ts", "tools/docs/banner/**/*.ts", "tools/docs/banner/**/*.tsx", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Flags the sanctioned sharing case as loudly as the unsanctioned one; every match needs the module
    read to see whether a second declaration consumes the name.
R4:
  type: grep
  pattern: "\\}\\s*:\\s*\\{[^}]*\\}\\s*=\\s*\\{\\s*[^}\\s]"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "packages/engine/src/**/*.ts", "packages/gpx/src/**/*.ts", "packages/testing/src/**/*.ts", "tools/docs/banner/**/*.ts", "tools/docs/banner/**/*.tsx", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Single-line only; a seeded default on a multi-line pattern is missed.
R5:
  type: manual
  reason: >
    Separating an anonymous utility input from a named domain field is a judgement about what the
    value means, not its type.
  enforcedBy: null
R6:
  type: grep
  pattern: "\\{[^}]*\\bqueryClient\\b[^}]*\\}\\s*:\\s*\\{[^}]*queryClient\\s*:\\s*QueryClient"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "packages/engine/src/**/*.ts", "packages/gpx/src/**/*.ts", "packages/testing/src/**/*.ts", "tools/docs/banner/**/*.ts", "tools/docs/banner/**/*.tsx", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Flags existing object-shaped entry points that carry `queryClient` as a field by design
    (`runIntervalsSync({ queryClient, … })`, `createIngestBatcher({ queryClient })`), where the client
    is the operation's main collaborator rather than a threaded handle. Read each hit.
R7:
  type: grep
  pattern: "\\(\\s*(args|arg|input|data|params|parameters|payload|options|opts)\\??\\s*:\\s*\\{"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "packages/engine/src/**/*.ts", "packages/gpx/src/**/*.ts", "packages/testing/src/**/*.ts", "tools/docs/banner/**/*.ts", "tools/docs/banner/**/*.tsx", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Flags the sanctioned R7 forms and the trailing `options?` bag that R5 permits; keyed on a fixed
    name list.
R8:
  type: manual
  reason: >
    Establishing that an external caller dictates the parameter list means identifying the caller —
    a library's callback type, a Zustand middleware option.
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** adding an input is additive: a new field on an inline object type breaks only the call sites that must supply it.
- **Good, because** an optional input needs no position; it becomes an optional field and the signature stops accumulating `undefined`-shaped holes.
- **Good, because** two parameters of the same primitive type — two ids (`routeId`, `markerId`), two timestamps — cannot be silently transposed. The compiler checks the field name.
- **Bad, because** inline object types make a long signature genuinely long: the parameter list restates every field name twice, once in the pattern and once in the type.
- **Bad, because** R1 and R5 meet on a judgement call with no mechanical test; a two-parameter utility and a two-field operation look identical to a reviewer who does not know the domain.
- **Neutral, because** the threshold is arity, not kind of value, so functions, store actions and hooks obey the same line.

## 5. Reference implementation

```ts
const reprocessSession = async ({
  session,
  profile,
}: {
  session: TrainingSession;
  profile: UserProfile;
}): Promise<TrainingSession> => { … };

const deleteTrip = (id: string): void => { … };

const moveStudioMarker = ({
  routeId,
  markerId,
  distanceM,
}: {
  routeId: string;
  markerId: string;
  distanceM: number;
}): void => { … };

export const listIntervalsActivities = async ({
  apiKey,
  oldest = FULL_HISTORY_OLDEST,
}: {
  apiKey: string;
  oldest?: string;
}): Promise<IntervalsResult<IntervalsActivity[]>> => { … };

export const invalidatePersonalBestsOfSession = (sessionId: string, queryClient: QueryClient) => { … };

export const niceAxis = (values: number[], { tickCount }: { tickCount?: number } = {}) => { … };

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
```

## 6. Forbidden practices

- ❌ Two or more positional parameters that each carry a domain meaning — an id, a payload, a sport, a profile — even when the order feels obvious at the declaration.
- ❌ A single-field destructured object introduced so a signature matches the one above it. One input is positional.
- ❌ `args: { … }`, `input: { … }`, `data: { … }` as a substitute for a destructuring pattern — it forces the body to re-prefix every field.
- ❌ A named interface or type alias declared solely to shorten one signature's parameter list.
- ❌ Expressing an all-optional object as `obj?: { … }` instead of `{ … }: { … } = {}`.
- ❌ A `QueryClient`, abort signal or other thread-through handle declared as a field of the operation's object.
- ❌ A boolean appended positionally to an existing signature to switch behaviour (`ingestBatch(parsed, markNew)`). If it belongs to the operation it is an object field; if the signature is an R5 utility it belongs in the trailing `options` object.
