---
kind: pattern-apply-tdr-reference
id: cross-boundary-contracts-in-shared
title: Main-thread and worker messages share one zod contract module
summary: A message shape that crosses between the main thread and a Web Worker is declared once as a zod schema in a contract module beside the worker, its types derived with z.infer, and both sides import that module.
governs:
  - "apps/web/src/**/*.worker.ts"
  - "apps/web/src/**/*Contract.ts"
  - "tools/workbench/scripts/**/*Contract.ts"
  - "tools/workbench/site/src/lib/**/*.ts"
adopted_rules: [R1, R2, R6, R7]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Main-thread and worker messages share one zod contract module

## 1. Context

This file carries rules R1, R2, R6 and R7.

`apps/web` has no server, but it has a boundary with the same failure mode: `postMessage` between the main thread and a Web Worker (`apps/web/src/lib/workers/gpsBuild.worker.ts`, `apps/web/src/lib/workers/personalBests.worker.ts`). The hook that starts the worker writes a message the worker reads, and the worker writes a reply the hook reads. When each side declares its own shape — or one side imports the other side's module for a type — they drift silently or couple a worker bundle to main-thread code. This convention puts every shape that crosses that boundary in one contract module, `<worker>Contract.ts` beside the worker, as a zod schema; both the worker and the hook import that module. Naming follows zod-schema-naming-and-inference (the type is the schema name minus `Schema`). Parsing incoming data follows the project's general rule: `safeParse`, safe fallback on failure, never throw.

The same failure mode exists in `tools/workbench` across files: `scripts/deps.ts` writes `review/deps.json` and `review/files.json`, and the board (`site/src/lib/techActual.ts`) parses them. Their shapes are declared once in `tools/workbench/scripts/reviewArtifactsContract.ts` (R1), types via `z.infer` (R2), importing only `zod` (R6), with the reader's required and optional fields, so every existing artefact parses as before.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | When a message shape is written by one side of the main-thread/worker boundary and read by the other, declare it exactly once as a zod schema in `<worker>Contract.ts` beside the worker, and have both the worker and its main-thread caller import that module. Neither side imports the other side's module for a type. | manual |
| R2 | Derive the TypeScript type from the schema with `z.infer` and export it from the same module. Never hand-write an interface or type alias that restates a schema's shape; where a schema mirrors an engine type, tie the two with `satisfies z.ZodType<EngineType>`. | manual |
| R6 | A contract module imports only `zod` and layer-neutral packages (`@pacevault/engine`, `@pacevault/gpx`). It never imports from `apps/web/src` (`@/…`) — a module both sides depend on cannot depend on either side's code. | manual |
| R7 | Keep a schema module-local while only one side uses it at runtime; export it the moment a second side parses with it, rather than duplicating it. | manual |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "from '[^']*\\.worker\\.ts'"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "tools/workbench/scripts/**/*Contract.ts", "tools/workbench/site/src/lib/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    None known; a worker is started with `new Worker(new URL('…worker.ts', import.meta.url))`,
    which this pattern does not match.
R2:
  type: grep
  pattern: "^export (type|interface) [A-Za-z]+(?! = z\\.infer)"
  include: ["apps/web/src/**/*.worker.ts", "apps/web/src/**/*Contract.ts", "tools/workbench/scripts/**/*Contract.ts", "tools/workbench/site/src/lib/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "A multi-line type declaration whose z.infer sits on the following line."
R6:
  type: grep
  pattern: "from '@/"
  include: ["apps/web/src/**/*Contract.ts", "tools/workbench/scripts/**/*Contract.ts", "tools/workbench/site/src/lib/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "None known — a type-only import from the app is still an app dependency for this rule."
R7:
  type: manual
  reason: >
    Detecting the moment a second side starts to parse needs the call graph; a lint for unused
    exports flags the opposite mistake (an exported schema nobody parses).
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** the message format and both sides' static types have one source; a field rename is a compile error on the side that did not follow, instead of a silent shape mismatch inside a worker.
- **Good, because** the runtime guard and the compile-time type are the same artifact, so a message that type-checks is a message that parses.
- **Bad, because** a shared schema couples both sides: any change is simultaneously breaking for the worker and its caller. Within one bundle that costs nothing at release time, but a stale cached worker script after a deploy will fail the parse and fall back.
- **Bad, because** a contract module per worker adds a file and a zod dependency to each worker bundle, and a careless import there can pull main-thread code into a worker.
- **Neutral, because** parsing on the receiving side costs a validation pass per message and turns a tolerable extra field into a fallback — acceptable for in-app messages, which are small and rare.

## 5. Reference implementation

The contract module — schemas and inferred types, nothing else:

```ts
import { z } from 'zod';

export const workerMessageInSchema = z.object({
  type: z.literal('build'),
  sessionIds: z.array(z.string()),
});

export type WorkerMessageIn = z.infer<typeof workerMessageInSchema>;

const workerMessageOutSchema = z.object({ type: z.literal('done') });

export type WorkerMessageOut = z.infer<typeof workerMessageOutSchema>;
```

The worker parses what it receives and asserts what it sends:

```ts
import { workerMessageInSchema, type WorkerMessageOut } from './gpsBuildContract.ts';

self.onmessage = async (e: MessageEvent<unknown>) => {
  const message = workerMessageInSchema.safeParse(e.data);
  if (!message.success) return;
  for (const sessionId of message.data.sessionIds) {
    await buildAndSave(sessionId);
  }
  self.postMessage({ type: 'done' } satisfies WorkerMessageOut);
};
```

The caller imports the same module to build the request:

```ts
import type { WorkerMessageIn } from '@/lib/workers/gpsBuildContract.ts';

worker.postMessage({ type: 'build', sessionIds } satisfies WorkerMessageIn);
```

## 6. Forbidden practices

- ❌ A hand-written `type`/`interface` in the worker or the hook that restates a schema already declared in a contract module — the second declaration is what drifts, and nothing links the two.
- ❌ Declaring a message shape as a plain TypeScript type with no schema when the other side reads it at runtime — a type gives the receiver no way to verify what actually arrived.
- ❌ The hook importing types from the `*.worker.ts` module, or the worker importing from the hook — each side depends on the contract, never on the other side.
- ❌ A contract module importing from `@/…` (for a constant, a union or even a type). Lift the shared value into the contract module or a layer-neutral package instead.
- ❌ Copying a schema into a second module so each side owns "its" version. If both sides need it, one of the copies must be deleted.
