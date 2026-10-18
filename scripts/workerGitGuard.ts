// PreToolUse hook (Bash): subagents never run git writes. Applies only when the hook input
// carries an agent_id or agent_type (a subagent call); the owner's own session is untouched.
// Exit 2 blocks the call and sends stderr back to Claude; a crash exits 1 (fails open).
import { readFileSync } from 'node:fs';
import { z } from 'zod';

const inputSchema = z.object({
  tool_name: z.string(),
  tool_input: z.object({ command: z.string().optional() }).passthrough(),
  agent_id: z.string().optional(),
  agent_type: z.string().optional(),
});

const GLOBAL_FLAG = String.raw`(?:-[cC]\s+\S+|--(?:git-dir|work-tree|namespace|exec-path|config-env)\s+\S+|-{1,2}[a-zA-Z][\w-]*(?:=\S+)?)`;
const GIT_WRITE = new RegExp(
  String.raw`(?:^|[\s(])git(?:\s+${GLOBAL_FLAG})*\s+(?:(?:commit|reset|checkout|restore|stash|worktree|clean|switch)\b|branch\b.*\s(?:-[a-zA-Z]*[fdD]\b|--force\b|--delete\b))`,
);

export const MESSAGE =
  'feature-worker: git commit, reset, checkout, restore, stash, worktree, clean, switch and branch -f/-d/-D are owner-only. Leave all changes in the working tree.';

export const isGitWrite = (command: string): boolean =>
  command.split(/&&|\|\||[;|\n]/).some((segment) => GIT_WRITE.test(segment));

export const decideWorker = (input: unknown): string | undefined => {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return undefined;
  const isSubagent = parsed.data.agent_id !== undefined || parsed.data.agent_type !== undefined;
  if (!isSubagent || parsed.data.tool_name !== 'Bash') return undefined;
  if (isGitWrite(parsed.data.tool_input.command ?? '')) return MESSAGE;
  return undefined;
};

const main = () => {
  let input: unknown = undefined;
  try {
    input = JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return;
  }
  const reason = decideWorker(input);
  if (reason === undefined) return;
  process.stderr.write(reason);
  process.exit(2);
};

if (process.argv[1]?.endsWith('workerGitGuard.ts')) main();
