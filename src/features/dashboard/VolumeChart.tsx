import { useMemo } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  ReferenceArea,
} from 'recharts';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { ChartRow } from '@/components/ui/ChartsCard.tsx';
import { TabsTrigger } from '@/components/ui/Tabs.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { MultiSeriesRail } from '@/components/charts/ChartRail.tsx';
import { useChartZoom } from '@/lib/hooks/useChartZoom.ts';
import { chartTheme } from '@/lib/chartTheme.ts';
import { hoverOnlyTooltip } from '@/lib/chartHover.ts';
import { tokens } from '@/lib/tokens.ts';
import {
  VOLUME_METRICS,
  formatVolume,
  formatVolumeTick,
  isVolumeIncomplete,
  volumeYAxisWidth,
  volumeUnit,
  type VolumeMetric,
  type VolumeTotal,
} from '@/lib/dashboardVolume.ts';
import { useChartHoverX, type ChartHoverX } from '@/store/chartHover.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { SPORTS, type Sport } from '@/packages/engine/types.ts';
import { m } from '@/paraglide/messages.js';
import { formatDashboardDate } from './dashboardDate.ts';
import { useDashboardAxis } from './hooks/useDashboardAxis.ts';
import { type VolumeSeries, useVolumeSeries } from './hooks/useVolumeSeries.ts';
import { DASHBOARD_HOVER_GROUP, useDashboardChartEvents } from './hooks/useDashboardChartEvents.ts';

const sportColors: Record<Sport, string> = {
  running: tokens.sportRunning,
  cycling: tokens.sportCycling,
};

const metricLabels: Record<VolumeMetric, () => string> = {
  distance: m.ui_volume_distance,
  duration: m.ui_volume_duration,
  elevation: m.ui_volume_elevation,
};

const sessionCount = (count: number) => {
  if (count === 1) return m.ui_count_sessions_one();
  return m.ui_count_sessions_other({ count: String(count) });
};

const VolumeCoverageNote = (props: { series: VolumeSeries }) => {
  const x = useChartHoverX(DASHBOARD_HOVER_GROUP);
  let index = props.series.rows.length - 1;
  if (x !== null) {
    index = props.series.indexByDate.get(x) ?? index;
  }
  const entries = [
    { label: m.ui_volume_this_range(), total: props.series.current[index] },
    { label: m.ui_volume_before(), total: props.series.before?.[index] },
  ];
  const notes = entries.flatMap((entry) => {
    if (entry.total === undefined || !isVolumeIncomplete(entry.total)) return [];
    return [
      m.ui_volume_from_of({
        label: entry.label,
        recorded: String(entry.total.recorded),
        count: String(entry.total.sessions),
      }),
    ];
  });
  return (
    <Typography
      variant="caption"
      as="p"
      color="textTertiary"
      data-testid="volume-coverage-note"
      className="mt-1 h-8 shrink-0 line-clamp-2 leading-4 lg:h-4 lg:line-clamp-1"
    >
      {notes.join(' · ')}
    </Typography>
  );
};

const LegendLine = (props: { color: string; dashed?: boolean; label: string }) => (
  <span className="inline-flex items-center gap-1.5">
    <span
      className="w-3.5 border-t-2"
      style={{ borderColor: props.color, borderTopStyle: props.dashed ? 'dashed' : 'solid' }}
    />
    {props.label}
  </span>
);

