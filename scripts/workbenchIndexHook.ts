import { readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { z } from 'zod';
import { checkWorkbench } from '../workbench/site/src/check.ts';

/**
 * PostToolUse hook (matcher `Edit|Write`): after an edit of a `workbench/<feature>/plan.md`,
 * `workbench/<feature>/tech.md` or `workbench/ideas.md` it runs the `workbench:check` rules
 * (plans and mockup decisions) and returns every problem on stderr with exit 2, so Claude sees
 * them right after its edit. It writes nothing; the board (`vp run workbench`) reads the files.
 */

const hookInputSchema = z.object({
  tool_input: z.object({ file_path: z.string() }),
});

const FEATURE_FILE = /\/workbench\/[^/]+\/(?:plan|tech)\.md$/;
const IDEAS = /\/workbench\/ideas\.md$/;

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
  if (FEATURE_FILE.test(filePath)) root = dirname(dirname(filePath));
  else if (IDEAS.test(filePath)) root = dirname(filePath);
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
  console.error(`workbenchIndexHook crashed: ${String(error)}`);
  process.exit(1);
}
