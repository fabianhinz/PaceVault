import { marked, type Token, type Tokens } from 'marked';
import { parse } from 'yaml';
import { z } from 'zod';

/**
 * Shared reader for `tools/workbench/backlog/<item>/plan.md`: the frontmatter (status, title,
 * type, areas, next, …) and the tracked sections (`## Real-data checks`, `## Open questions`), and for
 * `backlog/<item>/review/decisions.md` (`## Agent decisions`).
 * Used by the board (`tools/workbench/site`), its check, the check hook, the cleanup script and the
 * status guard.
 */

/** Column order on the board. */
export const STATUSES = [
  'idea',
  'exploring',
  'planned',
  'ready',
  'in-dev',
  'in-review',
  'done',
] as const;

export type Status = (typeof STATUSES)[number];

/** The owner's checklist in plan.md; agents add items, only the owner ticks or removes them. */
export const PLAN_CHECKS = 'Real-data checks';

/** The agent decisions in `review/decisions.md`; the same rule as the plan checks. */
export const DECISIONS = 'Agent decisions';

export type CheckHeading = typeof PLAN_CHECKS | typeof DECISIONS;

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The type of an item (`type:`): exactly one per item. */
export const ITEM_TYPES = ['feature', 'bug', 'chore'] as const;

export type ItemType = (typeof ITEM_TYPES)[number];

/**
 * The areas of an item (`areas:`): the workspace parts it touches, at least one per item.
 * `app` is `apps/web`, the PWA that ships to people; `workbench` is the board, its scripts and
 * hooks; `docs` is `tools/docs`; `repo` the root workspace config; `skills` is `.claude/`.
 */
export const AREAS = [
  'app',
  'engine',
  'gpx',
  'ui',
  'i18n',
  'testing',
  'workbench',
  'docs',
  'repo',
  'skills',
] as const;

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

export const planFrontmatterSchema = z
  .object({
    title: z.string().trim().min(1),
    status: z.enum(STATUSES),
    // Astro's YAML reads an unquoted `created: 2026-10-18` as a Date; the output stays a string.
    created: z.union([
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'created must be YYYY-MM-DD'),
      z.date().transform((date) => date.toISOString().slice(0, 10)),
    ]),
    'depends-on': z
      .array(z.string().regex(KEBAB, 'depends-on entries are folder names'))
      .optional(),
    /** Required for every status except `done` (see the refinement below). */
    type: z
      .enum(ITEM_TYPES, { error: () => `type must be one of: ${ITEM_TYPES.join(', ')}` })
      .optional(),
    /** At least one, no duplicates; required for every status except `done`. */
    areas: z
      .array(z.enum(AREAS, { error: () => `areas must be from: ${AREAS.join(', ')}` }))
      .min(1, `areas need at least one of: ${AREAS.join(', ')}`)
      .superRefine((areas, ctx) => {
        const duplicate = areas.find((area, index) => areas.indexOf(area) !== index);
        if (duplicate !== undefined) {
          ctx.addIssue({ code: 'custom', message: `duplicate area "${duplicate}"` });
        }
      })
      .optional(),
    next: z.string().trim().min(1),
    /** Fast lane (owner-only): no tech.md, no fact-check, no deps graph, the suite runs once. */
    size: z.enum(['small'], { error: () => 'size must be: small' }).optional(),
  })
  .superRefine((front, ctx) => {
    // Done items from before the type/areas split (review round 2, R5) stay valid without them.
    if (front.status === 'done') return;
    if (front.type === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['type'],
        message: `type is required for every status except done: ${ITEM_TYPES.join(', ')}`,
      });
    }
    if (front.areas === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['areas'],
        message: `areas are required for every status except done: at least one of ${AREAS.join(', ')}`,
      });
    }
  });

export type PlanFrontmatter = z.infer<typeof planFrontmatterSchema>;

/** The markdown after the frontmatter block (the whole text when there is none). */
export const planBody = (text: string): string => {
  const match = FRONTMATTER.exec(text);
  if (!match) return text;
  return text.slice(match[0].length);
};

