import { useCallback, useEffect, useMemo } from 'react';
import { Heart, Zap, Gauge, Mountain, Timer, TrendingUp, ArrowUpDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ChartPreviewCard } from '@/components/ui/ChartPreviewCard.tsx';
import { downsample } from '@/lib/downsample.ts';
import {
  prepareHrData,
  preparePowerData,
  prepareSpeedData,
  prepareCadenceData,
  prepareElevationData,
  prepareGradeData,
  preparePaceData,
  prepareGAPData,
  buildTimeToGpsLookup,
  filterTimeSeries,
  hasSeriesValues,
} from '@/lib/chartData.ts';
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

interface ChartEntry {
  key: string;
  title: string;
  icon: LucideIcon;
  color: string;
  hasData: boolean;
  compactHeight?: string;
  metricId?: MetricId;
  rail: React.ReactNode;
  render: (mode: 'compact' | 'expanded') => React.ReactNode;
}

interface SessionChartsExplorerProps {
  records: SessionRecord[];
  session: TrainingSession;
}

const HOVER_GROUP = 'session-detail';

const formatHoverTime = (x: ChartHoverX) => formatChartTime(Number(x));

export const SessionChartsExplorer = (props: SessionChartsExplorerProps) => {
  const isRunning = props.session.sport === 'running';

  const sampled = useMemo(() => downsample(props.records), [props.records]);

  // Time-series data
  const hrData = useMemo(() => prepareHrData(sampled), [sampled]);
  const powerData = useMemo(() => preparePowerData(sampled), [sampled]);
  const speedData = useMemo(() => prepareSpeedData(sampled), [sampled]);
  const cadenceData = useMemo(() => prepareCadenceData(sampled), [sampled]);
  const elevationData = useMemo(() => prepareElevationData(sampled), [sampled]);
  const gradeData = useMemo(() => prepareGradeData(sampled), [sampled]);
  const paceData = useMemo(() => (isRunning ? preparePaceData(sampled) : []), [sampled, isRunning]);
  const gapData = useMemo(
    () => (isRunning && hasSeriesValues(gradeData, 'grade') ? prepareGAPData(sampled) : []),
    [sampled, isRunning, gradeData],
  );

  const gpsLookup = useMemo(() => buildTimeToGpsLookup(sampled), [sampled]);
  const extremes = useMemo(() => computeRecordExtremes(props.records), [props.records]);

  const onCompactHover = useCallback(
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

  const onExpandedHover = useCallback((time: number | null) => {
    if (time == null) {
      useChartHoverStore.getState().clearChartHover(HOVER_GROUP);
      return;
    }
    useChartHoverStore.getState().setChartHover(HOVER_GROUP, time);
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

  // Filtered data for synced compact zoom
  const filteredHrData = useMemo(
    () => (zoomRange ? filterTimeSeries(hrData, zoomRange.from, zoomRange.to) : hrData),
    [hrData, zoomRange],
  );
  const filteredPowerData = useMemo(
    () => (zoomRange ? filterTimeSeries(powerData, zoomRange.from, zoomRange.to) : powerData),
    [powerData, zoomRange],
  );
  const filteredSpeedData = useMemo(
    () => (zoomRange ? filterTimeSeries(speedData, zoomRange.from, zoomRange.to) : speedData),
    [speedData, zoomRange],
  );
  const filteredCadenceData = useMemo(
    () => (zoomRange ? filterTimeSeries(cadenceData, zoomRange.from, zoomRange.to) : cadenceData),
    [cadenceData, zoomRange],
  );
  const filteredElevationData = useMemo(
    () =>
      zoomRange ? filterTimeSeries(elevationData, zoomRange.from, zoomRange.to) : elevationData,
    [elevationData, zoomRange],
  );
  const filteredGradeData = useMemo(
    () => (zoomRange ? filterTimeSeries(gradeData, zoomRange.from, zoomRange.to) : gradeData),
    [gradeData, zoomRange],
  );
  const filteredPaceData = useMemo(
    () => (zoomRange ? filterTimeSeries(paceData, zoomRange.from, zoomRange.to) : paceData),
    [paceData, zoomRange],
  );
  const filteredGapData = useMemo(
    () => (zoomRange ? filterTimeSeries(gapData, zoomRange.from, zoomRange.to) : gapData),
    [gapData, zoomRange],
  );

  const hrByTime = useMemo(() => indexByX(hrData, 'time'), [hrData]);
  const powerByTime = useMemo(() => indexByX(powerData, 'time'), [powerData]);
  const speedByTime = useMemo(() => indexByX(speedData, 'time'), [speedData]);
  const cadenceByTime = useMemo(() => indexByX(cadenceData, 'time'), [cadenceData]);
  const elevationByTime = useMemo(() => indexByX(elevationData, 'time'), [elevationData]);
  const gradeByTime = useMemo(() => indexByX(gradeData, 'time'), [gradeData]);
  const paceByTime = useMemo(() => indexByX(paceData, 'time'), [paceData]);
  const gapByTime = useMemo(() => indexByX(gapData, 'time'), [gapData]);

  const session = props.session;
  const cadenceIcon = sportIcon[session.sport] ?? sportIcon.running;
  const hoverHandler = (mode: 'compact' | 'expanded') =>
    mode === 'compact' ? onCompactHover : onExpandedHover;

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
      hasData: hasSeriesValues(hrData, 'hr'),
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
            const point = hrByTime.get(x);
            if (!point) return undefined;
            return {
              value: railInt(point.hr),
              secondary: `${m.ui_rail_avg()} ${railInt(session.avgHr)}`,
            };
          }}
        />
      ),
      render: (mode) => (
        <HrChart
          data={mode === 'compact' ? filteredHrData : hrData}
          mode={mode}
          onActiveTimeChange={hoverHandler(mode)}
          onZoomComplete={mode === 'compact' ? zoom.onZoomComplete : undefined}
          onZoomReset={mode === 'compact' ? zoom.onZoomReset : undefined}
        />
      ),
    },
    {
      key: 'power',
      title: m.ui_zones_tab_power(),
      icon: Zap,
      color: tokens.chartPower,
      metricId: 'normalizedPower',
      hasData: hasSeriesValues(powerData, 'power'),
      rail: (
        <SeriesRail
          group={HOVER_GROUP}
          unit="W"
          formatX={formatHoverTime}
          rest={powerRest}
          readingAt={(x) => {
            const point = powerByTime.get(x);
            if (!point) return undefined;
            return {
              value: railInt(point.power),
              secondary: `${powerRest.header} ${powerRest.value}`,
            };
          }}
        />
      ),
      render: (mode) => (
        <PowerChart
          data={mode === 'compact' ? filteredPowerData : powerData}
          mode={mode}
          onActiveTimeChange={hoverHandler(mode)}
          onZoomComplete={mode === 'compact' ? zoom.onZoomComplete : undefined}
          onZoomReset={mode === 'compact' ? zoom.onZoomReset : undefined}
        />
      ),
    },
    {
      key: 'speed',
      title: m.ui_laps_col_speed(),
      icon: Gauge,
      color: tokens.chartSpeed,
      metricId: 'avgSpeed',
      hasData: hasSeriesValues(speedData, 'speed'),
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
            const point = speedByTime.get(x);
            if (!point) return undefined;
            return {
              value: railFixed1(point.speed),
              secondary: `${m.ui_rail_avg()} ${railFixed1(avgSpeedKmh)}`,
            };
          }}
        />
      ),
      render: (mode) => (
        <SpeedChart
          data={mode === 'compact' ? filteredSpeedData : speedData}
          mode={mode}
          onActiveTimeChange={hoverHandler(mode)}
          onZoomComplete={mode === 'compact' ? zoom.onZoomComplete : undefined}
          onZoomReset={mode === 'compact' ? zoom.onZoomReset : undefined}
        />
      ),
    },
    {
      key: 'elevation',
      title: m.ui_stat_elevation(),
      icon: Mountain,
      color: tokens.chartElevation,
      metricId: 'elevation',
      hasData: hasSeriesValues(elevationData, 'elevation'),
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
            const point = elevationByTime.get(x);
            if (!point) return undefined;
            return {
              value: railInt(point.elevation),
              secondary: `${railGain(session.elevationGain)} m`,
            };
          }}
        />
      ),
      render: (mode) => (
        <ElevationChart
          data={mode === 'compact' ? filteredElevationData : elevationData}
          xAxis={sessionTimeXAxis}
          mode={mode}
          onActiveXChange={hoverHandler(mode)}
          onZoomComplete={mode === 'compact' ? zoom.onZoomComplete : undefined}
          onZoomReset={mode === 'compact' ? zoom.onZoomReset : undefined}
        />
      ),
    },
    {
      key: 'cadence',
      title: m.ui_stat_cadence(),
      icon: cadenceIcon,
      color: tokens.chartCadence,
      metricId: 'cadence',
      hasData: hasSeriesValues(cadenceData, 'cadence'),
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
            const point = cadenceByTime.get(x);
            if (!point) return undefined;
            return {
              value: railInt(point.cadence),
              secondary: `${m.ui_rail_avg()} ${railInt(session.avgCadence)}`,
            };
          }}
        />
      ),
      render: (mode) => (
        <CadenceChart
          data={mode === 'compact' ? filteredCadenceData : cadenceData}
          mode={mode}
          onActiveTimeChange={hoverHandler(mode)}
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
      hasData: hasSeriesValues(gradeData, 'grade'),
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
            const point = gradeByTime.get(x);
            if (!point) return undefined;
            return {
              value: railSigned1(point.grade),
              secondary: `${m.ui_rail_max()} ${railSigned1(extremes.maxGrade)}`,
            };
          }}
        />
      ),
      render: (mode) => (
        <GradeChart
          data={mode === 'compact' ? filteredGradeData : gradeData}
          xAxis={sessionTimeXAxis}
          mode={mode}
          onActiveXChange={hoverHandler(mode)}
          onZoomComplete={mode === 'compact' ? zoom.onZoomComplete : undefined}
          onZoomReset={mode === 'compact' ? zoom.onZoomReset : undefined}
        />
      ),
    },
    {
      key: 'pace',
      title: m.ui_zones_tab_pace(),
      icon: Timer,
      color: tokens.chartPace,
      metricId: 'avgPace',
      hasData: hasSeriesValues(paceData, 'pace'),
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
            const point = paceByTime.get(x);
            if (!point) return undefined;
            return {
              value: railPace(point.pace),
              secondary: `${m.ui_rail_avg()} ${railPaceFromSecPerKm(session.avgPace)}`,
            };
          }}
        />
      ),
      render: (mode) => (
        <PaceChart
          data={mode === 'compact' ? filteredPaceData : paceData}
          mode={mode}
          onActiveTimeChange={hoverHandler(mode)}
          onZoomComplete={mode === 'compact' ? zoom.onZoomComplete : undefined}
          onZoomReset={mode === 'compact' ? zoom.onZoomReset : undefined}
        />
      ),
    },
    {
      key: 'gap',
      title: m.exp_gradeAdjustedPace_friendlyName(),
      icon: ArrowUpDown,
      color: tokens.chartGap,
      metricId: 'gradeAdjustedPace',
      hasData: hasSeriesValues(gapData, 'gap'),
      rail: (
        <SeriesRail
          group={HOVER_GROUP}
          unit="/km"
          formatX={formatHoverTime}
          rest={{ header: m.ui_rail_avg(), value: railPaceFromSecPerKm(session.gap) }}
          readingAt={(x) => {
            const point = gapByTime.get(x);
            if (!point) return undefined;
            return {
              value: railPace(point.gap),
              secondary: `${m.ui_rail_avg()} ${railPaceFromSecPerKm(session.gap)}`,
            };
          }}
        />
      ),
      render: (mode) => (
        <GradeAdjustedPaceChart
          data={mode === 'compact' ? filteredGapData : gapData}
          mode={mode}
          onActiveTimeChange={hoverHandler(mode)}
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
          compactHeight={chart.compactHeight}
          metricId={chart.metricId}
          rail={chart.rail}
        >
          {chart.render}
        </ChartPreviewCard>
      ))}
    </div>
  );
};
