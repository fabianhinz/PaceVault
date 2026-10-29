import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { tokens } from '@pacevault/ui/lib/tokens.ts';
import { compareFiles, gitChanges } from './changedFiles.ts';
import { parseFrontmatter, planFrontmatterSchema, type Area } from './frontmatter.ts';
import { itemTechPaths } from './itemCli.ts';
import {
  BACKLOG_DIR,
  REPO_ROOT,
  WORKBENCH_DIR,
  baseName,
  baseRevisionOverride,
  comparePaths,
  dirOf,
  repoPath,
} from './paths.ts';
import { toComponentGraph, type ComponentGraph } from './componentGraph.ts';
import { interfaceFiles, writeInterfaces } from './interfaces.ts';
import type { Boundary, DepsJson, FilesComparison, FilesJson } from './reviewArtifactsContract.ts';

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

type Cruise = z.infer<typeof cruiseSchema>;

export type DepsInput = { modules: z.infer<typeof moduleSchema>[] };

type DepsGraph = {
  mermaid: string;
  nodes: number;
  edges: number;
  added: string[];
  missing: string[];
};

const LAYERS = ['page', 'ui', 'feature', 'store', 'lib', 'engine', 'other'] as const;
type Layer = (typeof LAYERS)[number];

const BOUNDARY_RULES = ['engine-is-pure', 'state-no-components'];

const APP_SRC = 'apps/web/src/';

const SHARED_UI_GROUPS = new Set(['charts', 'metricLabel', 'importProgress', 'errors', 'layout']);

const appPath = (path: string): string | undefined => {
  if (!path.startsWith(APP_SRC)) return undefined;
  return path.slice(APP_SRC.length);
};

const CODE = /\.(tsx?|jsx?|mjs|cjs)$/;

const SOURCE = /(\.(tsx?|jsx?|mjs|cjs|astro)|\/)$/;

const isDrawable = (path: string) =>
  !path.includes('node_modules/') &&
  CODE.test(path) &&
  /^(apps|packages|tools|\.claude)\//.test(path);

export const layerOf = (path: string): Layer => {
  if (path.startsWith('packages/engine/') || path === 'packages/engine') return 'engine';
  if (path.startsWith('packages/ui/') || path === 'packages/ui') return 'ui';
  const appRelative = appPath(path);
  if (appRelative === undefined) return 'other';
  if (appRelative.startsWith('lib/') || appRelative === 'lib') return 'lib';
  if (appRelative.startsWith('store/')) return 'store';
  if (appRelative.startsWith('components/')) {
    const group = appRelative.split('/')[1] ?? '';
    if (CODE.test(group) || SHARED_UI_GROUPS.has(group)) return 'ui';
    return 'feature';
  }
  if (appRelative.startsWith('pages/')) return 'page';
  return 'other';
};

const isCovering = ({ path, planned }: { path: string; planned: string }) => {
  const left = path.replace(/\/$/, '');
  const right = planned.replace(/\/$/, '');
  return left === right || left.startsWith(`${right}/`) || right.startsWith(`${left}/`);
};

const isInFocus = ({ path, focus }: { path: string; focus: string[] }) =>
  focus.some((entry) => {
    const folder = entry.replace(/\/$/, '');
    return path === folder || path.startsWith(`${folder}/`);
  });

const collapseFolder = (path: string): string | undefined => {
  if (path.startsWith('packages/')) return path.split('/').slice(0, 2).join('/');
  const appRelative = appPath(path);
  if (appRelative === undefined) return undefined;
  const parts = appRelative.split('/');
  if (parts.length < 2) return undefined;
  const top = parts[0];
  if (top === 'store' || top === 'pages') return undefined;
  if (top === 'components') {
    if (parts.length < 3) return undefined;
    return APP_SRC + parts.slice(0, 2).join('/');
  }
  return APP_SRC + top;
};

const featureOf = (node: string) => (appPath(node) ?? node).split('/')[1];

const nodeOf = ({ path, focus }: { path: string; focus: string[] }) => {
  let folder = collapseFolder(path);
  if (appPath(path) === undefined) folder = dirOf(path);
  if (folder === undefined || isInFocus({ path, focus })) return path;
  if (focus.some((entry) => isInFocus({ path: entry.replace(/\/$/, ''), focus: [folder] }))) {
    return path;
  }
  return folder;
};

