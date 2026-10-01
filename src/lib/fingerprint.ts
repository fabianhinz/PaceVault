import type { TrainingSession, Sport } from '@/packages/engine/types.ts';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface FitFileId {
  serial_number?: number;
  time_created: string | Date;
}

export interface FallbackFields {
  sport: Sport;
  date: number;
  duration: number;
  distance?: number;
}

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

export const generateFingerprint = (
  fileId: FitFileId | undefined,
  fallback: FallbackFields,
): string => {
  if (fileId?.serial_number != null) {
    let ts = new Date(fileId.time_created).getTime();
    if (fileId.time_created instanceof Date) {
      ts = fileId.time_created.getTime();
    }
    return `${fileId.serial_number}:${ts}`;
  }

  // Fallback: round duration to nearest second, distance to nearest metre
  const roundedDuration = Math.round(fallback.duration);
  let roundedDistance = '';
  if (fallback.distance !== undefined) {
    roundedDistance = `${Math.round(fallback.distance)}`;
  }
  return `${fallback.sport}:${fallback.date}:${roundedDuration}:${roundedDistance}`;
};

export const findDuplicates = (
  fingerprints: string[],
  existingSessions: TrainingSession[],
): Set<string> => {
  const existingSet = new Set<string>();
  for (const s of existingSessions) {
    if (s.fingerprint) {
      existingSet.add(s.fingerprint);
    }
  }

  const duplicates = new Set<string>();
  for (const fp of fingerprints) {
    if (existingSet.has(fp)) {
      duplicates.add(fp);
    }
  }
  return duplicates;
};
