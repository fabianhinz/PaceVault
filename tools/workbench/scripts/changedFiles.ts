import { spawnSync } from 'node:child_process';

/**
 * The files an item changed, for the Actual side of tech.md's `### New` / `### Changed`
 * (`review/files.json`, written by `vp run workbench:deps -- <item>`): the committed changes since
 * the base plus the uncommitted ones (staged, unstaged, untracked), compared with the planned
 * paths. The base is the merge-base with `main`; `WB_BASE` (any git revision) overrides it.
 */

export type FileStatus = 'added' | 'modified' | 'deleted';

export type FileChange = { path: string; status: FileStatus };

export type FilesComparison = {
  /** Changed files a planned path covers. */
  planned: FileChange[];
  /** Changed files no planned path covers. */
  notPlanned: FileChange[];
  /** Planned paths no changed file covers. */
  untouched: string[];
};

/** The backlog folder; its files count only when a planned path covers them (plans, mockups, reviews are not code). */
const BACKLOG = 'tools/workbench/backlog/';

/** A changed file and a planned path (a file, or a folder ending in `/`) cover each other. */
const covers = (path: string, planned: string) => {
  const folder = planned.replace(/\/$/, '');
  return path === folder || path.startsWith(`${folder}/`);
};

const compareText = (a: string, b: string) => {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
};

/**
 * Sorts the changed files against the planned paths (tech.md order kept for untouched); a file
 * under `tools/workbench/backlog/` that no planned path covers is left out.
 */
export const compareFiles = (changes: FileChange[], plannedPaths: string[]): FilesComparison => {
  const planned: FileChange[] = [];
  const notPlanned: FileChange[] = [];
  for (const change of [...changes].sort((a, b) => compareText(a.path, b.path))) {
    const isPlanned = plannedPaths.some((path) => covers(change.path, path));
    if (isPlanned) planned.push(change);
    else if (!change.path.startsWith(BACKLOG)) notPlanned.push(change);
  }
  const untouched = [...new Set(plannedPaths)].filter(
    (path) => !changes.some((change) => covers(change.path, path)),
  );
  return { planned, notPlanned, untouched };
};

const STATUS = new Map<string, FileStatus>([
  ['A', 'added'],
  ['M', 'modified'],
  ['D', 'deleted'],
  ['T', 'modified'],
]);

/**
 * `git diff --name-status --no-renames -z <base>` (base to working tree) and
 * `git ls-files --others --exclude-standard -z` (untracked) → one change per path.
 */
export const parseChanges = (diff: string, untracked: string): FileChange[] => {
  const byPath = new Map<string, FileChange>();
  const fields = diff.split('\0').filter((field) => field !== '');
  for (let index = 0; index + 1 < fields.length; index += 2) {
    const status = STATUS.get(fields[index].charAt(0));
    if (status === undefined) continue;
    byPath.set(fields[index + 1], { path: fields[index + 1], status });
  }
  for (const path of untracked.split('\0').filter((field) => field !== '')) {
    byPath.set(path, { path, status: 'added' });
  }
  return [...byPath.values()];
};

const git = (root: string, args: string[]): string | undefined => {
  const run = spawnSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (run.status !== 0) {
    console.error(`git ${args.join(' ')}: ${run.stderr.trim()}`);
    return undefined;
  }
  return run.stdout;
};

export type GitChanges = { base: string; ref: string; changes: FileChange[] };

/**
 * The item's changes in the repo at `root` since `WB_BASE` (when set) or the merge-base of
 * `HEAD` with `main`; `undefined` (reason on stderr) when git fails. Read-only git calls.
 */
export const gitChanges = (root: string, override: string | undefined): GitChanges | undefined => {
  let ref = 'merge-base main HEAD';
  let base = git(root, ['merge-base', 'main', 'HEAD']);
  if (override !== undefined && override !== '') {
    ref = `WB_BASE=${override}`;
    base = git(root, ['rev-parse', '--verify', `${override}^{commit}`]);
  }
  if (base === undefined) return undefined;
  const sha = base.trim();
  const diff = git(root, ['diff', '--name-status', '--no-renames', '-z', sha]);
  const untracked = git(root, ['ls-files', '--others', '--exclude-standard', '-z']);
  if (diff === undefined || untracked === undefined) return undefined;
  return { base: sha, ref, changes: parseChanges(diff, untracked) };
};