const TITLE_BY_LAYER: Record<Layer, string> = {
  page: 'pages',
  ui: 'components',
  feature: 'components/#lt;feature#gt;',
  store: 'store',
  lib: 'lib',
  engine: 'engine',
  other: 'other',
};

const labelOf = ({ node, layer, folded }: { node: string; layer: Layer; folded: boolean }) => {
  const appRelative = appPath(node) ?? node;
  let label = appRelative;
  if (layer === 'feature') label = appRelative.split('/').slice(2).join('/');
  if (layer === 'store') label = appRelative.replace(/^store\//, '');
  if (layer === 'page') label = appRelative.replace(/^pages\//, '');
  if (layer === 'ui') label = appRelative.replace(/^components\//, '');
  if (folded) return `${label || node.split('/').slice(-1)[0]}/`;
  return label;
};

type DrawnModule = { source: string; dependencies: string[] };

const isApp = (node: string) => appPath(node) !== undefined;

const drawnEdges = ({
  modules,
  sources,
  focusNodes,
  focus,
}: {
  modules: DrawnModule[];
  sources: Set<string>;
  focusNodes: Set<string>;
  focus: string[];
}): { edges: [string, string][]; folded: Set<string> } => {
  const folded = new Set<string>();
  const edgeKeys = new Set<string>();
  const edges: [string, string][] = [];
  for (const module of modules) {
    if (!sources.has(module.source)) continue;
    const from = nodeOf({ path: module.source, focus });
    if (from !== module.source) folded.add(from);
    for (const resolved of module.dependencies) {
      if (!sources.has(resolved)) continue;
      const to = nodeOf({ path: resolved, focus });
      if (to !== resolved) folded.add(to);
      if (from === to || (!focusNodes.has(from) && !focusNodes.has(to))) continue;
      const key = `${from}\n${to}`;
      if (edgeKeys.has(key)) continue;
      edgeKeys.add(key);
      edges.push([from, to]);
    }
  }
  return { edges, folded };
};

const nodeIds = (nodes: string[]): ((node: string) => string) => {
  const ids = new Map(nodes.map((node, index) => [node, `n${index}`]));
  return (node: string) => ids.get(node) ?? node;
};

const nodeLabels = ({
  nodes,
  folded,
}: {
  nodes: string[];
  folded: Set<string>;
}): Map<string, string> => {
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
      label = labelOf({ node, layer, folded: folded.has(node) });
    }
    labels.set(node, label);
  }
  const taken = [...labels.values()];
  for (const node of nodes) {
    const label = labels.get(node) ?? node;
    if (taken.filter((other) => other === label).length > 1)
      labels.set(node, appPath(node) ?? node);
  }
  return labels;
};

const featureLines = ({
  inLayer,
  folded,
  nodeLine,
}: {
  inLayer: string[];
  folded: Set<string>;
  nodeLine: (node: string) => string;
}): string[] => {
  const lines: string[] = [];
  const features = [...new Set(inLayer.map(featureOf))];
  for (const feature of features) {
    const featureNodes = inLayer.filter((node) => featureOf(node) === feature);
    if (featureNodes.length === 1 && folded.has(featureNodes[0])) {
      lines.push(nodeLine(featureNodes[0]));
      continue;
    }
    lines.push(`subgraph F_${feature.replace(/\W/g, '_')}["${feature}/"]`);
    for (const node of featureNodes) lines.push(nodeLine(node));
    lines.push('end');
  }
  return lines;
};

const layerLines = ({
  nodes,
  folded,
  nodeLine,
}: {
  nodes: string[];
  folded: Set<string>;
  nodeLine: (node: string) => string;
}): string[] => {
  const lines: string[] = [];
  for (const layer of LAYERS) {
    const inLayer = nodes.filter((node) => isApp(node) && layerOf(node) === layer);
    if (inLayer.length === 0) continue;
    lines.push(`subgraph L_${layer}["${TITLE_BY_LAYER[layer]}"]`);
    if (layer === 'feature') {
      lines.push(...featureLines({ inLayer, folded, nodeLine }));
    } else {
      for (const node of inLayer) lines.push(nodeLine(node));
    }
    lines.push('end');
  }
  return lines;
};

const folderLines = ({
  nodes,
  nodeLine,
}: {
  nodes: string[];
  nodeLine: (node: string) => string;
}): string[] => {
  const lines: string[] = [];
  const others = nodes.filter((node) => !isApp(node));
  const folders = [...new Set(others.map(dirOf))].sort(comparePaths);
  folders.forEach((folder, index) => {
    lines.push(`subgraph G${index}["${folder}/"]`);
    for (const node of others.filter((other) => dirOf(other) === folder))
      lines.push(nodeLine(node));
    lines.push('end');
  });
  return lines;
};

const classLines = ({
  nodes,
  focusNodes,
  added,
  missing,
  idOf,
}: {
  nodes: string[];
  focusNodes: Set<string>;
  added: string[];
  missing: string[];
  idOf: (node: string) => string;
}): string[] => {
  const lines: string[] = [];
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
    `classDef focus stroke:${tokens.textPrimary},stroke-width:2px`,
    `classDef added fill:${tokens.statusWarningMuted},stroke:${tokens.statusWarning},color:${tokens.statusWarning},stroke-width:2px`,
    `classDef missing fill:none,stroke:${tokens.textQuaternary},stroke-dasharray:4 3,color:${tokens.textTertiary}`,
  );
  return lines;
};

