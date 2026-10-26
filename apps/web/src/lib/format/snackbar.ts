import type { ToastItem } from '@pacevault/ui/components/pvToastViewport/types.ts';

export type SnackbarVariant = NonNullable<ToastItem['variant']>;

export interface SnackbarEntry {
  key: string;
  message: () => string;
  description?: () => string;
  variant: SnackbarVariant;
  persistent?: boolean;
}

export interface CountedSnackbarEntry extends Omit<SnackbarEntry, 'message'> {
  message: (inputs: { count: string }) => string;
}

export type SnackbarMap = Record<string, SnackbarEntry | CountedSnackbarEntry>;
