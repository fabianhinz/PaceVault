import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join, relative } from 'node:path';
import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { STATUSES, checkPlan, readChecks } from '../../../../scripts/workbenchFrontmatter.ts';
import { workbenchRoot } from '../check.ts';
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
 * The board's writes: it shows, moves status, ticks, answers and deletes; creating and editing
 * go through agents. Each action reads the file, changes only the lines it names, refuses when
 * those lines are not as the board rendered them (409, the board reloads) or when the result
 * would fail `workbench:check`, writes, and returns every change with its diff for the toast and
 * for Undo. No token: local dev server only.
 */

export type Change = { path: string; before: string; after: string; diff: string };
/** A whole folder moved (feature.delete and its Undo); paths relative to workbench/. */
export type Move = { from: string; to: string; files: string[] };
export type WriteResult = { name: string; changes: Change[]; move?: Move; notes: string[] };

const FOLDER = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'lowercase words joined by "-"');
const WRITABLE = /^(?:ideas\.md|flaky\.md|[a-z0-9-]+\/plan\.md|[a-z0-9-]+\/review\/findings\.md)$/;
/** Deleted feature folders wait here for Undo (git-ignored); a newer delete replaces them. */
const TRASH = '.trash';

const WORKBENCH_ROOT = workbenchRoot();

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
    throw new ActionError({ code: 'NOT_FOUND', message: `workbench/${path} is missing.` });
  return text;
};

