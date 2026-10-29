import { describe, it, expect } from 'vite-plus/test';
import { colocationLine, singleOwnerLibModules } from '@scripts/colocation.ts';
import type { DepsInput } from '@scripts/deps.ts';

const mod = (source: string, ...imports: string[]) => ({
  source,
  dependencies: imports.map((resolved) => ({ resolved })),
});

const HELPER = 'apps/web/src/lib/analysis/helper.ts';

const withImporters = (...importers: string[]): DepsInput['modules'] => [
  ...importers.map((importer) => mod(importer, HELPER)),
  mod(HELPER),
];

describe('colocation', () => {
  it('reports a lib module that two files of one feature folder import', () => {
    const modules = withImporters(
      'apps/web/src/components/labs/index.tsx',
      'apps/web/src/components/labs/hooks/useCoachPlan.ts',
    );
    expect(singleOwnerLibModules(modules)).toEqual([
      { module: 'lib/analysis/helper.ts', owner: 'components/labs' },
    ]);
  });

  it('does not report a module a second feature folder also imports', () => {
    const modules = withImporters(
      'apps/web/src/components/labs/index.tsx',
      'apps/web/src/components/sessions/index.tsx',
    );
    expect(singleOwnerLibModules(modules)).toEqual([]);
  });

  it.each([
    ['a store', 'apps/web/src/store/user.ts'],
    ['a query', 'apps/web/src/queries/sessions/useSessions.ts'],
    ['a page', 'apps/web/src/pages/LabsPage.tsx'],
  ])('does not report a module %s also imports', (_kind, other) => {
    const modules = withImporters('apps/web/src/components/labs/index.tsx', other);
    expect(singleOwnerLibModules(modules)).toEqual([]);
  });

  it('does not report a module only another lib module imports', () => {
    const modules = withImporters('apps/web/src/lib/analysis/laps.ts');
    expect(singleOwnerLibModules(modules)).toEqual([]);
  });

  it.each(['apps/web/src/lib/hooks/useDismiss.ts', 'apps/web/src/lib/debug/pvDebug.ts'])(
    'skips the UI topic folder module %s',
    (uiModule) => {
      const modules = [mod('apps/web/src/components/labs/index.tsx', uiModule), mod(uiModule)];
      expect(singleOwnerLibModules(modules)).toEqual([]);
    },
  );

  it('does not report a module without importers', () => {
    expect(singleOwnerLibModules([mod(HELPER)])).toEqual([]);
  });

  it('names every hit in the check line', () => {
    expect(colocationLine([], 42)).toBe(
      'Colocation check · no single-feature lib modules (42 lib modules)',
    );
    expect(
      colocationLine([{ module: 'lib/analysis/helper.ts', owner: 'components/labs' }], 42),
    ).toBe(
      'Colocation check · 1 lib module(s) used by one feature only: lib/analysis/helper.ts → components/labs',
    );
  });
});
