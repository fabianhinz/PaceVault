import type { FC } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  ReferenceArea,
} from 'recharts';
import { useChartZoom } from '@/components/charts/hooks/useChartZoom.ts';
import { LapBands } from '@/components/charts/LapBands.tsx';
import { LAP_STRIP_TICK_MARGIN } from '@/components/charts/types.ts';
import { chartHoverHandlers, hoverOnlyTooltip } from '@/components/charts/chartHover.ts';
import { chartTheme, formatChartTime, formatTick } from '@/lib/colors/chartTheme.ts';
import { tokens } from '@pacevault/ui/lib/tokens.ts';
import type { CadencePoint } from '@/components/charts/chartData.ts';

interface CadenceChartProps {
  data: CadencePoint[];
  seriesName: string;
  onActiveTimeChange?: (time: number | null) => void;
  onZoomComplete?: (from: string | number, to: string | number) => void;
  onSelectTime?: (time: number) => void;
}

export const CadenceChart: FC<CadenceChartProps> = (props) => {
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
          tickCount={3}
          tickFormatter={(v: number) => formatTick(v)}
        />
        <RechartsTooltip {...hoverOnlyTooltip} />
        <LapBands rows={zoom.zoomedData} xKey="time" yAxisId="left" />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="cadence"
          stroke={tokens.chartCadence}
          strokeWidth={1.5}
          dot={false}
          name={props.seriesName}
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
