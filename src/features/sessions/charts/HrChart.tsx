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
import type { ZoneScale } from '@/lib/zoneColors.ts';
import { useZoneLineStroke } from '@/components/charts/ZoneGradient.tsx';
import type { HrPoint } from '@/lib/chartData.ts';
import { m } from '@/paraglide/messages.js';

interface HrChartProps {
  data: HrPoint[];
  mode?: 'compact' | 'expanded';
  onActiveTimeChange?: (time: number | null) => void;
  onZoomComplete?: (from: string | number, to: string | number) => void;
  onZoomReset?: () => void;
  zoneScale?: ZoneScale;
}

export const HrChart = (props: HrChartProps) => {
  const compact = props.mode === 'compact';
  const zoom = useChartZoom({
    data: props.data,
    xKey: 'time',
    onZoomComplete: props.onZoomComplete,
    onZoomReset: props.onZoomReset,
  });
  const zoneLine = useZoneLineStroke(
    props.zoneScale,
    zoom.zoomedData.map((d) => d.hr),
    false,
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
          tickCount={compact ? 3 : undefined}
          tickFormatter={(v: number) => formatTick(v, compact ? undefined : 'bpm')}
        />
        <RechartsTooltip {...hoverOnlyTooltip} />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="hr"
          stroke={zoneLine.stroke ?? tokens.chartHr}
          strokeWidth={1.5}
          dot={false}
          name={m.ui_chart_series_hr()}
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
