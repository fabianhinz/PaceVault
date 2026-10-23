---
id: zod-schema-naming-and-inference
tdr_reference: tdr/zod-schema-naming-and-inference.md
generated: 2026-10-23
---

# Schemas named with a Schema suffix, types inferred from them

Read `tdr/zod-schema-naming-and-inference.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

Every item's Check includes `vp run check` clean and `vp run test` green.

1. Give the leaf helper schemas the `Schema` suffix (R1).
   Files: `apps/web/src/parsers/fitSchemas.ts:3,4,7,16,22-31,40-49`, `apps/web/src/lib/recordCodec.ts:6` and its uses in the same file, `apps/web/src/lib/intervals.ts:11,15-19`, `apps/web/tests/parsers/fitSchemas.spec.ts:3,173-207`.
   Change: `const optNum = z.number().optional()` → `const optNumSchema = …` (both modules); `const dateTime = z.union([z.string(), z.date()])` → `const dateTimeSchema = …`; `export const enumStr = z.union(…)…` → `export const enumStrSchema = …` (the test's `describe('enumStr', …)` and `describe('fitLapSchema enumStr fields', …)` titles follow the new names); `const optStr = z.string().nullish()` → `const optStrSchema = …`. Every field that referenced the old name references the new one.
   Check: `rg -nP '^\s*(?:export\s+)?(?:const|let)\s+(?!\w*Schema\b)\w+\s*(?::[^=]*)?=\s*z\b' apps/web/src` → nothing (this also catches the `= z` + line-break form of `enumStr`).

2. Rename the schemas whose derived type already has another name, so the type is the schema name minus `Schema` (R4).
   Files: `apps/web/src/parsers/fitSchemas.ts:20,35,37,39,52,54`, `apps/web/src/lib/intervals.ts:13,22,24,102`, `apps/web/tests/parsers/fitSchemas.spec.ts:4,6,17-63,97-140,198-206`.
   Change: `fitRecordSchema` → `fitRecordInputSchema` (type `FitRecordInput` unchanged), `fitLapSchema` → `fitLapInputSchema` (type `FitLapInput` unchanged), `activitySchema` → `intervalsActivitySchema` (type `IntervalsActivity` unchanged); `fitRecordsSchema = z.array(fitRecordInputSchema)`, `fitLapsSchema = z.array(fitLapInputSchema)`; `ACTIVITY_FIELDS = Object.keys(intervalsActivitySchema.shape)`. Test `describe` titles follow the schema names.
   Check: for every `type X = z.infer<typeof ySchema>` in `apps/web/src`, `y` with its first letter upper-cased equals `X` — `rg -nP 'type (\w+) = z\.(?:infer|input|output)<typeof (\w+)Schema>' apps/web/src -or '$1 $2'` prints pairs that match case-insensitively on the first letter only.

3. Derive the FIT file-id type from its schema instead of restating it (R3).
   Files: `apps/web/src/parsers/fitSchemas.ts:15-18`, `apps/web/src/lib/fingerprint.ts:7-10,24`.
   Change: `fitFileIdSchema` uses `time_created: dateTimeSchema` and is followed by `export type FitFileId = z.infer<typeof fitFileIdSchema>;`. Delete the hand-written `interface FitFileId { serial_number?: number; time_created: string | Date; }` in `fingerprint.ts` and `import type { FitFileId } from '@/parsers/fitSchemas.ts';`.
   Check: `rg -n "interface FitFileId" apps/web/src` → nothing; `apps/web/tests/lib/fingerprint.spec.ts` passes unchanged.

### packages/gpx

4. (packages/gpx) Derive `ParsedGpxPoint` from the point schema (R1, R3, R4).
   Files: `packages/gpx/src/parseGpx.ts`
   Change: delete the hand-written `export interface ParsedGpxPoint { lat; lng; ele?; time?; seg }` (`:3-9`); `const pointSchema = z.object({ lat: …, lng: …, ele: …, time: … })` (`:16-21`) becomes

   ```ts
   const parsedGpxPointSchema = z.object({
     lat: z.number().min(-90).max(90),
     lng: z.number().min(-180).max(180),
     ele: z.number().optional(),
     time: z.number().optional(),
     seg: z.number(),
   });

   export type ParsedGpxPoint = z.infer<typeof parsedGpxPointSchema>;
   ```

   and `parsePoint` (`:47-56`) passes `seg` into `parsedGpxPointSchema.safeParse({ lat: …, lng: …, ele: …, time: …, seg })` and returns `result.data` instead of `{ ...result.data, seg }` — the same keys in the same order, `seg` last, and the same values (a segment index always passes `z.number()`). Importers of `ParsedGpxPoint` keep their import path.
   Check: `rg -n "interface ParsedGpxPoint|pointSchema\b" packages/gpx/src` prints nothing; `vp run check` clean; `vp run test` green (`parseGpx.spec.ts` passes unchanged).

5. (tools/docs) Bind the message catalogue schema and record the fail-fast exemption (R1, R2).
   Files: `tools/docs/banner/capture.ts`, `tools/docs/CLAUDE.md`
   Change: the capture validates the locale's message file with an unbound schema, `z.record(z.string(), z.unknown()).parse(JSON.parse(…))` (`capture.ts:21-25`). Bind it above `messages` as `const messagesSchema = z.record(z.string(), z.unknown());` and write `const messages = messagesSchema.parse(JSON.parse(readFileSync(…, 'utf8')));` with the same `readFileSync` argument. `.parse` stays (owner decision): a capture against a broken catalogue must stop instead of rendering a banner with missing text, so the tool deliberately departs from root `CLAUDE.md` §2's "`safeParse`, safe fallback, never throw". No type is derived (R3, R7: nothing reads the shape by name). Record the exemption in `tools/docs/CLAUDE.md`, after the **Copy** bullet (`:12`, below any bullet another convention plan already added there):

   ```md
   - **Fail fast**: The capture validates the message catalogue with zod `.parse` and throws on bad input, as the locale reader in `banner/env.ts` throws on an unknown locale: a broken capture must stop, not write a wrong banner. This replaces the root rule's `safeParse` with a fallback (`CLAUDE.md` §2) for this package only.
   ```

   Where an earlier plan moved the catalogue read into `banner/messages.ts`, bind the schema there.
   Check: `rg -n "z\.record\(" tools/docs/banner` prints only the `messagesSchema` declaration; `rg -n "\*\*Fail fast\*\*" tools/docs/CLAUDE.md` prints one line; `vp check` from `tools/docs/` is clean; `vp run docs:banner --locale de` writes `docs/banners/de_banner.png` without error.

### tools/workbench

Line numbers are today's. The schemas of `deps.json` and `files.json` (`site/src/lib/board.ts:109-123`, `:450-462`) move into one contract module under the cross-boundary-contracts-in-shared plan, which names them there; this plan leaves them alone.

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

6. (tools/workbench) Give every workbench schema binding the `Schema` suffix and import zod from one place (R1, R2).
   Files: `tools/workbench/site/src/actions/index.ts`, `tools/workbench/site/src/lib/board.ts`, `tools/workbench/scripts/indexHook.ts`, `tools/workbench/scripts/workerGitGuard.ts`
   Change:
   - `actions/index.ts`: `FOLDER` (`:50`) → `folderSchema`; the factory `words` (`:133`) → `requiredTextSchema`; `optional` (`:139`) → `optionalTextSchema`; `rendered` (`:158`) → `renderedLinesSchema`; `itemInput` (`:162`) → `itemInputSchema`; `expected` (`:163`) → `expectedLinesInputSchema`; every use inside the `defineAction` inputs follows. The values, messages and transforms stay as they are.
   - `indexHook.ts:14` `hookInputSchema` (a different shape from `statusGuard.ts`'s schema of the same name) → `editedFileInputSchema`; `workerGitGuard.ts:7` `inputSchema` → `bashHookInputSchema`.
   - `actions/index.ts:5` and `board.ts:3` `import { z } from 'astro/zod';` → `import { z } from 'zod';`, as every script already imports it. `astro/zod` re-exports `zod/v4` of the same `zod@4.6.7` install that `tools/workbench/package.json` declares, so the schemas are the same objects.
   Check: `test "$(cd tools/workbench && node -p "require.resolve('zod/package.json')")" = "$(cd tools/workbench/node_modules/astro && node -p "require.resolve('zod/package.json')")"` succeeds (run it before the item; if it fails, keep `astro/zod` and report); `rg -n "astro/zod|\bFOLDER\b|const (words|optional|rendered|itemInput|expected|inputSchema|hookInputSchema) =" tools/workbench/site tools/workbench/scripts/indexHook.ts tools/workbench/scripts/workerGitGuard.ts` prints nothing; workbench check; suite (the action specs drive every form input).

## Open items

- `tools/docs`: the locale flag is checked with the `isBannerLocale` type guard (`tools/docs/banner/env.ts:9`, `tools/docs/banner/run.ts:16`), not with a schema; there is no zod binding to name there, and turning the guard into a `z.enum` would change the error path (`process.exit(1)` with the usage line in `run.ts`), so it stays.

- R5 (`z.input` only when the consumer holds the pre-parse shape) and R7 (export a derived type only when another module needs it): every derived type in `apps/web/src` today uses `z.infer` on a schema whose consumers hold the parsed value, and each exported one (`FitRecordInput`, `FitLapInput`, `IntervalsActivity`, `DemoRoutesJson`) is imported elsewhere; nothing to change.
- `packages/engine` and `packages/ui` declare no zod schemas today. `packages/gpx` declares one, the point schema of `parseGpx.ts`, which item 4 brings under R1, R3 and R4.
- `tools/workbench`: `statusGuard.ts`'s `editSchema`, `writeSchema`, `bashSchema`, `hookInputSchema` and `deps.ts`'s `moduleSchema`, `cruiseSchema` already follow R1 and R2.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
