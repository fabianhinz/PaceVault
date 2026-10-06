import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { chartTheme, niceAxis, formatTick } from '@/lib/chartTheme.ts';
import { tokens } from '@/lib/tokens.ts';
import { hoverOnlyTooltip } from '@/lib/chartHover.ts';
import { type LapPowerPoint, lapIndexAt } from '@/lib/lapChartData.ts';
import { m } from '@/paraglide/messages.js';

interface LapPowerChartProps {
  data: LapPowerPoint[];
  mode: 'compact' | 'expanded';
  syncId?: string;
  onActiveLapChange?: (lapIndex: number | null) => void;
}

export const LapPowerChart = (props: LapPowerChartProps) => {
  const compact = props.mode === 'compact';
  const yAxis = niceAxis(
    props.data.map((d) => d.avgPower),
    compact ? 3 : undefined,
  );
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={props.data}
        syncId={compact ? props.syncId : undefined}
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
        {!compact && <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid.stroke} />}
        <XAxis
          dataKey="lap"
          ticks={
            compact
              ? [props.data[0]?.lap, props.data[props.data.length - 1]?.lap].filter(
                  (v): v is string => v != null,
                )
              : undefined
          }
          tick={chartTheme.tick}
          tickLine={false}
          axisLine={chartTheme.axisLine}
        />
        <YAxis
          domain={yAxis?.domain}
          ticks={yAxis?.ticks}
          width={compact ? chartTheme.compactYAxisWidth : undefined}
          allowDataOverflow
          tick={chartTheme.tick}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => formatTick(v, compact ? undefined : 'W')}
        />
        <RechartsTooltip {...hoverOnlyTooltip} cursor={{ fill: `${tokens.accent}14` }} />
        <Area
          dataKey="powerRange"
          type="monotone"
          fill={tokens.chartPower}
          fillOpacity={0.15}
          stroke="none"
          tooltipType="none"
          dot={false}
        />
        <Line
          dataKey="avgPower"
          name={m.ui_chart_series_avg_power()}
          type="monotone"
          stroke={tokens.chartPower}
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};
