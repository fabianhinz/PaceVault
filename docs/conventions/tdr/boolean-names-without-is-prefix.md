---
kind: pattern-apply-tdr-reference
id: boolean-names-without-is-prefix
title: Booleans are named for the state, not with an interrogative prefix
summary: A boolean value is named for the state it holds (open, zoomed, expanded), persisted fields keep their names; only a function or type guard that computes a boolean takes the is/has prefix.
governs:
  - "apps/web/src/**/*.ts"
  - "apps/web/src/**/*.tsx"
  - "packages/engine/src/**/*.ts"
  - "packages/ui/src/**/*.ts"
  - "packages/ui/src/**/*.tsx"
  - "packages/testing/src/**/*.ts"
  - "tools/docs/banner/**/*.ts"
  - "tools/docs/banner/**/*.tsx"
  - "tools/docs/*.config.ts"
  - "tools/workbench/scripts/**/*.ts"
  - "tools/workbench/site/src/**/*.ts"
  - "tools/workbench/site/src/**/*.tsx"
  - "tools/workbench/tests/**/*.ts"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Booleans are named for the state, not with an interrogative prefix

## 1. Context

This file carries rules R1 through R7. Persisted members are out of scope and keep their names (Scope below).

The rules also bind `packages/ui` (`packages/ui/src`, specs in `packages/ui/tests`); where the text below names an `apps/web` path, the kit's counterpart is meant. A member the kit hands to its consumers (`useDevice().desktop`, a prop) is renamed together with every consumer in `apps/web` and `tools/`. They bind `packages/engine/src` as well: an engine interface field, local flag or predicate follows R1, R4 and R5 like app code, and an exported engine predicate is renamed together with its app readers; the persisted `TrainingSession` flags are the exception below. The test factories and series builders in `packages/testing/src` follow R1 and R4 for their local flags; the `TrainingSession` defaults they set (`isPlanned`, `hasDetailedRecords`) keep the persisted names.

A boolean that holds a value is named for the state it describes — `loading`, `disabled`, `open`, `zoomed`, `expanded` — and not with an interrogative prefix (`isLoading`, `hasData`, `canEdit`). A boolean that *computes* an answer — a predicate function or a type guard — is the opposite case and keeps the `is`/`has` prefix, because there the prefix is the verb that makes the call site read as a question. Without the split, the same name shape means two different things and a reader cannot tell a stored flag from a call they must make.

Scope: every boolean declaration site in the app and in the shared session type the app persists — component props, interface and type fields, zod schema fields, store state fields, hook return members, `useState` tuples and local derived constants. Out of scope: how a boolean is read at a call site. TanStack Query results are the principal exception (R6): they carry `isLoading`/`isFetching` and keep those names where forwarded. Also out of scope, by owner decision: persisted and stored shapes. A field written to IndexedDB or through a store's persist — the `TrainingSession` flags `isPlanned`, `hasDetailedRecords`, `isNew` (`store-sessions`) and `PrescribedWorkout.isTaper` inside the cached coach plan (`store-coach-plan`) — keeps its name; no rename, persist `version` bump or `migrate` step is made for these rules.

The rules bind `tools/docs` as well (the banner capture and page under `tools/docs/banner/`, and `tools/docs/*.config.ts`): a local flag or prop follows R1 and R4, a helper that returns a boolean takes the `is`/`has` prefix (R5, `isWithin`, `isOverTrack`), and a Playwright option (`isMobile`, `hasTouch`, `fullyParallel`, `reuseExistingServer`) keeps the library's name (R6).

The rules bind `tools/workbench` as well (`scripts/`, `site/src/`, `tests/`); nothing there is stored, so no member keeps an old name for a file format.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Name a boolean member — prop, interface or type field, store state field, hook return member, options field, parameter — for the state it holds, with no `is`/`has`/`should`/`can`/`will`/`did` prefix. A persisted member keeps its current name (out of scope, Section 1). | proposed |
| R2 | Name a `z.boolean()` schema field the same way. A schema field is part of a stored or wire contract and its name outlives any local rename. | proposed |
| R3 | Name a `useState` boolean for its state. Where the subject needs naming, put it in front (`dialogOpen`, `deleteConfirmationOpen`), never as a prefix question. | proposed |
| R4 | Name a local derived boolean constant for the state it expresses, not for the question it answers. | proposed |
| R5 | A function or type guard that *returns* a boolean takes the `is`/`has` prefix: `isThing(x)`, `hasThing(x)`, `(x): x is Thing`. This is the inverse of R1 and is deliberate — the prefix marks the call. | proposed |
| R6 | A member that implements or forwards an external interface (a TanStack Query result field, a library prop) keeps that interface's name unchanged. Renaming it to satisfy R1 breaks the correspondence and hides the origin. | manual |
| R7 | Express polarity positively for a required flag. An optional opt-out flag that defaults to `false` uses a `disable*` / `no*` / `hide*` / `skip*` name. Never negate with a `not*` prefix. | proposed |

