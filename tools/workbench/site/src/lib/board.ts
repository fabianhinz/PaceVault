import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'astro/zod';
import { Marked, marked, type Token, type Tokens } from 'marked';
import { createHighlighter, type Highlighter } from 'shiki';
import { checkWorkbench, itemFolders } from '../../../scripts/check.ts';
import {
  DECISIONS,
  PLAN_CHECKS,
  checkPlan,
  isOpenCheck,
  parseFrontmatter,
  planBody,
  planFrontmatterSchema,
  readChecks,
  readQuestions,
  readTechEntries,
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
  type Item,
  type Option,
} from './writeBack.ts';
import { REASONS, type Reason } from './vocabulary.ts';

/**
 * Server-side model of the board: what each card, panel and form needs, read by `board.read`
 * (`readBoard`) on every request of the island.
 */

// board.spec.ts reads these through this module; the island imports vocabulary.ts directly.
export { REASON_TAB, TYPE_COLOR } from './vocabulary.ts';

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
  components: z.object({ nodes: z.number(), edges: z.number() }).optional(),
  astro: z.array(z.string()).optional(),
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

export type NeedsYouEntry = { folder: string; title: string; reason: Reason; count: number };

type NeedsYouInput = Pick<ItemView, 'folder' | 'data' | 'questions' | 'decisions' | 'findings'>;

