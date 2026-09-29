import { describe, it, expect, beforeEach } from 'vitest';
import { useToastStore, toast } from '@/components/ui/toastStore.ts';

describe('toastStore', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it('addToast adds a message toast', () => {
    useToastStore.getState().addToast({ title: 'Hello' });
    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].title).toBe('Hello');
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

  it('toast helper with id deduplicates', () => {
    toast('A', undefined, undefined, 'same-id');
    toast('B', undefined, undefined, 'same-id');
    expect(useToastStore.getState().toasts).toHaveLength(1);
  });
});
