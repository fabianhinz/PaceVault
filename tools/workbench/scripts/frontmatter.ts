import { marked, type Token, type Tokens } from 'marked';
import { parse } from 'yaml';
import { z } from 'zod';

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

export const PLAN_CHECKS = 'Real-data checks';

export const DECISIONS = 'Agent decisions';

export type CheckHeading = typeof PLAN_CHECKS | typeof DECISIONS;

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const ITEM_TYPES = ['feature', 'bug', 'chore'] as const;

export type ItemType = (typeof ITEM_TYPES)[number];

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

export type Area = (typeof AREAS)[number];

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
    type: z
      .enum(ITEM_TYPES, { error: () => `type must be one of: ${ITEM_TYPES.join(', ')}` })
      .optional(),
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
    size: z.enum(['small'], { error: () => 'size must be: small' }).optional(),
  })
  .superRefine((front, ctx) => {
    // Done items from before the type/areas split stay valid without them.
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

export const planBody = (text: string): string => {
  const match = FRONTMATTER.exec(text);
  if (!match) return text;
  return text.slice(match[0].length);
};

export const parseFrontmatter = (text: string): unknown => {
  const match = FRONTMATTER.exec(text);
  if (!match) return undefined;
  return parse(match[1]);
};

export const readStatus = (text: string): string | undefined => {
  const match = FRONTMATTER.exec(text);
  if (!match) return undefined;
  const line = /^status:[ \t]*([^\s#]*)/m.exec(match[1]);
  if (!line || line[1] === '') return undefined;
  return line[1].replace(/^["']|["']$/g, '');
};

export const readSize = (text: string): string | undefined => {
  const match = FRONTMATTER.exec(text);
  if (!match) return undefined;
  const line = /^size:[ \t]*([^\s#]*)/m.exec(match[1]);
  if (!line) return undefined;
  return line[1].replace(/^["']|["']$/g, '');
};

export const sectionTokens = ({ text, heading }: { text: string; heading: string }): Token[] => {
  const tokens = marked.lexer(planBody(text));
  const sectionContent: Token[] = [];
  let inside = false;
  for (const token of tokens) {
    if (token.type === 'heading' && (token as Tokens.Heading).depth <= 2) {
      inside = (token as Tokens.Heading).depth === 2 && token.text.trim() === heading;
      continue;
    }
    if (inside) sectionContent.push(token);
  }
  return sectionContent;
};

export const listItems = (tokens: Token[]): Tokens.ListItem[] =>
  tokens.flatMap((token) => {
    if (token.type !== 'list') return [];
    return (token as Tokens.List).items;
  });

export type CheckItem = { text: string; checked: boolean; superseded: boolean; raw: string };

const rawOf = (item: Tokens.ListItem) => item.raw.replace(/\s+$/, '');

/** `[~] ` at the start of a list item's text: GFM reads it as a plain item, not a task. */
const SUPERSEDED_MARK = /^\[~\]\s+/;

export const SUPERSEDED_BY = /\bSuperseded by:\s*\S/;

export const readChecks = ({
  text,
  heading,
}: {
  text: string;
  heading: CheckHeading;
}): CheckItem[] =>
  listItems(sectionTokens({ text, heading })).flatMap((item): CheckItem[] => {
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

export const isOpenCheck = (item: CheckItem): boolean => !item.checked && !item.superseded;

const DECISION_KINDS = ['behaviour', 'look', 'scope'] as const;

const DECISION_KIND = new RegExp(`^\\*\\*\\((?:${DECISION_KINDS.join('|')})\\)\\s`);

/** Items already in `before` (written before the rule) and superseded items are not new decisions. */
export const decisionsWithoutKind = ({
  before,
  after,
}: {
  before: string | undefined;
  after: string;
}): string[] => {
  let known = new Set<string>();
  if (before !== undefined)
    known = new Set(readChecks({ text: before, heading: DECISIONS }).map((item) => item.raw));
  return readChecks({ text: after, heading: DECISIONS })
    .filter((item) => !item.superseded && !known.has(item.raw))
    .filter((item) => !DECISION_KIND.test(item.text))
    .map((item) => item.raw.split('\n')[0]);
};

type Question = {
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

export const readQuestions = (text: string): Question[] => {
  const questions: Question[] = [];
  for (const item of listItems(sectionTokens({ text, heading: 'Open questions' }))) {
    const match = QUESTION.exec(item.text.trim());
    if (!match) continue;
    let state: Question['state'] = 'open';
    if (match[2] === 'answered') state = 'answered';
    const question: Question = { id: match[1], state, text: match[4].trim(), raw: rawOf(item) };
    if (match[3]) question.date = match[3];
    const quote = OWNER_QUOTE.exec(match[4]);
    if (quote) question.quote = quote[1];
    questions.push(question);
  }
  return questions;
};
