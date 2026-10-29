import type { FC } from 'react';
import { formatNumber } from '@/lib/format/formatters.ts';
import { WIND_COLORS } from '@/lib/colors/zoneColors.ts';
import type { WindExposure } from '@pacevault/engine/windExposure.ts';
import { WIND_LEGEND } from '@/components/sessions/session/weatherConditions.ts';

interface WindLegendProps {
  exposure: WindExposure;
}

export const WindLegend: FC<WindLegendProps> = (props) => (
  <div className="flex flex-wrap gap-3 text-xs text-text-tertiary tabular-nums">
    {WIND_LEGEND.map((entry) => (
      <span key={entry.key} className="inline-flex items-center gap-1">
        <span
          aria-hidden
          className="size-2 rounded-xs"
          style={{ backgroundColor: WIND_COLORS[entry.key] }}
        />
        {entry.label()}
        <span className="font-medium text-text-primary">
          {formatNumber(entry.pct(props.exposure) / 100, 'percent')}
        </span>
      </span>
    ))}
  </div>
);