export const toDepsGraph = ({
  cruise,
  planned,
}: {
  cruise: DepsInput;
  planned: string[];
}): DepsGraph => {
  const modules = cruise.modules.map((module) => ({
    source: repoPath(module.source),
    dependencies: module.dependencies.map((dependency) => repoPath(dependency.resolved)),
  }));
  const sources = new Set(modules.map((module) => module.source).filter(isDrawable));
  const focusNodes = new Set([...sources].filter((path) => isInFocus({ path, focus: planned })));
  const drawn = drawnEdges({ modules, sources, focusNodes, focus: planned });
  const nodes = [...new Set([...focusNodes, ...drawn.edges.flat()])].sort(comparePaths);
  const idOf = nodeIds(nodes);
  const added = nodes.filter(
    (node) => !planned.some((path) => isCovering({ path: node, planned: path })),
  );
  // A planned path that is not code (messages/*.json, SKILL.md) can never be drawn, so it is never missing.
  const missing = planned.filter(
    (path) => SOURCE.test(path) && !nodes.some((node) => isCovering({ path: node, planned: path })),
  );
  const labels = nodeLabels({ nodes, folded: drawn.folded });
  const nodeLine = (node: string) => `${idOf(node)}["${labels.get(node) ?? node}"]`;
  const lines = [
    'flowchart TB',
    ...layerLines({ nodes, folded: drawn.folded, nodeLine }),
    ...folderLines({ nodes, nodeLine }),
    ...drawn.edges.map((edge) => `${idOf(edge[0])}-->${idOf(edge[1])}`),
    ...classLines({ nodes, focusNodes, added, missing, idOf }),
  ];
  return {
    mermaid: `${lines.join('\n')}\n`,
    nodes: nodes.length,
    edges: drawn.edges.length,
    added,
    missing,
  };
};

const ROOTS_BY_AREA: Partial<Record<Area, string[]>> = {
  app: ['apps/web/src'],
  engine: ['packages/engine/src'],
  gpx: ['packages/gpx/src'],
  ui: ['packages/ui/src'],
  i18n: ['packages/i18n/src'],
  testing: ['packages/testing/src'],
  workbench: ['tools/workbench/site/src', 'tools/workbench/scripts'],
  docs: ['tools/docs'],
};

export const cruiseRoots = ({ areas, planned }: { areas: Area[]; planned: string[] }): string[] => {
  const roots = areas.flatMap((area) => ROOTS_BY_AREA[area] ?? []);
  for (const path of planned) {
    if (path.endsWith('/')) roots.push(path.replace(/\/+$/, ''));
    else if (/\.tsx?$/.test(path)) roots.push(dirOf(path));
  }
  const unique = [...new Set(roots.filter((root) => root !== ''))].sort(comparePaths);
  return unique.filter(
    (root) => !unique.some((other) => other !== root && root.startsWith(`${other}/`)),
  );
};

