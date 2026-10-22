import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import {
  DECISIONS,
  PLAN_CHECKS,
  STATUSES,
  checkPlan,
  isOpenCheck,
  readChecks,
  readStatus,
} from '../../../scripts/frontmatter.ts';
import { workbenchRoot } from '../../../scripts/check.ts';
import { readBoard } from '../lib/board.ts';
import {
  answerLine,
  commentLine,
  deleteLine,
  editLine,
  insertLine,
  tickLine,
  unifiedDiff,
  type EditResult,
  type Place,
} from '../lib/writeBack.ts';

/**
 * The board's read (`board.read`) and writes: it shows, moves status, ticks, answers and deletes;
 * creating and editing go through agents. Each write reads the file, changes only the lines it
 * names, refuses when those lines are not as the board showed them (409, the board refetches) or
 * when the result would fail `workbench:check`, writes, and returns every change with its diff
 * for the write card and for Undo. No token: local dev server only.
 */

export type Change = { path: string; before: string; after: string; diff: string };
/**
 * A whole item folder removed (item.delete) or written back (its Undo); `folder` relative
 * to tools/workbench/backlog/, `files` relative to the folder.
 */
export type FolderChange = { folder: string; files: string[]; state: 'deleted' | 'restored' };
export type WriteResult = {
  name: string;
  changes: Change[];
  folder?: FolderChange;
  notes: string[];
};

const FOLDER = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'lowercase words joined by "-"');
const WRITABLE =
  /^(?:flaky\.md|[a-z0-9-]+\/plan\.md|[a-z0-9-]+\/review\/(?:findings|decisions)\.md)$/;

const WORKBENCH_ROOT = workbenchRoot();
/** tools/workbench/GUIDE.md, outside the backlog (its own path, also with WB_ROOT). */
const GUIDE_FILE = fileURLToPath(new URL('../../../GUIDE.md', import.meta.url));

const today = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const read = (path: string): string | null => {
  const file = join(WORKBENCH_ROOT, path);
  if (!existsSync(file)) return null;
  return readFileSync(file, 'utf8');
};

const need = (path: string): string => {
  const text = read(path);
  if (text === null)
    throw new ActionError({
      code: 'NOT_FOUND',
      message: `tools/workbench/backlog/${path} is missing.`,
    });
  return text;
};

/** The text after a line edit, or the refusal: 409 when the file changed since the board showed it. */
const applied = (path: string, result: EditResult): string => {
  if (result.ok) return result.text;
  if (result.reason === 'unchanged') {
    throw new ActionError({ code: 'BAD_REQUEST', message: 'Nothing to change.' });
  }
  throw new ActionError({
    code: 'CONFLICT',
    message: `tools/workbench/backlog/${path} changed since the board rendered it; the board now shows the current file.`,
  });
};

const commit = (
  name: string,
  edits: { path: string; after: string }[],
  notes: string[] = [],
): WriteResult => {
  const changes = edits.map((edit) => {
    const before = need(edit.path);
    return { path: edit.path, before, after: edit.after, diff: unifiedDiff(before, edit.after) };
  });
  for (const change of changes) writeFileSync(join(WORKBENCH_ROOT, change.path), change.after);
  return { name, changes, notes };
};

const planPath = (item: string) => `${item}/plan.md`;
const decisionsPath = (item: string) => `${item}/review/decisions.md`;

/** A plan edit; refused when it adds a `workbench:check` error the plan did not have. */
const planEdit = (
  name: string,
  item: string,
  edit: (text: string) => EditResult,
  notes: string[] = [],
) => {
  const path = planPath(item);
  const before = need(path);
  const after = applied(path, edit(before));
  const hasTech = existsSync(join(WORKBENCH_ROOT, item, 'tech.md'));
  const known = new Set(checkPlan(item, before, hasTech));
  const added = checkPlan(item, after, hasTech).filter((error) => !known.has(error));
  if (added.length > 0) {
    throw new ActionError({
      code: 'BAD_REQUEST',
      message: `Refused, workbench:check would fail: ${added.join('; ')}`,
    });
  }
  return commit(name, [{ path, after }], notes);
};

const section = (heading: string): Place => ({ kind: 'section', heading });
const frontmatter = (key: string): Place => ({ kind: 'frontmatter', key });

const words = (field: string) =>
  z
    .string({ error: `${field} is required.` })
    .trim()
    .min(1, `${field} is required.`);
