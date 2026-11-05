import { useMemo, type FC } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { tokens } from '@pacevault/ui/lib/tokens.ts';
import { chartHoverHandlers, hoverOnlyTooltip } from '@/components/charts/chartHover.ts';
import { chartTheme, formatChartTime, formatTick } from '@/lib/colors/chartTheme.ts';
import {
  hoverSegmentExplorer,
  SECONDS_PER_MINUTE,
  SEGMENT_HOVER_GROUP,
} from './segmentExplorerHover.ts';
import { segmentChartRows, type PassSeries, type SegmentChannel } from './segmentChartRows.ts';
import { SPEC_BY_SEGMENT_CHANNEL } from './segmentChannels.ts';

interface SegmentChannelChartProps {
  channel: SegmentChannel;
  selected: PassSeries;
  best: PassSeries | undefined;
  domainSec: number;
}

export const SegmentChannelChart: FC<SegmentChannelChartProps> = (props) => {
  const spec = SPEC_BY_SEGMENT_CHANNEL[props.channel];
  const rows = useMemo(
    () => segmentChartRows({ selected: props.selected, best: props.best, channel: props.channel }),
    [props.selected, props.best, props.channel],
  );
  const paired = props.best !== undefined;
  let selectedColor: string = tokens.best;
  if (paired) selectedColor = tokens.white;
  const onHover = (elapsedSec: number | null) =>
    hoverSegmentExplorer({ elapsedSec, selected: props.selected, best: props.best });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        syncId={SEGMENT_HOVER_GROUP}
        data={rows}
        onMouseMove={(event) => {
          if (event.activeLabel != null) onHover(Number(event.activeLabel));
        }}
        {...chartHoverHandlers(onHover)}
      >
        <XAxis
          dataKey="elapsedSec"
          type="number"
          domain={[0, props.domainSec]}
          ticks={[0, props.domainSec]}
          tick={chartTheme.tick}
          tickLine={false}
          axisLine={chartTheme.axisLine}
          tickFormatter={(value: number) => formatChartTime(value / SECONDS_PER_MINUTE)}
        />
        <YAxis
          domain={['auto', 'auto']}
          width={chartTheme.compactYAxisWidth}
          tick={chartTheme.tick}
          tickLine={false}
          axisLine={false}
          tickCount={3}
          reversed={spec.reversed}
          tickFormatter={(value: number) => formatTick(value)}
        />
        <Tooltip {...hoverOnlyTooltip} />
        {paired && (
          <Line
            dataKey="best"
            type="monotone"
            stroke={tokens.best}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        )}
        <Line
          dataKey="selected"
          type="monotone"
          stroke={selectedColor}
          strokeWidth={1.75}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
