---
kind: pattern-apply-tdr-reference
id: helpers-split-by-reachability
title: Helpers are filed by the runtimes that reach them
summary: A helper lives in the widest runtime directory that actually runs it — packages/engine and packages/gpx for pure code shared across runtimes, apps/web/src/lib for the browser, tools/* for Node — with no Node built-in in the shared or browser trees and no bucket module in any of them.
governs:
  - "packages/engine/src/**/*.ts"
  - "packages/gpx/src/**/*.ts"
  - "apps/web/src/lib/**/*.ts"
  - "tools/workbench/scripts/**/*.ts"
  - "tools/workbench/site/src/lib/**/*.ts"
  - "tools/docs/banner/**/*.ts"
adopted_rules: [R1, R2, R4, R7]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Helpers are filed by the runtimes that reach them

## 1. Context

This file carries rules R1, R2, R4 and R7.

The workspace has no single catch-all `utils` package. It has three helper homes, and the one a helper sits in is a claim about which runtimes may reach it:

| Home | Runtime | May not use |
| :--- | :--- | :--- |
| `packages/engine/src`, `packages/gpx/src` | shared: app main thread, the app's Web Workers, Node tools | `node:*` built-ins, browser-only APIs |
| `apps/web/src/lib` | browser: main thread and the app's own Web Workers (`apps/web/src/features/map/gpsBuild.worker.ts`, `apps/web/src/features/records/personalBests.worker.ts`) | `node:*` built-ins |
| `tools/*` (`tools/workbench/scripts`, `tools/workbench/site/src/lib`, `tools/docs/banner`) | Node | — |

The directory is load-bearing rather than cosmetic: a Node-dependent helper filed under `apps/web/src/lib` type-checks and reviews cleanly, and only fails when the bundle breaks. The split makes that failure a placement question answerable at write time.

Scope: the three homes only. Most helpers sit feature-locally beside the code that uses them, in topic-named modules (`tdr/helpers-group-by-topic.md`); this convention governs where a helper goes once it is central. The shared packages additionally hold domain logic only (`tdr/engine-holds-domain-logic-only.md`), so "shared" is never a reason to move presentation or demo content into them.

Known edges, read and left as they are:

