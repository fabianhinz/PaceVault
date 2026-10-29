import { useMemo, type FC } from 'react';
import { Mountain, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PvChartRow } from '@pacevault/ui/components/pvChartsCard/PvChartRow.tsx';
import { PvChartsCard } from '@pacevault/ui/components/pvChartsCard/PvChartsCard.tsx';
import { PvZoomResetPill } from '@pacevault/ui/components/pvChartsCard/PvZoomResetPill.tsx';
import { ElevationChart } from '@/components/charts/ElevationChart.tsx';
import { GradeChart } from '@/components/charts/GradeChart.tsx';
import type { RouteElevationStats } from '@pacevault/gpx/routeGeometry.ts';
import type { RoutePoint } from '@pacevault/gpx/types.ts';
import type { ChartHoverX } from '@/store/chartHover.ts';
import { summarizeValues } from '@/components/charts/seriesSummary.ts';
import { railGain, railInt, railLoss, railSigned1 } from '@/components/charts/railFormat.ts';
import type { MetricId } from '@/components/metricLabel/explanations.ts';
import { SeriesRail } from '@/components/charts/SeriesRail.tsx';
import { routeDistanceXAxis } from '@/lib/colors/chartTheme.ts';
import { useSyncedChartZoom } from '@/components/charts/hooks/useSyncedChartZoom.ts';
import { tokens, type TokenColor } from '@pacevault/ui/lib/tokens.ts';
import { m } from '@pacevault/i18n/messages.js';
import { MetricLabel } from '@/components/metricLabel/index.tsx';
import { HOVER_GROUP } from '@/components/studio/types.ts';
import { useRouteChartRows } from '@/components/studio/hooks/useRouteChartRows.ts';
import { useRouteChartHover } from '@/components/studio/hooks/useRouteChartHover.ts';

interface ChartEntry {
  key: string;
  title: string;
  icon: LucideIcon;
  color: TokenColor;
  dataPresent: boolean;
  metricId?: MetricId;
  rail: React.ReactNode;
  chart: React.ReactNode;
}

const formatHoverDist = (x: ChartHoverX) => routeDistanceXAxis.tickFormatter(Number(x));

interface RouteChartsExplorerProps {
  points: RoutePoint[];
  elevation: RouteElevationStats | undefined;
}

export const RouteChartsExplorer: FC<RouteChartsExplorerProps> = (props) => {
  const zoom = useSyncedChartZoom();
  const chartRows = useRouteChartRows({ points: props.points, zoomRange: zoom.zoomRange });
  const onHover = useRouteChartHover(chartRows.gpsLookup);
  const gradeSummary = useMemo(
    () => summarizeValues(chartRows.profile.grade.map((p) => p.grade)),
    [chartRows.profile.grade],
  );
  const elevation = props.elevation;

  const charts: ChartEntry[] = [
    {
      key: 'elevation',
      title: m.ui_stat_elevation(),
      icon: Mountain,
      color: tokens.chartElevation,
      metricId: 'elevation',
      dataPresent: chartRows.profile.elevation.length > 1,
      rail: (
        <SeriesRail
          group={HOVER_GROUP}
          unit="m"
          formatX={formatHoverDist}
          rest={{
            header: '',
            value: railGain(elevation?.gain),
            secondary: `${railLoss(elevation?.loss)} m`,
          }}
          readingAt={(x) => {
            const point = chartRows.byDist.get(x);
            if (!point) return undefined;
            return {
              value: railInt(point.elevation),
              secondary: `${railGain(elevation?.gain)} m`,
            };
          }}
        />
      ),
      chart: (
        <ElevationChart
          data={chartRows.compactRows}
          xAxis={routeDistanceXAxis}
          onActiveXChange={onHover}
          onZoomComplete={zoom.onZoomComplete}
        />
      ),
    },
    {
      key: 'grade',
      title: m.ui_chart_title_grade(),
      icon: TrendingUp,
      color: tokens.chartGrade,
      dataPresent: chartRows.profile.grade.filter((p) => p.grade !== undefined).length > 1,
      rail: (
        <SeriesRail
          group={HOVER_GROUP}
          unit="%"
          formatX={formatHoverDist}
          rest={{
            header: m.ui_rail_max(),
            value: railSigned1(elevation?.maxGrade),
            secondary: `${m.ui_rail_min()} ${railSigned1(gradeSummary.min)}`,
          }}
          readingAt={(x) => {
            const point = chartRows.byDist.get(x);
            if (!point) return undefined;
            return {
              value: railSigned1(point.grade),
              secondary: `${m.ui_rail_max()} ${railSigned1(elevation?.maxGrade)}`,
            };
          }}
        />
      ),
      chart: (
        <GradeChart
          data={chartRows.compactRows}
          xAxis={routeDistanceXAxis}
          onActiveXChange={onHover}
          onZoomComplete={zoom.onZoomComplete}
        />
      ),
    },
  ];

  const visibleCharts = charts.filter((c) => c.dataPresent);

  if (visibleCharts.length === 0) return null;

  return (
    <PvChartsCard
      zoomReset={
        <PvZoomResetPill
          label={m.ui_chart_reset_zoom()}
          zoomed={zoom.zoomed}
          onReset={zoom.resetZoom}
        />
      }
    >
      {visibleCharts.map((chart) => (
        <PvChartRow
          key={chart.key}
          title={chart.title}
          icon={chart.icon}
          color={chart.color}
          info={
            chart.metricId !== undefined ? (
              <MetricLabel metricId={chart.metricId} size="sm" iconOnly />
            ) : undefined
          }
          rail={chart.rail}
        >
          {chart.chart}
        </PvChartRow>
      ))}
    </PvChartsCard>
  );
};
