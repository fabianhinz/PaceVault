import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { z } from 'zod';
import { readTechPaths } from './workbenchFrontmatter.ts';

/**
 * `vp run workbench:deps -- <feature>`: the actual import graph of a feature at review time.
 * Cruises `src/` once with dependency-cruiser (`.dependency-cruiser.cjs`: boundary rules and
 * options), then focuses on the `### New` paths of `workbench/<feature>/tech.md` (`### Changed`
 * when New is empty), collapses every other feature and layer folder to one node, keeps only the
 * edges that touch a focus module and marks modules imported but not planned (added) and planned
 * but not in the graph (missing). Writes `workbench/<feature>/review/deps.mmd` (Mermaid) and
 * `review/deps.json` (counts, added, missing, boundary result) and exits 1 on a boundary violation.
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

/** The repo layer of a module path (`src/…`); anything outside the named folders is `other`. */
export const layerOf = (path: string): Layer => {
  if (path.startsWith('src/packages/engine/') || path === 'src/packages/engine') return 'engine';
  if (path.startsWith('src/lib/') || path === 'src/lib') return 'lib';
  if (path.startsWith('src/store/')) return 'store';
  if (path.startsWith('src/features/')) return 'feature';
  if (path.startsWith('src/components/')) return 'ui';
  if (path.startsWith('src/pages/')) return 'page';
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
 * The folder a module collapses into: `src/features/<f>`, `src/components/<x>`,
 * `src/packages/<p>` or `src/<dir>`; store and page files and root files stay single.
 */
const collapseFolder = (path: string): string | undefined => {
  const parts = path.split('/');
  if (parts.length < 3) return undefined;
  const top = parts[1];
  if (top === 'store' || top === 'pages') return undefined;
  if (top === 'features' || top === 'components' || top === 'packages') {
    if (parts.length < 4) return undefined;
    return parts.slice(0, 3).join('/');
  }
  return parts.slice(0, 2).join('/');
};

/** The node a module is drawn as: itself, or its folder when no focus module lives there. */
const nodeOf = (path: string, focus: string[]) => {
  const folder = collapseFolder(path);
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
  let label = node.replace(/^src\//, '');
  if (layer === 'feature') label = node.split('/').slice(3).join('/');
  if (layer === 'store') label = node.replace(/^src\/store\//, '');
  if (layer === 'page') label = node.replace(/^src\/pages\//, '');
  if (layer === 'ui') label = node.replace(/^src\/components\//, '');
  if (folded) return `${label || node.split('/').slice(-1)[0]}/`;
  return label;
};

/**
 * Regroups a dependency-cruiser result by layer around the focus modules (Q5–Q7) and marks the
 * difference to the planned paths (Q2). Only `src/` modules are drawn; packages are left out.
 */
export const toDepsGraph = (cruise: DepsInput, focus: string[], planned: string[]): DepsGraph => {
  const sources = new Set(
    cruise.modules.map((module) => module.source).filter((path) => path.startsWith('src/')),
  );
  const focusNodes = new Set([...sources].filter((path) => inFocus(path, focus)));
  const folded = new Set<string>();
  const edgeKeys = new Set<string>();
  const edges: [string, string][] = [];
  for (const module of cruise.modules) {
    if (!sources.has(module.source)) continue;
    const from = nodeOf(module.source, focus);
    if (from !== module.source) folded.add(from);
    for (const dependency of module.dependencies) {
      if (!sources.has(dependency.resolved)) continue;
      const to = nodeOf(dependency.resolved, focus);
      if (to !== dependency.resolved) folded.add(to);
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
  // Only `src/` modules can be drawn, so a planned path elsewhere (messages/*.json) is never missing.
  const missing = planned.filter(
    (path) => path.startsWith('src/') && !nodes.some((node) => covers(node, path)),
  );

  const lines = ['flowchart TB'];
  const nodeLine = (node: string, layer: Layer) =>
    `${idOf(node)}["${labelOf(node, layer, folded.has(node))}"]`;
  for (const entry of LAYER_TITLES) {
    const inLayer = nodes.filter((node) => layerOf(node) === entry.layer);
    if (inLayer.length === 0) continue;
    lines.push(`subgraph L_${entry.layer}["${entry.title}"]`);
    if (entry.layer === 'feature') {
      const features = [...new Set(inLayer.map((node) => node.split('/')[2]))];
      for (const feature of features) {
        const own = inLayer.filter((node) => node.split('/')[2] === feature);
        const collapsedOnly = own.length === 1 && folded.has(own[0]);
        if (collapsedOnly) {
          lines.push(nodeLine(own[0], 'other'));
          continue;
        }
        lines.push(`subgraph F_${feature.replace(/\W/g, '_')}["${feature}/"]`);
        for (const node of own) lines.push(nodeLine(node, 'feature'));
        lines.push('end');
      }
    } else {
      for (const node of inLayer) lines.push(nodeLine(node, entry.layer));
    }
    lines.push('end');
  }
  for (const edge of edges) lines.push(`${idOf(edge[0])}-->${idOf(edge[1])}`);
  if (missing.length > 0) {
    lines.push('subgraph missingPlanned["planned, not in the graph"]');
    missing.forEach((path, index) => lines.push(`miss${index}["${path.replace(/^src\//, '')}"]`));
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

/** `node_modules/.pnpm/react@19/node_modules/react/index.js` → `react`; src paths stay. */
const shortModule = (path: string) => {
  const match = /node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?((?:@[^/]+\/)?[^/]+)/.exec(path);
  if (match) return match[1];
  return path;
};

/** The boundary rule result of the whole cruise (every module of `src/`, not only the focus). */
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

const REPO_ROOT = resolve(import.meta.dirname, '..');

export const CRUISE_ARGS = ['--config', '.dependency-cruiser.cjs', '--output-type', 'json', 'src'];

/** Runs depcruise over `src/`; `undefined` (with the reason on stderr) when no result parses. */
const cruiseRepo = (): Cruise | undefined => {
  const bin = join(REPO_ROOT, 'node_modules', '.bin', 'depcruise');
  // depcruise exits with the number of error-level violations, so the status is not a failure.
  const run = spawnSync(bin, CRUISE_ARGS, {
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

const main = () => {
  const args = parseArgs({ allowPositionals: true, options: {} });
  const feature = args.positionals[0];
  if (feature === undefined) {
    console.error('usage: vp run workbench:deps -- <feature>');
    process.exit(1);
  }
  const folder = join(REPO_ROOT, 'workbench', feature);
  const techFile = join(folder, 'tech.md');
  if (!existsSync(techFile)) {
    console.error(`workbench/${feature}/tech.md: missing`);
    process.exit(1);
  }
  const paths = readTechPaths(readFileSync(techFile, 'utf8'));
  let focus = paths.added;
  if (focus.length === 0) focus = paths.changed;
  if (focus.length === 0) {
    console.error(`workbench/${feature}/tech.md: no paths under ### New or ### Changed`);
    process.exit(1);
  }
  const cruise = cruiseRepo();
  if (cruise === undefined) process.exit(1);
  const graph = toDepsGraph(cruise, focus, [...paths.added, ...paths.changed]);
  const boundary = boundaryOf(cruise);
  const review = join(folder, 'review');
  mkdirSync(review, { recursive: true });
  writeFileSync(join(review, 'deps.mmd'), graph.mermaid);
  const json = {
    feature,
    generated: new Date().toISOString().slice(0, 10),
    command: `depcruise ${CRUISE_ARGS.join(' ')}`,
    focus,
    nodes: graph.nodes,
    edges: graph.edges,
    added: graph.added,
    missing: graph.missing,
    boundary,
  };
  writeFileSync(join(review, 'deps.json'), `${JSON.stringify(json, null, 2)}\n`);
  console.log(
    `workbench/${feature}/review/deps.mmd: ${graph.nodes} modules · ${graph.edges} imports drawn · ${graph.added.length} added · ${graph.missing.length} missing`,
  );
  const line = boundaryLine(boundary);
  if (boundary.violations.length > 0) {
    console.error(line);
    process.exit(1);
  }
  console.log(line);
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
