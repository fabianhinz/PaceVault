import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'astro/zod';
import { Marked, marked, type Token, type Tokens } from 'marked';
import {
  checkPlan,
  parseFrontmatter,
  planBody,
  planFrontmatterSchema,
  readChecks,
  readQuestions,
  type CheckItem,
  type PlanFrontmatter,
  type Status,
  STATUSES,
} from '../../../../scripts/workbenchFrontmatter.ts';
import {
  fileItems,
  findingParts,
  parseOptions,
  questionParts,
  type Finding,
  type Option,
} from './writeBack.ts';

/** Server-side model of the board: what each card, dialog and form needs, read per request. */

export type Bucket = Status | 'inbox';

export const LABELS: Record<Bucket, string> = {
  inbox: 'Inbox',
  idea: 'Idea',
  exploring: 'Exploring',
  planned: 'Planned',
  ready: 'Ready',
  'in-dev': 'In dev',
  'in-review': 'In review',
  done: 'Done',
};

const RING = '<circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/>';
const fill = (dash: string) =>
  `${RING}<circle cx="7" cy="7" r="2.5" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="${dash} 100" transform="rotate(-90 7 7)"/>`;

/** Dashed ring → empty ring → 20/40/60/80 % fill → full. */
const ICON_SHAPES: Record<Bucket, string> = {
  inbox:
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

export const LIFTED = ['Real-data checks', 'Agent decisions', 'Open questions'] as const;

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

export type FeatureView = {
  folder: string;
  data: PlanFrontmatter;
  text: string;
  lines: { status: string };
  deps: string[];
  checks: CheckItem[];
  agent: CheckItem[];
  questions: QuestionView[];
  has: Record<'mockup' | 'plan' | 'tech' | 'review', boolean>;
  /** Statuses a drag may set: never done, and none that adds a `workbench:check` error (as `plan.setStatus`). */
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

/** One feature folder; `undefined` when its plan fails the schema (the banner names it). */
export const readFeature = (root: string, folder: string): FeatureView | undefined => {
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
  const findingsFile = join(dir, 'review', 'findings.md');
  let findings: FindingView[] = [];
  if (existsSync(findingsFile)) findings = findingsOf(readFileSync(findingsFile, 'utf8'));
  return {
    folder,
    data: parsed.data,
    text,
    lines: { status: frontmatterLine(text, 'status') },
    deps: parsed.data['depends-on'] ?? [],
    checks: readChecks(text, 'Real-data checks'),
    agent: readChecks(text, 'Agent decisions'),
    questions: questionsOf(text),
    has: {
      mockup: existsSync(join(dir, 'mockup', 'index.html')),
      plan: true,
      tech: existsSync(join(dir, 'tech.md')),
      review: existsSync(join(dir, 'review', 'index.html')),
    },
    moves: movesOf(folder, text, parsed.data.status, existsSync(join(dir, 'tech.md'))),
    findings,
    graph: readDeps(dir),
    planHtml: renderMarkdown(stripSections(planBody(text), LIFTED)),
  };
};

const movesOf = (folder: string, text: string, status: Status, hasTech: boolean): Status[] => {
  const line = frontmatterLine(text, 'status');
  const known = new Set(checkPlan(folder, text, hasTech));
  return STATUSES.filter((to) => {
    if (to === status || to === 'done') return false;
    const after = checkPlan(folder, text.replace(line, `status: ${to}`), hasTech);
    return after.every((error) => known.has(error));
  });
};

/** The first slot that exists: Mockup opens first, else the next one. */
export const firstSlot = (feature: FeatureView): Slot => {
  const slot = SLOTS.find((candidate) => feature.has[candidate]);
  if (slot === undefined) return 'plan';
  return slot;
};
