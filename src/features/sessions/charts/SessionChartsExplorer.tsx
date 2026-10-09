import { useCallback, useDeferredValue, useEffect, useMemo } from 'react';
import { Heart, Zap, Gauge, Mountain, Timer, TrendingUp, ArrowUpDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ChartRow, ChartsCard, ZoomResetPill } from '@/components/ui/ChartsCard.tsx';
import { buildSessionChartRows, gpsByX, hasSeriesValues } from '@/lib/chartData.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useChartHoverStore, type ChartHoverX } from '@/store/chartHover.ts';
import { indexByX } from '@/lib/chartHover.ts';
import { computeRecordExtremes } from '@/lib/recordExtremes.ts';
import { activeRailRange, computeRangeStats, type RangeStats } from '@/lib/railRange.ts';
import {
  railFixed1,
  railGain,
  railInt,
  railLoss,
  railPace,
  railPaceFromSecPerKm,
  railSigned1,
  railVam,
} from '@/lib/railFormat.ts';
import { buildSessionTerrain, climbSpanAt, climbSpansInMinutes } from '@/lib/sessionTerrain.ts';
import { climbingRate } from '@/packages/engine/climbs.ts';
import type { MetricId } from '@/lib/explanations.ts';
import { SeriesRail } from '@/components/charts/ChartRail.tsx';
import type { StatRailNote } from '@/components/ui/StatRail.tsx';
import { sportIcon } from '@/lib/sportIcons.ts';
import { formatChartTime, sessionTimeXAxis } from '@/lib/chartTheme.ts';
import { useSyncedChartZoom } from '@/lib/hooks/useSyncedChartZoom.ts';
import { lapIndexAtTime } from '@/lib/lapRanges.ts';
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
import {
  zoneScale,
  type ZoneMetric,
  type ZoneScale,
  type ZoneThresholds,
} from '@/lib/zoneColors.ts';
import type { ColorMode } from '@/lib/colorModes.ts';
import { speedScale } from '@/lib/speedScale.ts';
import { zoneLabel } from './zoneLabel.ts';

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

interface SessionChartsExplorerProps {
  records: SessionRecord[];
  session: TrainingSession;
}

const HOVER_GROUP = 'session-detail';

const formatHoverTime = (x: ChartHoverX) => formatChartTime(Number(x));

const scaleFor = (
  metric: ZoneMetric,
  trackColorMode: ColorMode,
  thresholds: ZoneThresholds | undefined,
): ZoneScale | undefined => {
  if (trackColorMode !== metric || !thresholds) return undefined;
  return zoneScale(metric, thresholds);
};

const currentLapBands = () => useMapFocusStore.getState().sessionLaps?.bands ?? [];

const vamNote = (
  vam: number | undefined,
  message: (inputs: { vam: string }) => string,
): StatRailNote | undefined => {
  if (vam === undefined) return undefined;
  return { text: message({ vam: railVam(vam) }), color: tokens.chartClimb };
};

const zoneNote = (scale: ZoneScale | undefined, value: number | null) => {
  if (!scale || value === null) return undefined;
  const band = scale.bandAt(value);
  return { text: zoneLabel(band), color: band.color };
};

