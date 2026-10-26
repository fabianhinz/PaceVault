import type { FC } from 'react';
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
import { PvChartRow } from '@pacevault/ui/components/pvChartsCard/PvChartRow.tsx';
import { PvTabs } from '@pacevault/ui/components/pvTabs/PvTabs.tsx';
import { PvTabsList } from '@pacevault/ui/components/pvTabs/PvTabsList.tsx';
import { PvTabsTrigger } from '@pacevault/ui/components/pvTabs/PvTabsTrigger.tsx';
import { MultiSeriesRail } from '@/components/charts/MultiSeriesRail.tsx';
import { useChartZoom } from '@/lib/hooks/useChartZoom.ts';
import { chartTheme } from '@/lib/chartTheme.ts';
import { hoverOnlyTooltip } from '@/lib/chartHover.ts';
import { tokens } from '@pacevault/ui/lib/tokens.ts';
import {
  VOLUME_METRICS,
  formatVolumeTick,
  DASHBOARD_Y_AXIS_WIDTH,
  type VolumeMetric,
} from '@/lib/dashboardVolume.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { m } from '@pacevault/i18n/messages.js';
import { formatDashboardDate } from './dashboardDate.ts';
import { useDashboardAxis } from './hooks/useDashboardAxis.ts';
import { useVolumeSeries } from './hooks/useVolumeSeries.ts';
import { useDashboardSports } from './hooks/useDashboardSports.ts';
import { useVolumeChartRails } from './hooks/useVolumeChartRails.ts';
import { LegendLine } from './LegendLine.tsx';
import { sportColors } from './types.ts';
import { DASHBOARD_HOVER_GROUP, useDashboardChartEvents } from './hooks/useDashboardChartEvents.ts';
import { LABEL_BY_VOLUME_METRIC } from '@/microcopy/volume.ts';

export const VolumeChart: FC = () => {
  const axis = useDashboardAxis();
  const metric = useFiltersStore((s) => s.volumeChartMetric);
  const sports = useDashboardSports();
  const series = useVolumeSeries(axis);
  const zoom = useChartZoom({
    data: series.rows,
    xKey: 'date',
    onZoomComplete: axis.onZoomComplete,
  });
  const events = useDashboardChartEvents(zoom);
  const rails = useVolumeChartRails({ series, metric });
  const dataPresent = series.rows.length > 0;

  return (
    <PvChartRow
      title={m.ui_volume_title()}
      secondary={m.ui_volume_subtitle()}
      height="h-64"
      rail={
        dataPresent ? (
          <MultiSeriesRail
            group={DASHBOARD_HOVER_GROUP}
            restHeader={m.ui_rail_total()}
            formatX={formatDashboardDate}
            isKnownX={(x) => series.indexByDate.has(x)}
            rows={rails.railRows}
          />
        ) : undefined
      }
    >
      {dataPresent ? (
        <PvTabs
          value={metric}
          onValueChange={(v) => useFiltersStore.getState().setVolumeChartMetric(v as VolumeMetric)}
          className="h-full"
        >
          <PvTabsList variant="inline">
            {VOLUME_METRICS.map((key) => (
              <PvTabsTrigger
                key={key}
                value={key}
                className="flex-none rounded-lg px-2 py-1 text-xs"
              >
                {LABEL_BY_VOLUME_METRIC[key]()}
              </PvTabsTrigger>
            ))}
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
                  tickFormatter={formatDashboardDate}
                />
                <YAxis
                  tick={chartTheme.tick}
                  tickLine={false}
                  axisLine={false}
                  width={DASHBOARD_Y_AXIS_WIDTH}
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
                  stroke={rails.lineColor}
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
              <LegendLine color={rails.lineColor} label={m.ui_volume_this_range()} />
              <LegendLine
                color={tokens.textTertiary}
                dashed
                label={[m.ui_volume_before(), series.beforeLabel]
                  .filter((part) => part !== null)
                  .join(' · ')}
              />
            </div>
          )}
        </PvTabs>
      ) : null}
    </PvChartRow>
  );
};
