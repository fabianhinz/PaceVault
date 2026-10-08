import type { SessionLap, SessionRecord } from '@/packages/engine/types.ts';
import { movingSeconds } from '@/lib/movingTime.ts';

export interface LapSpan {
  lapIndex: number;
  startRecord: number;
  endRecord: number;
}

export interface LapBand {
  lapIndex: number;
  from: number;
  to: number;
}

const firstRecordAtOrAfter = (records: SessionRecord[], seconds: number): number =>
  records.findIndex((record) => record.timestamp >= seconds);

export const deviceLapSpans = (records: SessionRecord[], laps: SessionLap[]): LapSpan[] => {
  const firstLap = laps[0];
  const lastRecord = records.length - 1;
  if (!firstLap || lastRecord < 0) return [];

  const sessionStartMs = firstLap.startTime;
  const spans: LapSpan[] = [];
  for (const lap of laps) {
    const startSec = (lap.startTime - sessionStartMs) / 1000;
    const endSec = (lap.endTime - sessionStartMs) / 1000;
    const startRecord = firstRecordAtOrAfter(records, startSec);
    if (startRecord < 0) continue;
    const start = records[startRecord];
    if (!start || start.timestamp >= endSec) continue;
    let endRecord = firstRecordAtOrAfter(records, endSec);
    if (endRecord < 0) {
      endRecord = lastRecord;
    }
    spans.push({ lapIndex: lap.lapIndex, startRecord, endRecord });
  }
  return spans;
};

export const lapBands = (records: SessionRecord[], spans: LapSpan[]): LapBand[] => {
  const moving = movingSeconds(records);
  const bands: LapBand[] = [];
  for (const span of spans) {
    const from = moving[span.startRecord];
    const to = moving[span.endRecord];
    if (from === undefined || to === undefined) continue;
    bands.push({ lapIndex: span.lapIndex, from: from / 60, to: to / 60 });
  }
  return bands;
};

const indexInRanges = <T extends { lapIndex: number }>(
  ranges: T[],
  value: number,
  start: (range: T) => number,
  end: (range: T) => number,
): number | undefined => {
  const last = ranges[ranges.length - 1];
  for (const range of ranges) {
    if (value < start(range)) continue;
    if (value < end(range)) return range.lapIndex;
    if (range === last && value === end(range)) return range.lapIndex;
  }
  return undefined;
};

export const lapIndexAtRecord = (spans: LapSpan[], recordIndex: number): number | undefined =>
  indexInRanges(
    spans,
    recordIndex,
    (span) => span.startRecord,
    (span) => span.endRecord,
  );

export const lapIndexAtTime = (bands: LapBand[], minutes: number): number | undefined =>
  indexInRanges(
    bands,
    minutes,
    (band) => band.from,
    (band) => band.to,
  );

export const bandsOnRows = (bands: LapBand[], xs: number[]): LapBand[] => {
  const first = xs[0];
  const last = xs[xs.length - 1];
  if (first === undefined || last === undefined) return [];
  const snapped: LapBand[] = [];
  for (const band of bands) {
    if (band.to < first || band.from > last) continue;
    const from = xs.find((x) => x >= band.from);
    const to = xs.find((x) => x >= band.to) ?? last;
    if (from === undefined) continue;
    snapped.push({ lapIndex: band.lapIndex, from, to });
  }
  return snapped;
};
