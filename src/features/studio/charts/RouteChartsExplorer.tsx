import { useCallback, useEffect, useMemo } from 'react';
import { Mountain, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ChartRow, ChartsCard } from '@/components/ui/ChartsCard.tsx';
import { ZoomResetButton } from '@/components/ui/ZoomResetButton.tsx';
import { ElevationChart } from '@/components/charts/ElevationChart.tsx';
import { GradeChart } from '@/components/charts/GradeChart.tsx';
import { buildRouteProfile } from '@/packages/gpx/routeProfile.ts';
import type { RouteElevationStats, RoutePoint } from '@/packages/gpx/routeGeometry.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useChartHoverStore, type ChartHoverX } from '@/store/chartHover.ts';
import { indexByX } from '@/lib/chartHover.ts';
import { summarizeValues } from '@/lib/seriesSummary.ts';
import { railGain, railInt, railLoss, railSigned1 } from '@/lib/railFormat.ts';
import type { MetricId } from '@/lib/explanations.ts';
import { SeriesRail } from '@/components/charts/ChartRail.tsx';
import { buildRouteChartRows, gpsByX } from '@/lib/chartData.ts';
import { routeDistanceXAxis } from '@/lib/chartTheme.ts';
import { useSyncedChartZoom } from '@/lib/hooks/useSyncedChartZoom.ts';
import { tokens } from '@/lib/tokens.ts';
import { m } from '@/paraglide/messages.js';

interface ChartEntry {
  key: string;
  title: string;
  icon: LucideIcon;
  color: string;
  hasData: boolean;
  metricId?: MetricId;
  rail: React.ReactNode;
  chart: React.ReactNode;
}

interface RouteChartsExplorerProps {
  points: RoutePoint[];
  elevation: RouteElevationStats | undefined;
}

const HOVER_GROUP = 'studio-detail';

const formatHoverDist = (x: ChartHoverX) => routeDistanceXAxis.tickFormatter(Number(x));

export const RouteChartsExplorer = (props: RouteChartsExplorerProps) => {
  const profile = useMemo(() => buildRouteProfile(props.points), [props.points]);

  const zoom = useSyncedChartZoom();
  const zoomRange = zoom.zoomRange;

  const rows = useMemo(() => buildRouteChartRows(profile), [profile]);
  const compactRows = useMemo(
    () => (zoomRange ? buildRouteChartRows(profile, zoomRange) : rows),
    [profile, zoomRange, rows],
  );
  const byDist = useMemo(
    () => new Map([...indexByX(rows, 'dist'), ...indexByX(compactRows, 'dist')]),
    [rows, compactRows],
  );
  const gpsLookup = useMemo(
    () => new Map([...gpsByX(rows, 'dist'), ...gpsByX(compactRows, 'dist')]),
    [rows, compactRows],
  );

  const onHover = useCallback(
    (dist: number | null) => {
      if (dist == null) {
        useChartHoverStore.getState().clearChartHover(HOVER_GROUP);
        useMapFocusStore.getState().clearHoveredPoint();
        return;
      }
      useChartHoverStore.getState().setChartHover(HOVER_GROUP, dist);
      const point = gpsLookup.get(dist);
      if (point) {
        useMapFocusStore.getState().setHoveredPoint(point);
      }
    },
    [gpsLookup],
  );

  useEffect(
    () => () => {
      useMapFocusStore.getState().clearHoveredPoint();
      useChartHoverStore.getState().clearChartHover(HOVER_GROUP);
    },
    [],
  );

  const gradeSummary = useMemo(
    () => summarizeValues(profile.grade.map((p) => p.grade)),
    [profile.grade],
  );
  const elevation = props.elevation;

  const charts: ChartEntry[] = [
    {
      key: 'elevation',
      title: m.ui_stat_elevation(),
      icon: Mountain,
      color: tokens.chartElevation,
      metricId: 'elevation',
      hasData: profile.elevation.length > 1,
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
            const point = byDist.get(x);
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
          data={compactRows}
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
      hasData: profile.grade.length > 1,
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
            const point = byDist.get(x);
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
          data={compactRows}
          xAxis={routeDistanceXAxis}
          onActiveXChange={onHover}
          onZoomComplete={zoom.onZoomComplete}
        />
      ),
    },
  ];

  const visibleCharts = charts.filter((c) => c.hasData);

  if (visibleCharts.length === 0) return null;

  return (
    <ChartsCard toolbar={<ZoomResetButton isZoomed={zoom.isZoomed} onReset={zoom.resetZoom} />}>
      {visibleCharts.map((chart) => (
        <ChartRow
          key={chart.key}
          title={chart.title}
          icon={chart.icon}
          color={chart.color}
          metricId={chart.metricId}
          rail={chart.rail}
        >
          {chart.chart}
        </ChartRow>
      ))}
    </ChartsCard>
  );
};
