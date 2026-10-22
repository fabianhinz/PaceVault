import { StatTile } from '@pacevault/ui/components/StatTile.tsx';
import { MetricLabel } from '@/components/MetricLabel.tsx';
import { pickPeak, type MoreStats } from '@/lib/moreStats.ts';
import type { Sport } from '@pacevault/engine/types.ts';
import { m } from '@pacevault/i18n/messages.js';
import { useMiniRailHover } from './hooks/useMiniRailHover.ts';
import { PeakBars } from './PeakBars.tsx';
import { peakWindow, watts } from './statFormat.ts';

interface PeakPowerCellProps {
  sport: Sport;
  peaks: NonNullable<MoreStats['peaks']>;
}

export const PeakPowerCell = (props: PeakPowerCellProps) => {
  const rail = useMiniRailHover();
  const pick = pickPeak(props.peaks, rail.index);
  if (!pick) return null;

  return (
    <StatTile
      title={m.ui_more_stats_peaks()}
      stat="peakPower"
      info={<MetricLabel metricId="peakPower" size="sm" iconOnly className="self-center" />}
      value={watts(pick.watts)}
      unit="W"
      note={peakWindow(pick.seconds)}
    >
      <PeakBars
        sport={props.sport}
        watts={props.peaks.slots.map((slot) => slot.watts)}
        highlight={pick.index}
        railProps={rail.railProps}
        segmentProps={rail.segmentProps}
      />
    </StatTile>
  );
};
