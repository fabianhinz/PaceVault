import { v4 } from 'uuid';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ToastItem } from '@pacevault/ui/components/pvToastViewport/types.ts';

interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'> & { id?: string }) => void;
  removeToast: (id: string) => void;
}

export const INITIAL_TOAST_STORE_STATE: Pick<ToastState, 'toasts'> = {
  toasts: [],
};

export const useToastStore = create<ToastState>()(
  immer((set) => ({
    ...INITIAL_TOAST_STORE_STATE,
    addToast: (toast) =>
      set((draft) => {
        const id = toast.id ?? v4();
        if (toast.id && draft.toasts.some((t) => t.id === id)) return;
        draft.toasts.push({ ...toast, id });
        draft.toasts = draft.toasts.slice(-5);
      }),
    removeToast: (id) =>
      set((draft) => {
        draft.toasts = draft.toasts.filter((t) => t.id !== id);
      }),
  })),
);
