import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { marked, type Token, type Tokens } from 'marked';
import {
  depsJsonSchema,
  filesJsonSchema,
  type DepsJson,
  type FileChange,
  type FilesJson,
} from '@scripts/reviewArtifactsContract.ts';
import { readTechEntries } from '@scripts/techFile.ts';
import { escapeHtml } from './html.ts';
import { renderTech } from './markdown.ts';

export type Deps = { mmd: string; json: DepsJson | undefined };

export const readDeps = (folder: string): Deps | undefined => {
  const mmd = join(folder, 'review', 'deps.mmd');
  if (!existsSync(mmd)) return undefined;
  let depsJson: Deps['json'] = undefined;
  const jsonFile = join(folder, 'review', 'deps.json');
  if (existsSync(jsonFile)) {
    try {
      const parsed = depsJsonSchema.safeParse(JSON.parse(readFileSync(jsonFile, 'utf8')));
      if (parsed.success) depsJson = parsed.data;
    } catch {
      depsJson = undefined;
    }
  }
  return { mmd: readFileSync(mmd, 'utf8'), json: depsJson };
};

const actualBar = ({ path, generated }: { path: string; generated: string | undefined }) => {
  let date = '';
  if (generated !== undefined) date = ` · ${escapeHtml(generated)}`;
  return `<div class="tt-fig__bar"><span class="tt-fig__label">Actual</span><span class="tt-fig__path">${path}${date}</span></div>`;
};

const missingActual = ({ block, path, folder }: { block: string; path: string; folder: string }) =>
  `<figure class="tt-fig tt-actual" data-block="${block}">${actualBar({ path, generated: undefined })}<p class="tt-placeholder">Run <code>vp run workbench:deps -- ${escapeHtml(folder)}</code></p></figure>`;

export const modulesActualHtml = ({
  folder,
  graph,
}: {
  folder: string;
  graph: Deps | undefined;
}): string => {
  if (graph === undefined)
    return missingActual({ block: 'actual', path: 'review/deps.mmd', folder });
  const depsJson = graph.json;
  let counts = '';
  let added = '';
  let missing = '';
  let check = '';
  if (depsJson !== undefined) {
    counts = `<p class="tt-counts"><span>Drawn: ${depsJson.nodes} modules · ${depsJson.edges} imports</span></p>`;
    const astro = depsJson.astro ?? [];
    if (astro.length > 0) {
      counts += `<p class="tt-counts"><span><code>.astro</code> files are not in the graph (dependency-cruiser does not parse them): ${astro.map((path) => `<code>${escapeHtml(path)}</code>`).join(' · ')}</span></p>`;
    }
    added = ` <b>(${depsJson.added.length})</b>`;
    missing = ` <b>(${depsJson.missing.length})</b>`;
    const violations = depsJson.boundary.violations;
    const rules = escapeHtml(depsJson.boundary.rules.join(', '));
    if (violations.length === 0) {
      check = `<p class="tt-check" data-block="check"><span class="tt-check__ok">✔</span><span><strong>Boundary check</strong> · <code>${rules}</code>: no violations (${depsJson.boundary.modules} modules, ${depsJson.boundary.dependencies} dependencies cruised)</span></p>`;
    } else {
      const list = violations
        .map((violation) => `${violation.rule}: ${violation.from} → ${violation.to}`)
        .join('; ');
      check = `<div class="tt-check" data-block="check"><span class="tt-check__err">✕</span><span><strong>Boundary check</strong> · ${violations.length} violation(s): ${escapeHtml(list)}</span></div>`;
    }
  }
  const figure = [
    '<figure class="tt-fig tt-actual" data-block="actual">',
    actualBar({ path: 'review/deps.mmd', generated: depsJson?.generated }),
    '<div data-graph="actual" data-title="Actual imports · review/deps.mmd"></div>',
    `<pre hidden data-mmd>${escapeHtml(graph.mmd)}</pre>`,
    counts,
    '<p class="tt-legend">',
    '<span><i class="tt-sw tt-sw--focus"></i>focus</span>',
    `<span><i class="tt-sw tt-sw--added"></i>imported, not planned${added}</span>`,
    `<span><i class="tt-sw tt-sw--missing"></i>planned, not in the graph${missing}</span>`,
    '</p></figure>',
  ];
  return figure.join('') + check;
};

