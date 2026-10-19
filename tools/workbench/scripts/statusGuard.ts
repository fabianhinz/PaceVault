import { existsSync, readFileSync } from 'node:fs';
import { posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { DECISIONS, PLAN_CHECKS, STATUSES, readChecks, readStatus } from './frontmatter.ts';

/**
 * PreToolUse hook (matcher `Edit|Write|Bash`): keeps agents inside the workbench status gates.
 * - `status:` in `tools/workbench/backlog/<f>/plan.md` moves only forward to exploring | planned | in-dev |
 *   in-review without skipping an owner-only status, or back in-review → in-dev and
 *   ready | in-dev | in-review → planned. From `ready` the only forward move is in-dev.
 *   `ready` and `done` are owner-only.
 * - Under `## Real-data checks` (plan.md) and `## Agent decisions` (`<f>/review/decisions.md`)
 *   the ticked count may not rise and the item count may not drop (ticking is owner-only; open
 *   items may be added or reworded; an agent may create decisions.md with open items).
 * - A new plan starts at `status: idea`.
 * - Bash: a heuristic, per command segment with `cd` tracking, against in-place writes to a
 *   plan.md or review/decisions.md and deleting an item folder.
 * Exit 2 blocks the call (stderr goes back to Claude); a crash exits 1, which never blocks.
 */

export const hookInputSchema = z.object({
  tool_name: z.string(),
  tool_input: z.record(z.string(), z.unknown()),
  cwd: z.string().optional(),
});

export type HookInput = z.infer<typeof hookInputSchema>;

const editSchema = z.object({
  file_path: z.string(),
  old_string: z.string(),
  new_string: z.string(),
  replace_all: z.boolean().optional(),
});
const writeSchema = z.object({ file_path: z.string(), content: z.string() });
const bashSchema = z.object({ command: z.string() });

const PLAN_FILE = /\/tools\/workbench\/backlog\/([^/_.][^/]*)\/plan\.md$/;
const DECISIONS_FILE = /\/tools\/workbench\/backlog\/([^/_.][^/]*)\/review\/decisions\.md$/;

/** The files whose checklists only the owner ticks: protected against Bash writes too. */
const isProtected = (path: string) => PLAN_FILE.test(path) || DECISIONS_FILE.test(path);

const AGENT_TARGETS: string[] = ['exploring', 'planned', 'in-dev', 'in-review'];
const OWNER_ONLY: string[] = ['ready', 'done'];
const BACK_MOVES = ['in-review>in-dev', 'ready>planned', 'in-dev>planned', 'in-review>planned'];

const STATUS_ORDER: string[] = [...STATUSES];

const isAllowedMove = (from: string | undefined, to: string | undefined): boolean => {
  if (from === to) return true;
  // A plan without a status (not yet on the board) may enter at `idea`, as a new plan does.
  if (from === undefined) return to === 'idea';
  if (to === undefined) return false;
  if (BACK_MOVES.includes(`${from}>${to}`)) return true;
  // `ready` is the owner's "lets dev" gate: the work starts at in-dev, never further on.
  if (from === 'ready') return to === 'in-dev';
  if (!AGENT_TARGETS.includes(to)) return false;
  const fromIndex = STATUS_ORDER.indexOf(from);
  const toIndex = STATUS_ORDER.indexOf(to);
  if (fromIndex === -1 || toIndex <= fromIndex) return false;
  return !STATUS_ORDER.slice(fromIndex + 1, toIndex).some((status) => OWNER_ONLY.includes(status));
};

const applyEdit = (current: string, edit: z.infer<typeof editSchema>): string | undefined => {
  if (edit.replace_all) return current.split(edit.old_string).join(edit.new_string);
  const index = current.indexOf(edit.old_string);
  if (index === -1) return undefined;
  return current.slice(0, index) + edit.new_string + current.slice(index + edit.old_string.length);
};

const decidePlan = (
  folder: string,
  before: string | undefined,
  after: string,
): string | undefined => {
  const path = `tools/workbench/backlog/${folder}/plan.md`;
  const to = readStatus(after);
  if (before === undefined) {
    if (to === 'idea') return undefined;
    return `A new plan starts at status: idea, not ${to ?? '(none)'} (${path}). Ask the owner.`;
  }
  const from = readStatus(before);
  if (!isAllowedMove(from, to)) {
    return `status: ${from ?? '(none)'} → ${to ?? '(none)'} is owner-only or skips a gate (${path}). Ask the owner.`;
  }
  return decideChecks(path, PLAN_CHECKS, before, after);
};

/** Ticked count may not rise, item count may not drop; `before` undefined is a new file. */
const decideChecks = (
  path: string,
  heading: typeof PLAN_CHECKS | typeof DECISIONS,
  before: string | undefined,
  after: string,
): string | undefined => {
  let beforeItems: ReturnType<typeof readChecks> = [];
  if (before !== undefined) beforeItems = readChecks(before, heading);
  const afterItems = readChecks(after, heading);
  const tickedBefore = beforeItems.filter((item) => item.checked).length;
  const tickedAfter = afterItems.filter((item) => item.checked).length;
  if (tickedAfter > tickedBefore) {
    return `${heading} are ticked by the owner only (${path}).`;
  }
  if (afterItems.length < beforeItems.length) {
    return `Items under ## ${heading} are removed by the owner only (${path}).`;
  }
  return undefined;
};

const decideDecisions = (
  folder: string,
  before: string | undefined,
  after: string,
): string | undefined =>
  decideChecks(`tools/workbench/backlog/${folder}/review/decisions.md`, DECISIONS, before, after);

/** The guarded file an Edit/Write targets, with its decide function. */
const guarded = (filePath: string) => {
  const plan = PLAN_FILE.exec(filePath);
  if (plan) return { folder: plan[1], decideFile: decidePlan };
  const decisions = DECISIONS_FILE.exec(filePath);
  if (decisions) return { folder: decisions[1], decideFile: decideDecisions };
  return undefined;
};

const WRITERS = [
  /\bsed\b[^|;&\n]*\s-(?:[a-zA-Z]*i|-in-place)/,
  /\bperl\b[^|;&\n]*\s-[a-zA-Z]*i/,
  /\bawk\b[^|;&\n]*-i\s*inplace/,
  /\btee\b/,
  /(?:^|[\s;&|(])(?:mv|cp|rm)(?=\s)/,
  /\bgit\s+(?:mv|rm|checkout|restore|apply|stash)\b/,
  /\bpatch\b/,
];
/** `>`/`>>`/`&>` and their target; `2>&1` and `>&2` do not match. */
const REDIRECT = /(?<![<>])\d*>{1,2}\|?\s*(?:"([^"]*)"|'([^']*)'|([^\s;&|<>'"()]+))/g;
/**
 * `tools/workbench`, its `backlog` or a `backlog/<f>` folder (not a file inside it), as a
 * resolved path.
 */