const countsOf = (item: NeedsYouInput): Record<Reason, number> => ({
  questions: item.questions.filter((question) => question.open).length,
  decisions: item.decisions.filter(isOpenCheck).length,
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

/** The languages the Tech tab highlights (what tech.md files use); others render as plain code. */
const TECH_LANGS = ['ts', 'tsx', 'js', 'json', 'bash'];

let highlighting: Promise<Highlighter> | undefined = undefined;

/** One Shiki highlighter for the dev server's lifetime (creating one costs ~100 ms). */
const highlighter = () => {
  if (highlighting === undefined) {
    highlighting = createHighlighter({ themes: ['github-dark'], langs: TECH_LANGS });
  }
  return highlighting;
};

const plainCode = (code: string) => `<pre><code>${escapeHtml(code)}</code></pre>\n`;

/**
 * tech.md → HTML: GFM with raw HTML escaped (as `renderMarkdown`), headings as written (the Tech
 * tab walks `## Modules` to the next H2), code highlighted by Shiki `github-dark`, a language
 * Shiki has not loaded as plain escaped code, ```mermaid left as `<pre class="mermaid">` for
 * the browser to draw.
 */
export const renderTech = async (markdown: string): Promise<string> => {
  const shiki = await highlighter();
  const loaded = new Set(shiki.getLoadedLanguages());
  const md = new Marked({
    gfm: true,
    renderer: {
      code: (token) => {
        const lang = (token.lang ?? '').trim().split(/\s+/)[0];
        if (lang === 'mermaid') return `<pre class="mermaid">${escapeHtml(token.text)}</pre>\n`;
        if (lang === '' || !loaded.has(lang)) return plainCode(token.text);
        return `${shiki.codeToHtml(token.text, { lang, theme: 'github-dark' })}\n`;
      },
      html: (token) => {
        if (token.block) return `<p>${escapeHtml(token.text.trim())}</p>\n`;
        return escapeHtml(token.text);
      },
    },
    hooks: {
      postprocess: (html) =>
        html
          .replaceAll('<table>', '<div class="wb-table"><table>')
          .replaceAll('</table>', '</table></div>'),
    },
  });
  return sync(md.parse(markdown));
};

/** The label row of an Actual figure: the label, the file and its date. */
const actualBar = (path: string, generated: string | undefined) => {
  let date = '';
  if (generated !== undefined) date = ` · ${escapeHtml(generated)}`;
  return `<div class="tt-fig__bar"><span class="tt-fig__label">Actual</span><span class="tt-fig__path">${path}${date}</span></div>`;
};

/** An Actual side whose file is missing: the label row and the command that writes it (R21). */
const missingActual = (block: string, path: string, folder: string, command = 'deps') =>
  `<figure class="tt-fig tt-actual" data-block="${block}">${actualBar(path, undefined)}<p class="tt-placeholder">Run <code>vp run workbench:${command} -- ${escapeHtml(folder)}</code></p></figure>`;

/**
 * The Actual side of the Tech tab's Modules section: the actual import graph
 * (`review/deps.mmd`, `deps.json`) and the boundary check, or how to generate them.
 */
export const modulesActualHtml = (folder: string, graph: Deps | undefined): string => {
  if (graph === undefined) return missingActual('actual', 'review/deps.mmd', folder);
  const json = graph.json;
  let counts = '';
  let added = '';
  let missing = '';
  let check = '';
  if (json !== undefined) {
    counts = `<p class="tt-counts"><span>Drawn: ${json.nodes} modules · ${json.edges} imports</span></p>`;
    const astro = json.astro ?? [];
    if (astro.length > 0) {
      counts += `<p class="tt-counts"><span><code>.astro</code> files are not in the graph (dependency-cruiser does not parse them): ${astro.map((path) => `<code>${escapeHtml(path)}</code>`).join(' · ')}</span></p>`;
    }
    added = ` <b>(${json.added.length})</b>`;
    missing = ` <b>(${json.missing.length})</b>`;
    const violations = json.boundary.violations;
    const rules = escapeHtml(json.boundary.rules.join(', '));
    if (violations.length === 0) {
      check = `<p class="tt-check" data-block="check"><span class="tt-check__ok">✔</span><span><strong>Boundary check</strong> · <code>${rules}</code>: no violations (${json.boundary.modules} modules, ${json.boundary.dependencies} dependencies cruised)</span></p>`;
    } else {
      const list = violations
        .map((violation) => `${violation.rule}: ${violation.from} → ${violation.to}`)
        .join('; ');
      check = `<div class="tt-check" data-block="check"><span class="tt-check__err">✕</span><span><strong>Boundary check</strong> · ${violations.length} violation(s): ${escapeHtml(list)}</span></div>`;
    }
  }
  const figure = [
    '<figure class="tt-fig tt-actual" data-block="actual">',
    actualBar('review/deps.mmd', json?.generated),
    '<div data-graph="actual" data-title="Actual imports · review/deps.mmd"></div>',
    `<pre hidden data-mmd>${escapeHtml(graph.mmd)}</pre>`,
    counts,
    '<p class="tt-legend">',
    '<span><i class="tt-sw tt-sw--focus"></i>focus</span>',
    `<span><i class="tt-sw tt-sw--added"></i>imported, not planned${added}</span>`,
    `<span><i class="tt-sw tt-sw--missing"></i>planned, not in the graph${missing}</span>`,
    '</p></figure>',
  ];
  return figure.join('') + check;
};

/**
 * The Actual side of the Components section: `review/components.mmd` (the component tree of the
 * item's `.tsx` files, `vp run workbench:deps`), drawn by the client like the import graph.
 */
export const componentsActualHtml = (
  folder: string,
  mmd: string | undefined,
  graph: Deps | undefined,
): string => {
  if (mmd === undefined) return missingActual('components-actual', 'review/components.mmd', folder);
  let counts = '';
  const components = graph?.json?.components;
  if (components !== undefined) {
    counts = `<p class="tt-counts"><span>Drawn: ${components.nodes} components · ${components.edges} imports</span></p>`;
  }
  return [
    '<figure class="tt-fig tt-actual" data-block="components-actual">',
    actualBar('review/components.mmd', graph?.json?.generated),
    '<div data-graph="components" data-title="Actual components · review/components.mmd"></div>',
    `<pre hidden data-mmd>${escapeHtml(mmd)}</pre>`,
    counts,
    '<p class="tt-legend">',
    '<span><i class="tt-sw tt-sw--focus"></i>new</span>',
    '<span><i class="tt-sw tt-sw--mod"></i>changed</span>',
    '<span><i class="tt-sw tt-sw--missing"></i>imported</span>',
    '</p></figure>',
  ].join('');
};

const fileChangeSchema = z.object({
  path: z.string(),
  status: z.enum(['added', 'modified', 'deleted']),
});

const filesSchema = z.object({
  generated: z.string(),
  base: z.string(),
  ref: z.string(),
  planned: z.array(fileChangeSchema),
  notPlanned: z.array(fileChangeSchema),
  untouched: z.array(z.string()),
});

/**
 * A row of the Files section (R33): the path, its chip (A added/new, M modified/changed, D
 * deleted; none for an untouched planned path), a note (planned side) and a tag (actual side).
 */
type FileRow = {
  path: string;
  chip: 'A' | 'M' | 'D' | undefined;
  note: string;
  tag: 'not planned' | 'untouched' | undefined;
};

const CHIP_TITLES = { A: 'added', M: 'modified', D: 'deleted' } as const;

const STATUS_CHIPS = { added: 'A', modified: 'M', deleted: 'D' } as const;

/** Inline markdown of a note: escaped text, backticked spans as code. */
const inlineNote = (note: string) =>
  escapeHtml(note).replace(/`([^`]+)`/g, (_match, code: string) => `<code>${code}</code>`);

/** `a/b/c.ts` → [`a/b`, `c.ts`]; a folder path `a/b/` → [`a`, `b/`]; a root file → [``, name]. */
const splitPath = (path: string): [string, string] => {
  const folder = path.endsWith('/');
  const parts = path.replace(/\/+$/, '').split('/');
  let name = parts.pop() ?? path;
  if (folder) name = `${name}/`;
  return [parts.join('/'), name];
};

const compareRows = (a: FileRow, b: FileRow) => {
  const left = splitPath(a.path);
  const right = splitPath(b.path);
  return left[0].localeCompare(right[0]) || left[1].localeCompare(right[1]);
};

/**
 * The body of a Files frame (R30, R33), the same on both sides: a one-line summary, then one list
 * sorted by folder, then name, under muted folder headings (repo-relative, `repo root`); each row
 * the file name, the note, the tag and the chip in fixed columns. A deleted file is struck
 * through, an untouched one muted.
 */
const fileList = (summary: string, rows: FileRow[]) => {
  const out = [`<p class="tt-fsummary">${summary}</p>`];
  let current: string | undefined = undefined;
  for (const row of [...rows].sort(compareRows)) {
    const split = splitPath(row.path);
    if (split[0] !== current) {
      current = split[0];
      let label = `${split[0]}/`;
      if (split[0] === '') label = 'repo root';
      out.push(`<div class="tt-folder">${escapeHtml(label)}</div>`);
    }
    let chip = '<span class="tt-chip tt-chip--none"></span>';
    if (row.chip !== undefined) {
      chip = `<span class="tt-chip tt-chip--${row.chip}" title="${CHIP_TITLES[row.chip]}">${row.chip}</span>`;
    }
    let tag = '';
    if (row.tag !== undefined) tag = row.tag;
    let modifier = '';
    if (row.chip === 'D') modifier = ' tt-frow--deleted';
    if (row.tag === 'untouched') modifier = ' tt-frow--untouched';
    out.push(
      `<div class="tt-frow${modifier}" title="${escapeHtml(row.path)}"><span class="tt-frow__name">${escapeHtml(split[1])}</span><span class="tt-frow__note">${inlineNote(row.note)}</span><span class="tt-frow__tag">${tag}</span>${chip}</div>`,
    );
  }
  return `<div class="tt-files__body">${out.join('')}</div>`;
};

const filesCount = (count: number) => {
  if (count === 1) return '1 file';
  return `${count} files`;
};

/**
 * The Planned side of the Files section (R33): tech.md's `### New` (A) and `### Changed` (M) as
 * one list like the actual side, the note muted after the name; `undefined` without paths.
 */
export const filesPlannedHtml = (tech: string): string | undefined => {
  const entries = readTechEntries(tech);
  if (entries.added.length === 0 && entries.changed.length === 0) return undefined;
  const rows = (list: { path: string; note: string }[], chip: 'A' | 'M'): FileRow[] =>
    list.map((entry) => ({ path: entry.path, chip, note: entry.note, tag: undefined }));
  const all = [...rows(entries.added, 'A'), ...rows(entries.changed, 'M')];
  return [
    '<figure class="tt-fig tt-files" data-block="files-planned">',
    '<div class="tt-fig__bar"><span class="tt-fig__label">Planned</span><span class="tt-fig__path">from tech.md</span></div>',
    fileList(filesCount(all.length), all),
    '</figure>',
  ].join('');
};

/**
 * The Actual side of the Files section: `review/files.json` (`vp run workbench:deps`) as one list
 * like the planned side (R33): the changed files with their git status chip, unplanned ones tagged
 * "not planned", planned paths nobody touched muted and tagged "untouched"; the base in the label
 * row; the command when the file is missing or unreadable.
 */
export const filesActualHtml = (folder: string, text: string | undefined): string => {
  const missing = missingActual('files-actual', 'review/files.json', folder);
  if (text === undefined) return missing;
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return missing;
  }
  const parsed = filesSchema.safeParse(raw);
  if (!parsed.success) return missing;
  const files = parsed.data;
  const rows = (
    list: { path: string; status: keyof typeof STATUS_CHIPS }[],
    tag: FileRow['tag'],
  ): FileRow[] =>
    list.map((entry) => ({ path: entry.path, chip: STATUS_CHIPS[entry.status], note: '', tag }));
  const all = [
    ...rows(files.planned, undefined),
    ...rows(files.notPlanned, 'not planned'),
    ...files.untouched.map((path): FileRow => ({
      path,
      chip: undefined,
      note: '',
      tag: 'untouched',
    })),
  ];
  const changed = files.planned.length + files.notPlanned.length;
  const summary = `${filesCount(changed)} · ${files.notPlanned.length} not planned · ${files.untouched.length} untouched · base ${files.base.slice(0, 7)}`;
  const base = `${files.generated} · ${files.ref}`;
  return [
    '<figure class="tt-fig tt-files" data-block="files-actual">',
    actualBar('review/files.json', base),
    fileList(summary, all),
    '</figure>',
  ].join('');
};

