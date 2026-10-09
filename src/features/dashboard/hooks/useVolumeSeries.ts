import { useMemo } from 'react';
import {
  cumulativeVolume,
  formatVolumeWindow,
  toVolumeDisplay,
  volumeAxisTicks,
  volumeTotals,
  type VolumeTotal,
} from '@/lib/dashboardVolume.ts';
import type { ChartHoverX } from '@/store/chartHover.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { SPORTS } from '@/packages/engine/types.ts';
import type { DashboardAxis } from './useDashboardAxis.ts';

export interface VolumeRow {
  date: string;
  current: number | null;
  before: number | null;
  running: number | null;
  cycling: number | null;
}

export interface VolumeSeries {
  rows: VolumeRow[];
  current: VolumeTotal[];
  before: VolumeTotal[] | null;
  beforeLabel: string | null;
  indexByDate: Map<ChartHoverX, number>;
  ticks: number[] | undefined;
}

export const useVolumeSeries = (axis: DashboardAxis): VolumeSeries => {
  const metric = useFiltersStore((s) => s.volumeChartMetric);
  const time = useFiltersStore((s) => s.activeFilter?.time ?? null);
  const days = axis.days;

  return useMemo((): VolumeSeries => {
    const through = axis.history.map((d) => d.date);
    const totals = volumeTotals(axis.sessions, metric, time, days, through);
    const from = days?.from ?? through[0] ?? '';
    const bySport = new Map(
      SPORTS.map((sport) => [
        sport,
        cumulativeVolume(
          axis.sessions.filter((s) => s.sport === sport),
          metric,
          from,
          through,
        ),
      ]),
    );
    const display = (total: VolumeTotal | undefined) => {
      if (total === undefined || total.value === undefined) return null;
      return toVolumeDisplay(metric, total.value);
    };
    const rows = through.map(
      (date, i): VolumeRow => ({
        date,
        current: display(totals.current[i]),
        before: display(totals.before?.[i]),
        running: display(bySport.get('running')?.[i]),
        cycling: display(bySport.get('cycling')?.[i]),
      }),
    );
    let beforeLabel: string | null = null;
    if (totals.beforeWindow !== null) {
      beforeLabel = formatVolumeWindow(totals.beforeWindow);
    }
    return {
      rows,
      current: totals.current,
      before: totals.before,
      beforeLabel,
      indexByDate: new Map(through.map((date, i) => [date, i])),
      ticks: volumeAxisTicks(rows.flatMap((row) => [row.current, row.before])),
    };
  }, [axis.history, axis.sessions, days, metric, time]);
};
