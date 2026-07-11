import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceArea,
} from 'recharts';
import { useChartZoom } from '@/lib/hooks/useChartZoom.ts';
import { chartTheme, formatTick, type ChartXAxis } from '@/lib/chartTheme.ts';
import { tokens } from '@/lib/tokens.ts';
import { m } from '@/paraglide/messages.js';

interface ElevationChartProps<
  K extends string,
  T extends { elevation: number } & Record<K, number>,
> {
  data: T[];
  xAxis: ChartXAxis<K>;
  mode?: 'compact' | 'expanded';
  onActiveXChange?: (x: number | null) => void;
  onZoomComplete?: (from: string | number, to: string | number) => void;
  onZoomReset?: () => void;
}

export const ElevationChart = <
  K extends string,
  T extends { elevation: number } & Record<K, number>,
>(
  props: ElevationChartProps<K, T>,
) => {
  const compact = props.mode === 'compact';
  const zoom = useChartZoom({
    data: props.data,
    xKey: props.xAxis.key,
    onZoomComplete: props.onZoomComplete,
    onZoomReset: props.onZoomReset,
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        syncId={compact ? props.xAxis.syncId : undefined}
        data={zoom.zoomedData}
        onMouseDown={zoom.onMouseDown}
        onMouseMove={(e) => {
          zoom.onMouseMove(e);
          if (compact && props.onActiveXChange && e.activeLabel != null)
            props.onActiveXChange(Number(e.activeLabel));
        }}
        onMouseUp={zoom.onMouseUp}
        onMouseLeave={
          compact && props.onActiveXChange ? () => props.onActiveXChange?.(null) : undefined
        }
      >
        {!compact && <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid.stroke} />}
        <XAxis
          dataKey={props.xAxis.key}
          ticks={
            compact
              ? [
                  zoom.zoomedData[0]?.[props.xAxis.key] ?? 0,
                  zoom.zoomedData[zoom.zoomedData.length - 1]?.[props.xAxis.key] ?? 0,
                ]
              : undefined
          }
          tick={chartTheme.tick}
          tickLine={false}
          axisLine={chartTheme.axisLine}
          tickFormatter={props.xAxis.tickFormatter}
        />
        <YAxis
          yAxisId="left"
          tick={chartTheme.tick}
          tickLine={false}
          axisLine={false}
          tickCount={compact ? 3 : undefined}
          tickFormatter={(v: number) => formatTick(v, compact ? undefined : 'm')}
        />
        <RechartsTooltip
          contentStyle={chartTheme.tooltip.contentStyle}
          labelStyle={chartTheme.tooltip.labelStyle}
          isAnimationActive={chartTheme.tooltip.isAnimationActive}
          separator={chartTheme.tooltip.separator}
          labelFormatter={(v) => props.xAxis.tickFormatter(Number(v))}
        />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="elevation"
          stroke={tokens.chartElevation}
          fill={tokens.chartElevation}
          fillOpacity={0.2}
          strokeWidth={1.5}
          dot={false}
          name={m.ui_chart_series_elevation()}
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
      </AreaChart>
    </ResponsiveContainer>
  );
};
