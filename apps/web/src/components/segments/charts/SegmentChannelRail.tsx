import type { FC } from 'react';
import { Crown } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { tokens } from '@pacevault/ui/lib/tokens.ts';
import type { StoredSegmentPass } from '@/lib/workers/segmentsContract.ts';
import type { MatchedSegment } from '@/components/segments/types.ts';
import type { StatRailNote } from '@pacevault/ui/components/pvStatRail/types.ts';
import type { ChartHoverX } from '@/store/chartHover.ts';
import { SeriesRail } from '@/components/charts/SeriesRail.tsx';
import { formatChartTime } from '@/lib/colors/chartTheme.ts';
import { SEGMENT_HOVER_GROUP } from './segmentExplorerHover.ts';
import {
  SECONDS_PER_MINUTE,
  valueAtMovingSec,
  type PassSeries,
  type SegmentChannel,
} from './segmentChartRows.ts';
import { SPEC_BY_SEGMENT_CHANNEL, channelUnit } from './segmentChannels.ts';

interface SegmentChannelRailProps {
  channel: SegmentChannel;
  segment: MatchedSegment;
  pass: StoredSegmentPass;
  bestPass: StoredSegmentPass;
  selected: PassSeries;
  best: PassSeries | undefined;
}

const bestNote = (text: string): StatRailNote => ({
  text,
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
});

const formatHoverTime = (x: ChartHoverX): string => formatChartTime(Number(x) / SECONDS_PER_MINUTE);

export const SegmentChannelRail: FC<SegmentChannelRailProps> = (props) => {
  const spec = SPEC_BY_SEGMENT_CHANNEL[props.channel];
  const unit = channelUnit({ channel: props.channel, sport: props.segment.sport });
  const rest = spec.rest({ series: props.selected, segment: props.segment, pass: props.pass });
  const best = props.best;
  let restLine = rest.value;
  if (rest.header !== '') restLine = `${rest.header} ${rest.value}`;
  let restNote: StatRailNote | undefined = undefined;
  if (best !== undefined && spec.bestAtRest) {
    const bestRest = spec.rest({ series: best, segment: props.segment, pass: props.bestPass });
    restNote = bestNote(`${bestRest.value} ${unit}`);
  }

  return (
    <SeriesRail
      group={SEGMENT_HOVER_GROUP}
      unit={unit}
      formatX={formatHoverTime}
      rest={{ ...rest, note: restNote }}
      notePlacement="top"
      readingAt={(x) => {
        const movingSec = Number(x);
        const value = valueAtMovingSec({
          series: props.selected,
          channel: props.channel,
          movingSec,
        });
        if (best === undefined) return { value: spec.format(value), secondary: restLine };
        const bestValue = valueAtMovingSec({ series: best, channel: props.channel, movingSec });
        return {
          value: spec.format(value),
          secondary: restLine,
          note: bestNote(`${spec.format(bestValue)} ${unit}`),
        };
      }}
    />
  );
};
