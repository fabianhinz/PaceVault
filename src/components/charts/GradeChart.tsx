import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';
import { useChartZoom } from '@/lib/hooks/useChartZoom.ts';
import { chartTheme, type ChartXAxis } from '@/lib/chartTheme.ts';
import { tokens } from '@/lib/tokens.ts';
import { m } from '@/paraglide/messages.js';

interface GradeChartProps<K extends string, T extends { grade: number } & Record<K, number>> {
  data: T[];
  xAxis: ChartXAxis<K>;
  mode?: 'compact' | 'expanded';
  onActiveXChange?: (x: number | null) => void;
  onZoomComplete?: (from: string | number, to: string | number) => void;
  onZoomReset?: () => void;
}

export const GradeChart = <K extends string, T extends { grade: number } & Record<K, number>>(
  props: GradeChartProps<K, T>,
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
      <LineChart
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
          tickFormatter={(v: number) => `${v}%`}
        />
        <RechartsTooltip
          contentStyle={chartTheme.tooltip.contentStyle}
          labelStyle={chartTheme.tooltip.labelStyle}
          isAnimationActive={chartTheme.tooltip.isAnimationActive}
          separator={chartTheme.tooltip.separator}
          labelFormatter={(v) => props.xAxis.tickFormatter(Number(v))}
        />
        {!compact && (
          <ReferenceLine
            yAxisId="left"
            y={0}
            stroke={tokens.textQuaternary}
            strokeDasharray="3 3"
          />
        )}
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="grade"
          stroke={tokens.chartGrade}
          strokeWidth={1.5}
          dot={false}
          name={m.ui_chart_series_grade()}
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
