import { v4 } from 'uuid';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
  persistent?: boolean;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'> & { id?: string }) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>()(
  immer((set) => ({
    toasts: [],
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

export const toast = (
  title: string,
  description?: string,
  variant?: ToastItem['variant'],
  id?: string,
) => {
  useToastStore.getState().addToast({ title, description, variant, id });
};
