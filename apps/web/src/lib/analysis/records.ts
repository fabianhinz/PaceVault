import type { SessionRecord, PersonalBest, PBCategory, Sport } from '@pacevault/engine/types.ts';
import { powerPerSecond } from '@pacevault/engine/normalizedEffort.ts';

/**
 * Rolling power-window durations (in seconds) used for peak-power PB detection.
 */
const POWER_WINDOWS = [
  { seconds: 5 },
  { seconds: 60 },
  { seconds: 300 },
  { seconds: 1200 },
  { seconds: 3600 },
] as const;

/**
 * Target distances (in metres) used for fastest-distance PB detection in running.
 */
const RUNNING_DISTANCES = [
  { meters: 1000 },
  { meters: 5000 },
  { meters: 10000 },
  { meters: 21097 },
  { meters: 42195 },
] as const;

/**
 * Canonical PB slot definitions keyed by sport, listing every category and window to track.
 */
export const PB_SLOTS_BY_SPORT: Record<Sport, Array<{ category: PBCategory; window: number }>> = {
  running: [
    { category: 'fastest-distance', window: 1000 },
    { category: 'fastest-distance', window: 5000 },
    { category: 'fastest-distance', window: 10000 },
    { category: 'fastest-distance', window: 21097 },
    { category: 'fastest-distance', window: 42195 },
    { category: 'longest', window: 0 },
  ],
  cycling: [
    { category: 'peak-power', window: 5 },
    { category: 'peak-power', window: 60 },
    { category: 'peak-power', window: 300 },
    { category: 'peak-power', window: 1200 },
    { category: 'peak-power', window: 3600 },
    { category: 'longest', window: 0 },
    { category: 'most-elevation', window: 0 },
  ],
};

const findPeakAverage = (values: number[], windowSize: number): number | undefined => {
  if (values.length < windowSize) return undefined;

  let windowSum = 0;
  for (let i = 0; i < windowSize; i++) {
    windowSum += values[i] ?? 0;
  }
  let maxAvg = windowSum / windowSize;

  for (let i = windowSize; i < values.length; i++) {
    windowSum += (values[i] ?? 0) - (values[i - windowSize] ?? 0);
    const avg = windowSum / windowSize;
    if (avg > maxAvg) maxAvg = avg;
  }

  return Math.round(maxAvg * 10) / 10;
};

export const extractPeakPower = (records: SessionRecord[]): Map<number, number> => {
  const seconds = powerPerSecond(records);
  const peaks = new Map<number, number>();
  for (const w of POWER_WINDOWS) {
    const peak = findPeakAverage(seconds, w.seconds);
    if (peak !== undefined) peaks.set(w.seconds, peak);
  }
  return peaks;
};

const fastestTimeFor = ({
  withDistance,
  meters,
}: {
  withDistance: SessionRecord[];
  meters: number;
}): number | undefined => {
  let bestTime = Infinity;
  let left = 0;

  for (let right = 1; right < withDistance.length; right++) {
    const rightRec = withDistance[right];
    if (!rightRec) continue;
    while (left < right) {
      const leftRec = withDistance[left];
      if (!leftRec) break;
      if ((rightRec.distance ?? 0) - (leftRec.distance ?? 0) < meters) break;
      const time = rightRec.timestamp - leftRec.timestamp;
      if (time > 0 && time < bestTime) {
        bestTime = time;
      }
      left++;
    }
  }

  if (bestTime < Infinity) return bestTime;
  return undefined;
};

/**
 * Extract the fastest elapsed time for each target distance using a two-pointer scan over cumulative distance.
 * @param records - Time-series session records with cumulative `distance` (metres) and `timestamp` (seconds) fields.
 * @param targets - Array of distance targets (in metres) to find best times for.
 * @returns Map keyed by target distance in metres, valued by fastest elapsed time in seconds; targets not covered by the data are omitted.
 */
const extractFastestDistances = ({
  records,
  targets,
}: {
  records: SessionRecord[];
  targets: ReadonlyArray<{ meters: number }>;
}): Map<number, number> => {
  const results = new Map<number, number>();

  // Need cumulative distance data
  const withDistance = records.filter((r) => r.distance !== undefined);
  if (withDistance.length < 2) return results;

  for (const target of targets) {
    const time = fastestTimeFor({ withDistance, meters: target.meters });
    if (time !== undefined) results.set(target.meters, time);
  }

  return results;
};

