import type { FC } from 'react';
import { PvChartRow } from '@pacevault/ui/components/pvChartsCard/PvChartRow.tsx';
import { PvChartsCard } from '@pacevault/ui/components/pvChartsCard/PvChartsCard.tsx';
import type { StoredSegmentPass } from '@/lib/workers/segmentsContract.ts';
import type { MatchedSegment } from '@/components/segments/types.ts';
import { SEGMENT_CHANNELS, hasChannelValues } from './segmentChartRows.ts';
import { SPEC_BY_SEGMENT_CHANNEL, channelIcon } from './segmentChannels.ts';
import { SegmentChannelChart } from './SegmentChannelChart.tsx';
import { SegmentChannelRail } from './SegmentChannelRail.tsx';
import { SegmentExplorerFrame } from './SegmentExplorerFrame.tsx';
import { useSegmentChartRows } from './hooks/useSegmentChartRows.ts';

interface SegmentChartsExplorerProps {
  segment: MatchedSegment;
  selected: StoredSegmentPass;
  best: StoredSegmentPass;
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
    return <SegmentExplorerFrame sport={props.segment.sport} />;
  }
  const bestSeries = chartSeries.best;
  let domainSec = shownPass.durationSec;
  if (bestSeries !== undefined) domainSec = Math.max(domainSec, props.best.durationSec);
  const channels = SEGMENT_CHANNELS.filter(
    (channel) =>
      hasChannelValues({ series: selectedSeries, channel }) ||
      hasChannelValues({ series: bestSeries, channel }),
  );

  return (
    <div data-testid="segment-explorer">
      <PvChartsCard zoomReset={null}>
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
                bestPass={props.best}
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
            />
          </PvChartRow>
        ))}
      </PvChartsCard>
    </div>
  );
};