export const VolumeChart = () => {
  const axis = useDashboardAxis();
  const metric = useFiltersStore((s) => s.volumeChartMetric);
  const sportFilter = useFiltersStore((s) => s.activeFilter?.sport ?? null);

  const sports = useMemo(() => {
    if (sportFilter === null) return [...SPORTS];
    return [sportFilter];
  }, [sportFilter]);

  const series = useVolumeSeries(axis);

  const zoom = useChartZoom({
    data: series.rows,
    xKey: 'date',
    onZoomComplete: axis.onZoomComplete,
  });
  const events = useDashboardChartEvents(zoom);

  let lineColor: string = tokens.textPrimary;
  if (sportFilter !== null) {
    lineColor = sportColors[sportFilter];
  }
  const unit = volumeUnit(metric);
  const last = series.rows.length - 1;
  const hasData = series.rows.length > 0;

  const railRow = (key: string, totals: VolumeTotal[], name: string, color: string) => ({
    key,
    name,
    color,
    unit,
    rest: {
      value: formatVolume(metric, totals[last]?.value),
      secondary: sessionCount(totals[last]?.sessions ?? 0),
    },
    readingAt: (x: ChartHoverX) => {
      const index = series.indexByDate.get(x);
      if (index === undefined) return undefined;
      const total = totals[index];
      if (total === undefined) return undefined;
      return { value: formatVolume(metric, total.value), secondary: sessionCount(total.sessions) };
    },
  });
  const railRows = [railRow('current', series.current, m.ui_volume_this_range(), lineColor)];
  if (series.before !== null) {
    railRows.push(railRow('before', series.before, m.ui_volume_before(), tokens.textTertiary));
  }

  return (
    <ChartRow
      title={m.ui_volume_title()}
      secondary={m.ui_volume_subtitle()}
      height="h-64"
      rail={
        hasData ? (
          <MultiSeriesRail
            group={DASHBOARD_HOVER_GROUP}
            restHeader={m.ui_rail_total()}
            formatX={formatDashboardDate}
            isKnownX={(x) => series.indexByDate.has(x)}
            rows={railRows}
          />
        ) : undefined
      }
    >
      {hasData ? (
        <TabsPrimitive.Root
          value={metric}
          onValueChange={(v) => useFiltersStore.getState().setVolumeChartMetric(v as VolumeMetric)}
          className="h-full flex flex-col"
        >
          <TabsPrimitive.List className="inline-flex gap-1 mb-1">
            {VOLUME_METRICS.map((key) => (
              <TabsTrigger key={key} value={key} className="flex-none rounded-lg px-2 py-1 text-xs">
                {metricLabels[key]()}
              </TabsTrigger>
            ))}
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
                  tickFormatter={formatDashboardDate}
                />
                <YAxis
                  tick={chartTheme.tick}
                  tickLine={false}
                  axisLine={false}
                  width={volumeYAxisWidth(series.ticks)}
                  tickCount={3}
                  ticks={series.ticks}
                  domain={[0, series.ticks?.[series.ticks.length - 1] ?? 'auto']}
                  tickFormatter={formatVolumeTick}
                />
                <RechartsTooltip {...hoverOnlyTooltip} />
                {sports.map((sport) => (
                  <Area
                    key={sport}
                    type="linear"
                    dataKey={sport}
                    stackId="sport"
                    fill={sportColors[sport]}
                    fillOpacity={0.28}
                    stroke="none"
                    dot={false}
                    tooltipType="none"
                  />
                ))}
                {series.before !== null && (
                  <Line
                    type="linear"
                    dataKey="before"
                    stroke={tokens.textTertiary}
                    strokeWidth={1.5}
                    strokeDasharray="5 4"
                    dot={false}
                    name={m.ui_volume_before()}
                  />
                )}
                <Line
                  type="linear"
                  dataKey="current"
                  stroke={lineColor}
                  strokeWidth={2}
                  dot={false}
                  name={m.ui_volume_this_range()}
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
          </div>
          {series.before !== null && (
            <div className="mt-1.5 flex gap-3 text-xs text-text-tertiary">
              <LegendLine color={lineColor} label={m.ui_volume_this_range()} />
              <LegendLine
                color={tokens.textTertiary}
                dashed
                label={[m.ui_volume_before(), series.beforeLabel]
                  .filter((part) => part !== null)
                  .join(' · ')}
              />
            </div>
          )}
          <VolumeCoverageNote series={series} />
        </TabsPrimitive.Root>
      ) : null}
    </ChartRow>
  );
};
