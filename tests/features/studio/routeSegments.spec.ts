import { describe, it, expect } from 'vitest';
import { segmentAtDistance } from '@/features/studio/markers/routeSegments.ts';

const TOTAL = 10_000;

describe('segmentAtDistance', () => {
  it('treats a route with no splits as one whole segment', () => {
    const seg = segmentAtDistance([], TOTAL, 4000);
    expect(seg).toMatchObject({
      index: 1,
      count: 1,
      startM: 0,
      endM: TOTAL,
      startSplit: null,
      endSplit: null,
    });
  });

  it('resolves the segment before the first split', () => {
    const seg = segmentAtDistance([3000, 7000], TOTAL, 1000);
    expect(seg).toMatchObject({
      index: 1,
      count: 3,
      startM: 0,
      endM: 3000,
      startSplit: null,
      endSplit: 1,
    });
  });

  it('resolves a middle segment between two splits', () => {
    const seg = segmentAtDistance([3000, 7000], TOTAL, 5000);
    expect(seg).toMatchObject({ index: 2, startM: 3000, endM: 7000, startSplit: 1, endSplit: 2 });
  });

  it('resolves the segment after the last split', () => {
    const seg = segmentAtDistance([3000, 7000], TOTAL, 9000);
    expect(seg).toMatchObject({
      index: 3,
      startM: 7000,
      endM: TOTAL,
      startSplit: 2,
      endSplit: null,
    });
  });

  it('assigns a click exactly on a split to the segment starting there', () => {
    const seg = segmentAtDistance([3000, 7000], TOTAL, 3000);
    expect(seg).toMatchObject({ index: 2, startM: 3000, endM: 7000 });
  });

  it('ignores unsorted splits and splits at or beyond the route ends', () => {
    const seg = segmentAtDistance([7000, 0, 3000, TOTAL], TOTAL, 5000);
    expect(seg).toMatchObject({ index: 2, count: 3, startM: 3000, endM: 7000 });
  });
});
