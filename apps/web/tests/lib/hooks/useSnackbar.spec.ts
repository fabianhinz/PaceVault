import { describe, it, expect, beforeEach } from 'vite-plus/test';
import { renderHookWithProviders } from '@testUtils/render.ts';
import { useSnackbar } from '@/lib/hooks/useSnackbar.ts';
import type { SnackbarEntry } from '@/lib/format/snackbar.ts';
import { useToastStore } from '@/store/toast.ts';

const SAVED: SnackbarEntry = {
  key: 'TEST_SNACKBARS_saved',
  message: () => 'Saved',
  variant: 'success',
};

describe(useSnackbar.name, () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it('shows an entry under its key', () => {
    const snackbar = renderHookWithProviders(() => useSnackbar());
    snackbar.result.current.enqueueSnackbar(SAVED);
    expect(useToastStore.getState().toasts).toEqual([
      {
        id: 'TEST_SNACKBARS_saved',
        title: 'Saved',
        description: undefined,
        variant: 'success',
        persistent: undefined,
      },
    ]);
  });

  it('drops a second entry with the same key while the first is shown', () => {
    const snackbar = renderHookWithProviders(() => useSnackbar());
    snackbar.result.current.enqueueSnackbar(SAVED);
    snackbar.result.current.enqueueSnackbar(SAVED);
    expect(useToastStore.getState().toasts).toHaveLength(1);
  });

  it('closes an entry by its key', () => {
    const snackbar = renderHookWithProviders(() => useSnackbar());
    snackbar.result.current.enqueueSnackbar(SAVED);
    snackbar.result.current.closeSnackbar('TEST_SNACKBARS_saved');
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