const FEATURE_FOLDER = /(?:^|\/)tools\/workbench(?:\/backlog(?:\/[^/]+)?)?$/;
/** `tools/workbench/backlog` or anything below it, as a resolved path. */
const WORKBENCH_TREE = /(?:^|\/)tools\/workbench\/backlog(?:\/|$)/;
const FIND_DELETE = /\s-(?:delete\b|exec(?:dir)?\s+(?:\S*\/)?rm\b)/;

const BASH_MESSAGE =
  'This command may write a workbench plan.md or review/decisions.md, or delete a workbench folder. Edit those files with Edit/Write (the status guard checks them), or ask the owner.';

/** Splits a command on `&&`, `||`, `;`, `|` and newlines outside quotes. */
const splitSegments = (command: string): string[] => {
  const segments: string[] = [];
  let current = '';
  let quote: string | undefined = undefined;
  for (let index = 0; index < command.length; index++) {
    const char = command[index];
    const next = command[index + 1];
    if (quote !== undefined) {
      current += char;
      if (char === quote) quote = undefined;
      else if (char === '\\' && quote === '"' && next !== undefined) {
        current += next;
        index++;
      }
      continue;
    }
    if (char === '\\' && next !== undefined) {
      current += char + next;
      index++;
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      current += char;
      continue;
    }
    const isAnd = char === '&' && next === '&';
    if (char === ';' || char === '\n' || char === '|' || isAnd) {
      segments.push(current);
      current = '';
      if (next === char) index++;
      continue;
    }
    current += char;
  }
  segments.push(current);
  return segments.map((segment) => segment.trim()).filter((segment) => segment !== '');
};

/** Shell words of one segment with quotes removed; leading `(`/`{` and trailing `)` dropped. */
const splitWords = (segment: string): string[] => {
  const words: string[] = [];
  let current = '';
  let inWord = false;
  let quote: string | undefined = undefined;
  const text = segment.replace(/^[({\s]+/, '');
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    const next = text[index + 1];
    if (quote !== undefined) {
      if (char === quote) quote = undefined;
      else if (char === '\\' && quote === '"' && next !== undefined) {
        current += next;
        index++;
      } else current += char;
      continue;
    }
    if (/\s/.test(char)) {
      if (inWord) words.push(current);
      current = '';
      inWord = false;
      continue;
    }
    inWord = true;
    if (char === "'" || char === '"') quote = char;
    else if (char === '\\' && next !== undefined) {
      current += next;
      index++;
    } else current += char;
  }
  if (inWord) words.push(current);
  return words.map((word) => word.replace(/\)+$/, ''));
};

