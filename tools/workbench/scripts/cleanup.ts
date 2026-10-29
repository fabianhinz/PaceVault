import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { itemFolders } from './check.ts';
import { DECISIONS, isOpenCheck, readChecks, readStatus } from './frontmatter.ts';
import { BACKLOG_DIR, BACKLOG_PATH, REPO_ROOT } from './paths.ts';

type CleanupItem = { folder: string; status: string | undefined; openDecisions: number };

type FolderChanges = { porcelain: string[]; planDiff: string };

type Deletions = { remove: string[]; skip: string[]; undecided: string[] };

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

const isStatusOnlyChange = ({
  folder,
  changes,
}: {
  folder: string;
  changes: FolderChanges;
}): boolean => {
  if (changes.porcelain.length !== 1) return false;
  const line = changes.porcelain[0];
  // `XY path`: both columns may only be ` ` or `M` (no untracked, added, deleted or renamed).
  if (!/^[ M]{2} /.test(line)) return false;
  if (line.slice(3) !== `${BACKLOG_DIR}/${folder}/plan.md`) return false;
  return isStatusOnlyDiff(changes.planDiff);
};

export const selectDeletions = ({
  items,
  changes,
}: {
  items: CleanupItem[];
  changes: ReadonlyMap<string, FolderChanges>;
}): Deletions => {
  const remove: string[] = [];
  const skip: string[] = [];
  const undecided: string[] = [];
  for (const item of items) {
    if (item.status !== 'done') continue;
    const folderChanges = changes.get(item.folder);
    if (item.openDecisions > 0) undecided.push(item.folder);
    else if (folderChanges === undefined || folderChanges.porcelain.length === 0) {
      remove.push(item.folder);
    } else if (isStatusOnlyChange({ folder: item.folder, changes: folderChanges }))
      remove.push(item.folder);
    else skip.push(item.folder);
  }
  return { remove, skip, undecided };
};

const git = (args: string[]) => execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' });

const readChanges = (folder: string): FolderChanges => {
  const porcelain = git([
    'status',
    '--porcelain',
    '--untracked-files=all',
    '--',
    `${BACKLOG_DIR}/${folder}`,
  ])
    .split('\n')
    .filter((line) => line !== '');
  let planDiff = '';
  if (porcelain.length > 0) {
    planDiff = git(['diff', '-U0', 'HEAD', '--', `${BACKLOG_DIR}/${folder}/plan.md`]);
  }
  return { porcelain, planDiff };
};

const openDecisionsOf = (folder: string): number => {
  const file = join(BACKLOG_PATH, folder, 'review', 'decisions.md');
  if (!existsSync(file)) return 0;
  return readChecks({ text: readFileSync(file, 'utf8'), heading: DECISIONS }).filter(isOpenCheck)
    .length;
};

const main = () => {
  const items = itemFolders(BACKLOG_PATH).map((folder) => {
    const planFile = join(BACKLOG_PATH, folder, 'plan.md');
    let status: string | undefined = undefined;
    if (existsSync(planFile)) status = readStatus(readFileSync(planFile, 'utf8'));
    return { folder, status, openDecisions: openDecisionsOf(folder) };
  });
  const changes = new Map(
    items
      .filter((item) => item.status === 'done')
      .map((item) => [item.folder, readChanges(item.folder)] as const),
  );
  const deletions = selectDeletions({ items, changes });
  for (const folder of deletions.undecided) {
    console.warn(
      `skipped ${BACKLOG_DIR}/${folder}: unticked agent decisions in review/decisions.md (tick or delete the agent decisions first)`,
    );
  }
  for (const folder of deletions.skip) {
    console.warn(
      `skipped ${BACKLOG_DIR}/${folder}: uncommitted changes (commit them, then run again)`,
    );
  }
  for (const folder of deletions.remove) {
    rmSync(join(BACKLOG_PATH, folder), { recursive: true, force: true });
    console.log(`deleted ${BACKLOG_DIR}/${folder}`);
  }
  const nothingToReport =
    deletions.remove.length + deletions.skip.length + deletions.undecided.length === 0;
  if (nothingToReport) console.log('no done items');
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
