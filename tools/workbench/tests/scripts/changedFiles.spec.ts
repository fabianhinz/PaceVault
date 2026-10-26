import { describe, it, expect } from 'vite-plus/test';
import { compareFiles, parseChanges } from '@scripts/changedFiles.ts';
import type { FileChange } from '@scripts/reviewArtifactsContract.ts';

const PLANNED = [
  'apps/web/src/features/splits/SplitsTable.tsx',
  'apps/web/src/features/splits/hooks/',
  'packages/engine/src/splits.ts',
  'tools/workbench/backlog/demo/review/capture.spec.ts',
  'apps/web/src/lib/untouched.ts',
];

const CHANGES: FileChange[] = [
  { path: 'packages/engine/src/splits.ts', status: 'added' },
  { path: 'apps/web/src/features/splits/SplitsTable.tsx', status: 'modified' },
  { path: 'apps/web/src/features/splits/hooks/useSplits.ts', status: 'added' },
  { path: 'apps/web/src/features/splits/hooks/useLaps.ts', status: 'deleted' },
  { path: 'apps/web/src/features/splits/hooksHelper.ts', status: 'added' },
  { path: 'pnpm-lock.yaml', status: 'modified' },
  { path: 'tools/workbench/backlog/demo/plan.md', status: 'modified' },
  { path: 'tools/workbench/backlog/demo/review/capture.spec.ts', status: 'added' },
];

describe('changedFiles', () => {
  it('sorts changed files into planned and not planned, and lists planned paths nobody touched', () => {
    expect(compareFiles({ changes: CHANGES, plannedPaths: PLANNED })).toEqual({
      planned: [
        { path: 'apps/web/src/features/splits/SplitsTable.tsx', status: 'modified' },
        { path: 'apps/web/src/features/splits/hooks/useLaps.ts', status: 'deleted' },
        { path: 'apps/web/src/features/splits/hooks/useSplits.ts', status: 'added' },
        { path: 'packages/engine/src/splits.ts', status: 'added' },
        { path: 'tools/workbench/backlog/demo/review/capture.spec.ts', status: 'added' },
      ],
      notPlanned: [
        { path: 'apps/web/src/features/splits/hooksHelper.ts', status: 'added' },
        { path: 'pnpm-lock.yaml', status: 'modified' },
      ],
      untouched: ['apps/web/src/lib/untouched.ts'],
    });
  });

  it('lists every planned path as untouched when nothing changed', () => {
    expect(compareFiles({ changes: [], plannedPaths: ['a.ts', 'a.ts', 'b/'] })).toEqual({
      planned: [],
      notPlanned: [],
      untouched: ['a.ts', 'b/'],
    });
  });

  it('parses git name-status and untracked output (NUL separated) into one change per path', () => {
    const diff = 'M\0src/a.ts\0A\0src/b.ts\0D\0src/old.ts\0T\0src/link\0U\0src/conflict.ts\0';
    const untracked = 'src/new file.ts\0src/b.ts\0';
    expect(parseChanges({ diff, untracked })).toEqual([
      { path: 'src/a.ts', status: 'modified' },
      { path: 'src/b.ts', status: 'added' },
      { path: 'src/old.ts', status: 'deleted' },
      { path: 'src/link', status: 'modified' },
      { path: 'src/new file.ts', status: 'added' },
    ]);
    expect(parseChanges({ diff: '', untracked: '' })).toEqual([]);
  });
});
