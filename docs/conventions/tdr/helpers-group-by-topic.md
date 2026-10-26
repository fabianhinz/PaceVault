---
kind: pattern-apply-tdr-reference
id: helpers-group-by-topic
title: Helper modules are named for a topic and hold that topic's functions
summary: A plain .ts helper module is named for its subject and holds every function, constant and small type of that subject; a topic is never split across several sibling modules.
governs:
  - "apps/web/src/lib/**/*.ts"
  - "apps/web/src/components/**/*.ts"
  - "apps/web/src/parsers/**/*.ts"
  - "packages/ui/src/lib/**/*.ts"
  - "packages/engine/src/**/*.ts"
  - "packages/gpx/src/**/*.ts"
  - "tools/docs/banner/**/*.ts"
  - "tools/workbench/scripts/**/*.ts"
  - "tools/workbench/site/src/**/*.ts"
  - "tools/workbench/site/src/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Helper modules are named for a topic and hold that topic's functions

## 1. Context

This file carries rules R1–R7.

The rules also bind `packages/ui` (`packages/ui/src`, specs in `packages/ui/tests`); where the text below names an `apps/web` path, the kit's counterpart is meant: `packages/ui/src/lib/` modules are topic modules (`sheetPosition.ts`, `tokens.ts`, `surfaces.ts`). Every module of `packages/engine/src` is a topic module in the same sense (`geodesy.ts`, `bounds.ts`, `zones.ts`, `recordPairs.ts`); its spec in `packages/engine/tests/` is named after it and moves with it.

`packages/gpx/src` is read the same way: each of its modules is a topic module (`parseGpx.ts`, `buildGpx.ts`, `routeCut.ts`, `routeGeometry.ts`, `routeProfile.ts`), and a helper two of them need (`groupBySegment`, `segmentGradients`) lives in the module of its subject, `routeGeometry.ts`.

This is a boundary convention. Hooks and components follow a one-symbol-per-file discipline (one-hook-per-file, component-declaration-shape); this convention says where that discipline stops. A helper module is a unit of *subject matter*, not a unit of one function: it is named after the topic it covers and holds however many related functions, constants and small types that topic currently needs — one today, six later, without a rename or a new file. In this app that also means a topic is never cut into several sibling modules that import each other in a chain: the laps of a session live in `apps/web/src/lib/analysis/laps.ts`, the IndexedDB database in `apps/web/src/lib/storage/db.ts`, weather in `apps/web/src/lib/api/weather.ts`.

Scope: plain `.ts` helper modules — the `apps/web/src/lib/<topic>/` folders and the helper modules in feature folders (`apps/web/src/components/<feature>/**/<topic>.ts`), plus `apps/web/src/parsers/`. A topic folder in `lib/` is not a split topic: it holds several topic modules of one area (`lib/filtering/filters.ts` beside `lib/filtering/timeRange.ts`). Out of scope: hooks and components, store modules, and worker entry modules. Which directory a helper belongs in is helpers-split-by-reachability; exporting helpers as one namespace object is helpers-as-namespace-objects.

`tools/docs/banner/` is read the same way: its plain `.ts` modules are topic modules — the locales (`locales.ts`), the banner content (`bannerContent.ts`), the environment hand-off (`env.ts`) and the capture's steps by subject (`messages.ts`, `stillness.ts`, `png.ts`, `clip.ts`, `appPage.ts`, `shots.ts`); the Playwright test file `capture.ts` and the runner `run.ts` are entry modules, not helper modules.

`tools/workbench/scripts/` and `tools/workbench/site/src/lib/` are read the same way: the plan reader (`frontmatter.ts`), the check rules (`checkRules.ts`), the tech.md reader (`techFile.ts`), the repo locations and path helpers (`paths.ts`), the graphs (`deps.ts`, `componentGraph.ts`), the markdown renderer (`markdown.ts`), the Tech tab's Actual sides (`techActual.ts`) and the board model (`board.ts`) are each one topic.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Name a helper module after its topic — the subject its functions operate on or the operation family they form — not after whichever function it happens to hold today. | manual |
| R2 | Put every function belonging to one topic in that topic's module. Do not create a second module for a function that shares the first module's subject, imports or private constants; a topic already split across modules (`laps.ts` + `lapSet.ts` + `lapRanges.ts` …) is merged into one. | proposed |
| R3 | A helper module exports as many symbols as its topic needs. A module holding one function is correct only when the topic has one function; it is not a target to split toward. | manual |
| R4 | Colocate a topic's supporting constants and small types in the same module as the functions that consume them, rather than in a parallel constants or types module. | manual |
| R5 | Split a helper module when its exports stop sharing a subject — not when it crosses a count. The new module is named for the topic that left. | manual |
| R6 | Do not name a helper module for a generic bucket (`utils`, `helpers`, `misc`, `common`, `shared`) unless the enclosing directory supplies the topic the filename omits. | proposed |
| R7 | Feature-local helper modules follow the same rule as `apps/web/src/lib`: a topic-named module beside the feature, holding that topic's functions. | manual |

