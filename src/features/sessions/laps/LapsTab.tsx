import { useCallback, useEffect, useMemo } from 'react';
import { Timer, Heart, Zap } from 'lucide-react';
import { ChartPreviewCard } from '@/components/ui/ChartPreviewCard.tsx';
import { analyzeLaps, enrichAllLaps } from '@/lib/laps.ts';
import type { LapAnalysis, LapRecordEnrichment } from '@/lib/laps.ts';
import { computeDynamicLaps } from '@/lib/dynamicLaps.ts';
import { computeLapMarkers } from '@/lib/lapMarkers.ts';
import type { LapMarkerMode } from '@/lib/lapMarkers.ts';
import { useLapOptionsStore } from '@/store/lapOptions.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useChartHoverStore, type ChartHoverX } from '@/store/chartHover.ts';
import { indexByX } from '@/lib/chartHover.ts';
import { summarizeValues } from '@/lib/seriesSummary.ts';
import { railFixed1, railInt, railPaceFromSecPerKm } from '@/lib/railFormat.ts';
import { SeriesRail } from '@/components/charts/ChartRail.tsx';
import { prepareLapSplitsData, prepareLapHrData, prepareLapPowerData } from '@/lib/lapChartData.ts';
import { tokens } from '@/lib/tokens.ts';
import { LapSplitsChart } from './LapSplitsChart.tsx';
import { LapHrChart } from './LapHrChart.tsx';
import { LapPowerChart } from './LapPowerChart.tsx';
import { LapDetailTable } from './LapDetailTable.tsx';
import { SplitDistanceCard } from './SplitDistanceCard.tsx';
import type { SessionLap, SessionRecord, TrainingSession } from '@/packages/engine/types.ts';
import { m } from '@/paraglide/messages.js';

interface LapsTabProps {
  laps: SessionLap[];
  session: TrainingSession;
  records: SessionRecord[];
}

const SYNC_ID = 'laps-detail';

const formatLapX = (x: ChartHoverX) => m.ui_lap_label({ number: String(Number(x) + 1) });
const EMPTY_ANALYSIS: LapAnalysis[] = [];
const EMPTY_ENRICHMENTS: LapRecordEnrichment[] = [];

