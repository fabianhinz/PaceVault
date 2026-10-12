import { pickPeak, type MoreStats } from '@/lib/moreStats.ts';
import type { Sport } from '@/packages/engine/types.ts';
import { m } from '@/paraglide/messages.js';
import { useMiniRailHover } from './hooks/useMiniRailHover.ts';
import { PeakBars } from './PeakBars.tsx';
import { StatCaption, StatCell, StatValue } from './StatCell.tsx';
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
    <StatCell
      stat="peaks"
      label={m.ui_more_stats_peaks()}
      metricId="peakPower"
      active={pick.active}
      info1={<StatValue value={watts(pick.watts)} unit="W" />}
      info2={<StatCaption>{peakWindow(pick.seconds)}</StatCaption>}
      chart={
        <div className="flex h-8 w-full" {...rail.railProps}>
          <PeakBars
            sport={props.sport}
            watts={props.peaks.slots.map((slot) => slot.watts)}
            highlight={pick.index}
            segmentProps={rail.segmentProps}
          />
        </div>
      }
    />
  );
};
