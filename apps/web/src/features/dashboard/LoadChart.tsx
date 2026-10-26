import type { FC } from 'react';
import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  ReferenceArea,
} from 'recharts';
import { PvChartRow } from '@pacevault/ui/components/pvChartsCard/PvChartRow.tsx';
import { useChartZoom } from '@/lib/hooks/useChartZoom.ts';
import { chartTheme } from '@/lib/chartTheme.ts';
import { hoverOnlyTooltip } from '@/lib/chartHover.ts';
import { railInt } from '@/lib/railFormat.ts';
import { MultiSeriesRail } from '@/components/charts/MultiSeriesRail.tsx';
import { formatDashboardDate } from './dashboardDate.ts';
import { tokens } from '@pacevault/ui/lib/tokens.ts';
import { METRIC_EXPLANATIONS } from '@/lib/explanations.ts';
import { useDashboardAxis } from './hooks/useDashboardAxis.ts';
import { useDashboardSports } from './hooks/useDashboardSports.ts';
import { useLoadChartData } from './hooks/useLoadChartData.ts';
import { LoadBucketBand } from './LoadBucketBand.tsx';
import { sportColors } from './types.ts';
import { DASHBOARD_Y_AXIS_WIDTH } from '@/lib/dashboardVolume.ts';
import { DASHBOARD_HOVER_GROUP, useDashboardChartEvents } from './hooks/useDashboardChartEvents.ts';
import { useFiltersStore } from '@/store/filters.ts';
import type { LoadGroupBy } from '@/lib/loadAxis.ts';
import { CalendarDays, CalendarRange, Calendar } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PvTabs } from '@pacevault/ui/components/pvTabs/PvTabs.tsx';
import { PvTabsList } from '@pacevault/ui/components/pvTabs/PvTabsList.tsx';
import { PvTabsTrigger } from '@pacevault/ui/components/pvTabs/PvTabsTrigger.tsx';
import { m } from '@pacevault/i18n/messages.js';
import { MetricLabel } from '@/components/MetricLabel.tsx';
import { LABEL_BY_SPORT } from '@/microcopy/sports.ts';

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

export const LoadChart: FC = () => {
  const axis = useDashboardAxis();
  const sports = useDashboardSports();
  const loadChart = useLoadChartData(axis);

  const zoom = useChartZoom({
    data: loadChart.load.rows,
    xKey: 'date',
    onZoomComplete: loadChart.onZoomComplete,
  });
  const events = useDashboardChartEvents(zoom);

  const tickFormatter = (v: string) => {
    if (loadChart.groupingDisabled) {
      const d = new Date(v + 'T00:00:00');
      const label = dayLabels[(d.getDay() + 6) % 7];
      if (label) return label();
    }
    return formatDashboardDate(v);
  };

  const dataPresent = loadChart.load.rows.length > 0;

  return (
    <PvChartRow
      title={METRIC_EXPLANATIONS.tss.friendlyName}
      info={<MetricLabel metricId="tss" size="sm" iconOnly />}
      secondary={METRIC_EXPLANATIONS.tss.oneLiner}
      height="h-64"
      rail={
        dataPresent ? (
          <MultiSeriesRail
            group={DASHBOARD_HOVER_GROUP}
            restHeader={m.ui_rail_total()}
            formatX={(x) => formatDashboardDate(loadChart.bucketAt(x)?.key ?? String(x))}
            isKnownX={(x) => loadChart.bucketAt(x) !== undefined}
            rows={sports.map((sport) => ({
              key: sport,
              name: LABEL_BY_SPORT[sport](),
              color: sportColors[sport],
              rest: { value: railInt(loadChart.sportTotals[sport]) },
              readingAt: (x) => {
                const bucket = loadChart.bucketAt(x);
                if (!bucket) return undefined;
                return { value: railInt(bucket[sport]) };
              },
            }))}
          />
        ) : undefined
      }
    >
      {dataPresent ? (
        <PvTabs
          value={loadChart.groupBy}
          onValueChange={(v) => useFiltersStore.getState().setLoadChartGroupBy(v as LoadGroupBy)}
          className="h-full"
        >
          <PvTabsList variant="inline">
            {groupByTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <PvTabsTrigger
                  key={tab.key}
                  value={tab.key}
                  disabled={loadChart.groupingDisabled && tab.key !== 'day'}
                  className="flex-none gap-1 rounded-lg px-2 py-1 text-xs"
                >
                  <Icon size={12} />
                  {tab.label()}
                </PvTabsTrigger>
              );
            })}
          </PvTabsList>
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
                  width={DASHBOARD_Y_AXIS_WIDTH}
                  tickCount={3}
                  tickFormatter={(v: number) => String(Math.round(v))}
                />
                <RechartsTooltip {...hoverOnlyTooltip} />
                <LoadBucketBand
                  dates={zoom.zoomedData.map((row) => row.date)}
                  buckets={loadChart.load.buckets}
                  groupBy={loadChart.groupBy}
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
                    name={LABEL_BY_SPORT[sport]()}
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
        </PvTabs>
      ) : null}
    </PvChartRow>
  );
};
