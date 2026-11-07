import { windowedGradients } from '@pacevault/engine/gradient.ts';
import { gradeAdjustedPaceFactor } from '@pacevault/engine/normalizedEffort.ts';
import { stepsPerMinute } from '@pacevault/engine/cadence.ts';
import type { SessionRecord } from '@pacevault/engine/types.ts';
import type { StoredSegmentPass } from '@/lib/workers/segmentsContract.ts';
import { movingClock, movingSecondsAt } from '@/lib/analysis/movingTime.ts';

export const SEGMENT_CHANNELS = [
  'hr',
  'power',
  'speed',
  'pace',
  'gap',
  'elevation',
  'grade',
  'cadence',
] as const;

export type SegmentChannel = (typeof SEGMENT_CHANNELS)[number];

export interface PassSeries {
  movingSec: number[];
  positions: Array<[number, number] | null>;
  values: Record<SegmentChannel, Array<number | null>>;
}

interface SegmentChartRow {
  movingSec: number;
  selected: number | null;
  best: number | null;
}

const MAX_ROWS = 1500;
const METERS_PER_KM = 1000;
export const SECONDS_PER_MINUTE = 60;
const MPS_TO_KMH = 3.6;

type ChannelAccessor = (input: {
  record: SessionRecord;
  gradient: number | undefined;
  running: boolean;
}) => number | undefined;

const paceMinPerKm = (speed: number | undefined): number | undefined => {
  if (speed === undefined || speed <= 0) return undefined;
  return METERS_PER_KM / speed / SECONDS_PER_MINUTE;
};

const ACCESSOR_BY_SEGMENT_CHANNEL: Record<SegmentChannel, ChannelAccessor> = {
  hr: (input) => input.record.hr,
  power: (input) => input.record.power,
  speed: (input) => {
    if (input.record.speed === undefined) return undefined;
    return input.record.speed * MPS_TO_KMH;
  },
  pace: (input) => {
    if (!input.running) return undefined;
    return paceMinPerKm(input.record.speed);
  },
  gap: (input) => {
    const pace = paceMinPerKm(input.record.speed);
    if (!input.running || pace === undefined || input.gradient === undefined) return undefined;
    return pace / gradeAdjustedPaceFactor(input.gradient);
  },
  elevation: (input) => input.record.elevation,
  grade: (input) => {
    if (input.gradient === undefined) return undefined;
    return input.gradient * 100;
  },
  cadence: (input) => {
    if (input.record.cadence === undefined || !input.running) return input.record.cadence;
    return stepsPerMinute(input.record.cadence);
  },
};

const orNull = (value: number | undefined): number | null => {
  if (value === undefined) return null;
  return value;
};

const positionOf = (record: SessionRecord): [number, number] | null => {
  if (record.lat === undefined || record.lng === undefined) return null;
  return [record.lat, record.lng];
};

export const passSeries = ({
  records,
  pass,
  running,
}: {
  records: SessionRecord[];
  pass: StoredSegmentPass;
  running: boolean;
}): PassSeries => {
  const clock = movingClock(records);
  const startMovingSec = movingSecondsAt({ clock, timestampSec: pass.startTimestampSec });
  const spanned = records.flatMap((record, i) => {
    const movingSec = clock.movingSec[i];
    if (startMovingSec === undefined || movingSec === undefined) return [];
    if (record.timestamp < pass.startTimestampSec || record.timestamp > pass.endTimestampSec)
      return [];
    return [{ record, movingSec: movingSec - startMovingSec }];
  });
  const sliced = spanned.map((entry) => entry.record);
  const gradients = windowedGradients(sliced);
  const channelValues = (channel: SegmentChannel) =>
    sliced.map((record, i) =>
      orNull(ACCESSOR_BY_SEGMENT_CHANNEL[channel]({ record, gradient: gradients[i], running })),
    );
  return {
    movingSec: spanned.map((entry) => entry.movingSec),
    positions: sliced.map(positionOf),
    values: {
      hr: channelValues('hr'),
      power: channelValues('power'),
      speed: channelValues('speed'),
      pace: channelValues('pace'),
      gap: channelValues('gap'),
      elevation: channelValues('elevation'),
      grade: channelValues('grade'),
      cadence: channelValues('cadence'),
    },
  };
};

const neighbourIndex = ({ series, movingSec }: { series: PassSeries; movingSec: number }) =>
  series.movingSec.findIndex((candidate) => candidate >= movingSec);

export const valueAtMovingSec = ({
  series,
  channel,
  movingSec,
}: {
  series: PassSeries;
  channel: SegmentChannel;
  movingSec: number;
}): number | null => {
  const after = neighbourIndex({ series, movingSec });
  if (after < 0) return null;
  const values = series.values[channel];
  const afterValue = values[after] ?? null;
  const afterSec = series.movingSec[after];
  if (after === 0 || afterSec === movingSec) return afterValue;
  const beforeValue = values[after - 1] ?? null;
  const beforeSec = series.movingSec[after - 1];
  if (beforeValue === null || afterValue === null) return null;
  if (beforeSec === undefined || afterSec === undefined || afterSec === beforeSec)
    return afterValue;
  return (
    beforeValue + ((afterValue - beforeValue) * (movingSec - beforeSec)) / (afterSec - beforeSec)
  );
};

export const positionAtMovingSec = ({
  series,
  movingSec,
}: {
  series: PassSeries;
  movingSec: number;
}): [number, number] | null => {
  const after = neighbourIndex({ series, movingSec });
  if (after < 0) return series.positions[series.positions.length - 1] ?? null;
  return series.positions[after] ?? null;
};

export const hasChannelValues = ({
  series,
  channel,
}: {
  series: PassSeries | undefined;
  channel: SegmentChannel;
}): boolean => series !== undefined && series.values[channel].some((value) => value !== null);

const sampled = (rows: SegmentChartRow[]): SegmentChartRow[] => {
  if (rows.length <= MAX_ROWS) return rows;
  const stride = Math.ceil(rows.length / MAX_ROWS);
  return rows.filter((_, i) => i % stride === 0 || i === rows.length - 1);
};

export const segmentChartRows = ({
  selected,
  best,
  channel,
}: {
  selected: PassSeries;
  best: PassSeries | undefined;
  channel: SegmentChannel;
}): SegmentChartRow[] => {
  const rows: SegmentChartRow[] = selected.movingSec.map((movingSec, i) => {
    let bestValue: number | null = null;
    if (best !== undefined) bestValue = valueAtMovingSec({ series: best, channel, movingSec });
    return { movingSec, selected: selected.values[channel][i] ?? null, best: bestValue };
  });
  if (best !== undefined) {
    best.movingSec.forEach((movingSec, i) => {
      rows.push({
        movingSec,
        selected: valueAtMovingSec({ series: selected, channel, movingSec }),
        best: best.values[channel][i] ?? null,
      });
    });
  }
  return sampled(rows.sort((a, b) => a.movingSec - b.movingSec));
};
