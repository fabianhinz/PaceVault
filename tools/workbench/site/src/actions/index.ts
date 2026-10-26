import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { ActionError, defineAction } from 'astro:actions';
import { z } from 'zod';
import {
  DECISIONS,
  PLAN_CHECKS,
  STATUSES,
  isOpenCheck,
  readChecks,
  readStatus,
} from '@scripts/frontmatter.ts';
import { addedCheckErrors } from '@scripts/checkRules.ts';
import { GUIDE_FILE, backlogRoot } from '@scripts/paths.ts';
import { readBoard } from '@site/lib/board.ts';
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
} from '@site/lib/writeBack.ts';

/** No token: local dev server only. */

type Change = { path: string; before: string; after: string; diff: string };
type FolderChange = { folder: string; files: string[]; state: 'deleted' | 'restored' };
export type WriteResult = {
  name: string;
  changes: Change[];
  folder?: FolderChange;
  notes: string[];
};

const folderSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'lowercase words joined by "-"');
const WRITABLE =
  /^(?:flaky\.md|[a-z0-9-]+\/plan\.md|[a-z0-9-]+\/review\/(?:findings|decisions)\.md)$/;

const BACKLOG_ROOT = backlogRoot();

const today = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const readBacklogFile = (path: string): string | null => {
  const file = join(BACKLOG_ROOT, path);
  if (!existsSync(file)) return null;
  return readFileSync(file, 'utf8');
};

const requireBacklogFile = (path: string): string => {
  const text = readBacklogFile(path);
  if (text === null)
    throw new ActionError({
      code: 'NOT_FOUND',
      message: `tools/workbench/backlog/${path} is missing.`,
    });
  return text;
};

const editedText = ({ path, editResult }: { path: string; editResult: EditResult }): string => {
  if (editResult.ok) return editResult.text;
  if (editResult.reason === 'unchanged') {
    throw new ActionError({ code: 'BAD_REQUEST', message: 'Nothing to change.' });
  }
  throw new ActionError({
    code: 'CONFLICT',
    message: `tools/workbench/backlog/${path} changed since the board rendered it; the board now shows the current file.`,
  });
};

const writeEdits = ({
  name,
  edits,
  notes,
}: {
  name: string;
  edits: { path: string; after: string }[];
  notes?: string[];
}): WriteResult => {
  const changes = edits.map((edit) => {
    const before = requireBacklogFile(edit.path);
    return {
      path: edit.path,
      before,
      after: edit.after,
      diff: unifiedDiff({ before, after: edit.after }),
    };
  });
  for (const change of changes) writeFileSync(join(BACKLOG_ROOT, change.path), change.after);
  return { name, changes, notes: notes ?? [] };
};

const planPath = (item: string) => `${item}/plan.md`;
const decisionsPath = (item: string) => `${item}/review/decisions.md`;

const planEdit = ({
  name,
  item,
  edit,
  notes,
}: {
  name: string;
  item: string;
  edit: (text: string) => EditResult;
  notes?: string[];
}) => {
  const path = planPath(item);
  const before = requireBacklogFile(path);
  const after = editedText({ path, editResult: edit(before) });
  const techPresent = existsSync(join(BACKLOG_ROOT, item, 'tech.md'));
  const added = addedCheckErrors({ folder: item, before, after, techPresent });
  if (added.length > 0) {
    throw new ActionError({
      code: 'BAD_REQUEST',
      message: `Refused, workbench:check would fail: ${added.join('; ')}`,
    });
  }
  return writeEdits({ name, edits: [{ path, after }], notes });
};

const section = (heading: string): Place => ({ kind: 'section', heading });
const frontmatter = (key: string): Place => ({ kind: 'frontmatter', key });

const requiredTextSchema = (field: string) =>
  z
    .string({ error: `${field} is required.` })
    .trim()
    .min(1, `${field} is required.`);
/** Astro reads an empty form field as `null`; an optional text is then ''. */
const optionalTextSchema = z
  .string()
  .nullish()
  .transform((value) => value ?? '');

