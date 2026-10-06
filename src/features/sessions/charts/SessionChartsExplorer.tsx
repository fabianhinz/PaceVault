import { useCallback, useEffect, useMemo } from 'react';
import { Heart, Zap, Gauge, Mountain, Timer, TrendingUp, ArrowUpDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ChartPreviewCard } from '@/components/ui/ChartPreviewCard.tsx';
import { buildSessionChartRows, gpsByX, hasSeriesValues } from '@/lib/chartData.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useChartHoverStore, type ChartHoverX } from '@/store/chartHover.ts';
import { indexByX } from '@/lib/chartHover.ts';
import { computeRecordExtremes } from '@/lib/recordExtremes.ts';
import {
  railFixed1,
  railGain,
  railInt,
  railLoss,
  railPace,
  railPaceFromSecPerKm,
  railSigned1,
} from '@/lib/railFormat.ts';
import type { MetricId } from '@/lib/explanations.ts';
import { SeriesRail } from '@/components/charts/ChartRail.tsx';
import { sportIcon } from '@/lib/sportIcons.ts';
import { formatChartTime, sessionTimeXAxis } from '@/lib/chartTheme.ts';
import { useSyncedChartZoom } from '@/lib/hooks/useSyncedChartZoom.ts';
import { HrChart } from './HrChart.tsx';
import { PowerChart } from './PowerChart.tsx';
import { SpeedChart } from './SpeedChart.tsx';
import { CadenceChart } from './CadenceChart.tsx';
import { ElevationChart } from '@/components/charts/ElevationChart.tsx';
import { GradeChart } from '@/components/charts/GradeChart.tsx';
import { PaceChart } from './PaceChart.tsx';
import { GradeAdjustedPaceChart } from './GradeAdjustedPaceChart.tsx';
import { tokens } from '@/lib/tokens.ts';
import type { SessionRecord, TrainingSession } from '@/packages/engine/types.ts';
import { m } from '@/paraglide/messages.js';
import { useUserStore } from '@/store/user.ts';
import { zoneScale, type ZoneMetric, type ZoneScale } from '@/lib/zoneColors.ts';
import { zoneLabel } from './zoneLabel.ts';

interface ChartEntry {
  key: string;
  title: string;
  icon: LucideIcon;
  color: string;
  hasData: boolean;
  compactHeight?: string;
  metricId?: MetricId;
  rail: React.ReactNode;
  chart: React.ReactNode;
}

interface SessionChartsExplorerProps {
  records: SessionRecord[];
  session: TrainingSession;
}

const HOVER_GROUP = 'session-detail';

const formatHoverTime = (x: ChartHoverX) => formatChartTime(Number(x));

const zoneNote = (scale: ZoneScale | undefined, value: number | null) => {
  if (!scale || value === null) return undefined;
  const band = scale.bandAt(value);
  return { text: zoneLabel(band), color: band.color };
};