## 3. Detection

R1 and R6 are in direct tension by design: R1's grep flags every prefixed member, and R6 is the judgement call that clears the legitimate ones. An automated pass over R1 alone over-reports and must be read as a worklist, not a verdict.

```yaml
R1:
  type: grep
  pattern: "^\\s*(?:readonly )?(?:is|has|should|can|will|did)[A-Z]\\w*\\??\\s*:\\s*boolean"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/engine/src/**/*.ts", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "packages/testing/src/**/*.ts", "tools/docs/banner/**/*.ts", "tools/docs/banner/**/*.tsx", "tools/docs/*.config.ts", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx", "tools/workbench/tests/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Flags every R6 carve-out: members implementing a third-party interface and hook return members
    forwarding a query result verbatim. Anchored to a line start, so it misses members declared
    inline (`{ isLive: boolean }`), members of object literals without a type annotation (a hook
    returning `{ canEdit: … }`; grep `^\\s+(?:is|has|can)[A-Z]\\w*:\\s` for those), and any member
    typed by an alias rather than the literal `boolean`. Also flags the persisted members
    `TrainingSession.isPlanned`/`hasDetailedRecords`/`isNew` and `PrescribedWorkout.isTaper`,
    which keep their names (out of scope, Section 1).
R2:
  type: grep
  pattern: "\\b(?:is|has|should|can|will|did)[A-Z]\\w*\\s*:\\s*z\\.boolean\\s*\\("
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "packages/engine/src/**/*.ts", "packages/testing/src/**/*.ts", "tools/docs/banner/**/*.ts", "tools/docs/banner/**/*.tsx", "tools/docs/*.config.ts", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx", "tools/workbench/tests/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A schema mirroring a third-party payload must keep the foreign field name (R6). A schema
    parsing a legacy persisted shape inside a store's `migrate` names the old field on purpose.
R3:
  type: grep
  pattern: "const \\[(?:is|has|should|can|will|did)[A-Z]\\w*\\s*,\\s*set\\w+\\]\\s*=\\s*useState"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "packages/engine/src/**/*.ts", "packages/testing/src/**/*.ts", "tools/docs/banner/**/*.ts", "tools/docs/banner/**/*.tsx", "tools/docs/*.config.ts", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx", "tools/workbench/tests/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Cannot tell a boolean `useState` from one holding another type; misses tuples split across lines.
R4:
  type: grep
  pattern: "\\b(?:const|let) (?:is|has|should|can|will|did)[A-Z]\\w*\\s*=\\s*[^(=<]"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "packages/engine/src/**/*.ts", "packages/testing/src/**/*.ts", "tools/docs/banner/**/*.ts", "tools/docs/banner/**/*.tsx", "tools/docs/*.config.ts", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx", "tools/workbench/tests/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Flags a const bound to a call of a prefixed predicate (`const isX = isY(z)` is still a rename
    target) and non-boolean consts whose names begin with those letters. Treat every hit as a
    question, not a finding.
R5:
  type: grep
  pattern: "\\bconst (?!is[A-Z]|has[A-Z]|use[A-Z])[a-zA-Z_$]\\w*\\s*=\\s*(?:<[^>]*>\\s*)?\\([^)]*\\)\\s*:\\s*(?:boolean\\b(?!\\[)|\\w+ is [A-Z])"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "packages/engine/src/**/*.ts", "packages/testing/src/**/*.ts", "tools/docs/banner/**/*.ts", "tools/docs/banner/**/*.tsx", "tools/docs/*.config.ts", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx", "tools/workbench/tests/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Needs PCRE (`rg -P`). Wrongly flags a function whose name is fixed by an external callback
    contract (`getSnapshot` for `useSyncExternalStore`) and a zero-argument thunk that is really a
    value. Misses predicates without an explicit return annotation, and boolean-returning function
    members of an interface (`canWrite: () => boolean`), which need a read.
R6:
  type: manual
  reason: >
    Deciding that a prefixed name is mandated from outside requires reading where it comes from — an
    implemented library interface, a field forwarded from a query result, a `packages/ui` prop. No
    single-file pattern distinguishes that from a locally invented name.
  enforcedBy: null
R7:
  type: grep
  pattern: "^\\s*(?:readonly )?not[A-Z]\\w*\\??\\s*:\\s*boolean"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "packages/engine/src/**/*.ts", "packages/testing/src/**/*.ts", "tools/docs/banner/**/*.ts", "tools/docs/banner/**/*.tsx", "tools/docs/*.config.ts", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx", "tools/workbench/tests/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Covers only the `not*` half. Whether an opt-out flag defaults to false and reads
    `disable*`/`no*`/`hide*`/`skip*` needs the default value and the consumer.
```

