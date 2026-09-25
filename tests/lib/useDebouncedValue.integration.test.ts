import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue.ts';

afterEach(() => {
  vi.useRealTimers();
});

describe('useDebouncedValue', () => {
  it('returns the initial value right away', () => {
    const hook = renderHook(() => useDebouncedValue('a', 600));
    expect(hook.result.current).toBe('a');
  });

  it('only takes the latest value once it has been stable for the delay', () => {
    vi.useFakeTimers();
    const hook = renderHook((props: { value: string }) => useDebouncedValue(props.value, 600), {
      initialProps: { value: 'a' },
    });

    hook.rerender({ value: 'ab' });
    act(() => vi.advanceTimersByTime(400));
    hook.rerender({ value: 'abc' });
    act(() => vi.advanceTimersByTime(400));
    expect(hook.result.current).toBe('a');

    act(() => vi.advanceTimersByTime(200));
    expect(hook.result.current).toBe('abc');
  });
});
