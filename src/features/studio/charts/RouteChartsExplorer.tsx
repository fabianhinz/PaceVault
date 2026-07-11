import { useCallback, useEffect, useMemo } from 'react';
import { Mountain, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ChartPreviewCard } from '@/components/ui/ChartPreviewCard.tsx';
import { ElevationChart } from '@/components/charts/ElevationChart.tsx';
import { GradeChart } from '@/components/charts/GradeChart.tsx';
import { buildRouteProfile } from '@/packages/gpx/routeProfile.ts';
import type { RoutePoint } from '@/packages/gpx/routeGeometry.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
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
  render: (mode: 'compact' | 'expanded') => React.ReactNode;
}

/**
 * Route twin of SessionChartsExplorer: elevation + grade over distance,
 * compact previews with synced zoom/tooltips, expandable cards, and chart
 * hover highlighting the matching point on the map track.
 */
export const RouteChartsExplorer = (props: { points: RoutePoint[] }) => {
  const profile = useMemo(() => buildRouteProfile(props.points), [props.points]);
  const elevationData = profile.elevation;
  const gradeData = profile.grade;

  // The series' dist values double as lookup keys back to the GPS coordinate.
  const gpsByDist = useMemo(
    () => new Map(elevationData.map((p) => [p.dist, [p.lng, p.lat] as [number, number]])),
    [elevationData],
  );

  const onActiveDistChange = useCallback(
    (dist: number | null) => {
      if (dist == null) {
        useMapFocusStore.getState().clearHoveredPoint();
        return;
      }
      const point = gpsByDist.get(dist);
      if (point) {
        useMapFocusStore.getState().setHoveredPoint(point);
      }
    },
    [gpsByDist],
  );

  useEffect(() => () => useMapFocusStore.getState().clearHoveredPoint(), []);

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

  const charts: ChartEntry[] = useMemo(
    () => [
      {
        key: 'elevation',
        title: m.ui_stat_elevation(),
        icon: Mountain,
        color: tokens.chartElevation,
        hasData: elevationData.length > 1,
        render: (mode: 'compact' | 'expanded') => (
          <ElevationChart
            data={mode === 'compact' ? filteredElevationData : elevationData}
            xAxis={routeDistanceXAxis}
            mode={mode}
            onActiveXChange={onActiveDistChange}
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
        render: (mode: 'compact' | 'expanded') => (
          <GradeChart
            data={mode === 'compact' ? filteredGradeData : gradeData}
            xAxis={routeDistanceXAxis}
            mode={mode}
            onActiveXChange={onActiveDistChange}
            onZoomComplete={mode === 'compact' ? zoom.onZoomComplete : undefined}
            onZoomReset={mode === 'compact' ? zoom.onZoomReset : undefined}
          />
        ),
      },
    ],
    [
      elevationData,
      gradeData,
      filteredElevationData,
      filteredGradeData,
      onActiveDistChange,
      zoom.onZoomComplete,
      zoom.onZoomReset,
    ],
  );

  const visibleCharts = charts.filter((c) => c.hasData);

  if (visibleCharts.length === 0) return null;

  return (
    <div className="space-y-3">
      {visibleCharts.map((chart) => (
        <ChartPreviewCard key={chart.key} title={chart.title} icon={chart.icon} color={chart.color}>
          {chart.render}
        </ChartPreviewCard>
      ))}
    </div>
  );
};
