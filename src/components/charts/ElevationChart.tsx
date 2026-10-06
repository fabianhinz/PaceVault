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
import { chartHoverHandlers, hoverOnlyTooltip } from '@/lib/chartHover.ts';
import { chartTheme, formatTick, type ChartXAxis } from '@/lib/chartTheme.ts';
import { tokens } from '@/lib/tokens.ts';
import { m } from '@/paraglide/messages.js';

interface ElevationChartProps<
  K extends string,
  T extends { elevation: number | null } & Record<K, number>,
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
  T extends { elevation: number | null } & Record<K, number>,
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
          if (props.onActiveXChange && e.activeLabel != null)
            props.onActiveXChange(Number(e.activeLabel));
        }}
        onMouseUp={zoom.onMouseUp}
        {...chartHoverHandlers(props.onActiveXChange)}
      >
        {!compact && <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid.stroke} />}
        <XAxis
          dataKey={props.xAxis.key}
          type={props.xAxis.type}
          domain={props.xAxis.type === 'number' ? ['dataMin', 'dataMax'] : undefined}
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
          domain={['auto', 'auto']}
          yAxisId="left"
          width={compact ? chartTheme.compactYAxisWidth : undefined}
          tick={chartTheme.tick}
          tickLine={false}
          axisLine={false}
          tickCount={compact ? 3 : undefined}
          tickFormatter={(v: number) => formatTick(v, compact ? undefined : 'm')}
        />
        <RechartsTooltip {...hoverOnlyTooltip} />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="elevation"
          baseValue="dataMin"
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
