import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  ReferenceArea,
} from 'recharts';
import { useChartZoom } from '@/lib/hooks/useChartZoom.ts';
import { LapBands, LAP_STRIP_TICK_MARGIN } from './LapBands.tsx';
import { chartHoverHandlers, hoverOnlyTooltip } from '@/lib/chartHover.ts';
import { chartTheme, formatTick, type ChartXAxis } from '@/lib/chartTheme.ts';
import { tokens } from '@/lib/tokens.ts';
import { m } from '@/paraglide/messages.js';

interface ElevationChartProps<
  K extends string,
  T extends { elevation: number | null; climbElevation?: number | null } & Record<K, number>,
> {
  data: T[];
  xAxis: ChartXAxis<K>;
  onActiveXChange?: (x: number | null) => void;
  onZoomComplete?: (from: string | number, to: string | number) => void;
  onSelectX?: (x: number) => void;
  lapBands?: boolean;
  climbs?: boolean;
}

export const ElevationChart = <
  K extends string,
  T extends { elevation: number | null; climbElevation?: number | null } & Record<K, number>,
>(
  props: ElevationChartProps<K, T>,
) => {
  const zoom = useChartZoom({
    data: props.data,
    xKey: props.xAxis.key,
    onZoomComplete: props.onZoomComplete,
    onClick: (x) => props.onSelectX?.(Number(x)),
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        syncId={props.xAxis.syncId}
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
        <XAxis
          dataKey={props.xAxis.key}
          type={props.xAxis.type}
          domain={props.xAxis.type === 'number' ? ['dataMin', 'dataMax'] : undefined}
          ticks={[
            zoom.zoomedData[0]?.[props.xAxis.key] ?? 0,
            zoom.zoomedData[zoom.zoomedData.length - 1]?.[props.xAxis.key] ?? 0,
          ]}
          tick={chartTheme.tick}
          tickLine={false}
          axisLine={chartTheme.axisLine}
          tickMargin={props.lapBands ? LAP_STRIP_TICK_MARGIN : undefined}
          tickFormatter={props.xAxis.tickFormatter}
        />
        <YAxis
          domain={['auto', 'auto']}
          yAxisId="left"
          width={chartTheme.compactYAxisWidth}
          tick={chartTheme.tick}
          tickLine={false}
          axisLine={false}
          tickCount={3}
          tickFormatter={(v: number) => formatTick(v)}
        />
        <RechartsTooltip {...hoverOnlyTooltip} />
        {props.lapBands && (
          <LapBands rows={zoom.zoomedData} xKey={props.xAxis.key} yAxisId="left" />
        )}
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
        {props.climbs && (
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="climbElevation"
            baseValue="dataMin"
            stroke={tokens.chartClimb}
            fill={tokens.chartClimb}
            fillOpacity={0.35}
            strokeWidth={2.5}
            strokeLinecap="round"
            dot={false}
          />
        )}
        {zoom.refAreaLeft !== null && zoom.refAreaRight !== null && (
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
