import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { featureFolders } from '../workbench/site/src/check.ts';
import { readStatus } from './workbenchFrontmatter.ts';

/**
 * `vp run workbench:cleanup`: deletes every `status: done` feature folder whose files are all
 * committed (git history keeps them). A folder whose only uncommitted change is the `status:` line of its plan.md (the owner's `→ done`) is deleted
 * in the same pass. Folders with other uncommitted changes are skipped with a warning.
 */

export type CleanupFeature = { folder: string; status: string | undefined };

/** Uncommitted state of one folder: `git status --porcelain` lines and the plan.md diff. */
export type FolderChanges = { porcelain: string[]; planDiff: string };

export type Deletions = { remove: string[]; skip: string[] };

/** True when the `git diff -U0 HEAD` of a plan.md changes the `status:` line and nothing else. */
const isStatusOnlyDiff = (diff: string): boolean => {
  const lines = diff.split('\n');
  const hunkStart = lines.findIndex((line) => line.startsWith('@@'));
  if (hunkStart === -1) return false;
  const changed = lines
    .slice(hunkStart)
    .filter((line) => line.startsWith('-') || line.startsWith('+'));
  const removed = changed.filter((line) => line.startsWith('-'));
  const added = changed.filter((line) => line.startsWith('+'));
  if (removed.length !== 1 || added.length !== 1) return false;
  return removed[0].startsWith('-status:') && added[0].startsWith('+status:');
};

/** True when the folder's only uncommitted change is a tracked, modified plan.md status line. */
const isStatusOnlyChange = (folder: string, changes: FolderChanges): boolean => {
  if (changes.porcelain.length !== 1) return false;
  const line = changes.porcelain[0];
  // `XY path`: both columns may only be ` ` or `M` (no untracked, added, deleted or renamed).
  if (!/^[ M]{2} /.test(line)) return false;
  if (line.slice(3) !== `workbench/${folder}/plan.md`) return false;
  return isStatusOnlyDiff(changes.planDiff);
};

export const selectDeletions = (
  features: CleanupFeature[],
  changes: ReadonlyMap<string, FolderChanges>,
): Deletions => {
  const remove: string[] = [];
  const skip: string[] = [];
  for (const feature of features) {
    if (feature.status !== 'done') continue;
    const folderChanges = changes.get(feature.folder);
    if (folderChanges === undefined || folderChanges.porcelain.length === 0) {
      remove.push(feature.folder);
    } else if (isStatusOnlyChange(feature.folder, folderChanges)) remove.push(feature.folder);
    else skip.push(feature.folder);
  }
  return { remove, skip };
};

const REPO_ROOT = resolve(import.meta.dirname, '..');

const WORKBENCH = join(REPO_ROOT, 'workbench');

const git = (args: string[]) => execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' });

const readChanges = (folder: string): FolderChanges => {
  const porcelain = git([
    'status',
    '--porcelain',
    '--untracked-files=all',
    '--',
    `workbench/${folder}`,
  ])
    .split('\n')
    .filter((line) => line !== '');
  let planDiff = '';
  if (porcelain.length > 0) {
    planDiff = git(['diff', '-U0', 'HEAD', '--', `workbench/${folder}/plan.md`]);
  }
  return { porcelain, planDiff };
};

const main = () => {
  const features = featureFolders(WORKBENCH).map((folder) => {
    const planFile = join(WORKBENCH, folder, 'plan.md');
    let status: string | undefined = undefined;
    if (existsSync(planFile)) status = readStatus(readFileSync(planFile, 'utf8'));
    return { folder, status };
  });
  const changes = new Map(
    features
      .filter((feature) => feature.status === 'done')
      .map((feature) => [feature.folder, readChanges(feature.folder)] as const),
  );
  const deletions = selectDeletions(features, changes);
  for (const folder of deletions.skip) {
    console.warn(`skipped workbench/${folder}: uncommitted changes (commit them, then run again)`);
  }
  for (const folder of deletions.remove) {
    rmSync(join(WORKBENCH, folder), { recursive: true, force: true });
    console.log(`deleted workbench/${folder}`);
  }
  if (deletions.remove.length === 0 && deletions.skip.length === 0) console.log('no done features');
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
