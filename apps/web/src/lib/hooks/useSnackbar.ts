import { useToastStore } from '@/store/toast.ts';
import type { SnackbarEntry } from '@/lib/format/snackbar.ts';

export interface Snackbar {
  enqueueSnackbar: (entry: SnackbarEntry) => void;
  closeSnackbar: (key: string) => void;
}

const enqueueSnackbar = (entry: SnackbarEntry): void => {
  useToastStore.getState().addToast({
    id: entry.key,
    title: entry.message(),
    description: entry.description?.(),
    variant: entry.variant,
    persistent: entry.persistent,
  });
};

const closeSnackbar = (key: string): void => {
  useToastStore.getState().removeToast(key);
};

const SNACKBAR: Snackbar = { enqueueSnackbar, closeSnackbar };

export const useSnackbar = (): Snackbar => SNACKBAR;
