import { useCallback, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { m } from '@/paraglide/messages.js';
import { ChartCard } from '@/components/ui/ChartCard.tsx';
import { chartTheme, formatTick } from '@/lib/chartTheme.ts';
import { tokens } from '@/lib/tokens.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import type { RoutePoint } from '@/packages/gpx/routeGeometry.ts';

interface ProfilePoint {
  dist: number;
  elevation: number;
}

export const RouteElevationProfile = (props: { points: RoutePoint[] }) => {
  // The chart's x-values double as lookup keys, so hovering the profile can
  // resolve back to the GPS coordinate and highlight it on the map track —
  // same behavior as scrubbing a session chart.
  const chart = useMemo(() => {
    const data: ProfilePoint[] = [];
    const gpsByDist = new Map<number, [number, number]>();
    for (const p of props.points) {
      if (p.ele == null) continue;
      const dist = p.dist / 1000;
      data.push({ dist, elevation: p.ele });
      gpsByDist.set(dist, [p.lng, p.lat]);
    }
    return { data, gpsByDist };
  }, [props.points]);

  const onActiveDistChange = useCallback(
    (dist: number | null) => {
      if (dist == null) {
        useMapFocusStore.getState().clearHoveredPoint();
        return;
      }
      const point = chart.gpsByDist.get(dist);
      if (point) {
        useMapFocusStore.getState().setHoveredPoint(point);
      }
    },
    [chart.gpsByDist],
  );

  useEffect(() => () => useMapFocusStore.getState().clearHoveredPoint(), []);

  if (chart.data.length < 2) return null;

  return (
    <ChartCard title={m.ui_studio_profile_title()} subtitle={m.ui_studio_profile_subtitle()}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chart.data}
          onMouseMove={(e) => {
            if (e.activeLabel != null) {
              onActiveDistChange(Number(e.activeLabel));
            }
          }}
          onMouseLeave={() => onActiveDistChange(null)}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid.stroke} />
          <XAxis
            dataKey="dist"
            type="number"
            domain={[0, 'dataMax']}
            tick={chartTheme.tick}
            tickLine={false}
            axisLine={chartTheme.axisLine}
            tickFormatter={(v: number) => formatTick(v, 'km')}
          />
          <YAxis
            tick={chartTheme.tick}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatTick(v, 'm')}
          />
          <RechartsTooltip
            contentStyle={chartTheme.tooltip.contentStyle}
            labelStyle={chartTheme.tooltip.labelStyle}
            isAnimationActive={chartTheme.tooltip.isAnimationActive}
            separator={chartTheme.tooltip.separator}
            labelFormatter={(v) => formatTick(Number(v), 'km')}
            formatter={(value) => [formatTick(Number(value), 'm'), m.ui_chart_series_elevation()]}
          />
          <Area
            type="monotone"
            dataKey="elevation"
            stroke={tokens.chartElevation}
            fill={tokens.chartElevation}
            fillOpacity={0.2}
            strokeWidth={1.5}
            dot={false}
            name={m.ui_chart_series_elevation()}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};
