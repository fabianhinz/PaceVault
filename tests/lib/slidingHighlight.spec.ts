import { describe, it, expect } from 'vitest';
import { highlightRect } from '@/lib/slidingHighlight.ts';

const resolve = (length: { px: number; percent: number }, trackWidth: number) =>
  length.px + (length.percent / 100) * trackWidth;

describe('sliding highlight', () => {
  it('sits on each 40 px rail item, 4 px padding and 4 px gap apart', () => {
    const rail = { count: 4, padding: 4, gap: 4, itemSize: 40 } as const;
    expect([0, 1, 2, 3].map((i) => highlightRect(rail, i).offset)).toEqual([
      { px: 4, percent: 0 },
      { px: 48, percent: 0 },
      { px: 92, percent: 0 },
      { px: 136, percent: 0 },
    ]);
    expect(highlightRect(rail, 2).size).toEqual({ px: 40, percent: 0 });
  });

  it('covers each tab of a pill that shares its width among four items', () => {
    const pill = { count: 4, padding: 3, gap: 2, itemSize: 'share' } as const;
    const width = 254;
    const item = (width - 2 * 3 - 3 * 2) / 4;
    for (const index of [0, 1, 2, 3]) {
      const rect = highlightRect(pill, index);
      expect(resolve(rect.offset, width)).toBeCloseTo(3 + index * (item + 2));
      expect(resolve(rect.size, width)).toBeCloseTo(item);
    }
    expect(resolve(highlightRect(pill, 3).offset, width) + item).toBeCloseTo(width - 3);
  });
});
