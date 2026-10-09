import { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';
import { ChartRow } from '@/components/ui/ChartsCard.tsx';
import { MultiSeriesRail } from '@/components/charts/ChartRail.tsx';
import { useChartZoom } from '@/lib/hooks/useChartZoom.ts';
import { chartTheme } from '@/lib/chartTheme.ts';
import { hoverOnlyTooltip, indexByX } from '@/lib/chartHover.ts';
import { railInt } from '@/lib/railFormat.ts';
import { METRIC_EXPLANATIONS } from '@/lib/explanations.ts';
import { formatDashboardDate } from './dashboardDate.ts';
import { tokens } from '@/lib/tokens.ts';
import { useDashboardAxis } from './hooks/useDashboardAxis.ts';
import { DASHBOARD_Y_AXIS_WIDTH } from '@/lib/dashboardVolume.ts';
import { DASHBOARD_HOVER_GROUP, useDashboardChartEvents } from './hooks/useDashboardChartEvents.ts';
import { m } from '@/paraglide/messages.js';

const SERIES = [
  { key: 'ctl', color: tokens.chartFitness },
  { key: 'atl', color: tokens.chartFatigue },
  { key: 'tsb', color: tokens.chartForm },
] as const;

export const PerformanceChart = () => {
  const axis = useDashboardAxis();
  const filtered = axis.history;
  const latest = filtered[filtered.length - 1];
  const byDate = useMemo(() => indexByX(filtered, 'date'), [filtered]);

  const zoom = useChartZoom({
    data: filtered,
    xKey: 'date',
    onZoomComplete: axis.onZoomComplete,
  });
  const events = useDashboardChartEvents(zoom);

  return (
    <ChartRow
      title={m.ui_metrics_chart_title()}
      secondary={m.ui_metrics_chart_subtitle()}
      height="h-64"
      rail={
        <MultiSeriesRail
          group={DASHBOARD_HOVER_GROUP}
          restHeader={m.ui_rail_latest()}
          formatX={formatDashboardDate}
          isKnownX={(x) => byDate.has(x)}
          rows={SERIES.map((series) => ({
            key: series.key,
            name: METRIC_EXPLANATIONS[series.key].shortLabel ?? series.key.toUpperCase(),
            color: series.color,
            metricId: series.key,
            rest: { value: railInt(latest?.[series.key]) },
            readingAt: (x) => {
              const point = byDate.get(x);
              if (!point) return undefined;
              return { value: railInt(point[series.key]) };
            },
          }))}
        />
      }
    >
      {filtered.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={zoom.zoomedData} {...events}>
            <XAxis
              dataKey="date"
              ticks={[
                zoom.zoomedData[0]?.date,
                zoom.zoomedData[zoom.zoomedData.length - 1]?.date,
              ].filter((v): v is string => v != null)}
              tick={chartTheme.tick}
              tickLine={false}
              axisLine={chartTheme.axisLine}
              tickFormatter={formatDashboardDate}
            />
            <YAxis
              tick={chartTheme.tick}
              tickLine={false}
              axisLine={false}
              width={DASHBOARD_Y_AXIS_WIDTH}
              tickCount={3}
            />
            <RechartsTooltip {...hoverOnlyTooltip} />
            <Area
              type="monotone"
              dataKey="tsb"
              fill={tokens.chartForm}
              fillOpacity={0.1}
              stroke="none"
              tooltipType="none"
            />
            <Line
              type="monotone"
              dataKey="ctl"
              stroke={tokens.chartFitness}
              strokeWidth={2}
              dot={false}
              name={m.ui_chart_series_fitness()}
            />
            <Line
              type="monotone"
              dataKey="atl"
              stroke={tokens.chartFatigue}
              strokeWidth={2}
              dot={false}
              name={m.ui_chart_series_fatigue()}
            />
            <Line
              type="monotone"
              dataKey="tsb"
              stroke={tokens.chartForm}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              name={m.ui_chart_series_form()}
            />
            {zoom.refAreaLeft && zoom.refAreaRight && (
              <ReferenceArea
                x1={zoom.refAreaLeft}
                x2={zoom.refAreaRight}
                strokeOpacity={0.3}
                fill={tokens.accent}
                fillOpacity={0.15}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      ) : null}
    </ChartRow>
  );
};
