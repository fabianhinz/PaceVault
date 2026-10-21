import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked, type Tokens } from 'marked';
import {
  DECISIONS,
  SUPERSEDED_BY,
  checkMockupDecisions,
  checkPlan,
  planBody,
} from './frontmatter.ts';

/**
 * `vp run plans:check` (in tools/workbench; the root `vp run workbench:check` runs it after
 * `astro check`): every plan rule and every mockup ↔ plan mismatch of the backlog, all of them,
 * not only the first. The board shows the
 * same list as a banner, because a broken plan otherwise leaves the dev server on stale content.
 */

/** The backlog the board reads: `WB_ROOT` (a fixture folder in tests) or `tools/workbench/backlog/`. */
export const workbenchRoot = () =>
  resolve(process.env.WB_ROOT ?? fileURLToPath(new URL('../backlog', import.meta.url)));

/** True when a file sits anywhere below `dir` (git does not track empty folders). */
const hasFiles = (dir: string): boolean =>
  readdirSync(dir, { withFileTypes: true }).some(
    (entry) => !entry.isDirectory() || hasFiles(join(dir, entry.name)),
  );

/**
 * Item folders: every directory except `_`/`.` names, and except folders
 * without any file (a leftover empty folder is no item).
 */
export const itemFolders = (root: string): string[] =>
  readdirSync(root)
    .filter((name) => !name.startsWith('_') && !name.startsWith('.'))
    .filter((name) => statSync(join(root, name)).isDirectory())
    .filter((name) => hasFiles(join(root, name)))
    .sort();

/** `- [ ] **<decision>.** Agent: <reason>` (or ticked), the reason may run over several lines. */
const DECISION = /^\*\*[\s\S]+?\*\*[\s\S]*?\bAgent:\s*\S/;

const DECISION_FORMAT = '- [ ] **(<kind>) <decision>.** Agent: <reason>';

/**
 * The format of `backlog/<item>/review/decisions.md`: a `## Agent decisions` heading, and under it
 * only `- [ ] **<decision>.** Agent: <reason>` items, ticked, open or superseded
 * (`- [~] … Superseded by: <pointer>`, the pointer required). The kind (`**(behaviour) …**`) is
 * not checked here: lines written before the rule stay valid, and `statusGuard.ts` requires it on
 * every decision an agent adds (`decisionsWithoutKind`).
 */
export const checkDecisions = (folder: string, text: string): string[] => {
  const path = `tools/workbench/backlog/${folder}/review/decisions.md`;
  const errors: string[] = [];
  let inside = false;
  let found = false;
  for (const token of marked.lexer(planBody(text))) {
    if (token.type === 'heading' && (token as Tokens.Heading).depth <= 2) {
      inside = (token as Tokens.Heading).depth === 2 && token.text.trim() === DECISIONS;
      if (inside) found = true;
      continue;
    }
    if (!inside || token.type === 'space') continue;
    if (token.type !== 'list') {
      errors.push(`${path}: only "${DECISION_FORMAT}" items go under ## ${DECISIONS}`);
      continue;
    }
    for (const item of (token as Tokens.List).items) {
      const itemText = item.text.trim();
      const first = item.raw.split('\n')[0];
      if (item.task && DECISION.test(itemText)) continue;
      if (/^\[~\]\s/.test(itemText) && DECISION.test(itemText.replace(/^\[~\]\s+/, ''))) {
        if (SUPERSEDED_BY.test(itemText)) continue;
        errors.push(`${path}: "${first}" is superseded without "Superseded by: <pointer>"`);
        continue;
      }
      errors.push(`${path}: "${first}" is not "${DECISION_FORMAT}"`);
    }
  }
  if (!found) errors.unshift(`${path}: no ## ${DECISIONS} heading`);
  return errors;
};

export const checkWorkbench = (root: string): string[] => {
  const errors: string[] = [];
  for (const folder of itemFolders(root)) {
    const planFile = join(root, folder, 'plan.md');
    if (!existsSync(planFile)) {
      errors.push(`tools/workbench/backlog/${folder}/plan.md: missing`);
      continue;
    }
    const plan = readFileSync(planFile, 'utf8');
    errors.push(...checkPlan(folder, plan, existsSync(join(root, folder, 'tech.md'))));
    const mockupFile = join(root, folder, 'mockup', 'index.html');
    if (existsSync(mockupFile)) {
      errors.push(...checkMockupDecisions(folder, plan, readFileSync(mockupFile, 'utf8')));
    }
    const decisionsFile = join(root, folder, 'review', 'decisions.md');
    if (existsSync(decisionsFile)) {
      errors.push(...checkDecisions(folder, readFileSync(decisionsFile, 'utf8')));
    }
  }
  return errors;
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = checkWorkbench(workbenchRoot());
  if (errors.length > 0) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
}
