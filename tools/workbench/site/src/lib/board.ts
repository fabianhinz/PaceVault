import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'astro/zod';
import { Marked, marked, type Token, type Tokens } from 'marked';
import {
  DECISIONS,
  PLAN_CHECKS,
  checkPlan,
  parseFrontmatter,
  planBody,
  planFrontmatterSchema,
  readChecks,
  readQuestions,
  type CheckItem,
  type ItemType,
  type PlanFrontmatter,
  type Status,
  STATUSES,
} from '../../../scripts/frontmatter.ts';
import {
  fileItems,
  findingParts,
  parseOptions,
  questionParts,
  type Finding,
  type Option,
} from './writeBack.ts';

/** Server-side model of the board: what each card, dialog and form needs, read per request. */

export type Bucket = Status | 'needs-you';

export const LABELS: Record<Bucket, string> = {
  'needs-you': 'Needs you',
  idea: 'Idea',
  exploring: 'Exploring',
  planned: 'Planned',
  ready: 'Ready',
  'in-dev': 'In dev',
  'in-review': 'In review',
  done: 'Done',
};

/** Fixed colours of the item types (card and dialog icon): feature sky, bug rose, chore lime. */
export const TYPE_COLOR: Record<ItemType, string> = {
  feature: '#38bdf8',
  bug: '#fb7185',
  chore: '#a3e635',
};

const RING = '<circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/>';
const fill = (dash: string) =>
  `${RING}<circle cx="7" cy="7" r="2.5" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="${dash} 100" transform="rotate(-90 7 7)"/>`;

/** Dashed ring → empty ring → 20/40/60/80 % fill → full. */
const ICON_SHAPES: Record<Bucket, string> = {
  'needs-you':
    '<circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="1.4 1.75"/>',
  idea: RING,
  exploring: fill('3.14'),
  planned: fill('6.28'),
  ready: fill('9.42'),
  'in-dev': fill('12.57'),
  'in-review': fill('15.71'),
  done: '<circle cx="7" cy="7" r="6.75" fill="currentColor"/>',
};

export const statusIcon = (bucket: Bucket) =>
  `<svg class="wb-si wb-si--${bucket}" viewBox="0 0 14 14" aria-hidden="true">${ICON_SHAPES[bucket]}</svg>`;

export const SLOTS = ['mockup', 'plan', 'tech', 'review'] as const;
export type Slot = (typeof SLOTS)[number];
export const SLOT_LABEL: Record<Slot, string> = {
  mockup: 'Mockup',
  plan: 'Plan',
  tech: 'Tech',
  review: 'Review',
};
export const SLOT_MISSING: Record<Slot, string> = {
  mockup: 'No mockup yet',
  plan: 'No plan yet',
  tech: 'No tech.md yet',
  review: 'No review yet',
};

export const escapeHtml = (text: string) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const sync = (out: string | Promise<string>): string => {
  if (typeof out !== 'string') throw new Error('marked returned a promise (async extension?)');
  return out;
};

/**
 * Plan markdown → HTML: GFM, headings shifted down by one (the dialog title is the h2), the
 * first H1 as `.wb-md__lead`, raw HTML escaped, tables in a scrolling `.wb-table` box.
 */
export const renderMarkdown = (markdown: string): string => {
  const leads = new WeakSet<Token>();
  let leadTaken = false;
  const md: Marked = new Marked({
    gfm: true,
    walkTokens: (token) => {
      if (token.type !== 'heading') return;
      const heading = token as Tokens.Heading;
      if (heading.depth === 1 && !leadTaken) {
        leads.add(token);
        leadTaken = true;
      }
      heading.depth = Math.min(heading.depth + 1, 6);
    },
    renderer: {
      heading: (token): string | false => {
        if (!leads.has(token)) return false;
        return `<p class="wb-md__lead">${sync(md.parseInline(token.text))}</p>\n`;
      },
      html: (token) => {
        if (token.block) return `<p>${escapeHtml(token.text.trim())}</p>\n`;
        return escapeHtml(token.text);
      },
    },
    // A literal `<table>` can only come from the table renderer: raw HTML and code are escaped.
    hooks: {
      postprocess: (html) =>
        html
          .replaceAll('<table>', '<div class="wb-table"><table>')
          .replaceAll('</table>', '</table></div>'),
    },
  });
  return sync(md.parse(markdown));
};

const inlineMd = new Marked({ renderer: { html: (token) => escapeHtml(token.text) } });

/** Inline markdown (check items, questions, findings) with the same escaping. */
export const inlineMarkdown = (text: string): string => sync(inlineMd.parseInline(text));