/** The words from the command name on: `VAR=value` prefixes and `sudo` are skipped. */
const commandWords = (segment: string): string[] => {
  const words = splitWords(segment);
  let start = 0;
  while (start < words.length && (/^\w+=/.test(words[start]) || words[start] === 'sudo')) start++;
  return words.slice(start);
};

const redirectTargets = (segment: string): string[] => {
  const targets: string[] = [];
  for (const match of segment.matchAll(REDIRECT)) {
    const target = match[1] ?? match[2] ?? match[3];
    if (target !== undefined) targets.push(target);
  }
  return targets;
};

/** `cd`/`pushd` to a path we cannot resolve (`~`, `$VAR`, `-`, none) falls back to `/`. */
const UNKNOWN_DIR = '/';

const nextDir = (dir: string, words: string[]): string => {
  if (words[0] !== 'cd' && words[0] !== 'pushd') return dir;
  const target = words[1];
  if (target === undefined || /^[~$-]/.test(target)) return UNKNOWN_DIR;
  return posix.resolve(dir, target);
};

const findStarts = (args: string[]): string[] => {
  const starts: string[] = [];
  for (const arg of args) {
    if (/^[-(!]/.test(arg)) break;
    starts.push(arg);
  }
  return starts;
};

const decideSegment = (segment: string, dir: string): string | undefined => {
  const words = commandWords(segment);
  const paths = words
    .filter((word) => !word.startsWith('-'))
    .map((word) => posix.resolve(dir, word));
  if (WRITERS.some((writer) => writer.test(segment)) && paths.some((path) => isProtected(path))) {
    return BASH_MESSAGE;
  }
  const redirects = redirectTargets(segment).map((target) => posix.resolve(dir, target));
  if (redirects.some((path) => isProtected(path))) return BASH_MESSAGE;
  let args = words;
  if (args[0] === 'git') args = args.slice(1);
  if (args[0] === 'rm' || args[0] === 'mv') {
    const targets = args.slice(1).filter((word) => !word.startsWith('-'));
    if (targets.some((word) => FEATURE_FOLDER.test(posix.resolve(dir, word)))) return BASH_MESSAGE;
  }
  if (words[0] === 'find' && FIND_DELETE.test(segment)) {
    const starts = findStarts(words.slice(1)).map((word) => posix.resolve(dir, word));
    if (starts.some((path) => WORKBENCH_TREE.test(path))) return BASH_MESSAGE;
  }
  return undefined;
};

const decideBash = (command: string, cwd: string | undefined): string | undefined => {
  let dir = UNKNOWN_DIR;
  if (cwd !== undefined) dir = posix.resolve(UNKNOWN_DIR, cwd);
  for (const segment of splitSegments(command)) {
    const reason = decideSegment(segment, dir);
    if (reason !== undefined) return reason;
    dir = nextDir(dir, commandWords(segment));
  }
  return undefined;
};

/** `undefined` allows the call; a string is the reason it is blocked. */
export const decide = (input: HookInput, currentText: string | undefined): string | undefined => {
  if (input.tool_name === 'Bash') {
    const bash = bashSchema.safeParse(input.tool_input);
    if (!bash.success) return undefined;
    return decideBash(bash.data.command, input.cwd);
  }
  if (input.tool_name === 'Edit') {
    const edit = editSchema.safeParse(input.tool_input);
    if (!edit.success) return undefined;
    const target = guarded(edit.data.file_path);
    // Edit on a missing file, or with an old_string that is not there, fails on its own.
    if (target === undefined || currentText === undefined) return undefined;
    const after = applyEdit(currentText, edit.data);
    if (after === undefined) return undefined;
    return target.decideFile(target.folder, currentText, after);
  }
  if (input.tool_name === 'Write') {
    const write = writeSchema.safeParse(input.tool_input);
    if (!write.success) return undefined;
    const target = guarded(write.data.file_path);
    if (target === undefined) return undefined;
    return target.decideFile(target.folder, currentText, write.data.content);
  }
  return undefined;
};

const readCurrent = (input: HookInput): string | undefined => {
  const filePath = input.tool_input.file_path;
  if (typeof filePath !== 'string' || !isProtected(filePath) || !existsSync(filePath)) {
    return undefined;
  }
  return readFileSync(filePath, 'utf8');
};

const main = () => {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return;
  }
  const input = hookInputSchema.safeParse(raw);
  if (!input.success) return;
  const reason = decide(input.data, readCurrent(input.data));
  if (reason === undefined) return;
  console.error(reason);
  process.exit(2);
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    // Exit 1 is a non-blocking hook error: the guard fails open on its own crash.
    console.error(`statusGuard crashed: ${String(error)}`);
    process.exit(1);
  }
}
