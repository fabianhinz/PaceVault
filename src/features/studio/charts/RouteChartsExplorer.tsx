import { useCallback, useEffect, useMemo } from 'react';
import { Mountain, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ChartPreviewCard } from '@/components/ui/ChartPreviewCard.tsx';
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
import { filterSeriesByKey } from '@/lib/chartData.ts';
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
  render: (mode: 'compact' | 'expanded') => React.ReactNode;
}

/**
 * Route twin of SessionChartsExplorer: elevation + grade over distance,
 * compact previews with synced zoom/tooltips, expandable cards, and chart
 * hover highlighting the matching point on the map track.
 */
interface RouteChartsExplorerProps {
  points: RoutePoint[];
  elevation: RouteElevationStats | undefined;
}

const HOVER_GROUP = 'studio-detail';

const formatHoverDist = (x: ChartHoverX) => routeDistanceXAxis.tickFormatter(Number(x));

export const RouteChartsExplorer = (props: RouteChartsExplorerProps) => {
  const profile = useMemo(() => buildRouteProfile(props.points), [props.points]);
  const elevationData = profile.elevation;
  const gradeData = profile.grade;

  // The series' dist values double as lookup keys back to the GPS coordinate.
  const gpsByDist = useMemo(
    () => new Map(elevationData.map((p) => [p.dist, [p.lng, p.lat] as [number, number]])),
    [elevationData],
  );

  const onCompactHover = useCallback(
    (dist: number | null) => {
      if (dist == null) {
        useChartHoverStore.getState().clearChartHover(HOVER_GROUP);
        useMapFocusStore.getState().clearHoveredPoint();
        return;
      }
      useChartHoverStore.getState().setChartHover(HOVER_GROUP, dist);
      const point = gpsByDist.get(dist);
      if (point) {
        useMapFocusStore.getState().setHoveredPoint(point);
      }
    },
    [gpsByDist],
  );

  const onExpandedHover = useCallback((dist: number | null) => {
    if (dist == null) {
      useChartHoverStore.getState().clearChartHover(HOVER_GROUP);
      return;
    }
    useChartHoverStore.getState().setChartHover(HOVER_GROUP, dist);
  }, []);

  useEffect(
    () => () => {
      useMapFocusStore.getState().clearHoveredPoint();
      useChartHoverStore.getState().clearChartHover(HOVER_GROUP);
    },
    [],
  );

  // Synced zoom state for compact mode
  const zoom = useSyncedChartZoom();
  const zoomRange = zoom.zoomRange;

  const filteredElevationData = useMemo(
    () =>
      zoomRange
        ? filterSeriesByKey(elevationData, 'dist', zoomRange.from, zoomRange.to)
        : elevationData,
    [elevationData, zoomRange],
  );
  const filteredGradeData = useMemo(
    () =>
      zoomRange ? filterSeriesByKey(gradeData, 'dist', zoomRange.from, zoomRange.to) : gradeData,
    [gradeData, zoomRange],
  );

  const elevationByDist = useMemo(() => indexByX(elevationData, 'dist'), [elevationData]);
  const gradeByDist = useMemo(() => indexByX(gradeData, 'dist'), [gradeData]);
  const gradeSummary = useMemo(() => summarizeValues(gradeData.map((p) => p.grade)), [gradeData]);
  const hoverHandler = (mode: 'compact' | 'expanded') =>
    mode === 'compact' ? onCompactHover : onExpandedHover;
  const elevation = props.elevation;

  const charts: ChartEntry[] = [
    {
      key: 'elevation',
      title: m.ui_stat_elevation(),
      icon: Mountain,
      color: tokens.chartElevation,
      metricId: 'elevation',
      hasData: elevationData.length > 1,
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
            const point = elevationByDist.get(x);
            if (!point) return undefined;
            return {
              value: railInt(point.elevation),
              secondary: `${railGain(elevation?.gain)} m`,
            };
          }}
        />
      ),
      render: (mode) => (
        <ElevationChart
          data={mode === 'compact' ? filteredElevationData : elevationData}
          xAxis={routeDistanceXAxis}
          mode={mode}
          onActiveXChange={hoverHandler(mode)}
          onZoomComplete={mode === 'compact' ? zoom.onZoomComplete : undefined}
          onZoomReset={mode === 'compact' ? zoom.onZoomReset : undefined}
        />
      ),
    },
    {
      key: 'grade',
      title: m.ui_chart_title_grade(),
      icon: TrendingUp,
      color: tokens.chartGrade,
      hasData: gradeData.length > 1,
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
            const point = gradeByDist.get(x);
            if (!point) return undefined;
            return {
              value: railSigned1(point.grade),
              secondary: `${m.ui_rail_max()} ${railSigned1(elevation?.maxGrade)}`,
            };
          }}
        />
      ),
      render: (mode) => (
        <GradeChart
          data={mode === 'compact' ? filteredGradeData : gradeData}
          xAxis={routeDistanceXAxis}
          mode={mode}
          onActiveXChange={hoverHandler(mode)}
          onZoomComplete={mode === 'compact' ? zoom.onZoomComplete : undefined}
          onZoomReset={mode === 'compact' ? zoom.onZoomReset : undefined}
        />
      ),
    },
  ];

  const visibleCharts = charts.filter((c) => c.hasData);

  if (visibleCharts.length === 0) return null;

  return (
    <div className="space-y-3">
      {visibleCharts.map((chart) => (
        <ChartPreviewCard
          key={chart.key}
          title={chart.title}
          icon={chart.icon}
          color={chart.color}
          metricId={chart.metricId}
          rail={chart.rail}
        >
          {chart.render}
        </ChartPreviewCard>
      ))}
    </div>
  );
};
