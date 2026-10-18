import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkMockupDecisions, checkPlan } from '../../../scripts/workbenchFrontmatter.ts';

/**
 * `vp run workbench:check` (after `astro sync` and `astro check`): every plan rule and every
 * mockup ↔ plan mismatch of the workbench, all of them, not only the first. The board shows the
 * same list as a banner, because a broken plan otherwise leaves the dev server on stale content.
 */

/** The workbench the board reads: `WB_ROOT` (a fixture folder in tests) or `workbench/`. */
export const workbenchRoot = () =>
  resolve(process.env.WB_ROOT ?? fileURLToPath(new URL('../..', import.meta.url)));

/** True when a file sits anywhere below `dir` (git does not track empty folders). */
const hasFiles = (dir: string): boolean =>
  readdirSync(dir, { withFileTypes: true }).some(
    (entry) => !entry.isDirectory() || hasFiles(join(dir, entry.name)),
  );

/**
 * Feature folders: every directory except `site`, `_shared` and other `_`/`.` names, and
 * except folders without any file (a leftover empty folder is no feature).
 */
export const featureFolders = (root: string): string[] =>
  readdirSync(root)
    .filter((name) => !name.startsWith('_') && !name.startsWith('.') && name !== 'site')
    .filter((name) => statSync(join(root, name)).isDirectory())
    .filter((name) => hasFiles(join(root, name)))
    .sort();

export const checkWorkbench = (root: string): string[] => {
  const errors: string[] = [];
  for (const folder of featureFolders(root)) {
    const planFile = join(root, folder, 'plan.md');
    if (!existsSync(planFile)) {
      errors.push(`workbench/${folder}/plan.md: missing`);
      continue;
    }
    const plan = readFileSync(planFile, 'utf8');
    errors.push(...checkPlan(folder, plan, existsSync(join(root, folder, 'tech.md'))));
    const mockupFile = join(root, folder, 'mockup', 'index.html');
    if (existsSync(mockupFile)) {
      errors.push(...checkMockupDecisions(folder, plan, readFileSync(mockupFile, 'utf8')));
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
