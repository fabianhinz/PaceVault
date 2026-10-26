import type { DepsInput } from './deps.ts';
import { repoPath } from './paths.ts';

export type SingleOwnerModule = { module: string; owner: string };

const LIB_DIR = 'apps/web/src/lib/';
const COMPONENTS_DIR = 'apps/web/src/components/';
const UI_LIB_DIRS = [`${LIB_DIR}hooks/`, `${LIB_DIR}debug/`];

const ALLOWED_MODULES = new Set<string>();

const isCheckedLibModule = (path: string) =>
  path.startsWith(LIB_DIR) &&
  !UI_LIB_DIRS.some((dir) => path.startsWith(dir)) &&
  !ALLOWED_MODULES.has(path);

const ownerOf = (importer: string): string => {
  if (!importer.startsWith(COMPONENTS_DIR)) return importer;
  const parts = importer.slice(COMPONENTS_DIR.length).split('/');
  if (parts.length < 2) return importer;
  return `components/${parts[0]}`;
};

const toLibRelative = (path: string) => path.slice('apps/web/src/'.length);

export const singleOwnerLibModules = (modules: DepsInput['modules']): SingleOwnerModule[] => {
  const importersByModule = new Map<string, Set<string>>();
  for (const module of modules) {
    const source = repoPath(module.source);
    for (const dependency of module.dependencies) {
      const resolved = repoPath(dependency.resolved);
      if (!isCheckedLibModule(resolved) || resolved === source) continue;
      const importers = importersByModule.get(resolved) ?? new Set<string>();
      importers.add(source);
      importersByModule.set(resolved, importers);
    }
  }
  const found: SingleOwnerModule[] = [];
  for (const [module, importers] of importersByModule) {
    const owners = new Set([...importers].map(ownerOf));
    if (owners.size !== 1) continue;
    const [owner] = owners;
    if (owner === undefined || !owner.startsWith('components/')) continue;
    found.push({ module: toLibRelative(module), owner });
  }
  return found.sort((left, right) => left.module.localeCompare(right.module));
};

export const libModuleCount = (modules: DepsInput['modules']): number =>
  modules.filter((module) => isCheckedLibModule(repoPath(module.source))).length;

export const colocationLine = (found: SingleOwnerModule[], libModules: number): string => {
  if (found.length === 0) {
    return `Colocation check · no single-feature lib modules (${libModules} lib modules)`;
  }
  const list = found.map((entry) => `${entry.module} → ${entry.owner}`).join('; ');
  return `Colocation check · ${found.length} lib module(s) used by one feature only: ${list}`;
};
