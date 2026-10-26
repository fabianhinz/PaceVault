import type { FC, ReactNode } from 'react';
import type { TokenColor } from '@pacevault/ui/lib/tokens.ts';
import { PvStatRail } from '@pacevault/ui/components/pvStatRail/PvStatRail.tsx';
import type { StatRailRow } from '@pacevault/ui/components/pvStatRail/types.ts';
import { useChartHoverX, type ChartHoverX } from '@/store/chartHover.ts';
import type { MetricId } from '@/lib/explanations.ts';
import { MetricLabel } from '@/components/MetricLabel.tsx';
import type { RailReading } from '@/components/charts/types.ts';

interface MultiSeriesRailRow {
  key: string;
  name: string;
  color: TokenColor;
  metricId?: MetricId;
  unit?: string;
  rest: RailReading;
  readingAt: (x: ChartHoverX) => RailReading | undefined;
}

interface MultiSeriesRailProps {
  group: string;
  restHeader: string;
  formatX: (x: ChartHoverX) => string;
  isKnownX: (x: ChartHoverX) => boolean;
  rows: MultiSeriesRailRow[];
}

export const MultiSeriesRail: FC<MultiSeriesRailProps> = (props) => {
  const hoveredX = useChartHoverX(props.group);
  const active = hoveredX !== null && props.isKnownX(hoveredX);

  const rows: StatRailRow[] = props.rows.map((row) => {
    let reading = row.rest;
    if (active && hoveredX !== null) {
      reading = row.readingAt(hoveredX) ?? { value: '--' };
    }
    let info: ReactNode = undefined;
    if (row.metricId !== undefined)
      info = <MetricLabel metricId={row.metricId} size="sm" iconOnly />;
    return {
      key: row.key,
      name: row.name,
      color: row.color,
      info,
      unit: row.unit,
      value: reading.value,
      secondary: reading.secondary,
    };
  });

  let header = props.restHeader;
  if (active && hoveredX !== null) {
    header = props.formatX(hoveredX);
  }

  return (
    <PvStatRail
      header={header}
      active={active}
      secondarySlot={props.rows.some((row) => row.rest.secondary !== undefined)}
      rows={rows}
    />
  );
};
