---
kind: pattern-apply-tdr-reference
id: hook-directory-placement
title: A hook's directory names what it is about, not who uses it
summary: A hook lives in the hooks/ directory of the concept it is about; src/lib/hooks/ is only for non-domain primitives, and server reads, writes and routing have their own top-level directories.
governs:
  - "apps/web/src/**/use*.ts"
  - "apps/web/src/**/use*.tsx"
  - "tools/workbench/site/src/**/*.ts"
  - "tools/workbench/site/src/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7, R8]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# A hook's directory names what it is about, not who uses it

## 1. Context

This file carries rules R1–R8.

Hooks in `apps/web/src` sit in `hooks/` directories, and which `hooks/` directory a hook sits in is the only thing that tells a reader where it belongs. Without a placement rule, a hook that several screens need gets copied, or lands in whichever directory happened to need it first, and the next reader cannot tell whether calling it from elsewhere is normal or a layering mistake.

The rule is ownership, not reach. A hook lives with the concept it is *about* — the entity it reads, the surface it drives, the capability it wraps — and that directory owns it regardless of how many other parts of the app call it. Being imported from another feature is the expected outcome of putting a hook in the right place. The app-wide `apps/web/src/lib/hooks/` is therefore not "the shared ones"; it holds hooks that are about nothing in this product — generic React, DOM, browser, timing and chart-interaction primitives.

Scope: hook modules under `apps/web/src`. Out of scope: hooks exported by workspace packages (`packages/ui/src/hooks/`), test helpers under `apps/web/tests/`, and the zustand store modules in `apps/web/src/store/` whose `use<Name>Store` accessors are store definitions, not placed hooks. This record governs placement only; one hook per module is `one-hook-per-file`, the shape of a server-call module is `one-server-call-per-hook-module`.

In `tools/workbench` the board island's hooks live in `site/src/app/hooks/` (R1, R5–R7; R8 for the pure helpers only its hooks read); R2 and R4 name `apps/web` trees and have no subject there.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Place a hook in the `hooks/` directory of the module that owns the concept it is about — the entity it reads, the surface it drives, or the capability it wraps (e.g. `apps/web/src/features/map/hooks/`, `apps/web/src/store/hooks/`). Never place it under the module that happens to call it. | manual |
| R2 | Reserve `apps/web/src/lib/hooks/` for hooks that are about no domain concept: React, DOM, browser, viewport, timing and chart-interaction primitives. A hook named after or acting on a domain entity (sessions, thresholds, metrics, the map) belongs in that entity's directory even when every part of the app calls it. | proposed |
| R3 | Treat importing another module's hook by its full path as ordinary use. Cross-feature reach is not a placement error and is never a reason to copy a hook, re-export it, or move it into `apps/web/src/lib/hooks/`. | manual |
| R4 | Server reads live in `apps/web/src/queries/`, server writes (IndexedDB, Open-Meteo, intervals.icu) in `apps/web/src/mutations/`, routing in `apps/web/src/routing/`. Those directories are hook directories in their own right; a hook of one of those kinds goes there and never into a feature `hooks/` directory, and no `hooks/` subdirectory is created inside them. | proposed |
| R5 | Nest a `hooks/` directory at whatever depth owns the concept. A sub-surface with hooks of its own gets its own `hooks/` beside its components (`features/sessions/session/hooks/` next to `features/sessions/hooks/`). Do not hoist a hook to the feature root to avoid nesting. | manual |
| R6 | A hook may sit loose beside a component only while that component, in the same directory, is its sole consumer. The first import from any other directory moves it into a `hooks/` directory. | proposed |
| R7 | A directory holds either a `hooks/` subdirectory or loose `use*` siblings, never both. Introducing `hooks/` means moving the loose siblings into it in the same change. | proposed |
| R8 | A `hooks/` directory may also hold pure non-hook modules that only its hooks use — a types module, a predicate table, a formatter. Name each for what it computes; a `helpers.ts` or `utils.ts` is not a name. | proposed |

## 3. Detection