export const SessionChartsExplorer = (props: SessionChartsExplorerProps) => {
  const isRunning = props.session.sport === 'running';

  const terrain = useMemo(
    () => buildSessionTerrain(props.session.sport, props.records),
    [props.session.sport, props.records],
  );
  const climbSpans = useMemo(
    () => climbSpansInMinutes(props.records, terrain.climbs),
    [props.records, terrain],
  );
  const extremes = useMemo(
    () => computeRecordExtremes(props.records, terrain.gradients),
    [props.records, terrain],
  );
  const trackColorMode = useMapFocusStore((s) => s.trackColorMode);
  const thresholds = useUserStore((s) => s.profile?.thresholds);
  const hrScale = useMemo(
    () => scaleFor('hr', trackColorMode, thresholds),
    [trackColorMode, thresholds],
  );
  const powerScale = useMemo(
    () => scaleFor('power', trackColorMode, thresholds),
    [trackColorMode, thresholds],
  );
  const paceScale = useMemo(
    () => scaleFor('pace', trackColorMode, thresholds),
    [trackColorMode, thresholds],
  );
  const speedColorScale = useMemo(
    () => (trackColorMode === 'speed' ? speedScale(props.records) : undefined),
    [trackColorMode, props.records],
  );

  const lapBands = useDeferredValue(useMapFocusStore((s) => s.sessionLaps?.bands));
  const zoom = useSyncedChartZoom();
  const zoomRange = zoom.zoomRange;

  const rows = useMemo(
    () => buildSessionChartRows(props.records, { isRunning, terrain }),
    [props.records, isRunning, terrain],
  );
  const compactRows = useMemo(
    () =>
      zoomRange
        ? buildSessionChartRows(props.records, { isRunning, terrain, range: zoomRange })
        : rows,
    [props.records, isRunning, terrain, zoomRange, rows],
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
        useMapFocusStore.getState().setHoveredLap(null);
        return;
      }
      useChartHoverStore.getState().setChartHover(HOVER_GROUP, time);
      useMapFocusStore.getState().setHoveredLap(lapIndexAtTime(currentLapBands(), time) ?? null);
      const point = gpsLookup.get(time);
      if (point) {
        useMapFocusStore.getState().setHoveredPoint(point);
      }
    },
    [gpsLookup],
  );

  const onSelectTime = useCallback((time: number) => {
    const lapIndex = lapIndexAtTime(currentLapBands(), time);
    if (lapIndex === undefined) return;
    useMapFocusStore.getState().toggleSelectedLap(lapIndex);
  }, []);

  useEffect(
    () => () => {
      useMapFocusStore.getState().clearHoveredPoint();
      useMapFocusStore.getState().setHoveredLap(null);
      useChartHoverStore.getState().clearChartHover(HOVER_GROUP);
    },
    [],
  );

  const session = props.session;
  const cadenceIcon = sportIcon[session.sport] ?? sportIcon.running;

  const selectedLapIndex = useDeferredValue(useMapFocusStore((s) => s.selectedLapIndex));
  const selectedBand = lapBands?.find((band) => band.lapIndex === selectedLapIndex);
  const railRange = activeRailRange(zoomRange, selectedBand);
  const railFrom = railRange?.from;
  const railTo = railRange?.to;

  const sessionStats = useMemo((): RangeStats => {
    let avgSpeed = session.avgSpeed;
    if (avgSpeed === undefined && session.distance !== undefined && session.duration > 0) {
      avgSpeed = session.distance / session.duration;
    }
    return {
      avgHr: session.avgHr,
      maxHr: session.maxHr,
      avgPower: session.avgPower,
      normalizedPower: session.normalizedPower,
      avgSpeed,
      maxSpeed: session.maxSpeed,
      avgCadence: session.avgCadence,
      maxCadence: extremes.maxCadence,
      elevationGain: session.elevationGain,
      elevationLoss: session.elevationLoss,
      maxGrade: extremes.maxGrade,
      minGrade: extremes.minGrade,
      avgPaceSecPerKm: session.avgPace,
      bestPaceSecPerKm: extremes.bestPaceSecPerKm,
      gapSecPerKm: session.gap,
      vam: climbingRate(props.records, terrain.climbs, 0, props.records.length - 1),
    };
  }, [session, extremes, props.records, terrain]);

  const stats = useMemo(() => {
    if (railFrom === undefined || railTo === undefined) return sessionStats;
    return computeRangeStats(props.records, { from: railFrom, to: railTo }, terrain);
  }, [sessionStats, props.records, railFrom, railTo, terrain]);

  const avgSpeedKmh = stats.avgSpeed !== undefined ? stats.avgSpeed * 3.6 : undefined;
  const maxSpeedKmh = stats.maxSpeed !== undefined ? stats.maxSpeed * 3.6 : undefined;

  let powerRest: { header: string; value: string; secondary?: string } = {
    header: m.ui_rail_np(),
    value: railInt(stats.normalizedPower),
    secondary: `${m.ui_rail_avg()} ${railInt(stats.avgPower)}`,
  };
  if (stats.normalizedPower === undefined) {
    powerRest = { header: m.ui_rail_avg(), value: railInt(stats.avgPower) };
  }

  let elevationMetricId: MetricId = 'elevation';
  if (terrain.climbs.length > 0) elevationMetricId = 'vam';

  const onZoomComplete = zoom.onZoomComplete;
  const chartNodes = useMemo(
    () => ({
      hr: (
        <HrChart
          data={compactRows}
          zoneScale={hrScale}
          onActiveTimeChange={onHover}
          onZoomComplete={onZoomComplete}
          onSelectTime={onSelectTime}
        />
      ),
      power: (
        <PowerChart
          data={compactRows}
          zoneScale={powerScale}
          onActiveTimeChange={onHover}
          onZoomComplete={onZoomComplete}
          onSelectTime={onSelectTime}
        />
      ),
      speed: (
        <SpeedChart
          data={compactRows}
          colorScale={speedColorScale}
          onActiveTimeChange={onHover}
          onZoomComplete={onZoomComplete}
          onSelectTime={onSelectTime}
        />
      ),
      elevation: (
        <ElevationChart
          data={compactRows}
          xAxis={sessionTimeXAxis}
          onActiveXChange={onHover}
          onZoomComplete={onZoomComplete}
          onSelectX={onSelectTime}
          lapBands
          climbs={terrain.climbs.length > 0}
        />
      ),
      cadence: (
        <CadenceChart
          data={compactRows}
          onActiveTimeChange={onHover}
          onZoomComplete={onZoomComplete}
          onSelectTime={onSelectTime}
        />
      ),
      grade: (
        <GradeChart
          data={compactRows}
          xAxis={sessionTimeXAxis}
          onActiveXChange={onHover}
          onZoomComplete={onZoomComplete}
          onSelectX={onSelectTime}
          lapBands
        />
      ),
      pace: (
        <PaceChart
          data={compactRows}
          zoneScale={paceScale}
          onActiveTimeChange={onHover}
          onZoomComplete={onZoomComplete}
          onSelectTime={onSelectTime}
        />
      ),
      gap: (
        <GradeAdjustedPaceChart
          data={compactRows}
          onActiveTimeChange={onHover}
          onZoomComplete={onZoomComplete}
          onSelectTime={onSelectTime}
        />
      ),
    }),
    [
      compactRows,
      hrScale,
      powerScale,
      paceScale,
      speedColorScale,
      onHover,
      onSelectTime,
      onZoomComplete,
      terrain,
    ],
  );

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
            value: railInt(stats.avgHr),
            secondary: `${m.ui_rail_max()} ${railInt(stats.maxHr)}`,
          }}
          readingAt={(x) => {
            const point = byTime.get(x);
            if (!point) return undefined;
            return {
              value: railInt(point.hr),
              secondary: `${m.ui_rail_avg()} ${railInt(stats.avgHr)}`,
              note: zoneNote(hrScale, point.hr),
            };
          }}
        />
      ),
      chart: chartNodes.hr,
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
      chart: chartNodes.power,
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
      chart: chartNodes.speed,
    },
    {
      key: 'elevation',
      title: m.ui_stat_elevation(),
      icon: Mountain,
      color: tokens.chartElevation,
      metricId: elevationMetricId,
      hasData: hasSeriesValues(rows, 'elevation'),
      rail: (
        <SeriesRail
          group={HOVER_GROUP}
          unit="m"
          formatX={formatHoverTime}
          rest={{
            header: '',
            value: railGain(stats.elevationGain),
            secondary: `${railLoss(stats.elevationLoss)} m`,
            note: vamNote(stats.vam, m.ui_rail_vam_avg),
          }}
          readingAt={(x) => {
            const point = byTime.get(x);
            if (!point) return undefined;
            return {
              value: railInt(point.elevation),
              secondary: `${railGain(stats.elevationGain)} m`,
              note: vamNote(climbSpanAt(climbSpans, Number(x))?.vam, m.ui_rail_vam),
            };
          }}
        />
      ),
      chart: chartNodes.elevation,
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
            value: railInt(stats.avgCadence),
            secondary: `${m.ui_rail_max()} ${railInt(stats.maxCadence)}`,
          }}
          readingAt={(x) => {
            const point = byTime.get(x);
            if (!point) return undefined;
            return {
              value: railInt(point.cadence),
              secondary: `${m.ui_rail_avg()} ${railInt(stats.avgCadence)}`,
            };
          }}
        />
      ),
      chart: chartNodes.cadence,
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
            value: railSigned1(stats.maxGrade),
            secondary: `${m.ui_rail_min()} ${railSigned1(stats.minGrade)}`,
          }}
          readingAt={(x) => {
            const point = byTime.get(x);
            if (!point) return undefined;
            return {
              value: railSigned1(point.grade),
              secondary: `${m.ui_rail_max()} ${railSigned1(stats.maxGrade)}`,
            };
          }}
        />
      ),
      chart: chartNodes.grade,
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
            value: railPaceFromSecPerKm(stats.avgPaceSecPerKm),
            secondary: `${m.ui_rail_best()} ${railPaceFromSecPerKm(stats.bestPaceSecPerKm)}`,
          }}
          readingAt={(x) => {
            const point = byTime.get(x);
            if (!point) return undefined;
            return {
              value: railPace(point.pace),
              secondary: `${m.ui_rail_avg()} ${railPaceFromSecPerKm(stats.avgPaceSecPerKm)}`,
              note: zoneNote(paceScale, point.pace),
            };
          }}
        />
      ),
      chart: chartNodes.pace,
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
          rest={{ header: m.ui_rail_avg(), value: railPaceFromSecPerKm(stats.gapSecPerKm) }}
          readingAt={(x) => {
            const point = byTime.get(x);
            if (!point) return undefined;
            return {
              value: railPace(point.gap),
              secondary: `${m.ui_rail_avg()} ${railPaceFromSecPerKm(stats.gapSecPerKm)}`,
            };
          }}
        />
      ),
      chart: chartNodes.gap,
    },
  ];

  const visibleCharts = charts.filter((c) => c.hasData);

  if (visibleCharts.length === 0) return null;

  return (
    <ChartsCard zoomReset={<ZoomResetPill isZoomed={zoom.isZoomed} onReset={zoom.resetZoom} />}>
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