/** Astro reads an empty form field as `null`; an optional text is then ''. */
const optional = z
  .string()
  .nullish()
  .transform((value) => value ?? '');

/** What to look at before moving on; the move itself is allowed. */
const statusNotes = (item: string, to: string): string[] => {
  if (to !== 'ready') return [];
  const decisions = read(decisionsPath(item));
  if (decisions === null) return [];
  const calls = readChecks(decisions, DECISIONS).filter(isOpenCheck).length;
  if (calls === 0) return [];
  return [`${calls} agent decision(s) not confirmed.`];
};

/**
 * The lines as the board rendered them: the stale-file guard. A form sends line breaks as CRLF
 * (multipart encoding), the files use LF.
 */
const rendered = z
  .string()
  .min(1)
  .transform((value) => value.replaceAll('\r\n', '\n'));
const itemInput = z.object({ item: FOLDER });
const expected = itemInput.extend({ expected: rendered });

const plan = {
  /** Done only from in-review: the owner accepts reviewed work (the Done button). */
  setStatus: defineAction({
    accept: 'form',
    input: expected.extend({ to: z.enum(STATUSES) }),
    handler: (input) => {
      const current = need(planPath(input.item));
      if (input.to === 'done' && readStatus(current) !== 'in-review') {
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: 'Only reviewed work is accepted as done.',
        });
      }
      const notes = statusNotes(input.item, input.to);
      return planEdit(
        'plan.setStatus',
        input.item,
        (text) => editLine(text, frontmatter('status'), input.expected, `status: ${input.to}`),
        notes,
      );
    },
  }),
  toggleCheck: defineAction({
    accept: 'form',
    input: expected.extend({ checked: z.enum(['true', 'false']) }),
    handler: (input) =>
      planEdit('plan.toggleCheck', input.item, (text) =>
        editLine(
          text,
          section(PLAN_CHECKS),
          input.expected,
          tickLine(input.expected, input.checked === 'true'),
        ),
      ),
  }),
  deleteCheck: defineAction({
    accept: 'form',
    input: expected,
    handler: (input) =>
      planEdit('plan.deleteCheck', input.item, (text) =>
        deleteLine(text, section(PLAN_CHECKS), input.expected),
      ),
  }),
  /** `expected` is the question's first line; its sub-bullets stay. */
  answerQuestion: defineAction({
    accept: 'form',
    input: expected.extend({ option: optional, words: optional }),
    handler: (input) => {
      const line = answerLine(input.expected, today(), input.option, input.words);
      if (line === undefined) {
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: 'Pick an option, or write your answer (quoted as Owner: "…").',
        });
      }
      return planEdit('plan.answerQuestion', input.item, (text) =>
        editLine(text, section('Open questions'), input.expected, line),
      );
    },
  }),
  /** "Comment, keep open" in the answer dialog; `expected` is the whole question item. */
  commentQuestion: defineAction({
    accept: 'form',
    input: expected.extend({ words: words('Your comment') }),
    handler: (input) =>
      planEdit('plan.commentQuestion', input.item, (text) =>
        insertLine(
          text,
          section('Open questions'),
          input.expected,
          commentLine(today(), input.words),
        ),
      ),
  }),
  /** `expected` is the whole question item: the question goes with its indented comments. */
  deleteQuestion: defineAction({
    accept: 'form',
    input: expected,
    handler: (input) =>
      planEdit('plan.deleteQuestion', input.item, (text) =>
        deleteLine(text, section('Open questions'), input.expected),
      ),
  }),
};

/** An edit of a review file (not plan.md, so no `workbench:check` of the plan runs). */
const reviewEdit = (name: string, path: string, edit: (text: string) => EditResult) =>
  commit(name, [{ path, after: applied(path, edit(need(path))) }]);

