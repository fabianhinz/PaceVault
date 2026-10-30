import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type ImportPhase = 'preparing' | 'importing' | 'saving';

export type ForegroundTask = 'import' | 'reprocess';

export type ImportSource = 'files' | 'demo' | 'intervals-import' | 'intervals-sync';

const FOREGROUND_BY_IMPORT_SOURCE: Record<ImportSource, boolean> = {
  files: true,
  demo: true,
  'intervals-import': true,
  'intervals-sync': false,
};

export type ImportSummary =
  | { kind: 'imported'; imported: number; duplicated: number; failed: number }
  | { kind: 'nothing-new' }
  | { kind: 'no-activities' }
  | { kind: 'failed'; message: string };

export interface ForegroundImport {
  task: ForegroundTask;
  source: ImportSource | null;
  phase: ImportPhase;
  processed: number;
  total: number;
  openedAt: number;
  summary: ImportSummary | null;
}

interface ImportProgressState {
  runningImports: number;
  foreground: ForegroundImport | null;
  awaitingTrackBuild: boolean;
  mapCrashed: boolean;
  beginImport: (source: ImportSource) => void;
  setImportTotal: (total: number) => void;
  advanceImport: () => void;
  markImportSaving: () => void;
  finishImport: (summary: ImportSummary | null) => void;
  dismissImport: () => void;
  beginReprocessing: () => void;
  finishReprocessing: () => void;
  finishTrackBuild: () => void;
  abandonTrackBuildAfterMapCrash: () => void;
}

export const INITIAL_IMPORT_PROGRESS_STORE_STATE: Pick<
  ImportProgressState,
  'runningImports' | 'foreground' | 'awaitingTrackBuild' | 'mapCrashed'
> = {
  runningImports: 0,
  foreground: null,
  awaitingTrackBuild: false,
  mapCrashed: false,
};

export const useImportProgressStore = create<ImportProgressState>()(
  immer((set) => ({
    ...INITIAL_IMPORT_PROGRESS_STORE_STATE,

    beginImport: (source) =>
      set((draft) => {
        draft.runningImports += 1;
        if (!FOREGROUND_BY_IMPORT_SOURCE[source]) return;
        draft.foreground = {
          task: 'import',
          source,
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
        draft.awaitingTrackBuild = !draft.mapCrashed;
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
          source: null,
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
        if (draft.mapCrashed) {
          draft.foreground = null;
        } else {
          draft.awaitingTrackBuild = true;
        }
      }),

    finishTrackBuild: () =>
      set((draft) => {
        if (!draft.awaitingTrackBuild) return;
        draft.awaitingTrackBuild = false;
        if (draft.foreground?.task === 'reprocess') draft.foreground = null;
      }),

    abandonTrackBuildAfterMapCrash: () =>
      set((draft) => {
        draft.mapCrashed = true;
        if (draft.awaitingTrackBuild && draft.foreground?.task === 'reprocess') {
          draft.foreground = null;
        }
        draft.awaitingTrackBuild = false;
      }),
  })),
);