/** The plan body without the sections lifted into the boxes at the top of the Plan tab. */
export const stripSections = (body: string, headings: readonly string[]): string => {
  let skipping = false;
  let out = '';
  for (const token of marked.lexer(body)) {
    if (token.type === 'heading' && (token as Tokens.Heading).depth <= 2) {
      skipping = (token as Tokens.Heading).depth === 2 && headings.includes(token.text.trim());
    }
    if (!skipping) out += token.raw;
  }
  return out;
};

export const LIFTED = [PLAN_CHECKS, 'Open questions'] as const;

const depsSchema = z.object({
  generated: z.string(),
  nodes: z.number(),
  edges: z.number(),
  added: z.array(z.string()),
  missing: z.array(z.string()),
  boundary: z.object({
    rules: z.array(z.string()),
    violations: z.array(z.object({ rule: z.string(), from: z.string(), to: z.string() })),
    modules: z.number(),
    dependencies: z.number(),
  }),
});

export type Deps = { mmd: string; json: z.infer<typeof depsSchema> | undefined };

/** `review/deps.mmd` and `deps.json` from `vp run workbench:deps`; `undefined` before review. */
export const readDeps = (folder: string): Deps | undefined => {
  const mmd = join(folder, 'review', 'deps.mmd');
  if (!existsSync(mmd)) return undefined;
  let json: Deps['json'] = undefined;
  const jsonFile = join(folder, 'review', 'deps.json');
  if (existsSync(jsonFile)) {
    try {
      const parsed = depsSchema.safeParse(JSON.parse(readFileSync(jsonFile, 'utf8')));
      if (parsed.success) json = parsed.data;
    } catch {
      json = undefined;
    }
  }
  return { mmd: readFileSync(mmd, 'utf8'), json };
};

/** The raw `key:` line of the frontmatter, as written (the stale-file guard sends it back). */
const frontmatterLine = (text: string, key: string): string => {
  const lines = text.split('\n');
  const end = lines.indexOf('---', 1);
  if (lines[0] !== '---' || end === -1) return '';
  const line = lines.slice(1, end).find((candidate) => candidate.startsWith(`${key}:`));
  if (line === undefined) return '';
  return line;
};

export type QuestionView = {
  id: string;
  open: boolean;
  date: string | undefined;
  body: string;
  question: string;
  options: Option[];
  comments: string[];
  /** The first line and the whole item, as in the file. */
  first: string;
  raw: string;
};

export type FindingView = Finding & { raw: string; heading: string };

export type ItemView = {
  folder: string;
  data: PlanFrontmatter;
  text: string;
  lines: { status: string };
  deps: string[];
  /** `undefined` only for done items from before the type/areas split (R5). */
  type: ItemType | undefined;
  areas: string[];
  checks: CheckItem[];
  /** `review/decisions.md` › `## Agent decisions`. */
  decisions: CheckItem[];
  questions: QuestionView[];
  /** `review`: a review doc, findings or agent decisions exist (Q8). */
  has: Record<'mockup' | 'plan' | 'tech' | 'review', boolean>;
  /** `review/index.html` exists: the Review tab shows it in an iframe (Q17). */
  reviewDoc: boolean;
  /** Statuses a drag may set: done only from in-review, and none that adds a `workbench:check` error (as `plan.setStatus`). */
  moves: Status[];
  findings: FindingView[];
  graph: Deps | undefined;
  planHtml: string;
};

const questionsOf = (text: string): QuestionView[] =>
  readQuestions(text).flatMap((question) => {
    const lines = question.raw.split('\n');
    const parts = questionParts(lines[0]);
    if (!parts) return [];
    const parsed = parseOptions(parts.body);
    const comments = lines
      .slice(1)
      .map((line) => /^\s+- (.*)$/.exec(line))
      .flatMap((match) => {
        if (!match) return [];
        return [match[1]];
      });
    return [
      {
        id: parts.id,
        open: parts.state === 'open',
        date: parts.date,
        body: parts.body,
        question: parsed.question,
        options: parsed.options,
        comments,
        first: lines[0],
        raw: question.raw,
      },
    ];
  });

export const findingsOf = (text: string): FindingView[] =>
  fileItems(text).flatMap((item) => {
    const parts = findingParts(item.first);
    if (!parts || item.heading === undefined) return [];
    return [{ ...parts, raw: item.raw, heading: item.heading }];
  });

const readIfExists = (file: string): string | undefined => {
  if (!existsSync(file)) return undefined;
  return readFileSync(file, 'utf8');
};

