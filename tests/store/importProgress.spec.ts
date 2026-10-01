import { describe, it, expect } from 'vitest';
import { useImportProgressStore } from '@/store/importProgress.ts';

describe('import-progress store', () => {
  it('a background import counts as running but opens no overlay', () => {
    useImportProgressStore.getState().beginImport({ foreground: false });

    expect(useImportProgressStore.getState().runningImports).toBe(1);
    expect(useImportProgressStore.getState().foreground).toBeNull();

    useImportProgressStore.getState().finishImport(null);

    expect(useImportProgressStore.getState().runningImports).toBe(0);
    expect(useImportProgressStore.getState().foreground).toBeNull();
  });

  it('a background sync finishing during a foreground upload leaves the overlay intact', () => {
    const store = useImportProgressStore.getState();
    store.beginImport({ foreground: true });
    store.setImportTotal(3);
    store.advanceImport();
    store.beginImport({ foreground: false });

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
    store.beginImport({ foreground: true });
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
