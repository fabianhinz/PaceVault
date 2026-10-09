import { useCallback, useEffect, useMemo } from 'react';
import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  ReferenceArea,
} from 'recharts';
import { ChartRow } from '@/components/ui/ChartsCard.tsx';
import { useChartZoom } from '@/lib/hooks/useChartZoom.ts';
import { chartTheme } from '@/lib/chartTheme.ts';
import { hoverOnlyTooltip } from '@/lib/chartHover.ts';
import { railInt } from '@/lib/railFormat.ts';
import { useChartHoverX } from '@/store/chartHover.ts';
import { MultiSeriesRail } from '@/components/charts/ChartRail.tsx';
import { formatDashboardDate } from './dashboardDate.ts';
import { tokens } from '@/lib/tokens.ts';
import { METRIC_EXPLANATIONS } from '@/lib/explanations.ts';
import { useDashboardAxis } from './hooks/useDashboardAxis.ts';
import { useDashboardYAxisWidth } from './hooks/useDashboardYAxisWidth.ts';
import { DASHBOARD_HOVER_GROUP, useDashboardChartEvents } from './hooks/useDashboardChartEvents.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { loadBucketDayRange } from '@/lib/weekKey.ts';
import { buildLoadAxis, loadBucketKey, type LoadBucket, type LoadGroupBy } from '@/lib/loadAxis.ts';
import { CalendarDays, CalendarRange, Calendar } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { TabsTrigger } from '@/components/ui/Tabs.tsx';
import { m } from '@/paraglide/messages.js';
import { SPORTS, type Sport } from '@/packages/engine/types.ts';

const sportColors: Record<Sport, string> = {
  running: tokens.sportRunning,
  cycling: tokens.sportCycling,
};

const sportNames: Record<Sport, () => string> = {
  running: m.ui_sport_running,
  cycling: m.ui_sport_cycling,
};

const groupByTabs: { key: LoadGroupBy; label: () => string; icon: LucideIcon }[] = [
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

interface BandShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

const LoadBucketBand = (props: {
  dates: string[];
  buckets: Map<string, LoadBucket>;
  groupBy: LoadGroupBy;
}) => {
  const x = useChartHoverX(DASHBOARD_HOVER_GROUP);
  if (x === null) return null;
  const bucket = props.buckets.get(loadBucketKey(String(x), props.groupBy));
  if (!bucket) return null;
  const first = props.dates.indexOf(bucket.from);
  const last = props.dates.indexOf(bucket.to);
  if (first < 0 || last < 0) return null;
  const start = Math.max(first - 1, 0);
  const end = Math.min(last + 1, props.dates.length - 1);
  const steps = end - start;
  if (steps === 0) return null;
  return (
    <ReferenceArea
      x1={props.dates[start]}
      x2={props.dates[end]}
      ifOverflow="visible"
      shape={(shape: BandShapeProps) => {
        if (shape.x === undefined || shape.y === undefined) return <g />;
        if (shape.width === undefined || shape.height === undefined) return <g />;
        const half = shape.width / steps / 2;
        const left = start < first ? half : 0;
        const right = end > last ? half : 0;
        return (
          <rect
            x={shape.x + left}
            y={shape.y}
            width={Math.max(0, shape.width - left - right)}
            height={shape.height}
            fill="#fff"
            fillOpacity={0.1}
          />
        );
      }}
    />
  );
};

export const LoadChart = () => {
  const axis = useDashboardAxis();
  const yAxisWidth = useDashboardYAxisWidth(axis);
  const sportFilter = useFiltersStore((s) => s.activeFilter?.sport ?? null);
  const groupBy = useFiltersStore((s) => s.loadChartGroupBy);
  const isGroupingDisabled = axis.days !== null && axis.days.count <= 7;

  useEffect(() => {
    if (isGroupingDisabled) {
      useFiltersStore.getState().setLoadChartGroupBy('day');
    }
  }, [isGroupingDisabled]);

  const sports = useMemo(() => {
    if (sportFilter === null) return [...SPORTS];
    return [sportFilter];
  }, [sportFilter]);

  const load = useMemo(
    () => buildLoadAxis(axis.history, axis.sportTss, groupBy),
    [axis.history, axis.sportTss, groupBy],
  );

  const sportTotals = useMemo(() => {
    const totals: Record<Sport, number> = { running: 0, cycling: 0 };
    for (const bucket of load.buckets.values()) {
      for (const sport of SPORTS) {
        totals[sport] += bucket[sport];
      }
    }
    return totals;
  }, [load.buckets]);

  const bucketAt = (x: string | number) => load.buckets.get(loadBucketKey(String(x), groupBy));

  const zoomToBuckets = axis.onZoomComplete;
  const onZoomComplete = useCallback(
    (from: string | number, to: string | number) => {
      const first = loadBucketDayRange(loadBucketKey(String(from), groupBy), groupBy);
      const last = loadBucketDayRange(loadBucketKey(String(to), groupBy), groupBy);
      zoomToBuckets(first.from, last.to);
    },
    [groupBy, zoomToBuckets],
  );

  const zoom = useChartZoom({ data: load.rows, xKey: 'date', onZoomComplete });
  const events = useDashboardChartEvents(zoom);

  const tickFormatter = (v: string) => {
    if (isGroupingDisabled) {
      const d = new Date(v + 'T00:00:00');
      const label = dayLabels[(d.getDay() + 6) % 7];
      if (label) return label();
    }
    return formatDashboardDate(v);
  };

  const hasData = load.rows.length > 0;

  return (
    <ChartRow
      title={METRIC_EXPLANATIONS.tss.friendlyName}
      metricId="tss"
      secondary={METRIC_EXPLANATIONS.tss.oneLiner}
      height="h-64"
      rail={
        hasData ? (
          <MultiSeriesRail
            group={DASHBOARD_HOVER_GROUP}
            restHeader={m.ui_rail_total()}
            formatX={(x) => formatDashboardDate(bucketAt(x)?.key ?? String(x))}
            isKnownX={(x) => bucketAt(x) !== undefined}
            rows={sports.map((sport) => ({
              key: sport,
              name: sportNames[sport](),
              color: sportColors[sport],
              rest: { value: railInt(sportTotals[sport]) },
              readingAt: (x) => {
                const bucket = bucketAt(x);
                if (!bucket) return undefined;
                return { value: railInt(bucket[sport]) };
              },
            }))}
          />
        ) : undefined
      }
    >
      {hasData ? (
        <TabsPrimitive.Root
          value={groupBy}
          onValueChange={(v) => useFiltersStore.getState().setLoadChartGroupBy(v as LoadGroupBy)}
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
                  tickFormatter={tickFormatter}
                />
                <YAxis
                  tick={chartTheme.tick}
                  tickLine={false}
                  axisLine={false}
                  width={yAxisWidth}
                  tickCount={3}
                  tickFormatter={(v: number) => String(Math.round(v))}
                />
                <RechartsTooltip {...hoverOnlyTooltip} />
                <LoadBucketBand
                  dates={zoom.zoomedData.map((row) => row.date)}
                  buckets={load.buckets}
                  groupBy={groupBy}
                />
                {sports.map((sport) => (
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
                ))}
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
      ) : null}
    </ChartRow>
  );
};