/** The text after a line edit, or the refusal: 409 when the file changed since the board rendered it. */
const applied = (path: string, result: EditResult): string => {
  if (result.ok) return result.text;
  if (result.reason === 'unchanged') {
    throw new ActionError({ code: 'BAD_REQUEST', message: 'Nothing to change.' });
  }
  throw new ActionError({
    code: 'CONFLICT',
    message: `workbench/${path} changed since the board rendered it; reloading.`,
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

const planPath = (feature: string) => `${feature}/plan.md`;

/** A plan edit; refused when it adds a `workbench:check` error the plan did not have. */
const planEdit = (
  name: string,
  feature: string,
  edit: (text: string) => EditResult,
  notes: string[] = [],
) => {
  const path = planPath(feature);
  const before = need(path);
  const after = applied(path, edit(before));
  const hasTech = existsSync(join(WORKBENCH_ROOT, feature, 'tech.md'));
  const known = new Set(checkPlan(feature, before, hasTech));
  const added = checkPlan(feature, after, hasTech).filter((error) => !known.has(error));
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
const statusNotes = (plan: string, to: string): string[] => {
  if (to !== 'ready') return [];
  const calls = readChecks(plan, 'Agent decisions').filter((item) => !item.checked).length;
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
const feature = z.object({ feature: FOLDER });
const expected = feature.extend({ expected: rendered });

const plan = {
  /** Never to done: deleting the card finishes a feature (feature.delete). */
  setStatus: defineAction({
    accept: 'form',
    input: expected.extend({ to: z.enum(STATUSES) }),
    handler: (input) => {
      if (input.to === 'done') {
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: 'The board sets no done status: delete the card to finish a feature.',
        });
      }
      const notes = statusNotes(need(planPath(input.feature)), input.to);
      return planEdit(
        'plan.setStatus',
        input.feature,
        (text) => editLine(text, frontmatter('status'), input.expected, `status: ${input.to}`),
        notes,
      );
    },
  }),
  toggleCheck: defineAction({
    accept: 'form',
    input: expected.extend({ checked: z.enum(['true', 'false']) }),
    handler: (input) =>
      planEdit('plan.toggleCheck', input.feature, (text) =>
        editLine(
          text,
          section('Real-data checks'),
          input.expected,
          tickLine(input.expected, input.checked === 'true'),
        ),
      ),
  }),
  deleteCheck: defineAction({
    accept: 'form',
    input: expected,
    handler: (input) =>
      planEdit('plan.deleteCheck', input.feature, (text) =>
        deleteLine(text, section('Real-data checks'), input.expected),
      ),
  }),
  toggleAgentDecision: defineAction({
    accept: 'form',
    input: expected.extend({ checked: z.enum(['true', 'false']) }),
    handler: (input) =>
      planEdit('plan.toggleAgentDecision', input.feature, (text) =>
        editLine(
          text,
          section('Agent decisions'),
          input.expected,
          tickLine(input.expected, input.checked === 'true'),
        ),
      ),
  }),
  deleteAgentDecision: defineAction({
    accept: 'form',
    input: expected,
    handler: (input) =>
      planEdit('plan.deleteAgentDecision', input.feature, (text) =>
        deleteLine(text, section('Agent decisions'), input.expected),
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
      return planEdit('plan.answerQuestion', input.feature, (text) =>
        editLine(text, section('Open questions'), input.expected, line),
      );
    },
  }),
  /** "Comment, keep open" in the answer dialog; `expected` is the whole question item. */
  commentQuestion: defineAction({
    accept: 'form',
    input: expected.extend({ words: words('Your comment') }),
    handler: (input) =>
      planEdit('plan.commentQuestion', input.feature, (text) =>
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
      planEdit('plan.deleteQuestion', input.feature, (text) =>
        deleteLine(text, section('Open questions'), input.expected),
      ),
  }),
};

const IDEAS = 'ideas.md';

const inbox = {
  /** An Inbox bullet as rendered, under the `## ` heading it sits in ("Decided by agents" too). */
  delete: defineAction({
    accept: 'form',
    input: z.object({ heading: z.string().min(1), expected: rendered }),
    handler: (input) => {
      const after = applied(IDEAS, deleteLine(need(IDEAS), section(input.heading), input.expected));
      return commit('inbox.delete', [{ path: IDEAS, after }]);
    },
  }),
};

const review = {
  /** A finding as rendered, under its `## Round n` heading. */
  deleteFinding: defineAction({
    accept: 'form',
    input: expected.extend({ heading: z.string().min(1) }),
    handler: (input) => {
      const path = `${input.feature}/review/findings.md`;
      const after = applied(path, deleteLine(need(path), section(input.heading), input.expected));
      return commit('review.deleteFinding', [{ path, after }]);
    },
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

/** Moves a folder inside workbench/ unchanged (renamed, so every byte stays). */
const moveFolder = (name: string, from: string, to: string): WriteResult => {
  const files = filesOf(from);
  renameSync(join(WORKBENCH_ROOT, from), join(WORKBENCH_ROOT, to));
  return { name, changes: [], move: { from, to, files }, notes: [] };
};

const featureActions = {
  /** Deleting the card finishes a feature: workbench/<f>/ goes to workbench/.trash/<f>/. */
  delete: defineAction({
    accept: 'form',
    input: feature,
    handler: (input) => {
      need(planPath(input.feature));
      const trashed = `${TRASH}/${input.feature}`;
      rmSync(join(WORKBENCH_ROOT, trashed), { recursive: true, force: true });
      mkdirSync(join(WORKBENCH_ROOT, TRASH), { recursive: true });
      return moveFolder('feature.delete', input.feature, trashed);
    },
  }),
};

/** Writes the reverse of a write, if every file is still exactly as that write left it. */
const undo = defineAction({
  accept: 'json',
  input: z.object({
    name: z.string(),
    changes: z.array(
      z.object({ path: z.string().regex(WRITABLE), before: z.string(), after: z.string() }),
    ),
    /** feature.delete: the folder that went to the trash. */
    move: z
      .object({ from: FOLDER, to: z.string() })
      .refine((move) => move.to === `${TRASH}/${move.from}`, 'Only a trashed feature moves back.')
      .optional(),
  }),
  handler: (input) => {
    const move = input.move;
    if (move !== undefined) {
      if (existsSync(join(WORKBENCH_ROOT, move.from))) {
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: `Undo refused: workbench/${move.from}/ exists again.`,
        });
      }
      if (!existsSync(join(WORKBENCH_ROOT, move.to))) {
        throw new ActionError({
          code: 'NOT_FOUND',
          message: `Undo refused: workbench/${move.to}/ is gone.`,
        });
      }
      return moveFolder(`undo ${input.name}`, move.to, move.from);
    }
    const stale = input.changes.find((change) => read(change.path) !== change.after);
    if (stale) {
      throw new ActionError({
        code: 'CONFLICT',
        message: `Undo refused: workbench/${stale.path} changed since this write.`,
      });
    }
    return commit(
      `undo ${input.name}`,
      input.changes.map((change) => ({ path: change.path, after: change.before })),
    );
  },
});

export const server = { plan, inbox, review, flaky, feature: featureActions, undo };
