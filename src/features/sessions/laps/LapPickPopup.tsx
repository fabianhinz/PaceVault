import { useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
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
import { Card } from '@/components/ui/Card.tsx';
import { DataTable } from '@/components/ui/DataTable.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { SheetBackdrop } from '@/components/ui/SheetBackdrop.tsx';
import { useExpandCard } from '@/lib/hooks/useExpandCard.ts';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop.ts';
import { usePopupPosition } from '../../map/hooks/usePopupPosition.ts';
import { useDismiss } from '../../map/hooks/useDismiss.ts';
import { cn } from '@/lib/utils.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { filterRecordsByLap } from '@/lib/laps.ts';
import {
  prepareHrData,
  preparePowerData,
  prepareSpeedData,
  preparePaceData,
} from '@/lib/chartData.ts';
import {
  formatLapTime,
  formatDistance,
  formatPaceTick,
  formatPaceOrSpeed,
} from '@/lib/formatters.ts';
import { chartTheme, formatChartTime } from '@/lib/chartTheme.ts';
import { tokens } from '@/lib/tokens.ts';
import type { SessionLap, SessionRecord, Sport } from '@/packages/engine/types.ts';
import type { LapAnalysis, LapRecordEnrichment } from '@/lib/laps.ts';
import { m } from '@/paraglide/messages.js';

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

interface LapChartPoint {
  time: number;
  hr?: number;
  pace?: number;
  speed?: number;
  power?: number;
}

const buildLapChartData = (lapRecords: SessionRecord[], isRunning: boolean): LapChartPoint[] => {
  if (lapRecords.length === 0) return [];

  const byTime = new Map<number, LapChartPoint>();
  const ensure = (t: number): LapChartPoint => {
    const existing = byTime.get(t);
    if (existing) return existing;
    const point: LapChartPoint = { time: t };
    byTime.set(t, point);
    return point;
  };

  for (const p of prepareHrData(lapRecords)) ensure(p.time).hr = p.hr;
  for (const p of preparePowerData(lapRecords)) ensure(p.time).power = p.power;
  if (isRunning) {
    for (const p of preparePaceData(lapRecords)) ensure(p.time).pace = p.pace;
  } else {
    for (const p of prepareSpeedData(lapRecords)) ensure(p.time).speed = p.speed;
  }

  return [...byTime.values()].sort((a, b) => a.time - b.time);
};

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
  // On mobile the backdrop handles outside taps; pointerdown-outside would unmount
  // the backdrop mid-gesture and let the click re-open a popup on the map below.
  const popupRef = useDismiss(props.onClose, !expandCard.isExpanded, isDesktop);
  const style = usePopupPosition(props.info.x, props.info.y);
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
    return buildLapChartData(lapRecords, isRunning);
  }, [clickedLapIndex, props.records, props.laps, activeSplitDistance, isRunning]);

  if (clickedLapIndex == null || !analysis) {
    return null;
  }

  const lapNumber = clickedLapIndex + 1;
  const totalLaps = activeLapAnalysis.length;
  const hasChartData = chartData.length > 0;
  const hasHrData = chartData.some((p) => p.hr !== undefined);
  const hasPaceOrSpeed = chartData.some((p) => p.pace !== undefined || p.speed !== undefined);
  const hasPowerData = chartData.some((p) => p.power !== undefined);
  const hasPower = enrichment?.avgPower !== undefined;
  const hasCadence = analysis.avgCadence !== undefined;
  const hasElevation = analysis.elevationGain > 0;

  // Mobile: bottom sheet. Desktop: click-anchored card (sized unless expanded).
  let cardSizeClasses = '';
  if (!isDesktop) {
    cardSizeClasses = 'w-full h-[50dvh] rounded-t-2xl rounded-b-none border-x-0 border-b-0';
  } else if (!expandCard.isExpanded) {
    cardSizeClasses = 'w-[380px] max-h-[420px]';
  }

  return createPortal(
    <>
      {!isDesktop && <SheetBackdrop onClose={props.onClose} />}
      <div
        ref={popupRef}
        style={isDesktop ? style : undefined}
        className={cn(
          !isDesktop &&
            'fixed inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom duration-300',
        )}
      >
        <Card
          ref={cardRef}
          variant="compact"
          className={cn('flex flex-col overflow-hidden', cardSizeClasses)}
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
                    aria-label={expandCard.isExpanded ? 'Collapse' : 'Expand'}
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
              className={cn(expandCard.isExpanded ? 'flex-1 min-h-0 px-4 pb-2' : 'h-[200px] px-2')}
            >
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
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
                  <RechartsTooltip
                    contentStyle={chartTheme.tooltip.contentStyle}
                    labelStyle={chartTheme.tooltip.labelStyle}
                    isAnimationActive={chartTheme.tooltip.isAnimationActive}
                    separator={chartTheme.tooltip.separator}
                    labelFormatter={(v) => formatChartTime(Number(v))}
                  />
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
          )}

          <DataTable
            data={[analysis]}
            rowKey={() => 'single'}
            fields={[
              { label: m.ui_laps_col_distance(), value: (a) => formatDistance(a.distance) },
              { label: m.ui_laps_col_time(), value: (a) => formatLapTime(a.duration) },
              {
                label: isRunning ? m.ui_laps_col_pace() : m.ui_laps_col_speed(),
                value: (a) => formatPaceOrSpeed(a, isRunning),
              },
              {
                label: m.ui_laps_col_avg_hr(),
                value: (a) => `${a.avgHr}`,
                visible: analysis.avgHr !== undefined,
                priority: 'secondary',
              },
              {
                label: m.ui_laps_col_power(),
                value: () =>
                  enrichment?.avgPower !== undefined ? `${enrichment.avgPower} W` : '--',
                visible: hasPower,
                priority: 'secondary',
              },
              {
                label: m.ui_laps_col_cadence(),
                value: (a) => `${a.avgCadence}`,
                visible: hasCadence,
                priority: 'secondary',
              },
              {
                label: m.ui_laps_col_elev(),
                value: (a) => `${Math.round(a.elevationGain)} m`,
                visible: hasElevation,
                priority: 'secondary',
              },
            ]}
          />
        </Card>
      </div>
    </>,
    document.body,
  );
};
