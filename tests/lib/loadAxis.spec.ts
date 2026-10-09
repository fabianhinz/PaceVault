import { describe, expect, it } from 'vitest';
import { buildLoadAxis, loadBucketKey } from '@/lib/loadAxis.ts';

const days = ['2026-02-27', '2026-02-28', '2026-03-01', '2026-03-02', '2026-03-03'].map((date) => ({
  date,
}));

const sportTss = new Map([
  ['2026-02-27', { running: 40 }],
  ['2026-03-01', { cycling: 60.04 }],
  ['2026-03-03', { running: 30, cycling: 10 }],
]);

describe('buildLoadAxis', () => {
  it('maps a hovered day to the week bucket that contains it, clipped to the axis', () => {
    const axis = buildLoadAxis(days, sportTss, 'week');
    expect(axis.buckets.get(loadBucketKey('2026-02-28', 'week'))).toEqual({
      key: '2026-02-23',
      from: '2026-02-27',
      to: '2026-03-01',
      running: 40,
      cycling: 60,
    });
    expect(axis.buckets.get(loadBucketKey('2026-03-03', 'week'))).toMatchObject({
      key: '2026-03-02',
      from: '2026-03-02',
      to: '2026-03-03',
    });
  });

  it('gives every day of a month bucket the bucket total', () => {
    const axis = buildLoadAxis(days, sportTss, 'month');
    expect(axis.rows.map((row) => [row.bucket, row.running, row.cycling])).toEqual([
      ['2026-02', 40, 0],
      ['2026-02', 40, 0],
      ['2026-03', 30, 70],
      ['2026-03', 30, 70],
      ['2026-03', 30, 70],
    ]);
  });
});
