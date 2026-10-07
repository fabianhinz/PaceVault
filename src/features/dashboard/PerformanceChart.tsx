import { useCallback, useEffect, useMemo } from 'react';
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
import { useFilteredMetrics } from './hooks/useFilteredMetrics.ts';
import { ChartRow } from '@/components/ui/ChartsCard.tsx';
import { MultiSeriesRail } from '@/components/charts/ChartRail.tsx';
import { useChartZoom } from '@/lib/hooks/useChartZoom.ts';
import { chartTheme } from '@/lib/chartTheme.ts';
import { hoverOnlyTooltip, indexByX } from '@/lib/chartHover.ts';
import { railInt } from '@/lib/railFormat.ts';
import { METRIC_EXPLANATIONS } from '@/lib/explanations.ts';
import { useChartHoverStore } from '@/store/chartHover.ts';
import { formatDashboardDate } from './dashboardDate.ts';
import { tokens } from '@/lib/tokens.ts';
import { rangeMap } from '@/lib/timeRange.ts';
import type { TimeRange } from '@/lib/timeRange.ts';
import { useDashboardChartZoom } from './hooks/useDashboardChartZoom.ts';
import { m } from '@/paraglide/messages.js';

const HOVER_GROUP = 'dashboard-performance';

const SERIES = [
  { key: 'ctl', color: tokens.chartFitness },
  { key: 'atl', color: tokens.chartFatigue },
  { key: 'tsb', color: tokens.chartForm },
] as const;

export const PerformanceChart = () => {
  const metrics = useFilteredMetrics();
  const dashboardZoom = useDashboardChartZoom();

  const filtered = useMemo(() => {
    if (dashboardZoom.range === 'custom' && dashboardZoom.customRange) {
      const range = dashboardZoom.customRange;
      return metrics.history.filter((d) => d.date >= range.from && d.date <= range.to);
    }
    const days = rangeMap[dashboardZoom.range as Exclude<TimeRange, 'custom'>];
    if (days === Infinity) return metrics.history;
    return metrics.history.slice(-days);
  }, [metrics.history, dashboardZoom.range, dashboardZoom.customRange]);

  const latest = filtered[filtered.length - 1];
  const byDate = useMemo(() => indexByX(filtered, 'date'), [filtered]);

  const onHover = useCallback((date: string | null) => {
    if (date == null) {
      useChartHoverStore.getState().clearChartHover(HOVER_GROUP);
      return;
    }
    useChartHoverStore.getState().setChartHover(HOVER_GROUP, date);
  }, []);

  useEffect(() => () => useChartHoverStore.getState().clearChartHover(HOVER_GROUP), []);

  const zoom = useChartZoom({
    data: filtered,
    xKey: 'date',
    onZoomComplete: dashboardZoom.onZoomComplete,
  });

  return (
    <ChartRow
      title={m.ui_metrics_chart_title()}
      secondary={m.ui_metrics_chart_subtitle()}
      height="h-64"
      rail={
        <MultiSeriesRail
          group={HOVER_GROUP}
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
          <ComposedChart
            data={zoom.zoomedData}
            onMouseDown={zoom.onMouseDown}
            onMouseMove={(e) => {
              zoom.onMouseMove(e);
              if (e.activeLabel != null) onHover(String(e.activeLabel));
            }}
            onMouseUp={zoom.onMouseUp}
            onMouseLeave={() => onHover(null)}
            onTouchMove={(e) => {
              if (e.activeLabel != null) onHover(String(e.activeLabel));
            }}
            onTouchEnd={() => onHover(null)}
          >
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
              width={40}
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
