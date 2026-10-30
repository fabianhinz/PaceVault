import { describe, it, expect } from 'vite-plus/test';
import { useImportProgressStore } from '@/store/importProgress.ts';

describe('import-progress store', () => {
  it.each(['files', 'demo', 'intervals-import'] as const)(
    'opens the overlay with its source for a %s import',
    (source) => {
      useImportProgressStore.getState().beginImport(source);

      expect(useImportProgressStore.getState().runningImports).toBe(1);
      expect(useImportProgressStore.getState().foreground).toMatchObject({
        task: 'import',
        source,
        phase: 'preparing',
        summary: null,
      });
    },
  );

  it('a background intervals sync counts as running but opens no overlay', () => {
    useImportProgressStore.getState().beginImport('intervals-sync');

    expect(useImportProgressStore.getState().runningImports).toBe(1);
    expect(useImportProgressStore.getState().foreground).toBeNull();

    useImportProgressStore.getState().finishImport(null);

    expect(useImportProgressStore.getState().runningImports).toBe(0);
    expect(useImportProgressStore.getState().foreground).toBeNull();
  });

  it('a background sync finishing during a foreground upload leaves the overlay intact', () => {
    const store = useImportProgressStore.getState();
    store.beginImport('files');
    store.setImportTotal(3);
    store.advanceImport();
    store.beginImport('intervals-sync');

    expect(useImportProgressStore.getState().runningImports).toBe(2);

    store.finishImport(null);

    expect(useImportProgressStore.getState().runningImports).toBe(1);
    expect(useImportProgressStore.getState().foreground).toMatchObject({
      phase: 'importing',
      processed: 1,
      total: 3,
      summary: null,
    });
  });

  it('keeps the summary after a foreground import finishes, until it is dismissed', () => {
    const store = useImportProgressStore.getState();
    store.beginImport('files');
    store.finishImport({ kind: 'imported', imported: 2, duplicated: 1, failed: 0 });

    expect(useImportProgressStore.getState().runningImports).toBe(0);
    expect(useImportProgressStore.getState().foreground?.summary).toEqual({
      kind: 'imported',
      imported: 2,
      duplicated: 1,
      failed: 0,
    });

    store.dismissImport();

    expect(useImportProgressStore.getState().foreground).toBeNull();
  });
});
