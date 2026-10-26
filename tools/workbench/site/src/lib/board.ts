import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { marked, type Tokens } from 'marked';
import { checkWorkbench, itemFolders } from '@scripts/check.ts';
import {
  DECISIONS,
  PLAN_CHECKS,
  isOpenCheck,
  planBody,
  readChecks,
  readQuestions,
  type CheckItem,
  type ItemType,
  type PlanFrontmatter,
  type Status,
  STATUSES,
} from '@scripts/frontmatter.ts';
import { addedCheckErrors, parsedFrontmatter } from '@scripts/checkRules.ts';
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
import { renderMarkdown, renderTech } from './markdown.ts';
import {
  componentsActualHtml,
  filesActualHtml,
  filesPlannedHtml,
  interfacesActualHtml,
  modulesActualHtml,
  readDeps,
  type Deps,
} from './techActual.ts';

const stripSections = ({
  body,
  headings,
}: {
  body: string;
  headings: readonly string[];
}): string => {
  let skipping = false;
  let kept = '';
  for (const token of marked.lexer(body)) {
    if (token.type === 'heading' && (token as Tokens.Heading).depth <= 2) {
      skipping = (token as Tokens.Heading).depth === 2 && headings.includes(token.text.trim());
    }
    if (!skipping) kept += token.raw;
  }
  return kept;
};

const LIFTED = [PLAN_CHECKS, 'Open questions'] as const;

/** The raw `key:` line of the frontmatter, as written (the stale-file guard sends it back). */
const frontmatterLine = ({ text, key }: { text: string; key: string }): string => {
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
  first: string;
  raw: string;
};

export type FindingView = Finding & { raw: string; heading: string };

