import { StatTile } from '@/components/ui/StatTile.tsx';
import { pickPeak, type MoreStats } from '@/lib/moreStats.ts';
import type { Sport } from '@/packages/engine/types.ts';
import { m } from '@/paraglide/messages.js';
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
      metricId="peakPower"
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
