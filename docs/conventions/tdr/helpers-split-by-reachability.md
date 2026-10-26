---
kind: pattern-apply-tdr-reference
id: helpers-split-by-reachability
title: Helpers are filed by the runtimes that reach them
summary: A helper lives in the widest runtime directory that runs it (packages/engine and packages/gpx for pure code shared across runtimes, apps/web for the browser, tools/* for Node); inside apps/web, code only one feature uses lives in that feature's folder in src/components/, UI-only shared helpers live with their component owner, and src/lib/ holds only what the store, queries, mutations, microcopy or routing also need, in topic folders, never in a bucket.
governs:
  - "packages/engine/src/**/*.ts"
  - "packages/gpx/src/**/*.ts"
  - "apps/web/src/lib/**/*.ts"
  - "apps/web/src/components/**/*.ts"
  - "tools/workbench/scripts/**/*.ts"
  - "tools/workbench/site/src/lib/**/*.ts"
  - "tools/docs/banner/**/*.ts"
adopted_rules: [R1, R2, R4, R7, R8]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Helpers are filed by the runtimes that reach them

## 1. Context

This file carries rules R1, R2, R4, R7 and R8.

The workspace has no single catch-all `utils` package. It has three helper homes, and the one a helper sits in is a claim about which runtimes may reach it:

| Home | Runtime | May not use |
| :--- | :--- | :--- |
| `packages/engine/src`, `packages/gpx/src` | shared: app main thread, the app's Web Workers, Node tools | `node:*` built-ins, browser-only APIs |
| `apps/web/src/components/<feature>/` | browser: code only that feature uses: its helpers, hooks, snackbar map, `types.ts`; a shared UI group such as `components/charts/` is the owner of the UI-only helpers it renders with | `node:*` built-ins |
| `apps/web/src/lib/<topic>/` | browser: what the store, queries, mutations, microcopy or routing also need; main thread and the app's own Web Workers (`apps/web/src/lib/workers/gpsBuild.worker.ts`, `apps/web/src/lib/workers/personalBests.worker.ts`) | `node:*` built-ins |
| `tools/*` (`tools/workbench/scripts`, `tools/workbench/site/src/lib`, `tools/docs/banner`) | Node | — |

The directory is load-bearing rather than cosmetic: a Node-dependent helper filed under `apps/web/src/lib` type-checks and reviews cleanly, and only fails when the bundle breaks. The split makes that failure a placement question answerable at write time.

Scope: the three runtime homes, and inside `apps/web` the placement of every helper as well (R8): who needs a module decides whether it sits in a feature folder under `src/components/`, with a shared UI group, or in a `src/lib/` topic folder. How a module is cut into topics is `tdr/helpers-group-by-topic.md`. The shared packages additionally hold domain logic only (`tdr/engine-holds-domain-logic-only.md`), so "shared" is never a reason to move presentation or demo content into them.

Known edges, read and left as they are:

- The only Node consumer of app code is `tools/docs/banner/capture.ts`, and it reaches it only through the entry points in `apps/web/package.json` `exports` (`./demo/schedule`, `./store/layout`, `./e2e/openMeteo`). `./demo/schedule` is `apps/web/src/lib/demo/demoSchedule.ts`, so that one module is reached by both the browser and Node; by R1 it would belong in a shared package, but it is demo content, not domain logic, and the `exports` entry is the workspace's deliberate Node access path (`tools/docs/CLAUDE.md:9`). Whether demo content gets a shared home is the owner's call.
- `packages/gpx/src/parseGpx.ts:96` constructs a `DOMParser`, a window-only browser global, so GPX parsing is not reachable from Node or a Web Worker as written. R2 does not catch this (it checks Node built-ins only); it is the one module in the shared tree whose runtime claim the code does not back.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | File a central helper by the widest runtime that may execute it, not by who happens to call it first. Pure domain logic two runtimes may run goes in `packages/engine/src` or `packages/gpx/src`; a browser-only helper (IndexedDB, the DOM, `navigator`, the user's locale) in `apps/web` (R8 says where inside it); a helper touching Node built-ins, the file system, git or a child process in `tools/*`. | manual |
| R2 | A module under `packages/engine/src`, `packages/gpx/src` or `apps/web/src/lib` imports no Node built-in — not `node:*`, and not the bare aliases (`fs`, `fs/promises`, `path`, `crypto`, `buffer`, `stream`, `os`, `child_process`). Needing one is the signal that the module belongs in `tools/*`. | proposed |
| R4 | A central helper whose every consumer sits in one runtime belongs in that runtime's home. The shared packages are for domain logic more than one runtime actually reaches, not a default drawer for helpers with no obvious owner. | manual |
| R7 | Name a central helper module for the topic it computes. In `apps/web/src/lib/` every module sits in a topic folder named for its subject (today ten: `api/`, `storage/`, `analysis/`, `filtering/`, `colors/`, `format/`, `hooks/`, `debug/`, `workers/`, `demo/`), never at the `lib/` root; `packages/engine/src`, `packages/gpx/src` and the `tools/*` homes stay flat. No bucket: no `utils/`, `common/`, `misc/`, `shared/` or `helpers/` directory and no `misc.ts`, `helpers.ts`, `common.ts`, `utils.ts` or `index.ts` bucket module in any home. | manual |
| R8 | Inside `apps/web/src`, file code by who needs it. Code only one feature uses lives in that feature's folder `components/<feature>/`; a helper only UI uses (components and pages) lives with its component owner (`components/charts/`, `components/metricLabel/`, …), never in `lib/`; `lib/` holds only what `store/`, `queries/`, `mutations/`, `microcopy/` or `routing/` also need. Two `lib/` topic folders hold UI code by definition: `lib/hooks/` (generic React primitives about no domain concept, `tdr/hook-directory-placement.md` R2) and `lib/debug/` (the developer console and crash tooling). `store/`, `queries/`, `mutations/` and `microcopy/` never import `components/`. | proposed |

## 3. Detection

```yaml
R1:
  type: manual
  reason: >
    "Widest runtime that may execute it" is a statement about intended reach, not about the text of
    the module. A pure helper written for one consumer is legitimately placed in a shared package
    before a second runtime imports it, and no pattern distinguishes that from misfiling.
  enforcedBy: null
R2:
  type: grep
  pattern: "from\\s+['\"](node:[a-z/]+|fs|fs/promises|path|crypto|buffer|stream|stream/promises|stream/web|os|child_process|zlib|http|https|net|tls|worker_threads)['\"]"
  include: ["packages/engine/src/**/*.ts", "packages/gpx/src/**/*.ts", "apps/web/src/lib/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Flags crypto, buffer and stream/web imports the browser also provides as a global or Web
    equivalent, where the import could be swapped for the global without moving the module. Misses
    the same dependency reached transitively or through a dynamic import(), and misses browser-only
    globals in the shared packages (DOMParser, window, indexedDB), so a clean run does not prove
    the shared tree is runtime-neutral.
R4:
  type: manual
  reason: >
    Requires the consumer set of every shared-package module and the runtimes its importers live
    in (apps/web/src main thread, *.worker.ts, tools/*). That is a whole-graph fact, and a module
    with a single consumer today may be shared by design.
  enforcedBy: null
R7:
  type: glob
  pattern:
    - "apps/web/src/lib/*.{ts,tsx}"
    - "{apps/web/src/lib,packages/engine/src,packages/gpx/src,tools/workbench/scripts,tools/workbench/site/src/lib,tools/docs/banner}/**/{misc,helpers,common,utils,shared,index}{.ts,/**}"
  include: ["apps/web/src/lib/**", "packages/engine/src/**", "packages/gpx/src/**", "tools/workbench/scripts/**", "tools/workbench/site/src/lib/**", "tools/docs/banner/**"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Catches a module at the apps/web/src/lib root and the named bucket words as a module or a
    directory. A topic-sounding name that is actually a grab bag passes, file or folder alike;
    apps/web/src/lib/hooks/ is bucket-shaped and is governed by tdr/hook-directory-placement.md R2,
    apps/web/src/lib/debug/ is a topic directory.
R8:
  detections:
    - type: depcruise
      rule: state-no-components
      from: "^apps/web/src/(store|queries|mutations|microcopy)/"
      to: "^apps/web/src/components/"
      violationWhen: any-match
      enforcedBy: "state-no-components (tools/workbench/.dependency-cruiser.cjs) via tools/workbench/scripts/boundaries.ts in vp run check"
    - type: script
      include: ["apps/web/src/lib/**"]
      exempt: ["apps/web/src/lib/hooks/**", "apps/web/src/lib/debug/**"]
      violationWhen: every importer of a lib module sits in one components/<feature>/ folder
      enforcedBy: "tools/workbench/scripts/colocation.ts via tools/workbench/scripts/boundaries.ts in vp run check"
  reason: >
    Both gates read direct imports only. What stays manual: the UI-only half (a lib/ module that
    only components/ and pages/ of two or more owners import belongs with one component owner, and
    which owner is a judgement), modules reached only through another lib/ module, imports from
    lib/ into components/, and the contents of lib/hooks/ and lib/debug/.
```

## 4. Trade-offs

- **Good, because** a helper's path states its runtime contract, so "can a worker or a tool call this?" is answered by the import specifier without opening the file.
- **Good, because** it keeps Node built-ins out of the modules the bundler pulls in, where a stray import does the most damage.
- **Good, because** it replaces one undifferentiated `utils` bucket with three homes that each have an admission test, a far better filter than "does this look generic".
- **Good, because** a module's folder says who needs it: a feature folder is private to its feature, `lib/` is the state layers' dependency surface.
- **Bad, because** the boundary is invisible: nothing fails at write time, at review time or at type-check time. It fails later, in a bundle or at a tool's runtime, far from the file that caused it.
- **Bad, because** the widest-reach rule biases toward the shared packages, which then accumulate single-runtime helpers or helpers that quietly depend on one runtime's globals — exactly the edge the split was meant to prevent.
- **Bad, because** a helper moves the day a second consumer or a state layer starts to need it; the gates catch only the single-feature case and the import direction.
- **Neutral, because** moving a helper between homes is a path change plus an import update; the cost of getting placement wrong is a rename, not a rewrite, which is also why it is easy to defer.

## 5. Reference implementation

Shared: `packages/engine/src/gradient.ts` has no imports at all and is reached from the app (`apps/web/src/components/charts/sessionTerrain.ts:2`) and from the other shared package (`packages/gpx/src/routeGeometry.ts:3`) — `packages/engine/src/gradient.ts:1-6`:

```ts
export interface GradientPoint {
  distance?: number;
  elevation?: number | null;
}

export const GRADIENT_WINDOW_M = 50;
```

Browser: `apps/web/src/lib/storage/db.ts` needs IndexedDB, so it lives in the app's `lib/storage/` topic folder and is imported by the main thread, by the queries and mutations, and by the Web Workers (`apps/web/src/lib/workers/gpsBuild.worker.ts:1`), never by a tool — `apps/web/src/lib/storage/db.ts:77-81`:

```ts
export const getSessionRecords = async (sessionId: string): Promise<SessionRecord[]> => {
  const db = await getDB();
  const records = decodeRecords(await db.get('session-records', sessionId));
  return records;
};
```

Colocation (R8): the week-plan generator is needed by the labs feature alone, so it sits in that feature's folder, not in `lib/` — `apps/web/src/components/labs/prescription.ts:414` is imported only by `apps/web/src/components/labs/hooks/useCoachPlan.ts:7`:

```ts
import { generateFreshPlan } from '@/components/labs/prescription.ts';
```

Node: a Node built-in fixes the home — `tools/workbench/scripts/changedFiles.ts:1` and `tools/workbench/scripts/changedFiles.ts:76`:

```ts
import { spawnSync } from 'node:child_process';

export const gitChanges = ({
```

## 6. Forbidden practices

- ❌ A module under `packages/engine/src`, `packages/gpx/src` or `apps/web/src/lib` importing a Node built-in — including the bare `crypto` and `buffer` aliases, which read as harmless and are not. If the helper needs one, it is a tool helper.
- ❌ Treating the shared packages as the default landing place for a helper with no obvious home. A module belongs there once more than one runtime actually reaches it and it is domain logic; otherwise it is a single-runtime helper with a misleading path.
- ❌ A fourth bucket — a top-level `src/utils/`, or a `misc.ts`/`helpers.ts`/`common.ts` inside any of the three homes. Three reachability homes are the whole taxonomy; anything beyond them is a bucket by another name.
- ❌ A bucket directory (`apps/web/src/lib/utils/`, `lib/shared/`, `packages/engine/src/io/`). `lib/` subfolders are topic folders named for a subject; the packages and tools homes stay flat.
- ❌ A module in `apps/web/src/lib/` that only one feature imports, or only UI (outside the `lib/hooks/` and `lib/debug/` topic folders).
- ❌ An import of `components/` from `store/`, `queries/`, `mutations/` or `microcopy/`; what they need moves to `lib/<topic>/`.
