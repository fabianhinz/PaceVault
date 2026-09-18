import { describe, it, expect } from 'vitest';
import { mapWithConcurrency } from '@/lib/intervals/pool.ts';

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 1));

describe('mapWithConcurrency', () => {
  it('never runs more workers at once than the limit allows', async () => {
    let active = 0;
    let peak = 0;

    await mapWithConcurrency([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 4, async (n) => {
      active++;
      if (active > peak) peak = active;
      await tick();
      active--;
      return n;
    });

    expect(peak).toBe(4);
  });

  it('returns results in input order regardless of completion order', async () => {
    const delays = [30, 5, 20, 1];

    const results = await mapWithConcurrency(delays, 4, async (ms, index) => {
      await new Promise((resolve) => setTimeout(resolve, ms));
      return index;
    });

    expect(results).toEqual([0, 1, 2, 3]);
  });

  it('isolates a rejecting worker and finishes the rest', async () => {
    const results = await mapWithConcurrency([1, 2, 3], 2, async (n) => {
      if (n === 2) throw new Error('boom');
      return n * 10;
    });

    expect(results).toEqual([10, undefined, 30]);
  });

  it('stops pulling new work once the signal aborts', async () => {
    const controller = new AbortController();
    const seen: number[] = [];

    const results = await mapWithConcurrency(
      [1, 2, 3, 4, 5, 6],
      1,
      async (n) => {
        seen.push(n);
        if (n === 2) controller.abort();
        await tick();
        return n;
      },
      controller.signal,
    );

    expect(seen).toEqual([1, 2]);
    expect(results.slice(2)).toEqual([undefined, undefined, undefined, undefined]);
  });

  it('handles an empty input', async () => {
    expect(await mapWithConcurrency([], 4, async (n) => n)).toEqual([]);
  });

  it('clamps a nonsensical limit', async () => {
    expect(await mapWithConcurrency([1, 2], 0, async (n) => n)).toEqual([1, 2]);
  });
});
