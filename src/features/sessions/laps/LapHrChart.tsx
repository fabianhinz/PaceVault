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
import { type LapHrPoint, lapIndexAt } from '@/lib/lapChartData.ts';
import { m } from '@/paraglide/messages.js';

interface LapHrChartProps {
  data: LapHrPoint[];
  syncId?: string;
  onActiveLapChange?: (lapIndex: number | null) => void;
}

export const LapHrChart = (props: LapHrChartProps) => {
  const yAxis = niceAxis(
    props.data.map((d) => d.avgHr),
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
          tickFormatter={(v: number) => formatTick(v)}
        />
        <RechartsTooltip {...hoverOnlyTooltip} cursor={{ fill: `${tokens.accent}14` }} />
        <Area
          dataKey="hrRange"
          type="monotone"
          fill={tokens.chartHr}
          fillOpacity={0.15}
          stroke="none"
          tooltipType="none"
          dot={false}
        />
        <Line
          dataKey="avgHr"
          name={m.ui_chart_series_avg_hr()}
          type="monotone"
          stroke={tokens.chartHr}
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};