/** Parses the YAML between the leading `---` lines; `undefined` when there is no block. */
export const parseFrontmatter = (text: string): unknown => {
  const match = FRONTMATTER.exec(text);
  if (!match) return undefined;
  return parse(match[1]);
};

/** The raw `status:` value, without validating it. */
export const readStatus = (text: string): string | undefined => {
  const match = FRONTMATTER.exec(text);
  if (!match) return undefined;
  const line = /^status:[ \t]*([^\s#]*)/m.exec(match[1]);
  if (!line || line[1] === '') return undefined;
  return line[1].replace(/^["']|["']$/g, '');
};

/** The raw `size:` value, without validating it (the status guard keeps it owner-only). */
export const readSize = (text: string): string | undefined => {
  const match = FRONTMATTER.exec(text);
  if (!match) return undefined;
  const line = /^size:[ \t]*([^\s#]*)/m.exec(match[1]);
  if (!line) return undefined;
  return line[1].replace(/^["']|["']$/g, '');
};

/** The top-level tokens under `## <heading>`, up to the next heading of depth ≤ 2. */
export const sectionTokens = (text: string, heading: string): Token[] => {
  const tokens = marked.lexer(planBody(text));
  const out: Token[] = [];
  let inside = false;
  for (const token of tokens) {
    if (token.type === 'heading' && (token as Tokens.Heading).depth <= 2) {
      inside = (token as Tokens.Heading).depth === 2 && token.text.trim() === heading;
      continue;
    }
    if (inside) out.push(token);
  }
  return out;
};

const listItems = (tokens: Token[]): Tokens.ListItem[] =>
  tokens.flatMap((token) => {
    if (token.type !== 'list') return [];
    return (token as Tokens.List).items;
  });

/** `raw`: the item as it stands in the file (all its lines), for the board's write-back. */
/**
 * `superseded`: `- [~]`, an agent decision a later answer or decision replaced (R17); neither open
 * nor ticked (`checked` is false), it carries `Superseded by: <pointer>`.
 */
export type CheckItem = { text: string; checked: boolean; superseded: boolean; raw: string };

const rawOf = (item: Tokens.ListItem) => item.raw.replace(/\s+$/, '');

/** `[~] ` at the start of a list item's text: GFM reads it as a plain item, not a task. */
const SUPERSEDED_MARK = /^\[~\]\s+/;

/** `Superseded by: <pointer>` on a `[~]` item, the pointer not empty. */
export const SUPERSEDED_BY = /\bSuperseded by:\s*\S/;

/**
 * The `- [ ]` / `- [x]` items under `## <heading>`; under `## Agent decisions` also the `- [~]`
 * (superseded) items.
 */
export const readChecks = (text: string, heading: CheckHeading): CheckItem[] =>
  listItems(sectionTokens(text, heading)).flatMap((item): CheckItem[] => {
    const itemText = item.text.trim();
    if (item.task) {
      return [
        { text: itemText, checked: item.checked === true, superseded: false, raw: rawOf(item) },
      ];
    }
    if (heading === DECISIONS && SUPERSEDED_MARK.test(itemText)) {
      const rest = itemText.replace(SUPERSEDED_MARK, '');
      return [{ text: rest, checked: false, superseded: true, raw: rawOf(item) }];
    }
    return [];
  });

/** Open: neither ticked nor superseded (what waits on the owner). */
export const isOpenCheck = (item: CheckItem): boolean => !item.checked && !item.superseded;

/** The kinds a new agent decision names first in its bold part: `**(behaviour) …**` (R17). */
const DECISION_KINDS = ['behaviour', 'look', 'scope'] as const;

/** `**(behaviour|look|scope) …` at the start of a decision's text. */
export const DECISION_KIND = new RegExp(`^\\*\\*\\((?:${DECISION_KINDS.join('|')})\\)\\s`);

/**
 * The decisions an edit adds without a kind (R17): open or ticked items of `after` whose line is
 * not in `before` and whose bold part does not start with `(behaviour)`, `(look)` or `(scope)`.
 * Items already in `before` (written before the rule) and superseded items are not new decisions.
 */
export const decisionsWithoutKind = (before: string | undefined, after: string): string[] => {
  let known = new Set<string>();
  if (before !== undefined) known = new Set(readChecks(before, DECISIONS).map((item) => item.raw));
  return readChecks(after, DECISIONS)
    .filter((item) => !item.superseded && !known.has(item.raw))
    .filter((item) => !DECISION_KIND.test(item.text))
    .map((item) => item.raw.split('\n')[0]);
};

export type Question = {
  id: string;
  state: 'open' | 'answered';
  date?: string;
  text: string;
  quote?: string;
  raw: string;
};

const QUESTION =
  /^\*\*(Q\d+)\*\*\s*·\s*(open|answered)(?:\s+(\d{4}-\d{2}-\d{2}))?\s*·\s*([\s\S]*)$/;
const OWNER_QUOTE = /Owner:\s*["“]([^"”]+)["”]/;

/**
 * The tracked items under `## Open questions`:
 * `- **Q3** · open · …` and `- **Q4** · answered 2026-10-18 · … Owner: "…"`.
 * Other bullets in the section (notes, follow-ups) are not questions and are skipped.
 */
export const readQuestions = (text: string): Question[] => {
  const out: Question[] = [];
  for (const item of listItems(sectionTokens(text, 'Open questions'))) {
    const match = QUESTION.exec(item.text.trim());
    if (!match) continue;
    let state: Question['state'] = 'open';
    if (match[2] === 'answered') state = 'answered';
    const question: Question = { id: match[1], state, text: match[4].trim(), raw: rawOf(item) };
    if (match[3]) question.date = match[3];
    const quote = OWNER_QUOTE.exec(match[4]);
    if (quote) question.quote = quote[1];
    out.push(question);
  }
  return out;
};

export type TechPaths = { added: string[]; changed: string[] };

/** A planned path of tech.md with the note after it (`- \`path\`: note`). */
export type TechEntry = { path: string; note: string };

/**
 * The first code span of each bullet under `### <heading>` inside `## Files` (the template since
 * R25) or `## Modules` (older tech.md files), with the text after it as the note.
 */
const moduleEntries = (tech: string, heading: string): TechEntry[] => {
  const out: TechEntry[] = [];
  for (const section of ['Files', 'Modules']) {
    let inside = false;
    for (const token of sectionTokens(tech, section)) {
      if (token.type === 'heading') {
        inside = token.text.trim() === heading;
        continue;
      }
      if (!inside) continue;
      for (const item of listItems([token])) {
        const code = /`([^`]+)`/.exec(item.text);
        if (!code) continue;
        const note = item.text
          .slice(code.index + code[0].length)
          .replace(/^\s*[:—–-]?\s*/, '')
          .trim();
        out.push({ path: code[1].trim(), note });
      }
    }
  }
  return out;
};

/** The planned New and Changed entries of tech.md (paths with their notes), for the Tech tab's Files section. */
export const readTechEntries = (tech: string): { added: TechEntry[]; changed: TechEntry[] } => ({
  added: moduleEntries(tech, 'New'),
  changed: moduleEntries(tech, 'Changed'),
});

/**
 * The planned paths of `tools/workbench/backlog/<item>/tech.md`: one backticked path per bullet under
 * `## Files` (or `## Modules`) › `### New` (`added`) and `### Changed` (`changed`). Other lists are
 * ignored.
 */
export const readTechPaths = (tech: string): TechPaths => ({
  added: moduleEntries(tech, 'New').map((entry) => entry.path),
  changed: moduleEntries(tech, 'Changed').map((entry) => entry.path),
});

/** Statuses from `ready` on; a plan there must not have open questions. */
export const PAST_READY: readonly Status[] = ['ready', 'in-dev', 'in-review', 'done'];

/** Statuses from `planned` on; an item there must have a `tech.md`. */
const FROM_PLANNED: readonly Status[] = ['planned', ...PAST_READY];

/**
 * The `workbench:check` rules for one `plan.md`: frontmatter present and valid, every answer
 * quotes the owner, no open question from `ready` on, a `tech.md` from `planned` on (not for
 * `size: small`).
 */
export const checkPlan = (folder: string, plan: string, hasTech: boolean): string[] => {
  const path = `tools/workbench/backlog/${folder}/plan.md`;
  let raw: unknown;
  try {
    raw = parseFrontmatter(plan);
  } catch (error) {
    return [`${path}: invalid frontmatter YAML: ${String(error)}`];
  }
  if (raw === undefined) return [`${path}: no frontmatter block (--- … ---)`];
  const parsed = planFrontmatterSchema.safeParse(raw);
  if (!parsed.success) {
    return parsed.error.issues.map(
      (issue) => `${path}: ${issue.path.join('.') || '(root)'}: ${issue.message}`,
    );
  }
  const errors: string[] = [];
  const questions = readQuestions(plan);
  for (const question of questions) {
    if (question.state === 'answered' && question.quote === undefined) {
      errors.push(`${path}: ${question.id} is answered without the owner's words (Owner: "…")`);
    }
  }
  const open = questions.filter((question) => question.state === 'open');
  if (PAST_READY.includes(parsed.data.status) && open.length > 0) {
    const ids = open.map((question) => question.id).join(', ');
    errors.push(`${path}: status ${parsed.data.status} with open questions (${ids})`);
  }
  const needsTech = parsed.data.size !== 'small';
  if (FROM_PLANNED.includes(parsed.data.status) && needsTech && !hasTech) {
    errors.push(
      `tools/workbench/backlog/${folder}/tech.md: missing (required from status planned on; template tools/workbench/shared/tech-template.md)`,
    );
  }
  return errors;
};

/**
 * `decisions[]` of `#mockup-config`: each Q badge's ID and the short title of its tooltip. State,
 * options and answer come from the plan (the board serves them as `questions.json`); a legacy
 * `status` or `answer` is ignored.
 */
const mockupConfigSchema = z.object({
  decisions: z
    .array(z.object({ id: z.string().regex(/^[A-Z]+\d+$/), title: z.string().optional() }))
    .optional(),
});

const MOCKUP_CONFIG = /<script\b[^>]*\bid=["']mockup-config["'][^>]*>([\s\S]*?)<\/script>/;

/**
 * Every `decisions[]` ID in the mockup's `#mockup-config` exists in the plan's
 * `## Open questions` or `## Decisions (settled)`. A mockup without `#mockup-config` (not on
 * the shell yet) has nothing to check.
 */
export const checkMockupDecisions = (
  folder: string,
  plan: string,
  mockupHtml: string,
): string[] => {
  const file = `tools/workbench/backlog/${folder}/mockup/index.html`;
  const match = MOCKUP_CONFIG.exec(mockupHtml);
  if (!match) return [];
  let json: unknown;
  try {
    json = JSON.parse(match[1]);
  } catch (error) {
    return [`${file}: #mockup-config is not valid JSON: ${String(error)}`];
  }
  const config = mockupConfigSchema.safeParse(json);
  if (!config.success) return [`${file}: #mockup-config: ${config.error.issues[0]?.message}`];
  const ids = new Set(readQuestions(plan).map((question) => question.id));
  const settledText = sectionTokens(plan, 'Decisions (settled)')
    .map((token) => token.raw)
    .join('');
  const errors: string[] = [];
  for (const decision of config.data.decisions ?? []) {
    if (ids.has(decision.id)) continue;
    if (new RegExp(`\\b${decision.id}\\b`).test(settledText)) continue;
    errors.push(
      `${file}: ${decision.id} is not in the plan's Open questions or Decisions (settled)`,
    );
  }
  return errors;
};
