import { useEffect, useMemo } from 'react';
import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  ReferenceArea,
} from 'recharts';
import { useFilteredMetrics } from './hooks/useFilteredMetrics.ts';
import { ChartPreviewCard } from '@/components/ui/ChartPreviewCard.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { MetricLabel } from '@/components/ui/MetricLabel.tsx';
import { ListItem } from '@/components/ui/List.tsx';
import { Switch } from '@/components/ui/Switch.tsx';
import { useChartZoom } from '@/lib/hooks/useChartZoom.ts';
import { chartTheme, formatChartDate } from '@/lib/chartTheme.ts';
import { tokens } from '@/lib/tokens.ts';
import { METRIC_EXPLANATIONS } from '@/lib/explanations.ts';
import { rangeMap } from '@/lib/timeRange.ts';
import type { TimeRange } from '@/lib/timeRange.ts';
import { useDashboardChartZoom } from './hooks/useDashboardChartZoom.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { getMondayOfWeek, getMonthKey } from '@/lib/weekKey.ts';
import { CalendarDays, CalendarRange, Calendar } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { TabsTrigger } from '@/components/ui/Tabs.tsx';
import { m } from '@/paraglide/messages.js';
import type { Sport } from '@/packages/engine/types.ts';

type GroupBy = 'day' | 'week' | 'month';

const SPORTS: Sport[] = ['running', 'cycling'];

const sportColors: Record<Sport, string> = {
  running: tokens.sportRunning,
  cycling: tokens.sportCycling,
};

const sportNames: Record<Sport, () => string> = {
  running: m.ui_sport_running,
  cycling: m.ui_sport_cycling,
};

const groupByTabs: { key: GroupBy; label: () => string; icon: LucideIcon }[] = [
  { key: 'day', label: m.ui_group_day, icon: CalendarDays },
  { key: 'week', label: m.ui_group_week, icon: CalendarRange },
  { key: 'month', label: m.ui_group_month, icon: Calendar },
];

const dayLabels = [
  m.ui_day_mon,
  m.ui_day_tue,
  m.ui_day_wed,
  m.ui_day_thu,
  m.ui_day_fri,
  m.ui_day_sat,
  m.ui_day_sun,
];

