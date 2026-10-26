import type { FC } from 'react';
import { PvStatTile } from '@pacevault/ui/components/pvStatTile/PvStatTile.tsx';
import { MetricLabel } from '@/components/MetricLabel.tsx';
import { pickPeak, type MoreStats } from '@/lib/moreStats.ts';
import type { Sport } from '@pacevault/engine/types.ts';
import { m } from '@pacevault/i18n/messages.js';
import { useMiniRailHover } from './hooks/useMiniRailHover.ts';
import { PeakBars } from './PeakBars.tsx';
import { statFormat } from './statFormat.ts';

interface PeakPowerCellProps {
  sport: Sport;
  peaks: NonNullable<MoreStats['peaks']>;
}

export const PeakPowerCell: FC<PeakPowerCellProps> = (props) => {
  const rail = useMiniRailHover();
  const pick = pickPeak({ peaks: props.peaks, hovered: rail.index });
  if (!pick) return null;

  return (
    <PvStatTile
      title={m.ui_more_stats_peaks()}
      stat="peakPower"
      info={<MetricLabel metricId="peakPower" size="sm" iconOnly className="self-center" />}
      value={statFormat.watts(pick.watts)}
      unit="W"
      note={statFormat.peakWindow(pick.seconds)}
    >
      <PeakBars
        sport={props.sport}
        watts={props.peaks.slots.map((slot) => slot.watts)}
        highlight={pick.index}
        railProps={rail.railProps}
        segmentProps={rail.segmentProps}
      />
    </PvStatTile>
  );
};