Nothing in this project's toolchain fails on any of this; oxlint's naming rules constrain casing, not semantics.

## 4. Trade-offs

- **Good, because** the name states a fact rather than posing a question, which is what a stored value is. `disabled: boolean` on a props type reads as a property of the thing; `isDisabled` reads as a query that has already been answered and frozen.
- **Good, because** it keeps the app's own props interchangeable with the DOM and Radix vocabulary, which is uniformly bare — `disabled`, `open`, `checked` — so a prop can be forwarded to the element or the `@pacevault/ui` component without a rename.
- **Good, because** reserving `is`/`has` for functions and type guards makes the prefix carry information again: seeing `isThing` tells you it is callable, and seeing `thing` tells you it is not.
- **Bad, because** a bare boolean reads ambiguously in isolation. `active` could be a flag, a status string or an object, and `error` as a boolean sits uneasily next to `error` as an object — which is why a qualifier (`dataPresent`, `requestFailed`) is sometimes needed.
- **Bad, because** it fights the surrounding ecosystem. TanStack Query results and much third-party TypeScript use `is*` heavily, so any hook that forwards a query result either violates R1 or renames a field and loses the correspondence. R6 absorbs that, but two naming styles then live side by side in one return type.
- **Neutral, because** the rule constrains the name only, not the shape. A flag that turns out to have more than two states should become a union anyway, and at that point this record stops applying to it.

## 5. Reference implementation

```tsx
interface WorkoutCardProps {
  workout: PrescribedWorkout;
  expanded: boolean;
  onToggle: () => void;
}

interface UseChartZoomReturn<T> {
  zoomedData: T[];
  zoomed: boolean;
  resetZoom: () => void;
}

const [deleting, setDeleting] = useState(false);
const profilePresent = useUserStore((s) => s.profile !== null);

export interface LapAnalysis {
  interval: boolean;
  partial: boolean;
}

export const isSessionOutdated = (session: { derivationVersion: number }): boolean =>
  session.derivationVersion < SESSION_DERIVATION_VERSION;

const isEditable = (key: ThresholdTileKey): key is ThresholdKey => key !== 'wkg';

const weatherLoading = weather.isLoading;
```

## 6. Forbidden practices

- ❌ `isLoading`, `isOpen`, `isDisabled`, `isActive`, `isZoomed` as a prop, field or state name — the prefix adds nothing the type has not already said.
- ❌ `hasX`, `shouldX`, `canX` as a field name. They are rarer than `isX` but the same mistake; `hasData` is `dataPresent`, `canEdit` is `editable`.
- ❌ Renaming a member that an external interface or a query result defines, in order to satisfy R1. That is R6, not a violation to fix.
- ❌ Renaming a persisted field (a `TrainingSession` flag, a cached-plan field) to satisfy R1 — stored shapes are out of scope and keep their names.
- ❌ Inventing a locally prefixed name because a nearby object already owns the bare one (a boolean `isError` beside an `error` object). Qualify the boolean instead — `errorShown`, `requestFailed`.
- ❌ Stripping the `is`/`has` prefix from a predicate function or type guard, or giving one a `can`/`matches`/`uses` verb instead. `sameSubject(a, b)` reads as a value; `isSameSubject(a, b)` reads as the call it is.
- ❌ `not*` names, and any negated required flag. Use the positive state, or an optional `disable*`/`no*` opt-out that defaults to false.
- ❌ Burying the subject behind the prefix: `isMarkerEditorOpen` over `markerEditorOpen`. The subject goes first, the state word stays last.

