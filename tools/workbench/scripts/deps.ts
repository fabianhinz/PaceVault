import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { z } from 'zod';
import { compareFiles, gitChanges } from './changedFiles.ts';
import { parseFrontmatter, planFrontmatterSchema, readTechPaths } from './frontmatter.ts';
import { interfaceFiles, writeInterfaces } from './interfaces.ts';

/**
 * `vp run workbench:deps -- <item>`: the actual import graph of an item at review time.
 * Checks the boundary rules over `apps/web/src` and `packages` with dependency-cruiser
 * (`tools/workbench/.dependency-cruiser.cjs`: boundary rules and options), then cruises the item's
 * folders (R26: the roots of its `areas:` plus the folders of its planned TypeScript paths) and
 * focuses on every `### New` and `### Changed` path of `tools/workbench/backlog/<item>/tech.md`,
 * collapses every other folder to one node, keeps only the edges that touch a focus module and
 * marks modules imported but not planned (added) and planned code paths not in the graph (missing;
 * `.astro` is never parsed and listed in `deps.json` `astro`). Writes `…/backlog/<item>/review/deps.mmd` (Mermaid) and
 * `review/deps.json` (counts, added, missing, boundary result) and exits 1 on a boundary violation.
 * The same run writes the other Actual sides of the Tech tab (R21): `review/components.mmd` (the
 * component tree of the New / Changed `.tsx` files), `review/files.json` (the files changed since
 * the base, `changedFiles.ts`) and `review/interfaces.md` (`interfaces.ts`).
 */

const moduleSchema = z.object({
  source: z.string(),
  dependencies: z.array(z.object({ resolved: z.string() })),
});

const cruiseSchema = z.object({
  modules: z.array(moduleSchema),
  summary: z.object({
    violations: z.array(
      z.object({
        from: z.string(),
        to: z.string(),
        rule: z.object({ name: z.string(), severity: z.string() }),
      }),
    ),
    totalCruised: z.number(),
    totalDependenciesCruised: z.number(),
  }),
});

export type Cruise = z.infer<typeof cruiseSchema>;

export type DepsInput = { modules: z.infer<typeof moduleSchema>[] };

export type DepsGraph = {
  mermaid: string;
  /** Modules drawn (focus modules plus their direct imports and importers). */
  nodes: number;
  /** Imports drawn (each touches a focus module). */
  edges: number;
  /** Drawn modules no planned path covers. */
  added: string[];
  /** Planned paths no drawn module covers. */
  missing: string[];
};

export type Layer = 'engine' | 'lib' | 'store' | 'feature' | 'ui' | 'page' | 'other';

export type Violation = { rule: string; from: string; to: string };

export type Boundary = {
  rules: string[];
  violations: Violation[];
  modules: number;
  dependencies: number;
};

/** The rules in `.dependency-cruiser.cjs`; named in the boundary line. */
export const BOUNDARY_RULES = ['engine-is-pure', 'store-no-features'];

/** The app's source folder, relative to the repo root (as depcruise prints paths). */
const APP_SRC = 'apps/web/src/';

/** The path below `apps/web/src/`, or `undefined` for a module outside the app. */
const appPath = (path: string): string | undefined => {
  if (!path.startsWith(APP_SRC)) return undefined;
  return path.slice(APP_SRC.length);
};

/** Code files the graph can draw (R26: any repo folder the item's areas cruise, no node_modules). */
const CODE = /\.(tsx?|jsx?|mjs|cjs)$/;

/** Planned paths that could be in the graph: code, `.astro` (never parsed) or a folder. */
const SOURCE = /(\.(tsx?|jsx?|mjs|cjs|astro)|\/)$/;

const isDrawable = (path: string) =>
  !path.includes('node_modules/') &&
  CODE.test(path) &&
  /^(apps|packages|tools|\.claude)\//.test(path);

const dirOf = (path: string) => path.split('/').slice(0, -1).join('/');

const baseName = (path: string) => path.split('/').slice(-1)[0];

/** `@pacevault/ui/components/Button.tsx` → `packages/ui/src/components/Button.tsx` (each package exports `./*` from `./src/*`). */
const repoPath = (path: string) => {
  const match = /^@pacevault\/([^/]+)\/(.+)$/.exec(path);
  if (match) return `packages/${match[1]}/src/${match[2]}`;
  return path;
};

