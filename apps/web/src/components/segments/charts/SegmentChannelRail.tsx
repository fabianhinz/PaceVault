import type { FC } from 'react';
import { Crown } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { tokens } from '@pacevault/ui/lib/tokens.ts';
import type { Segment, StoredSegmentPass } from '@/lib/workers/segmentsContract.ts';
import type { ChartHoverX } from '@/store/chartHover.ts';
import { SeriesRail } from '@/components/charts/SeriesRail.tsx';
import { formatChartTime } from '@/lib/colors/chartTheme.ts';
import { SECONDS_PER_MINUTE, SEGMENT_HOVER_GROUP } from './segmentExplorerHover.ts';
import { valueAtElapsed, type PassSeries, type SegmentChannel } from './segmentChartRows.ts';
import { SPEC_BY_SEGMENT_CHANNEL, channelUnit } from './segmentChannels.ts';

interface SegmentChannelRailProps {
  channel: SegmentChannel;
  segment: Segment;
  pass: StoredSegmentPass;
  selected: PassSeries;
  best: PassSeries | undefined;
}

const formatHoverTime = (x: ChartHoverX): string => formatChartTime(Number(x) / SECONDS_PER_MINUTE);

export const SegmentChannelRail: FC<SegmentChannelRailProps> = (props) => {
  const spec = SPEC_BY_SEGMENT_CHANNEL[props.channel];
  const unit = channelUnit({ channel: props.channel, sport: props.segment.sport });
  const rest = spec.rest({ series: props.selected, segment: props.segment, pass: props.pass });
  const best = props.best;
  let restLine = rest.value;
  if (rest.header !== '') restLine = `${rest.header} ${rest.value}`;

  return (
    <SeriesRail
      group={SEGMENT_HOVER_GROUP}
      unit={unit}
      formatX={formatHoverTime}
      rest={rest}
      readingAt={(x) => {
        const elapsedSec = Number(x);
        const value = valueAtElapsed({
          series: props.selected,
          channel: props.channel,
          elapsedSec,
        });
        if (best === undefined) return { value: spec.format(value), secondary: restLine };
        const bestValue = valueAtElapsed({ series: best, channel: props.channel, elapsedSec });
        return {
          value: spec.format(value),
          secondary: restLine,
          note: {
            text: `${spec.format(bestValue)} ${unit}`,
            color: tokens.best,
            icon: (
              <Crown
                role="img"
                aria-label={m.ui_segment_best()}
                size={12}
                fill="currentColor"
                strokeWidth={1.5}
              />
            ),
          },
        };
      }}
    />
  );
};
