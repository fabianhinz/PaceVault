import { readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { z } from 'zod';
import { checkWorkbench } from './check.ts';

/**
 * PostToolUse hook (matcher `Edit|Write`): after an edit of a
 * `tools/workbench/backlog/<item>/plan.md`, `…/<item>/tech.md` or `…/<item>/review/decisions.md` it
 * runs the `workbench:check` rules (plans, mockup decisions, the agent-decision format) and returns
 * every problem on stderr with exit 2, so Claude sees them right after its edit. It writes
 * nothing; the board (`vp run workbench`) reads the files.
 */

const hookInputSchema = z.object({
  tool_input: z.object({ file_path: z.string() }),
});

const ITEM_FILE = /\/tools\/workbench\/backlog\/[^/]+\/(?:plan|tech)\.md$/;
const DECISIONS_FILE = /\/tools\/workbench\/backlog\/[^/]+\/review\/decisions\.md$/;

const main = () => {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return;
  }
  const input = hookInputSchema.safeParse(raw);
  if (!input.success) return;
  const filePath = input.data.tool_input.file_path;
  let root: string | undefined = undefined;
  if (ITEM_FILE.test(filePath)) root = dirname(dirname(filePath));
  else if (DECISIONS_FILE.test(filePath)) root = dirname(dirname(dirname(filePath)));
  if (root === undefined) return;
  const errors = checkWorkbench(root);
  if (errors.length === 0) return;
  console.error(`workbench check after this edit:\n${errors.join('\n')}`);
  process.exit(2);
};

try {
  main();
} catch (error) {
  // Exit 1 is a non-blocking hook error: a crash here never blocks the edit.
  console.error(`indexHook crashed: ${String(error)}`);
  process.exit(1);
}