export const LoadChart = () => {
  const metrics = useFilteredMetrics();
  const dashboardZoom = useDashboardChartZoom();
  const sportFilter = useFiltersStore((s) => s.sportFilter);

  const showSportColors = useFiltersStore((s) => s.loadChartShowSportColors);
  const isSportColorDisabled = sportFilter !== 'all';

  useEffect(() => {
    if (isSportColorDisabled) {
      useFiltersStore.getState().setLoadChartShowSportColors(false);
    }
  }, [isSportColorDisabled]);

  const chartData = useMemo(() => {
    let slice: typeof metrics.history;
    if (dashboardZoom.range === 'custom' && dashboardZoom.customRange) {
      const range = dashboardZoom.customRange;
      slice = metrics.history.filter((d) => d.date >= range.from && d.date <= range.to);
    } else {
      const days = rangeMap[dashboardZoom.range as Exclude<TimeRange, 'custom'>];
      slice = days === Infinity ? metrics.history : metrics.history.slice(-days);
    }

    return slice.map((d) => {
      const sportEntry = showSportColors ? (metrics.sportTss.get(d.date) ?? {}) : {};
      return {
        date: d.date,
        tss: d.tss,
        running: sportEntry.running ?? 0,
        cycling: sportEntry.cycling ?? 0,
      };
    });
  }, [
    metrics.history,
    metrics.sportTss,
    dashboardZoom.range,
    dashboardZoom.customRange,
    showSportColors,
  ]);

  const groupBy = useFiltersStore((s) => s.loadChartGroupBy);
  const isGroupingDisabled = dashboardZoom.range === '7d';

  useEffect(() => {
    if (isGroupingDisabled) {
      useFiltersStore.getState().setLoadChartGroupBy('day');
    }
  }, [isGroupingDisabled]);

  const groupedData = useMemo(() => {
    if (groupBy === 'day') return chartData;

    const buckets = new Map<string, { tss: number; running: number; cycling: number }>();
    for (const d of chartData) {
      const key = groupBy === 'week' ? getMondayOfWeek(d.date) : getMonthKey(d.date);
      const prev = buckets.get(key) ?? { tss: 0, running: 0, cycling: 0 };
      prev.tss += d.tss;
      prev.running += d.running;
      prev.cycling += d.cycling;
      buckets.set(key, prev);
    }

    return Array.from(buckets, ([date, { tss, running, cycling }]) => ({
      date,
      tss: parseFloat(tss.toFixed(1)),
      running: parseFloat(running.toFixed(1)),
      cycling: parseFloat(cycling.toFixed(1)),
    }));
  }, [chartData, groupBy]);

  const zoom = useChartZoom({
    data: groupedData,
    xKey: 'date',
    onZoomComplete: dashboardZoom.onZoomComplete,
    onZoomReset: dashboardZoom.onZoomReset,
  });

  const tickFormatter = (v: string) => {
    if (groupBy === 'month') {
      const d = new Date(v + '-01T00:00:00');
      return d.toLocaleString(undefined, { month: 'short' });
    }
    const d = new Date(v + 'T00:00:00');
    if (dashboardZoom.range === '7d') {
      const label = dayLabels[(d.getDay() + 6) % 7];
      if (label) return label();
    }
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <ChartPreviewCard
      title=""
      titleSlot={
        <div className="flex items-center gap-1 flex-1">
          <Typography variant="title" as="h3">
            {METRIC_EXPLANATIONS.tss.friendlyName}
          </Typography>
          <MetricLabel metricId="tss" size="sm" />
        </div>
      }
      subtitle={METRIC_EXPLANATIONS.tss.oneLiner}
      compactHeight="h-64"
      footer={
        <ListItem primary={m.ui_sport_color_title()} secondary={m.ui_sport_color_desc()}>
          <Switch
            checked={showSportColors}
            onCheckedChange={(checked) =>
              useFiltersStore.getState().setLoadChartShowSportColors(checked)
            }
            disabled={isSportColorDisabled}
          />
        </ListItem>
      }
    >
      {(mode) => {
        const compact = mode === 'compact';
        return groupedData.length > 0 ? (
          <TabsPrimitive.Root
            value={groupBy}
            onValueChange={(v) => useFiltersStore.getState().setLoadChartGroupBy(v as GroupBy)}
            className="h-full flex flex-col"
          >
            <TabsPrimitive.List className="inline-flex gap-1 mb-1">
              {groupByTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.key}
                    value={tab.key}
                    disabled={isGroupingDisabled && tab.key !== 'day'}
                    className="flex-none gap-1 rounded-lg px-2 py-1 text-xs"
                  >
                    <Icon size={12} />
                    {tab.label()}
                  </TabsTrigger>
                );
              })}
            </TabsPrimitive.List>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={zoom.zoomedData}
                  onMouseDown={zoom.onMouseDown}
                  onMouseMove={zoom.onMouseMove}
                  onMouseUp={zoom.onMouseUp}
                >
                  {!compact && (
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid.stroke} />
                  )}
                  <XAxis
                    dataKey="date"
                    ticks={
                      compact
                        ? [
                            zoom.zoomedData[0]?.date,
                            zoom.zoomedData[zoom.zoomedData.length - 1]?.date,
                          ].filter((v): v is string => v != null)
                        : undefined
                    }
                    tick={chartTheme.tick}
                    tickLine={false}
                    axisLine={chartTheme.axisLine}
                    tickFormatter={tickFormatter}
                  />
                  <YAxis
                    tick={chartTheme.tick}
                    tickLine={false}
                    axisLine={compact ? false : chartTheme.axisLine}
                    width={40}
                    tickCount={compact ? 3 : undefined}
                    tickFormatter={(v: number) => String(Math.round(v))}
                  />
                  <RechartsTooltip
                    contentStyle={chartTheme.tooltip.contentStyle}
                    labelStyle={chartTheme.tooltip.labelStyle}
                    isAnimationActive={chartTheme.tooltip.isAnimationActive}
                    separator={chartTheme.tooltip.separator}
                    labelFormatter={(v) => formatChartDate(String(v))}
                  />
                  {showSportColors ? (
                    SPORTS.map((sport) => (
                      <Area
                        key={sport}
                        type="step"
                        dataKey={sport}
                        stackId="sport"
                        fill={sportColors[sport]}
                        fillOpacity={1}
                        stroke="none"
                        dot={false}
                        name={sportNames[sport]()}
                      />
                    ))
                  ) : (
                    <Area
                      type="step"
                      dataKey="tss"
                      fill={tokens.chartLoad}
                      fillOpacity={1}
                      stroke="none"
                      dot={false}
                      name={m.ui_chart_series_tss()}
                    />
                  )}
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
            </div>
          </TabsPrimitive.Root>
        ) : null;
      }}
    </ChartPreviewCard>
  );
};