const statusNotes = ({ item, to }: { item: string; to: string }): string[] => {
  if (to !== 'ready') return [];
  const decisions = readBacklogFile(decisionsPath(item));
  if (decisions === null) return [];
  const openDecisionCount = readChecks({ text: decisions, heading: DECISIONS }).filter(
    isOpenCheck,
  ).length;
  if (openDecisionCount === 0) return [];
  return [`${openDecisionCount} agent decision(s) not confirmed.`];
};

/** A form sends line breaks as CRLF (multipart encoding), the files use LF. */
const renderedLinesSchema = z
  .string()
  .min(1)
  .transform((value) => value.replaceAll('\r\n', '\n'));
const itemInputSchema = z.object({ item: folderSchema });
const expectedLinesInputSchema = itemInputSchema.extend({ expected: renderedLinesSchema });

const plan = {
  setStatus: defineAction({
    accept: 'form',
    input: expectedLinesInputSchema.extend({ to: z.enum(STATUSES) }),
    handler: (input) => {
      const current = requireBacklogFile(planPath(input.item));
      if (input.to === 'done' && readStatus(current) !== 'in-review') {
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: 'Only reviewed work is accepted as done.',
        });
      }
      const notes = statusNotes({ item: input.item, to: input.to });
      return planEdit({
        name: 'plan.setStatus',
        item: input.item,
        edit: (text) =>
          editLine({
            text,
            place: frontmatter('status'),
            expected: input.expected,
            next: `status: ${input.to}`,
          }),
        notes,
      });
    },
  }),
  toggleCheck: defineAction({
    accept: 'form',
    input: expectedLinesInputSchema.extend({ checked: z.enum(['true', 'false']) }),
    handler: (input) =>
      planEdit({
        name: 'plan.toggleCheck',
        item: input.item,
        edit: (text) =>
          editLine({
            text,
            place: section(PLAN_CHECKS),
            expected: input.expected,
            next: tickLine({ first: input.expected, checked: input.checked === 'true' }),
          }),
      }),
  }),
  deleteCheck: defineAction({
    accept: 'form',
    input: expectedLinesInputSchema,
    handler: (input) =>
      planEdit({
        name: 'plan.deleteCheck',
        item: input.item,
        edit: (text) => deleteLine({ text, place: section(PLAN_CHECKS), expected: input.expected }),
      }),
  }),
  answerQuestion: defineAction({
    accept: 'form',
    input: expectedLinesInputSchema.extend({
      option: optionalTextSchema,
      words: optionalTextSchema,
    }),
    handler: (input) => {
      const line = answerLine({
        first: input.expected,
        date: today(),
        option: input.option,
        words: input.words,
      });
      if (line === undefined) {
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: 'Pick an option, or write your answer (quoted as Owner: "…").',
        });
      }
      return planEdit({
        name: 'plan.answerQuestion',
        item: input.item,
        edit: (text) =>
          editLine({
            text,
            place: section('Open questions'),
            expected: input.expected,
            next: line,
          }),
      });
    },
  }),
  commentQuestion: defineAction({
    accept: 'form',
    input: expectedLinesInputSchema.extend({ words: requiredTextSchema('Your comment') }),
    handler: (input) =>
      planEdit({
        name: 'plan.commentQuestion',
        item: input.item,
        edit: (text) =>
          insertLine({
            text,
            place: section('Open questions'),
            after: input.expected,
            line: commentLine({ date: today(), words: input.words }),
          }),
      }),
  }),
  deleteQuestion: defineAction({
    accept: 'form',
    input: expectedLinesInputSchema,
    handler: (input) =>
      planEdit({
        name: 'plan.deleteQuestion',
        item: input.item,
        edit: (text) =>
          deleteLine({ text, place: section('Open questions'), expected: input.expected }),
      }),
  }),
};

const reviewEdit = ({
  name,
  path,
  edit,
}: {
  name: string;
  path: string;
  edit: (text: string) => EditResult;
}) =>
  writeEdits({
    name,
    edits: [{ path, after: editedText({ path, editResult: edit(requireBacklogFile(path)) }) }],
  });

