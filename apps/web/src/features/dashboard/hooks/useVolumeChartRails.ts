import type { ComponentProps } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { tokens, type TokenColor } from '@pacevault/ui/lib/tokens.ts';
import type { MultiSeriesRail } from '@/components/charts/MultiSeriesRail.tsx';
import { formatPlural } from '@/lib/formatters.ts';
import {
  formatVolume,
  volumeUnit,
  type VolumeMetric,
  type VolumeTotal,
} from '@/lib/dashboardVolume.ts';
import type { ChartHoverX } from '@/store/chartHover.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { sportColors } from '@/features/dashboard/types.ts';
import type { VolumeSeries } from './useVolumeSeries.ts';

type VolumeRailRow = ComponentProps<typeof MultiSeriesRail>['rows'][number];

interface VolumeChartRails {
  railRows: VolumeRailRow[];
  unit: string;
  lineColor: TokenColor;
}

const sessionCount = (count: number) =>
  formatPlural(count, {
    one: () => m.ui_count_sessions_one(),
    other: () => m.ui_count_sessions_other({ count: String(count) }),
  });

export const useVolumeChartRails = ({
  series,
  metric,
}: {
  series: VolumeSeries;
  metric: VolumeMetric;
}): VolumeChartRails => {
  const sportFilter = useFiltersStore((s) => s.activeFilter?.sport ?? null);
  let lineColor: TokenColor = tokens.textPrimary;
  if (sportFilter !== null) {
    lineColor = sportColors[sportFilter];
  }
  const unit = volumeUnit(metric);
  const last = series.rows.length - 1;

  const railRow = ({
    key,
    totals,
    name,
    color,
  }: {
    key: string;
    totals: VolumeTotal[];
    name: string;
    color: TokenColor;
  }) => ({
    key,
    name,
    color,
    unit,
    rest: {
      value: formatVolume({ metric, value: totals[last]?.value }),
      secondary: sessionCount(totals[last]?.sessions ?? 0),
    },
    readingAt: (x: ChartHoverX) => {
      const index = series.indexByDate.get(x);
      if (index === undefined) return undefined;
      const total = totals[index];
      if (total === undefined) return undefined;
      return {
        value: formatVolume({ metric, value: total.value }),
        secondary: sessionCount(total.sessions),
      };
    },
  });
  const railRows = [
    railRow({
      key: 'current',
      totals: series.current,
      name: m.ui_volume_this_range(),
      color: lineColor,
    }),
  ];
  if (series.before !== null) {
    railRows.push(
      railRow({
        key: 'before',
        totals: series.before,
        name: m.ui_volume_before(),
        color: tokens.textTertiary,
      }),
    );
  }

  return { railRows, unit, lineColor };
};
