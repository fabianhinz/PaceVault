import type { ReactNode } from 'react';
import { StatRail, type StatRailNote, type StatRailRow } from '@/components/ui/StatRail.tsx';
import { useChartHoverX, type ChartHoverX } from '@/store/chartHover.ts';
import type { MetricId } from '@/lib/explanations.ts';

export interface RailReading {
  value: ReactNode;
  secondary?: ReactNode;
  note?: StatRailNote;
}

interface SeriesRailProps {
  group: string;
  unit?: string;
  rest: RailReading & { header: string };
  formatX: (x: ChartHoverX) => string;
  readingAt: (x: ChartHoverX) => RailReading | undefined;
}

export const SeriesRail = (props: SeriesRailProps) => {
  const x = useChartHoverX(props.group);
  let header = props.rest.header;
  let reading: RailReading = props.rest;
  let active = false;
  if (x !== null) {
    const hovered = props.readingAt(x);
    if (hovered) {
      header = props.formatX(x);
      reading = hovered;
      active = true;
    }
  }

  return (
    <StatRail
      header={header}
      active={active}
      noteSlot
      note={reading.note}
      rows={[
        {
          key: 'value',
          value: reading.value,
          unit: props.unit,
          secondary: reading.secondary,
        },
      ]}
    />
  );
};

export interface MultiSeriesRailRow {
  key: string;
  name: string;
  color: string;
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

export const MultiSeriesRail = (props: MultiSeriesRailProps) => {
  const x = useChartHoverX(props.group);
  const active = x !== null && props.isKnownX(x);

  const rows: StatRailRow[] = props.rows.map((row) => {
    let reading = row.rest;
    if (active && x !== null) {
      reading = row.readingAt(x) ?? { value: '--' };
    }
    return {
      key: row.key,
      name: row.name,
      color: row.color,
      metricId: row.metricId,
      unit: row.unit,
      value: reading.value,
      secondary: reading.secondary,
    };
  });

  let header = props.restHeader;
  if (active && x !== null) {
    header = props.formatX(x);
  }

  return <StatRail header={header} active={active} rows={rows} />;
};
