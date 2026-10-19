import type { SessionRecord, Sport } from './types.ts';
import { activeSeconds, calculateGAP } from './normalize.ts';

export interface RecordDerivedFields {
  distance?: number;
  avgPower?: number;
  avgCadence?: number;
  maxSpeed?: number;
  gap?: number;
}

export const SESSION_DERIVATION_VERSION = 4;

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

export const timeWeightedMean = (
  records: SessionRecord[],
  field: 'power' | 'cadence',
): number | undefined => {
  let weighted = 0;
  let seconds = 0;
  for (let i = 1; i < records.length; i++) {
    const previous = records[i - 1];
    const current = records[i];
    const value = current?.[field];
    if (!previous || !current || value === undefined) continue;
    const dt = activeSeconds(previous, current);
    if (dt === 0) continue;
    weighted += value * dt;
    seconds += dt;
  }
  if (seconds === 0) return undefined;
  return weighted / seconds;
};

export const deriveAvgFromRecords = (
  records: SessionRecord[],
  field: 'power' | 'cadence',
): number | undefined => {
  const mean = timeWeightedMean(records, field);
  if (mean === undefined) return undefined;
  return Math.round(mean);
};

export const deriveMaxFromRecords = (
  records: SessionRecord[],
  field: 'power' | 'speed',
): number | undefined => {
  const values = records.map((r) => r[field]).filter((v): v is number => v !== undefined);
  if (values.length === 0) return undefined;
  return Math.max(...values);
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
    avgCadence: deriveAvgFromRecords(records, 'cadence'),
    maxSpeed: deriveMaxFromRecords(records, 'speed'),
    gap,
  };
};
