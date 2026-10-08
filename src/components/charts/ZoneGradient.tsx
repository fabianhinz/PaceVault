import { useId } from 'react';
import { zoneLineStroke, type ColorScale } from '@/lib/zoneColors.ts';

export const useZoneLineStroke = (
  scale: ColorScale | undefined,
  values: Array<number | null | undefined>,
  reversed: boolean,
) => {
  const gradientId = `zone-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;
  const line = zoneLineStroke(scale, values, reversed, gradientId);
  const stops = line?.stops;
  return {
    stroke: line?.stroke,
    defs: stops && (
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          {stops.map((stop) => (
            <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
          ))}
        </linearGradient>
      </defs>
    ),
  };
};
