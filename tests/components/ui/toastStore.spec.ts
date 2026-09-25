import { describe, it, expect, beforeEach } from 'vitest';
import { useToastStore, toast, PROGRESS_TOAST_ID } from '@/components/ui/toastStore.ts';

describe('toastStore', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it('addToast adds a message toast', () => {
    useToastStore.getState().addToast({ title: 'Hello' });
    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].kind).toBe('message');
    if (toasts[0].kind === 'message') {
      expect(toasts[0].title).toBe('Hello');
    }
  });

  it('addToast deduplicates by id', () => {
    useToastStore.getState().addToast({ id: 'dup', title: 'First' });
    useToastStore.getState().addToast({ id: 'dup', title: 'Second' });
    expect(useToastStore.getState().toasts).toHaveLength(1);
  });

  it('removeToast removes by id', () => {
    useToastStore.getState().addToast({ id: 'x', title: 'Remove me' });
    useToastStore.getState().removeToast('x');
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('limits toasts to 5', () => {
    for (let i = 0; i < 7; i++) {
      useToastStore.getState().addToast({ title: `Toast ${i}` });
    }
    expect(useToastStore.getState().toasts).toHaveLength(5);
  });

  it('upsertProgress inserts a progress toast', () => {
    useToastStore.getState().upsertProgress({
      label: 'Processing',
      processed: 0,
      total: 10,
      saving: false,
    });
    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].kind).toBe('progress');
  });

  it('upsertProgress updates existing progress toast in place', () => {
    useToastStore.getState().upsertProgress({
      label: 'Processing',
      processed: 0,
      total: 10,
      saving: false,
    });
    useToastStore.getState().upsertProgress({
      label: 'Processing',
      processed: 5,
      total: 10,
      saving: false,
    });
    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    if (toasts[0].kind === 'progress') {
      expect(toasts[0].processed).toBe(5);
    }
  });

  it('replaceProgressWithMessage swaps progress for message', () => {
    useToastStore.getState().upsertProgress({
      label: 'Processing',
      processed: 10,
      total: 10,
      saving: false,
    });
    useToastStore.getState().replaceProgressWithMessage('Done!', 'success');
    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].kind).toBe('message');
    if (toasts[0].kind === 'message') {
      expect(toasts[0].title).toBe('Done!');
      expect(toasts[0].variant).toBe('success');
      expect(toasts[0].id).toBe('upload-done');
    }
  });

  it('removeToast with PROGRESS_TOAST_ID removes the progress toast', () => {
    useToastStore.getState().upsertProgress({
      label: 'Processing',
      processed: 0,
      total: 10,
      saving: false,
    });
    useToastStore.getState().removeToast(PROGRESS_TOAST_ID);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('removeToast with PROGRESS_TOAST_ID is a no-op when no progress toast exists', () => {
    useToastStore.getState().addToast({ title: 'Other toast' });
    useToastStore.getState().removeToast(PROGRESS_TOAST_ID);
    expect(useToastStore.getState().toasts).toHaveLength(1);
  });

  it('toast helper with id deduplicates', () => {
    toast('A', undefined, undefined, 'same-id');
    toast('B', undefined, undefined, 'same-id');
    expect(useToastStore.getState().toasts).toHaveLength(1);
  });

  it('mixed toast types coexist', () => {
    useToastStore.getState().addToast({ title: 'Error toast', variant: 'error' });
    useToastStore.getState().upsertProgress({
      label: 'Processing',
      processed: 0,
      total: 5,
      saving: false,
    });
    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(2);
    expect(toasts[0].kind).toBe('message');
    expect(toasts[1].kind).toBe('progress');
  });
});
