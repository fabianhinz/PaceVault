import type { FC } from 'react';
import { PvStatRail } from '@pacevault/ui/components/pvStatRail/PvStatRail.tsx';
import { useChartHoverX, type ChartHoverX } from '@/store/chartHover.ts';
import type { RailReading } from '@/components/charts/types.ts';

interface SeriesRailProps {
  group: string;
  unit?: string;
  rest: RailReading & { header: string };
  formatX: (x: ChartHoverX) => string;
  readingAt: (x: ChartHoverX) => RailReading | undefined;
}

export const SeriesRail: FC<SeriesRailProps> = (props) => {
  const hoveredX = useChartHoverX(props.group);
  let header = props.rest.header;
  let reading: RailReading = props.rest;
  let active = false;
  if (hoveredX !== null) {
    const hovered = props.readingAt(hoveredX);
    if (hovered) {
      header = props.formatX(hoveredX);
      reading = hovered;
      active = true;
    }
  }

  return (
    <PvStatRail
      header={header}
      active={active}
      noteSlot
      secondarySlot
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