/** The repo layer of a module path; anything outside the named folders is `other`. */
export const layerOf = (path: string): Layer => {
  if (path.startsWith('packages/engine/') || path === 'packages/engine') return 'engine';
  if (path.startsWith('packages/ui/') || path === 'packages/ui') return 'ui';
  const local = appPath(path);
  if (local === undefined) return 'other';
  if (local.startsWith('lib/') || local === 'lib') return 'lib';
  if (local.startsWith('store/')) return 'store';
  if (local.startsWith('features/')) return 'feature';
  if (local.startsWith('components/')) return 'ui';
  if (local.startsWith('pages/')) return 'page';
  return 'other';
};

/** A path and a planned path cover each other when one is the other or a folder holding it. */
const covers = (a: string, b: string) => {
  const left = a.replace(/\/$/, '');
  const right = b.replace(/\/$/, '');
  return left === right || left.startsWith(`${right}/`) || right.startsWith(`${left}/`);
};

const inFocus = (path: string, focus: string[]) =>
  focus.some((entry) => {
    const folder = entry.replace(/\/$/, '');
    return path === folder || path.startsWith(`${folder}/`);
  });

/**
 * The folder a module collapses into: `apps/web/src/features/<f>`, `…/components/<x>`,
 * `…/src/<dir>` or `packages/<p>`; store and page files and app root files stay single.
 */
const collapseFolder = (path: string): string | undefined => {
  if (path.startsWith('packages/')) return path.split('/').slice(0, 2).join('/');
  const local = appPath(path);
  if (local === undefined) return undefined;
  const parts = local.split('/');
  if (parts.length < 2) return undefined;
  const top = parts[0];
  if (top === 'store' || top === 'pages') return undefined;
  if (top === 'features' || top === 'components') {
    if (parts.length < 3) return undefined;
    return APP_SRC + parts.slice(0, 2).join('/');
  }
  return APP_SRC + top;
};

/** The feature folder name of an app module below `features/`. */
const featureOf = (node: string) => (appPath(node) ?? node).split('/')[1];

/**
 * The node a module is drawn as: itself, or its folder when no focus module lives there. App
 * modules fold to their feature, component or top folder; any other module (R26) to its own folder.
 */
const nodeOf = (path: string, focus: string[]) => {
  let folder = collapseFolder(path);
  if (appPath(path) === undefined) folder = dirOf(path);
  if (folder === undefined || inFocus(path, focus)) return path;
  if (focus.some((entry) => inFocus(entry.replace(/\/$/, ''), [folder]))) return path;
  return folder;
};

const LAYER_TITLES: { layer: Layer; title: string }[] = [
  { layer: 'page', title: 'pages' },
  { layer: 'ui', title: 'components' },
  { layer: 'feature', title: 'features' },
  { layer: 'store', title: 'store' },
  { layer: 'lib', title: 'lib' },
  { layer: 'engine', title: 'engine' },
  { layer: 'other', title: 'other' },
];

const compareText = (a: string, b: string) => {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
};

