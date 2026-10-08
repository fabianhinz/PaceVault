import { describe, expect, it } from 'vitest';
import { niceAxis } from '@/lib/chartTheme.ts';

describe('niceAxis', () => {
  it('returns round ticks that cover the values with padding', () => {
    expect(niceAxis([142, 151, 158])).toEqual({
      domain: [140, 160],
      ticks: [140, 145, 150, 155, 160],
    });
  });

  it('lap axis loses its padding on a narrow range', () => {
    const axis = niceAxis([30.1, 30.9]);
    expect(axis?.domain[0]).toBeLessThan(30.1);
    expect(axis?.domain[1]).toBeGreaterThan(30.9);
  });

  it('lap axis collapses to zero height for a single lap', () => {
    const axis = niceAxis([150]);
    expect(axis?.domain[0]).toBeLessThan(150);
    expect(axis?.domain[1]).toBeGreaterThan(150);
  });
});
