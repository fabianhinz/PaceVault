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
  cumulativeVolume,
  formatVolume,
  formatVolumeTick,
  isVolumeIncomplete,
  previousVolumeWindow,
  shiftDayKey,
  toVolumeDisplay,
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

interface VolumeRow {
  date: string;
  current: number | null;
  before: number | null;
  running: number | null;
  cycling: number | null;
}

const NO_ROWS: VolumeRow[] = [];

interface VolumeSeries {
  rows: VolumeRow[];
  current: VolumeTotal[];
  before: VolumeTotal[];
  indexByDate: Map<ChartHoverX, number>;
}

const sessionCount = (count: number) => {
  if (count === 1) return m.ui_count_sessions_one();
  return m.ui_count_sessions_other({ count: String(count) });
};

const subtitle = (count: number) => {
  if (count === 1) return m.ui_volume_subtitle_one();
  return m.ui_volume_subtitle_other({ count: String(count) });
};

const VolumeCoverageNote = (props: { series: VolumeSeries }) => {
  const x = useChartHoverX(DASHBOARD_HOVER_GROUP);
  let index = props.series.rows.length - 1;
  if (x !== null) {
    index = props.series.indexByDate.get(x) ?? index;
  }
  const entries = [
    { label: m.ui_volume_this_range(), total: props.series.current[index] },
    { label: m.ui_volume_before(), total: props.series.before[index] },
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
  if (notes.length === 0) return null;
  return (
    <Typography
      variant="caption"
      as="p"
      color="textTertiary"
      data-testid="volume-coverage-note"
      className="mt-1 line-clamp-2 leading-4"
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
  const days = axis.days;

  const sports = useMemo(() => {
    if (sportFilter === null) return [...SPORTS];
    return [sportFilter];
  }, [sportFilter]);

  const series = useMemo((): VolumeSeries | null => {
    if (days === null) return null;
    const through = axis.history.map((d) => d.date);
    const previous = previousVolumeWindow(days.from, days.count);
    const current = cumulativeVolume(axis.sessions, metric, days.from, through);
    const before = cumulativeVolume(
      axis.sessions,
      metric,
      previous.from,
      through.map((day) => shiftDayKey(day, -days.count)),
    );
    const bySport = new Map(
      SPORTS.map((sport) => [
        sport,
        cumulativeVolume(
          axis.sessions.filter((s) => s.sport === sport),
          metric,
          days.from,
          through,
        ),
      ]),
    );
    const display = (total: VolumeTotal | undefined) => {
      if (total === undefined || total.value === undefined) return null;
      return toVolumeDisplay(metric, total.value);
    };
    const rows = through.map(
      (date, i): VolumeRow => ({
        date,
        current: display(current[i]),
        before: display(before[i]),
        running: display(bySport.get('running')?.[i]),
        cycling: display(bySport.get('cycling')?.[i]),
      }),
    );
    return {
      rows,
      current,
      before,
      indexByDate: new Map(through.map((date, i) => [date, i])),
    };
  }, [axis.history, axis.sessions, days, metric]);

  const zoom = useChartZoom({
    data: series?.rows ?? NO_ROWS,
    xKey: 'date',
    onZoomComplete: axis.onZoomComplete,
  });
  const events = useDashboardChartEvents(zoom);

  if (days === null || series === null) return null;

  let lineColor: string = tokens.textPrimary;
  if (sportFilter !== null) {
    lineColor = sportColors[sportFilter];
  }
  const unit = volumeUnit(metric);
  const last = series.rows.length - 1;
  const hasData = series.rows.length > 0;

  const railRow = (key: 'current' | 'before', name: string, color: string) => ({
    key,
    name,
    color,
    unit,
    rest: {
      value: formatVolume(metric, series[key][last]?.value),
      secondary: sessionCount(series[key][last]?.sessions ?? 0),
    },
    readingAt: (x: ChartHoverX) => {
      const index = series.indexByDate.get(x);
      if (index === undefined) return undefined;
      const total = series[key][index];
      if (total === undefined) return undefined;
      return { value: formatVolume(metric, total.value), secondary: sessionCount(total.sessions) };
    },
  });

  return (
    <ChartRow
      title={m.ui_volume_title()}
      secondary={subtitle(days.count)}
      height="h-64"
      rail={
        hasData ? (
          <MultiSeriesRail
            group={DASHBOARD_HOVER_GROUP}
            restHeader={m.ui_rail_total()}
            formatX={formatDashboardDate}
            isKnownX={(x) => series.indexByDate.has(x)}
            rows={[
              railRow('current', m.ui_volume_this_range(), lineColor),
              railRow('before', m.ui_volume_before(), tokens.textTertiary),
            ]}
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
                  width={40}
                  tickCount={3}
                  domain={[0, 'auto']}
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
                <Line
                  type="linear"
                  dataKey="before"
                  stroke={tokens.textTertiary}
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  dot={false}
                  name={m.ui_volume_before()}
                />
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
          <div className="mt-1.5 flex gap-3 text-xs text-text-tertiary">
            <LegendLine color={lineColor} label={m.ui_volume_this_range()} />
            <LegendLine color={tokens.textTertiary} dashed label={m.ui_volume_before()} />
          </div>
          <VolumeCoverageNote series={series} />
        </TabsPrimitive.Root>
      ) : null}
    </ChartRow>
  );
};
