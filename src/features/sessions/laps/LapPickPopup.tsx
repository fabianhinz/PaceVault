import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { DataTable } from '@/components/ui/DataTable.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { MapPopupShell } from '@/features/map/MapPopupShell.tsx';
import { useExpandCard } from '@/lib/hooks/useExpandCard.ts';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { filterRecordsByLap } from '@/lib/laps.ts';
import { buildLapChartRows } from '@/lib/chartData.ts';
import {
  formatLapTime,
  formatDistance,
  formatElevation,
  formatPaceTick,
} from '@/lib/formatters.ts';
import { chartTheme, formatChartTime } from '@/lib/chartTheme.ts';
import { chartHoverHandlers, hoverOnlyTooltip, indexByX } from '@/lib/chartHover.ts';
import { railFixed1, railInt, railPace, railPaceFromSecPerKm } from '@/lib/railFormat.ts';
import { cn } from '@/lib/utils.ts';
import { useChartHoverStore, type ChartHoverX } from '@/store/chartHover.ts';
import { MultiSeriesRail, type MultiSeriesRailRow } from '@/components/charts/ChartRail.tsx';
import { tokens } from '@/lib/tokens.ts';
import type { SessionLap, SessionRecord, Sport } from '@/packages/engine/types.ts';
import type { LapAnalysis, LapRecordEnrichment } from '@/lib/laps.ts';
import { m } from '@/paraglide/messages.js';

const HOVER_GROUP = 'lap-popup';

const formatHoverTime = (x: ChartHoverX) => formatChartTime(Number(x));

export interface LapPopupInfo {
  x: number;
  y: number;
}

interface LapPickPopupProps {
  info: LapPopupInfo;
  laps: SessionLap[];
  records: SessionRecord[];
  sport: Sport;
  onClose: () => void;
}

/**
 * Gets lap records for the chart. For device laps uses time-based filtering,
 * for dynamic laps uses distance-based slicing.
 */
const getLapRecords = (
  clickedLapIndex: number,
  records: SessionRecord[],
  laps: SessionLap[],
  splitDistance: number | null,
): SessionRecord[] => {
  if (records.length === 0) return [];

  if (splitDistance != null) {
    const withDistance = records.filter((r) => r.distance !== undefined);
    if (withDistance.length < 2) return [];
    const firstRecord = withDistance[0];
    if (!firstRecord) return [];
    const firstDist = firstRecord.distance ?? 0;
    const lapStart = firstDist + clickedLapIndex * splitDistance;
    const lapEnd = lapStart + splitDistance;
    return withDistance.filter((r) => (r.distance ?? 0) >= lapStart && (r.distance ?? 0) < lapEnd);
  }

  const lap = laps[clickedLapIndex];
  if (!lap) return [];
  const firstLap = laps[0];
  if (!firstLap) return [];
  const sessionStartMs = firstLap.startTime;
  return filterRecordsByLap(records, lap, sessionStartMs);
};

