import type { SessionRecord } from '@pacevault/engine/types.ts';
import {
  gradeAdjustedPaceFromRecords,
  normalizedPowerFromRecords,
} from '@pacevault/engine/normalizedEffort.ts';
import { climbingRate } from '@pacevault/engine/climbs.ts';
import { averageGradient } from '@pacevault/engine/gradient.ts';
import { timeWeightedMean } from '@pacevault/engine/sessionDerivation.ts';
import { movingSeconds } from './movingTime.ts';
import { summarizeValues } from './seriesSummary.ts';
import type { SessionTerrain } from './sessionTerrain.ts';
import type { LapBand } from './laps.ts';

interface RailRange {
  from: number;
  to: number;
}

export interface RangeStats {
  avgHr: number | undefined;
  maxHr: number | undefined;
  avgPower: number | undefined;
  normalizedPower: number | undefined;
  avgSpeed: number | undefined;
  maxSpeed: number | undefined;
  avgCadence: number | undefined;
  maxCadence: number | undefined;
  elevationGain: number | undefined;
  elevationLoss: number | undefined;
  maxGrade: number | undefined;
  minGrade: number | undefined;
  avgGrade: number | undefined;
  avgPaceSecPerKm: number | undefined;
  bestPaceSecPerKm: number | undefined;
  gapSecPerKm: number | undefined;
  vam: number | undefined;
}

export const activeRailRange = ({
  zoomRange,
  selectedLap,
}: {
  zoomRange: RailRange | null;
  selectedLap: LapBand | undefined;
}): RailRange | null => {
  if (zoomRange) return zoomRange;
  if (selectedLap) return { from: selectedLap.from, to: selectedLap.to };
  return null;
};

const elevationChange = (records: SessionRecord[]) => {
  let gain: number | undefined = undefined;
  let loss: number | undefined = undefined;
  let previous: number | undefined = undefined;
  for (const record of records) {
    if (record.elevation === undefined) continue;
    if (previous !== undefined) {
      const delta = record.elevation - previous;
      gain = (gain ?? 0) + Math.max(delta, 0);
      loss = (loss ?? 0) + Math.max(-delta, 0);
    }
    previous = record.elevation;
  }
  return { gain, loss };
};

const averageSpeed = ({
  records,
  moving,
}: {
  records: SessionRecord[];
  moving: number[];
}): number | undefined => {
  const withDistance = records.flatMap((record, i) => {
    if (record.distance === undefined) return [];
    return [{ distance: record.distance, moving: moving[i] ?? 0 }];
  });
  const first = withDistance[0];
  const last = withDistance[withDistance.length - 1];
  if (first && last && last.moving > first.moving) {
    return (last.distance - first.distance) / (last.moving - first.moving);
  }
  return summarizeValues(records.map((r) => r.speed)).avg;
};

const paceOf = (speed: number | undefined): number | undefined => {
  if (speed === undefined || speed <= 0) return undefined;
  return 1000 / speed;
};

interface RecordsInRange {
  inRange: SessionRecord[];
  gradients: Array<number | undefined>;
  moving: number[];
  firstIndex: number | undefined;
  lastIndex: number | undefined;
}

const recordsInRange = ({
  records,
  range,
  terrain,
  allMoving,
}: {
  records: SessionRecord[];
  range: RailRange;
  terrain: SessionTerrain;
  allMoving: number[];
}): RecordsInRange => {
  const inRange: SessionRecord[] = [];
  const gradients: Array<number | undefined> = [];
  const moving: number[] = [];
  let firstIndex: number | undefined = undefined;
  let lastIndex: number | undefined = undefined;
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const seconds = allMoving[i] ?? 0;
    const minutes = seconds / 60;
    if (!record || minutes < range.from || minutes > range.to) continue;
    firstIndex ??= i;
    lastIndex = i;
    inRange.push(record);
    gradients.push(terrain.gradients[i]);
    moving.push(seconds);
  }
  return { inRange, gradients, moving, firstIndex, lastIndex };
};

const rangeClimb = ({
  records,
  terrain,
  firstIndex,
  lastIndex,
}: {
  records: SessionRecord[];
  terrain: SessionTerrain;
  firstIndex: number | undefined;
  lastIndex: number | undefined;
}): { vam: number | undefined; avgGrade: number | undefined } => {
  let vam: number | undefined = undefined;
  let avgGrade: number | undefined = undefined;
  if (firstIndex !== undefined && lastIndex !== undefined) {
    vam = climbingRate({
      records,
      climbs: terrain.climbs,
      startIndex: firstIndex,
      endIndex: lastIndex,
    });
    const average = averageGradient({
      points: records,
      startIndex: firstIndex,
      endIndex: lastIndex,
    });
    if (average !== undefined) avgGrade = average * 100;
  }
  return { vam, avgGrade };
};

export const computeRangeStats = ({
  records,
  range,
  terrain,
}: {
  records: SessionRecord[];
  range: RailRange;
  terrain: SessionTerrain;
}): RangeStats => {
  const allMoving = movingSeconds(records);
  const selection = recordsInRange({ records, range, terrain, allMoving });
  const inRange = selection.inRange;
  const gradients = selection.gradients;
  const climb = rangeClimb({
    records,
    terrain,
    firstIndex: selection.firstIndex,
    lastIndex: selection.lastIndex,
  });

  const hr = summarizeValues(inRange.map((r) => r.hr));
  const speed = summarizeValues(inRange.map((r) => r.speed));
  const cadence = summarizeValues(inRange.map((r) => r.cadence));
  const grade = summarizeValues(
    gradients.map((gradient) => {
      if (gradient === undefined) return undefined;
      return gradient * 100;
    }),
  );
  const elevation = elevationChange(inRange);
  const avgSpeed = averageSpeed({ records: inRange, moving: selection.moving });

  return {
    avgHr: hr.avg,
    maxHr: hr.max,
    avgPower: timeWeightedMean({ records: inRange, field: 'power' }),
    normalizedPower: normalizedPowerFromRecords(inRange),
    avgSpeed,
    maxSpeed: speed.max,
    avgCadence: timeWeightedMean({ records: inRange, field: 'cadence' }),
    maxCadence: cadence.max,
    elevationGain: elevation.gain,
    elevationLoss: elevation.loss,
    maxGrade: grade.max,
    minGrade: grade.min,
    avgGrade: climb.avgGrade,
    avgPaceSecPerKm: paceOf(avgSpeed),
    bestPaceSecPerKm: paceOf(speed.max),
    gapSecPerKm: gradeAdjustedPaceFromRecords({ records: inRange, gradients }),
    vam: climb.vam,
  };
};
