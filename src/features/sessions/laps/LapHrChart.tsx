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
import { avgDomain, chartTheme, formatTick } from '@/lib/chartTheme.ts';
import { tokens } from '@/lib/tokens.ts';
import { hoverOnlyTooltip } from '@/lib/chartHover.ts';
import { type LapHrPoint, lapIndexAt } from '@/lib/lapChartData.ts';
import { m } from '@/paraglide/messages.js';

interface LapHrChartProps {
  data: LapHrPoint[];
  mode: 'compact' | 'expanded';
  syncId?: string;
  onActiveLapChange?: (lapIndex: number | null) => void;
}

export const LapHrChart = (props: LapHrChartProps) => {
  const compact = props.mode === 'compact';
  const yDomain = avgDomain(props.data.map((d) => d.avgHr));
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
          domain={yDomain}
          width={compact ? chartTheme.compactYAxisWidth : undefined}
          allowDataOverflow
          tick={chartTheme.tick}
          tickLine={false}
          axisLine={false}
          tickCount={compact ? 3 : undefined}
          tickFormatter={(v: number) => formatTick(v, compact ? undefined : 'bpm')}
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