export const componentsActualHtml = ({
  folder,
  mmd,
  graph,
}: {
  folder: string;
  mmd: string | undefined;
  graph: Deps | undefined;
}): string => {
  if (mmd === undefined)
    return missingActual({ block: 'components-actual', path: 'review/components.mmd', folder });
  let counts = '';
  const components = graph?.json?.components;
  if (components !== undefined) {
    counts = `<p class="tt-counts"><span>Drawn: ${components.nodes} components · ${components.edges} imports</span></p>`;
  }
  return [
    '<figure class="tt-fig tt-actual" data-block="components-actual">',
    actualBar({ path: 'review/components.mmd', generated: graph?.json?.generated }),
    '<div data-graph="components" data-title="Actual components · review/components.mmd"></div>',
    `<pre hidden data-mmd>${escapeHtml(mmd)}</pre>`,
    counts,
    '<p class="tt-legend">',
    '<span><i class="tt-sw tt-sw--focus"></i>new</span>',
    '<span><i class="tt-sw tt-sw--mod"></i>changed</span>',
    '<span><i class="tt-sw tt-sw--missing"></i>imported</span>',
    '</p></figure>',
  ].join('');
};

type FileChip = 'A' | 'M' | 'D';

type FileRow = {
  path: string;
  chip: FileChip | undefined;
  note: string;
  tag: 'not planned' | 'untouched' | undefined;
};

const TITLE_BY_CHIP: Record<FileChip, string> = { A: 'added', M: 'modified', D: 'deleted' };

const CHIP_BY_FILE_STATUS = { added: 'A', modified: 'M', deleted: 'D' } satisfies Record<
  'added' | 'modified' | 'deleted',
  FileChip
>;
const SHORT_SHA_LENGTH = 7;

const inlineNote = (note: string) =>
  escapeHtml(note).replace(/`([^`]+)`/g, (_match, code: string) => `<code>${code}</code>`);

const splitPath = (path: string): [string, string] => {
  const trailingSlash = path.endsWith('/');
  const parts = path.replace(/\/+$/, '').split('/');
  let name = parts.pop() ?? path;
  if (trailingSlash) name = `${name}/`;
  return [parts.join('/'), name];
};

const compareRows = (a: FileRow, b: FileRow) => {
  const left = splitPath(a.path);
  const right = splitPath(b.path);
  return left[0].localeCompare(right[0]) || left[1].localeCompare(right[1]);
};

const fileList = ({ summary, rows }: { summary: string; rows: FileRow[] }) => {
  const rowHtml = [`<p class="tt-fsummary">${summary}</p>`];
  let current: string | undefined = undefined;
  for (const row of [...rows].sort(compareRows)) {
    const pathParts = splitPath(row.path);
    if (pathParts[0] !== current) {
      current = pathParts[0];
      let label = `${pathParts[0]}/`;
      if (pathParts[0] === '') label = 'repo root';
      rowHtml.push(`<div class="tt-folder">${escapeHtml(label)}</div>`);
    }
    let chip = '<span class="tt-chip tt-chip--none"></span>';
    if (row.chip !== undefined) {
      chip = `<span class="tt-chip tt-chip--${row.chip}" title="${TITLE_BY_CHIP[row.chip]}">${row.chip}</span>`;
    }
    let tag = '';
    if (row.tag !== undefined) tag = row.tag;
    let modifier = '';
    if (row.chip === 'D') modifier = ' tt-frow--deleted';
    if (row.tag === 'untouched') modifier = ' tt-frow--untouched';
    rowHtml.push(
      `<div class="tt-frow${modifier}" title="${escapeHtml(row.path)}"><span class="tt-frow__name">${escapeHtml(pathParts[1])}</span><span class="tt-frow__note">${inlineNote(row.note)}</span><span class="tt-frow__tag">${tag}</span>${chip}</div>`,
    );
  }
  return `<div class="tt-files__body">${rowHtml.join('')}</div>`;
};

const filesCount = (count: number) => {
  if (count === 1) return '1 file';
  return `${count} files`;
};

export const filesPlannedHtml = (tech: string): string | undefined => {
  const entries = readTechEntries(tech);
  if (entries.added.length === 0 && entries.changed.length === 0) return undefined;
  const rows = ({
    list,
    chip,
  }: {
    list: { path: string; note: string }[];
    chip: 'A' | 'M';
  }): FileRow[] =>
    list.map((entry) => ({ path: entry.path, chip, note: entry.note, tag: undefined }));
  const all = [
    ...rows({ list: entries.added, chip: 'A' }),
    ...rows({ list: entries.changed, chip: 'M' }),
  ];
  return [
    '<figure class="tt-fig tt-files" data-block="files-planned">',
    '<div class="tt-fig__bar"><span class="tt-fig__label">Planned</span><span class="tt-fig__path">from tech.md</span></div>',
    fileList({ summary: filesCount(all.length), rows: all }),
    '</figure>',
  ].join('');
};

const parsedFilesJson = (text: string): FilesJson | undefined => {
  let filesJsonValue: unknown;
  try {
    filesJsonValue = JSON.parse(text);
  } catch {
    return undefined;
  }
  const parsed = filesJsonSchema.safeParse(filesJsonValue);
  if (!parsed.success) return undefined;
  return parsed.data;
};

export const filesActualHtml = ({
  folder,
  text,
}: {
  folder: string;
  text: string | undefined;
}): string => {
  const missing = missingActual({ block: 'files-actual', path: 'review/files.json', folder });
  if (text === undefined) return missing;
  const files = parsedFilesJson(text);
  if (files === undefined) return missing;
  const rows = ({ list, tag }: { list: FileChange[]; tag: FileRow['tag'] }): FileRow[] =>
    list.map((entry) => ({
      path: entry.path,
      chip: CHIP_BY_FILE_STATUS[entry.status],
      note: '',
      tag,
    }));
  const all = [
    ...rows({ list: files.planned, tag: undefined }),
    ...rows({ list: files.notPlanned, tag: 'not planned' }),
    ...files.untouched.map((path): FileRow => ({
      path,
      chip: undefined,
      note: '',
      tag: 'untouched',
    })),
  ];
  const changed = files.planned.length + files.notPlanned.length;
  const summary = `${filesCount(changed)} · ${files.notPlanned.length} not planned · ${files.untouched.length} untouched · base ${files.base.slice(0, SHORT_SHA_LENGTH)}`;
  const base = `${files.generated} · ${files.ref}`;
  return [
    '<figure class="tt-fig tt-files" data-block="files-actual">',
    actualBar({ path: 'review/files.json', generated: base }),
    fileList({ summary, rows: all }),
    '</figure>',
  ].join('');
};

const interfacesSummary = (
  text: string,
): { generated: string | undefined; countsHtml: string; missingHtml: string } => {
  const tokens = marked.lexer(text);
  const missing = (sectionTokensOf({ tokens, heading: 'Missing' }) ?? [])
    .filter((token): token is Tokens.List => token.type === 'list')
    .flatMap((token) =>
      token.items.map((entry) => /`([^`]+)`/.exec(entry.text)?.[1] ?? entry.text),
    );
  let generated: string | undefined = undefined;
  const date = /Generated (\d{4}-\d{2}-\d{2})/.exec(text);
  if (date !== null) generated = date[1];
  let countsHtml = '';
  const counts = /(\d+) planned, (\d+) not planned/.exec(text);
  if (counts !== null) {
    countsHtml = `<p class="tt-counts"><span>Changed TypeScript files: ${counts[1]} planned · ${counts[2]} not planned</span></p>`;
  }
  let missingHtml = '';
  if (missing.length > 0) {
    missingHtml = `<p class="tt-counts"><span>Planned, not changed: ${missing.map((path) => `<code>${escapeHtml(path)}</code>`).join(' · ')}</span></p>`;
  }
  return { generated, countsHtml, missingHtml };
};

