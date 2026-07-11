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
import { chartTheme, formatTick } from '@/lib/chartTheme.ts';
import { tokens } from '@/lib/tokens.ts';
import type { RouteGradePoint } from '@/packages/gpx/routeProfile.ts';
import { m } from '@/paraglide/messages.js';

interface RouteGradeChartProps {
  data: RouteGradePoint[];
  mode?: 'compact' | 'expanded';
  onActiveDistChange?: (dist: number | null) => void;
  onZoomComplete?: (from: string | number, to: string | number) => void;
  onZoomReset?: () => void;
}

export const RouteGradeChart = (props: RouteGradeChartProps) => {
  const compact = props.mode === 'compact';
  const zoom = useChartZoom({
    data: props.data,
    xKey: 'dist',
    onZoomComplete: props.onZoomComplete,
    onZoomReset: props.onZoomReset,
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        syncId={compact ? 'studio-detail' : undefined}
        data={zoom.zoomedData}
        onMouseDown={zoom.onMouseDown}
        onMouseMove={(e) => {
          zoom.onMouseMove(e);
          if (compact && props.onActiveDistChange && e.activeLabel != null)
            props.onActiveDistChange(Number(e.activeLabel));
        }}
        onMouseUp={zoom.onMouseUp}
        onMouseLeave={
          compact && props.onActiveDistChange ? () => props.onActiveDistChange?.(null) : undefined
        }
      >
        {!compact && <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid.stroke} />}
        <XAxis
          dataKey="dist"
          ticks={
            compact
              ? [
                  zoom.zoomedData[0]?.dist ?? 0,
                  zoom.zoomedData[zoom.zoomedData.length - 1]?.dist ?? 0,
                ]
              : undefined
          }
          tick={chartTheme.tick}
          tickLine={false}
          axisLine={chartTheme.axisLine}
          tickFormatter={(v: number) => formatTick(v, 'km')}
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
          labelFormatter={(v) => formatTick(Number(v), 'km')}
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
