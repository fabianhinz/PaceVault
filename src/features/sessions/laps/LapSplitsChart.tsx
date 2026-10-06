import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { chartTheme, niceAxis, formatTick } from '@/lib/chartTheme.ts';
import { tokens } from '@/lib/tokens.ts';
import { hoverOnlyTooltip } from '@/lib/chartHover.ts';
import { formatPaceInput } from '@/lib/formatters.ts';
import { type LapSplitPoint, lapIndexAt } from '@/lib/lapChartData.ts';
import { m } from '@/paraglide/messages.js';

interface LapSplitsChartProps {
  data: LapSplitPoint[];
  isRunning: boolean;
  syncId?: string;
  onActiveLapChange?: (lapIndex: number | null) => void;
}

export const LapSplitsChart = (props: LapSplitsChartProps) => {
  const dataKey = props.isRunning ? 'pace' : 'speed';
  const fill = props.isRunning ? tokens.chartPace : tokens.chartSpeed;
  const hasRangeData = props.data.some(
    (d) => (props.isRunning ? d.paceRange : d.speedRange) !== undefined,
  );
  const yAxis = niceAxis(
    props.data.map((d) => (props.isRunning ? d.pace : d.speed)),
    3,
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={props.data}
        syncId={props.syncId}
        syncMethod="value"
        onMouseMove={(state) => {
          props.onActiveLapChange?.(lapIndexAt(props.data, state.activeTooltipIndex));
        }}
        onMouseLeave={() => props.onActiveLapChange?.(null)}
        onTouchMove={(state) => {
          props.onActiveLapChange?.(lapIndexAt(props.data, state.activeTooltipIndex));
        }}
        onTouchEnd={() => props.onActiveLapChange?.(null)}
      >
        <XAxis
          dataKey="lap"
          ticks={[props.data[0]?.lap, props.data[props.data.length - 1]?.lap].filter(
            (v): v is string => v != null,
          )}
          tick={chartTheme.tick}
          tickLine={false}
          axisLine={chartTheme.axisLine}
        />
        <YAxis
          domain={yAxis?.domain}
          ticks={yAxis?.ticks}
          width={chartTheme.compactYAxisWidth}
          allowDataOverflow
          tick={chartTheme.tick}
          tickLine={false}
          axisLine={false}
          reversed={props.isRunning}
          tickFormatter={(v: number) => {
            if (props.isRunning) {
              return formatPaceInput(v);
            }
            return formatTick(v);
          }}
        />
        <RechartsTooltip {...hoverOnlyTooltip} cursor={{ fill: `${tokens.accent}14` }} />
        {hasRangeData && (
          <Area
            dataKey={props.isRunning ? 'paceRange' : 'speedRange'}
            type="monotone"
            fill={fill}
            fillOpacity={0.15}
            stroke="none"
            tooltipType="none"
            dot={false}
          />
        )}
        <Line
          dataKey={dataKey}
          name={props.isRunning ? m.ui_chart_series_pace() : m.ui_chart_series_speed()}
          type="monotone"
          stroke={fill}
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};
