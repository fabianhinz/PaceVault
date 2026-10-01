import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type ImportPhase = 'preparing' | 'importing' | 'saving';

export type ImportSummary =
  | { kind: 'imported'; imported: number; duplicated: number; failed: number }
  | { kind: 'nothing-new' }
  | { kind: 'no-activities' }
  | { kind: 'failed'; message: string };

export interface ForegroundImport {
  phase: ImportPhase;
  processed: number;
  total: number;
  openedAt: number;
  summary: ImportSummary | null;
}

interface ImportProgressState {
  runningImports: number;
  foreground: ForegroundImport | null;
  beginImport: (options: { foreground: boolean }) => void;
  setImportTotal: (total: number) => void;
  advanceImport: () => void;
  markImportSaving: () => void;
  finishImport: (summary: ImportSummary | null) => void;
  dismissImport: () => void;
}

export const useImportProgressStore = create<ImportProgressState>()(
  immer((set) => ({
    runningImports: 0,
    foreground: null,

    beginImport: (options) =>
      set((draft) => {
        draft.runningImports += 1;
        if (!options.foreground) return;
        draft.foreground = {
          phase: 'preparing',
          processed: 0,
          total: 0,
          openedAt: Date.now(),
          summary: null,
        };
      }),

    setImportTotal: (total) =>
      set((draft) => {
        if (draft.foreground === null) return;
        draft.foreground.phase = 'importing';
        draft.foreground.processed = 0;
        draft.foreground.total = total;
      }),

    advanceImport: () =>
      set((draft) => {
        if (draft.foreground === null) return;
        draft.foreground.processed += 1;
      }),

    markImportSaving: () =>
      set((draft) => {
        if (draft.foreground === null) return;
        draft.foreground.phase = 'saving';
      }),

    finishImport: (summary) =>
      set((draft) => {
        draft.runningImports -= 1;
        if (summary === null || draft.foreground === null) return;
        draft.foreground.summary = summary;
      }),

    dismissImport: () =>
      set((draft) => {
        draft.foreground = null;
      }),
  })),
);
