import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useToastStore, PROGRESS_TOAST_ID } from '@/components/ui/toastStore.ts';
import { m } from '@/paraglide/messages.js';

interface UploadProgressState {
  uploading: boolean;
  processed: number;
  total: number;
  fileCount: number;
  beginProcessing: () => void;
  startUpload: (total: number) => void;
  advance: () => void;
  finish: (message: string, variant: 'success' | 'error' | 'warning') => void;
  cancel: () => void;
}

const processingLabel = (count: number) => {
  if (count === 1) {
    return m.toast_upload_processing({ count });
  }
  return m.toast_upload_processing_plural({ count });
};

export const useUploadProgressStore = create<UploadProgressState>()(
  immer((set, get) => ({
    uploading: false,
    processed: 0,
    total: 0,
    fileCount: 0,
    beginProcessing: () => {
      set({ uploading: true, processed: 0, total: 0, fileCount: 0 });
      useToastStore.getState().upsertProgress({
        label: m.toast_upload_preparing(),
        processed: 0,
        total: 0,
        saving: true,
      });
    },
    startUpload: (total) => {
      set({ uploading: true, processed: 0, total, fileCount: total });
      useToastStore.getState().upsertProgress({
        label: processingLabel(total),
        processed: 0,
        total,
        saving: false,
      });
    },
    advance: () => {
      set((draft) => {
        draft.processed += 1;
      });
      const state = get();
      const processed = state.processed;
      const total = state.total;
      const saving = processed >= total && total > 0;
      let label: string;
      if (saving) {
        label = m.toast_upload_saving();
      } else {
        label = processingLabel(state.fileCount);
      }
      useToastStore.getState().upsertProgress({
        label,
        processed,
        total,
        saving,
      });
    },
    finish: (message, variant) => {
      set({ uploading: false });
      useToastStore.getState().replaceProgressWithMessage(message, variant);
    },
    cancel: () => {
      set({ uploading: false, processed: 0, total: 0, fileCount: 0 });
      useToastStore.getState().removeToast(PROGRESS_TOAST_ID);
    },
  })),
);
