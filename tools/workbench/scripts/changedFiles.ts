import { spawnSync } from 'node:child_process';
import { BACKLOG_DIR, comparePaths } from './paths.ts';
import type { FileChange, FilesComparison } from './reviewArtifactsContract.ts';

const isCoveredBy = ({ path, planned }: { path: string; planned: string }) => {
  const folder = planned.replace(/\/$/, '');
  return path === folder || path.startsWith(`${folder}/`);
};

export const compareFiles = ({
  changes,
  plannedPaths,
}: {
  changes: FileChange[];
  plannedPaths: string[];
}): FilesComparison => {
  const planned: FileChange[] = [];
  const notPlanned: FileChange[] = [];
  for (const change of [...changes].sort((a, b) => comparePaths(a.path, b.path))) {
    const coveredByPlan = plannedPaths.some((path) =>
      isCoveredBy({ path: change.path, planned: path }),
    );
    if (coveredByPlan) planned.push(change);
    else if (!change.path.startsWith(`${BACKLOG_DIR}/`)) notPlanned.push(change);
  }
  const untouched = [...new Set(plannedPaths)].filter(
    (path) => !changes.some((change) => isCoveredBy({ path: change.path, planned: path })),
  );
  return { planned, notPlanned, untouched };
};

const FILE_STATUS_BY_GIT_CODE = new Map<string, FileChange['status']>([
  ['A', 'added'],
  ['M', 'modified'],
  ['D', 'deleted'],
  ['T', 'modified'],
]);

export const parseChanges = ({
  diff,
  untracked,
}: {
  diff: string;
  untracked: string;
}): FileChange[] => {
  const byPath = new Map<string, FileChange>();
  const fields = diff.split('\0').filter((field) => field !== '');
  for (let index = 0; index + 1 < fields.length; index += 2) {
    const status = FILE_STATUS_BY_GIT_CODE.get(fields[index].charAt(0));
    if (status === undefined) continue;
    byPath.set(fields[index + 1], { path: fields[index + 1], status });
  }
  for (const path of untracked.split('\0').filter((field) => field !== '')) {
    byPath.set(path, { path, status: 'added' });
  }
  return [...byPath.values()];
};

const GIT_MAX_BUFFER_BYTES = 64 * 1024 * 1024;

const git = ({ root, args }: { root: string; args: string[] }): string | undefined => {
  const gitRun = spawnSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: GIT_MAX_BUFFER_BYTES,
  });
  if (gitRun.status !== 0) {
    console.error(`git ${args.join(' ')}: ${gitRun.stderr.trim()}`);
    return undefined;
  }
  return gitRun.stdout;
};

type GitChanges = { base: string; ref: string; changes: FileChange[] };

export const gitChanges = ({
  root,
  override,
}: {
  root: string;
  override: string | undefined;
}): GitChanges | undefined => {
  let ref = 'merge-base main HEAD';
  let base = git({ root, args: ['merge-base', 'main', 'HEAD'] });
  if (override !== undefined && override !== '') {
    ref = `WB_BASE=${override}`;
    base = git({ root, args: ['rev-parse', '--verify', `${override}^{commit}`] });
  }
  if (base === undefined) return undefined;
  const sha = base.trim();
  const diff = git({ root, args: ['diff', '--name-status', '--no-renames', '-z', sha] });
  const untracked = git({ root, args: ['ls-files', '--others', '--exclude-standard', '-z'] });
  if (diff === undefined || untracked === undefined) return undefined;
  return { base: sha, ref, changes: parseChanges({ diff, untracked }) };
};
