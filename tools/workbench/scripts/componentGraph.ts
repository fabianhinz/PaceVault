import { tokens } from '@pacevault/ui/lib/tokens.ts';
import type { DepsInput } from './deps.ts';
import { comparePaths, dirOf, repoPath } from './paths.ts';

export type ComponentGraph = {
  mermaid: string;
  nodes: number;
  edges: number;
};

const isComponent = (path: string) => path.endsWith('.tsx') && !path.includes('node_modules/');

const componentName = (path: string) => (path.split('/').pop() ?? path).replace(/\.tsx$/, '');

const componentImports = (cruise: DepsInput): Map<string, Set<string>> => {
  const imports = new Map<string, Set<string>>();
  for (const module of cruise.modules) {
    const from = repoPath(module.source);
    if (!isComponent(from)) continue;
    const fileImports = imports.get(from) ?? new Set<string>();
    for (const dependency of module.dependencies) {
      const to = repoPath(dependency.resolved);
      if (isComponent(to) && to !== from) fileImports.add(to);
    }
    imports.set(from, fileImports);
  }
  return imports;
};

const componentEdges = ({
  nodes,
  imports,
  drawn,
}: {
  nodes: string[];
  imports: Map<string, Set<string>>;
  drawn: Set<string>;
}): [string, string][] => {
  const edges: [string, string][] = [];
  for (const from of nodes) {
    for (const to of [...(imports.get(from) ?? [])].sort(comparePaths)) {
      if (drawn.has(to)) edges.push([from, to]);
    }
  }
  return edges;
};

const componentClassLines = ({
  nodes,
  entries,
  added,
  idOf,
}: {
  nodes: string[];
  entries: Set<string>;
  added: string[];
  idOf: (node: string) => string;
}): string[] => {
  const lines: string[] = [];
  const pushClassLine = ({ nodes: classNodes, name }: { nodes: string[]; name: string }) => {
    if (classNodes.length > 0) lines.push(`class ${classNodes.map(idOf).join(',')} ${name}`);
  };
  const addedSet = new Set(added);
  pushClassLine({
    nodes: nodes.filter((node) => entries.has(node) && addedSet.has(node)),
    name: 'new',
  });
  pushClassLine({
    nodes: nodes.filter((node) => entries.has(node) && !addedSet.has(node)),
    name: 'mod',
  });
  pushClassLine({ nodes: nodes.filter((node) => !entries.has(node)), name: 'ui' });
  lines.push(
    `classDef new stroke:${tokens.textPrimary},stroke-width:2px`,
    `classDef mod stroke:${tokens.textTertiary},stroke-width:2px`,
    `classDef ui stroke:${tokens.textTertiary},stroke-dasharray:4 3`,
  );
  return lines;
};

const componentLines = ({
  nodes,
  imports,
  drawn,
  entries,
  added,
}: {
  nodes: string[];
  imports: Map<string, Set<string>>;
  drawn: Set<string>;
  entries: Set<string>;
  added: string[];
}): { lines: string[]; edges: [string, string][] } => {
  const ids = new Map(nodes.map((node, index) => [node, `c${index}`]));
  const idOf = (node: string) => ids.get(node) ?? node;
  const edges = componentEdges({ nodes, imports, drawn });
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
  lines.push(...componentClassLines({ nodes, entries, added, idOf }));
  return { lines, edges };
};

export const toComponentGraph = ({
  cruise,
  added,
  changed,
}: {
  cruise: DepsInput;
  added: string[];
  changed: string[];
}): ComponentGraph => {
  const entries = new Set([...added, ...changed].filter(isComponent));
  const imports = componentImports(cruise);
  const drawn = new Set(entries);
  for (const entry of entries) for (const to of imports.get(entry) ?? []) drawn.add(to);
  const nodes = [...drawn].sort(comparePaths);
  const drawing = componentLines({ nodes, imports, drawn, entries, added });
  return {
    mermaid: `${drawing.lines.join('\n')}\n`,
    nodes: nodes.length,
    edges: drawing.edges.length,
  };
};
