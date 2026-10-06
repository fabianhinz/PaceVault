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
import { chartHoverHandlers, hoverOnlyTooltip } from '@/lib/chartHover.ts';
import { chartTheme, formatChartTime, formatTick } from '@/lib/chartTheme.ts';
import { tokens } from '@/lib/tokens.ts';
import type { SpeedPoint } from '@/lib/chartData.ts';
import { m } from '@/paraglide/messages.js';

interface SpeedChartProps {
  data: SpeedPoint[];
  mode?: 'compact' | 'expanded';
  onActiveTimeChange?: (time: number | null) => void;
  onZoomComplete?: (from: string | number, to: string | number) => void;
  onZoomReset?: () => void;
}

export const SpeedChart = (props: SpeedChartProps) => {
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
          if (props.onActiveTimeChange && e.activeLabel != null)
            props.onActiveTimeChange(Number(e.activeLabel));
        }}
        onMouseUp={zoom.onMouseUp}
        {...chartHoverHandlers(props.onActiveTimeChange)}
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
          domain={['auto', 'auto']}
          yAxisId="left"
          width={compact ? chartTheme.compactYAxisWidth : undefined}
          tick={chartTheme.tick}
          tickLine={false}
          axisLine={false}
          tickCount={compact ? 3 : undefined}
          tickFormatter={(v: number) => formatTick(v, compact ? undefined : 'km/h')}
        />
        <RechartsTooltip {...hoverOnlyTooltip} />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="speed"
          stroke={tokens.chartSpeed}
          strokeWidth={1.5}
          dot={false}
          name={m.ui_chart_series_speed()}
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