/** One item folder; `undefined` when its plan fails the schema (the banner names it). */
export const readItem = (root: string, folder: string): ItemView | undefined => {
  const dir = join(root, folder);
  const planFile = join(dir, 'plan.md');
  if (!existsSync(planFile)) return undefined;
  const text = readFileSync(planFile, 'utf8');
  let raw: unknown;
  try {
    raw = parseFrontmatter(text);
  } catch {
    return undefined;
  }
  const parsed = planFrontmatterSchema.safeParse(raw);
  if (!parsed.success) return undefined;
  const findingsText = readIfExists(join(dir, 'review', 'findings.md'));
  let findings: FindingView[] = [];
  if (findingsText !== undefined) findings = findingsOf(findingsText);
  const decisionsText = readIfExists(join(dir, 'review', 'decisions.md'));
  let decisions: CheckItem[] = [];
  if (decisionsText !== undefined) decisions = readChecks(decisionsText, DECISIONS);
  const reviewDoc = existsSync(join(dir, 'review', 'index.html'));
  return {
    folder,
    data: parsed.data,
    text,
    lines: { status: frontmatterLine(text, 'status') },
    deps: parsed.data['depends-on'] ?? [],
    type: parsed.data.type,
    areas: parsed.data.areas ?? [],
    checks: readChecks(text, PLAN_CHECKS),
    decisions,
    questions: questionsOf(text),
    has: {
      mockup: existsSync(join(dir, 'mockup', 'index.html')),
      plan: true,
      tech: existsSync(join(dir, 'tech.md')),
      review: reviewDoc || findingsText !== undefined || decisionsText !== undefined,
    },
    reviewDoc,
    moves: movesOf(folder, text, parsed.data.status, existsSync(join(dir, 'tech.md'))),
    findings,
    graph: readDeps(dir),
    planHtml: renderMarkdown(stripSections(planBody(text), LIFTED)),
  };
};

/** Done is a target only for in-review cards; a done card only moves back to in-review. */
const movesOf = (folder: string, text: string, status: Status, hasTech: boolean): Status[] => {
  const line = frontmatterLine(text, 'status');
  const known = new Set(checkPlan(folder, text, hasTech));
  return STATUSES.filter((to) => {
    if (to === status) return false;
    if (status === 'done' && to !== 'in-review') return false;
    if (to === 'done' && status !== 'in-review') return false;
    const after = checkPlan(folder, text.replace(line, `status: ${to}`), hasTech);
    return after.every((error) => known.has(error));
  });
};

/** The first slot that exists: Mockup opens first, else the next one. */
export const firstSlot = (item: ItemView): Slot => {
  const slot = SLOTS.find((candidate) => item.has[candidate]);
  if (slot === undefined) return 'plan';
  return slot;
};

/** Why a card waits on the owner (Q2), in the order of the Needs you groups; in-review cards have their own column (R1). */
export const REASONS = ['questions', 'decisions', 'findings'] as const;
export type Reason = (typeof REASONS)[number];

export const REASON_LABEL: Record<Reason, string> = {
  questions: 'Open questions',
  decisions: 'Agent decisions',
  findings: 'Open findings',
};

/** The dialog tab an entry opens on (Q8): questions live in the Plan, the rest in the Review. */
export const REASON_TAB: Record<Reason, Slot> = {
  questions: 'plan',
  decisions: 'review',
  findings: 'review',
};

export type NeedsYouEntry = { folder: string; title: string; reason: Reason; count: number };

type NeedsYouInput = Pick<ItemView, 'folder' | 'data' | 'questions' | 'decisions' | 'findings'>;

const countsOf = (item: NeedsYouInput): Record<Reason, number> => ({
  questions: item.questions.filter((question) => question.open).length,
  decisions: item.decisions.filter((decision) => !decision.checked).length,
  findings: item.findings.filter((finding) => finding.state === 'open').length,
});

/**
 * The cards waiting on the owner, one entry per item and reason, grouped by reason in
 * `REASONS` order and in the given item order within a group. A done item only counts for
 * unticked agent decisions (Q7).
 */
export const needsYou = (items: NeedsYouInput[]): NeedsYouEntry[] =>
  REASONS.flatMap((reason) =>
    items.flatMap((item) => {
      if (item.data.status === 'done' && reason !== 'decisions') return [];
      const count = countsOf(item)[reason];
      if (count === 0) return [];
      return [{ folder: item.folder, title: item.data.title, reason, count }];
    }),
  );