const review = {
  /** A finding as rendered, under its `## Round n` heading. */
  deleteFinding: defineAction({
    accept: 'form',
    input: expected.extend({ heading: z.string().min(1) }),
    handler: (input) =>
      reviewEdit('review.deleteFinding', `${input.item}/review/findings.md`, (text) =>
        deleteLine(text, section(input.heading), input.expected),
      ),
  }),
  /** Ticks or unticks an agent decision in `review/decisions.md` (Q8). */
  toggleDecision: defineAction({
    accept: 'form',
    input: expected.extend({ checked: z.enum(['true', 'false']) }),
    handler: (input) =>
      reviewEdit('review.toggleDecision', decisionsPath(input.item), (text) =>
        editLine(
          text,
          section(DECISIONS),
          input.expected,
          tickLine(input.expected, input.checked === 'true'),
        ),
      ),
  }),
  deleteDecision: defineAction({
    accept: 'form',
    input: expected,
    handler: (input) =>
      reviewEdit('review.deleteDecision', decisionsPath(input.item), (text) =>
        deleteLine(text, section(DECISIONS), input.expected),
      ),
  }),
};

const FLAKY = 'flaky.md';

const flaky = {
  remove: defineAction({
    accept: 'form',
    input: z.object({ expected: rendered }),
    handler: (input) => {
      const after = applied(FLAKY, deleteLine(need(FLAKY), { kind: 'file' }, input.expected));
      return commit('flaky.remove', [{ path: FLAKY, after }]);
    },
  }),
};

/** Every file below a folder, relative to it, sorted. */
const filesOf = (folder: string): string[] => {
  const base = join(WORKBENCH_ROOT, folder);
  return readdirSync(base, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(base, join(entry.parentPath, entry.name)))
    .sort();
};

/**
 * The last deleted item folder, held in the dev server's memory for Undo (path → bytes).
 * One slot: the next delete replaces it, a dev-server restart drops it.
 */
let lastDeleted: { folder: string; files: Map<string, Buffer> } | undefined = undefined;

const itemActions = {
  /** Removes tools/workbench/backlog/<f>/ (no trash); Undo writes it back from memory. */
  delete: defineAction({
    accept: 'form',
    input: itemInput,
    handler: (input): WriteResult => {
      need(planPath(input.item));
      const files = filesOf(input.item);
      const base = join(WORKBENCH_ROOT, input.item);
      lastDeleted = {
        folder: input.item,
        files: new Map(files.map((file) => [file, readFileSync(join(base, file))])),
      };
      rmSync(base, { recursive: true, force: true });
      return {
        name: 'item.delete',
        changes: [],
        folder: { folder: input.item, files, state: 'deleted' },
        notes: [],
      };
    },
  }),
};

/** Writes a deleted item folder back from memory, if it is still the last delete. */
const restoreFolder = (name: string, folder: string): WriteResult => {
  const slot = lastDeleted;
  if (slot === undefined || slot.folder !== folder) {
    throw new ActionError({
      code: 'NOT_FOUND',
      message: `Undo refused: tools/workbench/backlog/${folder}/ is no longer held (a newer delete or a dev-server restart).`,
    });
  }
  if (existsSync(join(WORKBENCH_ROOT, folder))) {
    throw new ActionError({
      code: 'BAD_REQUEST',
      message: `Undo refused: tools/workbench/backlog/${folder}/ exists again.`,
    });
  }
  for (const entry of slot.files) {
    const file = join(WORKBENCH_ROOT, folder, entry[0]);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, entry[1]);
  }
  lastDeleted = undefined;
  const files = [...slot.files.keys()];
  return { name, changes: [], folder: { folder, files, state: 'restored' }, notes: [] };
};

/** Writes the reverse of a write, if every file is still exactly as that write left it. */
const undo = defineAction({
  accept: 'json',
  input: z.object({
    name: z.string(),
    changes: z.array(
      z.object({ path: z.string().regex(WRITABLE), before: z.string(), after: z.string() }),
    ),
    /** item.delete: the folder to write back from memory. */
    folder: FOLDER.optional(),
  }),
  handler: (input) => {
    if (input.folder !== undefined) return restoreFolder(`undo ${input.name}`, input.folder);
    const stale = input.changes.find((change) => read(change.path) !== change.after);
    if (stale) {
      throw new ActionError({
        code: 'CONFLICT',
        message: `Undo refused: tools/workbench/backlog/${stale.path} changed since this write.`,
      });
    }
    return commit(
      `undo ${input.name}`,
      input.changes.map((change) => ({ path: change.path, after: change.before })),
    );
  },
});

/** The whole board for the island (TanStack Query `['board']`). */
const board = {
  read: defineAction({
    accept: 'json',
    handler: () => readBoard(WORKBENCH_ROOT, GUIDE_FILE),
  }),
};

export const server = { board, plan, review, flaky, item: itemActions, undo };