const shortModule = (path: string) => {
  const match = /node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?((?:@[^/]+\/)?[^/]+)/.exec(path);
  if (match) return match[1];
  return path;
};

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

export const boundaryLine = (boundary: Boundary): string => {
  const rules = boundary.rules.join(', ');
  const cruisedSummary = `${boundary.modules} modules, ${boundary.dependencies} dependencies cruised`;
  if (boundary.violations.length === 0) {
    return `Boundary check · ${rules}: no violations (${cruisedSummary})`;
  }
  const list = boundary.violations
    .map((violation) => `${violation.rule} ${violation.from} → ${violation.to}`)
    .join('; ');
  return `Boundary check · ${boundary.violations.length} violation(s): ${list} (${cruisedSummary})`;
};

const CRUISE_CONFIG_ARGS = [
  '--config',
  'tools/workbench/.dependency-cruiser.cjs',
  '--output-type',
  'json',
];
const CRUISE_ARGS = [...CRUISE_CONFIG_ARGS, 'apps/web/src', 'packages'];
const DEPCRUISE_MAX_BUFFER_BYTES = 256 * 1024 * 1024;
const SHORT_SHA_LENGTH = 7;

export const cruiseRepo = (args: string[] = CRUISE_ARGS): Cruise | undefined => {
  const bin = join(WORKBENCH_DIR, 'node_modules', '.bin', 'depcruise');
  // depcruise exits with the number of error-level violations, so the status is not a failure.
  const cruiseRun = spawnSync(bin, args, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: DEPCRUISE_MAX_BUFFER_BYTES,
  });
  let cruiseJson: unknown;
  try {
    cruiseJson = JSON.parse(cruiseRun.stdout);
  } catch {
    console.error(`depcruise produced no JSON:\n${cruiseRun.stderr}`);
    return undefined;
  }
  const parsed = cruiseSchema.safeParse(cruiseJson);
  if (!parsed.success) {
    console.error(`depcruise output has an unexpected shape: ${parsed.error.message}`);
    return undefined;
  }
  return parsed.data;
};

const areasOf = (planFile: string): Area[] => {
  if (!existsSync(planFile)) return [];
  let frontmatterYaml: unknown;
  try {
    frontmatterYaml = parseFrontmatter(readFileSync(planFile, 'utf8'));
  } catch {
    return [];
  }
  const parsed = planFrontmatterSchema.safeParse(frontmatterYaml);
  if (!parsed.success) return [];
  return parsed.data.areas ?? [];
};

const writeDepsGraph = ({
  folder,
  planned,
  cruise,
}: {
  folder: string;
  planned: string[];
  cruise: Cruise;
}): { graph: DepsGraph; roots: string[] } => {
  const roots = cruiseRoots({ areas: areasOf(join(folder, 'plan.md')), planned }).filter((root) =>
    existsSync(join(REPO_ROOT, root)),
  );
  let scoped: Cruise = cruise;
  if (roots.length > 0) {
    const scopedCruise = cruiseRepo([...CRUISE_CONFIG_ARGS, ...roots]);
    if (scopedCruise === undefined) process.exit(1);
    scoped = scopedCruise;
  }
  const graph = toDepsGraph({ cruise: scoped, planned });
  const review = join(folder, 'review');
  mkdirSync(review, { recursive: true });
  writeFileSync(join(review, 'deps.mmd'), graph.mermaid);
  return { graph, roots };
};

const writeComponentGraph = ({
  folder,
  planned,
  added,
}: {
  folder: string;
  planned: string[];
  added: string[];
}): ComponentGraph => {
  const componentFiles = interfaceFiles({ root: REPO_ROOT, paths: planned }).files.filter((path) =>
    path.endsWith('.tsx'),
  );
  let components: ComponentGraph = toComponentGraph({
    cruise: { modules: [] },
    added: [],
    changed: [],
  });
  if (componentFiles.length > 0) {
    const componentCruise = cruiseRepo([...CRUISE_CONFIG_ARGS, ...componentFiles]);
    if (componentCruise === undefined) process.exit(1);
    const tsxAdded = interfaceFiles({ root: REPO_ROOT, paths: added }).files;
    components = toComponentGraph({
      cruise: componentCruise,
      added: componentFiles.filter((path) => tsxAdded.includes(path)),
      changed: componentFiles.filter((path) => !tsxAdded.includes(path)),
    });
  }
  writeFileSync(join(folder, 'review', 'components.mmd'), components.mermaid);
  return components;
};

