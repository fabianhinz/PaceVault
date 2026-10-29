import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkDecisions, checkMockupDecisions, checkPlan } from './checkRules.ts';
import { backlogRoot } from './paths.ts';

/**
 * `vp run plans:check` (in tools/workbench; the root `vp run workbench:check` runs it after
 * `astro check`): every plan rule and every mockup ↔ plan mismatch of the backlog, all of them,
 * not only the first. The board shows the
 * same list as a banner, because a broken plan otherwise leaves the dev server on stale content.
 */

const hasFiles = (dir: string): boolean =>
  readdirSync(dir, { withFileTypes: true }).some(
    (entry) => !entry.isDirectory() || hasFiles(join(dir, entry.name)),
  );

export const itemFolders = (root: string): string[] =>
  readdirSync(root)
    .filter((name) => !name.startsWith('_') && !name.startsWith('.'))
    .filter((name) => statSync(join(root, name)).isDirectory())
    .filter((name) => hasFiles(join(root, name)))
    .sort();

export const checkWorkbench = (root: string): string[] => {
  const errors: string[] = [];
  for (const folder of itemFolders(root)) {
    const planFile = join(root, folder, 'plan.md');
    if (!existsSync(planFile)) {
      errors.push(`tools/workbench/backlog/${folder}/plan.md: missing`);
      continue;
    }
    const plan = readFileSync(planFile, 'utf8');
    errors.push(
      ...checkPlan({ folder, plan, techPresent: existsSync(join(root, folder, 'tech.md')) }),
    );
    const mockupFile = join(root, folder, 'mockup', 'index.html');
    if (existsSync(mockupFile)) {
      errors.push(
        ...checkMockupDecisions({ folder, plan, mockupHtml: readFileSync(mockupFile, 'utf8') }),
      );
    }
    const decisionsFile = join(root, folder, 'review', 'decisions.md');
    if (existsSync(decisionsFile)) {
      errors.push(...checkDecisions({ folder, text: readFileSync(decisionsFile, 'utf8') }));
    }
  }
  return errors;
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = checkWorkbench(backlogRoot());
  if (errors.length > 0) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
}
