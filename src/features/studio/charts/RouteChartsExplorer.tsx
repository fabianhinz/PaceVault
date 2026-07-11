import { useCallback, useEffect, useMemo, useState } from 'react';
import { Mountain, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ChartPreviewCard } from '@/components/ui/ChartPreviewCard.tsx';
import { buildRouteProfile, type RouteProfilePoint } from '@/packages/gpx/routeProfile.ts';
import type { RoutePoint } from '@/packages/gpx/routeGeometry.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { tokens } from '@/lib/tokens.ts';
import { m } from '@/paraglide/messages.js';
import { RouteElevationChart } from './RouteElevationChart.tsx';
import { RouteGradeChart } from './RouteGradeChart.tsx';

interface ChartEntry {
  key: string;
  title: string;
  icon: LucideIcon;
  color: string;
  hasData: boolean;
  render: (mode: 'compact' | 'expanded') => React.ReactNode;
}

const filterByDist = <T extends RouteProfilePoint>(data: T[], from: number, to: number): T[] =>
  data.filter((d) => d.dist >= from && d.dist <= to);

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
  const [zoomRange, setZoomRange] = useState<{ from: number; to: number } | null>(null);

  const handleZoomComplete = useCallback((from: string | number, to: string | number) => {
    setZoomRange({ from: Number(from), to: Number(to) });
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomRange(null);
  }, []);

  const filteredElevationData = useMemo(
    () => (zoomRange ? filterByDist(elevationData, zoomRange.from, zoomRange.to) : elevationData),
    [elevationData, zoomRange],
  );
  const filteredGradeData = useMemo(
    () => (zoomRange ? filterByDist(gradeData, zoomRange.from, zoomRange.to) : gradeData),
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
          <RouteElevationChart
            data={mode === 'compact' ? filteredElevationData : elevationData}
            mode={mode}
            onActiveDistChange={onActiveDistChange}
            onZoomComplete={mode === 'compact' ? handleZoomComplete : undefined}
            onZoomReset={mode === 'compact' ? handleZoomReset : undefined}
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
          <RouteGradeChart
            data={mode === 'compact' ? filteredGradeData : gradeData}
            mode={mode}
            onActiveDistChange={onActiveDistChange}
            onZoomComplete={mode === 'compact' ? handleZoomComplete : undefined}
            onZoomReset={mode === 'compact' ? handleZoomReset : undefined}
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
      handleZoomComplete,
      handleZoomReset,
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
