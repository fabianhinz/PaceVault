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
import { chartTheme, formatChartTime } from '@/lib/chartTheme.ts';
import { tokens } from '@/lib/tokens.ts';
import type { ZoneScale } from '@/lib/zoneColors.ts';
import { useZoneLineStroke } from '@/components/charts/ZoneGradient.tsx';
import { formatPaceTick } from '@/lib/formatters.ts';
import type { PacePoint } from '@/lib/chartData.ts';
import { m } from '@/paraglide/messages.js';

interface PaceChartProps {
  data: PacePoint[];
  mode?: 'compact' | 'expanded';
  onActiveTimeChange?: (time: number | null) => void;
  onZoomComplete?: (from: string | number, to: string | number) => void;
  onZoomReset?: () => void;
  zoneScale?: ZoneScale;
}

export const PaceChart = (props: PaceChartProps) => {
  const compact = props.mode === 'compact';
  const zoom = useChartZoom({
    data: props.data,
    xKey: 'time',
    onZoomComplete: props.onZoomComplete,
    onZoomReset: props.onZoomReset,
  });
  const zoneLine = useZoneLineStroke(
    props.zoneScale,
    zoom.zoomedData.map((d) => d.pace),
    true,
  );

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
        {zoneLine.defs}
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
          reversed
          tickCount={compact ? 3 : undefined}
          tickFormatter={formatPaceTick}
        />
        <RechartsTooltip {...hoverOnlyTooltip} />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="pace"
          stroke={zoneLine.stroke ?? tokens.chartPace}
          strokeWidth={1.5}
          dot={false}
          name={m.ui_chart_series_pace()}
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