/** The label inside its subgraph: the path below the layer (or feature) folder. */
const labelOf = (node: string, layer: Layer, folded: boolean) => {
  const local = appPath(node) ?? node;
  let label = local;
  if (layer === 'feature') label = local.split('/').slice(2).join('/');
  if (layer === 'store') label = local.replace(/^store\//, '');
  if (layer === 'page') label = local.replace(/^pages\//, '');
  if (layer === 'ui') label = local.replace(/^components\//, '');
  if (folded) return `${label || node.split('/').slice(-1)[0]}/`;
  return label;
};

/**
 * Regroups a dependency-cruiser result around the focus modules (Q5–Q7, R26) and marks the
 * difference to the planned paths (Q2). App modules (`apps/web/src`) are grouped by layer as
 * before; every other module by its folder (`packages/ui/src/components`,
 * `tools/workbench/site/src/app`, …), labelled with its file name (a folded folder with its own
 * name and `/`); labels that would repeat get their repo path. node_modules are left out.
 */
export const toDepsGraph = (cruise: DepsInput, focus: string[], planned: string[]): DepsGraph => {
  const modules = cruise.modules.map((module) => ({
    source: repoPath(module.source),
    dependencies: module.dependencies.map((dependency) => repoPath(dependency.resolved)),
  }));
  const sources = new Set(modules.map((module) => module.source).filter(isDrawable));
  const focusNodes = new Set([...sources].filter((path) => inFocus(path, focus)));
  const folded = new Set<string>();
  const edgeKeys = new Set<string>();
  const edges: [string, string][] = [];
  for (const module of modules) {
    if (!sources.has(module.source)) continue;
    const from = nodeOf(module.source, focus);
    if (from !== module.source) folded.add(from);
    for (const resolved of module.dependencies) {
      if (!sources.has(resolved)) continue;
      const to = nodeOf(resolved, focus);
      if (to !== resolved) folded.add(to);
      if (from === to || (!focusNodes.has(from) && !focusNodes.has(to))) continue;
      const key = `${from}\n${to}`;
      if (edgeKeys.has(key)) continue;
      edgeKeys.add(key);
      edges.push([from, to]);
    }
  }
  const drawn = new Set([...focusNodes, ...edges.flat()]);
  const nodes = [...drawn].sort(compareText);
  const ids = new Map(nodes.map((node, index) => [node, `n${index}`]));
  const idOf = (node: string) => ids.get(node) ?? node;
  const added = nodes.filter((node) => !planned.some((path) => covers(node, path)));
  // A planned path that is not code (messages/*.json, SKILL.md) can never be drawn, so it is never missing.
  const missing = planned.filter(
    (path) => SOURCE.test(path) && !nodes.some((node) => covers(node, path)),
  );

  const isApp = (node: string) => appPath(node) !== undefined;
  const labels = new Map<string, string>();
  for (const node of nodes) {
    let label = baseName(node);
    if (folded.has(node)) label = `${label}/`;
    if (isApp(node)) {
      let layer = layerOf(node);
      const featureOnly =
        layer === 'feature' &&
        folded.has(node) &&
        nodes.filter((other) => isApp(other) && featureOf(other) === featureOf(node)).length === 1;
      if (featureOnly) layer = 'other';
      label = labelOf(node, layer, folded.has(node));
    }
    labels.set(node, label);
  }
  const taken = [...labels.values()];
  for (const node of nodes) {
    const label = labels.get(node) ?? node;
    if (taken.filter((other) => other === label).length > 1)
      labels.set(node, appPath(node) ?? node);
  }

  const lines = ['flowchart TB'];
  const nodeLine = (node: string) => `${idOf(node)}["${labels.get(node) ?? node}"]`;
  for (const entry of LAYER_TITLES) {
    const inLayer = nodes.filter((node) => isApp(node) && layerOf(node) === entry.layer);
    if (inLayer.length === 0) continue;
    lines.push(`subgraph L_${entry.layer}["${entry.title}"]`);
    if (entry.layer === 'feature') {
      const features = [...new Set(inLayer.map(featureOf))];
      for (const feature of features) {
        const own = inLayer.filter((node) => featureOf(node) === feature);
        if (own.length === 1 && folded.has(own[0])) {
          lines.push(nodeLine(own[0]));
          continue;
        }
        lines.push(`subgraph F_${feature.replace(/\W/g, '_')}["${feature}/"]`);
        for (const node of own) lines.push(nodeLine(node));
        lines.push('end');
      }
    } else {
      for (const node of inLayer) lines.push(nodeLine(node));
    }
    lines.push('end');
  }
  const others = nodes.filter((node) => !isApp(node));
  const folders = [...new Set(others.map(dirOf))].sort(compareText);
  folders.forEach((folder, index) => {
    lines.push(`subgraph G${index}["${folder}/"]`);
    for (const node of others.filter((other) => dirOf(other) === folder))
      lines.push(nodeLine(node));
    lines.push('end');
  });
  for (const edge of edges) lines.push(`${idOf(edge[0])}-->${idOf(edge[1])}`);
  if (missing.length > 0) {
    lines.push('subgraph missingPlanned["planned, not in the graph"]');
    missing.forEach((path, index) => lines.push(`miss${index}["${appPath(path) ?? path}"]`));
    lines.push('end');
    lines.push(`class ${missing.map((_, index) => `miss${index}`).join(',')} missing`);
  }
  const focusIds = nodes.filter((node) => focusNodes.has(node)).map(idOf);
  if (focusIds.length > 0) lines.push(`class ${focusIds.join(',')} focus`);
  const addedIds = added.filter((node) => !focusNodes.has(node)).map(idOf);
  if (addedIds.length > 0) lines.push(`class ${addedIds.join(',')} added`);
  lines.push(
    'classDef focus stroke:#e5e7eb,stroke-width:2px',
    'classDef added fill:#eab30833,stroke:#facc15,color:#facc15,stroke-width:2px',
    'classDef missing fill:none,stroke:#5c616e,stroke-dasharray:4 3,color:#8b8f9a',
  );
  return {
    mermaid: `${lines.join('\n')}\n`,
    nodes: nodes.length,
    edges: edges.length,
    added,
    missing,
  };
};

export type ComponentGraph = {
  mermaid: string;
  /** Components drawn (the item's `.tsx` files and the `.tsx` files they import). */
  nodes: number;
  /** Imports drawn between them. */
  edges: number;
};

const isComponent = (path: string) => path.endsWith('.tsx') && !path.includes('node_modules/');

const componentName = (path: string) => (path.split('/').pop() ?? path).replace(/\.tsx$/, '');

/**
 * The actual component tree (R21): the item's `.tsx` files (`entries`, New and Changed) and the
 * `.tsx` files they import within the repo, one subgraph per folder, an arrow per import. New
 * files drawn bold, changed files as modified, imported files dashed (the planned diagram's
 * `ui` style).
 */
export const toComponentGraph = (
  cruise: DepsInput,
  added: string[],
  changed: string[],
): ComponentGraph => {
  const entries = new Set([...added, ...changed].filter(isComponent));
  const imports = new Map<string, Set<string>>();
  for (const module of cruise.modules) {
    const from = repoPath(module.source);
    if (!isComponent(from)) continue;
    const own = imports.get(from) ?? new Set<string>();
    for (const dependency of module.dependencies) {
      const to = repoPath(dependency.resolved);
      if (isComponent(to) && to !== from) own.add(to);
    }
    imports.set(from, own);
  }
  const drawn = new Set(entries);
  for (const entry of entries) for (const to of imports.get(entry) ?? []) drawn.add(to);
  const nodes = [...drawn].sort(compareText);
  const ids = new Map(nodes.map((node, index) => [node, `c${index}`]));
  const idOf = (node: string) => ids.get(node) ?? node;
  const edges: [string, string][] = [];
  for (const from of nodes) {
    for (const to of [...(imports.get(from) ?? [])].sort(compareText)) {
      if (drawn.has(to)) edges.push([from, to]);
    }
  }
  const lines = ['flowchart TB'];
  if (nodes.length === 0) lines.push('none["no .tsx files under ### New or ### Changed"]');
  const folders = [...new Set(nodes.map(dirOf))];
  folders.forEach((folder, index) => {
    lines.push(`subgraph D${index}["${folder}/"]`);
    for (const node of nodes.filter((entry) => dirOf(entry) === folder)) {
      lines.push(`${idOf(node)}["${componentName(node)}"]`);
    }
    lines.push('end');
  });
  for (const edge of edges) lines.push(`${idOf(edge[0])}-->${idOf(edge[1])}`);
  const classOf = (list: string[], name: string) => {
    if (list.length > 0) lines.push(`class ${list.map(idOf).join(',')} ${name}`);
  };
  const addedSet = new Set(added);
  classOf(
    nodes.filter((node) => entries.has(node) && addedSet.has(node)),
    'new',
  );
  classOf(
    nodes.filter((node) => entries.has(node) && !addedSet.has(node)),
    'mod',
  );
  classOf(
    nodes.filter((node) => !entries.has(node)),
    'ui',
  );
  lines.push(
    'classDef new stroke:#e5e7eb,stroke-width:2px',
    'classDef mod stroke:#8b8f9a,stroke-width:2px',
    'classDef ui stroke:#8b8f9a,stroke-dasharray:4 3',
  );
  return { mermaid: `${lines.join('\n')}\n`, nodes: nodes.length, edges: edges.length };
};

/** The folders an area's code lives in (R26); `repo` and `skills` hold none. */
const AREA_ROOTS: Record<string, string[]> = {
  app: ['apps/web/src'],
  engine: ['packages/engine/src'],
  gpx: ['packages/gpx/src'],
  ui: ['packages/ui/src'],
  i18n: ['packages/i18n/src'],
  testing: ['packages/testing/src'],
  workbench: ['tools/workbench/site/src', 'tools/workbench/scripts'],
  docs: ['tools/docs'],
};

/**
 * The folders the import graph cruises (R26): the roots of the item's areas plus the folders of
 * its planned TypeScript paths (a planned folder as is), each once, sorted; a folder inside
 * another listed one is dropped.
 */
export const cruiseRoots = (areas: string[], planned: string[]): string[] => {
  const roots = areas.flatMap((area) => AREA_ROOTS[area] ?? []);
  for (const path of planned) {
    if (path.endsWith('/')) roots.push(path.replace(/\/+$/, ''));
    else if (/\.tsx?$/.test(path)) roots.push(dirOf(path));
  }
  const unique = [...new Set(roots.filter((root) => root !== ''))].sort(compareText);
  return unique.filter(
    (root) => !unique.some((other) => other !== root && root.startsWith(`${other}/`)),
  );
};

/** `node_modules/.pnpm/react@19/node_modules/react/index.js` → `react`; source paths stay. */
const shortModule = (path: string) => {
  const match = /node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?((?:@[^/]+\/)?[^/]+)/.exec(path);
  if (match) return match[1];
  return path;
};

/** The boundary rule result of the whole cruise (every cruised module, not only the focus). */
export const boundaryOf = (cruise: Cruise): Boundary => ({
  rules: BOUNDARY_RULES,
  violations: cruise.summary.violations.map((violation) => ({
    rule: violation.rule.name,
    from: violation.from,
    to: shortModule(violation.to),
  })),
  modules: cruise.summary.totalCruised,
  dependencies: cruise.summary.totalDependenciesCruised,
});

/** One line for the terminal and the review doc. */
export const boundaryLine = (boundary: Boundary): string => {
  const rules = boundary.rules.join(', ');
  const cruised = `${boundary.modules} modules, ${boundary.dependencies} dependencies cruised`;
  if (boundary.violations.length === 0) {
    return `Boundary check · ${rules}: no violations (${cruised})`;
  }
  const list = boundary.violations
    .map((violation) => `${violation.rule} ${violation.from} → ${violation.to}`)
    .join('; ');
  return `Boundary check · ${boundary.violations.length} violation(s): ${list} (${cruised})`;
};

const REPO_ROOT = resolve(import.meta.dirname, '../../..');

/** The backlog folder, relative to the repo root. */
const BACKLOG = 'tools/workbench/backlog';

export const CRUISE_ARGS = [
  '--config',
  'tools/workbench/.dependency-cruiser.cjs',
  '--output-type',
  'json',
  'apps/web/src',
  'packages',
];

/**
 * Runs depcruise with `args` (default: over the app and the packages); `undefined` (with the
 * reason on stderr) when no result parses.
 */
const cruiseRepo = (args: string[] = CRUISE_ARGS): Cruise | undefined => {
  const bin = join(import.meta.dirname, '..', 'node_modules', '.bin', 'depcruise');
  // depcruise exits with the number of error-level violations, so the status is not a failure.
  const run = spawnSync(bin, args, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  });
  let raw: unknown;
  try {
    raw = JSON.parse(run.stdout);
  } catch {
    console.error(`depcruise produced no JSON:\n${run.stderr}`);
    return undefined;
  }
  const parsed = cruiseSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(`depcruise output has an unexpected shape: ${parsed.error.message}`);
    return undefined;
  }
  return parsed.data;
};

/** The `areas:` of an item's plan.md; `[]` when the plan or its frontmatter does not parse. */
const areasOf = (planFile: string): string[] => {
  if (!existsSync(planFile)) return [];
  let raw: unknown;
  try {
    raw = parseFrontmatter(readFileSync(planFile, 'utf8'));
  } catch {
    return [];
  }
  const parsed = planFrontmatterSchema.safeParse(raw);
  if (!parsed.success) return [];
  return parsed.data.areas ?? [];
};

const main = () => {
  const args = parseArgs({ allowPositionals: true, options: {} });
  const item = args.positionals[0];
  if (item === undefined) {
    console.error('usage: vp run workbench:deps -- <item>');
    process.exit(1);
  }
  const folder = join(REPO_ROOT, BACKLOG, item);
  const techFile = join(folder, 'tech.md');
  if (!existsSync(techFile)) {
    console.error(`${BACKLOG}/${item}/tech.md: missing`);
    process.exit(1);
  }
  const paths = readTechPaths(readFileSync(techFile, 'utf8'));
  // R26: the focus is every planned path, New and Changed.
  const planned = [...paths.added, ...paths.changed];
  const focus = planned;
  if (focus.length === 0) {
    console.error(`${BACKLOG}/${item}/tech.md: no paths under ### New or ### Changed`);
    process.exit(1);
  }
  // The boundary rules are app rules: checked over apps/web/src and packages as before.
  const cruise = cruiseRepo();
  if (cruise === undefined) process.exit(1);
  const boundary = boundaryOf(cruise);
  // The graph cruises the item's areas and the folders of its planned TypeScript paths (R26).
  const roots = cruiseRoots(areasOf(join(folder, 'plan.md')), planned).filter((root) =>
    existsSync(join(REPO_ROOT, root)),
  );
  let scoped: Cruise = cruise;
  if (roots.length > 0) {
    const run = cruiseRepo([...CRUISE_ARGS.slice(0, 4), ...roots]);
    if (run === undefined) process.exit(1);
    scoped = run;
  }
  const graph = toDepsGraph(scoped, focus, planned);
  const astro = planned.filter((path) => path.endsWith('.astro'));
  const review = join(folder, 'review');
  const generated = new Date().toISOString().slice(0, 10);
  mkdirSync(review, { recursive: true });
  writeFileSync(join(review, 'deps.mmd'), graph.mermaid);

  // Components (R21): the item's .tsx files and what they import, cruised from those files.
  const tsx = interfaceFiles(REPO_ROOT, planned).files.filter((path) => path.endsWith('.tsx'));
  let components: ComponentGraph = toComponentGraph({ modules: [] }, [], []);
  if (tsx.length > 0) {
    const cruised = cruiseRepo([...CRUISE_ARGS.slice(0, 4), ...tsx]);
    if (cruised === undefined) process.exit(1);
    const tsxAdded = interfaceFiles(REPO_ROOT, paths.added).files;
    components = toComponentGraph(
      cruised,
      tsx.filter((path) => tsxAdded.includes(path)),
      tsx.filter((path) => !tsxAdded.includes(path)),
    );
  }
  writeFileSync(join(review, 'components.mmd'), components.mermaid);

  const json = {
    item,
    generated,
    command: `depcruise ${CRUISE_ARGS.slice(0, 4).join(' ')} ${roots.join(' ')}`,
    roots,
    focus,
    astro,
    nodes: graph.nodes,
    edges: graph.edges,
    added: graph.added,
    missing: graph.missing,
    boundary,
    components: { nodes: components.nodes, edges: components.edges },
  };
  writeFileSync(join(review, 'deps.json'), `${JSON.stringify(json, null, 2)}\n`);
  console.log(
    `${BACKLOG}/${item}/review/deps.mmd: ${graph.nodes} modules · ${graph.edges} imports drawn · ${graph.added.length} added · ${graph.missing.length} missing`,
  );
  console.log(
    `${BACKLOG}/${item}/review/components.mmd: ${components.nodes} components · ${components.edges} imports`,
  );

  // Files (R21): what git says changed since the base, against the planned New / Changed.
  const changes = gitChanges(REPO_ROOT, process.env.WB_BASE);
  if (changes === undefined) process.exit(1);
  const files = compareFiles(changes.changes, planned);
  const filesJson = { item, generated, base: changes.base, ref: changes.ref, ...files };
  writeFileSync(join(review, 'files.json'), `${JSON.stringify(filesJson, null, 2)}\n`);
  console.log(
    `${BACKLOG}/${item}/review/files.json: ${files.planned.length} changed and planned · ${files.notPlanned.length} changed, not planned · ${files.untouched.length} planned, untouched (base ${changes.base.slice(0, 7)}, ${changes.ref})`,
  );

  console.log(writeInterfaces(item, files));

  const line = boundaryLine(boundary);
  if (boundary.violations.length > 0) {
    console.error(line);
    process.exit(1);
  }
  console.log(line);
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
