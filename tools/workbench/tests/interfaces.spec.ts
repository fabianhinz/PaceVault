import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readTechPaths } from '../scripts/frontmatter.ts';
import { compareFiles, type FileChange } from '../scripts/changedFiles.ts';
import {
  changedInterfaceFiles,
  extractInterfaces,
  interfaceFiles,
  renderInterfaces,
} from '../scripts/interfaces.ts';

const TECH = `# Tech

## Modules

### New

- \`src/sum.ts\`: sums
- \`src/shapes/\`: shape types
- \`src/notes.md\`: not TypeScript
- \`src/gone.ts\`: planned, never written

### Changed

- \`src/sum.ts\`: listed twice, kept once
`;

const SUM = `import type { Shape } from './shapes/shape.ts';

const local = 2;

/** Adds two numbers. */
export const sum = (a: number, b: number): number => a + b + local - local;

export function area(shape: Shape): number {
  return shape.width * shape.height;
}

export type Pair = [number, number];
`;

const SHAPE = `export interface Shape {
  width: number;
  height: number;
}

export const unit: Shape = { width: 1, height: 1 };
`;

describe('workbenchInterfaces', () => {
  let root = '';

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'wb-interfaces-'));
    mkdirSync(join(root, 'src', 'shapes'), { recursive: true });
    writeFileSync(join(root, 'tech.md'), TECH);
    writeFileSync(join(root, 'src', 'sum.ts'), SUM);
    writeFileSync(join(root, 'src', 'shapes', 'shape.ts'), SHAPE);
    writeFileSync(join(root, 'src', 'notes.md'), '# Notes\n');
    writeFileSync(join(root, 'src', 'extra.ts'), 'export const extra = 3;\n');
  });

  afterEach(() => rmSync(root, { recursive: true, force: true }));

  // The git change list (R23): sum.ts and the shapes folder planned; extra.ts not planned;
  // a deleted file, a declaration file and the notes are no interfaces; gone.ts planned, never written.
  const CHANGES: FileChange[] = [
    { path: 'src/sum.ts', status: 'modified' },
    { path: 'src/shapes/shape.ts', status: 'added' },
    { path: 'src/extra.ts', status: 'added' },
    { path: 'src/old.ts', status: 'deleted' },
    { path: 'src/types.d.ts', status: 'added' },
    { path: 'src/notes.md', status: 'added' },
  ];

  const run = () => {
    const paths = readTechPaths(TECH);
    const found = changedInterfaceFiles(compareFiles(CHANGES, [...paths.added, ...paths.changed]));
    const exports = extractInterfaces(
      root,
      found.files.map((file) => file.path),
    );
    return { found, markdown: renderInterfaces('demo', '2026-10-21', found, exports) };
  };

  it('takes the changed TypeScript files, planned first, and the planned ones nobody changed as missing', () => {
    const found = run().found;
    expect(found.files).toEqual([
      { path: 'src/shapes/shape.ts', planned: true },
      { path: 'src/sum.ts', planned: true },
      { path: 'src/extra.ts', planned: false },
    ]);
    expect(found.missing).toEqual(['src/gone.ts']);
  });

  it('keeps the TypeScript files behind planned paths in tech.md order (the component tree input)', () => {
    const paths = readTechPaths(TECH);
    const found = interfaceFiles(root, [...paths.added, ...paths.changed]);
    expect(found.files).toEqual(['src/sum.ts', 'src/shapes/shape.ts']);
    expect(found.missing).toEqual(['src/gone.ts']);
  });

  it('lists every export with its signature in source order', () => {
    const exports = extractInterfaces(root, ['src/sum.ts', 'src/shapes/shape.ts']);
    expect(exports.get('src/sum.ts')).toEqual([
      'export const sum: (a: number, b: number) => number;',
      'export const area: (shape: Shape) => number;',
      'export type Pair = [number, number];',
    ]);
    expect(exports.get('src/shapes/shape.ts')).toEqual([
      'export interface Shape {\n  width: number;\n  height: number;\n}',
      'export const unit: Shape;',
    ]);
  });

  it('writes one ts block per file, marks the unplanned ones and lists the missing paths', () => {
    const markdown = run().markdown;
    expect(markdown).toContain('Generated 2026-10-21 by `vp run workbench:deps -- demo`');
    expect(markdown).toContain('2 planned, 1 not planned.');
    expect(markdown).toContain('```ts\n// src/extra.ts · not planned\nexport const extra: 3;\n```');
    expect(markdown).toContain(
      '```ts\n// src/sum.ts\nexport const sum: (a: number, b: number) => number;\n',
    );
    expect(markdown).toContain('```ts\n// src/shapes/shape.ts\nexport interface Shape {');
    expect(markdown).toContain('- `src/gone.ts`: planned, not changed');
    expect(markdown).not.toContain('old.ts');
    expect(markdown).not.toContain('types.d.ts');
    expect(markdown).not.toContain('notes.md');
  });

  it('gives the same output on every run', () => {
    expect(run().markdown).toBe(run().markdown);
  });
});
