import { describe, expect, it } from 'vite-plus/test';
import { acwrColor } from '@/lib/statusColors.ts';

describe(acwrColor.name, () => {
  it('maps the ratio to a traffic light at each threshold', () => {
    const ratios = [0, 0.79, 0.8, 1.3, 1.31, 1.5, 1.51, 2];
    expect(ratios.map((ratio) => acwrColor(ratio))).toEqual([
      'yellow',
      'yellow',
      'green',
      'green',
      'yellow',
      'yellow',
      'red',
      'red',
    ]);
  });
});
