import type { SessionRecord, Sport } from './types.ts';
import { activeSeconds } from './recordPairs.ts';
import { gradeAdjustedPaceFromRecords } from './normalizedEffort.ts';

interface RecordDerivedFields {
  distance?: number;
  avgPower?: number;
  avgCadence?: number;
  maxSpeed?: number;
  gap?: number;
  avgHr?: number;
  maxHr?: number;
}

export const SESSION_DERIVATION_VERSION = 5;

const gradeAdjustedPaceFor = ({
  sport,
  records,
}: {
  sport: Sport;
  records: SessionRecord[];
}): number | undefined => {
  switch (sport) {
    case 'running':
      return gradeAdjustedPaceFromRecords({ records });
    case 'cycling':
      return undefined;
  }
};

export const isSessionOutdated = (session: { derivationVersion: number }): boolean => {
  return session.derivationVersion < SESSION_DERIVATION_VERSION;
};

export const deriveDistanceFromRecords = (records: SessionRecord[]): number | undefined => {
  for (let i = records.length - 1; i >= 0; i--) {
    const record = records[i];
    if (!record) continue;
    if (record.distance !== undefined) {
      return record.distance;
    }
  }
  return undefined;
};

export const timeWeightedMean = ({
  records,
  field,
}: {
  records: SessionRecord[];
  field: 'power' | 'cadence' | 'hr';
}): number | undefined => {
  let weighted = 0;
  let durationSec = 0;
  for (let i = 1; i < records.length; i++) {
    const previous = records[i - 1];
    const current = records[i];
    const value = current?.[field];
    if (!previous || !current || value === undefined) continue;
    const elapsedSec = activeSeconds({ previous, current });
    if (elapsedSec === 0) continue;
    weighted += value * elapsedSec;
    durationSec += elapsedSec;
  }
  if (durationSec === 0) return undefined;
  return weighted / durationSec;
};

export const deriveAvgFromRecords = ({
  records,
  field,
}: {
  records: SessionRecord[];
  field: 'power' | 'cadence' | 'hr';
}): number | undefined => {
  const mean = timeWeightedMean({ records, field });
  if (mean === undefined) return undefined;
  return Math.round(mean);
};

export const deriveMaxFromRecords = ({
  records,
  field,
}: {
  records: SessionRecord[];
  field: 'power' | 'speed' | 'hr';
}): number | undefined => {
  const values = records
    .map((record) => record[field])
    .filter((value): value is number => value !== undefined);
  if (values.length === 0) return undefined;
  return Math.max(...values);
};

export const deriveSessionFieldsFromRecords = ({
  sport,
  records,
}: {
  sport: Sport;
  records: SessionRecord[];
}): RecordDerivedFields => {
  return {
    distance: deriveDistanceFromRecords(records),
    avgPower: deriveAvgFromRecords({ records, field: 'power' }),
    avgCadence: deriveAvgFromRecords({ records, field: 'cadence' }),
    maxSpeed: deriveMaxFromRecords({ records, field: 'speed' }),
    gap: gradeAdjustedPaceFor({ sport, records }),
    avgHr: deriveAvgFromRecords({ records, field: 'hr' }),
    maxHr: deriveMaxFromRecords({ records, field: 'hr' }),
  };
};
