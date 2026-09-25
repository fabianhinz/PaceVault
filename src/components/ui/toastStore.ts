import { v4 } from 'uuid';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface MessageToastItem {
  id: string;
  kind: 'message';
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
  persistent?: boolean;
}

interface ProgressToastItem {
  id: string;
  kind: 'progress';
  label: string;
  processed: number;
  total: number;
  saving: boolean;
}

type ToastItem = MessageToastItem | ProgressToastItem;

export const PROGRESS_TOAST_ID = 'upload-progress';

interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: Omit<MessageToastItem, 'id' | 'kind'> & { id?: string }) => void;
  removeToast: (id: string) => void;
  upsertProgress: (data: Omit<ProgressToastItem, 'id' | 'kind'>) => void;
  replaceProgressWithMessage: (title: string, variant: 'success' | 'error' | 'warning') => void;
}

export const useToastStore = create<ToastState>()(
  immer((set) => ({
    toasts: [],
    addToast: (toast) =>
      set((draft) => {
        const id = toast.id ?? v4();
        if (toast.id && draft.toasts.some((t) => t.id === id)) return;
        draft.toasts.push({ ...toast, id, kind: 'message' as const });
        draft.toasts = draft.toasts.slice(-5);
      }),
    removeToast: (id) =>
      set((draft) => {
        draft.toasts = draft.toasts.filter((t) => t.id !== id);
      }),
    upsertProgress: (data) =>
      set((draft) => {
        const item: ProgressToastItem = { ...data, id: PROGRESS_TOAST_ID, kind: 'progress' };
        const idx = draft.toasts.findIndex((t) => t.id === PROGRESS_TOAST_ID);
        if (idx >= 0) {
          draft.toasts[idx] = item;
        } else {
          draft.toasts.push(item);
          draft.toasts = draft.toasts.slice(-5);
        }
      }),
    replaceProgressWithMessage: (title, variant) =>
      set((draft) => {
        const messageToast: MessageToastItem = {
          id: 'upload-done',
          kind: 'message',
          title,
          variant,
        };
        draft.toasts = draft.toasts.filter((t) => t.id !== PROGRESS_TOAST_ID);
        draft.toasts.push(messageToast);
        draft.toasts = draft.toasts.slice(-5);
      }),
  })),
);

export const toast = (
  title: string,
  description?: string,
  variant?: MessageToastItem['variant'],
  id?: string,
) => {
  useToastStore.getState().addToast({ title, description, variant, id });
};

export type { ToastItem, MessageToastItem, ProgressToastItem };
