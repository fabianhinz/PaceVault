---
id: cross-boundary-contracts-in-shared
tdr_reference: tdr/cross-boundary-contracts-in-shared.md
depends_on: [helpers-group-by-topic, signature-parameter-shape]
generated: 2026-10-23
---

# Main-thread and worker messages share one zod contract module

Read `tdr/cross-boundary-contracts-in-shared.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`helpers-group-by-topic`](helpers-group-by-topic.md) — splits `techActual.ts` out of the workbench board model; item 3 edits it.
- [`signature-parameter-shape`](signature-parameter-shape.md) — drops `toDepsGraph`'s doubled argument, so item 3 writes `focus: planned`.

## Changes

Today each worker module declares its message shapes as hand-written types (`apps/web/src/features/map/gpsBuild.worker.ts:4-6`, `apps/web/src/features/records/personalBests.worker.ts:5-15`) and the main-thread hook imports those types from the worker module itself. Each item below moves one worker's messages into a contract module beside the worker that both sides import. Run every item from the repo root; "clean `vp check`" means `vp run -F @pacevault/i18n compile && vp check` finishes with no error.

1. GPS build worker contract.
   Files: `apps/web/src/features/map/gpsBuildContract.ts` (new), `apps/web/src/features/map/gpsBuild.worker.ts`, `apps/web/src/features/map/hooks/useGpsBackfill.ts`
   Change: Create the contract module, importing only `zod`:

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

   (`workerMessageOutSchema` stays module-local because no module parses the `done` message; export it the moment one does.) In `gpsBuild.worker.ts` delete the two hand-written types, type the handler as `(e: MessageEvent<unknown>)`, parse with `const message = workerMessageInSchema.safeParse(e.data);` and `if (!message.success) return;`, then loop over `message.data.sessionIds`; the reply keeps `satisfies WorkerMessageOut`, imported from `./gpsBuildContract.ts`. In `useGpsBackfill.ts` replace `import type { WorkerMessageIn } from '@/features/map/gpsBuild.worker.ts';` with `import type { WorkerMessageIn } from '@/features/map/gpsBuildContract.ts';`.
   Check: `rg -n "^export (type|interface)" apps/web/src/features/map/gpsBuild.worker.ts` prints nothing; `rg -n "gpsBuild\.worker\.ts'" apps/web/src` prints nothing (the hook loads the worker by `new URL('../gpsBuild.worker.ts', import.meta.url)`, which is not an import); `rg -n "^import" apps/web/src/features/map/gpsBuildContract.ts` prints only the `zod` import; clean `vp check`; `vp run e2e` passes (tracks still draw after an import).

2. Personal-bests worker contract.
   Files: `apps/web/src/features/records/personalBestsContract.ts` (new), `apps/web/src/features/records/personalBests.worker.ts`, `apps/web/src/features/records/hooks/usePersonalBests.ts`
   Change: Create the contract module, importing only `zod` and layer-neutral engine values and types. Neither side parses these messages at runtime in this plan, so every schema stays module-local (R7) and only the inferred types are exported:

   ```ts
   import { z } from 'zod';
   import { SPORTS, type PersonalBest } from '@pacevault/engine/types.ts';

   const pbSessionMetaSchema = z.object({
     sessionId: z.string(),
     date: z.number(),
     sport: z.enum(SPORTS),
     distance: z.number().optional(),
     elevationGain: z.number().optional(),
   });

   export type PBSessionMeta = z.infer<typeof pbSessionMetaSchema>;

   const workerMessageInSchema = z.object({
     type: z.literal('compute'),
     sessions: z.array(pbSessionMetaSchema),
   });

   export type WorkerMessageIn = z.infer<typeof workerMessageInSchema>;

   const personalBestSchema = z.object({
     sport: z.enum(SPORTS),
     category: z.enum(['peak-power', 'fastest-distance', 'longest', 'most-elevation']),
     window: z.number(),
     value: z.number(),
     sessionId: z.string(),
     date: z.number(),
   }) satisfies z.ZodType<PersonalBest>;

   const workerMessageOutSchema = z.object({
     type: z.literal('done'),
     pbs: z.array(personalBestSchema),
   });

   export type WorkerMessageOut = z.infer<typeof workerMessageOutSchema>;
   ```

   The `satisfies z.ZodType<PersonalBest>` ties the schema to the engine's `PersonalBest` interface (`packages/engine/src/types.ts:110-117`) so the two cannot drift silently. In `personalBests.worker.ts` delete `PBSessionMeta`, `WorkerMessageIn`, `WorkerMessageOut` (lines 5-15) and import `WorkerMessageIn` and `WorkerMessageOut` as types from `./personalBestsContract.ts`; the handler keeps its `MessageEvent<WorkerMessageIn>` typing and its body unchanged. In `usePersonalBests.ts` import `PBSessionMeta`, `WorkerMessageIn` and `WorkerMessageOut` as types from `@/features/records/personalBestsContract.ts`; `worker.onmessage` keeps `MessageEvent<WorkerMessageOut>` and `resolve(e.data.pbs)` unchanged. Neither side parses the message at runtime (owner decision): the contract supplies the types only, so the query keeps resolving whatever the worker sends.
   Check: `rg -n "^export (type|interface)" apps/web/src/features/records/personalBests.worker.ts` prints nothing; `rg -n "personalBests\.worker\.ts'" apps/web/src` prints nothing; `rg -n "^import" apps/web/src/features/records/personalBestsContract.ts` prints only the `zod` and `@pacevault/engine/types.ts` imports; `rg -n "safeParse" apps/web/src/features/records` prints nothing; clean `vp check`; `vp run test` and `vp run e2e` pass (records card still lists personal bests after an import).

### tools/workbench

The workbench has the same kind of boundary in files: `vp run workbench:deps` (`scripts/deps.ts`, with `scripts/changedFiles.ts`) writes `review/deps.json` and `review/files.json`, and the board (`site/src/lib/techActual.ts`, split out of `board.ts` by the helpers-group-by-topic plan) parses them. Today the writer types them by hand (`changedFiles.ts:10-21`, `deps.ts:62-71`) and the reader restates them as schemas (`techActual.ts`, from `board.ts:109-123` and `:450-462`). The contract below is written with today's reader's required and optional fields, so every artefact that parses today parses the same way; the writer's extra keys (`item`, `command`, `roots`, `focus`) are declared optional, and the writer keeps building its objects in today's key order, so the files it writes stay byte-identical.

**Workbench check.** Save this script outside the repo (for example as `wb-probe.sh` in your scratch directory). Before the item run `bash <path>/wb-probe.sh <dir>/before`, after it `bash <path>/wb-probe.sh <dir>/after`; `diff -r <dir>/before <dir>/after` must print nothing. It feeds representative inputs to the three hooks and the CLI entry points and records each one's stdout, stderr and exit code; it writes nothing into the repo.

```bash
set -u
OUT="$1"
REPO="$(git rev-parse --show-toplevel)"
WB="$REPO/tools/workbench/scripts"
FIX="$(mktemp -d)/fix"
ITEM="$FIX/tools/workbench/backlog/demo"
mkdir -p "$ITEM/review" "$OUT"
printf -- '---\ntitle: Demo\nstatus: planned\ncreated: 2026-10-23\ntype: chore\nareas: [workbench]\nnext: Go\n---\n\n## Real-data checks\n\n- [ ] One\n\n## Open questions\n\n- **Q1** · open · Pick? (a) x (b) y\n' > "$ITEM/plan.md"
printf -- '## Agent decisions\n\n- [ ] **(scope) Keep it.** Agent: fits.\n' > "$ITEM/review/decisions.md"
P="$ITEM/plan.md"
D="$ITEM/review/decisions.md"
N="$FIX/tools/workbench/backlog/fresh/plan.md"
edit() { printf '{"tool_name":"Edit","tool_input":{"file_path":"%s","old_string":"%s","new_string":"%s"}}' "$1" "$2" "$3"; }
write() { printf '{"tool_name":"Write","tool_input":{"file_path":"%s","content":"%s"}}' "$1" "$2"; }
shell() { printf '{"tool_name":"Bash","tool_input":{"command":"%s"},"cwd":"%s"}' "$1" "$FIX"; }
run() {
  printf '%s' "$3" | (cd "$REPO" && WB_ROOT="$FIX/tools/workbench/backlog" node "$WB/$2" ${4:-}) >"$OUT/$1.out" 2>"$OUT/$1.err"
  echo $? >"$OUT/$1.code"
  perl -pi -e "s|\Q$FIX\E|FIX|g" "$OUT/$1.out" "$OUT/$1.err"
}
run sg-ready statusGuard.ts "$(edit "$P" 'status: planned' 'status: ready')"
run sg-skip statusGuard.ts "$(edit "$P" 'status: planned' 'status: in-dev')"
run sg-back statusGuard.ts "$(edit "$P" 'status: planned' 'status: idea')"
run sg-text statusGuard.ts "$(edit "$P" 'next: Go' 'next: Go on')"
run sg-tick statusGuard.ts "$(edit "$P" '- [ ] One' '- [x] One')"
run sg-size statusGuard.ts "$(edit "$P" 'next: Go' 'next: Go\nsize: small')"
run sg-new-idea statusGuard.ts "$(write "$N" '---\ntitle: F\nstatus: idea\ncreated: 2026-10-23\nnext: Go\n---\n')"
run sg-new-planned statusGuard.ts "$(write "$N" '---\ntitle: F\nstatus: planned\ncreated: 2026-10-23\nnext: Go\n---\n')"
run sg-dec-tick statusGuard.ts "$(edit "$D" '- [ ] **(scope)' '- [x] **(scope)')"
run sg-dec-kindless statusGuard.ts "$(edit "$D" 'Agent: fits.' 'Agent: fits.\n- [ ] **Other.** Agent: why.')"
run sg-dec-bare statusGuard.ts "$(edit "$D" '- [ ] **(scope) Keep it.** Agent: fits.' '- [~] **(scope) Keep it.** Agent: fits.')"
run sg-dec-pointer statusGuard.ts "$(edit "$D" '- [ ] **(scope) Keep it.** Agent: fits.' '- [~] **(scope) Keep it.** Agent: fits. Superseded by: Q2')"
run sg-sed statusGuard.ts "$(shell "sed -i '' s/Go/On/ tools/workbench/backlog/demo/plan.md")"
run sg-redirect statusGuard.ts "$(shell 'echo x > tools/workbench/backlog/demo/review/decisions.md')"
run sg-rm statusGuard.ts "$(shell 'rm -rf tools/workbench/backlog/demo')"
run sg-find statusGuard.ts "$(shell 'find tools/workbench/backlog -name x -delete')"
run sg-cd statusGuard.ts "$(shell 'cd tools/workbench/backlog/demo && rm plan.md')"
run sg-read statusGuard.ts "$(shell 'cat tools/workbench/backlog/demo/plan.md')"
run sg-other statusGuard.ts '{"tool_name":"Read","tool_input":{"file_path":"x"}}'
run sg-bad statusGuard.ts 'not json'
run wg-sub-commit workerGitGuard.ts '{"tool_name":"Bash","tool_input":{"command":"git commit -m x"},"agent_id":"a"}'
run wg-sub-reset workerGitGuard.ts '{"tool_name":"Bash","tool_input":{"command":"git -C . reset --hard"},"agent_type":"item-worker"}'
run wg-sub-status workerGitGuard.ts '{"tool_name":"Bash","tool_input":{"command":"git status"},"agent_id":"a"}'
run wg-owner-commit workerGitGuard.ts '{"tool_name":"Bash","tool_input":{"command":"git commit -m x"}}'
run wg-bad workerGitGuard.ts 'not json'
run ih-plan indexHook.ts "{\"tool_input\":{\"file_path\":\"$P\"}}"
run ih-decisions indexHook.ts "{\"tool_input\":{\"file_path\":\"$D\"}}"
run ih-other indexHook.ts '{"tool_input":{"file_path":"/tmp/x.md"}}'
run ih-bad indexHook.ts 'not json'
run check-cli check.ts ''
run deps-usage deps.ts ''
run deps-missing deps.ts '' zz-no-such-item
run interfaces-usage interfaces.ts ''
run interfaces-missing interfaces.ts '' zz-no-such-item
```

**Board check** (items that touch `site/`): with the board on `http://localhost:4321` (reuse a running board, `lsof -iTCP -sTCP:LISTEN -P | grep :4321`; start one with `vp run workbench` only when none runs, and stop it afterwards), before the item run `vp -C tools/workbench exec playwright screenshot --viewport-size=1512,860 --wait-for-timeout=3000 http://localhost:4321 <dir>/board-before.png`, after it the same into `<dir>/board-after.png`, and compare with `uv run --no-project --with pillow python -c "import sys;from PIL import Image,ImageChops;print(ImageChops.difference(Image.open(sys.argv[1]).convert('RGBA'),Image.open(sys.argv[2]).convert('RGBA')).getbbox())" <dir>/board-before.png <dir>/board-after.png`, which must print `None`. Then open an item with all four tabs, walk Mockup, Plan, Tech (Planned | Actual switch, Full screen) and Review, open Answer… on a question and close it, and confirm by eye that nothing looks or behaves differently.

