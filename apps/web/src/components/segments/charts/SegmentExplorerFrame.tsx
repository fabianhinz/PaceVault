import type { FC } from 'react';
import { PvChartRow } from '@pacevault/ui/components/pvChartsCard/PvChartRow.tsx';
import { PvChartsCard } from '@pacevault/ui/components/pvChartsCard/PvChartsCard.tsx';
import type { Sport } from '@pacevault/engine/types.ts';
import type { SegmentChannel } from './segmentChartRows.ts';
import { SPEC_BY_SEGMENT_CHANNEL, channelIcon } from './segmentChannels.ts';

const FRAME_CHANNELS_BY_SPORT: Record<Sport, SegmentChannel[]> = {
  running: ['hr', 'pace', 'elevation'],
  cycling: ['hr', 'speed', 'elevation'],
};

interface SegmentExplorerFrameProps {
  sport: Sport;
}

export const SegmentExplorerFrame: FC<SegmentExplorerFrameProps> = (props) => (
  <div data-testid="segment-explorer-frame" aria-busy>
    <PvChartsCard zoomReset={null}>
      {FRAME_CHANNELS_BY_SPORT[props.sport].map((channel) => (
        <PvChartRow
          key={channel}
          title={SPEC_BY_SEGMENT_CHANNEL[channel].title()}
          icon={channelIcon({ channel, sport: props.sport })}
          color={SPEC_BY_SEGMENT_CHANNEL[channel].color}
          rail={<span />}
        >
          <span />
        </PvChartRow>
      ))}
    </PvChartsCard>
  </div>
);