interface SessionPeak {
  category: PBCategory;
  window: number;
  value: number;
  higherIsBetter: boolean;
}

/**
 * Extract all measurable performance peaks from a session's records and metadata for the given sport.
 * @param sport - The sport type, which determines which peak categories are computed.
 * @param records - Time-series session records used to compute power and distance peaks.
 * @param sessionMeta - Optional session-level metadata providing total distance and elevation gain.
 * @returns Array of peaks, each carrying its category, window, raw value, and whether a higher value is better.
 */
const extractSessionPeaks = ({
  sport,
  records,
  sessionMeta,
}: {
  sport: Sport;
  records: SessionRecord[];
  sessionMeta?: { distance?: number; elevationGain?: number };
}): SessionPeak[] => {
  const peaks: SessionPeak[] = [];

  if (sport === 'cycling') {
    const powerPeaks = extractPeakPower(records);
    for (const [seconds, value] of powerPeaks) {
      if (value <= 0) continue;
      peaks.push({ category: 'peak-power', window: seconds, value, higherIsBetter: true });
    }
  }

  if (sport === 'running') {
    const distances = extractFastestDistances({ records, targets: RUNNING_DISTANCES });
    for (const [meters, time] of distances) {
      peaks.push({
        category: 'fastest-distance',
        window: meters,
        value: time,
        higherIsBetter: false,
      });
    }
  }

  if (sessionMeta) {
    if (sessionMeta.distance !== undefined && sessionMeta.distance > 0) {
      peaks.push({
        category: 'longest',
        window: 0,
        value: sessionMeta.distance,
        higherIsBetter: true,
      });
    }
    if (sport === 'cycling' && sessionMeta.elevationGain && sessionMeta.elevationGain > 0) {
      peaks.push({
        category: 'most-elevation',
        window: 0,
        value: sessionMeta.elevationGain,
        higherIsBetter: true,
      });
    }
  }

  return peaks;
};

/**
 * Group personal bests by sport for per-sport display in dashboard cards.
 * @param pbs - Flat array of personal bests spanning any number of sports.
 * @returns Partial record mapping each sport to its corresponding array of personal bests.
 */
export const groupPBsBySport = (pbs: PersonalBest[]): Partial<Record<Sport, PersonalBest[]>> => {
  const grouped: Partial<Record<Sport, PersonalBest[]>> = {};
  for (const pb of pbs) {
    const existing = grouped[pb.sport];
    if (existing) {
      existing.push(pb);
    } else {
      grouped[pb.sport] = [pb];
    }
  }
  return grouped;
};

interface PBSessionInput {
  sessionId: string;
  date: number;
  sport: Sport;
  records: SessionRecord[];
  distance?: number;
  elevationGain?: number;
}

const isSameSlot = (a: PersonalBest, b: PersonalBest): boolean =>
  a.sport === b.sport && a.category === b.category && a.window === b.window;

/**
 * Compute the all-time personal bests across an arbitrary collection of sessions for all sports.
 * @param sessions - Array of session descriptors, each carrying its id, date, sport, time-series records, and optional distance/elevation metadata.
 * @param existing - Personal bests to start from; a session only replaces one it beats.
 * @returns Flat array of personal bests — one entry per unique sport+category+window combination — reflecting the best value seen across all sessions.
 */
export const computePBsForSessions = ({
  sessions,
  existing = [],
}: {
  sessions: PBSessionInput[];
  existing?: PersonalBest[];
}): PersonalBest[] => {
  const bests = [...existing];

  for (const session of sessions) {
    const peaks = extractSessionPeaks({
      sport: session.sport,
      records: session.records,
      sessionMeta: {
        distance: session.distance,
        elevationGain: session.elevationGain,
      },
    });

    for (const peak of peaks) {
      const pb: PersonalBest = {
        sport: session.sport,
        category: peak.category,
        window: peak.window,
        value: peak.value,
        sessionId: session.sessionId,
        date: session.date,
      };
      const index = bests.findIndex((best) => isSameSlot(best, pb));
      const current = bests[index];
      let better = !current || pb.value < current.value;
      if (peak.higherIsBetter) {
        better = !current || pb.value > current.value;
      }
      if (!better) continue;
      if (current) {
        bests[index] = pb;
      } else {
        bests.push(pb);
      }
    }
  }

  return bests;
};
