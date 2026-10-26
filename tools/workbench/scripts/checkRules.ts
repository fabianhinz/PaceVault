import { marked, type Tokens } from 'marked';
import { z } from 'zod';
import {
  DECISIONS,
  SUPERSEDED_BY,
  parseFrontmatter,
  planBody,
  planFrontmatterSchema,
  readQuestions,
  sectionTokens,
  type PlanFrontmatter,
  type Status,
} from './frontmatter.ts';

const PAST_READY: readonly Status[] = ['ready', 'in-dev', 'in-review', 'done'];

const FROM_PLANNED: readonly Status[] = ['planned', ...PAST_READY];

export const parsedFrontmatter = ({
  path,
  plan,
}: {
  path: string;
  plan: string;
}): { errors: string[]; frontmatter: PlanFrontmatter | undefined } => {
  let frontmatterYaml: unknown;
  try {
    frontmatterYaml = parseFrontmatter(plan);
  } catch (error) {
    return {
      errors: [`${path}: invalid frontmatter YAML: ${String(error)}`],
      frontmatter: undefined,
    };
  }
  if (frontmatterYaml === undefined) {
    return { errors: [`${path}: no frontmatter block (--- … ---)`], frontmatter: undefined };
  }
  const parsed = planFrontmatterSchema.safeParse(frontmatterYaml);
  if (!parsed.success) {
    return {
      errors: parsed.error.issues.map(
        (issue) => `${path}: ${issue.path.join('.') || '(root)'}: ${issue.message}`,
      ),
      frontmatter: undefined,
    };
  }
  return { errors: [], frontmatter: parsed.data };
};

const questionErrors = ({
  path,
  questions,
  status,
}: {
  path: string;
  questions: ReturnType<typeof readQuestions>;
  status: Status;
}): string[] => {
  const errors: string[] = [];
  for (const question of questions) {
    if (question.state === 'answered' && question.quote === undefined) {
      errors.push(`${path}: ${question.id} is answered without the owner's words (Owner: "…")`);
    }
  }
  const open = questions.filter((question) => question.state === 'open');
  if (PAST_READY.includes(status) && open.length > 0) {
    const ids = open.map((question) => question.id).join(', ');
    errors.push(`${path}: status ${status} with open questions (${ids})`);
  }
  return errors;
};

export const checkPlan = ({
  folder,
  plan,
  techPresent,
}: {
  folder: string;
  plan: string;
  techPresent: boolean;
}): string[] => {
  const path = `tools/workbench/backlog/${folder}/plan.md`;
  const parsed = parsedFrontmatter({ path, plan });
  if (parsed.frontmatter === undefined) return parsed.errors;
  const frontmatter = parsed.frontmatter;
  const errors = questionErrors({
    path,
    questions: readQuestions(plan),
    status: frontmatter.status,
  });
  const needsTech = frontmatter.size !== 'small';
  if (FROM_PLANNED.includes(frontmatter.status) && needsTech && !techPresent) {
    errors.push(
      `tools/workbench/backlog/${folder}/tech.md: missing (required from status planned on; template tools/workbench/shared/tech-template.md)`,
    );
  }
  return errors;
};

/**
 * State, options and answer come from the plan (the board serves them as `questions.json`); a
 * legacy `status` or `answer` is ignored.
 */
const mockupConfigSchema = z.object({
  decisions: z
    .array(z.object({ id: z.string().regex(/^[A-Z]+\d+$/), title: z.string().optional() }))
    .optional(),
});

const MOCKUP_CONFIG = /<script\b[^>]*\bid=["']mockup-config["'][^>]*>([\s\S]*?)<\/script>/;

export const checkMockupDecisions = ({
  folder,
  plan,
  mockupHtml,
}: {
  folder: string;
  plan: string;
  mockupHtml: string;
}): string[] => {
  const file = `tools/workbench/backlog/${folder}/mockup/index.html`;
  const match = MOCKUP_CONFIG.exec(mockupHtml);
  if (!match) return [];
  let mockupConfigJson: unknown;
  try {
    mockupConfigJson = JSON.parse(match[1]);
  } catch (error) {
    return [`${file}: #mockup-config is not valid JSON: ${String(error)}`];
  }
  const config = mockupConfigSchema.safeParse(mockupConfigJson);
  if (!config.success) return [`${file}: #mockup-config: ${config.error.issues[0]?.message}`];
  const ids = new Set(readQuestions(plan).map((question) => question.id));
  const settledText = sectionTokens({ text: plan, heading: 'Decisions (settled)' })
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

export const addedCheckErrors = ({
  folder,
  before,
  after,
  techPresent,
}: {
  folder: string;
  before: string;
  after: string;
  techPresent: boolean;
}): string[] => {
  const known = new Set(checkPlan({ folder, plan: before, techPresent }));
  return checkPlan({ folder, plan: after, techPresent }).filter((error) => !known.has(error));
};

const DECISION = /^\*\*[\s\S]+?\*\*[\s\S]*?\bAgent:\s*\S/;

const DECISION_FORMAT = '- [ ] **(<kind>) <decision>.** Agent: <reason>';

const decisionItemError = ({
  path,
  item,
}: {
  path: string;
  item: Tokens.ListItem;
}): string | undefined => {
  const itemText = item.text.trim();
  const first = item.raw.split('\n')[0];
  if (item.task && DECISION.test(itemText)) return undefined;
  if (/^\[~\]\s/.test(itemText) && DECISION.test(itemText.replace(/^\[~\]\s+/, ''))) {
    if (SUPERSEDED_BY.test(itemText)) return undefined;
    return `${path}: "${first}" is superseded without "Superseded by: <pointer>"`;
  }
  return `${path}: "${first}" is not "${DECISION_FORMAT}"`;
};

/**
 * The kind (`**(behaviour) …**`) is not checked here: lines written before the rule stay valid,
 * and `statusGuard.ts` requires it on every decision an agent adds.
 */
export const checkDecisions = ({ folder, text }: { folder: string; text: string }): string[] => {
  const path = `tools/workbench/backlog/${folder}/review/decisions.md`;
  const errors: string[] = [];
  let inside = false;
  let headingFound = false;
  for (const token of marked.lexer(planBody(text))) {
    if (token.type === 'heading' && (token as Tokens.Heading).depth <= 2) {
      inside = (token as Tokens.Heading).depth === 2 && token.text.trim() === DECISIONS;
      if (inside) headingFound = true;
      continue;
    }
    if (!inside || token.type === 'space') continue;
    if (token.type !== 'list') {
      errors.push(`${path}: only "${DECISION_FORMAT}" items go under ## ${DECISIONS}`);
      continue;
    }
    for (const item of (token as Tokens.List).items) {
      const itemError = decisionItemError({ path, item });
      if (itemError !== undefined) errors.push(itemError);
    }
  }
  if (!headingFound) errors.unshift(`${path}: no ## ${DECISIONS} heading`);
  return errors;
};