const writeDepsJson = ({
  item,
  folder,
  generated,
  planned,
  depsGraph,
  components,
  boundary,
}: {
  item: string;
  folder: string;
  generated: string;
  planned: string[];
  depsGraph: { graph: DepsGraph; roots: string[] };
  components: ComponentGraph;
  boundary: Boundary;
}): void => {
  const graph = depsGraph.graph;
  const roots = depsGraph.roots;
  const depsJson: DepsJson = {
    item,
    generated,
    command: `depcruise ${CRUISE_CONFIG_ARGS.join(' ')} ${roots.join(' ')}`,
    roots,
    focus: planned,
    astro: planned.filter((path) => path.endsWith('.astro')),
    nodes: graph.nodes,
    edges: graph.edges,
    added: graph.added,
    missing: graph.missing,
    boundary,
    components: { nodes: components.nodes, edges: components.edges },
  };
  writeFileSync(join(folder, 'review', 'deps.json'), `${JSON.stringify(depsJson, null, 2)}\n`);
  console.log(
    `${BACKLOG_DIR}/${item}/review/deps.mmd: ${graph.nodes} modules · ${graph.edges} imports drawn · ${graph.added.length} added · ${graph.missing.length} missing`,
  );
  console.log(
    `${BACKLOG_DIR}/${item}/review/components.mmd: ${components.nodes} components · ${components.edges} imports`,
  );
};

const writeFilesJson = ({
  item,
  folder,
  generated,
  planned,
}: {
  item: string;
  folder: string;
  generated: string;
  planned: string[];
}): FilesComparison => {
  const changes = gitChanges({ root: REPO_ROOT, override: baseRevisionOverride() });
  if (changes === undefined) process.exit(1);
  const files = compareFiles({ changes: changes.changes, plannedPaths: planned });
  const filesJson: FilesJson = { item, generated, base: changes.base, ref: changes.ref, ...files };
  writeFileSync(join(folder, 'review', 'files.json'), `${JSON.stringify(filesJson, null, 2)}\n`);
  console.log(
    `${BACKLOG_DIR}/${item}/review/files.json: ${files.planned.length} changed and planned · ${files.notPlanned.length} changed, not planned · ${files.untouched.length} planned, untouched (base ${changes.base.slice(0, SHORT_SHA_LENGTH)}, ${changes.ref})`,
  );
  return files;
};

const reportBoundary = (boundary: Boundary): void => {
  const line = boundaryLine(boundary);
  if (boundary.violations.length > 0) {
    console.error(line);
    process.exit(1);
  }
  console.log(line);
};

const requiredPlannedPaths = (cli: ReturnType<typeof itemTechPaths>): string[] => {
  const planned = [...cli.paths.added, ...cli.paths.changed];
  if (planned.length === 0) {
    console.error(`${BACKLOG_DIR}/${cli.item}/tech.md: no paths under ### New or ### Changed`);
    process.exit(1);
  }
  return planned;
};

const main = () => {
  const cli = itemTechPaths('deps');
  const folder = join(REPO_ROOT, BACKLOG_DIR, cli.item);
  const planned = requiredPlannedPaths(cli);
  const cruise = cruiseRepo();
  if (cruise === undefined) process.exit(1);
  const boundary = boundaryOf(cruise);
  const generated = new Date().toISOString().slice(0, 10);
  const depsGraph = writeDepsGraph({ folder, planned, cruise });
  const components = writeComponentGraph({ folder, planned, added: cli.paths.added });
  writeDepsJson({ item: cli.item, folder, generated, planned, depsGraph, components, boundary });
  console.log(
    writeInterfaces({
      item: cli.item,
      comparison: writeFilesJson({ item: cli.item, folder, generated, planned }),
    }),
  );
  reportBoundary(boundary);
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