export const SessionChartsExplorer = (props: SessionChartsExplorerProps) => {
  const isRunning = props.session.sport === 'running';

  const extremes = useMemo(() => computeRecordExtremes(props.records), [props.records]);
  const trackColorMode = useMapFocusStore((s) => s.trackColorMode);
  const thresholds = useUserStore((s) => s.profile?.thresholds);
  const scaleFor = (metric: ZoneMetric) => {
    if (trackColorMode !== metric || !thresholds) return undefined;
    return zoneScale(metric, thresholds);
  };
  const hrScale = scaleFor('hr');
  const powerScale = scaleFor('power');
  const paceScale = scaleFor('pace');

  const zoom = useSyncedChartZoom();
  const zoomRange = zoom.zoomRange;

  const rows = useMemo(
    () => buildSessionChartRows(props.records, { isRunning }),
    [props.records, isRunning],
  );
  const compactRows = useMemo(
    () =>
      zoomRange ? buildSessionChartRows(props.records, { isRunning, range: zoomRange }) : rows,
    [props.records, isRunning, zoomRange, rows],
  );
  const byTime = useMemo(
    () => new Map([...indexByX(rows, 'time'), ...indexByX(compactRows, 'time')]),
    [rows, compactRows],
  );
  const gpsLookup = useMemo(
    () => new Map([...gpsByX(rows, 'time'), ...gpsByX(compactRows, 'time')]),
    [rows, compactRows],
  );

  const onHover = useCallback(
    (time: number | null) => {
      if (time == null) {
        useChartHoverStore.getState().clearChartHover(HOVER_GROUP);
        useMapFocusStore.getState().clearHoveredPoint();
        return;
      }
      useChartHoverStore.getState().setChartHover(HOVER_GROUP, time);
      const point = gpsLookup.get(time);
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

  const session = props.session;
  const cadenceIcon = sportIcon[session.sport] ?? sportIcon.running;

  let avgSpeed = session.avgSpeed;
  if (avgSpeed === undefined && session.distance !== undefined && session.duration > 0) {
    avgSpeed = session.distance / session.duration;
  }
  const avgSpeedKmh = avgSpeed !== undefined ? avgSpeed * 3.6 : undefined;
  const maxSpeedKmh = session.maxSpeed !== undefined ? session.maxSpeed * 3.6 : undefined;

  let powerRest: { header: string; value: string; secondary?: string } = {
    header: m.ui_rail_np(),
    value: railInt(session.normalizedPower),
    secondary: `${m.ui_rail_avg()} ${railInt(session.avgPower)}`,
  };
  if (session.normalizedPower === undefined) {
    powerRest = { header: m.ui_rail_avg(), value: railInt(session.avgPower) };
  }

  const charts: ChartEntry[] = [
    {
      key: 'hr',
      title: m.ui_chart_title_hr(),
      icon: Heart,
      color: tokens.chartHr,
      metricId: 'avgHr',
      hasData: hasSeriesValues(rows, 'hr'),
      rail: (
        <SeriesRail
          group={HOVER_GROUP}
          unit="bpm"
          formatX={formatHoverTime}
          rest={{
            header: m.ui_rail_avg(),
            value: railInt(session.avgHr),
            secondary: `${m.ui_rail_max()} ${railInt(session.maxHr)}`,
          }}
          readingAt={(x) => {
            const point = byTime.get(x);
            if (!point) return undefined;
            return {
              value: railInt(point.hr),
              secondary: `${m.ui_rail_avg()} ${railInt(session.avgHr)}`,
              note: zoneNote(hrScale, point.hr),
            };
          }}
        />
      ),
      chart: (
        <HrChart
          data={compactRows}
          zoneScale={hrScale}
          onActiveTimeChange={onHover}
          onZoomComplete={zoom.onZoomComplete}
          onZoomReset={zoom.onZoomReset}
        />
      ),
    },
    {
      key: 'power',
      title: m.ui_zones_tab_power(),
      icon: Zap,
      color: tokens.chartPower,
      metricId: 'normalizedPower',
      hasData: hasSeriesValues(rows, 'power'),
      rail: (
        <SeriesRail
          group={HOVER_GROUP}
          unit="W"
          formatX={formatHoverTime}
          rest={powerRest}
          readingAt={(x) => {
            const point = byTime.get(x);
            if (!point) return undefined;
            return {
              value: railInt(point.power),
              secondary: `${powerRest.header} ${powerRest.value}`,
              note: zoneNote(powerScale, point.power),
            };
          }}
        />
      ),
      chart: (
        <PowerChart
          data={compactRows}
          zoneScale={powerScale}
          onActiveTimeChange={onHover}
          onZoomComplete={zoom.onZoomComplete}
          onZoomReset={zoom.onZoomReset}
        />
      ),
    },
    {
      key: 'speed',
      title: m.ui_laps_col_speed(),
      icon: Gauge,
      color: tokens.chartSpeed,
      metricId: 'avgSpeed',
      hasData: hasSeriesValues(rows, 'speed'),
      rail: (
        <SeriesRail
          group={HOVER_GROUP}
          unit="km/h"
          formatX={formatHoverTime}
          rest={{
            header: m.ui_rail_avg(),
            value: railFixed1(avgSpeedKmh),
            secondary: `${m.ui_rail_max()} ${railFixed1(maxSpeedKmh)}`,
          }}
          readingAt={(x) => {
            const point = byTime.get(x);
            if (!point) return undefined;
            return {
              value: railFixed1(point.speed),
              secondary: `${m.ui_rail_avg()} ${railFixed1(avgSpeedKmh)}`,
            };
          }}
        />
      ),
      chart: (
        <SpeedChart
          data={compactRows}
          onActiveTimeChange={onHover}
          onZoomComplete={zoom.onZoomComplete}
          onZoomReset={zoom.onZoomReset}
        />
      ),
    },
    {
      key: 'elevation',
      title: m.ui_stat_elevation(),
      icon: Mountain,
      color: tokens.chartElevation,
      metricId: 'elevation',
      hasData: hasSeriesValues(rows, 'elevation'),
      rail: (
        <SeriesRail
          group={HOVER_GROUP}
          unit="m"
          formatX={formatHoverTime}
          rest={{
            header: '',
            value: railGain(session.elevationGain),
            secondary: `${railLoss(session.elevationLoss)} m`,
          }}
          readingAt={(x) => {
            const point = byTime.get(x);
            if (!point) return undefined;
            return {
              value: railInt(point.elevation),
              secondary: `${railGain(session.elevationGain)} m`,
            };
          }}
        />
      ),
      chart: (
        <ElevationChart
          data={compactRows}
          xAxis={sessionTimeXAxis}
          onActiveXChange={onHover}
          onZoomComplete={zoom.onZoomComplete}
          onZoomReset={zoom.onZoomReset}
        />
      ),
    },
    {
      key: 'cadence',
      title: m.ui_stat_cadence(),
      icon: cadenceIcon,
      color: tokens.chartCadence,
      metricId: 'cadence',
      hasData: hasSeriesValues(rows, 'cadence'),
      rail: (
        <SeriesRail
          group={HOVER_GROUP}
          unit="rpm"
          formatX={formatHoverTime}
          rest={{
            header: m.ui_rail_avg(),
            value: railInt(session.avgCadence),
            secondary: `${m.ui_rail_max()} ${railInt(extremes.maxCadence)}`,
          }}
          readingAt={(x) => {
            const point = byTime.get(x);
            if (!point) return undefined;
            return {
              value: railInt(point.cadence),
              secondary: `${m.ui_rail_avg()} ${railInt(session.avgCadence)}`,
            };
          }}
        />
      ),
      chart: (
        <CadenceChart
          data={compactRows}
          onActiveTimeChange={onHover}
          onZoomComplete={zoom.onZoomComplete}
          onZoomReset={zoom.onZoomReset}
        />
      ),
    },
    {
      key: 'grade',
      title: m.ui_chart_title_grade(),
      icon: TrendingUp,
      color: tokens.chartGrade,
      hasData: hasSeriesValues(rows, 'grade'),
      rail: (
        <SeriesRail
          group={HOVER_GROUP}
          unit="%"
          formatX={formatHoverTime}
          rest={{
            header: m.ui_rail_max(),
            value: railSigned1(extremes.maxGrade),
            secondary: `${m.ui_rail_min()} ${railSigned1(extremes.minGrade)}`,
          }}
          readingAt={(x) => {
            const point = byTime.get(x);
            if (!point) return undefined;
            return {
              value: railSigned1(point.grade),
              secondary: `${m.ui_rail_max()} ${railSigned1(extremes.maxGrade)}`,
            };
          }}
        />
      ),
      chart: (
        <GradeChart
          data={compactRows}
          xAxis={sessionTimeXAxis}
          onActiveXChange={onHover}
          onZoomComplete={zoom.onZoomComplete}
          onZoomReset={zoom.onZoomReset}
        />
      ),
    },
    {
      key: 'pace',
      title: m.ui_zones_tab_pace(),
      icon: Timer,
      color: tokens.chartPace,
      metricId: 'avgPace',
      hasData: hasSeriesValues(rows, 'pace'),
      rail: (
        <SeriesRail
          group={HOVER_GROUP}
          unit="/km"
          formatX={formatHoverTime}
          rest={{
            header: m.ui_rail_avg(),
            value: railPaceFromSecPerKm(session.avgPace),
            secondary: `${m.ui_rail_best()} ${railPaceFromSecPerKm(extremes.bestPaceSecPerKm)}`,
          }}
          readingAt={(x) => {
            const point = byTime.get(x);
            if (!point) return undefined;
            return {
              value: railPace(point.pace),
              secondary: `${m.ui_rail_avg()} ${railPaceFromSecPerKm(session.avgPace)}`,
              note: zoneNote(paceScale, point.pace),
            };
          }}
        />
      ),
      chart: (
        <PaceChart
          data={compactRows}
          zoneScale={paceScale}
          onActiveTimeChange={onHover}
          onZoomComplete={zoom.onZoomComplete}
          onZoomReset={zoom.onZoomReset}
        />
      ),
    },
    {
      key: 'gap',
      title: m.exp_gradeAdjustedPace_friendlyName(),
      icon: ArrowUpDown,
      color: tokens.chartGap,
      metricId: 'gradeAdjustedPace',
      hasData: hasSeriesValues(rows, 'gap'),
      rail: (
        <SeriesRail
          group={HOVER_GROUP}
          unit="/km"
          formatX={formatHoverTime}
          rest={{ header: m.ui_rail_avg(), value: railPaceFromSecPerKm(session.gap) }}
          readingAt={(x) => {
            const point = byTime.get(x);
            if (!point) return undefined;
            return {
              value: railPace(point.gap),
              secondary: `${m.ui_rail_avg()} ${railPaceFromSecPerKm(session.gap)}`,
            };
          }}
        />
      ),
      chart: (
        <GradeAdjustedPaceChart
          data={compactRows}
          onActiveTimeChange={onHover}
          onZoomComplete={zoom.onZoomComplete}
          onZoomReset={zoom.onZoomReset}
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
          compactHeight={chart.compactHeight}
          metricId={chart.metricId}
          rail={chart.rail}
        >
          {chart.chart}
        </ChartPreviewCard>
      ))}
    </div>
  );
};