type ItemView = {
  folder: string;
  frontmatter: PlanFrontmatter;
  statusLine: string;
  deps: string[];
  type: ItemType | undefined;
  areas: string[];
  checks: CheckItem[];
  decisions: CheckItem[];
  questions: QuestionView[];
  present: Record<'mockup' | 'plan' | 'tech' | 'review', boolean>;
  reviewDoc: boolean;
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

const findingsOf = (text: string): FindingView[] =>
  fileItems(text).flatMap((item) => {
    const parts = findingParts(item.first);
    if (!parts || item.heading === undefined) return [];
    return [{ ...parts, raw: item.raw, heading: item.heading }];
  });

const readIfExists = (file: string): string | undefined => {
  if (!existsSync(file)) return undefined;
  return readFileSync(file, 'utf8');
};

const reviewState = ({
  dir,
}: {
  dir: string;
}): {
  findings: FindingView[];
  decisions: CheckItem[];
  reviewDoc: boolean;
  reviewPresent: boolean;
} => {
  const findingsText = readIfExists(join(dir, 'review', 'findings.md'));
  let findings: FindingView[] = [];
  if (findingsText !== undefined) findings = findingsOf(findingsText);
  const decisionsText = readIfExists(join(dir, 'review', 'decisions.md'));
  let decisions: CheckItem[] = [];
  if (decisionsText !== undefined)
    decisions = readChecks({ text: decisionsText, heading: DECISIONS });
  const reviewDoc = existsSync(join(dir, 'review', 'index.html'));
  return {
    findings,
    decisions,
    reviewDoc,
    reviewPresent: reviewDoc || findingsText !== undefined || decisionsText !== undefined,
  };
};

export const readItem = ({
  root,
  folder,
}: {
  root: string;
  folder: string;
}): ItemView | undefined => {
  const dir = join(root, folder);
  const planFile = join(dir, 'plan.md');
  if (!existsSync(planFile)) return undefined;
  const text = readFileSync(planFile, 'utf8');
  const frontmatter = parsedFrontmatter({ path: planFile, plan: text }).frontmatter;
  if (frontmatter === undefined) return undefined;
  const review = reviewState({ dir });
  return {
    folder,
    frontmatter,
    statusLine: frontmatterLine({ text, key: 'status' }),
    deps: frontmatter['depends-on'] ?? [],
    type: frontmatter.type,
    areas: frontmatter.areas ?? [],
    checks: readChecks({ text, heading: PLAN_CHECKS }),
    decisions: review.decisions,
    questions: questionsOf(text),
    present: {
      mockup: existsSync(join(dir, 'mockup', 'index.html')),
      plan: true,
      tech: existsSync(join(dir, 'tech.md')),
      review: review.reviewPresent,
    },
    reviewDoc: review.reviewDoc,
    moves: movesOf({
      folder,
      text,
      status: frontmatter.status,
      techPresent: existsSync(join(dir, 'tech.md')),
    }),
    findings: review.findings,
    graph: readDeps(dir),
    planHtml: renderMarkdown(stripSections({ body: planBody(text), headings: LIFTED })),
  };
};

const movesOf = ({
  folder,
  text,
  status,
  techPresent,
}: {
  folder: string;
  text: string;
  status: Status;
  techPresent: boolean;
}): Status[] => {
  const line = frontmatterLine({ text, key: 'status' });
  return STATUSES.filter((to) => {
    if (to === status) return false;
    if (status === 'done' && to !== 'in-review') return false;
    if (to === 'done' && status !== 'in-review') return false;
    const after = text.replace(line, `status: ${to}`);
    return addedCheckErrors({ folder, before: text, after, techPresent }).length === 0;
  });
};

export type NeedsYouEntry = { folder: string; title: string; reason: Reason; count: number };

type NeedsYouInput = Pick<
  ItemView,
  'folder' | 'frontmatter' | 'questions' | 'decisions' | 'findings'
>;

const countsOf = (item: NeedsYouInput): Record<Reason, number> => ({
  questions: item.questions.filter((question) => question.open).length,
  decisions: item.decisions.filter(isOpenCheck).length,
  findings: item.findings.filter((finding) => finding.state === 'open').length,
});

export const needsYou = (items: NeedsYouInput[]): NeedsYouEntry[] =>
  REASONS.flatMap((reason) =>
    items.flatMap((item) => {
      if (item.frontmatter.status === 'done' && reason !== 'decisions') return [];
      const count = countsOf(item)[reason];
      if (count === 0) return [];
      return [{ folder: item.folder, title: item.frontmatter.title, reason, count }];
    }),
  );

export type BoardItem = ItemView & {
  techHtml: string | undefined;
  actualHtml: string | undefined;
};

export type BoardView = {
  items: BoardItem[];
  needs: NeedsYouEntry[];
  flaky: Item[];
  errors: string[];
  guideHtml: string;
};

const withTech = async ({ root, item }: { root: string; item: ItemView }): Promise<BoardItem> => {
  const tech = readIfExists(join(root, item.folder, 'tech.md'));
  if (tech === undefined) {
    return { ...item, techHtml: undefined, actualHtml: undefined };
  }
  const review = join(root, item.folder, 'review');
  const parts = [
    modulesActualHtml({ folder: item.folder, graph: item.graph }),
    filesPlannedHtml(tech) ?? '',
    filesActualHtml({ folder: item.folder, text: readIfExists(join(review, 'files.json')) }),
    await interfacesActualHtml({
      folder: item.folder,
      text: readIfExists(join(review, 'interfaces.md')),
    }),
    componentsActualHtml({
      folder: item.folder,
      mmd: readIfExists(join(review, 'components.mmd')),
      graph: item.graph,
    }),
  ];
  return { ...item, techHtml: await renderTech(tech), actualHtml: parts.join('') };
};

const guideOf = (guideFile: string): string => {
  const text = readIfExists(guideFile);
  if (text === undefined) return '<p>tools/workbench/GUIDE.md is missing.</p>';
  return renderMarkdown(text.replace(/^# .*\n/, ''));
};

export const readBoard = async ({
  root,
  guideFile,
}: {
  root: string;
  guideFile: string;
}): Promise<BoardView> => {
  const views = itemFolders(root)
    .flatMap((folder) => {
      const item = readItem({ root, folder });
      if (item === undefined) return [];
      return [item];
    })
    .sort(
      (a, b) =>
        a.frontmatter.created.localeCompare(b.frontmatter.created) ||
        a.folder.localeCompare(b.folder),
    );
  const items = await Promise.all(views.map((item) => withTech({ root, item })));
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
