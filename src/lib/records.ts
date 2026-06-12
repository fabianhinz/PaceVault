import type { SessionRecord, PersonalBest, PBCategory, Sport } from '@/packages/engine/types.ts';

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
export const PB_SLOTS: Record<Sport, Array<{ category: PBCategory; window: number }>> = {
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

/**
 * Find peak average value over a rolling window.
 * Returns the maximum average value found for the given window size.
 */
const findPeakAverage = (values: number[], windowSize: number): number => {
  if (values.length < windowSize) return 0;

  let maxAvg = 0;
  let windowSum = 0;

  for (let i = 0; i < windowSize; i++) {
    windowSum += values[i] ?? 0;
  }
  maxAvg = windowSum / windowSize;

  for (let i = windowSize; i < values.length; i++) {
    windowSum += (values[i] ?? 0) - (values[i - windowSize] ?? 0);
    const avg = windowSum / windowSize;
    if (avg > maxAvg) maxAvg = avg;
  }

  return Math.round(maxAvg * 10) / 10;
};

/**
 * Extract peak average power for each standard duration window from a session's records.
 * @param records - Time-series session records, each optionally containing a `power` field in watts.
 * @returns Map keyed by window duration in seconds, valued by peak average power in watts; windows with no data are omitted.
 */
const extractPeakPower = (records: SessionRecord[]): Map<number, number> => {
  const powerData = records
    .map((r) => r.power)
    .filter((p): p is number => p !== undefined && p > 0);

  const peaks = new Map<number, number>();
  for (const w of POWER_WINDOWS) {
    const peak = findPeakAverage(powerData, w.seconds);
    if (peak > 0) {
      peaks.set(w.seconds, peak);
    }
  }

  return peaks;
};

/**
 * Extract the fastest elapsed time for each target distance using a two-pointer scan over cumulative distance.
 * @param records - Time-series session records with cumulative `distance` (metres) and `timestamp` (seconds) fields.
 * @param targets - Array of distance targets (in metres) to find best times for.
 * @returns Map keyed by target distance in metres, valued by fastest elapsed time in seconds; targets not covered by the data are omitted.
 */
const extractFastestDistances = (
  records: SessionRecord[],
  targets: ReadonlyArray<{ meters: number }>,
): Map<number, number> => {
  const results = new Map<number, number>();

  // Need cumulative distance data
  const withDistance = records.filter((r) => r.distance !== undefined && r.distance > 0);
  if (withDistance.length < 2) return results;

  for (const target of targets) {
    let bestTime = Infinity;
    let left = 0;

    for (let right = 1; right < withDistance.length; right++) {
      const rightRec = withDistance[right];
      if (!rightRec) continue;
      while (left < right) {
        const leftRec = withDistance[left];
        if (!leftRec) break;
        if ((rightRec.distance ?? 0) - (leftRec.distance ?? 0) < target.meters) break;
        const time = rightRec.timestamp - leftRec.timestamp;
        if (time > 0 && time < bestTime) {
          bestTime = time;
        }
        left++;
      }
    }

    if (bestTime < Infinity) {
      results.set(target.meters, bestTime);
    }
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
const extractSessionPeaks = (
  sport: Sport,
  records: SessionRecord[],
  sessionMeta?: { distance: number; elevationGain?: number },
): SessionPeak[] => {
  const peaks: SessionPeak[] = [];

  if (sport === 'cycling') {
    const powerPeaks = extractPeakPower(records);
    for (const [seconds, value] of powerPeaks) {
      peaks.push({ category: 'peak-power', window: seconds, value, higherIsBetter: true });
    }
  }

  if (sport === 'running') {
    const distances = extractFastestDistances(records, RUNNING_DISTANCES);
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
    if (sessionMeta.distance > 0) {
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
 * Compare a single session's peaks against existing personal bests and return any that set a new all-time record.
 * @param sessionId - Unique identifier of the session being evaluated.
 * @param sessionDate - Unix timestamp (milliseconds) of the session.
 * @param sport - Sport type of the session.
 * @param records - Time-series session records used to derive peaks.
 * @param existingBests - Current personal bests to compare against.
 * @param sessionMeta - Optional session-level metadata providing total distance and elevation gain.
 * @returns Array of `PersonalBest` entries that beat the corresponding existing best; empty when no improvement is found.
 */
export const detectNewPBs = (
  sessionId: string,
  sessionDate: number,
  sport: Sport,
  records: SessionRecord[],
  existingBests: PersonalBest[],
  sessionMeta?: { distance: number; elevationGain?: number },
): PersonalBest[] => {
  const peaks = extractSessionPeaks(sport, records, sessionMeta);
  const newPBs: PersonalBest[] = [];

  for (const peak of peaks) {
    const existing = existingBests.find(
      (pb) => pb.sport === sport && pb.category === peak.category && pb.window === peak.window,
    );
    let isBetter = !existing || peak.value < existing.value;
    if (peak.higherIsBetter) {
      isBetter = !existing || peak.value > existing.value;
    }
    if (isBetter) {
      newPBs.push({
        sport,
        category: peak.category,
        window: peak.window,
        value: peak.value,
        sessionId,
        date: sessionDate,
      });
    }
  }

  return newPBs;
};

/**
 * Merge incoming personal bests into an existing array, replacing entries with the same sport+category+window key.
 * @param existing - Current array of personal bests to merge into.
 * @param incoming - New personal bests to apply; each replaces a matching entry or is appended if none exists.
 * @returns New array containing the merged personal bests.
 */
export const mergePBs = (existing: PersonalBest[], incoming: PersonalBest[]): PersonalBest[] => {
  const merged = [...existing];
  for (const nb of incoming) {
    const idx = merged.findIndex(
      (pb) => pb.sport === nb.sport && pb.category === nb.category && pb.window === nb.window,
    );
    if (idx >= 0) {
      merged[idx] = nb;
    } else {
      merged.push(nb);
    }
  }
  return merged;
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

/**
 * Compute the all-time personal bests across an arbitrary collection of sessions for all sports.
 * @param sessions - Array of session descriptors, each carrying its id, date, sport, time-series records, and optional distance/elevation metadata.
 * @returns Flat array of personal bests — one entry per unique sport+category+window combination — reflecting the best value seen across all sessions.
 */
export const computePBsForSessions = (
  sessions: Array<{
    sessionId: string;
    date: number;
    sport: Sport;
    records: SessionRecord[];
    distance?: number;
    elevationGain?: number;
  }>,
): PersonalBest[] => {
  const bestByKey = new Map<string, PersonalBest>();

  for (const session of sessions) {
    let sessionMeta: { distance: number; elevationGain?: number } | undefined = undefined;
    if (session.distance !== undefined || session.elevationGain !== undefined) {
      sessionMeta = { distance: session.distance ?? 0, elevationGain: session.elevationGain };
    }
    const peaks = extractSessionPeaks(session.sport, session.records, sessionMeta);

    for (const peak of peaks) {
      const key = `${session.sport}:${peak.category}:${peak.window}`;
      const pb: PersonalBest = {
        sport: session.sport,
        category: peak.category,
        window: peak.window,
        value: peak.value,
        sessionId: session.sessionId,
        date: session.date,
      };
      const existing = bestByKey.get(key);
      let isBetter = !existing || pb.value < existing.value;
      if (peak.higherIsBetter) {
        isBetter = !existing || pb.value > existing.value;
      }
      if (isBetter) {
        bestByKey.set(key, pb);
      }
    }
  }

  return [...bestByKey.values()];
};
