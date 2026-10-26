import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = resolve(fileURLToPath(new URL('../../..', import.meta.url)));
export const BACKLOG_DIR = 'tools/workbench/backlog';
export const BACKLOG_PATH = join(REPO_ROOT, BACKLOG_DIR);
export const WORKBENCH_DIR = fileURLToPath(new URL('../', import.meta.url));
export const GUIDE_FILE = fileURLToPath(new URL('../GUIDE.md', import.meta.url));

export const backlogRoot = (): string => resolve(process.env.WB_ROOT ?? BACKLOG_PATH);

export const baseRevisionOverride = (): string | undefined => process.env.WB_BASE;

export const dirOf = (path: string) => path.split('/').slice(0, -1).join('/');

export const baseName = (path: string) => path.split('/').slice(-1)[0];

// Each package exports ./* from ./src/*.
export const repoPath = (path: string) => {
  const match = /^@pacevault\/([^/]+)\/(.+)$/.exec(path);
  if (match) return `packages/${match[1]}/src/${match[2]}`;
  return path;
};

export const comparePaths = (a: string, b: string) => {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
};
