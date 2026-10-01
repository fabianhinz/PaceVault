import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceArea,
} from 'recharts';
import { useChartZoom } from '@/lib/hooks/useChartZoom.ts';
import { chartTheme, formatChartTime } from '@/lib/chartTheme.ts';
import { tokens } from '@/lib/tokens.ts';
import { formatPaceTick } from '@/lib/formatters.ts';
import type { GAPPoint } from '@/lib/chartData.ts';
import { m } from '@/paraglide/messages.js';

interface GradeAdjustedPaceChartProps {
  data: GAPPoint[];
  mode?: 'compact' | 'expanded';
  onActiveTimeChange?: (time: number | null) => void;
  onZoomComplete?: (from: string | number, to: string | number) => void;
  onZoomReset?: () => void;
}

export const GradeAdjustedPaceChart = (props: GradeAdjustedPaceChartProps) => {
  const compact = props.mode === 'compact';
  const zoom = useChartZoom({
    data: props.data,
    xKey: 'time',
    onZoomComplete: props.onZoomComplete,
    onZoomReset: props.onZoomReset,
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        syncId={compact ? 'session-detail' : undefined}
        data={zoom.zoomedData}
        onMouseDown={zoom.onMouseDown}
        onMouseMove={(e) => {
          zoom.onMouseMove(e);
          if (compact && props.onActiveTimeChange && e.activeLabel != null)
            props.onActiveTimeChange(Number(e.activeLabel));
        }}
        onMouseUp={zoom.onMouseUp}
        onMouseLeave={
          compact && props.onActiveTimeChange ? () => props.onActiveTimeChange?.(null) : undefined
        }
      >
        {!compact && <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid.stroke} />}
        <XAxis
          dataKey="time"
          ticks={
            compact
              ? [
                  zoom.zoomedData[0]?.time ?? 0,
                  zoom.zoomedData[zoom.zoomedData.length - 1]?.time ?? 0,
                ]
              : undefined
          }
          tick={chartTheme.tick}
          tickLine={false}
          axisLine={chartTheme.axisLine}
          tickFormatter={formatChartTime}
        />
        <YAxis
          yAxisId="left"
          tick={chartTheme.tick}
          tickLine={false}
          axisLine={false}
          reversed
          tickCount={compact ? 3 : undefined}
          tickFormatter={formatPaceTick}
        />
        <RechartsTooltip
          contentStyle={chartTheme.tooltip.contentStyle}
          labelStyle={chartTheme.tooltip.labelStyle}
          isAnimationActive={chartTheme.tooltip.isAnimationActive}
          separator={chartTheme.tooltip.separator}
          labelFormatter={(v) => formatChartTime(Number(v))}
          formatter={(v: number | undefined, name: string | undefined) => [
            v !== undefined ? formatPaceTick(v) : '',
            name ?? '',
          ]}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="pace"
          stroke={tokens.chartPace}
          strokeWidth={1.5}
          dot={false}
          connectNulls
          name={m.ui_chart_series_pace()}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="gap"
          stroke={tokens.chartGap}
          strokeWidth={1.5}
          dot={false}
          connectNulls
          name={m.ui_chart_series_gap()}
        />
        {zoom.refAreaLeft && zoom.refAreaRight && (
          <ReferenceArea
            yAxisId="left"
            x1={zoom.refAreaLeft}
            x2={zoom.refAreaRight}
            strokeOpacity={0.3}
            fill={tokens.accent}
            fillOpacity={0.15}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
};