## 3. Detection

```yaml
R1:
  type: manual
  reason: >
    Whether a filename names a topic or a function depends on whether the topic has room to grow;
    the two are indistinguishable as strings.
  enforcedBy: null
R2:
  type: manual
  reason: >
    Mechanical but multi-step: within each directory, group modules by shared camelCase name stem
    (ls apps/web/src/lib | sed -E 's/([a-z]+)[A-Z].*/\1/' | sort | uniq -d) and by import chains
    between siblings (a module importing './<sibling>.ts' of the same stem), then read each group.
    Both signals are hints, never a verdict.
  enforcedBy: null
  falsePositives: >
    Flags independent modules that share a prefix because they act on the same noun through
    unrelated mechanisms (railFormat.ts vs railRange.ts). Blind to two over-split modules whose
    names share no stem.
R3:
  type: manual
  reason: "Whether a single-export module's topic has further functions is a fact about the domain."
  enforcedBy: null
R4:
  type: manual
  reason: "Whether a constant belongs beside its consumers depends on how many modules read it."
  enforcedBy: null
R5:
  type: manual
  reason: "'Exports stopped sharing a subject' has no mechanical form; a count threshold is the wrong proxy."
  enforcedBy: null
R6:
  type: glob
  pattern: "apps/web/src/**/{utils,helpers,util,misc,common,shared}.ts"
  include: ["apps/web/src/**", "packages/ui/src/**", "packages/engine/src/**", "packages/gpx/src/**", "tools/docs/banner/**/*.ts", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A bucket filename is acceptable when the directory above it names the topic. Misses the
    topic-suffixed bucket (`<topic>Utils.ts`).
R7:
  type: manual
  reason: "Identifying which feature-local .ts modules are helpers rather than orchestration needs reading them."
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** the directory listing reads as a map of subjects rather than a list of verbs: a reader looking for "how do we build lap bands" finds one filename instead of scanning six.
- **Good, because** a topic module gives private constants and small types a home next to their only consumers, so adding the topic's second function costs an export, not a new file plus two imports.
- **Good, because** the module name survives growth — the file that held one function holds four later without a rename, so import sites and call-site diffs stay stable.
- **Bad, because** "cohesive topic" and "grab bag" have no mechanical boundary. A topic module attracts anything plausibly adjacent, and nothing catches the drift except someone reading the export list and asking whether the names still share a subject.
- **Bad, because** two authors will draw the topic line differently, and a helper can land in either of two defensible modules — a cost the one-per-file rules do not have.
- **Neutral, because** the resulting modules vary widely in size, so file size carries no information here and is not a review signal.

## 5. Reference implementation

Good — `apps/web/src/lib/api/intervals.ts`, one subject with every function of it (`:84-92`, `:144`, `:153-161`, bodies elided):

```ts
export const FULL_HISTORY_OLDEST = '1990-01-01';

export const listIntervalsActivities = async ({
  apiKey,
  oldest = FULL_HISTORY_OLDEST,
}: {
  apiKey: string;
  oldest?: string;
}): Promise<IntervalsActivity[]> => {

const BUFFER_DAYS = 14;

export const intervalsSyncWindowOldest = (sessions: TrainingSession[]): string | undefined => {
  let newest: number | undefined = undefined;
  for (const session of sessions) {
    if (session.source.kind !== 'intervals') continue;
    if (newest === undefined || session.date > newest) newest = session.date;
  }
  if (newest === undefined) return undefined;
  return toLocalDate(newest - BUFFER_DAYS * MS_PER_DAY);
};
```

Bad — `intervals.ts` plus `intervalsSyncWindow.ts`: two sibling modules with one subject (the intervals.icu listing window), the second holding one function named after itself. That is one `intervals.ts`.

## 6. Forbidden practices

- ❌ Splitting a topic module so each exported function gets its own file — the one-per-file rule belongs to hooks and components; applied to helpers it hides the relationship between functions that were written to be read together.
- ❌ A new module for a function whose imports, constants and subject already exist in a sibling — that function's home is the sibling.
- ❌ Naming a helper module after its only function when the topic can obviously grow — the next function either forces a rename or starts a second module.
- ❌ A parallel `<topic>Constants.ts` or `<topic>Types.ts` holding a handful of values read only by `<topic>.ts` — three files for one subject.
- ❌ A bare `utils.ts`, `helpers.ts` or `misc.ts` whose directory does not name the topic either.
- ❌ Splitting a helper module because it crossed a line or export count while its exports still share one subject — size is not the signal here.
