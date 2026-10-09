import type { SessionLap, SessionRecord, Sport } from './types.ts';
import { calculateGAP } from './normalize.ts';

export interface RecordDerivedFields {
  distance?: number;
  avgPower?: number;
  maxPower?: number;
  avgCadence?: number;
  maxSpeed?: number;
  gap?: number;
}

export const SESSION_DERIVATION_VERSION = 2;

export const isSessionOutdated = (session: { derivationVersion: number }): boolean => {
  return session.derivationVersion < SESSION_DERIVATION_VERSION;
};

export const deriveDistanceFromRecords = (records: SessionRecord[]): number | undefined => {
  for (let i = records.length - 1; i >= 0; i--) {
    const r = records[i];
    if (!r) continue;
    if (r.distance !== undefined) {
      return r.distance;
    }
  }
  return undefined;
};

export const deriveAvgFromRecords = (
  records: SessionRecord[],
  field: 'power' | 'cadence',
): number | undefined => {
  const values = records.map((r) => r[field]).filter((v): v is number => v !== undefined);
  if (values.length === 0) return undefined;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
};

export const deriveMaxFromRecords = (
  records: SessionRecord[],
  field: 'power' | 'speed',
): number | undefined => {
  const values = records.map((r) => r[field]).filter((v): v is number => v !== undefined);
  if (values.length === 0) return undefined;
  return Math.max(...values);
};

export const deriveMovingTimeFromLaps = (laps: SessionLap[]): number | undefined => {
  if (laps.length === 0) return undefined;
  return laps.reduce((sum, lap) => sum + (lap.totalMovingTime ?? lap.totalTimerTime), 0);
};

export const deriveSessionFieldsFromRecords = (
  sport: Sport,
  records: SessionRecord[],
): RecordDerivedFields => {
  let gap: number | undefined = undefined;
  if (sport === 'running') {
    gap = calculateGAP(records);
  }
  return {
    distance: deriveDistanceFromRecords(records),
    avgPower: deriveAvgFromRecords(records, 'power'),
    maxPower: deriveMaxFromRecords(records, 'power'),
    avgCadence: deriveAvgFromRecords(records, 'cadence'),
    maxSpeed: deriveMaxFromRecords(records, 'speed'),
    gap,
  };
};