**Suite**: `vp check` from `tools/workbench/` is clean, `vp run -F @pacevault/workbench check` passes (astro sync + astro check), and `vp test -- --run` from `tools/workbench/` passes 66 tests (13 spec files today; a later item that splits a spec changes the file count, never the test count).

3. (tools/workbench) One contract module for `deps.json` and `files.json` (R1, R2, R6, R7; owner decision).
   Files: new `tools/workbench/scripts/reviewArtifactsContract.ts`; `tools/workbench/scripts/changedFiles.ts`, `tools/workbench/scripts/deps.ts`, `tools/workbench/scripts/interfaces.ts`, `tools/workbench/site/src/lib/techActual.ts`
   Change: create the contract, importing only `zod`:

   ```ts
   import { z } from 'zod';

   const fileChangeSchema = z.object({
     path: z.string(),
     status: z.enum(['added', 'modified', 'deleted']),
   });

   export type FileChange = z.infer<typeof fileChangeSchema>;

   const filesComparisonSchema = z.object({
     planned: z.array(fileChangeSchema),
     notPlanned: z.array(fileChangeSchema),
     untouched: z.array(z.string()),
   });

   export type FilesComparison = z.infer<typeof filesComparisonSchema>;

   export const filesJsonSchema = filesComparisonSchema.extend({
     item: z.string().optional(),
     generated: z.string(),
     base: z.string(),
     ref: z.string(),
   });

   export type FilesJson = z.infer<typeof filesJsonSchema>;

   const boundarySchema = z.object({
     rules: z.array(z.string()),
     violations: z.array(z.object({ rule: z.string(), from: z.string(), to: z.string() })),
     modules: z.number(),
     dependencies: z.number(),
   });

   export type Boundary = z.infer<typeof boundarySchema>;

   export const depsJsonSchema = z.object({
     item: z.string().optional(),
     generated: z.string(),
     command: z.string().optional(),
     roots: z.array(z.string()).optional(),
     focus: z.array(z.string()).optional(),
     astro: z.array(z.string()).optional(),
     nodes: z.number(),
     edges: z.number(),
     added: z.array(z.string()),
     missing: z.array(z.string()),
     boundary: boundarySchema,
     components: z.object({ nodes: z.number(), edges: z.number() }).optional(),
   });

   export type DepsJson = z.infer<typeof depsJsonSchema>;
   ```

   - `changedFiles.ts` deletes its hand-written `FileStatus`, `FileChange` and `FilesComparison` (`:10-21`) and imports `FileChange` and `FilesComparison` from `./reviewArtifactsContract.ts`; `FILE_STATUS_BY_GIT_CODE` is typed `Map<string, FileChange['status']>`. `interfaces.ts` imports both types from the contract instead of from `./changedFiles.ts`.
   - `deps.ts` deletes `Violation` and `Boundary` (`:64-71`) and imports `Boundary` and `DepsJson`; `boundaryOf` returns `Boundary`; in `main` the two artefact objects are annotated, `const depsJson: DepsJson = { item, generated, command, roots, focus: planned, astro, nodes, edges, added, missing, boundary, components }` and `const filesJson: FilesJson = { item, generated, base, ref, ...files }`, keys in today's order. `DepsGraph`, `ComponentGraph` and `Cruise` describe in-memory values and depcruise's output, not the artefacts, and stay where they are.
   - `techActual.ts` deletes `depsSchema`, `fileChangeSchema` and `filesSchema` and parses with `depsJsonSchema` and `filesJsonSchema`; `Deps` becomes `{ mmd: string; json: DepsJson | undefined }`; the `rows` closure of `filesActualHtml` types its list as `FileChange[]` (`keyof typeof CHIP_BY_FILE_STATUS` stays the key type of the chip lookup).
   - The R6 import rule holds: the contract imports `zod` only, and the board imports it as `@scripts/reviewArtifactsContract.ts`.
   Check: `rg -n "z\.object" tools/workbench/site/src/lib/techActual.ts` prints nothing; `rg -n "^export type (FileChange|FilesComparison|FileStatus|Boundary|Violation)\b" tools/workbench/scripts --glob '!reviewArtifactsContract.ts'` prints nothing; `rg -n "^import" tools/workbench/scripts/reviewArtifactsContract.ts` prints only the `zod` import; workbench check; board check (open an item's Tech tab with `review/deps.json` and `review/files.json` and switch Modules and Files to Actual); suite (the `board.read` spec parses both artefacts).

## Open items

- R3–R5 of this convention (handler-side `400` responses, central route-parameter schemas, response `satisfies` on an HTTP handler) do not apply: there is no HTTP server in this app. Parsing the incoming message follows the project's general rule for untyped data (zod `safeParse` with a safe fallback) rather than R3/R5; item 1 parses in the GPS worker, where a message that fails the parse cannot come from the typed caller. The personal-bests worker and its hook do not parse at runtime (owner decision, types only): a reply that failed a parse would cache `[]` for the session, and an incoming message that failed it would leave the query loading forever.
- If the zod-schema-naming-and-inference plan settles a different name for worker message schemas, rename `workerMessageInSchema`/`workerMessageOutSchema` together with their types; the shape stays.
- `tools/workbench`: `deps.json` and `files.json` keep their bytes; only the types move. The board's parsed value now also carries the writer's `item`, `command`, `roots` and `focus`, which the Tech tab does not read.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
