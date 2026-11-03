import type { FC } from 'react';
import { PvChartRow } from '@pacevault/ui/components/pvChartsCard/PvChartRow.tsx';
import { PvChartsCard } from '@pacevault/ui/components/pvChartsCard/PvChartsCard.tsx';
import { GLASS_CLASS } from '@pacevault/ui/lib/surfaces.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';
import type { Segment, StoredSegmentPass } from '@/lib/workers/segmentsContract.ts';
import { SEGMENT_CHANNELS, hasChannelValues } from './segmentChartRows.ts';
import { SPEC_BY_SEGMENT_CHANNEL, channelIcon } from './segmentChannels.ts';
import { SegmentChannelChart } from './SegmentChannelChart.tsx';
import { SegmentChannelRail } from './SegmentChannelRail.tsx';
import { SegmentExplorerLegend } from './SegmentExplorerLegend.tsx';
import { useSegmentChartRows } from './hooks/useSegmentChartRows.ts';

interface SegmentChartsExplorerProps {
  segment: Segment;
  selected: StoredSegmentPass;
  best: StoredSegmentPass;
  sportColor: string;
}

export const SegmentChartsExplorer: FC<SegmentChartsExplorerProps> = (props) => {
  const chartSeries = useSegmentChartRows({
    segment: props.segment,
    selected: props.selected,
    best: props.best,
  });
  const selectedSeries = chartSeries.selected;
  const shownPass = chartSeries.selectedPass;
  if (chartSeries.loading || selectedSeries === undefined || shownPass === undefined) {
    return <div className={cn(GLASS_CLASS, 'h-52px animate-pulse rounded-2xl')} />;
  }
  const bestSeries = chartSeries.best;
  const paired = bestSeries !== undefined;
  let domainSec = shownPass.durationSec;
  if (paired) domainSec = Math.max(domainSec, props.best.durationSec);
  const channels = SEGMENT_CHANNELS.filter(
    (channel) =>
      hasChannelValues({ series: selectedSeries, channel }) ||
      hasChannelValues({ series: bestSeries, channel }),
  );

  return (
    <div data-testid="segment-explorer">
      <PvChartsCard
        zoomReset={
          <SegmentExplorerLegend
            selectedDate={shownPass.date}
            paired={paired}
            sportColor={props.sportColor}
          />
        }
      >
        {channels.map((channel) => (
          <PvChartRow
            key={channel}
            title={SPEC_BY_SEGMENT_CHANNEL[channel].title()}
            icon={channelIcon({ channel, sport: props.segment.sport })}
            color={SPEC_BY_SEGMENT_CHANNEL[channel].color}
            rail={
              <SegmentChannelRail
                channel={channel}
                segment={props.segment}
                pass={shownPass}
                selected={selectedSeries}
                best={bestSeries}
              />
            }
          >
            <SegmentChannelChart
              channel={channel}
              selected={selectedSeries}
              best={bestSeries}
              domainSec={domainSec}
              sportColor={props.sportColor}
            />
          </PvChartRow>
        ))}
      </PvChartsCard>
    </div>
  );
};
