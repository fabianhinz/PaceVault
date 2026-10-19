import type { SessionRecord, Sport } from './types.ts';
import { isMovingPair } from './normalize.ts';

export interface Climb {
  startIndex: number;
  endIndex: number;
  gain: number;
  movingSeconds: number;
  vam: number;
}

interface ClimbRules {
  enterGradient: number;
  exitGradient: number;
  minGain: number;
  minSeconds: number;
  mergeGapSeconds: number;
}

const CLIMB_RULES: Record<Sport, ClimbRules> = {
  running: {
    enterGradient: 0.15,
    exitGradient: 0.1,
    minGain: 40,
    minSeconds: 90,
    mergeGapSeconds: 120,
  },
  cycling: {
    enterGradient: 0.05,
    exitGradient: 0.03,
    minGain: 50,
    minSeconds: 120,
    mergeGapSeconds: 60,
  },
};

interface ClimbSpan {
  startIndex: number;
  endIndex: number;
  endsAtMissingElevation: boolean;
}

interface ClimbEffort {
  gain: number;
  movingSeconds: number;
}

const findSteepSpans = (
  records: SessionRecord[],
  gradients: Array<number | undefined>,
  rules: ClimbRules,
): ClimbSpan[] => {
  const spans: ClimbSpan[] = [];
  let start: number | undefined = undefined;
  let lastInside = 0;
  const close = (endsAtMissingElevation: boolean) => {
    if (start === undefined) return;
    spans.push({ startIndex: start, endIndex: lastInside, endsAtMissingElevation });
    start = undefined;
  };
  records.forEach((record, i) => {
    if (record.distance === undefined) return;
    const gradient = gradients[i];
    if (start === undefined) {
      if (gradient === undefined || gradient < rules.enterGradient) return;
      start = i;
      lastInside = i;
      return;
    }
    if (gradient === undefined) {
      close(true);
      return;
    }
    if (gradient < rules.exitGradient) {
      close(false);
      return;
    }
    lastInside = i;
  });
  close(false);
  return spans;
};

const mergeCloseSpans = (
  records: SessionRecord[],
  spans: ClimbSpan[],
  rules: ClimbRules,
): ClimbSpan[] => {
  const merged: ClimbSpan[] = [];
  for (const span of spans) {
    const last = merged[merged.length - 1];
    const lastEnd = last && records[last.endIndex];
    const nextStart = records[span.startIndex];
    if (
      last &&
      lastEnd &&
      nextStart &&
      !last.endsAtMissingElevation &&
      nextStart.timestamp - lastEnd.timestamp < rules.mergeGapSeconds
    ) {
      last.endIndex = span.endIndex;
      last.endsAtMissingElevation = span.endsAtMissingElevation;
      continue;
    }
    merged.push({ ...span });
  }
  return merged;
};

const effortBetween = (
  records: SessionRecord[],
  startIndex: number,
  endIndex: number,
): ClimbEffort => {
  let gain = 0;
  let movingSeconds = 0;
  for (let i = startIndex + 1; i <= endIndex; i++) {
    const previous = records[i - 1];
    const current = records[i];
    if (!previous || !current) continue;
    if (previous.elevation === undefined || current.elevation === undefined) continue;
    if (!isMovingPair(previous, current)) continue;
    gain += current.elevation - previous.elevation;
    movingSeconds += current.timestamp - previous.timestamp;
  }
  return { gain, movingSeconds };
};

const metresPerHour = (effort: ClimbEffort): number =>
  Math.round(((effort.gain / effort.movingSeconds) * 3600) / 10) * 10;

export const detectClimbs = (
  sport: Sport,
  records: SessionRecord[],
  gradients: Array<number | undefined>,
): Climb[] => {
  const rules = CLIMB_RULES[sport];
  const spans = mergeCloseSpans(records, findSteepSpans(records, gradients, rules), rules);
  const climbs: Climb[] = [];
  for (const span of spans) {
    const effort = effortBetween(records, span.startIndex, span.endIndex);
    if (effort.gain < rules.minGain || effort.movingSeconds < rules.minSeconds) continue;
    climbs.push({
      startIndex: span.startIndex,
      endIndex: span.endIndex,
      gain: effort.gain,
      movingSeconds: effort.movingSeconds,
      vam: metresPerHour(effort),
    });
  }
  return climbs;
};

export const climbingRate = (
  records: SessionRecord[],
  climbs: Climb[],
  startIndex: number,
  endIndex: number,
): number | undefined => {
  const total: ClimbEffort = { gain: 0, movingSeconds: 0 };
  for (const climb of climbs) {
    const from = Math.max(climb.startIndex, startIndex);
    const to = Math.min(climb.endIndex, endIndex);
    if (to <= from) continue;
    const effort = effortBetween(records, from, to);
    total.gain += effort.gain;
    total.movingSeconds += effort.movingSeconds;
  }
  if (total.movingSeconds === 0) return undefined;
  return metresPerHour(total);
};