- The only Node consumer of app code is `tools/docs/banner/capture.ts`, and it reaches it only through the entry points in `apps/web/package.json` `exports` (`./demo/schedule`, `./store/layout`, `./e2e/openMeteo`), none under `apps/web/src/lib`. `apps/web/src/features/demo/demoSchedule.ts` is reached by both the browser and Node; by R1 it would belong in a shared package, but it is demo content, not domain logic, and the `exports` entry is the workspace's deliberate Node access path (`tools/docs/CLAUDE.md:9`). Whether demo content gets a shared home is the owner's call.
- `packages/gpx/src/parseGpx.ts:85` constructs a `DOMParser`, a window-only browser global, so GPX parsing is not reachable from Node or a Web Worker as written. R2 does not catch this (it checks Node built-ins only); it is the one module in the shared tree whose runtime claim the code does not back.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | File a central helper by the widest runtime that may execute it, not by who happens to call it first. Pure domain logic two runtimes may run goes in `packages/engine/src` or `packages/gpx/src`; a browser-only helper (IndexedDB, the DOM, `navigator`, the user's locale) in `apps/web/src/lib`; a helper touching Node built-ins, the file system, git or a child process in `tools/*`. | manual |
| R2 | A module under `packages/engine/src`, `packages/gpx/src` or `apps/web/src/lib` imports no Node built-in — not `node:*`, and not the bare aliases (`fs`, `fs/promises`, `path`, `crypto`, `buffer`, `stream`, `os`, `child_process`). Needing one is the signal that the module belongs in `tools/*`. | proposed |
| R4 | A central helper whose every consumer sits in one runtime belongs in that runtime's home. The shared packages are for domain logic more than one runtime actually reaches, not a default drawer for helpers with no obvious owner. | manual |
| R7 | Name a central helper module for the topic it computes. Do not add `misc.ts`, `helpers.ts`, `common.ts`, `utils.ts` or an `index.ts` bucket, or a nested sub-bucket directory, inside any of the three homes. | manual |

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
  pattern: "{apps/web/src/lib,packages/engine/src,packages/gpx/src,tools/workbench/scripts,tools/workbench/site/src/lib,tools/docs/banner}/**/{misc,helpers,common,utils,index}.ts"
  include: ["apps/web/src/lib/**", "packages/engine/src/**", "packages/gpx/src/**", "tools/workbench/scripts/**", "tools/workbench/site/src/lib/**", "tools/docs/banner/**"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Catches only the named bucket words. A topic-sounding name that is actually a grab bag passes,
    and so does a sub-bucket directory; apps/web/src/lib/hooks/ is bucket-shaped and is governed by
    tdr/hook-directory-placement.md, apps/web/src/lib/debug/ is a topic directory.
```

## 4. Trade-offs

- **Good, because** a helper's path states its runtime contract, so "can a worker or a tool call this?" is answered by the import specifier without opening the file.
- **Good, because** it keeps Node built-ins out of the modules the bundler pulls in, where a stray import does the most damage.
- **Good, because** it replaces one undifferentiated `utils` bucket with three homes that each have an admission test, a far better filter than "does this look generic".
- **Bad, because** the boundary is invisible: nothing fails at write time, at review time or at type-check time. It fails later, in a bundle or at a tool's runtime, far from the file that caused it.
- **Bad, because** the widest-reach rule biases toward the shared packages, which then accumulate single-runtime helpers or helpers that quietly depend on one runtime's globals — exactly the edge the split was meant to prevent.
- **Neutral, because** moving a helper between homes is a path change plus an import update; the cost of getting placement wrong is a rename, not a rewrite, which is also why it is easy to defer.

## 5. Reference implementation

Shared: `packages/engine/src/gradient.ts` has no imports at all and is reached from the app (`apps/web/src/lib/sessionTerrain.ts:2`) and from the other shared package (`packages/gpx/src/routeGeometry.ts:3`) — `packages/engine/src/gradient.ts:1-6`:

```ts
export interface GradientPoint {
  distance?: number;
  elevation?: number | null;
}

export const GRADIENT_WINDOW_M = 50;
```

Browser: `apps/web/src/lib/indexeddb.ts` needs IndexedDB, so it lives in the app's lib and is imported by the main thread and by the Web Workers (`apps/web/src/features/map/gpsBuild.worker.ts:1`), never by a tool — `apps/web/src/lib/indexeddb.ts:4-7`:

```ts
import { getDB, type EnduranceTrackerDB } from './db.ts';
import { decodeRecords, encodeRecords } from './recordCodec.ts';

export const getSessionRecords = async (sessionId: string): Promise<SessionRecord[]> => {
```

Node: a Node built-in fixes the home — `tools/workbench/scripts/changedFiles.ts:1` and `tools/workbench/scripts/changedFiles.ts:96`:

```ts
import { spawnSync } from 'node:child_process';

export const gitChanges = (root: string, override: string | undefined): GitChanges | undefined => {
```

## 6. Forbidden practices

- ❌ A module under `packages/engine/src`, `packages/gpx/src` or `apps/web/src/lib` importing a Node built-in — including the bare `crypto` and `buffer` aliases, which read as harmless and are not. If the helper needs one, it is a tool helper.
- ❌ Treating the shared packages as the default landing place for a helper with no obvious home. A module belongs there once more than one runtime actually reaches it and it is domain logic; otherwise it is a single-runtime helper with a misleading path.
- ❌ A fourth bucket — a top-level `src/utils/`, or a `misc.ts`/`helpers.ts`/`common.ts` inside any of the three homes. Three reachability homes are the whole taxonomy; anything beyond them is a bucket by another name.
- ❌ Nesting sub-buckets (`apps/web/src/lib/string/`, `packages/engine/src/io/`). Central helper directories stay flat and topic-named; growth is a signal the helper should be feature-local instead.
