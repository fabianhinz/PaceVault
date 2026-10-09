import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type ImportPhase = 'preparing' | 'importing' | 'saving';

export type ForegroundTask = 'import' | 'reprocess';

export type ImportSummary =
  | { kind: 'imported'; imported: number; duplicated: number; failed: number }
  | { kind: 'nothing-new' }
  | { kind: 'no-activities' }
  | { kind: 'failed'; message: string };

export interface ForegroundImport {
  task: ForegroundTask;
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
  beginReprocessing: () => void;
  finishReprocessing: () => void;
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
          task: 'import',
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

    beginReprocessing: () =>
      set((draft) => {
        draft.runningImports += 1;
        draft.foreground = {
          task: 'reprocess',
          phase: 'preparing',
          processed: 0,
          total: 0,
          openedAt: Date.now(),
          summary: null,
        };
      }),

    finishReprocessing: () =>
      set((draft) => {
        draft.runningImports -= 1;
        draft.foreground = null;
      }),
  })),
);
