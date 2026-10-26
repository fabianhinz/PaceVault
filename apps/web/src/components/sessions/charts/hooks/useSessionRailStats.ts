import { useDeferredValue, useMemo } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { useMapControlsStore } from '@/store/mapControls.ts';
import {
  activeRailRange,
  computeRangeStats,
  type RangeStats,
} from '@/components/sessions/charts/railRange.ts';
import { railInt, railSigned1 } from '@/components/charts/railFormat.ts';
import type { SessionTerrain } from '@/components/charts/sessionTerrain.ts';
import type { computeRecordExtremes } from '@/components/sessions/charts/recordExtremes.ts';
import type { MetricId } from '@/components/metricLabel/explanations.ts';
import { climbingRate } from '@pacevault/engine/climbs.ts';
import type { SessionRecord, TrainingSession } from '@pacevault/engine/types.ts';

interface RailRest {
  header: string;
  value: string;
  secondary?: string;
}

interface SessionRailStats {
  stats: RangeStats;
  avgSpeedKmh: number | undefined;
  maxSpeedKmh: number | undefined;
  powerRest: RailRest;
  gradeRest: RailRest;
  gradeReadingSecondary: string;
  elevationMetricId: MetricId;
}

const sessionRangeStats = ({
  session,
  extremes,
  records,
  terrain,
}: {
  session: TrainingSession;
  extremes: ReturnType<typeof computeRecordExtremes>;
  records: SessionRecord[];
  terrain: SessionTerrain;
}): RangeStats => {
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
    avgGrade: undefined,
    avgPaceSecPerKm: session.avgPace,
    bestPaceSecPerKm: extremes.bestPaceSecPerKm,
    gapSecPerKm: session.gap,
    vam: climbingRate({
      records,
      climbs: terrain.climbs,
      startIndex: 0,
      endIndex: records.length - 1,
    }),
  };
};

const speedKmh = (speed: number | undefined): number | undefined => {
  if (speed !== undefined) return speed * 3.6;
  return undefined;
};

const powerRailRest = (stats: RangeStats): RailRest => {
  let powerRest: RailRest = {
    header: m.ui_rail_np(),
    value: railInt(stats.normalizedPower),
    secondary: `${m.ui_rail_avg()} ${railInt(stats.avgPower)}`,
  };
  if (stats.normalizedPower === undefined) {
    powerRest = { header: m.ui_rail_avg(), value: railInt(stats.avgPower) };
  }
  return powerRest;
};

const gradeRailReadings = ({
  stats,
  ranged,
}: {
  stats: RangeStats;
  ranged: boolean;
}): { rest: RailRest; readingSecondary: string } => {
  let gradeRest: RailRest = {
    header: m.ui_rail_max(),
    value: railSigned1(stats.maxGrade),
    secondary: `${m.ui_rail_min()} ${railSigned1(stats.minGrade)}`,
  };
  let gradeReadingSecondary = `${m.ui_rail_max()} ${railSigned1(stats.maxGrade)}`;
  if (ranged) {
    gradeRest = {
      header: m.ui_rail_avg(),
      value: railSigned1(stats.avgGrade),
      secondary: `${m.ui_rail_max()} ${railSigned1(stats.maxGrade)}`,
    };
    gradeReadingSecondary = `${m.ui_rail_avg()} ${railSigned1(stats.avgGrade)}`;
  }
  return { rest: gradeRest, readingSecondary: gradeReadingSecondary };
};

export const useSessionRailStats = ({
  session,
  records,
  terrain,
  extremes,
  zoomRange,
}: {
  session: TrainingSession;
  records: SessionRecord[];
  terrain: SessionTerrain;
  extremes: ReturnType<typeof computeRecordExtremes>;
  zoomRange: { from: number; to: number } | null;
}): SessionRailStats => {
  const lapBands = useDeferredValue(useMapControlsStore((s) => s.sessionLaps?.bands));
  const selectedLapIndex = useDeferredValue(useMapControlsStore((s) => s.selectedLapIndex));
  const selectedBand = lapBands?.find((band) => band.lapIndex === selectedLapIndex);
  const railRange = activeRailRange({ zoomRange, selectedLap: selectedBand });
  const railFrom = railRange?.from;
  const railTo = railRange?.to;
  const sessionStats = useMemo(
    () => sessionRangeStats({ session, extremes, records, terrain }),
    [session, extremes, records, terrain],
  );
  const stats = useMemo(() => {
    if (railFrom === undefined || railTo === undefined) return sessionStats;
    return computeRangeStats({ records, range: { from: railFrom, to: railTo }, terrain });
  }, [sessionStats, records, railFrom, railTo, terrain]);
  const grade = gradeRailReadings({ stats, ranged: railRange !== null });
  let elevationMetricId: MetricId = 'elevation';
  if (terrain.climbs.length > 0) elevationMetricId = 'vam';
  return {
    stats,
    avgSpeedKmh: speedKmh(stats.avgSpeed),
    maxSpeedKmh: speedKmh(stats.maxSpeed),
    powerRest: powerRailRest(stats),
    gradeRest: grade.rest,
    gradeReadingSecondary: grade.readingSecondary,
    elevationMetricId,
  };
};
