import { useCallback, useMemo } from 'react';
import { SPORTS, type Sport } from '@pacevault/engine/types.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { loadBucketDayRange } from '@/lib/filtering/weekKey.ts';
import {
  buildLoadAxis,
  loadBucketKey,
  type LoadBucket,
  type LoadGroupBy,
} from '@/lib/filtering/loadAxis.ts';
import type { DashboardAxis } from './useDashboardAxis.ts';

interface LoadChartData {
  groupBy: LoadGroupBy;
  groupingDisabled: boolean;
  load: ReturnType<typeof buildLoadAxis>;
  sportTotals: Record<Sport, number>;
  bucketAt: (x: string | number) => LoadBucket | undefined;
  onZoomComplete: (from: string | number, to: string | number) => void;
}

export const useLoadChartData = (axis: DashboardAxis): LoadChartData => {
  const groupBy = useFiltersStore((s) => s.loadChartGroupBy);
  const groupingDisabled = axis.days !== null && axis.days.count <= 7;

  let effectiveGroupBy: LoadGroupBy = groupBy;
  if (groupingDisabled) effectiveGroupBy = 'day';

  const load = useMemo(
    () => buildLoadAxis({ days: axis.history, sportTss: axis.sportTss, groupBy: effectiveGroupBy }),
    [axis.history, axis.sportTss, effectiveGroupBy],
  );

  const sportTotals = useMemo(() => {
    const totals: Record<Sport, number> = { running: 0, cycling: 0 };
    for (const bucket of load.buckets.values()) {
      for (const sport of SPORTS) {
        totals[sport] += bucket[sport];
      }
    }
    return totals;
  }, [load.buckets]);

  const bucketAt = (x: string | number) =>
    load.buckets.get(loadBucketKey({ day: String(x), groupBy: effectiveGroupBy }));

  const zoomToBuckets = axis.onZoomComplete;
  const onZoomComplete = useCallback(
    (from: string | number, to: string | number) => {
      const first = loadBucketDayRange({
        key: loadBucketKey({ day: String(from), groupBy: effectiveGroupBy }),
        groupBy: effectiveGroupBy,
      });
      const last = loadBucketDayRange({
        key: loadBucketKey({ day: String(to), groupBy: effectiveGroupBy }),
        groupBy: effectiveGroupBy,
      });
      zoomToBuckets(first.from, last.to);
    },
    [effectiveGroupBy, zoomToBuckets],
  );

  return {
    groupBy: effectiveGroupBy,
    groupingDisabled,
    load,
    sportTotals,
    bucketAt,
    onZoomComplete,
  };
};
