import type { FC } from 'react';
import { PaceRange } from '@/components/PaceRange.tsx';
import { COLOR_BY_RUNNING_ZONE } from '@/lib/colors/zoneColors.ts';
import type { RunningZone } from '@pacevault/engine/types.ts';
import { LABEL_BY_RUNNING_ZONE } from '@/microcopy/zones.ts';

interface ZoneLegendProps {
  zones: RunningZone[];
  compact?: boolean;
}

export const ZoneLegend: FC<ZoneLegendProps> = (props) => {
  return (
    <div
      className={props.compact ? 'flex flex-nowrap overflow-x-auto gap-1' : 'flex flex-wrap gap-2'}
    >
      {props.zones.map((zone) => (
        <span
          key={zone.name}
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 text-xs text-text-secondary whitespace-nowrap"
        >
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: COLOR_BY_RUNNING_ZONE[zone.name] }}
          />
          {LABEL_BY_RUNNING_ZONE[zone.name]()}
          {!props.compact && (
            <PaceRange minPace={zone.slowestPaceSecPerKm} maxPace={zone.fastestPaceSecPerKm} />
          )}
        </span>
      ))}
    </div>
  );
};