const review = {
  deleteFinding: defineAction({
    accept: 'form',
    input: expectedLinesInputSchema.extend({ heading: z.string().min(1) }),
    handler: (input) =>
      reviewEdit({
        name: 'review.deleteFinding',
        path: `${input.item}/review/findings.md`,
        edit: (text) =>
          deleteLine({ text, place: section(input.heading), expected: input.expected }),
      }),
  }),
  toggleDecision: defineAction({
    accept: 'form',
    input: expectedLinesInputSchema.extend({ checked: z.enum(['true', 'false']) }),
    handler: (input) =>
      reviewEdit({
        name: 'review.toggleDecision',
        path: decisionsPath(input.item),
        edit: (text) =>
          editLine({
            text,
            place: section(DECISIONS),
            expected: input.expected,
            next: tickLine({ first: input.expected, checked: input.checked === 'true' }),
          }),
      }),
  }),
  deleteDecision: defineAction({
    accept: 'form',
    input: expectedLinesInputSchema,
    handler: (input) =>
      reviewEdit({
        name: 'review.deleteDecision',
        path: decisionsPath(input.item),
        edit: (text) => deleteLine({ text, place: section(DECISIONS), expected: input.expected }),
      }),
  }),
};

const FLAKY = 'flaky.md';

const flaky = {
  remove: defineAction({
    accept: 'form',
    input: z.object({ expected: renderedLinesSchema }),
    handler: (input) => {
      const after = editedText({
        path: FLAKY,
        editResult: deleteLine({
          text: requireBacklogFile(FLAKY),
          place: { kind: 'file' },
          expected: input.expected,
        }),
      });
      return writeEdits({ name: 'flaky.remove', edits: [{ path: FLAKY, after }] });
    },
  }),
};

const filesOf = (folder: string): string[] => {
  const base = join(BACKLOG_ROOT, folder);
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
  delete: defineAction({
    accept: 'form',
    input: itemInputSchema,
    handler: (input): WriteResult => {
      requireBacklogFile(planPath(input.item));
      const files = filesOf(input.item);
      const base = join(BACKLOG_ROOT, input.item);
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

const restoreFolder = ({ name, folder }: { name: string; folder: string }): WriteResult => {
  const slot = lastDeleted;
  if (slot === undefined || slot.folder !== folder) {
    throw new ActionError({
      code: 'NOT_FOUND',
      message: `Undo refused: tools/workbench/backlog/${folder}/ is no longer held (a newer delete or a dev-server restart).`,
    });
  }
  if (existsSync(join(BACKLOG_ROOT, folder))) {
    throw new ActionError({
      code: 'BAD_REQUEST',
      message: `Undo refused: tools/workbench/backlog/${folder}/ exists again.`,
    });
  }
  for (const entry of slot.files) {
    const file = join(BACKLOG_ROOT, folder, entry[0]);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, entry[1]);
  }
  lastDeleted = undefined;
  const files = [...slot.files.keys()];
  return { name, changes: [], folder: { folder, files, state: 'restored' }, notes: [] };
};

const undo = defineAction({
  accept: 'json',
  input: z.object({
    name: z.string(),
    changes: z.array(
      z.object({ path: z.string().regex(WRITABLE), before: z.string(), after: z.string() }),
    ),
    folder: folderSchema.optional(),
  }),
  handler: (input) => {
    if (input.folder !== undefined)
      return restoreFolder({ name: `undo ${input.name}`, folder: input.folder });
    const stale = input.changes.find((change) => readBacklogFile(change.path) !== change.after);
    if (stale) {
      throw new ActionError({
        code: 'CONFLICT',
        message: `Undo refused: tools/workbench/backlog/${stale.path} changed since this write.`,
      });
    }
    return writeEdits({
      name: `undo ${input.name}`,
      edits: input.changes.map((change) => ({ path: change.path, after: change.before })),
    });
  },
});

const board = {
  read: defineAction({
    accept: 'json',
    handler: () => readBoard({ root: BACKLOG_ROOT, guideFile: GUIDE_FILE }),
  }),
};

export const server = { board, plan, review, flaky, item: itemActions, undo };