export const LapPickPopup = (props: LapPickPopupProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const expandCard = useExpandCard(cardRef);
  const isDesktop = useIsDesktop();
  const clickedLapIndex = useMapFocusStore((s) => s.clickedLapIndex);
  const activeLapAnalysis = useMapFocusStore((s) => s.activeLapAnalysis);
  const activeLapEnrichments = useMapFocusStore((s) => s.activeLapEnrichments);
  const activeSplitDistance = useMapFocusStore((s) => s.activeSplitDistance);

  const isRunning = props.sport === 'running';

  const analysis: LapAnalysis | undefined =
    clickedLapIndex != null ? activeLapAnalysis[clickedLapIndex] : undefined;
  const enrichment: LapRecordEnrichment | undefined =
    clickedLapIndex != null ? activeLapEnrichments[clickedLapIndex] : undefined;

  const chartData = useMemo(() => {
    if (clickedLapIndex == null) return [];
    const lapRecords = getLapRecords(
      clickedLapIndex,
      props.records,
      props.laps,
      activeSplitDistance,
    );
    return buildLapChartRows(lapRecords, isRunning);
  }, [clickedLapIndex, props.records, props.laps, activeSplitDistance, isRunning]);

  const chartByTime = useMemo(() => indexByX(chartData, 'time'), [chartData]);

  const onHover = useCallback((time: number | null) => {
    if (time == null) {
      useChartHoverStore.getState().clearChartHover(HOVER_GROUP);
      return;
    }
    useChartHoverStore.getState().setChartHover(HOVER_GROUP, time);
  }, []);

  useEffect(() => () => useChartHoverStore.getState().clearChartHover(HOVER_GROUP), []);

  if (clickedLapIndex == null || !analysis) {
    return null;
  }

  const lapAvgPace = analysis.paceSecPerKm;
  let lapAvgSpeedKmh: number | undefined = undefined;
  if (lapAvgPace !== undefined && lapAvgPace > 0) {
    lapAvgSpeedKmh = 3600 / lapAvgPace;
  }

  const lapNumber = clickedLapIndex + 1;
  const totalLaps = activeLapAnalysis.length;
  const hasChartData = chartData.length > 0;
  const hasHrData = chartData.some((p) => p.hr != null);
  const hasPaceOrSpeed = chartData.some((p) => p.pace != null || p.speed != null);
  const hasPowerData = chartData.some((p) => p.power != null);
  const hasCadence = analysis.avgCadence !== undefined;
  const hasElevation = analysis.elevationGain !== undefined;

  const railRows: MultiSeriesRailRow[] = [];
  if (hasHrData) {
    railRows.push({
      key: 'hr',
      name: m.ui_rail_hr(),
      color: tokens.chartHr,
      metricId: 'avgHr',
      unit: 'bpm',
      rest: { value: railInt(analysis.avgHr) },
      readingAt: (x) => {
        const point = chartByTime.get(x);
        if (!point) return undefined;
        return {
          value: railInt(point.hr),
          secondary: `${m.ui_rail_avg()} ${railInt(analysis.avgHr)}`,
        };
      },
    });
  }
  if (hasPowerData) {
    railRows.push({
      key: 'power',
      name: m.ui_rail_power(),
      color: tokens.chartPower,
      metricId: 'avgPower',
      unit: 'W',
      rest: { value: railInt(enrichment?.avgPower) },
      readingAt: (x) => {
        const point = chartByTime.get(x);
        if (!point) return undefined;
        return {
          value: railInt(point.power),
          secondary: `${m.ui_rail_avg()} ${railInt(enrichment?.avgPower)}`,
        };
      },
    });
  }
  if (hasPaceOrSpeed && isRunning) {
    railRows.push({
      key: 'pace',
      name: m.ui_rail_pace(),
      color: tokens.chartPace,
      metricId: 'avgPace',
      unit: '/km',
      rest: { value: railPaceFromSecPerKm(lapAvgPace) },
      readingAt: (x) => {
        const point = chartByTime.get(x);
        if (!point) return undefined;
        return {
          value: railPace(point.pace),
          secondary: `${m.ui_rail_avg()} ${railPaceFromSecPerKm(lapAvgPace)}`,
        };
      },
    });
  }
  if (hasPaceOrSpeed && !isRunning) {
    railRows.push({
      key: 'speed',
      name: m.ui_rail_speed(),
      color: tokens.chartSpeed,
      metricId: 'avgSpeed',
      unit: 'km/h',
      rest: { value: railFixed1(lapAvgSpeedKmh) },
      readingAt: (x) => {
        const point = chartByTime.get(x);
        if (!point) return undefined;
        return {
          value: railFixed1(point.speed),
          secondary: `${m.ui_rail_avg()} ${railFixed1(lapAvgSpeedKmh)}`,
        };
      },
    });
  }

  return (
    <MapPopupShell
      x={props.info.x}
      y={props.info.y}
      onClose={props.onClose}
      isExpanded={expandCard.isExpanded}
      desktopSizeClasses="w-[380px] max-h-[420px]"
      cardRef={cardRef}
    >
      <CardHeader
        title={m.ui_lap_popup_title({
          current: lapNumber,
          total: totalLaps,
        })}
        actions={
          <>
            {isDesktop && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={expandCard.isExpanded ? m.ui_btn_collapse() : m.ui_btn_expand()}
                onClick={expandCard.toggle}
              >
                {expandCard.isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label={m.ui_btn_close()}
              onClick={props.onClose}
            >
              <X size={16} />
            </Button>
          </>
        }
      />

      {hasChartData && (hasHrData || hasPaceOrSpeed || hasPowerData) && (
        <div
          className={cn(
            'grid grid-cols-[84px_minmax(0,1fr)] gap-3',
            expandCard.isExpanded ? 'flex-1 min-h-0 px-4 pb-2' : 'h-[230px] px-4',
          )}
        >
          <MultiSeriesRail
            group={HOVER_GROUP}
            restHeader={m.ui_rail_lap_avg()}
            formatX={formatHoverTime}
            isKnownX={(x) => chartByTime.has(x)}
            rows={railRows}
          />
          <div className="h-full min-h-0 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                onMouseMove={(e) => {
                  if (e.activeLabel != null) onHover(Number(e.activeLabel));
                }}
                {...chartHoverHandlers(onHover)}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid.stroke} />
                <XAxis
                  dataKey="time"
                  tick={chartTheme.tick}
                  ticks={[chartData[0]?.time ?? 0, chartData[chartData.length - 1]?.time ?? 0]}
                  tickLine={false}
                  axisLine={chartTheme.axisLine}
                  tickFormatter={formatChartTime}
                />
                {(hasHrData || hasPowerData) && (
                  <YAxis
                    yAxisId="left"
                    tick={chartTheme.tick}
                    tickLine={false}
                    axisLine={false}
                    width={35}
                    tickCount={3}
                  />
                )}
                {hasPaceOrSpeed && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={chartTheme.tick}
                    tickLine={false}
                    axisLine={false}
                    width={35}
                    tickCount={3}
                    reversed={isRunning}
                    tickFormatter={isRunning ? formatPaceTick : (v: number) => `${v}`}
                  />
                )}
                <RechartsTooltip {...hoverOnlyTooltip} />
                {hasHrData && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="hr"
                    stroke={tokens.chartHr}
                    dot={false}
                    strokeWidth={1.5}
                    name={m.ui_chart_series_hr()}
                  />
                )}
                {hasPowerData && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="power"
                    stroke={tokens.chartPower}
                    dot={false}
                    strokeWidth={1.5}
                    name={m.ui_chart_series_power()}
                  />
                )}
                {isRunning && hasPaceOrSpeed && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="pace"
                    stroke={tokens.chartPace}
                    dot={false}
                    strokeWidth={1.5}
                    name={m.ui_chart_series_pace()}
                  />
                )}
                {!isRunning && hasPaceOrSpeed && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="speed"
                    stroke={tokens.chartSpeed}
                    dot={false}
                    strokeWidth={1.5}
                    name={m.ui_chart_series_speed()}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <DataTable
        data={[analysis]}
        rowKey={() => 'single'}
        fields={[
          { label: m.ui_laps_col_distance(), value: (a) => formatDistance(a.distance) },
          { label: m.ui_laps_col_time(), value: (a) => formatLapTime(a.duration) },
          {
            label: m.ui_laps_col_cadence(),
            value: (a) => `${a.avgCadence}`,
            visible: hasCadence,
            priority: 'secondary',
          },
          {
            label: m.ui_laps_col_elev(),
            value: (a) => formatElevation(a.elevationGain),
            visible: hasElevation,
            priority: 'secondary',
          },
        ]}
      />
    </MapPopupShell>
  );
};
