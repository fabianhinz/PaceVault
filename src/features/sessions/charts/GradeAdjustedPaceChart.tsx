import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  ReferenceArea,
} from 'recharts';
import { useChartZoom } from '@/lib/hooks/useChartZoom.ts';
import { LapBands, LAP_STRIP_TICK_MARGIN } from '@/components/charts/LapBands.tsx';
import { chartHoverHandlers, hoverOnlyTooltip } from '@/lib/chartHover.ts';
import { chartTheme, formatChartTime } from '@/lib/chartTheme.ts';
import { tokens } from '@/lib/tokens.ts';
import { formatPaceTick } from '@/lib/formatters.ts';
import type { GAPPoint } from '@/lib/chartData.ts';
import { m } from '@/paraglide/messages.js';

interface GradeAdjustedPaceChartProps {
  data: GAPPoint[];
  onActiveTimeChange?: (time: number | null) => void;
  onZoomComplete?: (from: string | number, to: string | number) => void;
  onSelectTime?: (time: number) => void;
}

export const GradeAdjustedPaceChart = (props: GradeAdjustedPaceChartProps) => {
  const zoom = useChartZoom({
    data: props.data,
    xKey: 'time',
    onZoomComplete: props.onZoomComplete,
    onClick: (x) => props.onSelectTime?.(Number(x)),
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        syncId={'session-detail'}
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
        <XAxis
          dataKey="time"
          ticks={[
            zoom.zoomedData[0]?.time ?? 0,
            zoom.zoomedData[zoom.zoomedData.length - 1]?.time ?? 0,
          ]}
          tick={chartTheme.tick}
          tickLine={false}
          axisLine={chartTheme.axisLine}
          tickMargin={LAP_STRIP_TICK_MARGIN}
          tickFormatter={formatChartTime}
        />
        <YAxis
          domain={['auto', 'auto']}
          yAxisId="left"
          width={chartTheme.compactYAxisWidth}
          tick={chartTheme.tick}
          tickLine={false}
          axisLine={false}
          reversed
          tickCount={3}
          tickFormatter={formatPaceTick}
        />
        <RechartsTooltip {...hoverOnlyTooltip} />
        <LapBands rows={zoom.zoomedData} xKey="time" yAxisId="left" />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="pace"
          stroke={tokens.chartPace}
          strokeWidth={1.5}
          dot={false}
          name={m.ui_chart_series_pace()}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="gap"
          stroke={tokens.chartGap}
          strokeWidth={1.5}
          dot={false}
          name={m.ui_chart_series_gap()}
        />
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
      </LineChart>
    </ResponsiveContainer>
  );
};