export const interfacesActualHtml = async ({
  folder,
  text,
}: {
  folder: string;
  text: string | undefined;
}): Promise<string> => {
  if (text === undefined)
    return missingActual({ block: 'interfaces-actual', path: 'review/interfaces.md', folder });
  const tokens = marked.lexer(text);
  const blocks = tokens
    .filter((token): token is Tokens.Code => token.type === 'code')
    .map((token) => `\`\`\`${token.lang ?? ''}\n${token.text}\n\`\`\``);
  const summary = interfacesSummary(text);
  return [
    '<figure class="tt-fig tt-interfaces" data-block="interfaces-actual">',
    actualBar({ path: 'review/interfaces.md', generated: summary.generated }),
    `<div class="tt-code">${await renderTech(blocks.join('\n\n'))}</div>`,
    summary.countsHtml,
    summary.missingHtml,
    '</figure>',
  ].join('');
};

const sectionTokensOf = ({
  tokens,
  heading,
}: {
  tokens: Token[];
  heading: string;
}): Token[] | undefined => {
  const start = tokens.findIndex(
    (token) =>
      token.type === 'heading' &&
      (token as Tokens.Heading).depth === 2 &&
      token.text.trim() === heading,
  );
  if (start === -1) return undefined;
  const rest = tokens.slice(start + 1);
  const end = rest.findIndex(
    (token) => token.type === 'heading' && (token as Tokens.Heading).depth <= 2,
  );
  if (end === -1) return rest;
  return rest.slice(0, end);
};