export const LapsTab = (props: LapsTabProps) => {
  const isRunning = props.session.sport === 'running';
  const sport = props.session.sport;

  const isDevice = useLapOptionsStore((s) => s.isDevice);
  const splitDistance = useLapOptionsStore((s) => s.customDistance[sport]);

  const deviceAnalysis = useMemo(() => analyzeLaps(props.laps), [props.laps]);
  const deviceEnrichments = useMemo(
    () => enrichAllLaps(props.laps, props.records),
    [props.laps, props.records],
  );

  const dynamicResult = useMemo(
    () => (isDevice ? undefined : computeDynamicLaps(props.records, splitDistance)),
    [props.records, splitDistance, isDevice],
  );

  const analysis = useMemo(
    () => (isDevice ? deviceAnalysis : (dynamicResult?.analysis ?? EMPTY_ANALYSIS)),
    [isDevice, deviceAnalysis, dynamicResult],
  );
  const enrichments = useMemo(
    () => (isDevice ? deviceEnrichments : (dynamicResult?.enrichments ?? EMPTY_ENRICHMENTS)),
    [isDevice, deviceEnrichments, dynamicResult],
  );

  const enrichmentMap = useMemo(
    () => new Map<number, LapRecordEnrichment>(enrichments.map((e) => [e.lapIndex, e])),
    [enrichments],
  );
  const splitsData = useMemo(
    () => prepareLapSplitsData(analysis, enrichments),
    [analysis, enrichments],
  );
  const hrData = useMemo(() => prepareLapHrData(analysis, enrichments), [analysis, enrichments]);
  const powerData = useMemo(() => prepareLapPowerData(enrichments), [enrichments]);

  useEffect(() => {
    useMapFocusStore
      .getState()
      .setActiveLapData(analysis, enrichments, isDevice ? null : splitDistance);
  }, [analysis, enrichments, isDevice, splitDistance]);

  const handleActiveLapChange = useCallback((lapIndex: number | null) => {
    if (lapIndex != null) {
      useMapFocusStore.getState().setHoveredLapIndex(lapIndex);
      useChartHoverStore.getState().setChartHover(SYNC_ID, lapIndex);
    } else {
      useMapFocusStore.getState().clearHoveredLapIndex();
      useChartHoverStore.getState().clearChartHover(SYNC_ID);
    }
  }, []);

  useEffect(() => () => useChartHoverStore.getState().clearChartHover(SYNC_ID), []);

  const hrByLap = useMemo(() => indexByX(hrData, 'lapIndex'), [hrData]);
  const powerByLap = useMemo(() => indexByX(powerData, 'lapIndex'), [powerData]);
  const splitsByLap = useMemo(() => indexByX(splitsData, 'lapIndex'), [splitsData]);
  const hrSummary = useMemo(() => summarizeValues(hrData.map((d) => d.avgHr)), [hrData]);
  const powerSummary = useMemo(
    () => summarizeValues(powerData.map((d) => d.avgPower)),
    [powerData],
  );
  const splitsSummary = useMemo(
    () => summarizeValues(splitsData.map((d) => (isRunning ? d.pace : d.speed))),
    [splitsData, isRunning],
  );

  let splitsBest = splitsSummary.max;
  let formatSplit = (v: number | undefined) => railFixed1(v);
  if (isRunning) {
    splitsBest = splitsSummary.min;
    formatSplit = (v: number | undefined) => railPaceFromSecPerKm(v);
  }

  const markerMode = useMemo((): LapMarkerMode | undefined => {
    if (isDevice) {
      const firstLap = props.laps[0];
      if (!firstLap) return undefined;
      return {
        kind: 'device',
        laps: props.laps,
        sessionStartMs: firstLap.startTime,
      };
    }
    return {
      kind: 'dynamic',
      splitDistanceMetres: splitDistance,
    };
  }, [props.laps, splitDistance, isDevice]);

  useEffect(() => {
    if (markerMode) {
      const markers = computeLapMarkers(props.records, markerMode);
      useMapFocusStore.getState().setLapMarkers(markers);
    } else {
      useMapFocusStore.getState().clearLapMarkers();
    }
    return () => {
      useMapFocusStore.getState().clearLapMarkers();
      useMapFocusStore.getState().clearHoveredLapIndex();
    };
  }, [props.records, markerMode]);

  return (
    <div className="space-y-3">
      <SplitDistanceCard
        sport={sport}
        maxKm={Math.max(1, Math.ceil((props.session.distance ?? 0) / 1000))}
        isDevice={isDevice}
        splitDistance={splitDistance}
        onDeviceToggle={(checked) => useLapOptionsStore.getState().setIsDevice(checked)}
        onSplitDistanceChange={(distance) =>
          useLapOptionsStore.getState().setCustomDistance(sport, distance)
        }
      />

      {hrData.length > 0 && (
        <ChartPreviewCard
          title={m.ui_laps_hr_chart_title()}
          icon={Heart}
          color={tokens.chartHr}
          metricId="avgHr"
          rail={
            <SeriesRail
              group={SYNC_ID}
              unit="bpm"
              formatX={formatLapX}
              rest={{
                header: m.ui_rail_avg(),
                value: railInt(hrSummary.avg),
                secondary: `${m.ui_rail_max()} ${railInt(hrSummary.max)}`,
              }}
              readingAt={(x) => {
                const point = hrByLap.get(x);
                if (!point) return undefined;
                return { value: railInt(point.avgHr), secondary: `${point.minHr}–${point.maxHr}` };
              }}
            />
          }
        >
          {(mode) => (
            <LapHrChart
              data={hrData}
              mode={mode}
              syncId={SYNC_ID}
              onActiveLapChange={handleActiveLapChange}
            />
          )}
        </ChartPreviewCard>
      )}

      {powerData.length > 0 && (
        <ChartPreviewCard
          title={m.ui_laps_power_chart_title()}
          icon={Zap}
          color={tokens.chartPower}
          metricId="avgPower"
          rail={
            <SeriesRail
              group={SYNC_ID}
              unit="W"
              formatX={formatLapX}
              rest={{
                header: m.ui_rail_avg(),
                value: railInt(powerSummary.avg),
                secondary: `${m.ui_rail_max()} ${railInt(powerSummary.max)}`,
              }}
              readingAt={(x) => {
                const point = powerByLap.get(x);
                if (!point) return undefined;
                return {
                  value: railInt(point.avgPower),
                  secondary: `${point.minPower}–${point.maxPower}`,
                };
              }}
            />
          }
        >
          {(mode) => (
            <LapPowerChart
              data={powerData}
              mode={mode}
              syncId={SYNC_ID}
              onActiveLapChange={handleActiveLapChange}
            />
          )}
        </ChartPreviewCard>
      )}

      {splitsData.length > 0 && (
        <ChartPreviewCard
          title={isRunning ? m.ui_laps_pace_chart_title() : m.ui_laps_speed_chart_title()}
          icon={Timer}
          color={isRunning ? tokens.chartPace : tokens.chartSpeed}
          metricId={isRunning ? 'avgPace' : 'avgSpeed'}
          rail={
            <SeriesRail
              group={SYNC_ID}
              unit={isRunning ? '/km' : 'km/h'}
              formatX={formatLapX}
              rest={{
                header: m.ui_rail_avg(),
                value: formatSplit(splitsSummary.avg),
                secondary: `${m.ui_rail_best()} ${formatSplit(splitsBest)}`,
              }}
              readingAt={(x) => {
                const point = splitsByLap.get(x);
                if (!point) return undefined;
                if (isRunning) {
                  return {
                    value: formatSplit(point.pace),
                    secondary:
                      point.minPace !== undefined
                        ? `${formatSplit(point.maxPace)}–${formatSplit(point.minPace)}`
                        : undefined,
                  };
                }
                return {
                  value: formatSplit(point.speed),
                  secondary:
                    point.minSpeed !== undefined
                      ? `${formatSplit(point.minSpeed)}–${formatSplit(point.maxSpeed)}`
                      : undefined,
                };
              }}
            />
          }
        >
          {(mode) => (
            <LapSplitsChart
              data={splitsData}
              mode={mode}
              isRunning={isRunning}
              syncId={SYNC_ID}
              onActiveLapChange={handleActiveLapChange}
            />
          )}
        </ChartPreviewCard>
      )}

      <LapDetailTable laps={analysis} isRunning={isRunning} enrichments={enrichmentMap} />
    </div>
  );
};
