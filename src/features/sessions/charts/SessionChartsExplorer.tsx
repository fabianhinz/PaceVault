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
} from '@/lib/chartData.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { sportIcon } from '@/lib/sportIcons.ts';
import { sessionTimeXAxis } from '@/lib/chartTheme.ts';
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
  render: (mode: 'compact' | 'expanded') => React.ReactNode;
}

interface SessionChartsExplorerProps {
  records: SessionRecord[];
  session: TrainingSession;
}

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
    () => (isRunning && gradeData.length > 0 ? prepareGAPData(sampled) : []),
    [sampled, isRunning, gradeData.length],
  );

  const gpsLookup = useMemo(() => buildTimeToGpsLookup(sampled), [sampled]);

  const onActiveTimeChange = useCallback(
    (time: number | null) => {
      if (time == null) {
        useMapFocusStore.getState().clearHoveredPoint();
        return;
      }
      const point = gpsLookup.get(time);
      if (point) {
        useMapFocusStore.getState().setHoveredPoint(point);
      }
    },
    [gpsLookup],
  );

  useEffect(() => () => useMapFocusStore.getState().clearHoveredPoint(), []);

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

  const hasGps = gpsLookup.size > 0;

  const cadenceIcon = sportIcon[props.session.sport] ?? sportIcon.running;

  // Chart registry
  const charts: ChartEntry[] = useMemo(
    () => [
      {
        key: 'hr',
        title: m.ui_chart_title_hr(),
        icon: Heart,
        color: tokens.chartHr,
        hasData: hrData.length > 0,
        render: (mode: 'compact' | 'expanded') => (
          <HrChart
            data={mode === 'compact' ? filteredHrData : hrData}
            mode={mode}
            onActiveTimeChange={hasGps ? onActiveTimeChange : undefined}
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
        hasData: powerData.length > 0,
        render: (mode: 'compact' | 'expanded') => (
          <PowerChart
            data={mode === 'compact' ? filteredPowerData : powerData}
            mode={mode}
            onActiveTimeChange={hasGps ? onActiveTimeChange : undefined}
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
        hasData: speedData.length > 0,
        render: (mode: 'compact' | 'expanded') => (
          <SpeedChart
            data={mode === 'compact' ? filteredSpeedData : speedData}
            mode={mode}
            onActiveTimeChange={hasGps ? onActiveTimeChange : undefined}
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
        hasData: elevationData.length > 0,
        render: (mode: 'compact' | 'expanded') => (
          <ElevationChart
            data={mode === 'compact' ? filteredElevationData : elevationData}
            xAxis={sessionTimeXAxis}
            mode={mode}
            onActiveXChange={hasGps ? onActiveTimeChange : undefined}
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
        hasData: cadenceData.length > 0,
        render: (mode: 'compact' | 'expanded') => (
          <CadenceChart
            data={mode === 'compact' ? filteredCadenceData : cadenceData}
            mode={mode}
            onActiveTimeChange={hasGps ? onActiveTimeChange : undefined}
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
        hasData: gradeData.length > 0,
        render: (mode: 'compact' | 'expanded') => (
          <GradeChart
            data={mode === 'compact' ? filteredGradeData : gradeData}
            xAxis={sessionTimeXAxis}
            mode={mode}
            onActiveXChange={hasGps ? onActiveTimeChange : undefined}
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
        hasData: paceData.length > 0,
        render: (mode: 'compact' | 'expanded') => (
          <PaceChart
            data={mode === 'compact' ? filteredPaceData : paceData}
            mode={mode}
            onActiveTimeChange={hasGps ? onActiveTimeChange : undefined}
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
        hasData: gapData.length > 0,
        render: (mode: 'compact' | 'expanded') => (
          <GradeAdjustedPaceChart
            data={mode === 'compact' ? filteredGapData : gapData}
            mode={mode}
            onActiveTimeChange={hasGps ? onActiveTimeChange : undefined}
            onZoomComplete={mode === 'compact' ? zoom.onZoomComplete : undefined}
            onZoomReset={mode === 'compact' ? zoom.onZoomReset : undefined}
          />
        ),
      },
    ],
    [
      hrData,
      powerData,
      speedData,
      elevationData,
      cadenceData,
      gradeData,
      paceData,
      gapData,
      filteredHrData,
      filteredPowerData,
      filteredSpeedData,
      filteredElevationData,
      filteredCadenceData,
      filteredGradeData,
      filteredPaceData,
      filteredGapData,
      cadenceIcon,
      hasGps,
      onActiveTimeChange,
      zoom.onZoomComplete,
      zoom.onZoomReset,
    ],
  );

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
        >
          {chart.render}
        </ChartPreviewCard>
      ))}
    </div>
  );
};