```yaml
R1:
  type: manual
  reason: >
    Deciding which module owns a concept requires reading what the hook does, not where it sits.
    A hook's own importers are actively misleading here: the correct owner is frequently a module
    that never calls it.
  enforcedBy: null
R2:
  type: manual
  reason: >
    Requires importer analysis: for each file in apps/web/src/lib/hooks/, read whether it touches a
    store or domain type from apps/web/src/store or @pacevault/engine, and collect its importers. A
    hook that reads or writes a domain store is a candidate for moving to that concept's directory.
    A generic primitive with one call site so far is correctly placed, so a hit is a prompt to read
    the hook, not a defect.
  enforcedBy: null
  falsePositives: >
    Flags a genuinely generic primitive that only one part of the app needs so far (useDismiss with
    its single Dock importer is correctly placed). Misses a domain hook whose domain dependency is
    passed in as an argument rather than imported.
R3:
  type: manual
  reason: >
    The rule permits a shape rather than forbidding one; there is nothing for a pattern to match.
  enforcedBy: null
R4:
  type: grep
  pattern: "\\buse(Query|InfiniteQuery|Mutation)\\s*\\("
  include: ["apps/web/src/**/use*.ts", "apps/web/src/**/use*.tsx", "apps/web/src/**/*.tsx", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: ["apps/web/src/queries/**", "apps/web/src/mutations/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Flags a composing hook that legitimately calls a dedicated query hook and adds derivation on
    top only if it calls useQuery itself; calling useSessionWeather from a feature hook is not a
    match. Also run `find apps/web/src/queries apps/web/src/mutations apps/web/src/routing -type d -name hooks`
    and treat any output as a violation.
R5:
  type: manual
  reason: >
    "The depth that owns the concept" is a judgement about the component tree, not a path shape.
    Nested and root-level hooks directories are both correct and look identical to a matcher.
  enforcedBy: null
R6:
  type: manual
  reason: >
    Requires importer analysis: for each apps/web/src/**/use*.ts(x) outside a hooks/, queries/,
    mutations/ or routing/ directory, collect its importers (`rg -l "/<hookName>\\.ts"`); any
    importer outside the hook's own directory is a violation.
  enforcedBy: null
  falsePositives: >
    Resolution by filename over-matches when two hooks in different directories share a base name.
    A hook with no importers at all reads as clean here and is a separate problem (delete it).
    Type-only imports count as importers.
R7:
  type: glob
  pattern: "a directory under apps/web/src containing a hooks/ subdirectory and also a use*.ts(x) file directly"
  include: ["apps/web/src/**", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R8:
  type: glob
  pattern: "apps/web/src/**/hooks/{helpers,utils,misc,common,shared,index}.{ts,tsx}"
  include: ["apps/web/src/**/hooks/**", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Does not judge names outside the bucket list, so a badly named but differently spelled module
    passes. `shared.ts` is allowed inside apps/web/src/queries/ and apps/web/src/mutations/ (see
    one-server-call-per-hook-module), which are not `hooks/` directories.
```

Nothing in the toolchain (root `vite.config.ts` lint block) fails on any of this today, so every entry is `proposed` or `manual` with `enforcedBy: null`.

## 4. Trade-offs

- **Good, because** the path answers the question a reader actually has. `features/sessions/session/hooks/` says the hook is about the session detail surface, which is stable, rather than who calls it, which changes every iteration.
- **Good, because** a hook never has to move when a second or a fifth consumer appears. Placement is decided once, from the hook's own subject, and reach can grow without churn.
- **Good, because** the app-wide directory stays small and legible: it holds primitives, so a newcomer scanning it learns the platform layer rather than wading through product logic.
- **Bad, because** ownership is a judgement call with no signal behind it. Two reasonable people place the same hook in two directories, and nothing in CI will tell them apart — the rule is only as good as review.
- **Bad, because** when a hook *is* misplaced, correcting it is a move plus an import update across every call site, and a rename in the diff obscures the real change. The predictable result is that hooks stay where they landed, most visibly in the app-wide directory.
- **Bad, because** the loose-hook allowance in R6 is a cliff: the module is correctly placed right up until one import elsewhere makes it wrong, and nothing prompts the author of that import to move it.
- **Neutral, because** deep nesting is permitted, so a large feature's hooks are spread over several directories rather than gathered in one — better for locality, worse for getting an overview of everything a feature does.

## 5. Reference implementation

Placement is a directory decision, so the tree is the artifact:

```
apps/web/src/
  lib/hooks/                      about nothing in the product: primitives only
    useDebouncedValue.ts
    useDismiss.ts
    useChartZoom.ts
  queries/                        server reads, a hook directory in its own right (R4)
    weather/useSessionWeather.ts  no hooks/ subdirectory inside
  mutations/                      server writes, same shape
    sessions/useDeleteSessionMutation.ts
  routing/                        routing hooks, same shape
    usePageRouting.ts
  store/
    hooks/useStoresHydrated.ts    about the store, so it lives with the store (R1)
  features/
    map/
      MapBackground.tsx
      hooks/                      hooks about the map; sessions and studio import them freely (R3)
        useMapHover.ts
        useWatchPositionEffect.ts
        types.ts                  pure module only these hooks use (R8)
    sessions/
      hooks/useSessionTitle.ts
      session/
        hooks/useSessionColorModes.ts   nested: the detail surface owns its own hooks (R5)
  components/
    layout/
      Dock.tsx
      useDockList.ts              loose is allowed: sole consumer is its sibling (R6),
                                  so components/layout/ has no hooks/ (R7)
```

## 6. Forbidden practices

- Promoting a hook to `apps/web/src/lib/hooks/` because a second feature started using it — reach is not the criterion. If the hook is about a domain concept it stays with that concept, no matter how many callers it has.
- Copying a hook into a second feature's `hooks/` directory, or re-exporting it from one, to avoid an import that crosses features. Import it by its full path.
- A domain-named hook in `apps/web/src/lib/hooks/` (`useMetrics`, `useThresholdsAt`, `useMapHover`) — it reads as a platform primitive and will be reached for in contexts where its assumptions do not hold.
- A `hooks/` subdirectory inside `apps/web/src/queries/`, `apps/web/src/mutations/` or `apps/web/src/routing/`, or a server-call hook filed under a feature's `hooks/` because that feature is its only caller.
- A directory holding both a `hooks/` subdirectory and loose `use*` siblings — the split is arbitrary and the next author cannot tell which half a new hook joins.
- A loose `use*` module imported from outside its own directory. The single-consumer allowance expires at the first external import; move it rather than leaving it beside a component it no longer belongs to.
- `helpers.ts`, `utils.ts` or `common.ts` inside a `hooks/` directory — a non-hook module there is named for what it computes.
- Hoisting a sub-surface's hooks to the feature root `hooks/` because nesting feels excessive; depth follows ownership.