/**
 * The Actual side of the Tech tab's Interfaces section: the ```ts blocks of `review/interfaces.md`
 * (`vp run workbench:deps`) highlighted as in tech.md, in a figure labelled with the file and its
 * date, with the planned / not planned file counts (R23: a not planned file's path line ends in
 * `· not planned`) and the planned paths nobody changed; the command before the script ran.
 */
export const interfacesActualHtml = async (
  folder: string,
  text: string | undefined,
): Promise<string> => {
  if (text === undefined) return missingActual('interfaces-actual', 'review/interfaces.md', folder);
  const tokens = marked.lexer(text);
  const blocks = tokens
    .filter((token): token is Tokens.Code => token.type === 'code')
    .map((token) => `\`\`\`${token.lang ?? ''}\n${token.text}\n\`\`\``);
  const missing = (sectionTokensOf(tokens, 'Missing') ?? [])
    .filter((token): token is Tokens.List => token.type === 'list')
    .flatMap((token) =>
      token.items.map((entry) => /`([^`]+)`/.exec(entry.text)?.[1] ?? entry.text),
    );
  let generated: string | undefined = undefined;
  const date = /Generated (\d{4}-\d{2}-\d{2})/.exec(text);
  if (date !== null) generated = date[1];
  let countsHtml = '';
  const counts = /(\d+) planned, (\d+) not planned/.exec(text);
  if (counts !== null) {
    countsHtml = `<p class="tt-counts"><span>Changed TypeScript files: ${counts[1]} planned · ${counts[2]} not planned</span></p>`;
  }
  let missingHtml = '';
  if (missing.length > 0) {
    missingHtml = `<p class="tt-counts"><span>Planned, not changed: ${missing.map((path) => `<code>${escapeHtml(path)}</code>`).join(' · ')}</span></p>`;
  }
  return [
    '<figure class="tt-fig tt-interfaces" data-block="interfaces-actual">',
    actualBar('review/interfaces.md', generated),
    `<div class="tt-code">${await renderTech(blocks.join('\n\n'))}</div>`,
    countsHtml,
    missingHtml,
    '</figure>',
  ].join('');
};

/** The tokens under `## <heading>` up to the next H2; `undefined` when there is no such heading. */
const sectionTokensOf = (tokens: Token[], heading: string): Token[] | undefined => {
  const start = tokens.findIndex(
    (token) =>
      token.type === 'heading' &&
      (token as Tokens.Heading).depth === 2 &&
      token.text.trim() === heading,
  );
  if (start === -1) return undefined;
  const rest = tokens.slice(start + 1);
  const end = rest.findIndex(
    (token) => token.type === 'heading' && (token as Tokens.Heading).depth <= 2,
  );
  if (end === -1) return rest;
  return rest.slice(0, end);
};

/**
 * An item with its Tech tab: `techHtml` from tech.md and `actualHtml`, every Actual side of the
 * one Planned | Actual switch (import graph, changed files, interfaces, component tree).
 */
export type BoardItem = ItemView & {
  techHtml: string | undefined;
  actualHtml: string | undefined;
};

export type BoardView = {
  items: BoardItem[];
  needs: NeedsYouEntry[];
  /** flaky.md entries (`- \`<test>\` · …`). */
  flaky: Item[];
  /** `workbench:check` errors (the red banner). */
  errors: string[];
  /** tools/workbench/GUIDE.md without its H1 (the panel title). */
  guideHtml: string;
};

const techOf = async (root: string, item: ItemView): Promise<BoardItem> => {
  const tech = readIfExists(join(root, item.folder, 'tech.md'));
  if (tech === undefined) {
    return { ...item, techHtml: undefined, actualHtml: undefined };
  }
  const review = join(root, item.folder, 'review');
  const parts = [
    modulesActualHtml(item.folder, item.graph),
    filesPlannedHtml(tech) ?? '',
    filesActualHtml(item.folder, readIfExists(join(review, 'files.json'))),
    await interfacesActualHtml(item.folder, readIfExists(join(review, 'interfaces.md'))),
    componentsActualHtml(item.folder, readIfExists(join(review, 'components.mmd')), item.graph),
  ];
  return { ...item, techHtml: await renderTech(tech), actualHtml: parts.join('') };
};

const guideOf = (guideFile: string): string => {
  const text = readIfExists(guideFile);
  if (text === undefined) return '<p>tools/workbench/GUIDE.md is missing.</p>';
  return renderMarkdown(text.replace(/^# .*\n/, ''));
};

/**
 * The whole board, read from the files: items in created, then folder order (a plan that fails
 * the schema is left out and named in `errors`), Needs you, flaky entries and the guide.
 */
export const readBoard = async (root: string, guideFile: string): Promise<BoardView> => {
  const views = itemFolders(root)
    .flatMap((folder) => {
      const item = readItem(root, folder);
      if (item === undefined) return [];
      return [item];
    })
    .sort(
      (a, b) => a.data.created.localeCompare(b.data.created) || a.folder.localeCompare(b.folder),
    );
  const items = await Promise.all(views.map((item) => techOf(root, item)));
  let flaky: Item[] = [];
  const flakyText = readIfExists(join(root, 'flaky.md'));
  if (flakyText !== undefined) {
    flaky = fileItems(flakyText).filter((entry) => entry.first.startsWith('- `'));
  }
  return {
    items,
    needs: needsYou(items),
    flaky,
    errors: checkWorkbench(root),
    guideHtml: guideOf(guideFile),
  };
};
